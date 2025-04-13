// OrbitControls stub for 3D Data Sandbox
// This ensures the 3D scene initialization works without errors

// Make sure THREE exists
if (typeof THREE === 'undefined') {
  console.error('THREE is not defined. OrbitControls needs THREE to be loaded first.');
} else {
  // Define the OrbitControls
  THREE.OrbitControls = function(camera, domElement) {
    this.object = camera;
    this.domElement = domElement || document.createElement('div');
    
    // Default properties
    this.enabled = true;
    this.target = new THREE.Vector3();
    this.minDistance = 0;
    this.maxDistance = Infinity;
    this.minZoom = 0;
    this.maxZoom = Infinity;
    this.minPolarAngle = 0;
    this.maxPolarAngle = Math.PI;
    this.minAzimuthAngle = -Infinity;
    this.maxAzimuthAngle = Infinity;
    this.enableDamping = false;
    this.dampingFactor = 0.05;
    this.enableZoom = true;
    this.zoomSpeed = 1.0;
    this.enableRotate = true;
    this.rotateSpeed = 1.0;
    this.enablePan = true;
    this.panSpeed = 1.0;
    this.screenSpacePanning = true;
    this.keyPanSpeed = 7.0;
    this.autoRotate = false;
    this.autoRotateSpeed = 2.0;
    this.enableKeys = true;
    this.keys = { LEFT: 37, UP: 38, RIGHT: 39, BOTTOM: 40 };
    this.mouseButtons = { LEFT: 0, MIDDLE: 1, RIGHT: 2 };
    
    // Methods
    this.update = function() {
      return true;
    };
    
    this.dispose = function() {
      // Cleanup
    };
    
    // Ensure camera is looking at target
    if (camera) {
      camera.lookAt(this.target);
    }
    
    console.log('OrbitControls stub initialized');
  };
}

console.log('OrbitControls stub loaded successfully'); 