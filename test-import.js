const fs = require('fs');
const path = require('path');

// Test JSON file import
function testJsonImport() {
  console.log('Testing JSON import...');
  try {
    const jsonFile = path.join(__dirname, 'sample-data.json');
    const jsonContent = fs.readFileSync(jsonFile, 'utf8');
    
    console.log(`Read JSON file, size: ${jsonContent.length} bytes`);
    
    // Parse the JSON
    const data = JSON.parse(jsonContent);
    console.log(`Successfully parsed JSON with ${data.length} data points`);
    console.log('Sample point:', data[0]);
    
    return true;
  } catch (error) {
    console.error('JSON import test failed:', error);
    return false;
  }
}

// Test CSV file import
function testCsvImport() {
  console.log('Testing CSV import...');
  try {
    const csvFile = path.join(__dirname, 'sample-data.csv');
    const csvContent = fs.readFileSync(csvFile, 'utf8');
    
    console.log(`Read CSV file, size: ${csvContent.length} bytes`);
    
    // Basic validation for CSV (checking for commas and line breaks)
    if (!csvContent.includes(',') || !csvContent.includes('\n')) {
      throw new Error('CSV format validation failed');
    }
    
    // Count lines and columns
    const lines = csvContent.trim().split('\n');
    const headerColumns = lines[0].split(',').length;
    
    console.log(`CSV has ${lines.length} lines (including header)`);
    console.log(`CSV has ${headerColumns} columns`);
    console.log('Header:', lines[0]);
    
    return true;
  } catch (error) {
    console.error('CSV import test failed:', error);
    return false;
  }
}

// Run tests
function runTests() {
  console.log('Starting file import tests...');
  
  const jsonTestResult = testJsonImport();
  const csvTestResult = testCsvImport();
  
  console.log('\nTest Results:');
  console.log('-----------------');
  console.log(`JSON Import: ${jsonTestResult ? 'PASSED' : 'FAILED'}`);
  console.log(`CSV Import: ${csvTestResult ? 'PASSED' : 'FAILED'}`);
  
  if (jsonTestResult && csvTestResult) {
    console.log('\nAll tests passed! ✅');
  } else {
    console.log('\nSome tests failed! ❌');
    process.exit(1);
  }
}

runTests(); 