// Three.js stub for 3D Data Sandbox
// This is a minimal implementation to make the application work

// Create THREE global object
window.THREE = {
  // Basic 3D math objects
  Vector3: function(x, y, z) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    
    this.set = function(x, y, z) {
      this.x = x || 0;
      this.y = y || 0;
      this.z = z || 0;
      return this;
    };
    
    this.copy = function(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    };
  },
  
  // Basic scene elements
  Scene: function() {
    this.children = [];
    this.add = function(object) { this.children.push(object); };
    this.remove = function(object) {
      const index = this.children.indexOf(object);
      if (index !== -1) this.children.splice(index, 1);
    };
  },
  
  // Cameras
  PerspectiveCamera: function(fov, aspect, near, far) {
    this.fov = fov || 75;
    this.aspect = aspect || 1;
    this.near = near || 0.1;
    this.far = far || 1000;
    this.position = new THREE.Vector3();
    this.lookAt = function(vector) { /* stub */ };
  },
  
  // Renderers
  WebGLRenderer: function(options) {
    options = options || {};
    this.domElement = document.createElement('canvas');
    this.domElement.style.width = '100%';
    this.domElement.style.height = '100%';
    this.domElement.style.background = '#000000';
    
    // View transformations for simulating 3D navigation
    this.viewTransform = {
      rotationX: 0,
      rotationY: 0,
      zoom: 1,
      panX: 0,
      panY: 0
    };
    
    // Make sure we actually draw something on the canvas
    const context = this.domElement.getContext('2d');
    
    // Set up keyboard event handlers for navigation
    this.setupNavigation = () => {
      document.addEventListener('keydown', (event) => {
        switch(event.key) {
          case 'ArrowUp':
            this.viewTransform.rotationX += 0.1;
            break;
          case 'ArrowDown':
            this.viewTransform.rotationX -= 0.1;
            break;
          case 'ArrowLeft':
            this.viewTransform.rotationY -= 0.1;
            break;
          case 'ArrowRight':
            this.viewTransform.rotationY += 0.1;
            break;
          case '+':
          case '=':
            this.viewTransform.zoom *= 1.1;
            break;
          case '-':
          case '_':
            this.viewTransform.zoom /= 1.1;
            break;
          case 'w':
            this.viewTransform.panY += 10;
            break;
          case 's':
            this.viewTransform.panY -= 10;
            break;
          case 'a':
            this.viewTransform.panX += 10;
            break;
          case 'd':
            this.viewTransform.panX -= 10;
            break;
          case 'r':
            // Reset view
            this.viewTransform = {
              rotationX: 0,
              rotationY: 0,
              zoom: 1,
              panX: 0,
              panY: 0
            };
            break;
        }
        // Redraw on any navigation change
        this.render();
      });
      
      // Add mouse controls for more intuitive navigation
      let isDragging = false;
      let previousMousePosition = { x: 0, y: 0 };
      
      this.domElement.addEventListener('mousedown', (event) => {
        isDragging = true;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      });
      
      this.domElement.addEventListener('mousemove', (event) => {
        if (isDragging) {
          const deltaX = event.clientX - previousMousePosition.x;
          const deltaY = event.clientY - previousMousePosition.y;
          
          // Rotating the scene based on mouse movement
          this.viewTransform.rotationY += deltaX * 0.01;
          this.viewTransform.rotationX += deltaY * 0.01;
          
          previousMousePosition = { x: event.clientX, y: event.clientY };
          this.render();
        }
      });
      
      this.domElement.addEventListener('mouseup', () => {
        isDragging = false;
      });
      
      this.domElement.addEventListener('wheel', (event) => {
        // Zoom with mouse wheel
        if (event.deltaY < 0) {
          this.viewTransform.zoom *= 1.1;
        } else {
          this.viewTransform.zoom /= 1.1;
        }
        event.preventDefault();
        this.render();
      });
      
      // Add touch controls for mobile devices
      let touchStartPosition;
      
      this.domElement.addEventListener('touchstart', (event) => {
        if (event.touches.length === 1) {
          touchStartPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }
      });
      
      this.domElement.addEventListener('touchmove', (event) => {
        if (event.touches.length === 1) {
          const deltaX = event.touches[0].clientX - touchStartPosition.x;
          const deltaY = event.touches[0].clientY - touchStartPosition.y;
          
          this.viewTransform.rotationY += deltaX * 0.01;
          this.viewTransform.rotationX += deltaY * 0.01;
          
          touchStartPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
          this.render();
          event.preventDefault();
        }
      });
    };
    
    // Instructions for navigation
    this.drawNavigationInstructions = (ctx) => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, this.domElement.height - 130, 320, 120);
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText('Navigation Controls:', 15, this.domElement.height - 110);
      ctx.fillText('• Mouse Drag: Rotate camera', 15, this.domElement.height - 90);
      ctx.fillText('• Mouse Wheel: Zoom in/out', 15, this.domElement.height - 70);
      ctx.fillText('• Arrow Keys: Rotate camera', 15, this.domElement.height - 50);
      ctx.fillText('• WASD: Pan camera', 15, this.domElement.height - 30);
      ctx.fillText('• +/- Keys: Zoom in/out', 15, this.domElement.height - 10);
    };
    
    this.setSize = function(width, height) {
      this.domElement.width = width || 800;
      this.domElement.height = height || 600;
      
      // Setup navigation controls
      this.setupNavigation();
      
      // Initial render
      this.render();
    };
    
    this.setClearColor = function(color, alpha) {
      // Convert the color to a CSS color string
      if (typeof color === 'number') {
        const hexString = '#' + color.toString(16).padStart(6, '0');
        this.domElement.style.background = hexString;
        
        // Also update the 2D context background if we have it
        if (context) {
          context.fillStyle = hexString;
          context.fillRect(0, 0, this.domElement.width, this.domElement.height);
        }
      } else {
        this.domElement.style.background = color;
      }
      console.log('THREE.WebGLRenderer.setClearColor called with color:', color);
    };
    
    this.render = function(scene, camera) {
      // Cache the scene and camera for later use
      this.lastScene = scene || this.lastScene;
      this.lastCamera = camera || this.lastCamera;
      scene = this.lastScene;
      camera = this.lastCamera;
      
      if (!scene || !context) return;
      
      // Clear canvas
      context.fillStyle = this.domElement.style.background || '#000000';
      context.fillRect(0, 0, this.domElement.width, this.domElement.height);
      
      // Draw grid
      const gridSize = 50 * this.viewTransform.zoom;
      const offsetX = this.viewTransform.panX;
      const offsetY = this.viewTransform.panY;
      
      context.strokeStyle = '#333333';
      context.lineWidth = 1;
      
      // Apply perspective effect to grid based on rotation
      const perspectiveGrid = (x, y) => {
        // Apply rotation
        const cos = Math.cos(this.viewTransform.rotationY);
        const sin = Math.sin(this.viewTransform.rotationY);
        const rotatedX = x * cos - y * sin;
        const rotatedZ = x * sin + y * cos;
        
        // Apply perspective
        const depth = 800; // Perspective depth
        const scale = depth / (depth + rotatedZ);
        
        // Apply to center coordinates
        const centerX = this.domElement.width / 2 + offsetX;
        const centerY = this.domElement.height / 2 + offsetY;
        
        return {
          x: centerX + rotatedX * scale * this.viewTransform.zoom,
          y: centerY + y * scale * this.viewTransform.zoom,
          scale: scale
        };
      };
      
      // Draw 3D grid
      const gridLines = 20;
      const gridStep = 100;
      
      // Draw X-Z grid (floor)
      for (let i = -gridLines/2; i <= gridLines/2; i++) {
        // Lines along X axis
        const start = perspectiveGrid(i * gridStep, -gridLines/2 * gridStep);
        const end = perspectiveGrid(i * gridStep, gridLines/2 * gridStep);
        
        context.beginPath();
        context.moveTo(start.x, start.y);
        context.lineTo(end.x, end.y);
        context.stroke();
        
        // Lines along Z axis
        const start2 = perspectiveGrid(-gridLines/2 * gridStep, i * gridStep);
        const end2 = perspectiveGrid(gridLines/2 * gridStep, i * gridStep);
        
        context.beginPath();
        context.moveTo(start2.x, start2.y);
        context.lineTo(end2.x, end2.y);
        context.stroke();
      }
      
      // Draw axes
      context.lineWidth = 3;
      
      // X axis (red)
      context.strokeStyle = '#ff0000';
      const xStart = perspectiveGrid(-500, 0);
      const xEnd = perspectiveGrid(500, 0);
      context.beginPath();
      context.moveTo(xStart.x, xStart.y);
      context.lineTo(xEnd.x, xEnd.y);
      context.stroke();
      
      // Y axis (green) - vertical
      context.strokeStyle = '#00ff00';
      const yStart = { 
        x: this.domElement.width / 2 + offsetX, 
        y: this.domElement.height / 2 + offsetY + 500 * this.viewTransform.zoom
      };
      const yEnd = { 
        x: this.domElement.width / 2 + offsetX, 
        y: this.domElement.height / 2 + offsetY - 500 * this.viewTransform.zoom
      };
      context.beginPath();
      context.moveTo(yStart.x, yStart.y);
      context.lineTo(yEnd.x, yEnd.y);
      context.stroke();
      
      // Z axis (blue)
      context.strokeStyle = '#0000ff';
      const zStart = perspectiveGrid(0, -500);
      const zEnd = perspectiveGrid(0, 500);
      context.beginPath();
      context.moveTo(zStart.x, zStart.y);
      context.lineTo(zEnd.x, zEnd.y);
      context.stroke();
      
      // Convert 3D position to 2D screen position
      const project3Dto2D = (position) => {
        // Apply rotation around Y axis
        const cosY = Math.cos(this.viewTransform.rotationY);
        const sinY = Math.sin(this.viewTransform.rotationY);
        
        let x = position.x;
        let z = position.z || 0;
        
        const rotatedX = x * cosY - z * sinY;
        const rotatedZ = x * sinY + z * cosY;
        
        // Apply rotation around X axis
        const cosX = Math.cos(this.viewTransform.rotationX);
        const sinX = Math.sin(this.viewTransform.rotationX);
        
        let y = position.y;
        
        const finalY = y * cosX - rotatedZ * sinX;
        const finalZ = y * sinX + rotatedZ * cosX;
        
        // Apply perspective
        const depth = 800;
        const scale = depth / (depth + finalZ);
        
        // Calculate screen position
        const centerX = this.domElement.width / 2 + offsetX;
        const centerY = this.domElement.height / 2 + offsetY;
        
        return {
          x: centerX + rotatedX * scale * this.viewTransform.zoom,
          y: centerY - finalY * scale * this.viewTransform.zoom,
          scale: scale,
          z: finalZ // For depth sorting
        };
      };
      
      // Collect all drawable objects for depth sorting
      const drawableObjects = [];
      
      // Draw connections first (if enabled)
      const showConnections = scene.showConnections === true;
      const connections = scene.connections || [];
      
      if (showConnections && connections.length > 0) {
        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 1;
        
        connections.forEach(connection => {
          if (connection.source && connection.target) {
            const sourcePos = project3Dto2D(connection.source.position);
            const targetPos = project3Dto2D(connection.target.position);
            
            drawableObjects.push({
              type: 'connection',
              z: (sourcePos.z + targetPos.z) / 2,
              draw: () => {
                context.beginPath();
                context.moveTo(sourcePos.x, sourcePos.y);
                context.lineTo(targetPos.x, targetPos.y);
                context.stroke();
              }
            });
          }
        });
      }
      
      // Process scene objects for drawing
      if (scene && scene.children) {
        scene.children.forEach(child => {
          if (child.type === 'Mesh' && child.position) {
            const screenPos = project3Dto2D(child.position);
            
            // Set node size based on mesh scale and perspective
            let nodeSize = 10;
            
            // Apply mesh scale if available
            if (child.scale) {
              const avgScale = (child.scale.x + child.scale.y + child.scale.z) / 3;
              nodeSize *= avgScale;
            }
            
            // Apply perspective scaling
            nodeSize *= screenPos.scale * this.viewTransform.zoom;
            
            // Add to drawable objects
            drawableObjects.push({
              type: 'node',
              z: screenPos.z,
              draw: () => {
                context.beginPath();
                
                // Use different shapes based on geometry type
                if (child.geometry && child.geometry.type === 'BoxGeometry') {
                  // Draw a square for box geometry
                  context.rect(
                    screenPos.x - nodeSize / 2, 
                    screenPos.y - nodeSize / 2, 
                    nodeSize, 
                    nodeSize
                  );
                } else {
                  // Default to circle
                  context.arc(screenPos.x, screenPos.y, nodeSize / 2, 0, Math.PI * 2);
                }
                
                // Use the mesh material color if possible
                if (child.material && child.material.color) {
                  const color = child.material.color;
                  if (typeof color === 'number') {
                    context.fillStyle = '#' + color.toString(16).padStart(6, '0');
                  } else {
                    context.fillStyle = '#ff00ff'; // Default to pink
                  }
                } else {
                  context.fillStyle = '#ff00ff'; // Default to pink
                }
                
                context.fill();
                context.strokeStyle = '#ffffff';
                context.lineWidth = 1;
                context.stroke();
                
                // Add category/ID text if appropriate zoom level
                if (nodeSize > 20 && child.userData) {
                  context.fillStyle = '#ffffff';
                  context.font = '10px Arial';
                  let label = '';
                  
                  if (child.userData.category) {
                    label = child.userData.category;
                  } else if (child.userData.id !== undefined) {
                    label = String(child.userData.id);
                  }
                  
                  if (label) {
                    context.fillText(label, screenPos.x - context.measureText(label).width / 2, screenPos.y + 4);
                  }
                }
              }
            });
          }
        });
      }
      
      // Sort objects by Z depth (painter's algorithm)
      drawableObjects.sort((a, b) => b.z - a.z);
      
      // Draw all objects in order
      drawableObjects.forEach(obj => obj.draw());
      
      // Add timestamp and stats
      const timestamp = new Date().toLocaleTimeString();
      context.fillStyle = '#ffffff';
      context.font = '12px Arial';
      context.fillText(`Rendering: ${timestamp}`, 10, 20);
      
      // Add object count
      const meshCount = scene.children ? scene.children.filter(c => c.type === 'Mesh').length : 0;
      context.fillText(`Objects: ${meshCount}`, 10, 40);
      
      // Show navigation instructions
      this.drawNavigationInstructions(context);
      
      // Debug position
      context.fillText(`Rot: X=${this.viewTransform.rotationX.toFixed(2)} Y=${this.viewTransform.rotationY.toFixed(2)} Zoom: ${this.viewTransform.zoom.toFixed(2)}`, 10, 60);
    };
    
    this.toDataURL = function(type) {
      // Return empty image data URL
      return this.domElement.toDataURL(type || 'image/png');
    };
  },
  
  // Basic geometries
  BoxGeometry: function(width, height, depth) {
    this.type = 'BoxGeometry';
    this.parameters = {
      width: width || 1,
      height: height || 1,
      depth: depth || 1
    };
  },
  
  SphereGeometry: function(radius, widthSegments, heightSegments) {
    this.type = 'SphereGeometry';
    this.parameters = {
      radius: radius || 1,
      widthSegments: widthSegments || 8,
      heightSegments: heightSegments || 6
    };
  },
  
  // Materials
  MeshBasicMaterial: function(parameters) {
    parameters = parameters || {};
    this.color = parameters.color || 0xffffff;
    this.wireframe = parameters.wireframe || false;
  },
  
  MeshPhongMaterial: function(parameters) {
    parameters = parameters || {};
    this.color = parameters.color || 0xffffff;
    this.specular = parameters.specular || 0x111111;
    this.shininess = parameters.shininess || 30;
  },
  
  // Objects
  Mesh: function(geometry, material) {
    this.type = 'Mesh';
    this.geometry = geometry;
    this.material = material;
    
    // Create position object with set method
    this.position = new THREE.Vector3();
    
    // Create rotation object
    this.rotation = new THREE.Vector3();
    
    // Create scale object with set method
    this.scale = new THREE.Vector3(1, 1, 1);
    
    // Ensure scale has a set method if Vector3 is modified later
    if (!this.scale.set) {
      this.scale.set = function(x, y, z) {
        this.x = x || 1;
        this.y = y || 1;
        this.z = z || 1;
        return this;
      };
    }
    
    // Add userData for storing custom properties
    this.userData = {};
  },
  
  // Lights
  AmbientLight: function(color, intensity) {
    this.color = color || 0xffffff;
    this.intensity = intensity || 1;
  },
  
  DirectionalLight: function(color, intensity) {
    this.color = color || 0xffffff;
    this.intensity = intensity || 1;
    this.position = new THREE.Vector3(0, 1, 0);
  },
  
  // Color utilities
  Color: function(color) {
    this.r = 1;
    this.g = 1;
    this.b = 1;
    this.set = function(color) { return this; };
  },
  
  // Implement essential buffer geometry
  BufferGeometry: function() {
    this.attributes = {};
    
    this.setAttribute = function(name, attribute) {
      this.attributes[name] = attribute;
      return this;
    };
  },
  
  Float32BufferAttribute: function(array, itemSize) {
    this.array = array;
    this.itemSize = itemSize;
  },
  
  // Line materials and objects
  LineBasicMaterial: function(parameters) {
    parameters = parameters || {};
    this.color = parameters.color || 0xffffff;
  },
  
  Line: function(geometry, material) {
    this.type = 'Line';
    this.geometry = geometry;
    this.material = material;
    this.position = new THREE.Vector3();
  },
  
  // Add grid helper
  GridHelper: function(size, divisions) {
    this.type = 'GridHelper';
    this.size = size || 10;
    this.divisions = divisions || 10;
    this.position = new THREE.Vector3();
  }
};

// Export for module systems
if (typeof module !== 'undefined') {
  module.exports = THREE;
}

console.log('THREE.js stub loaded successfully'); 