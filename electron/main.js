const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let nextApp = null;
let server = null;
let serverPort = null;
const isDev = !app.isPackaged;

function logToFile(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'main.log');
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logPath, line);
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

async function startNextServer() {
  const next = require('next');
  const http = require('http');

  const appDir = app.isPackaged ? app.getAppPath() : process.cwd();
  const cacheDir = path.join(app.getPath('userData'), '.next-cache');
  process.env.NEXT_CACHE_DIR = cacheDir;

  logToFile(`Starting Next.js server. appDir=${appDir} cacheDir=${cacheDir}`);

  nextApp = next({
    dev: false,
    dir: appDir,
  });

  const handle = nextApp.getRequestHandler();
  await nextApp.prepare();

  server = http.createServer((req, res) => {
    handle(req, res);
  });

  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => {
      if (err) {
        logToFile(`Next.js server failed: ${err.message}`);
        reject(err);
        return;
      }
      const address = server.address();
      serverPort = typeof address === 'object' && address ? address.port : 3000;
      logToFile(`Next.js server ready on http://127.0.0.1:${serverPort}`);
      resolve();
    });
  });
}

async function createWindow() {
  logToFile(`createWindow: isDev=${isDev} isPackaged=${app.isPackaged}`);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default window frame to use custom controls
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
  });

  try {
    if (!isDev) {
      await startNextServer();
    }

    const startUrl = isDev
      ? 'http://localhost:3000'
      : `http://127.0.0.1:${serverPort}`;

    mainWindow.loadURL(startUrl);
  } catch (error) {
    const message = `Failed to start server: ${error?.message || error}`;
    logToFile(message);
    dialog.showErrorBox('Startup Error', message);
    mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(message)}`);
  }

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    const message = `did-fail-load: ${errorCode} ${errorDescription} ${validatedURL}`;
    logToFile(message);
    dialog.showErrorBox('Load Error', message);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    logToFile(`render-process-gone: ${JSON.stringify(details)}`);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (server) {
    server.close();
  }
  if (nextApp) {
    nextApp.close();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (server) {
    server.close();
  }
  if (nextApp) {
    nextApp.close();
  }
});

// IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-app-path', () => {
  return app.getAppPath();
});

ipcMain.handle('open-file-dialog', async (event, options) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    ...options,
  });
  
  return result;
});

ipcMain.handle('save-file-dialog', async (event, options) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showSaveDialog(mainWindow, options);
  return result;
});

ipcMain.handle('show-message-box', async (event, options) => {
  if (!mainWindow) return null;
  
  const result = await dialog.showMessageBox(mainWindow, options);
  return result;
});

// Window control handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.restore();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

// Create application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
      { label: 'Redo', accelerator: 'CmdOrCtrl+Y', role: 'redo' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
      {
        label: 'Toggle Developer Tools',
        accelerator: 'CmdOrCtrl+Shift+I',
        role: 'toggleDevTools',
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
