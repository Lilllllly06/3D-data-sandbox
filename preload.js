const { contextBridge, ipcRenderer } = require('electron');

// Log that preload script is running
console.log('Preload script initialized - setting up electronAPI bridge');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
try {
  contextBridge.exposeInMainWorld(
    'electronAPI', {
      openFile: async () => {
        console.log('Renderer calling openFile');
        try {
          const result = await ipcRenderer.invoke('open-file-dialog');
          console.log('openFile result received:', !!result);
          return result;
        } catch (error) {
          console.error('Error in openFile:', error);
          throw error;
        }
      },
      saveScene: async (sceneData) => {
        console.log('Renderer calling saveScene');
        try {
          const result = await ipcRenderer.invoke('save-scene', sceneData);
          return { success: result };
        } catch (error) {
          console.error('Error in saveScene:', error);
          return { success: false, error: error.message };
        }
      },
      exportScreenshot: async (imageDataUrl) => {
        console.log('Renderer calling exportScreenshot');
        try {
          const result = await ipcRenderer.invoke('save-screenshot', imageDataUrl);
          return { success: result };
        } catch (error) {
          console.error('Error in exportScreenshot:', error);
          return { success: false, error: error.message };
        }
      }
    }
  );
  console.log('electronAPI successfully exposed to renderer process');
} catch (error) {
  console.error('Failed to expose electronAPI:', error);
}
    