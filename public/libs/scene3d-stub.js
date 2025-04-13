// Scene3D stub for 3D Data Sandbox
// This ensures 3D visualization works without errors

// Make sure THREE exists
if (typeof THREE === 'undefined') {
  console.error('THREE is not defined. Scene3D needs THREE to be loaded first.');
} else {
  // Create Scene3D class
  window.Scene3D = function() {
    console.log('Scene3D constructor called');
    
    // Scene properties
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = null; // Will initialize in init method
    this.dataPoints = [];
    this.container = null;
    this.controls = null;
    this.isInitialized = false;
    
    // Connection management
    this.connections = [];
    this.showConnections = false;
    
    // Configuration
    this.config = {
      nodeSize: 1.0,
      currentLayout: 'scatter',
      colorMap: {}
    };
    
    /**
     * Initialize the 3D scene
     */
    this.init = function() {
      try {
        // Set up scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x111111); // Dark background for better visibility
    
        // Set up renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    
        // Set up camera
        this.camera = new THREE.PerspectiveCamera(
          75, 
          this.container.clientWidth / this.container.clientHeight,
          0.1,
          10000
        );
        this.camera.position.z = 100;
        
        // Add orbit controls for true 3D navigation
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI;
        this.controls.update();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
        
        // Add axis helper
        const axisHelper = new THREE.AxesHelper(20);
        this.scene.add(axisHelper);
        
        // Start animation loop
        this.animate();
        
        console.log('Scene3D initialized successfully');
        return true;
      } catch (error) {
        console.error('Failed to initialize Scene3D:', error);
        return false;
      }
    };
    
    /**
     * Animation loop for continuous rendering
     */
    this.animate = function() {
      // Use function binding to maintain context
      const self = this;
      
      function animateLoop() {
        requestAnimationFrame(animateLoop);
        
        // Update controls
        if (self.controls) {
          self.controls.update();
        }
        
        // Render scene
        self.renderer.render(self.scene, self.camera);
      }
      
      animateLoop();
    };
    
    /**
     * Reset camera to view all points in the scene
     */
    this.resetCameraToViewAllPoints = function() {
      try {
        // If no objects, return
        if (!this.scene || this.scene.children.length === 0) {
          console.warn('No objects in scene to fit camera to');
          return;
        }
        
        // Create bounding box for all objects
        const boundingBox = new THREE.Box3();
        
        // Only consider mesh objects (data points)
        let hasMeshes = false;
        
        this.scene.traverse(function(object) {
          if (object instanceof THREE.Mesh) {
            boundingBox.expandByObject(object);
            hasMeshes = true;
          }
        });
        
        if (!hasMeshes) {
          console.warn('No mesh objects found in scene');
          return;
        }
        
        // Get bounding box center and size
        const center = new THREE.Vector3();
        const size = new THREE.Vector3();
        boundingBox.getCenter(center);
        boundingBox.getSize(size);
        
        // Calculate distance to fit entire bounding box
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2)));
        
        // Position camera to include all objects
        const offset = cameraZ * 1.5; // Add margin
        this.camera.position.set(center.x, center.y, center.z + offset);
        
        // Look at center of objects
        this.camera.lookAt(center);
        
        // Update orbit controls target
        if (this.controls) {
          this.controls.target.copy(center);
          this.controls.update();
        }
        
        console.log('Camera reset to view all points');
      } catch (error) {
        console.error('Error resetting camera:', error);
      }
    };
    
    /**
     * Add a debug cube to verify rendering is working
     */
    this.addDebugCube = function() {
      const geometry = new THREE.BoxGeometry(10, 10, 10);
      const material = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true });
      const cube = new THREE.Mesh(geometry, material);
      
      // Position it in the center
      cube.position.set(0, 0, 0);
      
      // Store it with a special user data flag so we can animate it
      cube.userData.isDebugCube = true;
      
      this.scene.add(cube);
      console.log('Debug cube added to scene');
    };
    
    /**
     * Add coordinate axes to the scene
     */
    this.addCoordinateAxes = function() {
      // Add X axis (red)
      const xAxis = this.createAxisLine(0xff0000, new THREE.Vector3(50, 0, 0));
      this.scene.add(xAxis);
      
      // Add Y axis (green)
      const yAxis = this.createAxisLine(0x00ff00, new THREE.Vector3(0, 50, 0));
      this.scene.add(yAxis);
      
      // Add Z axis (blue)
      const zAxis = this.createAxisLine(0x0000ff, new THREE.Vector3(0, 0, 50));
      this.scene.add(zAxis);
    };
    
    /**
     * Create an axis line
     * @param {number} color - Axis color
     * @param {THREE.Vector3} direction - Axis direction and length
     * @returns {THREE.Line} Axis line
     */
    this.createAxisLine = function(color, direction) {
      if (typeof THREE.LineBasicMaterial === 'function' && typeof THREE.BufferGeometry === 'function') {
        const material = new THREE.LineBasicMaterial({ color: color });
        const geometry = new THREE.BufferGeometry();
        
        // Create line from origin to direction
        const positions = [0, 0, 0, direction.x, direction.y, direction.z];
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        return new THREE.Line(geometry, material);
      } else {
        // Fallback for stub implementation
        const lineObject = {
          type: 'Line',
          position: new THREE.Vector3(0, 0, 0),
          color: color,
          direction: direction
        };
        return lineObject;
      }
    };
    
    /**
     * Handle window resize
     */
    this.onWindowResize = function() {
      if (!this.container || !this.renderer) return;
      
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      
      this.renderer.setSize(width, height);
    };
    
    /**
     * Animate data points to make them more noticeable
     */
    this.animatePoints = function() {
      // Very noticeable movement of points to make sure rendering is working
      const time = Date.now() * 0.001; // Get time in seconds
      
      // Rotate and animate all points 
      this.scene.children.forEach(child => {
        // Animate the debug cube more aggressively
        if (child.userData && child.userData.isDebugCube) {
          child.rotation.x = time * 2;
          child.rotation.y = time * 3;
          child.rotation.z = time;
          
          // Make it pulse in size
          const scale = 1 + Math.sin(time * 3) * 0.3;
          child.scale.set(scale, scale, scale);
        }
        // Regular data points
        else if (child.type === 'Mesh' && 
            child.geometry && 
            (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'SphereGeometry')) {
          
          // Rotate each cube more visibly
          if (typeof child.rotation === 'object') {
            child.rotation.y = time * 1.0;
            child.rotation.x = time * 0.5;
          }
          
          // Apply more noticeable scale pulsing
          if (typeof child.scale === 'object') {
            // Calculate a scale factor that oscillates between 0.7 and 1.3
            const scale = 1 + Math.sin(time * 2 + child.position.x) * 0.3;
            
            // Apply the scale with a try/catch for safety
            try {
              if (typeof child.scale.set === 'function') {
                child.scale.set(scale, scale, scale);
              } else {
                child.scale.x = scale;
                child.scale.y = scale;
                child.scale.z = scale;
              }
            } catch (e) {
              // Ignore scale errors
            }
          }
        }
      });
    };
    
    /**
     * Load data into the scene
     * @param {Object} data - Data object with nodes and links
     */
    this.loadData = function(data) {
      console.log('Loading data into 3D scene');
      
      if (!data) {
        console.error('No data provided');
        return false;
      }
      
      if (!data.points && data.nodes) {
        // Convert from nodes format to points format
        data.points = data.nodes.map(node => ({
          id: node.id,
          position: node.position || { x: 0, y: 0, z: 0 },
          category: node.category,
          data: node.data
        }));
      }
      
      return this.visualizeData(data.points);
    };
    
    /**
     * Visualize data points in 3D space
     * @param {Array} points - Data points
     */
    this.visualizeData = function(points) {
      console.log(`Visualizing ${points.length} data points`);
      
      try {
        // Clear previous data
        this.clearData();
        
        // Store data
        this.dataPoints = points;
        
        // Create point geometries
        const pointMaterials = {};
        const categories = new Set();
        
        // Find unique categories
        points.forEach(point => {
          if (point.category) {
            categories.add(point.category);
          }
        });
        
        console.log(`Found ${categories.size} categories:`, Array.from(categories));
        
        // Generate colors for categories - brighter colors
        const colorMap = {};
        let colorIndex = 0;
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        
        // Save color map for later use
        this.config.colorMap = {};
        
        categories.forEach(category => {
          // Use predefined colors for better visibility
          const color = colors[colorIndex % colors.length];
          colorMap[category] = color;
          this.config.colorMap[category] = color;
          colorIndex++;
          
          // Create material for this category
          pointMaterials[category] = new THREE.MeshBasicMaterial({ color: color });
        });
        
        // Default material (bright pink for visibility)
        const defaultMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        
        // Create point meshes - use larger size for visibility
        points.forEach((point, index) => {
          try {
            // Use box geometry for better visibility - larger size
            const geometry = new THREE.BoxGeometry(4, 4, 4);
            const material = point.category ? 
              pointMaterials[point.category] : defaultMaterial;
            
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position - use a safer approach
            if (point.position) {
              // Scale positions by 10 for better visibility
              const scaleFactor = 10;
              
              // Direct assignment for reliability
              mesh.position.x = (point.position.x || 0) * scaleFactor;
              mesh.position.y = (point.position.y || 0) * scaleFactor;
              mesh.position.z = (point.position.z || 0) * scaleFactor;
              
              // Log some point positions for debugging
              if (index < 3) {
                console.log(`Point ${index} position:`, mesh.position);
              }
            }
            
            // Apply current node size
            if (this.config.nodeSize !== 1.0) {
              mesh.scale.set(this.config.nodeSize, this.config.nodeSize, this.config.nodeSize);
            }
            
            // Store original data with mesh
            mesh.userData = { 
              pointData: point.data || {},
              id: point.id,
              category: point.category
            };
            
            this.scene.add(mesh);
          } catch (error) {
            console.error('Error creating point mesh:', error);
          }
        });
        
        // Apply the current layout algorithm
        if (this.config.currentLayout) {
          this.updateLayout(this.config.currentLayout);
        } else {
          // Default to scatter layout
          this.updateLayout('scatter');
        }
        
        // Generate connections if showing
        if (this.showConnections) {
          this.generateConnections();
        }
        
        // Move camera to see all points
        this.resetCameraToViewAllPoints();
        
        console.log('Data visualization complete');
        return true;
      } catch (error) {
        console.error('Error in visualizeData:', error);
        return false;
      }
    };
    
    /**
     * Update layout algorithm
     * @param {string} algorithm - Layout algorithm name
     */
    this.updateLayout = function(algorithm) {
      console.log('Updating layout to:', algorithm);
      
      if (!this.dataPoints || this.dataPoints.length === 0) {
        console.warn('No data points to layout');
        return false;
      }
      
      // Store current layout algorithm
      this.config.currentLayout = algorithm;
      
      // Simple layout algorithms
      let success = false;
      
      switch (algorithm) {
        case 'grid':
          success = this.applyGridLayout();
          break;
        case 'kmeans':
          success = this.applyClusterLayout();
          break;
        case 'scatter':
          success = this.applyScatterLayout();
          break;
        default:
          console.warn('Unknown layout algorithm:', algorithm);
          return false;
      }
      
      // Update connections if shown
      if (this.showConnections) {
        this.connections = [];
        this.generateConnections();
      }
      
      // Update rendering
      if (this.renderer && this.renderer.render) {
        this.renderer.render(this.scene, this.camera);
      }
      
      return success;
    };
    
    /**
     * Apply grid layout - arrange points in a 3D grid
     */
    this.applyGridLayout = function() {
      try {
        console.log('Applying grid layout');
        const points = this.dataPoints;
        const count = points.length;
        
        // Calculate grid dimensions
        const gridSize = Math.ceil(Math.cbrt(count));
        const spacing = 15; // Larger spacing for more distinct grid
        
        let index = 0;
        for (let x = 0; x < gridSize; x++) {
          for (let y = 0; y < gridSize; y++) {
            for (let z = 0; z < gridSize; z++) {
              if (index >= count) break;
              
              const position = {
                x: (x - gridSize/2) * spacing,
                y: (y - gridSize/2) * spacing,
                z: (z - gridSize/2) * spacing
              };
              
              this.updatePointPosition(index, position);
              index++;
            }
          }
        }
        
        // Reset camera to view all points
        this.resetCameraToViewAllPoints();
        return true;
      } catch (error) {
        console.error('Error applying grid layout:', error);
        return false;
      }
    };
    
    /**
     * Apply random scatter layout - distribute points randomly in 3D space
     */
    this.applyScatterLayout = function() {
      try {
        console.log('Applying scatter layout');
        const points = this.dataPoints;
        const count = points.length;
        const range = 100; // Larger range for more spread
        
        for (let i = 0; i < count; i++) {
          const position = {
            x: (Math.random() - 0.5) * range,
            y: (Math.random() - 0.5) * range,
            z: (Math.random() - 0.5) * range
          };
          
          this.updatePointPosition(i, position);
        }
        
        // Reset camera to view all points
        this.resetCameraToViewAllPoints();
        return true;
      } catch (error) {
        console.error('Error applying scatter layout:', error);
        return false;
      }
    };
    
    /**
     * Apply cluster layout - group points by category
     */
    this.applyClusterLayout = function() {
      try {
        console.log('Applying cluster layout');
        const points = this.dataPoints;
        const count = points.length;
        
        // Group points by category
        const categories = new Map();
        
        // Use category if available, otherwise create clusters
        points.forEach(point => {
          const category = point.category || 'default';
          
          if (!categories.has(category)) {
            categories.set(category, []);
          }
          
          categories.get(category).push(point);
        });
        
        // Generate cluster centers
        const clusterCenters = new Map();
        const range = 100;
        const radius = 20;
        
        let clusterIndex = 0;
        categories.forEach((categoryPoints, category) => {
          // Generate cluster center
          const angle = (clusterIndex / categories.size) * Math.PI * 2;
          const distance = range / 2;
          
          // Position clusters in a circle on XZ plane
          const centerX = Math.cos(angle) * distance;
          const centerZ = Math.sin(angle) * distance;
          
          clusterCenters.set(category, { x: centerX, y: 0, z: centerZ });
          clusterIndex++;
        });
        
        // Position points around their cluster centers
        let pointIndex = 0;
        categories.forEach((categoryPoints, category) => {
          const center = clusterCenters.get(category);
          const pointCount = categoryPoints.length;
          
          // Arrange points in a sphere around cluster center
          categoryPoints.forEach((point, i) => {
            // Calculate spherical coordinates
            const phi = Math.acos(1 - 2 * (i / pointCount));
            const theta = Math.PI * (1 + Math.sqrt(5)) * i;
            
            // Convert to cartesian coordinates
            const position = {
              x: center.x + radius * Math.sin(phi) * Math.cos(theta),
              y: center.y + radius * Math.sin(phi) * Math.sin(theta),
              z: center.z + radius * Math.cos(phi)
            };
            
            // Find point's index in original array
            const originalIndex = this.dataPoints.findIndex(p => p === point);
            if (originalIndex >= 0) {
              this.updatePointPosition(originalIndex, position);
            }
            
            pointIndex++;
          });
        });
        
        // Reset camera to view all points
        this.resetCameraToViewAllPoints();
        return true;
      } catch (error) {
        console.error('Error applying cluster layout:', error);
        return false;
      }
    };
    
    /**
     * Update point position
     * @param {number} index - Point index
     * @param {Object} position - Position {x, y, z}
     */
    this.updatePointPosition = function(index, position) {
      try {
        // Update data point
        if (this.dataPoints[index]) {
          this.dataPoints[index].position = position;
        }
        
        // Find and update mesh
        let meshIndex = 0;
        
        this.scene.children.forEach(child => {
          if (child.type === 'Mesh' && child.geometry && 
              (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'SphereGeometry')) {
            if (meshIndex === index) {
              // Make sure position.set exists, otherwise fallback to direct assignment
              if (typeof child.position.set === 'function') {
                child.position.set(position.x, position.y, position.z);
              } else {
                child.position.x = position.x || 0;
                child.position.y = position.y || 0;
                child.position.z = position.z || 0;
              }
            }
            meshIndex++;
          }
        });
      } catch (error) {
        console.error('Error updating point position:', error);
      }
    };
    
    /**
     * Update node size
     * @param {number} size - Node size
     */
    this.updateNodeSize = function(size) {
      console.log('Updating node size to:', size);
      
      try {
        // Store in configuration
        this.config.nodeSize = size;
        
        let meshIndex = 0;
        
        this.scene.children.forEach(child => {
          if (child.type === 'Mesh' && child.geometry && 
              (child.geometry.type === 'BoxGeometry' || child.geometry.type === 'SphereGeometry')) {
            // Check if scale.set exists
            if (typeof child.scale.set === 'function') {
              child.scale.set(size, size, size);
            } else {
              // Direct assignment as fallback
              child.scale.x = size;
              child.scale.y = size;
              child.scale.z = size;
            }
            meshIndex++;
          }
        });
        
        // Update rendering
        if (this.renderer && this.renderer.render) {
          this.renderer.render(this.scene, this.camera);
        }
        
        return meshIndex > 0;
      } catch (error) {
        console.error('Error updating node size:', error);
        return false;
      }
    };
    
    /**
     * Toggle connections visibility
     * @param {boolean} show - Whether to show connections
     */
    this.toggleConnections = function(show) {
      console.log('Toggling connections:', show);
      
      try {
        // Update the scene property for renderer
        this.showConnections = show;
        this.scene.showConnections = show;
        
        // Generate connections if they don't exist yet
        if (show && this.connections.length === 0) {
          this.generateConnections();
        }
        
        // Update the renderer to show connections
        if (this.renderer && this.renderer.render) {
          this.renderer.render(this.scene, this.camera);
        }
        
        return true;
      } catch (error) {
        console.error('Error toggling connections:', error);
        return false;
      }
    };
    
    /**
     * Generate connections between data points
     */
    this.generateConnections = function() {
      try {
        console.log('Generating connections between data points');
        this.connections = [];
        
        if (this.dataPoints.length < 2) {
          console.warn('Not enough data points to generate connections');
          return;
        }
        
        // Different connection strategies based on layout
        switch (this.config.currentLayout) {
          case 'grid':
            this.generateGridConnections();
            break;
          case 'kmeans':
            this.generateClusterConnections();
            break;
          case 'scatter':
          default:
            this.generateProximityConnections();
            break;
        }
        
        // Store connections on scene for renderer
        this.scene.connections = this.connections;
        
        console.log(`Generated ${this.connections.length} connections`);
      } catch (error) {
        console.error('Error generating connections:', error);
      }
    };
    
    /**
     * Generate grid-based connections
     */
    this.generateGridConnections = function() {
      // Create a map of points by position
      const pointMap = new Map();
      
      // Round positions to grid cells
      this.dataPoints.forEach(point => {
        const gridX = Math.round(point.position.x);
        const gridY = Math.round(point.position.y);
        const gridZ = Math.round(point.position.z);
        const key = `${gridX},${gridY},${gridZ}`;
        
        pointMap.set(key, point);
      });
      
      // Connect adjacent grid cells
      pointMap.forEach((point, key) => {
        const [x, y, z] = key.split(',').map(Number);
        
        // Check 6 adjacent cells (up, down, left, right, front, back)
        const adjacentCells = [
          `${x+1},${y},${z}`,
          `${x-1},${y},${z}`,
          `${x},${y+1},${z}`,
          `${x},${y-1},${z}`,
          `${x},${y},${z+1}`,
          `${x},${y},${z-1}`
        ];
        
        adjacentCells.forEach(adjacentKey => {
          if (pointMap.has(adjacentKey)) {
            this.connections.push({
              source: point,
              target: pointMap.get(adjacentKey)
            });
          }
        });
      });
    };
    
    /**
     * Generate cluster-based connections
     */
    this.generateClusterConnections = function() {
      // Connect points by category if available
      const categorizedPoints = new Map();
      
      // Group points by category
      this.dataPoints.forEach(point => {
        const category = point.category || 'default';
        
        if (!categorizedPoints.has(category)) {
          categorizedPoints.set(category, []);
        }
        
        categorizedPoints.get(category).push(point);
      });
      
      // Connect points within the same category
      categorizedPoints.forEach((points, category) => {
        // Find category center
        const center = { x: 0, y: 0, z: 0 };
        points.forEach(point => {
          center.x += point.position.x;
          center.y += point.position.y;
          center.z += point.position.z;
        });
        
        center.x /= points.length;
        center.y /= points.length;
        center.z /= points.length;
        
        // Create star connections from center to each point
        const centerPoint = { position: center, isCenterPoint: true };
        
        points.forEach(point => {
          this.connections.push({
            source: centerPoint,
            target: point
          });
        });
      });
    };
    
    /**
     * Generate connections based on proximity
     */
    this.generateProximityConnections = function() {
      // Calculate distances between all points
      for (let i = 0; i < this.dataPoints.length; i++) {
        const point1 = this.dataPoints[i];
        
        // Connect each point to its closest neighbors
        const neighbors = [];
        
        for (let j = 0; j < this.dataPoints.length; j++) {
          if (i === j) continue;
          
          const point2 = this.dataPoints[j];
          
          // Calculate distance
          const dx = point1.position.x - point2.position.x;
          const dy = point1.position.y - point2.position.y;
          const dz = point1.position.z - point2.position.z;
          const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
          
          neighbors.push({ point: point2, distance });
        }
        
        // Sort by distance
        neighbors.sort((a, b) => a.distance - b.distance);
        
        // Connect to closest 2-3 neighbors
        const connectCount = Math.min(3, neighbors.length);
        for (let k = 0; k < connectCount; k++) {
          // Check if connection already exists
          const alreadyConnected = this.connections.some(conn => 
            (conn.source === point1 && conn.target === neighbors[k].point) ||
            (conn.source === neighbors[k].point && conn.target === point1)
          );
          
          if (!alreadyConnected) {
            this.connections.push({
              source: point1,
              target: neighbors[k].point
            });
          }
        }
      }
    };
    
    /**
     * Get current scene data
     * @returns {Object} Scene data
     */
    this.getSceneData = function() {
      return {
        points: this.dataPoints,
        config: {
          nodeSize: 0.5,
          showConnections: false
        }
      };
    };
    
    /**
     * Take a screenshot of the current scene
     * @returns {string} Screenshot data URL
     */
    this.takeScreenshot = function() {
      if (!this.renderer) {
        console.error('Renderer not initialized');
        return null;
      }
      
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    };
  };
}

console.log('Scene3D stub loaded successfully'); 