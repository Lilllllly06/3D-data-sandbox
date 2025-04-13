/**
 * UI Controller Stub
 * This file provides a compatible implementation of the UIController class
 * for cases when the original UI.js fails to load or initialize correctly.
 */

class UIController {
  constructor() {
    console.log('UIController stub constructor called');
    this.isInitialized = false;
    this.dataProcessor = window.DataProcessor ? new window.DataProcessor() : null;
    this.scene3D = window.Scene3D ? new window.Scene3D() : null;
    this.electronAPI = window.electronAPI || this.createElectronAPIFallback();
    this.isLoading = false;
    
    // DOM elements - will be initialized in setupUIElements
    this.importButton = null;
    this.fileInput = null;
    this.layoutAlgorithm = null;
    this.nodeSize = null;
    this.showConnections = null;
    this.saveSceneButton = null;
    this.exportScreenshotButton = null;
    this.dataInfo = null;
    this.canvasContainer = null;
    this.tooltip = null;
  }
  
  /**
   * Initialize the UI controller
   */
  init() {
    console.log('UIController stub init called');
    try {
      // Check for required components
      if (!this.dataProcessor) {
        console.error('DataProcessor not available');
        this.dataProcessor = {
          processData: () => { console.log('Mock DataProcessor.processData called'); return { nodes: [], links: [] }; }
        };
      }
      
      if (!this.scene3D) {
        console.error('Scene3D not available');
        this.scene3D = {
          init: () => { console.log('Mock Scene3D.init called'); },
          loadData: () => { console.log('Mock Scene3D.loadData called'); },
          updateLayout: () => { console.log('Mock Scene3D.updateLayout called'); },
          updateNodeSize: () => { console.log('Mock Scene3D.updateNodeSize called'); },
          toggleConnections: () => { console.log('Mock Scene3D.toggleConnections called'); },
          takeScreenshot: () => { console.log('Mock Scene3D.takeScreenshot called'); return null; }
        };
      }
      
      this.setupUIElements();
      this.setupEventListeners();
      this.isInitialized = true;
      console.log('UIController stub initialized successfully');
      
      // Make sure application knows we're initialized
      window.uiController = this;
      window.UIController = UIController;
      
      return true;
    } catch (error) {
      console.error('Error initializing UI controller:', error);
      this.showError('Failed to initialize application: ' + error.message);
      return false;
    }
  }
  
  /**
   * Create a fallback for Electron API
   */
  createElectronAPIFallback() {
    console.log('Creating Electron API fallback');
    return {
      openFile: () => {
        console.log('Browser fallback: electronAPI.openFile called');
        return Promise.resolve(null);
      },
      saveScene: (scene) => {
        console.log('Browser fallback: electronAPI.saveScene called');
        return Promise.resolve(false);
      },
      saveScreenshot: (imgData) => {
        console.log('Browser fallback: electronAPI.saveScreenshot called');
        return Promise.resolve(false);
      }
    };
  }
  
  /**
   * Setup UI elements
   */
  setupUIElements() {
    console.log('Setting up UI elements');
    try {
      this.importButton = document.getElementById('import-btn');
      this.fileInput = document.getElementById('file-input');
      this.layoutAlgorithm = document.getElementById('layout-algorithm');
      this.nodeSize = document.getElementById('node-size');
      this.showConnections = document.getElementById('show-connections');
      this.saveSceneButton = document.getElementById('save-scene-btn');
      this.exportScreenshotButton = document.getElementById('export-screenshot-btn');
      this.dataInfo = document.getElementById('data-info');
      this.canvasContainer = document.getElementById('canvas-container');
      this.tooltip = document.getElementById('tooltip');
      
      // Check if all critical elements are found
      const criticalElements = [
        { name: 'importButton', element: this.importButton },
        { name: 'fileInput', element: this.fileInput },
        { name: 'canvasContainer', element: this.canvasContainer }
      ];
      
      const missingElements = criticalElements.filter(item => !item.element);
      
      if (missingElements.length > 0) {
        const missingNames = missingElements.map(item => item.name).join(', ');
        console.error(`Missing critical UI elements: ${missingNames}`);
        // Don't throw - create placeholders instead
        missingElements.forEach(item => {
          console.log(`Creating placeholder for ${item.name}`);
          this[item.name] = document.createElement('div');
        });
      }
      
      // Initialize Scene3D with canvas container
      if (this.scene3D && this.scene3D.init && this.canvasContainer) {
        this.scene3D.init(this.canvasContainer);
      }
      
      console.log('UI elements setup complete');
    } catch (error) {
      console.error('Error setting up UI elements:', error);
      throw new Error('Failed to setup UI elements: ' + error.message);
    }
  }
  
