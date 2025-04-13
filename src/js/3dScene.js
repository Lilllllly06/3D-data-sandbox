/**
 * 3D Scene - Handles the Three.js scene setup and management
 */
class Scene3D {
  constructor(containerId) {
    console.log(`Initializing Scene3D with container: ${containerId}`);
    
    try {
      // Check if THREE.js library is available
      if (typeof THREE === 'undefined') {
        throw new Error('THREE.js library is not loaded');
      }
      
      // Check if OrbitControls is available (often loaded separately)
      if (typeof THREE.OrbitControls === 'undefined') {
        console.warn('THREE.OrbitControls not found. Camera controls might be unavailable.');
        // You might decide to throw an error here if controls are essential
        // throw new Error('THREE.OrbitControls library is not loaded');
      }
      
      // Get the container element by ID
      this.container = document.getElementById(containerId);
      if (!this.container) {
        throw new Error(`Container with id '${containerId}' not found`);
      }
      
      // Scene configuration
      this.config = {
        nodeShape: 'cube',
        nodeSize: 1,
        showConnections: false,
        backgroundColor: 0x121212,
        highlightColor: 0xffaa00,
        cameraPosition: { x: 100, y: 100, z: 100 },
        cameraTarget: { x: 0, y: 0, z: 0 }
      };

      // Scene data
      this.dataPoints = [];
      this.nodes = [];
      this.connections = [];
      this.selectedNode = null;

      // Set up scene
      this.setupScene();
      this.setupCamera();
      this.setupLights();
      this.setupControls(); // This relies on OrbitControls
      this.setupRaycaster();
      this.setupEventListeners();

      // Start animation loop
      this.animate();
      
      console.log('Scene3D initialized successfully');
    } catch (error) {
      console.error('Scene3D initialization error:', error);
      throw new Error(`Failed to initialize 3D scene: ${error.message}`);
    }
  }

