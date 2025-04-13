/**
 * UI Controller - Manages UI interactions and connects components
 */
class UIController {
  constructor() {
    // Track initialization status
    this.isInitialized = false;
    
    // Store UI references
    this.fileInput = null;
    this.layoutSelect = null;
    this.nodeSizeSlider = null;
    this.showConnectionsCheckbox = null;
    this.statusElement = null;
    this.loadingIndicator = null;
    this.nodeShapeSelect = null;
    // New UI element references
    this.kmeansOptionsDiv = null;
    this.kmeansClustersInput = null;
    this.colorColumnSelect = null;
    this.filterColumnSelect = null;
    this.filterValueInput = null;
    this.applyFilterBtn = null;
    // Analysis UI elements
    this.detectOutliersBtn = null;
    this.corrCol1Select = null;
    this.corrCol2Select = null;
    this.corrThresholdInput = null;
    this.showCorrelationBtn = null;
    this.correlationLinesGroup = null; // Group for correlation lines in Scene3D
    
    // Store current settings
    this.currentSettings = {
      layout: 'scatter',
      kmeansClusters: 3, // Default K for K-Means
      colorColumn: '', // Default/auto color
      filterColumn: '',
      filterValue: '',
      nodeShape: 'cube',
      nodeSize: 1,
      showConnections: false,
      highlightOutliers: false, // Track outlier state
      showCorrelationLines: false, // Track correlation state
      correlationColumn1: '',
      correlationColumn2: '',
      correlationThreshold: 0.7
    };
    
    // Check if we're running in Electron or browser
    this.initElectronAPI();
    
    console.log('UIController instance created');
  }
  
  /**
   * Initialize the UI controller
   */
  init() {
    try {
      console.log('Initializing UI controller...');
      
      // Initialize components - do this after DOM elements are available
      this.dataProcessor = new DataProcessor();
      console.log('DataProcessor initialized');
      
      // Find visualization container
      const container = document.getElementById('visualization-container');
      if (!container) {
        throw new Error('Visualization container not found');
      }
      
      this.scene3D = new Scene3D('visualization-container');
      console.log('Scene3D initialized');
      
      this.setupUIElements();
      this.setupEventListeners();
      
      this.isInitialized = true;
      this.showStatus('Ready to import data');
      console.log('UI initialization complete');
      
      return true;
    } catch (error) {
      console.error('UI initialization error:', error);
      this.showError('Failed to initialize UI: ' + error.message);
      this.isInitialized = false;
      
      // Show error in the UI
      const errorMsg = document.getElementById('errorMessage');
      if (errorMsg) {
        errorMsg.textContent = 'Initialization failed: ' + error.message;
        errorMsg.style.display = 'block';
      }
      
      return false;
    }
  }
  
  /**
   * Initialize Electron API or create fallback
   */
  initElectronAPI() {
    // Check if running in Electron
    if (window.electronAPI) {
      console.log('Running in Electron, using native file dialogs');
      this.electronAPI = {
        openFile: window.electronAPI.openFile,
        saveScene: window.electronAPI.saveScene,
        exportScreenshot: window.electronAPI.saveScreenshot // Map to the correct method name
      };
    } else {
      console.log('Running in browser, using fallback file handling');
      // Create fallbacks for Electron functions
      this.electronAPI = {
        openFile: () => {
          console.log('Browser fallback: openFile called');
          if (this.fileInput) {
            this.fileInput.click();
          } else {
            console.error('File input element not available for fallback');
          }
          return Promise.resolve(null);
        },
        saveScene: (data) => {
          console.log('Browser fallback: saveScene called');
          this.saveDataAsJson(data, 'scene-data.json');
          return Promise.resolve({ success: true });
        },
        exportScreenshot: (dataUrl) => {
          console.log('Browser fallback: exportScreenshot called');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = 'visualization.png';
          link.click();
          return Promise.resolve({ success: true });
        }
      };
    }
    console.log('Electron API initialized/fallbacks created');
  }
  
