/**
 * DataProcessor - Handles data import, parsing, and processing for visualization
 */
class DataProcessor {
  constructor() {
    console.log('Initializing DataProcessor...');
    
    try {
      // Check if PapaParse is available (needed for CSV parsing)
      if (typeof Papa === 'undefined') {
        console.warn('PapaParse library not detected - CSV parsing may not work');
      }
      
      this.rawData = null;
      this.processedData = null;
      this.dataColumns = [];
      this.metaData = {
        numericColumns: [],
        categoricalColumns: [],
        dataStats: {}
      };
      
      console.log('DataProcessor initialized successfully');
    } catch (error) {
      console.error('Error initializing DataProcessor:', error);
      throw new Error('Failed to initialize DataProcessor: ' + error.message);
    }
  }

  /**
   * Process data from a file
   * @param {Object} fileData - Object containing file content and extension
   * @returns {Array|null} Processed data points ready for visualization, or null if error
   */
  processFile(fileData) {
    console.log('DataProcessor: processFile called');
    try {
      if (!fileData) {
        throw new Error('No file data provided');
      }
      if (!fileData.content) {
        throw new Error('File has no content');
      }
      if (fileData.content.trim() === '') {
        throw new Error('File is empty');
      }

      this.rawData = fileData.content;
      const ext = fileData.extension ? fileData.extension.toLowerCase() : '';
      console.log(`Processing file type: ${ext}, Content length: ${fileData.content.length}`);

      let processedResult = null;
      if (ext === '.csv') {
        processedResult = this.processCSV(fileData.content);
      } else if (ext === '.json') {
        processedResult = this.processJSON(fileData.content);
      } else {
        throw new Error(`Unsupported file type: ${ext}. Please use CSV or JSON files.`);
      }
      
      // Check if processing succeeded and returned data points
      if (!processedResult || !Array.isArray(processedResult) || processedResult.length === 0) {
        console.warn('File processing did not return valid visualization data.');
        throw new Error('Failed to extract valid data points from the file.');
      }
      
      console.log(`DataProcessor: processFile finished, returning ${processedResult.length} points.`);
      return processedResult;

    } catch (error) {
      console.error('Error in DataProcessor.processFile:', error);
      // Rethrow the error so UIController can catch it
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  /**
   * Process CSV data
   * @param {string} csvData - Raw CSV text
   * @returns {Array} Processed data points
   */
  processCSV(csvData) {
    console.log('DataProcessor: processCSV called');
    try {
      if (!csvData || csvData.trim() === '') {
        throw new Error('CSV data is empty');
      }
      
      if (typeof Papa === 'undefined') {
        throw new Error('CSV parsing library (PapaParse) is not available');
      }
      
      console.log('Parsing CSV data with PapaParse...');
      const parseResult = Papa.parse(csvData, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        transform: value => typeof value === 'string' ? value.trim() : value
      });
      
      if (parseResult.errors && parseResult.errors.length > 0) {
        const errorMessages = parseResult.errors.map(e => `Row ${e.row}: ${e.message}`).join('; ');
        console.error('CSV parsing errors:', errorMessages);
        throw new Error(`CSV parsing failed: ${errorMessages}`);
      }
      
      if (!parseResult.data || !Array.isArray(parseResult.data) || parseResult.data.length === 0) {
        console.warn('PapaParse returned no data or invalid data format.');
        throw new Error('CSV parsing resulted in empty or invalid data.');
      }
      
      console.log(`CSV parsed: ${parseResult.data.length} rows found.`);
      this.processedData = parseResult.data;
      this.dataColumns = parseResult.meta.fields ? parseResult.meta.fields.filter(Boolean) : [];
      
      if (this.dataColumns.length === 0) {
        throw new Error('No valid column headers found in CSV');
      }
      
      console.log('Analyzing data types...');
      this.analyzeDataTypes();
      
      console.log('Preparing visualization data from CSV...');
      return this.prepareVisualizationData(); // Default layout
    } catch (error) {
      console.error('Error processing CSV:', error);
      throw new Error(`CSV processing error: ${error.message}`); // Rethrow
    }
  }

  /**
   * Process JSON data
   * @param {string} jsonData - Raw JSON text
   * @returns {Object} Processed data
   */
  processJSON(jsonData) {
    if (!jsonData || jsonData.trim() === '') {
      throw new Error('Empty JSON data provided');
    }
    
    console.log('Processing JSON data...');
    
    try {
      const parsedData = JSON.parse(jsonData);
      
      // Handle array of objects (most common format)
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        // Store the processed data
        this.processedData = parsedData;
        
        // Extract column names from the first object
        this.dataColumns = Object.keys(parsedData[0]);
        
        console.log(`JSON processed: ${this.processedData.length} rows, ${this.dataColumns.length} columns`);
        console.log('Columns found:', this.dataColumns);
        
      } else {
        throw new Error('JSON format not supported. Please use an array of objects where each object represents a data point.');
      }
      
      // Analyze data types
      this.analyzeDataTypes();
      
      // Validate sufficient numeric columns for 3D
      if (this.metaData.numericColumns.length < 3) {
        throw new Error(`Not enough numeric columns for 3D visualization. Found ${this.metaData.numericColumns.length}, need at least 3.`);
      }
      
      // Prepare visualization data
      return this.prepareVisualizationData();
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error(`JSON processing error: ${error.message}`);
    }
  }

