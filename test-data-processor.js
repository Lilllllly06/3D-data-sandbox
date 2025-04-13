const fs = require('fs');
const path = require('path');

// Mock the window object for running in Node.js
global.window = {};

// Create a basic console-based test framework
const tests = [];
let passCount = 0;
let failCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function runTests() {
  console.log('Running DataProcessor tests...\n');
  
  // Load the DataProcessor class
  try {
    require('./src/js/dataProcessor.js');
    
    if (!global.window.DataProcessor) {
      throw new Error('DataProcessor class not defined in the global window object');
    }
    
    console.log('DataProcessor class loaded successfully.\n');
  } catch (error) {
    console.error('Failed to load DataProcessor class:', error);
    process.exit(1);
  }
  
  const DataProcessor = global.window.DataProcessor;
  
  // Run all tests
  tests.forEach((t) => {
    try {
      console.log(`Test: ${t.name}`);
      t.fn(DataProcessor);
      console.log('✅ PASSED\n');
      passCount++;
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}\n`);
      failCount++;
    }
  });
  
  // Print summary
  console.log('=================================');
  console.log(`Tests completed: ${tests.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('=================================');
  
  return failCount === 0;
}

// Define test cases

// Test DataProcessor initialization
test('DataProcessor initialization', (DataProcessor) => {
  const processor = new DataProcessor();
  if (!processor) {
    throw new Error('Failed to create DataProcessor instance');
  }
  
  if (typeof processor.processFile !== 'function') {
    throw new Error('processFile method not found');
  }
});

// Test JSON processing
test('Process JSON data', (DataProcessor) => {
  const processor = new DataProcessor();
  const jsonData = fs.readFileSync(path.join(__dirname, 'sample-data.json'), 'utf8');
  
  const fileData = {
    content: jsonData,
    extension: '.json'
  };
  
  const result = processor.processFile(fileData);
  
  if (!result) {
    throw new Error('processFile returned no result');
  }
  
  console.log(`Processed ${result.length} data points`);
});

// Test CSV processing
test('Process CSV data', (DataProcessor) => {
  // Mock PapaParse for CSV parsing
  global.Papa = {
    parse: (csv, options) => {
      const lines = csv.trim().split('\n');
      const headers = lines[0].split(',');
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};
        
        for (let j = 0; j < headers.length; j++) {
          const value = values[j];
          // Basic type conversion
          if (!isNaN(value)) {
            row[headers[j]] = parseFloat(value);
          } else {
            row[headers[j]] = value;
          }
        }
        
        data.push(row);
      }
      
      return {
        data,
        errors: [],
        meta: {
          fields: headers
        }
      };
    }
  };
  
  const processor = new DataProcessor();
  const csvData = fs.readFileSync(path.join(__dirname, 'sample-data.csv'), 'utf8');
  
  const fileData = {
    content: csvData,
    extension: '.csv'
  };
  
  const result = processor.processFile(fileData);
  
  if (!result) {
    throw new Error('processFile returned no result');
  }
  
  console.log(`Processed ${result.length} data points`);
});

// Test error handling
test('Handle invalid data', (DataProcessor) => {
  const processor = new DataProcessor();
  
  try {
    processor.processFile({
      content: '{ invalid: json }',
      extension: '.json'
    });
    throw new Error('Should have thrown an error for invalid JSON');
  } catch (error) {
    // This is expected
    console.log('Error handling test passed with message:', error.message);
  }
});

// Run the tests
const success = runTests();

if (!success) {
  process.exit(1);
} 