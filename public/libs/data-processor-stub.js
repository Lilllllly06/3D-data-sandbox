// DataProcessor stub for 3D Data Sandbox
// This ensures data processing works without errors

// Create DataProcessor class
window.DataProcessor = function() {
  console.log('DataProcessor initialized');
  
  /**
   * Process file data
   * @param {Object} fileData - File data with content and extension
   * @returns {Object} Processed data
   */
  this.processFile = function(fileData) {
    console.log('Processing file with extension:', fileData.extension);
    
    if (!fileData || !fileData.content) {
      console.error('No file data provided');
      throw new Error('No file data provided');
    }
    
    let processedData;
    
    // Process based on file type
    if (fileData.extension === '.csv') {
      processedData = this.processCSV(fileData.content);
    } else if (fileData.extension === '.json') {
      processedData = this.processJSON(fileData.content);
    } else {
      throw new Error(`Unsupported file type: ${fileData.extension}`);
    }
    
    return processedData;
  };
  
  /**
   * Process CSV data
   * @param {string} csvContent - CSV content
   * @returns {Object} Processed data
   */
  this.processCSV = function(csvContent) {
    console.log('Processing CSV data...');
    
    try {
      // Use Papa Parse to parse CSV
      const parseResult = Papa.parse(csvContent, {
        header: true,
        dynamicTyping: true
      });
      
      if (parseResult.errors && parseResult.errors.length > 0) {
        console.error('CSV parsing errors:', parseResult.errors);
        throw new Error('CSV parsing error: ' + parseResult.errors[0].message);
      }
      
      const data = parseResult.data;
      console.log(`CSV processed: ${data.length} rows`);
      
      // Convert to visualization format
      return this.convertToVisualizationFormat(data);
    } catch (error) {
      console.error('Error processing CSV:', error);
      throw new Error('CSV processing error: ' + error.message);
    }
  };
  
  /**
   * Process JSON data
   * @param {string} jsonContent - JSON content
   * @returns {Object} Processed data
   */
  this.processJSON = function(jsonContent) {
    console.log('Processing JSON data...');
    
    try {
      const data = JSON.parse(jsonContent);
      
      if (!Array.isArray(data)) {
        throw new Error('JSON data must be an array');
      }
      
      console.log(`JSON processed: ${data.length} items`);
      
      // Convert to visualization format
      return this.convertToVisualizationFormat(data);
    } catch (error) {
      console.error('Error processing JSON:', error);
      throw new Error('JSON processing error: ' + error.message);
    }
  };
  
  /**
   * Convert to visualization format
   * @param {Array} data - Raw data array
   * @returns {Object} Visualization data
   */
  this.convertToVisualizationFormat = function(data) {
    try {
      // Check if we have valid data
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No valid data to process');
      }
      
      console.log('Converting data to visualization format');
      
      // Extract dimensions (column names)
      const dimensions = Object.keys(data[0]).filter(key => {
        const value = data[0][key];
        return typeof value === 'number' || !isNaN(parseFloat(value));
      });
      
      // Make sure we have at least x, y, z dimensions
      if (dimensions.length < 3) {
        console.warn('Less than 3 numeric dimensions found, using default positions');
      }
      
      // Map dimension names to x, y, z
      const xDim = dimensions.length > 0 ? dimensions[0] : null;
      const yDim = dimensions.length > 1 ? dimensions[1] : null;
      const zDim = dimensions.length > 2 ? dimensions[2] : null;
      
      // Find categorical columns
      const categoricalColumns = Object.keys(data[0]).filter(key => {
        return !dimensions.includes(key) && typeof data[0][key] === 'string';
      });
      
      // Use first categorical column for coloring if available
      const colorKey = categoricalColumns.length > 0 ? categoricalColumns[0] : null;
      
      console.log(`Found dimensions: ${dimensions.join(', ')}`);
      console.log(`Found categories: ${categoricalColumns.join(', ')}`);
      
      // Convert to points format
      const points = data.map((item, index) => {
        // Get x, y, z coordinates with proper validation
        let x = 0, y = 0, z = 0;
        
        if (xDim) {
          const xVal = parseFloat(item[xDim]);
          x = !isNaN(xVal) ? xVal : 0;
        }
        
        if (yDim) {
          const yVal = parseFloat(item[yDim]);
          y = !isNaN(yVal) ? yVal : 0;
        }
        
        if (zDim) {
          const zVal = parseFloat(item[zDim]);
          z = !isNaN(zVal) ? zVal : 0;
        }
        
        // Get color category
        const category = colorKey && item[colorKey] ? String(item[colorKey]) : null;
        
        return {
          id: index,
          position: { x, y, z },
          category: category,
          // Store original data
          data: item
        };
      });
      
      // Create nodes and links for the visualization
      return {
        nodes: points,
        points: points, // For compatibility
        dimensions: dimensions,
        categories: categoricalColumns,
        fileName: data.fileName
      };
    } catch (error) {
      console.error('Error converting data format:', error);
      throw new Error('Failed to convert data: ' + error.message);
    }
  };
  
  /**
   * Get data information
   * @returns {Object} Data information
   */
  this.getDataInfo = function() {
    return {
      pointCount: 0,
      dimensions: [],
      categories: []
    };
  };

  /**
   * Process data from CSV or JSON content
   * @param {string} content - File content 
   * @param {string} fileType - File type ('csv' or 'json')
   * @returns {Object} Processed data
   */
  this.processData = function(content, fileType) {
    console.log('Processing data with type:', fileType);
    
    if (!content) {
      console.error('No content provided');
      throw new Error('No content provided');
    }
    
    try {
      let processedData;
      
      // Process based on file type
      if (fileType === 'csv') {
        processedData = this.processCSV(content);
      } else if (fileType === 'json') {
        processedData = this.processJSON(content);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }
      
      return processedData;
    } catch (error) {
      console.error('Error processing data:', error);
      throw error;
    }
  };
};

console.log('DataProcessor stub loaded successfully'); 