  /**
   * Analyze data types to determine numeric and categorical columns
   */
  analyzeDataTypes() {
    this.metaData.numericColumns = [];
    this.metaData.categoricalColumns = [];
    this.metaData.dataStats = {};

    // Skip if no data
    if (!this.processedData || this.processedData.length === 0) {
      console.warn('No data to analyze types');
      return;
    }

    console.log('Analyzing data types for columns...');
    
    // Analyze each column
    this.dataColumns.forEach(column => {
      // Skip undefined columns
      if (!column) {
        console.warn('Undefined column name detected and skipped');
        return;
      }
      
      // Check first few non-null values to determine type
      const sampleValues = this.processedData
        .slice(0, Math.min(100, this.processedData.length))
        .map(row => row[column])
        .filter(val => val !== null && val !== undefined);
      
      // If no values are found, skip
      if (sampleValues.length === 0) {
        console.warn(`Column "${column}" has no valid values in sample and will be classified as categorical`);
        this.metaData.categoricalColumns.push(column);
        return;
      }
      
      // Check if all values in the sample are numbers
      const allNumbers = sampleValues.every(val => {
        if (typeof val === 'number' && !isNaN(val)) return true;
        if (typeof val === 'string' && !isNaN(parseFloat(val)) && val.trim() !== '') return true;
        return false;
      });

      if (allNumbers) {
        this.metaData.numericColumns.push(column);
        
        try {
          // Calculate basic statistics for numeric columns
          const values = this.processedData
            .map(row => {
              const val = row[column];
              return typeof val === 'number' ? val : parseFloat(val);
            })
            .filter(val => !isNaN(val));
          
          if (values.length > 0) {
            this.metaData.dataStats[column] = {
              min: Math.min(...values),
              max: Math.max(...values),
              mean: values.reduce((sum, val) => sum + val, 0) / values.length,
              count: values.length
            };
          } else {
            throw new Error(`No valid numeric values in column "${column}"`);
          }
        } catch (error) {
          console.error(`Error calculating stats for "${column}":`, error);
          this.metaData.dataStats[column] = { error: error.message };
        }
      } else {
        this.metaData.categoricalColumns.push(column);
        
        try {
          // Count categories
          const categories = {};
          this.processedData.forEach(row => {
            const val = row[column];
            if (val !== null && val !== undefined) {
              const strVal = String(val);
              categories[strVal] = (categories[strVal] || 0) + 1;
            }
          });
          this.metaData.dataStats[column] = { 
            categories,
            uniqueCount: Object.keys(categories).length
          };
        } catch (error) {
          console.error(`Error calculating categories for "${column}":`, error);
          this.metaData.dataStats[column] = { error: error.message };
        }
      }
    });
    
    console.log('Data type analysis complete:');
    console.log('- Numeric columns:', this.metaData.numericColumns);
    console.log('- Categorical columns:', this.metaData.categoricalColumns);
  }

  /**
   * Prepare data for visualization in 3D space
   * @param {string} layout - Layout algorithm to use (scatter, grid, kmeans)
   * @param {Object} options - Additional options: { kmeansClusters, colorColumn, filterColumn, filterValue, xColumn, yColumn, zColumn }
   * @returns {Array} Filtered and processed data points for 3D rendering
   */
  prepareVisualizationData(layout = 'scatter', options = {}) {
    console.log(`DataProcessor: prepareVisualizationData called with layout: ${layout}, options:`, options);
    if (!this.processedData || this.processedData.length === 0) {
      console.warn('No processed data available for visualization');
      return [];
    }

    let filteredData = this.processedData;
    // Apply filtering if specified
    if (options.filterColumn && options.filterValue) {
      console.log(`Applying filter: Column='${options.filterColumn}', Value='${options.filterValue}'`);
      const filterCol = options.filterColumn;
      const filterValLower = options.filterValue.toLowerCase();
      filteredData = this.processedData.filter(row => {
        const rowValue = row[filterCol];
        return rowValue !== null && rowValue !== undefined && 
               String(rowValue).toLowerCase().includes(filterValLower);
      });
      console.log(`${filteredData.length} rows remaining after filtering.`);
      if (filteredData.length === 0) {
        console.warn('Filtering resulted in zero data points.');
        // Return empty array, UI should handle this message
        return [];
      }
    } else {
      console.log('No filter applied.');
    }

    console.log(`Preparing visualization data using ${layout} layout for ${filteredData.length} items.`);
    
    // Ensure we have numeric columns (using original processedData for analysis if filter is active)
    this.ensureNumericColumns(this.processedData); 
    
    const xColumn = options.xColumn || this.metaData.numericColumns[0];
    const yColumn = options.yColumn || this.metaData.numericColumns[1];
    const zColumn = options.zColumn || this.metaData.numericColumns[2];
    
    // Determine color column: use option, fallback to default, ensure it exists
    let colorColumn = options.colorColumn || '';
    if (!colorColumn || !this.dataColumns.includes(colorColumn)) {
        colorColumn = this.dataColumns.length > 3 ? this.dataColumns[3] : this.dataColumns[0]; 
    }
                      
    console.log(`Using columns - X: ${xColumn}, Y: ${yColumn}, Z: ${zColumn}, Color: ${colorColumn}`);

    // Create color map based on the *original* data's stats for consistency if filtered
    const colorMap = this.createColorMap(colorColumn, this.processedData);

    let visualizationData = [];
    try {
      switch (layout) {
        case 'scatter':
          visualizationData = this.createScatterLayout(filteredData, xColumn, yColumn, zColumn, colorColumn, colorMap);
          break;
        case 'grid':
          visualizationData = this.createGridLayout(filteredData, colorColumn, colorMap);
          break;
        case 'kmeans':
          const k = options.kmeansClusters || 3;
          console.log(`Running K-Means clustering with K=${k}`);
          visualizationData = this.createKMeansLayout(filteredData, k, xColumn, yColumn, zColumn, colorColumn, colorMap);
          break;
        default:
          console.warn(`Unknown layout "${layout}", falling back to scatter`);
          visualizationData = this.createScatterLayout(filteredData, xColumn, yColumn, zColumn, colorColumn, colorMap);
      }
      console.log(`Layout generation complete, created ${visualizationData.length} visualization points.`);
      return visualizationData;
    } catch (error) {
      console.error(`Error creating ${layout} layout:`, error);
      throw new Error(`Visualization preparation error: ${error.message}`); // Rethrow
    }
  }
  