  /**
   * Set up UI elements
   */
  setupUIElements() {
    console.log('Setting up UI elements...');
    try {
      this.fileInput = document.getElementById('file-input');
      if (!this.fileInput) {
        console.error('File input element not found');
        throw new Error('Required UI element missing: file-input');
      }
      
      this.layoutSelect = document.getElementById('layout-select');
      if (!this.layoutSelect) {
        console.warn('Layout select element not found');
      }
      
      this.nodeSizeSlider = document.getElementById('node-size-slider');
      if (!this.nodeSizeSlider) {
        console.warn('Node size slider not found');
      }
      
      this.showConnectionsCheckbox = document.getElementById('show-connections');
      if (!this.showConnectionsCheckbox) {
        console.warn('Show connections checkbox not found');
      }
      
      this.statusElement = document.getElementById('status-message');
      this.loadingIndicator = document.getElementById('loading-indicator');
      
      this.nodeShapeSelect = document.getElementById('node-shape-select');
      if (!this.nodeShapeSelect) {
        console.warn('Node shape select element not found');
      }
      
      // K-Means options
      this.kmeansOptionsDiv = document.getElementById('kmeans-options');
      this.kmeansClustersInput = document.getElementById('kmeans-clusters');
      if (!this.kmeansOptionsDiv || !this.kmeansClustersInput) {
        console.warn('K-Means options elements not found');
      }

      // Color column select
      this.colorColumnSelect = document.getElementById('color-column-select');
      if (!this.colorColumnSelect) {
        console.warn('Color column select element not found');
      }

      // Filtering elements
      this.filterColumnSelect = document.getElementById('filter-column-select');
      this.filterValueInput = document.getElementById('filter-value-input');
      this.applyFilterBtn = document.getElementById('apply-filter-btn');
      if (!this.filterColumnSelect || !this.filterValueInput || !this.applyFilterBtn) {
        console.warn('Filtering elements not found');
      }
      
      // Analysis Elements
      this.detectOutliersBtn = document.getElementById('detect-outliers-btn');
      this.corrCol1Select = document.getElementById('corr-col1-select');
      this.corrCol2Select = document.getElementById('corr-col2-select');
      this.corrThresholdInput = document.getElementById('corr-threshold-input');
      this.showCorrelationBtn = document.getElementById('show-correlation-btn');
      if (!this.detectOutliersBtn || !this.corrCol1Select || !this.corrCol2Select || !this.corrThresholdInput || !this.showCorrelationBtn) {
        console.warn('One or more analysis UI elements not found');
      }
      
      console.log('UI elements set up successfully');
    } catch (error) {
      console.error('Error setting up UI elements:', error);
      throw error;
    }
  }
  
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    console.log('Setting up event listeners...');
    try {
      // Set up file input
      if (this.fileInput) {
        this.fileInput.addEventListener('change', (event) => {
          this.handleFileInput(event);
        });
      }
      
      // Open file button
      const openFileBtn = document.getElementById('open-file-btn');
      if (openFileBtn) {
        openFileBtn.addEventListener('click', () => {
          this.openFileDialog();
        });
      } else {
        console.warn('Open file button not found');
      }
      
      // Layout selection (add K-Means options toggle)
      if (this.layoutSelect) {
        this.layoutSelect.addEventListener('change', () => {
          const selectedLayout = this.layoutSelect.value;
          if (this.kmeansOptionsDiv) { 
            this.kmeansOptionsDiv.style.display = selectedLayout === 'kmeans' ? 'block' : 'none';
          }
          this.updateLayout();
        });
      }
      
      // Node size slider
      if (this.nodeSizeSlider) {
        this.nodeSizeSlider.addEventListener('input', () => {
          this.updateNodeSize();
        });
      }
      
      // Show connections checkbox
      if (this.showConnectionsCheckbox) {
        this.showConnectionsCheckbox.addEventListener('change', () => {
          this.toggleConnections();
        });
      }
      
      // Node shape selection
      if (this.nodeShapeSelect) {
        this.nodeShapeSelect.addEventListener('change', () => {
          this.updateNodeShape();
        });
      }
      
      // Save scene button
      const saveSceneBtn = document.getElementById('save-scene-btn');
      if (saveSceneBtn) {
        saveSceneBtn.addEventListener('click', () => {
          this.saveScene();
        });
      } else {
        console.warn('Save scene button not found');
      }
      
      // Export screenshot button
      const exportScreenshotBtn = document.getElementById('export-screenshot-btn');
      if (exportScreenshotBtn) {
        exportScreenshotBtn.addEventListener('click', () => {
          this.exportScreenshot();
        });
      } else {
        console.warn('Export screenshot button not found');
      }
      
      // Reset view button
      const resetViewBtn = document.getElementById('reset-view-btn');
      if (resetViewBtn) {
        resetViewBtn.addEventListener('click', () => {
          this.resetView();
        });
      } else {
        console.warn('Reset view button not found');
      }
      
      // K-Means cluster input
      if (this.kmeansClustersInput) {
        this.kmeansClustersInput.addEventListener('change', () => {
          if (this.currentSettings.layout === 'kmeans') {
            this.updateLayout(); // Re-run layout if K changes
          }
        });
      }
      
      // Color column selection
      if (this.colorColumnSelect) {
        this.colorColumnSelect.addEventListener('change', () => {
          this.updateColorColumn();
        });
      }

      // Filtering listeners
      if (this.applyFilterBtn) {
        this.applyFilterBtn.addEventListener('click', () => {
          this.applyFilter();
        });
      }
      // Optional: Apply filter on Enter key in the input field
      if (this.filterValueInput) {
        this.filterValueInput.addEventListener('keypress', (event) => {
          if (event.key === 'Enter') {
            this.applyFilter();
          }
        });
      }
      
      // Analysis Listeners
      if (this.detectOutliersBtn) {
        this.detectOutliersBtn.addEventListener('click', () => {
          this.toggleOutlierDetection();
        });
      }
      if (this.showCorrelationBtn) {
        this.showCorrelationBtn.addEventListener('click', () => {
          this.toggleCorrelationLines();
        });
      }
      // Update correlation threshold on change
      if (this.corrThresholdInput) {
        this.corrThresholdInput.addEventListener('change', () => {
          this.currentSettings.correlationThreshold = parseFloat(this.corrThresholdInput.value) || 0.7;
          if (this.currentSettings.showCorrelationLines) {
            // Re-run correlation if lines are currently shown
            this.updateCorrelationLines();
          }
        });
      }
      
      console.log('Event listeners set up successfully');
    } catch (error) {
      console.error('Error setting up event listeners:', error);
      throw error;
    }
  }
  
  /**
   * Handle file input
   * @param {Event} event - File input change event
   */
  handleFileInput(event) {
    try {
      if (!this.isInitialized) {
        throw new Error('UI controller not fully initialized');
      }
      
      console.log('handleFileInput triggered');
      this.showLoading(true);
      this.showStatus('Reading file...');
      
      const file = event.target.files[0];
      if (!file) {
        console.log('No file selected');
        this.showError('No file selected');
        this.showLoading(false);
        return;
      }
      
      console.log(`File selected: ${file.name}, Type: ${file.type}, Size: ${file.size}`);
      
      const filename = file.name;
      const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
      
      const supportedTypes = ['.csv', '.json'];
      if (!supportedTypes.includes(extension)) {
        console.log(`Unsupported file type: ${extension}`);
        this.showError(`Unsupported file type: ${extension}. Please use CSV or JSON files.`);
        this.showLoading(false);
        return;
      }
      
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const content = e.target.result;
        console.log(`File content read, length: ${content ? content.length : 0}`);
        
        if (!content || content.trim() === '') {
          console.log('File is empty or content is null');
          this.showError('The file is empty');
          this.showLoading(false);
          return;
        }
        
        // Call importData with file details
        console.log('Calling importData...');
        this.importData({
          content: content,
          filename: filename,
          extension: extension
        });
      };
      
      reader.onerror = (error) => {
        console.error('FileReader error:', error);
        this.showError('Failed to read file');
        this.showLoading(false);
      };
      
      console.log('Reading file as text...');
      reader.readAsText(file);
    } catch (error) {
      console.error('Error in handleFileInput:', error);
      this.showError('Error processing file: ' + error.message);
      this.showLoading(false);
    }
  }
  
  /**
   * Import data from file
   * @param {Object} fileData - File data object
   */
  importData(fileData) {
    try {
      console.log('importData called with filename:', fileData.filename);
      this.showStatus('Processing data...');
      console.log('Processing data with DataProcessor...');
      
      // Process the file data
      const processedData = this.dataProcessor.processFile(fileData);
      console.log('DataProcessor returned processedData:', processedData);
      
      if (!processedData) {
        throw new Error('Data processing returned no result.');
      }
      
      // Populate column selectors now that we have columns
      this.populateColumnSelectors(); 
      
      // Reset filter selections
      if (this.filterColumnSelect) this.filterColumnSelect.value = '';
      if (this.filterValueInput) this.filterValueInput.value = '';
      this.currentSettings.filterColumn = '';
      this.currentSettings.filterValue = '';
      
      // Reset analysis states
      this.currentSettings.highlightOutliers = false;
      this.currentSettings.showCorrelationLines = false;
      if (this.detectOutliersBtn) this.detectOutliersBtn.textContent = 'Highlight Outliers';
      if (this.showCorrelationBtn) this.showCorrelationBtn.textContent = 'Show Correlation Lines';
      if (this.scene3D) this.scene3D.clearAnalysisVisuals(); // Clear analysis visuals in scene
      
      // Prepare initial visualization data (will use default color/filter)
      const initialLayout = this.getSelectedLayout();
      const initialVizData = this.dataProcessor.prepareVisualizationData(initialLayout, {
          kmeansClusters: parseInt(this.kmeansClustersInput?.value || '3')
      });
      
      this.updateVisualization(initialVizData);
      
      // Update UI with data info
      console.log('Updating data info panel...');
      this.updateDataInfo();
      
      // Enable controls
      console.log('Enabling controls...');
      this.enableControls();
      
      this.showStatus('Data imported successfully');
      console.log('Data import complete');
    } catch (error) {
      console.error('Error during importData:', error);
      this.showError('Failed to import data: ' + error.message);
    } finally {
      console.log('Hiding loading indicator in importData finally block');
      this.showLoading(false);
    }
  }
  
  /**
   * Update the visualization with new data
   * @param {Array} visualizationData - Processed data points prepared by DataProcessor
   */
  updateVisualization(visualizationData) {
    console.log('updateVisualization called.');
    if (!visualizationData) {
      console.warn('No data provided for visualization.');
      this.showError('Cannot update visualization: No processed data available.');
      return;
    }
    
    // Add check for empty data array
    if (!Array.isArray(visualizationData) || visualizationData.length === 0) {
      console.warn('Data for visualization is empty or not an array.');
      this.showError('Cannot update visualization: Processed data is empty.');
      return;
    }
    
    try {
      console.log(`Preparing to visualize ${visualizationData.length} points.`);
      // Clear existing visualization
      console.log('Clearing previous visualization in Scene3D...');
      this.scene3D.clearVisualization();
      
      // NOTE: Data is already prepared by DataProcessor in importData
      // We just need to pass it to the scene
      console.log('Calling scene3D.visualizeData...');
      this.scene3D.visualizeData(visualizationData);
      
      // Reset camera to see all points
      console.log('Resetting camera position...');
      this.scene3D.resetCameraPosition();
      
      console.log(`Visualization updated successfully with ${visualizationData.length} points.`);
    } catch (error) {
      console.error('Error during updateVisualization:', error);
      this.showError('Failed to update visualization: ' + error.message);
    }
  }
  
  /**
   * Get the selected layout from the UI
   * @returns {string} Selected layout name
   */
  getSelectedLayout() {
    if (this.layoutSelect) {
      return this.layoutSelect.value;
    }
    return this.currentSettings.layout;
  }
  
  /**
   * Update the layout based on user selection
   */
  updateLayout() {
    try {
      const layout = this.getSelectedLayout();
      console.log('Updating layout to:', layout);
      
      this.currentSettings.layout = layout;
      
      // Toggle K-Means input visibility
      if (this.kmeansOptionsDiv) {
        this.kmeansOptionsDiv.style.display = layout === 'kmeans' ? 'block' : 'none';
      }
      
      this.refreshVisualization(); // Use helper to refresh

    } catch (error) {
      console.error('Layout update error:', error);
      this.showError('Failed to update layout: ' + error.message);
    }
  }
  
  /**
   * Update node size based on slider value
   */
  updateNodeSize() {
    try {
      if (!this.nodeSizeSlider) return;
      
      const size = parseFloat(this.nodeSizeSlider.value);
      console.log('Updating node size to:', size);
      
      this.currentSettings.nodeSize = size;
      
      // Update node size in 3D scene
      this.scene3D.updateNodeSize(size);
      
      this.showStatus(`Node size updated to ${size}`);
    } catch (error) {
      console.error('Node size update error:', error);
      this.showError('Failed to update node size: ' + error.message);
    }
  }
  
  /**
   * Toggle connections between nodes
   */
  toggleConnections() {
    try {
      if (!this.showConnectionsCheckbox) return;
      
      const showConnections = this.showConnectionsCheckbox.checked;
      console.log('Toggle connections:', showConnections);
      
      this.currentSettings.showConnections = showConnections;
      
      // Update connections in 3D scene
      this.scene3D.toggleConnections(showConnections);
      
      this.showStatus(`Connections ${showConnections ? 'shown' : 'hidden'}`);
    } catch (error) {
      console.error('Toggle connections error:', error);
      this.showError('Failed to toggle connections: ' + error.message);
    }
  }
  
  /**
   * Reset the 3D view
   */
  resetView() {
    try {
      console.log('Resetting view');
      this.scene3D.resetCameraPosition();
      this.showStatus('View reset');
    } catch (error) {
      console.error('Reset view error:', error);
      this.showError('Failed to reset view: ' + error.message);
    }
  }
  
  /**
   * Enable UI controls after data import
   */
  enableControls() {
    if (this.layoutSelect) this.layoutSelect.disabled = false;
    if (this.nodeSizeSlider) this.nodeSizeSlider.disabled = false;
    if (this.showConnectionsCheckbox) this.showConnectionsCheckbox.disabled = false;
    if (this.nodeShapeSelect) this.nodeShapeSelect.disabled = false;
    if (this.kmeansClustersInput) this.kmeansClustersInput.disabled = false;
    if (this.colorColumnSelect) this.colorColumnSelect.disabled = false;
    if (this.filterColumnSelect) this.filterColumnSelect.disabled = false;
    if (this.filterValueInput) this.filterValueInput.disabled = false;
    if (this.applyFilterBtn) this.applyFilterBtn.disabled = false;
    if (this.detectOutliersBtn) this.detectOutliersBtn.disabled = false;
    if (this.corrCol1Select) this.corrCol1Select.disabled = false;
    if (this.corrCol2Select) this.corrCol2Select.disabled = false;
    if (this.corrThresholdInput) this.corrThresholdInput.disabled = false;
    if (this.showCorrelationBtn) this.showCorrelationBtn.disabled = false;
    
    // Enable buttons
    const buttons = document.querySelectorAll('.data-dependent');
    buttons.forEach(button => {
      button.disabled = false;
    });
  }
  
  /**
   * Update the data information panel
   */
  updateDataInfo() {
    const dataInfo = this.dataProcessor.getDataInfo();
    const infoPanel = document.getElementById('data-info');
    
    if (!infoPanel || !dataInfo) return;
    
    let html = `<h3>Data Summary</h3>`;
    html += `<p>Rows: ${dataInfo.rowCount}</p>`;
    html += `<p>Columns: ${dataInfo.columns.length}</p>`;
    
    html += `<h4>Numeric Columns</h4>`;
    html += `<ul>`;
    dataInfo.numericColumns.forEach(col => {
      html += `<li>${col}</li>`;
    });
    html += `</ul>`;
    
    html += `<h4>Categorical Columns</h4>`;
    html += `<ul>`;
    dataInfo.categoricalColumns.forEach(col => {
      html += `<li>${col}</li>`;
    });
    html += `</ul>`;
    
    infoPanel.innerHTML = html;
  }
  
  /**
   * Open a file dialog using Electron API or fallback
   */
  openFileDialog() {
    try {
      console.log('Opening file dialog via electronAPI.openFile...');
      
      // Reset file input for browser fallback consistency
      if (this.fileInput) {
        this.fileInput.value = ''; 
      }
      
      // Use Electron API if available
      this.electronAPI.openFile()
        .then(fileData => { // Renamed variable for clarity
          if (fileData && fileData.content) { // Check if we received valid data
            console.log('File data received from Electron API:', {
              filename: fileData.path, // Assuming path is the filename
              extension: fileData.extension,
              contentLength: fileData.content.length
            });
            
            // Crucial Step: Import the received data
            this.showLoading(true);
            this.showStatus('Processing imported file...');
            this.importData({
              content: fileData.content,
              filename: fileData.path, // Pass the path as filename
              extension: fileData.extension
            });
          } else if (fileData === null) {
            console.log('File selection canceled or no file selected.');
            this.showStatus('File import canceled.');
          } else {
            console.warn('Received unexpected data structure from openFile:', fileData);
            this.showError('Failed to receive valid file data.');
          }
        })
        .catch(error => {
          console.error('Error during electronAPI.openFile call:', error);
          this.showError('Failed to open file: ' + error.message);
          this.showLoading(false); // Ensure loading is hidden on error
        });
    } catch (error) {
      console.error('Error in openFileDialog method:', error);
      this.showError('Failed to initiate file dialog: ' + error.message);
      this.showLoading(false); // Ensure loading is hidden on error
    }
  }
  
  /**
   * Save current scene
   */
  saveScene() {
    try {
      console.log('Saving scene');
      this.showStatus('Saving scene...');
      
      // Get scene data
      const sceneData = this.scene3D.getSceneData();
      
      // Add data processor state
      sceneData.dataInfo = this.dataProcessor.getDataInfo();
      sceneData.settings = this.currentSettings;
      
      // Use Electron API to save
      this.electronAPI.saveScene(sceneData)
        .then(result => {
          if (result.success) {
            this.showStatus('Scene saved successfully');
          } else {
            this.showError('Failed to save scene: ' + (result.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error saving scene:', error);
          this.showError('Failed to save scene: ' + error.message);
        });
    } catch (error) {
      console.error('Save scene error:', error);
      this.showError('Failed to save scene: ' + error.message);
    }
  }
  
  /**
   * Save data as JSON file (browser fallback)
   * @param {Object} data - Data to save
   * @param {string} filename - Filename
   */
  saveDataAsJson(data, filename) {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    
    URL.revokeObjectURL(url);
  }
  
  /**
   * Export screenshot of the visualization
   */
  exportScreenshot() {
    try {
      console.log('Exporting screenshot');
      this.showStatus('Exporting screenshot...');
      
      // Get screenshot from scene
      const dataUrl = this.scene3D.exportScreenshot();
      
      // Use Electron API to save
      this.electronAPI.exportScreenshot(dataUrl)
        .then(result => {
          if (result.success) {
            this.showStatus('Screenshot exported successfully');
          } else {
            this.showError('Failed to export screenshot: ' + (result.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error exporting screenshot:', error);
          this.showError('Failed to export screenshot: ' + error.message);
        });
    } catch (error) {
      console.error('Export screenshot error:', error);
      this.showError('Failed to export screenshot: ' + error.message);
    }
  }
  
  /**
   * Show an error message to the user
   * @param {string} message - Error message
   */
  showError(message) {
    console.error(message);
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'error';
    } else {
      // Fallback if status element isn't available yet
      const errorMsg = document.getElementById('errorMessage');
      if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.style.display = 'block';
      } else {
        alert('Error: ' + message);
      }
    }
  }
  
  /**
   * Show a status message to the user
   * @param {string} message - Status message
   */
  showStatus(message) {
    console.log(message);
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = '';
    }
  }
  
  /**
   * Show or hide the loading indicator
   * @param {boolean} show - Whether to show the loading indicator
   */
  showLoading(show) {
    if (this.loadingIndicator) {
      this.loadingIndicator.style.display = show ? 'block' : 'none';
    }
  }
  
  /**
   * Update node shape based on user selection
   */
  updateNodeShape() {
    try {
      if (!this.nodeShapeSelect || !this.scene3D) return;
      
      const shape = this.nodeShapeSelect.value;
      console.log('Updating node shape to:', shape);
      
      this.currentSettings.nodeShape = shape;
      
      // Update node shape in 3D scene
      this.scene3D.updateNodeShape(shape);
      
      this.showStatus(`Node shape updated to ${shape}`);
    } catch (error) {
      console.error('Node shape update error:', error);
      this.showError('Failed to update node shape: ' + error.message);
    }
  }
  
  /**
   * Populate column selectors (color and filter)
   */
  populateColumnSelectors() {
    if (!this.dataProcessor || !this.dataProcessor.dataColumns) return;
    
    const columns = this.dataProcessor.dataColumns;
    console.log('Populating column selectors with:', columns);

    const populate = (selectElement) => {
      if (!selectElement) return;
      // Clear existing options except the first default one
      while (selectElement.options.length > 1) {
        selectElement.remove(1);
      }
      // Add new options
      columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        selectElement.appendChild(option);
      });
    };

    populate(this.colorColumnSelect);
    populate(this.filterColumnSelect);

    const populateNumeric = (selectElement) => {
        if (!selectElement) return;
        while (selectElement.options.length > 1) selectElement.remove(1);
        this.dataProcessor.metaData.numericColumns.forEach(col => {
            // Avoid adding internal columns like _index, _derived_y etc.
            if (!col.startsWith('_')) {
                const option = document.createElement('option');
                option.value = col;
                option.textContent = col;
                selectElement.appendChild(option);
            }
        });
    };
    // Populate correlation dropdowns with only numeric columns
    populateNumeric(this.corrCol1Select);
    populateNumeric(this.corrCol2Select);
  }
  
  /**
   * Triggered when the color column selection changes
   */
  updateColorColumn() {
    if (!this.colorColumnSelect) return;
    this.currentSettings.colorColumn = this.colorColumnSelect.value;
    console.log(`Color column changed to: ${this.currentSettings.colorColumn}`);
    this.refreshVisualization(); // Refresh needed to apply new colors
  }

  /**
   * Triggered when the apply filter button is clicked
   */
  applyFilter() {
    if (!this.filterColumnSelect || !this.filterValueInput) return;
    this.currentSettings.filterColumn = this.filterColumnSelect.value;
    this.currentSettings.filterValue = this.filterValueInput.value;
    console.log(`Applying filter - Column: ${this.currentSettings.filterColumn}, Value: ${this.currentSettings.filterValue}`);
    this.refreshVisualization(); // Refresh needed to apply filter
  }

  /**
   * Helper function to re-prepare and re-render the visualization
   * based on current settings (layout, color, filter, etc.)
   */
  refreshVisualization() {
    if (!this.dataProcessor || !this.dataProcessor.processedData) {
      console.warn('Cannot refresh visualization - no processed data available.');
      return;
    }
    
    try {
      this.showLoading(true);
      this.showStatus('Updating visualization settings...');
      
      const layout = this.currentSettings.layout;
      const options = {
        kmeansClusters: parseInt(this.kmeansClustersInput?.value || '3'),
        colorColumn: this.currentSettings.colorColumn,
        filterColumn: this.currentSettings.filterColumn,
        filterValue: this.currentSettings.filterValue
      };
      
      console.log('Refreshing visualization with options:', options);
      const visualizationData = this.dataProcessor.prepareVisualizationData(layout, options);
      
      if (!visualizationData) {
        throw new Error('Failed to prepare visualization data with current settings.');
      }
      
      this.updateVisualization(visualizationData);
      this.showStatus('Visualization updated.');
      
    } catch (error) {
      console.error('Error refreshing visualization:', error);
      this.showError('Failed to refresh visualization: ' + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  // --- New Analysis Methods --- 
  
  toggleOutlierDetection() {
    if (!this.dataProcessor || !this.scene3D) return;
    this.currentSettings.highlightOutliers = !this.currentSettings.highlightOutliers;
    console.log('Toggling outlier highlighting:', this.currentSettings.highlightOutliers);
    
    if (this.currentSettings.highlightOutliers) {
      this.showLoading(true);
      this.showStatus('Detecting outliers...');
      try {
        const outlierData = this.dataProcessor.detectOutliers();
        this.scene3D.highlightNodes(outlierData.outlierIndices, outlierData.nonOutlierIndices);
        if (this.detectOutliersBtn) this.detectOutliersBtn.textContent = 'Clear Outlier Highlights';
        this.showStatus(`Highlighted ${outlierData.outlierIndices.length} potential outliers.`);
      } catch (error) {
        console.error('Outlier detection error:', error);
        this.showError('Failed to detect outliers: ' + error.message);
        this.currentSettings.highlightOutliers = false; // Revert state on error
      } finally {
        this.showLoading(false);
      }
    } else {
      console.log('Clearing outlier highlights.');
      this.scene3D.clearHighlights();
      if (this.detectOutliersBtn) this.detectOutliersBtn.textContent = 'Highlight Outliers';
      this.showStatus('Outlier highlights cleared.');
    }
  }
  
  toggleCorrelationLines() {
    this.currentSettings.showCorrelationLines = !this.currentSettings.showCorrelationLines;
    console.log('Toggling correlation lines:', this.currentSettings.showCorrelationLines);

    if (this.currentSettings.showCorrelationLines) {
        if (this.updateCorrelationLines()) { // Returns false if setup fails
            if (this.showCorrelationBtn) this.showCorrelationBtn.textContent = 'Hide Correlation Lines';
        } else {
            // Revert state if update failed (e.g., columns not selected)
            this.currentSettings.showCorrelationLines = false;
        }
    } else {
        console.log('Clearing correlation lines.');
        if(this.scene3D) this.scene3D.clearCorrelationLines();
        if (this.showCorrelationBtn) this.showCorrelationBtn.textContent = 'Show Correlation Lines';
        this.showStatus('Correlation lines hidden.');
    }
  }

  updateCorrelationLines() {
    if (!this.dataProcessor || !this.scene3D || !this.corrCol1Select || !this.corrCol2Select || !this.corrThresholdInput) return false;

    const col1 = this.corrCol1Select.value;
    const col2 = this.corrCol2Select.value;
    const threshold = parseFloat(this.corrThresholdInput.value);

    if (!col1 || !col2) {
        this.showError('Please select two numeric columns for correlation.');
        return false;
    }
    if (col1 === col2) {
        this.showError('Please select two different columns for correlation.');
        return false;
    }
    if (isNaN(threshold)) {
        this.showError('Invalid correlation threshold.');
        return false;
    }

    this.currentSettings.correlationColumn1 = col1;
    this.currentSettings.correlationColumn2 = col2;
    this.currentSettings.correlationThreshold = threshold;

    this.showLoading(true);
    this.showStatus(`Calculating correlations between ${col1} and ${col2}...`);
    try {
        const correlationData = this.dataProcessor.calculateCorrelations(col1, col2, threshold);
        if (correlationData) {
            this.scene3D.drawCorrelationLines(correlationData);
            this.showStatus(`Showing ${correlationData.length} correlation lines (Threshold: ${threshold}).`);
            return true; // Success
        } else {
            throw new Error('Correlation calculation returned no data.');
        }
    } catch (error) {
        console.error('Correlation calculation/drawing error:', error);
        this.showError('Failed to show correlations: ' + error.message);
        return false; // Failure
    } finally {
        this.showLoading(false);
    }
  }
}

// Store UI controller instance in global space
let uiControllerInstance = null;

// Create and initialize UI controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded - initializing UI controller');
  
  // Check dependencies before creating UI controller
  const dependencies = [
    { name: 'THREE', check: () => typeof THREE !== 'undefined' },
    { name: 'THREE.OrbitControls', check: () => typeof THREE !== 'undefined' && typeof THREE.OrbitControls === 'function' },
    { name: 'Papa', check: () => typeof Papa !== 'undefined' },
    { name: 'DataProcessor', check: () => typeof DataProcessor !== 'undefined' },
    { name: 'Scene3D', check: () => typeof Scene3D !== 'undefined' }
  ];
  
  const missing = dependencies.filter(dep => !dep.check());
  if (missing.length > 0) {
    const missingNames = missing.map(d => d.name).join(', ');
    console.error('Missing core dependencies:', missingNames);
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
      errorMsg.textContent = `Fatal application error: Missing required script components (${missingNames}). Check console.`;
      errorMsg.style.display = 'block';
    } else {
      alert(`Fatal application error: Missing required script components (${missingNames}). Check console.`);
    }
    return; // Stop initialization
  }
  
  try {
    // Initialize UI controller and store in global variable
    uiControllerInstance = new UIController();
    window.uiController = uiControllerInstance;
    
    // Try to initialize
    const success = uiControllerInstance.init();
    console.log('UI controller initialization result:', success);
  } catch (error) {
    console.error('Fatal error initializing UI controller:', error);
    // Show error in UI
    const errorMsg = document.getElementById('errorMessage');
    if (errorMsg) {
      errorMsg.textContent = 'Fatal application error: ' + error.message;
      errorMsg.style.display = 'block';
    } else {
      alert('Fatal application error: ' + error.message);
    }
  }
});

// Ensure the UIController is available globally in different environments
if (typeof window !== 'undefined') {
  window.UIController = UIController;
}

// For module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
}
