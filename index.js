// Display welcome message
console.log('3D Data Sandbox initializing...');

// Check if running in Electron
const isElectron = window.electronAPI !== undefined;
console.log('Running in Electron:', isElectron);

// Global initialization flag
window.isInitialized = false;

// Check if all required components are loaded
function checkRequiredComponents() {
  const components = [
    { name: 'DataProcessor', object: window.DataProcessor },
    { name: 'Scene3D', object: window.Scene3D },
    { name: 'UIController', object: window.UIController }
  ];
  
  const missing = components.filter(comp => typeof comp.object === 'undefined');
  
  if (missing.length > 0) {
    console.error('Missing required components:', missing.map(m => m.name).join(', '));
    return false;
  }
  
  return true;
}

// Load sample data for testing or development
function generateSampleData() {
  console.log('Generating sample data...');
  const sampleData = [];
  const numPoints = 100;
  
  // Generate random points in 3D space
  for (let i = 0; i < numPoints; i++) {
    const point = {
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      z: Math.random() * 100 - 50,
      category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)],
      value: Math.random() * 100
    };
    sampleData.push(point);
  }
  
  console.log(`Generated ${numPoints} sample data points`);
  return {
    content: JSON.stringify(sampleData),
    extension: '.json',
    fileName: 'sample-data.json'
  };
}

// Initialize UI Controller if not already initialized
function initializeUIController() {
  if (window.uiController) {
    console.log('UI Controller already initialized');
    return true;
  }
  
  if (!checkRequiredComponents()) {
    console.error('Cannot initialize UI Controller - missing required components');
    return false;
  }
  
  try {
    console.log('Creating UI Controller instance');
    window.uiController = new UIController();
    console.log('UI Controller successfully initialized');
    window.isInitialized = true;
    return true;
  } catch (error) {
    console.error('Failed to initialize UI Controller:', error);
    return false;
  }
}

// Add keyboard shortcut for testing with sample data
document.addEventListener('keydown', (event) => {
  // Check if Ctrl+D (or Cmd+D on Mac) was pressed for demo data
  if ((event.ctrlKey || event.metaKey) && event.key === 'd') {
    event.preventDefault();
    console.log('Loading demo data with keyboard shortcut Ctrl+D / Cmd+D');
    loadDemoData();
  }
});

// Function to load demo data
function loadDemoData() {
  console.log('Loading demo data...');
  
  // Initialize UI controller if needed
  if (!window.uiController) {
    initializeUIController();
  }
  
  // If UI controller exists, import sample data
  if (window.uiController) {
    console.log('UI controller found, loading sample data');
    const sampleData = generateSampleData();
    window.uiController.importData(sampleData);
    console.log('Sample data loaded through UI controller');
  } else {
    console.error('UI controller not found');
    // Wait for UI controller to initialize and retry
    setTimeout(() => {
      if (!window.uiController) {
        initializeUIController();
      }
      
      if (window.uiController) {
        const sampleData = generateSampleData();
        window.uiController.importData(sampleData);
        console.log('Sample data loaded after waiting for UI controller');
      } else {
        console.error('UI controller still not available after waiting');
      }
    }, 1000);
  }
}

// Support for loading saved scenes
async function loadSavedScene(sceneData) {
  try {
    console.log('Loading saved scene...');
    
    // Initialize UI controller if needed
    if (window.uiController && window.uiController.scene3D) {
      window.uiController.scene3D.loadSceneData(sceneData);
      
      // Update UI state if needed
      if (sceneData.config) {
        // Update node size input
        const nodeSizeInput = document.getElementById('node-size');
        if (nodeSizeInput && sceneData.config.nodeSize) {
          nodeSizeInput.value = sceneData.config.nodeSize;
        }
        
        // Update show connections checkbox
        const showConnectionsInput = document.getElementById('show-connections');
        if (showConnectionsInput && sceneData.config.showConnections !== undefined) {
          showConnectionsInput.checked = sceneData.config.showConnections;
        }
      }
      
      // Enable controls
      window.uiController.enableControls();
      console.log('Scene loaded successfully');
    } else {
      console.error('UI controller or scene not available');
    }
  } catch (error) {
    console.error('Error loading scene:', error);
  }
}

// Expose functions to the window for debugging and testing
window.debugTools = {
  generateSampleData,
  loadSavedScene,
  loadDemo: loadDemoData
};

// If import button is not working, add direct click listener
document.addEventListener('DOMContentLoaded', () => {
  console.log('Adding backup click listener for import button');
  
  // Add a backup click handler to the import button
  setTimeout(() => {
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      console.log('Adding backup import button handler');
      importBtn.addEventListener('click', (event) => {
        console.log('Import button clicked via backup handler');
        event.stopPropagation();
        
        // Check if UI controller exists
        if (window.uiController) {
          window.uiController.importData();
        } else {
          // Fallback to loading demo data
          loadDemoData();
        }
      });
    }
  }, 1000); // Give the original handler time to register
});