  /**
   * Ensures at least 3 numeric columns exist, deriving if necessary.
   * Operates on a provided dataset (e.g., original data before filtering)
   * @param {Array} dataSet - The dataset to check and potentially modify.
   */
  ensureNumericColumns(dataSet) {
    if (!dataSet || dataSet.length === 0) return; // No data to check
    // Analyze only if not already done or if columns seem insufficient
    if (this.metaData.numericColumns.length < 3) {
      console.warn(`Only found ${this.metaData.numericColumns.length} numeric columns, attempting to derive columns.`);
      let derived = false;
      if (!this.metaData.numericColumns.includes('_index') && this.metaData.numericColumns.length < 3) {
        console.log('Using row indices for potential X dimension');
        this.metaData.numericColumns.push('_index');
        dataSet.forEach((row, index) => { row['_index'] = index; });
        derived = true;
      }
      if (!this.metaData.numericColumns.includes('_derived_y') && this.metaData.numericColumns.length < 3) {
        const xCol = this.metaData.numericColumns[0];
        console.log(`Deriving Y from ${xCol}`);
        this.metaData.numericColumns.push('_derived_y');
        dataSet.forEach(row => {
          const xVal = parseFloat(row[xCol]) || 0;
          row['_derived_y'] = xVal * 0.8 + (Math.random() - 0.5) * 20;
        });
        derived = true;
      }
      if (!this.metaData.numericColumns.includes('_derived_z') && this.metaData.numericColumns.length < 3) {
        const xCol = this.metaData.numericColumns[0];
        const yCol = this.metaData.numericColumns[1];
        console.log(`Deriving Z from ${xCol} and ${yCol}`);
        this.metaData.numericColumns.push('_derived_z');
        dataSet.forEach(row => {
          const xVal = parseFloat(row[xCol]) || 0;
          const yVal = parseFloat(row[yCol]) || 0;
          row['_derived_z'] = (xVal + yVal) * 0.5 + (Math.random() - 0.5) * 15;
        });
        derived = true;
      }
      // Re-analyze types and stats if columns were derived
      if (derived) {
        console.log('Re-analyzing data types after deriving columns...');
        this.analyzeDataTypes(); // Analyze the original processedData
      }
    }
  }

  /**
   * Create a 3D scatter plot layout
   * @param {Array} data - Data points to layout (potentially filtered)
   * @param {string} xColumn - Column for X axis
   * @param {string} yColumn - Column for Y axis
   * @param {string} zColumn - Column for Z axis
   * @param {string} colorColumn - Column for coloring
   * @param {Object} colorMap - Pre-generated color map
   * @returns {Array} Data points with 3D coordinates
   */
  createScatterLayout(data, xColumn, yColumn, zColumn, colorColumn, colorMap) {
    console.log('Creating scatter layout...');
    
    // Validate columns (using this.dataColumns which holds all original columns)
    if (!this.dataColumns.includes(xColumn) || !this.dataColumns.includes(yColumn) || !this.dataColumns.includes(zColumn)) {
      throw new Error(`One or more coordinate columns (${xColumn}, ${yColumn}, ${zColumn}) not found.`);
    }
    
    // Get stats from original data for consistent normalization
    const xStats = this.getColumnStats(xColumn, this.processedData);
    const yStats = this.getColumnStats(yColumn, this.processedData);
    const zStats = this.getColumnStats(zColumn, this.processedData);

    // Map data points to 3D coordinates
    const visualizationData = data.map((row, index) => {
      const xValue = row[xColumn] !== undefined && row[xColumn] !== null ? row[xColumn] : 0;
      const yValue = row[yColumn] !== undefined && row[yColumn] !== null ? row[yColumn] : 0;
      const zValue = row[zColumn] !== undefined && row[zColumn] !== null ? row[zColumn] : 0;
      
      const x = parseFloat(xValue) || 0;
      const y = parseFloat(yValue) || 0;
      const z = parseFloat(zValue) || 0;
      
      // Normalize values based on original data range
      const normalizedX = this.normalizeValue(x, xStats.min, xStats.max, -50, 50);
      const normalizedY = this.normalizeValue(y, yStats.min, yStats.max, -50, 50);
      const normalizedZ = this.normalizeValue(z, zStats.min, zStats.max, -50, 50);
      
      const color = this.getColor(row[colorColumn], colorMap);
      const label = this.createLabel(row, index, [xColumn, yColumn, zColumn, colorColumn]);
      
      return {
        id: `point-${index}`,
        position: { x: normalizedX, y: normalizedY, z: normalizedZ },
        originalData: row,
        color: color,
        label: label
      };
    }).filter(point => point !== null); // Filter out any nulls if error occurred
    
    console.log(`Scatter layout created with ${visualizationData.length} points`);
    return visualizationData;
  }

