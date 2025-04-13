# 3D Data Sandbox - Testing Documentation

This document provides information about the test suite for the 3D Data Sandbox application.

## Available Tests

The project includes several tests to verify proper functionality:

1. **Basic File Import Tests** (`test-import.js`):
   - Tests reading and parsing of sample JSON and CSV files
   - Validates basic file format and content

2. **DataProcessor Tests** (`test-data-processor.js`):
   - Tests initialization of the DataProcessor class
   - Tests JSON and CSV processing functionality
   - Tests error handling for invalid data

3. **UI Controller Tests** (`ui-test.html`):
   - Browser-based test for the UIController functionality
   - Tests initialization, import functionality, and error handling
   - Provides a simple test harness for manual testing

## Running the Tests

### Basic File Import Tests

```bash
node test-import.js
```

This test verifies that the sample data files can be properly read and parsed.

### DataProcessor Tests

```bash
node test-data-processor.js
```

This test verifies that the DataProcessor class is working correctly.

### UI Controller Tests

Open the UI test page in a browser:

```bash
# If you have a simple HTTP server installed:
npx http-server .

# Then navigate to http://localhost:8080/ui-test.html
```

Or open the file directly in your browser:

```bash
open ui-test.html
```

## Sample Test Data

The test suite uses sample data files for testing:

- `sample-data.json`: Contains 10 sample data points in JSON format
- `sample-data.csv`: Contains the same data in CSV format

## Expected Test Results

### Basic File Import Tests
- Should read and parse JSON and CSV files successfully
- Should report the correct number of data points and columns

### DataProcessor Tests
- Should initialize successfully
- Should process JSON and CSV data
- Should validate data formats and handle errors

### UI Controller Tests
- Should initialize with mock dependencies
- Should handle data imports
- Should correctly handle error cases (empty files, invalid formats)

## Adding New Tests

To add new tests:

1. For Node.js tests:
   - Add test cases to existing test files or create new test files
   - Follow the existing patterns for consistent reporting

2. For browser tests:
   - Add new test buttons to `ui-test.html`
   - Implement the corresponding event handlers

## Troubleshooting

If tests fail, check the following:

1. Make sure all dependencies are properly installed:
   ```bash
   npm install
   ```

2. Verify that sample files exist:
   ```bash
   ls -la sample-data.*
   ```

3. Check for console errors in browser tests

4. Ensure the application is running correctly:
   ```bash
   npm run dev
   ``` 