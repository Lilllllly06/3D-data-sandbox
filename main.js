// main.js will be created here

const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

console.log('Starting Electron application...');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

// Set up all IPC handlers immediately
function setupIpcHandlers() {
  console.log('Setting up IPC handlers');
  
  // Handle file opening dialog
  ipcMain.handle('open-file-dialog', async () => {
    console.log('IPC: open-file-dialog received');
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [
          { name: 'Data Files', extensions: ['csv', 'json'] }
        ]
      });
      
      console.log('File dialog result:', { canceled, filePaths });
      
      if (!canceled && filePaths.length > 0) {
        try {
          const content = fs.readFileSync(filePaths[0], 'utf8');
          const result = {
            path: filePaths[0],
            content,
            extension: path.extname(filePaths[0]).toLowerCase()
          };
          console.log('File read successful, returning data');
          return result;
        } catch (error) {
          console.error('Error reading file:', error);
          throw new Error(`Failed to read file: ${error.message}`);
        }
      }
      console.log('File selection canceled or no file selected');
      return null;
    } catch (error) {
      console.error('Error in open-file-dialog handler:', error);
      throw error;
    }
  });

  // Handle saving scene data
  ipcMain.handle('save-scene', async (event, sceneData) => {
    console.log('IPC: save-scene received');
    try {
      if (!sceneData) {
        console.error('No scene data provided');
        return false;
      }
      
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Scene',
        defaultPath: 'scene.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }]
      });

      if (!canceled && filePath) {
        try {
          fs.writeFileSync(filePath, JSON.stringify(sceneData, null, 2), 'utf8');
          console.log('Scene saved successfully to:', filePath);
          return true;
        } catch (error) {
          console.error('Error writing scene file:', error);
          return false;
        }
      }
      console.log('Scene save canceled');
      return false;
    } catch (error) {
      console.error('Error in save-scene handler:', error);
      return false;
    }
  });

  // Handle exporting screenshot
  ipcMain.handle('save-screenshot', async (event, imageDataUrl) => {
    console.log('IPC: save-screenshot received');
    try {
      if (!imageDataUrl || typeof imageDataUrl !== 'string') {
        console.error('Invalid screenshot data');
        return false;
      }
      
      const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Screenshot',
        defaultPath: 'screenshot.png',
        filters: [{ name: 'PNG Image', extensions: ['png'] }]
      });

      if (!canceled && filePath) {
        try {
          // Convert data URL to buffer and save
          const base64Data = imageDataUrl.replace(/^data:image\/png;base64,/, '');
          fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
          console.log('Screenshot saved successfully to:', filePath);
          return true;
        } catch (error) {
          console.error('Error writing screenshot file:', error);
          return false;
        }
      }
      console.log('Screenshot save canceled');
      return false;
    } catch (error) {
      console.error('Error in save-screenshot handler:', error);
      return false;
    }
  });
  
  console.log('All IPC handlers registered successfully');
}

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public/icon-data.svg')
  });

  // Load the index.html of the app
  mainWindow.loadFile('index.html');

  // Open DevTools in development
  if (process.argv.includes('--dev')) {
    console.log('Development mode: Opening DevTools');
    mainWindow.webContents.openDevTools();
  }

  // Emitted when the window is closed
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
  
  console.log('Main window created and loaded');
}

// Register IPC handlers before anything else
setupIpcHandlers();

// Create window when app is ready
app.whenReady().then(() => {
  console.log('Electron app ready, creating window');
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (mainWindow === null) createWindow();
});