  /**
   * Create a grid layout
   * @param {Array} data - Data points to layout (potentially filtered)
   * @param {string} colorColumn - Column for coloring
   * @param {Object} colorMap - Pre-generated color map
   * @returns {Array} Data points arranged in a grid
   */
  createGridLayout(data, colorColumn, colorMap) {
    console.log('Creating grid layout...');
    const totalPoints = data.length;
    const gridSize = Math.ceil(Math.cbrt(totalPoints));
    const spacing = 10;
    
    const visualizationData = data.map((row, index) => {
      const x = (index % gridSize) * spacing - (gridSize * spacing / 2);
      const y = (Math.floor(index / gridSize) % gridSize) * spacing - (gridSize * spacing / 2);
      const z = Math.floor(index / (gridSize * gridSize)) * spacing - (gridSize * spacing / 2);
      
      const color = this.getColor(row[colorColumn], colorMap);
      const label = this.createLabel(row, index, [colorColumn]);
      
      return {
        id: `point-${index}`,
        position: { x, y, z },
        originalData: row,
        color: color,
        label: label
      };
    });
    console.log(`Grid layout created with ${visualizationData.length} points`);
    return visualizationData;
  }
  
  /**
   * Create layout based on K-Means clustering
   * @param {Array} data - Data points to cluster and layout (potentially filtered)
   * @param {number} k - Number of clusters
   * @param {string} xColumn - Column for X coordinate (used for clustering)
   * @param {string} yColumn - Column for Y coordinate (used for clustering)
   * @param {string} zColumn - Column for Z coordinate (used for clustering)
   * @param {string} colorColumn - Column to use for *original* coloring within clusters
   * @param {Object} colorMap - Pre-generated color map for the original color column
   * @returns {Array} Data points arranged by clusters
   */
  createKMeansLayout(data, k, xColumn, yColumn, zColumn, colorColumn, colorMap) {
      console.log(`Creating K-Means layout with K=${k}`);
      
      // 1. Prepare data for clustering (use normalized coordinates)
      const pointsToCluster = data.map((row) => {
          const x = parseFloat(row[xColumn]) || 0;
          const y = parseFloat(row[yColumn]) || 0;
          const z = parseFloat(row[zColumn]) || 0;
          // Normalize based on original stats for clustering stability
          const normX = this.normalizeValue(x, this.getColumnStats(xColumn, this.processedData).min, this.getColumnStats(xColumn, this.processedData).max);
          const normY = this.normalizeValue(y, this.getColumnStats(yColumn, this.processedData).min, this.getColumnStats(yColumn, this.processedData).max);
          const normZ = this.normalizeValue(z, this.getColumnStats(zColumn, this.processedData).min, this.getColumnStats(zColumn, this.processedData).max);
          return { originalRow: row, features: [normX, normY, normZ] };
      });

      // 2. Run K-Means
      const { clusters, centroids } = this.runKMeans(pointsToCluster.map(p => p.features), k);
      console.log(`K-Means finished. Found ${centroids.length} centroids.`);
      
      // 3. Assign cluster index back to data
      pointsToCluster.forEach((point, index) => {
          point.clusterIndex = clusters[index];
      });
      
      // 4. Create visualization data
      // Generate distinct colors for clusters
      const clusterColorMap = {};
      for (let i = 0; i < k; i++) {
          clusterColorMap[i] = this.hslToHex(i / k, 0.8, 0.6);
      }
      
      // Position clusters roughly based on centroid normalized positions
      const clusterSpreadFactor = 60; // How far apart clusters appear
      const withinClusterSpread = 15; // How spread out points are within a cluster

      const visualizationData = pointsToCluster.map((point, index) => {
          const clusterIndex = point.clusterIndex;
          
          // === Defensive Check ===
          if (clusterIndex === undefined || clusterIndex < 0 || clusterIndex >= centroids.length) {
              console.error(`DataProcessor: Invalid clusterIndex (${clusterIndex}) for point ${index}. Centroids count: ${centroids.length}`);
              // Assign to a default position or skip
              return { 
                  id: `point-${index}-error`,
                  position: { x: 0, y: 0, z: 0 }, 
                  originalData: point.originalRow,
                  cluster: -1, 
                  color: '#FF0000', // Red for error
                  label: `Error: Invalid cluster index for point ${index}`
              };
          }
          // === End Check ===
          
          const centroid = centroids[clusterIndex]; // Normalized centroid
          
          // === Defensive Check ===
          if (!Array.isArray(centroid) || centroid.length !== dimensions) {
              console.error(`DataProcessor: Invalid centroid structure for cluster ${clusterIndex}:`, centroid);
               return { 
                  id: `point-${index}-error`,
                  position: { x: 0, y: 0, z: 0 }, 
                  originalData: point.originalRow,
                  cluster: clusterIndex, 
                  color: '#FF0000', // Red for error
                  label: `Error: Invalid centroid for cluster ${clusterIndex}, point ${index}`
              };
          }
          // === End Check ===
          
          // Base position from normalized centroid, scaled up
          const baseX = (centroid[0] - 0.5) * clusterSpreadFactor * 2;
          const baseY = (centroid[1] - 0.5) * clusterSpreadFactor * 2;
          const baseZ = (centroid[2] - 0.5) * clusterSpreadFactor * 2;
          
          // Add random offset within the cluster
          const offsetX = (Math.random() - 0.5) * withinClusterSpread;
          const offsetY = (Math.random() - 0.5) * withinClusterSpread;
          const offsetZ = (Math.random() - 0.5) * withinClusterSpread;
          
          const finalX = baseX + offsetX;
          const finalY = baseY + offsetY;
          const finalZ = baseZ + offsetZ;
          
          // Use cluster color for the node
          const color = clusterColorMap[clusterIndex];
          // Create label showing cluster and original color value
          const label = this.createLabel(point.originalRow, index, [colorColumn], `Cluster ${clusterIndex}`);
          
          return {
              id: `point-${index}`,
              position: { x: finalX, y: finalY, z: finalZ },
              originalData: point.originalRow,
              cluster: clusterIndex, // Add cluster info
              color: color,
              label: label
          };
      });
      
      console.log(`K-Means layout created with ${visualizationData.length} points.`);
      return visualizationData;
  }
  
