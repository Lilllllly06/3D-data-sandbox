// PapaParse stub for 3D Data Sandbox
// This is a minimal implementation to make the application work

window.Papa = {
  parse: function(csvString, config) {
    config = config || {};
    
    // Basic CSV parsing
    const lines = csvString.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const results = [];
    
    // Parse each data row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      
      // Create an object with headers as keys
      for (let j = 0; j < headers.length; j++) {
        if (j < values.length) {
          const value = values[j].trim();
          // Basic type conversion (string to number if possible)
          if (!isNaN(value) && value !== '') {
            row[headers[j]] = parseFloat(value);
          } else {
            row[headers[j]] = value;
          }
        } else {
          row[headers[j]] = '';
        }
      }
      
      results.push(row);
    }
    
    // Create result object in PapaParse format
    const result = {
      data: results,
      errors: [],
      meta: {
        delimiter: ',',
        linebreak: '\n',
        aborted: false,
        truncated: false,
        fields: headers
      }
    };
    
    // Handle callbacks
    if (typeof config.complete === 'function') {
      config.complete(result);
    }
    
    return result;
  },
  
  // Simple unparse (convert data back to CSV)
  unparse: function(data, config) {
    config = config || {};
    
    let csvData = data;
    let fields = [];
    
    // Handle different data formats
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
        // Array of objects - extract field names from first object
        fields = Object.keys(data[0]);
        csvData = data;
      }
    } else if (typeof data === 'object' && data.fields && data.data) {
      // Data in PapaParse format
      fields = data.fields;
      csvData = data.data;
    }
    
    // Generate CSV
    let csv = fields.join(',') + '\n';
    
    for (let i = 0; i < csvData.length; i++) {
      const row = [];
      for (let j = 0; j < fields.length; j++) {
        let value = csvData[i][fields[j]];
        // Handle undefined or null values
        if (value === undefined || value === null) value = '';
        // Quote strings with commas
        if (typeof value === 'string' && value.includes(',')) {
          value = '"' + value + '"';
        }
        row.push(value);
      }
      csv += row.join(',') + '\n';
    }
    
    return csv;
  }
};

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = Papa;
}

console.log('PapaParse stub loaded successfully'); 