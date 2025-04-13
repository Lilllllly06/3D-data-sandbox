# 3D Data Sandbox

A desktop application for visualizing and manipulating data in 3D space. Import CSV or JSON data files and explore them in a fully interactive 3D environment.

## 🎬 Demo

<video width="100%" controls>
  <source src="https://lilllly06.github.io/3D-data-sandbox/3D-data-box-demo.webm" type="video/webm">
  Your browser does not support the video tag.
</video>


## Features

- **3D Data Visualization**: View your data as interactive 3D points in space
- **Multiple Layout Algorithms**: Scatter plots, grid layouts, and K-means clustering
- **Interactive Navigation**: Rotate, zoom, and pan through your data
- **Point Selection**: Click on any data point to view its details
- **Customizable Appearance**: Adjust node size and display connections between points
- **Export & Save**: Save your scenes for later or export screenshots
- **Offline Usage**: All processing happens locally, no data leaves your computer

## System Requirements

- Windows, macOS, or Linux
- 4GB RAM minimum (8GB recommended for larger datasets)
- Modern GPU recommended for better performance

## Installation

### Download pre-built binaries

Download the latest release for your platform from the [Releases](https://github.com/Lilllllly06/3d-data-sandbox/releases) page.

### Build from source

1. Clone the repository:
   ```
   git clone https://github.com/Lilllllly06/3d-data-sandbox.git
   cd 3d-data-sandbox
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Run the application:
   ```
   npm start
   ```

4. Build the application for your platform:
   ```
   npm run dist
   ```

## Usage

### Importing Data

Click the "Import Data" button to select a CSV or JSON file to visualize. The application supports:

- **CSV files**: Standard comma-separated values with headers
- **JSON files**: Arrays of objects with consistent structure

### Navigation

- **Left-click + drag**: Rotate the view
- **Right-click + drag**: Pan the view
- **Scroll wheel**: Zoom in/out
- **WASD keys**: Move camera position
- **Q/E keys**: Move camera up/down
- **Double-click on a point**: Focus the camera on that point

### Layouts

- **Random Scatter**: Places points based on their values in 3D space
- **Grid Layout**: Arranges points in a grid pattern
- **K-Means Clusters**: Groups points into clusters (using a basic clustering algorithm)

### Saving Your Work

- **Save Scene**: Saves the current visualization state to a JSON file
- **Screenshot**: Exports the current view as a PNG image

## Data Format

### CSV Format

Your CSV files should have a header row with column names and consistent data types:

```
id,x,y,z,category,value
1,10.5,20.3,15.2,A,95
2,5.2,8.7,12.1,B,87
```

### JSON Format

JSON data should be an array of objects with consistent properties:

```json
[
  {"id": 1, "x": 10.5, "y": 20.3, "z": 15.2, "category": "A", "value": 95},
  {"id": 2, "x": 5.2, "y": 8.7, "z": 12.1, "category": "B", "value": 87}
]
```

## Tips for Best Results

- Numeric columns will be automatically detected and can be used for 3D positioning
- Categorical columns will be used for color coding
- For best performance, keep datasets under 10,000 points
- Pre-process very large datasets to extract the most meaningful points

## License

ISC License

## Credits

Built with:
- [Electron](https://www.electronjs.org/)
- [Three.js](https://threejs.org/)
- [PapaParse](https://www.papaparse.com/) 