  /**
   * Simple K-Means Implementation
   * @param {Array<Array<number>>} dataPoints - Array of points, each an array of features.
   * @param {number} k - Number of clusters.
   * @param {number} maxIterations - Max iterations to prevent infinite loops.
   * @returns {{clusters: Array<number>, centroids: Array<Array<number>>}}
   */
  runKMeans(dataPoints, k, maxIterations = 50) {
      if (dataPoints.length === 0) return { clusters: [], centroids: [] };
      const dimensions = dataPoints[0].length;

      // Initialize centroids randomly from data points
      let centroids = [];
      let usedIndices = new Set();
      while (centroids.length < k && centroids.length < dataPoints.length) {
          let randomIndex = Math.floor(Math.random() * dataPoints.length);
          if (!usedIndices.has(randomIndex)) {
              centroids.push([...dataPoints[randomIndex]]);
              usedIndices.add(randomIndex);
          }
      }
      // Handle cases where k > number of unique points if needed
      k = centroids.length; 

      let assignments = new Array(dataPoints.length);
      let changed = true;
      let iterations = 0;

      while (changed && iterations < maxIterations) {
          changed = false;
          iterations++;

          // Assign points to the nearest centroid
          for (let i = 0; i < dataPoints.length; i++) {
              let minDist = Infinity;
              let bestCluster = -1;
              for (let j = 0; j < k; j++) {
                  let dist = this.euclideanDistance(dataPoints[i], centroids[j]);
                  if (dist < minDist) {
                      minDist = dist;
                      bestCluster = j;
                  }
              }
              if (assignments[i] !== bestCluster) {
                  assignments[i] = bestCluster;
                  changed = true;
              }
          }

          // Recalculate centroids
          if (changed) {
              const newCentroids = new Array(k).fill(0).map(() => new Array(dimensions).fill(0));
              let counts = new Array(k).fill(0);
              for (let i = 0; i < dataPoints.length; i++) {
                  let cluster = assignments[i];
                  // === Defensive Check ===
                  if (cluster === undefined || cluster < 0 || cluster >= k) {
                      console.error(`KMeans: Invalid cluster assignment (${cluster}) for point ${i} during centroid recalc.`);
                      continue; // Skip this point if assignment is bad
                  }
                  // === End Check ===
                  counts[cluster]++;
                  for (let d = 0; d < dimensions; d++) {
                      // === Defensive Check ===
                      if (isNaN(dataPoints[i][d])) {
                          console.warn(`KMeans: NaN feature value encountered for point ${i}, dimension ${d}. Skipping contribution.`);
                          continue;
                      }
                      // === End Check ===
                      newCentroids[cluster][d] += dataPoints[i][d];
                  }
              }
              for (let j = 0; j < k; j++) {
                  if (counts[j] > 0) {
                      for (let d = 0; d < dimensions; d++) {
                          newCentroids[j][d] /= counts[j];
                      }
                      // === Log Check ===
                      // console.log(`KMeans: Centroid ${j} updated to:`, newCentroids[j].map(v => v.toFixed(3)));
                      // === End Log Check ===
                  } else {
                      console.warn(`KMeans: Cluster ${j} became empty. Re-initializing centroid.`);
                      // Reinitialize centroid randomly but ensure it's a valid point
                      let randomIndex = Math.floor(Math.random() * dataPoints.length);
                      newCentroids[j] = [...dataPoints[randomIndex]]; 
                      // Mark as changed to ensure another iteration if assignments shift due to reinitialization
                      changed = true; 
                  }
              }
              centroids = newCentroids;
          }
      }
      console.log(`K-Means completed in ${iterations} iterations.`);
      return { clusters: assignments, centroids };
  }

  /** Calculate Euclidean distance */
  euclideanDistance(point1, point2) {
      let sum = 0;
      for (let i = 0; i < point1.length; i++) {
          sum += Math.pow(point1[i] - point2[i], 2);
      }
      return Math.sqrt(sum);
  }
  
