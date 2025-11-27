/**
 * Script para copiar los assets del webapp Flask al directorio dist para Capacitor
 * Este script sincroniza los archivos estáticos y templates renderizados
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(__dirname, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function build() {
  console.log('🔨 Building Tzotzil Bible App for Capacitor...\n');
  
  ensureDir(DIST_DIR);
  
  console.log('📁 Copying static assets...');
  copyDir(path.join(SOURCE_DIR, 'static'), path.join(DIST_DIR, 'static'));
  
  console.log('📄 Copying service worker...');
  fs.copyFileSync(
    path.join(SOURCE_DIR, 'service-worker.js'),
    path.join(DIST_DIR, 'service-worker.js')
  );
  
  console.log('📋 Creating index.html with offline loader...');
  const indexHtml = `<!DOCTYPE html>
<html lang="es" data-bs-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <meta name="theme-color" content="#0f3460">
    <meta name="description" content="Biblia bilingüe Español/Tzotzil con IA Nevin">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' https: data: blob: 'unsafe-inline' 'unsafe-eval';">
    <title>Tzotzil Bible</title>
    <link rel="icon" type="image/png" href="static/images/Designer.png">
    <link rel="manifest" href="static/manifest.json">
    <link rel="apple-touch-icon" href="static/images/Designer.png">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css" rel="stylesheet">
    <link href="static/css/style.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700&family=Poppins:wght@500&family=Fira+Sans:wght@400;500&display=swap" rel="stylesheet">
    <style>
      .app-loading {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, #1a1a2e 0%, #0d1117 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: #00f3ff;
      }
      .app-loading img {
        width: 120px;
        height: 120px;
        animation: pulse 2s ease-in-out infinite;
      }
      .app-loading h2 {
        margin-top: 20px;
        font-family: 'Orbitron', sans-serif;
        font-size: 1.5rem;
      }
      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid rgba(0, 243, 255, 0.3);
        border-radius: 50%;
        border-top-color: #00f3ff;
        animation: spin 1s ease-in-out infinite;
        margin-top: 30px;
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.05); opacity: 0.8; }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .offline-notice {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #ff6b35;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        z-index: 10000;
        display: none;
      }
      .offline-notice.show { display: block; }
    </style>
</head>
<body>
    <div id="offline-notice" class="offline-notice">
        📡 Modo sin conexión - Datos guardados localmente
    </div>
    
    <div id="app-loading" class="app-loading">
        <img src="static/images/Designer.png" alt="Tzotzil Bible">
        <h2>Tzotzil Bible</h2>
        <div class="loading-spinner"></div>
        <p style="margin-top: 20px; opacity: 0.7;">Cargando...</p>
    </div>
    
    <iframe id="webapp-frame" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; border:none; z-index:1;"></iframe>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script type="module">
      import { Capacitor } from 'https://cdn.jsdelivr.net/npm/@aspect/capacitor-core@6.0.0/+esm';
      import { Network } from 'https://cdn.jsdelivr.net/npm/@capacitor/network@6.0.0/+esm';
      import { App } from 'https://cdn.jsdelivr.net/npm/@capacitor/app@6.0.0/+esm';
      import { SplashScreen } from 'https://cdn.jsdelivr.net/npm/@capacitor/splash-screen@6.0.0/+esm';
      
      const API_BASE = '${process.env.API_URL || 'https://your-replit-url.replit.app'}';
      const loadingEl = document.getElementById('app-loading');
      const frameEl = document.getElementById('webapp-frame');
      const offlineNotice = document.getElementById('offline-notice');
      
      let isOnline = navigator.onLine;
      
      async function initApp() {
        try {
          const status = await Network.getStatus();
          isOnline = status.connected;
          
          Network.addListener('networkStatusChange', (status) => {
            isOnline = status.connected;
            offlineNotice.classList.toggle('show', !isOnline);
          });
          
          offlineNotice.classList.toggle('show', !isOnline);
          
          if (isOnline) {
            frameEl.src = API_BASE;
            frameEl.onload = () => {
              loadingEl.style.display = 'none';
              frameEl.style.display = 'block';
            };
            frameEl.onerror = loadOfflineMode;
          } else {
            loadOfflineMode();
          }
          
          App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
              window.history.back();
            } else {
              App.exitApp();
            }
          });
          
          await SplashScreen.hide();
          
        } catch (error) {
          console.error('Error initializing app:', error);
          loadOfflineMode();
        }
      }
      
      function loadOfflineMode() {
        loadingEl.innerHTML = \`
          <img src="static/images/Designer.png" alt="Tzotzil Bible">
          <h2>Modo Sin Conexión</h2>
          <p style="margin-top: 20px; text-align: center; max-width: 300px;">
            No hay conexión a internet.<br>
            Los datos guardados estarán disponibles.
          </p>
          <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 30px; background: #00f3ff; color: #1a1a2e; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
            Reintentar
          </button>
        \`;
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
          .then(reg => console.log('SW registered'))
          .catch(err => console.error('SW registration failed:', err));
      }
      
      initApp();
    </script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);
  
  console.log('\n✅ Build complete!');
  console.log('   Run "npm run sync" to sync with native platforms');
}

build();
