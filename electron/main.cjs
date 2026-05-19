const path = require('path');
const http = require('http');

let app, BrowserWindow;

try {
  const electron = require('electron');
  if (typeof electron === 'object' && electron !== null && electron.app) {
    app = electron.app;
    BrowserWindow = electron.BrowserWindow;
  } else {
    throw new Error('electron module returned non-object: ' + typeof electron);
  }
} catch (e) {
  try {
    app = process._linkedBinding('electron_browser_app');
    BrowserWindow = process._linkedBinding('electron_browser_window').BrowserWindow;
  } catch (e2) {
    const allBindings = Object.getOwnPropertyNames(process).filter(k => k.startsWith('_'));
    throw new Error('Cannot get Electron API. require error: ' + e.message + ', binding error: ' + e2.message + ', process keys: ' + allBindings.join(','));
  }
}

let mainWindow;
let splashWindow;

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 260,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,
    show: false,
  });

  // 内嵌 Splash HTML，无需额外文件
  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          width: 400px; height: 260px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          color: white;
          overflow: hidden;
        }
        h1 { font-size: 28px; font-weight: 700; margin-bottom: 24px; letter-spacing: 1px; }
        .spinner {
          width: 36px; height: 36px;
          border: 3px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        p { margin-top: 16px; font-size: 13px; opacity: 0.8; }
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <h1>API Tester</h1>
      <div class="spinner"></div>
      <p>Loading...</p>
    </body>
    </html>
  `)}`);

  splashWindow.once('ready-to-show', () => {
    splashWindow.show();
  });

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      // 安全：保持 webSecurity 启用
      // 通过 main 进程代理请求来解决 CORS 问题
      webSecurity: true,
    },
    show: false,
    titleBarStyle: 'default',
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    // 关闭 Splash，显示主窗口
    if (splashWindow) {
      splashWindow.close();
    }
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function waitForVite() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Vite server timeout (60s)'));
    }, 60000);

    const check = () => {
      http.get('http://localhost:5173', (res) => {
        if (res.statusCode === 200) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(check, 1000);
        }
      }).on('error', () => {
        setTimeout(check, 1000);
      });
    };
    check();
  });
}

app.whenReady().then(async () => {
  const isDev = !app.isPackaged;

  // 先显示 Splash 画面
  createSplash();

  if (isDev) {
    await waitForVite();
  }

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
