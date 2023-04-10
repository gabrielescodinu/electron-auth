const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const server = require('./server');
const serverUrl = require('./server');

let mainWindow;

app.whenReady().then(() => {
    // ...
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('setServerUrl', serverUrl);
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true, // Abilita 'require' nel renderer process
            contextIsolation: false, // Imposta 'contextIsolation' su false per abilitare 'nodeIntegration'
        },
    });

    // Carica index.html o dashboard.html a seconda della pagina attuale
    mainWindow.loadFile('index.html');

    // Passa l'URL del server come una variabile globale
    mainWindow.webContents.executeJavaScript(`window.serverUrl = "${serverUrl}";`);

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    );

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});


// Ascolta il messaggio 'load-dashboard' e carica la pagina della dashboard
ipcMain.on('load-dashboard', () => {
    mainWindow.loadFile('dashboard.html');
});
