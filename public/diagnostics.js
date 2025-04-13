// Diagnostics script for 3D Data Sandbox
// Run this from browser console to check for issues

window.runDeepDiagnostics = function() {
  console.group('DEEP DIAGNOSTICS');
  
  // Check THREE.js implementation
  console.log('Checking THREE.js implementation...');
  const threeIssues = [];
  
  if (!window.THREE) {
    threeIssues.push('THREE object not defined');
  } else {
    // Check Vector3
    const vector = new THREE.Vector3(1, 2, 3);
    if (!vector) {
      threeIssues.push('Unable to create Vector3');
    } else {
      if (typeof vector.set !== 'function') {
        threeIssues.push('Vector3.set is not a function');
      }
      
      // Test set
      try {
        vector.set(4, 5, 6);
        if (vector.x !== 4 || vector.y !== 5 || vector.z !== 6) {
          threeIssues.push('Vector3.set not working correctly');
        }
      } catch (e) {
        threeIssues.push('Error calling Vector3.set: ' + e.message);
      }
    }
    
    // Check Mesh
    try {
      const geometry = new THREE.SphereGeometry(1, 8, 8);
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const mesh = new THREE.Mesh(geometry, material);
      
      if (!mesh) {
        threeIssues.push('Unable to create Mesh');
      } else {
        if (typeof mesh.position.set !== 'function') {
          threeIssues.push('mesh.position.set is not a function');
        }
        
        // Test position.set
        try {
          mesh.position.set(1, 2, 3);
          if (mesh.position.x !== 1 || mesh.position.y !== 2 || mesh.position.z !== 3) {
            threeIssues.push('mesh.position.set not working correctly');
          }
        } catch (e) {
          threeIssues.push('Error calling mesh.position.set: ' + e.message);
        }
        
        if (typeof mesh.scale.set !== 'function') {
          threeIssues.push('mesh.scale.set is not a function');
        }
        
        // Test scale.set
        try {
          mesh.scale.set(2, 2, 2);
          if (mesh.scale.x !== 2 || mesh.scale.y !== 2 || mesh.scale.z !== 2) {
            threeIssues.push('mesh.scale.set not working correctly');
          }
        } catch (e) {
          threeIssues.push('Error calling mesh.scale.set: ' + e.message);
        }
      }
    } catch (e) {
      threeIssues.push('Error creating Mesh: ' + e.message);
    }
  }
  
  console.log('THREE.js issues:', threeIssues.length ? threeIssues : 'None');
  
  // Check Scene3D implementation
  console.log('Checking Scene3D implementation...');
  const scene3dIssues = [];
  
  if (!window.Scene3D) {
    scene3dIssues.push('Scene3D class not defined');
  } else {
    // Check if Scene3D can be instantiated
    try {
      const scene = new Scene3D();
      if (!scene) {
        scene3dIssues.push('Unable to create Scene3D instance');
      } else {
        // Check for required methods
        const requiredMethods = [
          'init', 'loadData', 'visualizeData', 'updateLayout', 
          'updateNodeSize', 'toggleConnections', 'takeScreenshot'
        ];
        
        requiredMethods.forEach(method => {
          if (typeof scene[method] !== 'function') {
            scene3dIssues.push(`Scene3D.${method} is not a function`);
          }
        });
        
        // Check init method
        if (typeof scene.init === 'function') {
          const testContainer = document.createElement('div');
          try {
            scene.init(testContainer);
            if (!scene.isInitialized) {
              scene3dIssues.push('Scene3D.init did not set isInitialized to true');
            }
          } catch (e) {
            scene3dIssues.push('Error calling Scene3D.init: ' + e.message);
          }
        }
      }
    } catch (e) {
      scene3dIssues.push('Error creating Scene3D: ' + e.message);
    }
  }
  
  console.log('Scene3D issues:', scene3dIssues.length ? scene3dIssues : 'None');
  
  // Check DataProcessor implementation
  console.log('Checking DataProcessor implementation...');
  const dataProcessorIssues = [];
  
  if (!window.DataProcessor) {
    dataProcessorIssues.push('DataProcessor class not defined');
  } else {
    // Check if DataProcessor can be instantiated
    try {
      const processor = new DataProcessor();
      if (!processor) {
        dataProcessorIssues.push('Unable to create DataProcessor instance');
      } else {
        // Check for required methods
        const requiredMethods = [
          'processData', 'processCSV', 'processJSON', 
          'convertToVisualizationFormat'
        ];
        
        requiredMethods.forEach(method => {
          if (typeof processor[method] !== 'function') {
            dataProcessorIssues.push(`DataProcessor.${method} is not a function`);
          }
        });
        
        // Check processData method
        if (typeof processor.processData === 'function') {
          try {
            const testCSV = 'x,y,z\n1,2,3\n4,5,6';
            const result = processor.processData(testCSV, 'csv');
            if (!result || !result.nodes || !Array.isArray(result.nodes)) {
              dataProcessorIssues.push('DataProcessor.processData did not return valid data');
            }
          } catch (e) {
            dataProcessorIssues.push('Error calling DataProcessor.processData: ' + e.message);
          }
        }
      }
    } catch (e) {
      dataProcessorIssues.push('Error creating DataProcessor: ' + e.message);
    }
  }
  
  console.log('DataProcessor issues:', dataProcessorIssues.length ? dataProcessorIssues : 'None');
  
  // Check UI Controller implementation
  console.log('Checking UIController implementation...');
  const uiControllerIssues = [];
  
  if (!window.UIController) {
    uiControllerIssues.push('UIController class not defined');
  } else if (!window.uiController) {
    uiControllerIssues.push('uiController instance not created');
  } else {
    // Check for required methods
    const requiredMethods = [
      'init', 'setupUIElements', 'setupEventListeners', 
      'handleFileInput', 'importData', 'openFileDialog',
      'updateLayout', 'updateNodeSize', 'toggleConnections',
      'saveScene', 'exportScreenshot'
    ];
    
    requiredMethods.forEach(method => {
      if (typeof window.uiController[method] !== 'function') {
        uiControllerIssues.push(`UIController.${method} is not a function`);
      }
    });
    
    // Check initialization status
    if (!window.uiController.isInitialized) {
      uiControllerIssues.push('UIController is not initialized');
    }
  }
  
  console.log('UIController issues:', uiControllerIssues.length ? uiControllerIssues : 'None');
  
  // Comprehensive summary
  const allIssues = [...threeIssues, ...scene3dIssues, ...dataProcessorIssues, ...uiControllerIssues];
  
  console.log('--------------------------------');
  console.log('DIAGNOSTICS SUMMARY:');
  console.log('Total issues found:', allIssues.length);
  
  if (allIssues.length > 0) {
    console.log('Issues detected:');
    allIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    
    console.log('Recommendations:');
    if (threeIssues.length > 0) {
      console.log('- Fix THREE.js implementation first as it is a foundational component');
    }
    if (scene3dIssues.length > 0) {
      console.log('- Address Scene3D issues to ensure visualization works');
    }
    if (dataProcessorIssues.length > 0) {
      console.log('- Fix DataProcessor to properly handle data import');
    }
    if (uiControllerIssues.length > 0) {
      console.log('- Address UIController issues for user interaction');
    }
  } else {
    console.log('No issues detected. The application should work correctly!');
  }
  
  console.groupEnd();
  
  return {
    threeIssues,
    scene3dIssues,
    dataProcessorIssues,
    uiControllerIssues,
    allIssues
  };
};

// Automatically run diagnostics if the script is loaded directly
window.runDeepDiagnostics(); 