  /**
   * Get statistics for a column (using a specific dataset if provided)
   * @param {string} column - Column name
   * @param {Array} [dataSet=this.processedData] - Optional dataset to calculate stats from
   * @returns {Object} Min, max, and mean values
   */
  getColumnStats(column, dataSet = this.processedData) {
    // Use memoized stats if calculating on the main processedData
    if (dataSet === this.processedData && this.metaData.dataStats[column] && this.metaData.dataStats[column].min !== undefined) {
      return this.metaData.dataStats[column];
    }
    
    if (!dataSet || dataSet.length === 0) { 
        return { min: 0, max: 0, mean: 0 }; // Default stats for empty data
    }
    
    const values = dataSet
      .map(row => parseFloat(row[column])) // Ensure numeric conversion
      .filter(val => !isNaN(val)); // Filter out NaNs
      
    if (values.length === 0) {
        console.warn(`No valid numeric values found for column "${column}" in the provided dataset.`);
        return { min: 0, max: 0, mean: 0 }; // Default stats if no valid numbers
    }
      
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Memoize if calculating on the main dataset
    if (dataSet === this.processedData) {
        if (!this.metaData.dataStats[column]) this.metaData.dataStats[column] = {};
        this.metaData.dataStats[column].min = min;
        this.metaData.dataStats[column].max = max;
        this.metaData.dataStats[column].mean = mean;
    }
    
    return { min, max, mean };
  }
  
  /**
   * Create a color mapping for a column
   * @param {string} column - Column to map colors for
   * @param {Array} [dataSet=this.processedData] - Optional dataset to base map on
   * @returns {Object} Mapping of values to colors
   */
  createColorMap(column, dataSet = this.processedData) {
    console.log(`Creating color map for column: ${column}`);
    if (!column || !this.dataColumns.includes(column)) {
        console.warn(`Color column \"${column}\" not found or invalid. Using default.`);
        column = this.dataColumns[0]; 
        if (!column) return { type: 'error', message: 'No valid columns available for coloring.' }; // Handle no columns case
    }
    
    const columnType = this.metaData.numericColumns.includes(column) ? 'numeric' : 'categorical';
    
    if (columnType === 'numeric') {
      const stats = this.getColumnStats(column, dataSet);
      console.log(`Numeric color map range: ${stats.min} - ${stats.max}`);
      // If min and max are the same, handle potential division by zero in getColor
      if (stats.min === stats.max) {
          console.warn(`Numeric column \"${column}\" has uniform values. Using single color.`);
          return {
              type: 'numeric',
              min: stats.min,
              max: stats.max,
              isUniform: true
          }
      }
      return {
        type: 'numeric',
        min: stats.min,
        max: stats.max,
        isUniform: false
      };
    } else {
      const colorMap = {};
      const uniqueValues = [...new Set(
        dataSet
          .map(row => row[column])
          .filter(val => val !== null && val !== undefined)
      )].sort(); // Sort for more consistent color assignment
      
      console.log(`Categorical color map for ${uniqueValues.length} unique values.`);
      
      // Generate a base hue, then create analogous colors around it
      const baseHue = Math.random(); // Base hue (0-1)
      const hueSpread = 0.3; // How much the hue varies (adjust as needed)
      const saturation = 0.65; // Keep saturation relatively consistent
      const lightness = 0.6;  // Keep lightness consistent

      uniqueValues.forEach((value, index) => {
        const hueOffset = (index / Math.max(1, uniqueValues.length -1) - 0.5) * hueSpread; // Center spread around base
        const hue = (baseHue + hueOffset + 1) % 1; // Calculate hue and wrap around
        colorMap[value] = this.hslToHex(hue, saturation, lightness);
      });
      
      return {
        type: 'categorical',
        map: colorMap
      };
    }
  }

  /**
   * Helper function to create a label string for a data point
   * @param {Object} row - The original data row
   * @param {number} index - The index of the point
   * @param {Array<string>} columnsToShow - Specific columns to include
   * @param {string} [prefix=''] - Optional prefix (e.g., Cluster info)
   * @returns {string} Formatted HTML label
   */
  createLabel(row, index, columnsToShow = [], prefix = '') {
    let label = prefix ? `<strong>${prefix}</strong><br>ID: ${index}<br>` : `<strong>Point ${index}</strong><br>`;
    const format = val => (typeof val === 'number' && !Number.isInteger(val)) ? val.toFixed(2) : val;
    
    const displayedColumns = new Set(columnsToShow);
    
    // Add specified columns first
    columnsToShow.forEach(col => {
        if (row.hasOwnProperty(col)) {
            label += `${col}: ${format(row[col])}<br>`;
        }
    });

    // Optionally add other relevant columns (or limit total lines)
    // let lineCount = columnsToShow.length;
    // const maxLines = 7;
    // for (const [key, value] of Object.entries(row)) {
    //     if (lineCount >= maxLines) break;
    //     if (!displayedColumns.has(key) && !key.startsWith('_')) { // Don't show internal columns
    //         label += `${key}: ${format(value)}<br>`;
    //         lineCount++;
    //     }
    // }
    
    return label.trim();
  }

  /**
   * Normalize a value to a specified range
   * @param {number} value - Value to normalize
   * @param {number} min - Minimum value in original range
   * @param {number} max - Maximum value in original range
   * @param {number} newMin - Minimum value in new range
   * @param {number} newMax - Maximum value in new range
   * @returns {number} Normalized value
   */
  normalizeValue(value, min, max, newMin, newMax) {
    // Handle string values
    const numValue = typeof value === 'number' ? value : parseFloat(value);
    
    // Handle NaN, null, etc.
    if (isNaN(numValue)) return 0;
    
    // Prevent division by zero
    if (min === max) return (newMin + newMax) / 2;
    
    return ((numValue - min) / (max - min)) * (newMax - newMin) + newMin;
  }

