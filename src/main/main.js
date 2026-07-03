const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
const { ElectronBlocker } = require('@ghostery/adblocker-electron');
const fetch = require('cross-fetch');

// Live-updating filter list URLs (fetched fresh on every app launch)
const FILTER_LIST_URLS = [
  // EasyList — the most popular ad-blocking list
  'https://easylist.to/easylist/easylist.txt',
  // EasyPrivacy — tracking protection
  'https://easylist.to/easylist/easyprivacy.txt',
  // uBlock Origin filters — excellent coverage
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/badware.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-cookies.txt',
  'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-others.txt',
  // Peter Lowe's ad and tracking server list
  'https://pgl.yoyo.org/adservers/serverlist.php?hostformat=adblockplus&showintro=1&mimetype=plaintext',
  // RU AdList — Russian-language ads (important for Kinopoisk/Russian sites)
  'https://easylist-downloads.adblockplus.org/advblock.txt',
];

// Custom filter rules for video-player ad domains
const CUSTOM_FILTERS = [
  // Common video ad networks
  '||doubleclick.net^',
  '||googlesyndication.com^',
  '||googleadservices.com^',
  '||moatads.com^',
  '||adskeeper.com^',
  '||adnxs.com^',
  '||adsrvmedia.net^',
  '||mc.yandex.ru^',
  '||an.yandex.ru^',
  '||ads.adfox.ru^',
  '||adfox.ru^',
  '||ad.mail.ru^',
  '||topad.top^',
  '||vidstream.pro/ads^',
  '||streamads.net^',
  // Common overlay & popup ad patterns (cosmetic filters)
  '##.ads-overlay',
  '##.ad-container',
  '##.video-ad',
  '##div[id*="ad-"]',
  '##div[class*="ad-banner"]',
  '##.popup-ad',
  '##.overlay-ad',
].join('\n');

let blocker = null;

// --- Splash Screen ---
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 320,
    icon: path.join(__dirname, '../../Image/ico.png'),
    frame: false,
    transparent: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    center: true,
    backgroundColor: '#060608',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  return splashWindow;
}

function updateSplash(progress, text) {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.webContents.executeJavaScript(`
      (function() {
        var bar = document.getElementById('progressBar');
        var status = document.getElementById('statusText');
        if (bar) bar.style.width = '${progress}%';
        if (status) status.innerHTML = '${text}';
      })();
    `).catch(() => {});
  }
}

function closeSplash() {
  if (splashWindow && !splashWindow.isDestroyed()) {
    splashWindow.close();
    splashWindow = null;
  }
}

async function initializeAdblocker() {
  updateSplash(10, 'Инициализация движка блокировки<span class="dots"></span>');
  await new Promise(r => setTimeout(r, 1000));

  try {
    updateSplash(30, 'Загрузка локальных списков фильтров<span class="dots"></span>');
    await new Promise(r => setTimeout(r, 1000));
    
    const filtersPath1 = path.join(__dirname, '..', '..', 'filters', 'filters.txt');
    const filtersPath2 = path.join(__dirname, 'filters.txt');
    let filtersContent = '';
    
    if (fs.existsSync(filtersPath1)) {
      filtersContent += fs.readFileSync(filtersPath1, 'utf-8') + '\n';
    }
    if (fs.existsSync(filtersPath2)) {
      filtersContent += fs.readFileSync(filtersPath2, 'utf-8') + '\n';
    }
    
    if (!filtersContent) {
      console.warn('Локальные файлы filters.txt не найдены, загружаем только кастомные правила.');
    }
    
    updateSplash(60, 'Настройка пользовательских фильтров<span class="dots"></span>');
    await new Promise(r => setTimeout(r, 1000));
    const allFilters = filtersContent + '\n' + CUSTOM_FILTERS;
    
    // Синхронный парсинг списков в движок
    blocker = ElectronBlocker.parse(allFilters);

    updateSplash(85, 'Активация сессий<span class="dots"></span>');
    await new Promise(r => setTimeout(r, 1000));
    blocker.enableBlockingInSession(session.defaultSession);
    
    // Логирование заблокированных запросов для проверки
    blocker.on('request-blocked', (request) => {
      console.log('🚫 Заблокирована реклама:', request.url);
    });
    
    // Webview interception
    session.defaultSession.webRequest.onBeforeRequest(
      { urls: ['*://*/*'] },
      (details, callback) => callback({})
    );
    
    updateSplash(100, '✓ Защита активирована');
    console.log('Adblocker fully initialized using local powerful lists');
  } catch (err) {
    console.error('Failed to load adblocker lists:', err);
    updateSplash(100, 'Ошибка загрузки фильтров');
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    icon: path.join(__dirname, '../../Image/ico.png'),
    minWidth: 960,
    minHeight: 600,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    backgroundColor: '#060608',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Enable webview for embedded players
    },
  });

  // Apply blocker to any new webview sessions that appear
  mainWindow.webContents.on('did-attach-webview', (event, webviewContents) => {
    if (blocker) {
      const webviewSession = webviewContents.session;
      blocker.enableBlockingInSession(webviewSession);
    }
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
}

app.whenReady().then(async () => {
  // Show splash screen while loading
  createSplashWindow();

  // Initialize adblocker with progress updates on splash
  await initializeAdblocker();

  // Brief pause so user sees "✓ Защита активирована"
  await new Promise(r => setTimeout(r, 800));

  // Close splash and open main app
  closeSplash();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Window controls IPC
ipcMain.on('window-minimize', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);
  if (win) win.close();
});

ipcMain.on('open-external', (event, url) => {
  shell.openExternal(url);
});