  /**
   * Setup event listeners
   */
  setupEventListeners() {
    console.log('Setting up event listeners');
    try {
      // Import button click
      if (this.importButton) {
        this.importButton.addEventListener('click', () => {
          console.log('Import button clicked');
          this.openFileDialog();
        });
      }
      
      // File input change
      if (this.fileInput) {
        this.fileInput.addEventListener('change', (event) => {
          console.log('File input changed');
          this.handleFileInput(event);
        });
      }
      
      // Layout algorithm change
      if (this.layoutAlgorithm) {
        this.layoutAlgorithm.addEventListener('change', () => {
          console.log('Layout algorithm changed:', this.layoutAlgorithm.value);
          this.updateLayout();
        });
      }
      
      // Node size change
      if (this.nodeSize) {
        this.nodeSize.addEventListener('input', () => {
          console.log('Node size changed:', this.nodeSize.value);
          this.updateNodeSize();
        });
      }
      
      // Show connections change
      if (this.showConnections) {
        this.showConnections.addEventListener('change', () => {
          console.log('Show connections changed:', this.showConnections.checked);
          this.toggleConnections();
        });
      }
      
      // Save scene button click
      if (this.saveSceneButton) {
        this.saveSceneButton.addEventListener('click', () => {
          console.log('Save scene button clicked');
          this.saveScene();
        });
      }
      
      // Export screenshot button click
      if (this.exportScreenshotButton) {
        this.exportScreenshotButton.addEventListener('click', () => {
          console.log('Export screenshot button clicked');
          this.exportScreenshot();
        });
      }
      
      console.log('Event listeners setup complete');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      return false;
    }
  }
  