  /**
   * Set up the Three.js scene
   */
  setupScene() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.backgroundColor);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.container.appendChild(this.renderer.domElement);

    // Create groups for organization
    this.nodesGroup = new THREE.Group();
    this.connectionsGroup = new THREE.Group();
    this.analysisGroup = new THREE.Group(); // Group for analysis visuals (corr lines)
    this.scene.add(this.nodesGroup);
    this.scene.add(this.connectionsGroup);
    this.scene.add(this.analysisGroup); // Add analysis group to scene

    // Add axes helper for orientation
    const axesHelper = new THREE.AxesHelper(20);
    this.scene.add(axesHelper);

    // Add grid for reference
    const gridHelper = new THREE.GridHelper(100, 20, 0x444444, 0x222222);
    this.scene.add(gridHelper);
  }

  /**
   * Set up the camera
   */
  setupCamera() {
    const { clientWidth: width, clientHeight: height } = this.container;
    
    // Create perspective camera
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    this.camera.position.set(
      this.config.cameraPosition.x,
      this.config.cameraPosition.y,
      this.config.cameraPosition.z
    );
    this.camera.lookAt(
      this.config.cameraTarget.x,
      this.config.cameraTarget.y,
      this.config.cameraTarget.z
    );

    // Handle window resize
    window.addEventListener('resize', () => {
      const { clientWidth, clientHeight } = this.container;
      this.camera.aspect = clientWidth / clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(clientWidth, clientHeight);
    });
  }

  /**
   * Set up scene lighting
   */
  setupLights() {
    // Add ambient light for general illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Add directional light for shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Add hemisphere light for subtle color variations
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
    this.scene.add(hemisphereLight);
  }

  /**
   * Set up orbit controls for camera movement
   */
  setupControls() {
    // Create orbit controls for mouse interaction
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.rotateSpeed = 0.7;
    this.controls.zoomSpeed = 1.2;
    
    // Set limits to prevent getting lost in the scene
    this.controls.minDistance = 10;
    this.controls.maxDistance = 500;
  }

  /**
   * Set up raycaster for node selection
   */
  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.raycaster.params.Points.threshold = 1.5; // Adjust for easier selection
    this.mouse = new THREE.Vector2();
  }

  /**
   * Set up event listeners for user interaction
   */
  setupEventListeners() {
    const canvas = this.renderer.domElement;
    
    // Mouse move for hover effects
    canvas.addEventListener('mousemove', event => {
      this.updateMousePosition(event);
      this.checkNodeHover();
    });

    // Click to select a node
    canvas.addEventListener('click', event => {
      this.updateMousePosition(event);
      this.selectNodeAtMouse();
    });

    // Double click to focus on a node
    canvas.addEventListener('dblclick', event => {
      this.updateMousePosition(event);
      this.focusOnNodeAtMouse();
    });

    // Key controls
    window.addEventListener('keydown', event => {
      this.handleKeyDown(event);
    });
  }

  /**
   * Update mouse position in normalized coordinates
   * @param {MouseEvent} event - Mouse event
   */
  updateMousePosition(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Check for node hover and update the tooltip
   */
  checkNodeHover() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodesGroup.children);
    
    // Update cursor style
    this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
    
    if (intersects.length > 0) {
      const nodeObject = intersects[0].object;
      const nodeData = this.dataPoints[nodeObject.userData.index];
      
      // Update tooltip content and position
      const tooltip = document.getElementById('tooltip');
      if (tooltip && nodeData) {
        tooltip.innerHTML = nodeData.label;
        tooltip.style.display = 'block';
        
        // Position tooltip near the mouse
        const rect = this.renderer.domElement.getBoundingClientRect();
        const mouseX = this.mouse.x * rect.width / 2 + rect.width / 2;
        const mouseY = -this.mouse.y * rect.height / 2 + rect.height / 2;
        
        tooltip.style.left = `${mouseX + 15}px`;
        tooltip.style.top = `${mouseY}px`;
      }
    } else {
      // Hide tooltip when not hovering over a node
      const tooltip = document.getElementById('tooltip');
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    }
  }

  /**
   * Select a node at the current mouse position
   */
  selectNodeAtMouse() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodesGroup.children);
    
    if (intersects.length > 0) {
      const nodeObject = intersects[0].object;
      this.selectNode(nodeObject);
    } else {
      this.clearSelection();
    }
  }

  /**
   * Select a specific node
   * @param {THREE.Object3D} nodeObject - The node object to select
   */
  selectNode(nodeObject) {
    // Clear previous selection
    this.clearSelection();
    
    // Set new selection
    this.selectedNode = nodeObject;
    
    // Highlight the selected node
    const originalMaterial = nodeObject.userData.originalMaterial;
    nodeObject.userData.highlightMaterial = originalMaterial.clone();
    nodeObject.userData.highlightMaterial.emissive = new THREE.Color(this.config.highlightColor);
    nodeObject.userData.highlightMaterial.emissiveIntensity = 0.5;
    nodeObject.material = nodeObject.userData.highlightMaterial;
    
    // Scale up the selected node
    nodeObject.scale.set(1.5, 1.5, 1.5);
    
    // Update data info display
    this.updateInfoPanel(nodeObject.userData.index);
  }

  /**
   * Clear the current node selection
   */
  clearSelection() {
    if (this.selectedNode) {
      // Restore original material
      this.selectedNode.material = this.selectedNode.userData.originalMaterial;
      
      // Restore original scale
      this.selectedNode.scale.set(1, 1, 1);
      
      this.selectedNode = null;
      
      // Clear info panel
      this.updateInfoPanel(null);
    }
  }

  /**
   * Focus camera on a node at the current mouse position
   */
  focusOnNodeAtMouse() {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.nodesGroup.children);
    
    if (intersects.length > 0) {
      const nodeObject = intersects[0].object;
      const nodePosition = nodeObject.position.clone();
      
      // Animate camera to focus on this node
      const startPosition = this.camera.position.clone();
      const endPosition = nodePosition.clone().add(new THREE.Vector3(30, 30, 30));
      
      // Use TWEEN.js if available, or just set position
      this.controls.target.copy(nodePosition);
      this.camera.position.copy(endPosition);
      this.controls.update();
    }
  }

  /**
   * Handle keyboard input
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleKeyDown(event) {
    // Escape to clear selection
    if (event.key === 'Escape') {
      this.clearSelection();
    }
    
    // WASD controls for camera movement
    const moveSpeed = 5;
    switch (event.key.toLowerCase()) {
      case 'w':
        this.camera.position.z -= moveSpeed;
        break;
      case 's':
        this.camera.position.z += moveSpeed;
        break;
      case 'a':
        this.camera.position.x -= moveSpeed;
        break;
      case 'd':
        this.camera.position.x += moveSpeed;
        break;
      case 'q':
        this.camera.position.y += moveSpeed;
        break;
      case 'e':
        this.camera.position.y -= moveSpeed;
        break;
    }
  }

  /**
   * Update the info panel with node data
   * @param {number|null} nodeIndex - Index of the selected node or null
   */
  updateInfoPanel(nodeIndex) {
    const dataInfo = document.getElementById('data-info');
    if (!dataInfo) return;
    
    if (nodeIndex === null || nodeIndex >= this.dataPoints.length) {
      dataInfo.innerHTML = '';
      return;
    }
    
    const nodeData = this.dataPoints[nodeIndex];
    if (!nodeData) return;
    
    // Display original data in the info panel
    let html = `<h3>Selected Node</h3>`;
    if (nodeData.cluster !== undefined) {
      html += `<p><strong>Cluster:</strong> ${nodeData.cluster}</p>`;
    }
    
    // Show all original data fields
    html += `<div class="data-table">`;
    Object.entries(nodeData.originalData).forEach(([key, value]) => {
      html += `<div><strong>${key}:</strong> ${value}</div>`;
    });
    html += `</div>`;
    
    dataInfo.innerHTML = html;
  }

  /**
   * Main animation loop
   */
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Visualize data points in 3D space
   * @param {Array} dataPoints - Array of data points with position and color
   */
  visualizeData(dataPoints) {
    console.log('Scene3D: visualizeData called.');
    if (!dataPoints || !Array.isArray(dataPoints)) {
      console.warn('visualizeData received invalid dataPoints argument');
      return;
    }
    console.log(`Attempting to visualize ${dataPoints.length} data points.`);
    
    // Clear previous visualization first
    this.clearVisualization();
    
    this.dataPoints = dataPoints;
    if (this.dataPoints.length === 0) {
      console.log('No data points to visualize after clearing.');
      return; // Nothing more to do
    }
    
    // Create nodes
    console.log('Creating nodes...');
    this.createNodes();
    console.log(`${this.nodes.length} nodes created.`);
    
    // Populate connections group (visibility controlled separately)
    console.log('Populating connections group (visibility controlled separately)...');
    this.createConnections();
    
    // Set initial visibility based on config
    this.connectionsGroup.visible = this.config.showConnections;
    console.log(`Initial connections visibility set to: ${this.config.showConnections}`);
    
    console.log('Resetting camera position after visualization.');
    this.resetCameraPosition();
    
    console.log('Scene3D: visualizeData finished.');
  }

  /**
   * Clear the current visualization
   */
  clearVisualization() {
    console.log('Scene3D: clearVisualization called.');
    let nodesRemoved = 0;
    // Remove all nodes
    while (this.nodesGroup.children.length > 0) {
      const node = this.nodesGroup.children[0];
      this.nodesGroup.remove(node); // Remove from group
      // Optional: Dispose geometry/material if memory is a concern
      // if (node.geometry) node.geometry.dispose();
      // if (node.material) node.material.dispose();
      nodesRemoved++;
    }
    console.log(`Removed ${nodesRemoved} nodes.`);
    
    let connectionsRemoved = 0;
    // Remove all connections
    while (this.connectionsGroup.children.length > 0) {
      const connection = this.connectionsGroup.children[0];
      this.connectionsGroup.remove(connection);
      // Optional: Dispose geometry/material
      // if (connection.geometry) connection.geometry.dispose();
      // if (connection.material) connection.material.dispose();
      connectionsRemoved++;
    }
    console.log(`Removed ${connectionsRemoved} connections.`);
    
    // Also clear analysis visuals
    this.clearAnalysisVisuals();
    
    // Clear arrays
    this.nodes = [];
    this.connections = [];
    this.dataPoints = [];
    this.selectedNode = null;
    console.log('Internal data arrays cleared.');
    
    // Clear info panel (optional, but good practice)
    this.updateInfoPanel(null);
  }

  /**
   * Create 3D nodes for each data point
   */
  createNodes() {
    console.log(`Creating nodes with shape: ${this.config.nodeShape}, size: ${this.config.nodeSize}`);
    
    // Define geometries based on shape config
    let nodeGeometry;
    const size = this.config.nodeSize;
    switch (this.config.nodeShape) {
      case 'sphere':
        nodeGeometry = new THREE.SphereGeometry(size / 2, 16, 12); // Radius is size/2
        break;
      case 'icosahedron':
        nodeGeometry = new THREE.IcosahedronGeometry(size / 2, 0); // Radius is size/2
        break;
      case 'cube':
      default:
        nodeGeometry = new THREE.BoxGeometry(size, size, size);
        break;
    }
    
    // Create nodes for each data point
    this.dataPoints.forEach((point, index) => {
      // Create material with the point's color
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(point.color),
        shininess: 50
      });
      
      // Create mesh using the selected geometry
      const nodeMesh = new THREE.Mesh(nodeGeometry, material);
      
      // Set position
      nodeMesh.position.set(
        point.position.x,
        point.position.y,
        point.position.z
      );
      
      // Store original material and index for later reference
      nodeMesh.userData = {
        index,
        originalMaterial: material
      };
      
      // Add to group
      this.nodesGroup.add(nodeMesh);
      this.nodes.push(nodeMesh);
    });
    console.log(`Finished creating ${this.nodes.length} nodes.`);
  }

  /**
   * Create connections between nodes
   */
  createConnections() {
    console.log('Scene3D: createConnections starting.');
    
    // Clear any existing lines *before* creating new ones
    while (this.connectionsGroup.children.length > 0) {
      this.connectionsGroup.remove(this.connectionsGroup.children[0]);
    }
    this.connections = []; // Reset internal array
    console.log('Cleared previous connections.');
    
    let connectionsCreated = 0;
    if (!this.dataPoints || this.dataPoints.length < 2) {
        console.log('Not enough data points to create connections.');
        return;
    }

    // Only create connections for nearby points or points in the same cluster
    for (let i = 0; i < this.dataPoints.length; i++) {
      const pointA = this.dataPoints[i];
      
      // For points in the same cluster, or nearby points
      for (let j = i + 1; j < this.dataPoints.length; j++) {
        const pointB = this.dataPoints[j];
        
        // Check if points should be connected (same cluster or close together)
        const sameCluster = 
          pointA.cluster !== undefined && 
          pointB.cluster !== undefined && 
          pointA.cluster === pointB.cluster;
          
        // Calculate distance between points
        const distance = Math.sqrt(
          Math.pow(pointA.position.x - pointB.position.x, 2) +
          Math.pow(pointA.position.y - pointB.position.y, 2) +
          Math.pow(pointA.position.z - pointB.position.z, 2)
        );
        
        // Connect if in same cluster or close enough
        // Define a threshold for closeness
        const distanceThreshold = 15; // Adjust as needed
        if (sameCluster || distance < distanceThreshold) {
          // console.log(`Creating connection between point ${i} and ${j}. Reason: ${sameCluster ? 'Same Cluster' : 'Distance < ' + distanceThreshold}`);
          this.createConnection(pointA, pointB);
          connectionsCreated++;
        }
      }
    }
    console.log(`Scene3D: createConnections finished. ${connectionsCreated} connections created internally.`);
  }

  /**
   * Create a connection between two points
   * @param {Object} pointA - First data point
   * @param {Object} pointB - Second data point
   */
  createConnection(pointA, pointB) {
    // Create line geometry
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      pointA.position.x, pointA.position.y, pointA.position.z,
      pointB.position.x, pointB.position.y, pointB.position.z
    ]);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    
    // Create line material
    const material = new THREE.LineBasicMaterial({
      color: pointA.cluster !== undefined ? pointA.color : 0x888888,
      transparent: true,
      opacity: 0.5, // Slightly reduced opacity
      linewidth: 1 // Note: linewidth > 1 requires LineMaterial from examples/jsm/lines
    });
    
    // Create line
    const line = new THREE.Line(geometry, material);
    
    // Add to group
    this.connectionsGroup.add(line);
    this.connections.push(line);
    // console.log('Added line to connectionsGroup');
  }

  /**
   * Reset camera position to view all nodes
   */
  resetCameraPosition() {
    if (this.dataPoints.length === 0) return;
    
    // Find the bounding box of all points
    const bbox = new THREE.Box3();
    this.nodes.forEach(node => {
      bbox.expandByObject(node);
    });
    
    // Calculate center of bounding box
    const center = new THREE.Vector3();
    bbox.getCenter(center);
    
    // Calculate size of bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);
    
    // Calculate distance needed to view the entire scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let distance = (maxDim / 2) / Math.tan(fov / 2);
    
    // Apply some padding
    distance *= 1.5;
    
    // Position camera
    const direction = new THREE.Vector3(1, 1, 1).normalize();
    this.camera.position.copy(center).add(direction.multiplyScalar(distance));
    this.camera.lookAt(center);
    
    // Update orbit controls target
    this.controls.target.copy(center);
    this.controls.update();
  }

  /**
   * Update node size
   * @param {number} size - New node size
   */
  updateNodeSize(size) {
    this.config.nodeSize = size;
    console.log(`Scene3D: Node size updated to ${size}`);
    
    // Explicitly recreate if data exists
    if (this.dataPoints && this.dataPoints.length > 0) {
      console.log('Scene3D: Recreating visualization due to node size change.');
      this.recreateVisualization();
    }
  }

  /**
   * Toggle connections between nodes
   * @param {boolean} show - Whether to show connections
   */
  toggleConnections(show) {
    this.config.showConnections = show;
    console.log(`Scene3D: Setting connectionsGroup visibility to ${show}`);
    
    // Directly toggle the visibility of the group
    this.connectionsGroup.visible = show;

    // No need to recreate here, visualizeData populates the group initially.
  }

  /**
   * Recreate the visualization with current settings
   */
  recreateVisualization() {
    const dataPoints = [...this.dataPoints];
    this.visualizeData(dataPoints);
  }

  /**
   * Export the current scene as a screenshot
   * @returns {string} Data URL of the screenshot
   */
  exportScreenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  /**
   * Get scene data for saving
   * @returns {Object} Scene data
   */
  getSceneData() {
    return {
      dataPoints: this.dataPoints,
      config: this.config,
      camera: {
        position: this.camera.position.toArray(),
        target: this.controls.target.toArray()
      }
    };
  }

  /**
   * Load a saved scene
   * @param {Object} sceneData - Scene data to load
   */
  loadSceneData(sceneData) {
    if (!sceneData || !sceneData.dataPoints) {
      console.error('Invalid scene data');
      return;
    }
    
    // Load configuration
    if (sceneData.config) {
      this.config = { ...this.config, ...sceneData.config };
    }
    
    // Visualize data
    this.visualizeData(sceneData.dataPoints);
    
    // Restore camera position
    if (sceneData.camera) {
      if (sceneData.camera.position) {
        this.camera.position.fromArray(sceneData.camera.position);
      }
      
      if (sceneData.camera.target) {
        this.controls.target.fromArray(sceneData.camera.target);
      }
      
      this.controls.update();
    }
  }

  /**
   * Update node shape
   * @param {string} shape - New node shape ('cube', 'sphere', etc.)
   */
  updateNodeShape(shape) {
    this.config.nodeShape = shape;
    console.log(`Scene3D: Node shape updated to ${shape}`);
    
    // Recreate visualization if data exists
    if (this.dataPoints && this.dataPoints.length > 0) {
      console.log('Scene3D: Recreating visualization due to node shape change.');
      this.recreateVisualization();
    }
  }

  // --- New/Modified Analysis Visual Methods --- 
  
  /**
   * Clear analysis-related visuals (outlier highlights, correlation lines).
   */
  clearAnalysisVisuals() {
    this.clearHighlights();
    this.clearCorrelationLines();
  }

  /**
   * Highlight specific nodes and dim others.
   * @param {Array<number>} highlightIndices - Array of original data indices to highlight.
   * @param {Array<number>} dimIndices - Array of original data indices to dim.
   */
  highlightNodes(highlightIndices = [], dimIndices = []) {
    console.log(`Highlighting ${highlightIndices.length} nodes, dimming ${dimIndices.length}.`);
    this.clearHighlights(); // Clear previous highlights first

    const highlightSet = new Set(highlightIndices);
    const dimSet = new Set(dimIndices);
    const highlightColor = new THREE.Color(0xffffff); // Bright white for highlight
    const dimColor = new THREE.Color(0x444444); // Dark grey for dimmed
    const highlightIntensity = 1.0;
    const dimIntensity = 0.2;
    
    this.nodes.forEach(node => {
      const originalIndex = node.userData.index; // Assuming userData.index holds original index
      
      if (highlightSet.has(originalIndex)) {
        // Apply highlight material modification
        node.material.emissive = highlightColor;
        node.material.emissiveIntensity = highlightIntensity;
        node.scale.set(1.2, 1.2, 1.2); // Slightly larger
      } else if (dimSet.has(originalIndex)) {
        // Apply dimmed material modification
        node.material.emissive = dimColor;
        node.material.emissiveIntensity = dimIntensity;
         node.scale.set(0.8, 0.8, 0.8); // Slightly smaller
      } else {
         // Ensure non-highlighted/dimmed nodes are reset (should be handled by clearHighlights ideally)
         node.material.emissive = new THREE.Color(0x000000); // No emission
         node.material.emissiveIntensity = 0;
         node.scale.set(1, 1, 1); // Reset scale
      }
      node.material.needsUpdate = true; // Important for material changes
    });
  }

  /**
   * Clear all node highlights and reset materials/scales.
   */
  clearHighlights() {
    console.log('Clearing node highlights.');
    this.nodes.forEach(node => {
      // Restore original appearance (or simply reset emissive/scale)
      node.material.emissive = new THREE.Color(0x000000); // Black emissive
      node.material.emissiveIntensity = 0;
      node.material.needsUpdate = true;
      node.scale.set(1, 1, 1); // Reset scale
    });
    // Also potentially clear the main selectedNode highlight if necessary
    // this.clearSelection(); // Uncomment if selection should also be cleared
  }

  /**
   * Draw lines between nodes based on correlation data.
   * @param {Array<Array<number>>} correlationPairs - Array of [originalIndex1, originalIndex2] pairs.
   */
  drawCorrelationLines(correlationPairs = []) {
    console.log(`Drawing ${correlationPairs.length} correlation lines.`);
    this.clearCorrelationLines(); // Clear previous lines
    
    if (correlationPairs.length === 0) return;

    // Create a map from original index to the current node object for quick lookup
    const nodeMap = new Map();
    this.nodes.forEach(node => {
      if (node.userData.index !== undefined) {
        nodeMap.set(node.userData.index, node);
      }
    });

    const material = new THREE.LineBasicMaterial({
      color: 0xffeb3b, // Yellow for correlation
      linewidth: 2, // Might require LineMaterial/LineGeometry2 for > 1px width
      transparent: true,
      opacity: 0.8
    });

    correlationPairs.forEach(pair => {
      const node1 = nodeMap.get(pair[0]);
      const node2 = nodeMap.get(pair[1]);

      if (node1 && node2) {
        const geometry = new THREE.BufferGeometry().setFromPoints([node1.position, node2.position]);
        const line = new THREE.Line(geometry, material);
        this.analysisGroup.add(line);
      } else {
        console.warn('Could not find nodes for correlation pair:', pair);
      }
    });
    console.log(`Added ${this.analysisGroup.children.length} lines to analysisGroup.`);
  }

  /**
   * Clear all correlation lines from the analysis group.
   */
  clearCorrelationLines() {
    console.log('Clearing correlation lines.');
    while (this.analysisGroup.children.length > 0) {
      const line = this.analysisGroup.children[0];
      this.analysisGroup.remove(line);
      // Optional: Dispose geometry/material
      // if (line.geometry) line.geometry.dispose();
      // if (line.material) line.material.dispose();
    }
  }
}

// Export the Scene3D class
window.Scene3D = Scene3D;