  /**
   * Get a color for a value based on a color map
   * @param {any} value - Value to get color for
   * @param {Object} colorMap - Color mapping
   * @returns {string} Hex color code
   */
  getColor(value, colorMap) {
    if (!colorMap || colorMap.type === 'error') return '#FFFFFF'; // Default white if error or no map
    
    if (colorMap.type === 'numeric') {
      // Handle case where all numeric values are the same
      if (colorMap.isUniform) {
          return this.hslToHex(0.6, 0.7, 0.5); // Use a default color (e.g., blue)
      }
      // For numeric values, interpolate on a gradient (e.g., blue to yellow)
      const normalizedValue = this.normalizeValue(value, colorMap.min, colorMap.max, 0, 1);
      // Interpolate hue from blue (0.6) to yellow (0.16)
      const hue = 0.6 - normalizedValue * 0.44; 
      return this.hslToHex(hue, 0.7, 0.5); 
    } else {
      // For categorical values, use the map
      return colorMap.map[value] || '#CCCCCC'; // Default grey for unknown categories
    }
  }

  /**
   * Convert HSL color values to hex
   * @param {number} h - Hue (0-1)
   * @param {number} s - Saturation (0-1)
   * @param {number} l - Lightness (0-1)
   * @returns {string} Hex color code
   */
  hslToHex(h, s, l) {
    h = h % 1;
    let r, g, b;

    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  /**
   * Get information about the loaded data
   * @returns {Object} Data information and statistics
   */
  getDataInfo() {
    if (!this.processedData) return null;
    
    return {
      rowCount: this.processedData.length,
      columns: this.dataColumns,
      numericColumns: this.metaData.numericColumns,
      categoricalColumns: this.metaData.categoricalColumns,
      stats: this.metaData.dataStats
    };
  }

  /**
   * Simple outlier detection based on average distance in normalized 3D space.
   * Points further than 'threshold' standard deviations from the mean average distance are considered outliers.
   * @param {number} threshold - Standard deviation threshold (e.g., 1.5 or 2)
   * @returns {{outlierIndices: Array<number>, nonOutlierIndices: Array<number>}}
   */
  detectOutliers(threshold = 1.5) {
    console.log(`Detecting outliers with threshold: ${threshold} std dev`);
    if (!this.processedData || this.processedData.length < 3) {
      console.warn('Not enough data for outlier detection.');
      return { outlierIndices: [], nonOutlierIndices: [] };
    }
    
    // Use the current visualization coordinates (assuming they exist on originalData or were prepared)
    // We need the *visualized* positions for spatial outlier detection.
    // Let's assume prepareVisualizationData was called first and we have points with a .position property
    // For robustness, let's re-prepare with current settings if needed (or get cached points)
    // NOTE: This assumes the *current* layout is relevant for spatial outliers.
    const currentVizData = this.prepareVisualizationData(window.uiController?.currentSettings?.layout || 'scatter', 
                                                    window.uiController?.currentSettings || {});
    
    if (!currentVizData || currentVizData.length === 0) {
         console.warn('No current visualization data available for outlier detection.');
         return { outlierIndices: [], nonOutlierIndices: [] };
    }

    const positions = currentVizData.map(p => p.position); // Get {x, y, z} positions
    const numPoints = positions.length;
    const avgDistances = new Array(numPoints).fill(0);

    // Calculate average distance for each point to all other points
    for (let i = 0; i < numPoints; i++) {
      let totalDist = 0;
      for (let j = 0; j < numPoints; j++) {
        if (i === j) continue;
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const dz = positions[i].z - positions[j].z;
        totalDist += Math.sqrt(dx*dx + dy*dy + dz*dz);
      }
      avgDistances[i] = totalDist / (numPoints - 1);
    }

    // Calculate mean and standard deviation of average distances
    const meanAvgDist = avgDistances.reduce((sum, d) => sum + d, 0) / numPoints;
    const variance = avgDistances.reduce((sum, d) => sum + Math.pow(d - meanAvgDist, 2), 0) / numPoints;
    const stdDevAvgDist = Math.sqrt(variance);

    console.log(`Outlier Detection Stats: Mean Avg Dist=${meanAvgDist.toFixed(2)}, Std Dev=${stdDevAvgDist.toFixed(2)}`);

    const outlierIndices = [];
    const nonOutlierIndices = [];
    const outlierThresholdValue = meanAvgDist + threshold * stdDevAvgDist;
    
    // Find original indices of outliers
    avgDistances.forEach((avgDist, index) => {
      const originalIndex = currentVizData[index].originalData._index; // Assumes _index exists
      if (avgDist > outlierThresholdValue) {
        outlierIndices.push(originalIndex !== undefined ? originalIndex : index); // Use original index if possible
      } else {
        nonOutlierIndices.push(originalIndex !== undefined ? originalIndex : index);
      }
    });

    console.log(`Found ${outlierIndices.length} potential outliers.`);
    return { outlierIndices, nonOutlierIndices };
  }
  
  /**
   * Calculate Pearson correlation between two numeric columns.
   * @param {string} col1Name - Name of the first numeric column.
   * @param {string} col2Name - Name of the second numeric column.
   * @returns {number|null} Correlation coefficient, or null if calculation fails.
   */
  calculatePearsonCorrelation(col1Name, col2Name) {
    console.log(`Calculating Pearson correlation between ${col1Name} and ${col2Name}`);
    if (!this.processedData) return null;

    let values1 = [];
    let values2 = [];

    this.processedData.forEach(row => {
        const val1 = parseFloat(row[col1Name]);
        const val2 = parseFloat(row[col2Name]);
        // Include row only if both values are valid numbers
        if (!isNaN(val1) && !isNaN(val2)) {
            values1.push(val1);
            values2.push(val2);
        }
    });

    const n = values1.length;
    if (n < 2) {
      console.warn('Not enough valid data points for correlation calculation.');
      return null; // Need at least 2 points
    }

    const mean1 = values1.reduce((s, v) => s + v, 0) / n;
    const mean2 = values2.reduce((s, v) => s + v, 0) / n;

    let sumNumerator = 0;
    let sumDenom1 = 0;
    let sumDenom2 = 0;

    for (let i = 0; i < n; i++) {
        const diff1 = values1[i] - mean1;
        const diff2 = values2[i] - mean2;
        sumNumerator += diff1 * diff2;
        sumDenom1 += diff1 * diff1;
        sumDenom2 += diff2 * diff2;
    }

    const denom = Math.sqrt(sumDenom1) * Math.sqrt(sumDenom2);
    if (denom === 0) {
      console.warn('Correlation denominator is zero (likely constant values).');
      return 0; // Or null, depending on desired handling
    }

    const correlation = sumNumerator / denom;
    console.log(`Correlation coefficient: ${correlation.toFixed(3)}`);
    return correlation;
  }
  
  /**
   * Finds pairs of points (using original data indices) that have a high correlation 
   * between two specified columns.
   * @param {string} col1Name
   * @param {string} col2Name
   * @param {number} threshold - Minimum absolute correlation coefficient.
   * @returns {Array<Array<number>>} Array of pairs [originalIndex1, originalIndex2]
   */
  calculateCorrelations(col1Name, col2Name, threshold) {
    console.log(`DataProcessor: Calculating correlations between \"${col1Name}\" and \"${col2Name}\" with threshold ${threshold}`);
    if (!this.processedData || this.processedData.length < 2) {
      console.warn('DataProcessor: Not enough data for correlation calculation.');
      return [];
    }
    
    // Use current visualization data for indices if available, or fall back to processedData
    // Note: This assumes the visualization data corresponds 1:1 with processedData indices
    const dataToUse = this.currentVisualizationData || this.processedData;
    if (!dataToUse || dataToUse.length === 0) {
        console.warn('DataProcessor: No data available (processed or visualized) for correlation.');
        return [];
    }
    
    const column1 = dataToUse.map(row => parseFloat(row.originalData?.[col1Name] ?? row[col1Name])).filter(v => !isNaN(v));
    const column2 = dataToUse.map(row => parseFloat(row.originalData?.[col2Name] ?? row[col2Name])).filter(v => !isNaN(v));

    if (column1.length !== column2.length || column1.length === 0) {
      console.warn('DataProcessor: Mismatched or empty numeric data for correlation columns.');
      return [];
    }

    // Basic Pearson correlation calculation (replace with a library if complex stats needed)
    let sumXY = 0, sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0;
    const n = column1.length;
    for (let i = 0; i < n; i++) {
      sumX += column1[i];
      sumY += column2[i];
      sumXY += column1[i] * column2[i];
      sumX2 += column1[i] * column1[i];
      sumY2 += column2[i] * column2[i];
    }
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    if (denominator === 0) {
        console.log('DataProcessor: Correlation denominator is zero, cannot calculate.');
        return []; // Avoid division by zero
    }
    
    const correlation = numerator / denominator;
    console.log(`DataProcessor: Overall Pearson correlation between ${col1Name} and ${col2Name}: ${correlation.toFixed(4)}`);

    // For visualization, we need pairs of points with high correlation.
    // A simple approach: Return pairs if the overall correlation is high.
    // A more complex approach: Calculate pairwise correlations (computationally expensive).
    // Let's stick to the overall correlation threshold for now.
    const correlationPairs = [];
    if (Math.abs(correlation) >= threshold) {
        console.log(`DataProcessor: Overall correlation ${correlation.toFixed(4)} meets threshold ${threshold}. Creating lines between all points (simplification).`);
        // This is a simplification: Draw lines between *all* points if overall correlation is high
        // A better approach might involve local correlation or other metrics.
        // For now, let's just link the first N points as an example of returning pairs.
        const maxLines = Math.min(dataToUse.length, 50); // Limit lines for performance
        for (let i = 0; i < maxLines; i++) {
            for (let j = i + 1; j < maxLines; j++) {
                // Need original indices. Assuming dataToUse items have an 'originalIndex' or similar
                const index1 = dataToUse[i].originalIndex ?? i; // Fallback to loop index
                const index2 = dataToUse[j].originalIndex ?? j; // Fallback to loop index
                 correlationPairs.push({ 
                    point1Index: index1, 
                    point2Index: index2, 
                    correlationValue: correlation // Use overall correlation
                 });
            }
        }
        console.log(`DataProcessor: Generated ${correlationPairs.length} example correlation pairs based on overall high correlation.`);
    } else {
        console.log(`DataProcessor: Overall correlation ${correlation.toFixed(4)} does not meet threshold ${threshold}. No lines generated.`);
    }

    return correlationPairs;
  }
}

// Export the DataProcessor class
window.DataProcessor = DataProcessor;