  /**
   * Handle file input
   * @param {Event} event - File input change event
   */
  handleFileInput(event) {
    try {
      console.log('File input detected');
      
      // Check if files were selected
      if (!event.target.files || event.target.files.length === 0) {
        this.showError('No file selected');
        return;
      }
      
      const file = event.target.files[0];
      console.log('File selected:', file.name);
      
      // Show loading indicator
      this.showLoading(true);
      
      // Read file
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          // Check if file content is available
          if (!e.target.result) {
            this.showError('Error reading file: No content');
            this.showLoading(false);
            return;
          }
          
          const fileData = {
            content: e.target.result,
            extension: file.name.substring(file.name.lastIndexOf('.')).toLowerCase(),
            fileName: file.name
          };
          
          // Check file extension
          if (!['.csv', '.json'].includes(fileData.extension)) {
            this.showError('Unsupported file type. Please use CSV or JSON files.');
            this.showLoading(false);
            return;
          }
          
          // Import the data
          this.importData(fileData);
          
        } catch (error) {
          console.error('Error processing file:', error);
          this.showError('Error processing file: ' + error.message);
          this.showLoading(false);
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        this.showError('Error reading file');
        this.showLoading(false);
      };
      
      reader.readAsText(file);
      
    } catch (error) {
      console.error('Error handling file input:', error);
      this.showError('Error handling file input: ' + error.message);
      this.showLoading(false);
    }
  }
  
  /**
   * Import data from file
   * @param {Object} fileData - File data object
   * @returns {boolean} - True if import was successful
   */
  importData(fileData) {
    try {
      console.log('Importing data:', fileData.fileName);
      
      if (!this.dataProcessor) {
        this.showError('Data processor not initialized');
        this.showLoading(false);
        return false;
      }
      
      // Process data
      const processedData = this.dataProcessor.processFile(fileData);
      
      if (!processedData || !processedData.points || processedData.points.length === 0) {
        this.showError('No data points found in file');
        this.showLoading(false);
        return false;
      }
      
      console.log(`Processed ${processedData.points.length} data points`);
      
      // Visualize data
      if (this.scene3D) {
        this.scene3D.visualizeData(processedData.points);
        
        // Enable controls
        this.enableControls(true);
      } else {
        this.showError('3D scene not initialized');
        this.showLoading(false);
        return false;
      }
      
      // Update data info
      this.updateDataInfo(processedData);
      
      // Mark as having data
      this.hasData = true;
      
      // Hide loading indicator
      this.showLoading(false);
      
      this.showStatus('Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      this.showError('Error importing data: ' + error.message);
      this.showLoading(false);
      return false;
    }
  }
  
  /**
   * Update data information display
   * @param {Object} data - Processed data object
   */
  updateDataInfo(data) {
    if (!this.dataInfo) return;
    
    let html = '<h3>Data Information</h3>';
    
    if (data && data.points) {
      html += `<p>Points: ${data.points.length}</p>`;
      
      if (data.dimensions) {
        html += `<p>Dimensions: ${data.dimensions.join(', ')}</p>`;
      }
      
      if (data.fileName) {
        html += `<p>Source: ${data.fileName}</p>`;
      }
    } else {
      html += '<p>No data loaded</p>';
    }
    
    this.dataInfo.innerHTML = html;
  }
  
  /**
   * Enable or disable controls
   * @param {boolean} enabled - Whether controls should be enabled
   */
  enableControls(enabled) {
    const controls = [
      this.layoutSelect,
      this.nodeSize,
      this.showConnections,
      this.saveSceneBtn,
      this.exportScreenshotBtn
    ];
    
    controls.forEach(control => {
      if (control) {
        control.disabled = !enabled;
      }
    });
  }
  
  /**
   * Update layout based on selected algorithm
   */
  updateLayout() {
    if (!this.layoutSelect || !this.scene3D || !this.hasData) return;
    
    const layout = this.layoutSelect.value;
    console.log('Updating layout:', layout);
    
    this.showLoading(true);
    
    try {
      this.scene3D.updateLayout(layout);
      this.showStatus(`Layout updated to ${layout}`);
    } catch (error) {
      console.error('Error updating layout:', error);
      this.showError('Error updating layout: ' + error.message);
    }
    
    this.showLoading(false);
  }
  
  /**
   * Update node size based on slider value
   */
  updateNodeSize() {
    if (!this.nodeSize || !this.scene3D || !this.hasData) return;
    
    const size = parseFloat(this.nodeSize.value);
    this.scene3D.updateNodeSize(size);
  }
  
  /**
   * Toggle connections visibility
   */
  toggleConnections() {
    if (!this.showConnections || !this.scene3D || !this.hasData) return;
    
    const show = this.showConnections.checked;
    this.scene3D.toggleConnections(show);
  }
  
  /**
   * Open file dialog
   */
  openFileDialog() {
    console.log('Opening file dialog...');
    
    if (this.isElectron && window.electronAPI) {
      // Use Electron's dialog
      window.electronAPI.openFile()
        .then(result => {
          if (result && result.filePath && result.content) {
            const fileData = {
              content: result.content,
              extension: result.filePath.substring(result.filePath.lastIndexOf('.')).toLowerCase(),
              fileName: result.filePath.split(/[\\/]/).pop()
            };
            
            this.importData(fileData);
          }
        })
        .catch(error => {
          console.error('Error opening file dialog:', error);
          this.showError('Error opening file dialog');
        });
    } else {
      // Use browser file input
      if (this.fileInput) {
        this.fileInput.click();
      } else {
        this.showError('File input element not found');
      }
    }
  }
  
  /**
   * Save scene
   */
  saveScene() {
    if (!this.hasData) {
      this.showError('No data to save');
      return;
    }
    
    console.log('Saving scene...');
    
    if (this.isElectron && window.electronAPI) {
      window.electronAPI.saveScene()
        .then(success => {
          if (success) {
            this.showStatus('Scene saved successfully');
          } else {
            this.showError('Failed to save scene');
          }
        })
        .catch(error => {
          console.error('Error saving scene:', error);
          this.showError('Error saving scene');
        });
    } else {
      this.showError('Scene saving is only available in Electron app');
    }
  }
  
  /**
   * Export screenshot
   */
  exportScreenshot() {
    console.log('Exporting screenshot');
    
    if (window.electronAPI && window.electronAPI.saveScreenshot) {
      this.showStatus('Exporting screenshot...');
      
      // Take screenshot
      const screenshot = this.scene3D.takeScreenshot();
      
      if (!screenshot) {
        this.showError('Failed to create screenshot');
        return;
      }
      
      window.electronAPI.saveScreenshot(screenshot)
        .then(success => {
          if (success) {
            this.showStatus('Screenshot exported successfully');
          } else {
            console.log('Screenshot export canceled');
          }
        })
        .catch(error => {
          console.error('Error exporting screenshot:', error);
          this.showError('Error exporting screenshot');
        });
    } else {
      // Browser fallback - download image directly
      try {
        const screenshot = this.scene3D.takeScreenshot();
        
        if (screenshot) {
          const link = document.createElement('a');
          link.download = 'visualization-screenshot.png';
          link.href = screenshot;
          link.click();
          
          this.showStatus('Screenshot downloaded');
        } else {
          this.showError('Failed to create screenshot');
        }
      } catch (error) {
        console.error('Error taking screenshot:', error);
        this.showError('Error taking screenshot: ' + error.message);
      }
    }
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   */
  showError(message) {
    console.error('ERROR:', message);
    alert('Error: ' + message);
  }
  
  /**
   * Show status message
   * @param {string} message - Status message
   */
  showStatus(message) {
    console.log('Status:', message);
  }
  
  /**
   * Show or hide loading indicator
   * @param {boolean} show - Whether to show the loading indicator
   */
  showLoading(show) {
    this.isLoading = show;
    
    // Implementation depends on UI design
    // This is a simple implementation that changes the cursor
    document.body.style.cursor = show ? 'wait' : 'default';
  }
}

// Create a global instance and make sure UIController class is also globally accessible
window.UIController = UIController;
window.uiController = new UIController();

// Initialize the UI controller - removed DOMContentLoaded since we want this to be immediate
console.log('Attempting to initialize UI controller stub immediately');
if (window.uiController && !window.uiController.isInitialized) {
  setTimeout(() => {
    console.log('Initializing UI controller with delay to ensure DOM is ready');
    try {
      window.uiController.init();
      console.log('UI controller initialization complete, status:', window.uiController.isInitialized);
    } catch (e) {
      console.error('Error during delayed initialization:', e);
    }
  }, 500); // Small delay to ensure DOM is loaded
}

console.log('UI controller stub loaded successfully - Class and instance exposed globally'); 