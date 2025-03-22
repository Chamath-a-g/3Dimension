import { BlueprintLoader } from "./BlueprintLoader.js";
import { SceneManager } from "./SceneManager.js";
import { ModelBuilder } from "./ModelBuilder.js";


class BlueprintApp {
  constructor() {
    // Initialize components
    this.sceneManager = new SceneManager("canvas-container");
    this.blueprintLoader = new BlueprintLoader();
    this.modelBuilder = new ModelBuilder(this.sceneManager);
    
    // Store current blueprint data
    this.currentBlueprintData = null;

    // Set up event listeners
    this.setupEventListeners();

    // Add fullscreen change listeners
    document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
    document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());

    // Start render loop
    this.animate();
  }

  setupEventListeners() {
    // File upload handler
const fileInput = document.getElementById("json-file");
if (fileInput) {
  fileInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // First load the new blueprint data
        const blueprintData = await this.blueprintLoader.loadFromFile(file);
        console.log("Loaded new blueprint data:", blueprintData);
        
        // Clear the scene first
        try {
          console.log("Attempting to clear scene...");
          this.sceneManager.clearScene();
          console.log("Scene cleared successfully");
        } catch (clearError) {
          console.error("Error clearing scene:", clearError);
          // Recreate the scene if clearing failed
          this.sceneManager.scene = new THREE.Scene();
          this.sceneManager.scene.background = new THREE.Color(0xf0f0f0);
        }
        
        // Reset the model builder state
        if (this.modelBuilder) {
          console.log("Resetting model builder state...");
          // Reset model bounds
          this.modelBuilder.modelBounds = {
            minX: Number.POSITIVE_INFINITY,
            maxX: Number.NEGATIVE_INFINITY,
            minY: Number.POSITIVE_INFINITY,
            maxY: Number.NEGATIVE_INFINITY,
          };
          
          // Clear openings array
          this.modelBuilder.openings = [];
        }
        
        // Set the new blueprint data
        this.currentBlueprintData = blueprintData;
        
        // Build the new model
        console.log("Building new model...");
        this.buildModel(blueprintData);
        
        // Reset the file input
        fileInput.value = "";
      } catch (error) {
        console.error("Error loading blueprint:", error);
        alert("Error loading blueprint file. Please check the console for details.");
        // Reset the file input
        fileInput.value = "";
      }
    }
  });
}
    

    // Camera view controls
    document.getElementById("top-view")?.addEventListener("click", () => {
      this.sceneManager.setTopView();
    });

    document.getElementById("perspective-view")?.addEventListener("click", () => {
      this.sceneManager.setPerspectiveView();
    });

    document.getElementById("reset-camera")?.addEventListener("click", () => {
      this.sceneManager.resetCamera();
    });

    // Add fullscreen toggle listener
    document.getElementById("fullscreen-view")?.addEventListener("click", () => {
      this.toggleFullscreen();
    });

    // Wall height slider handler
// In the setupEventListeners method, update the wall height slider handler

// Wall height slider handler
const wallHeightSlider = document.getElementById("wall-height");
const wallHeightValue = document.getElementById("wall-height-value");

if (wallHeightSlider) {
  wallHeightSlider.addEventListener("input", (event) => {
    const height = parseFloat(event.target.value);
    
    // Update the displayed value in the UI
    if (wallHeightValue) {
      wallHeightValue.textContent = height.toFixed(1);
    }
    
    if (this.modelBuilder && !isNaN(height)) {
      this.modelBuilder.wallHeight = height;
      
      // Safe rebuild with error handling
      try {
        console.log("Rebuilding model with new wall height:", height);
        this.rebuildModel();
      } catch (error) {
        console.error("Error rebuilding model:", error);
        // Try to recover by recreating the scene
        try {
          console.log("Attempting recovery...");
          this.sceneManager.scene = new THREE.Scene();
          this.sceneManager.scene.background = new THREE.Color(0xf0f0f0);
          
          // Try to rebuild again
          if (this.currentBlueprintData) {
            this.buildModel(this.currentBlueprintData);
          }
        } catch (recoveryError) {
          console.error("Recovery failed:", recoveryError);
        }
      }
    }
  });
}
    // Handle window resize
    window.addEventListener("resize", () => {
      this.sceneManager.onWindowResize();
    });
  }

  rebuildModel() {
    if (!this.currentBlueprintData) {
      console.warn("No blueprint data to rebuild");
      return;
    }
    
    try {
      console.log("Clearing scene for rebuild...");
      this.sceneManager.clearScene();
      console.log("Building model from current data...");
      this.buildModel(this.currentBlueprintData);
    } catch (error) {
      console.error("Error in rebuildModel:", error);
      // Attempt recovery
      this.sceneManager.scene = new THREE.Scene();
      this.sceneManager.scene.background = new THREE.Color(0xf0f0f0);
      this.buildModel(this.currentBlueprintData);
    }
  }

  // Fullscreen toggle method
  toggleFullscreen() {
    const container = document.getElementById('canvas-container');
    
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) { /* Firefox */
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) { /* IE/Edge */
        container.msRequestFullscreen();
      }
      
      container.classList.add('fullscreen');
      
      // Create floating controls in fullscreen
      const controls = document.createElement('div');
      controls.id = 'fullscreen-controls';
      controls.className = 'fullscreen-controls';
      
      const exitButton = document.createElement('button');
      exitButton.textContent = 'Exit Fullscreen';
      exitButton.addEventListener('click', () => {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      });
      
      controls.appendChild(exitButton);
      container.appendChild(controls);
      
      // Create floating info panel
      const infoPanel = document.createElement('div');
      infoPanel.id = 'fullscreen-info';
      infoPanel.className = 'fullscreen-info';
      
      // Copy content from the model-info element
      const modelInfo = document.getElementById('model-info');
      if (modelInfo) {
        infoPanel.innerHTML = '<h3>Model Information</h3>' + modelInfo.innerHTML;
      } else {
        infoPanel.innerHTML = '<h3>Model Information</h3><p>No model information available</p>';
      }
      
      container.appendChild(infoPanel);
      
      // Notify the SceneManager to resize
      this.sceneManager.onWindowResize();
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  }

  // Handle fullscreen change events
  handleFullscreenChange() {
    const container = document.getElementById('canvas-container');
    
    if (!document.fullscreenElement) {
      container.classList.remove('fullscreen');
      
      // Remove floating controls
      const controls = document.getElementById('fullscreen-controls');
      if (controls) {
        controls.remove();
      }
      
      // Remove floating info panel
      const infoPanel = document.getElementById('fullscreen-info');
      if (infoPanel) {
        infoPanel.remove();
      }
      
      // Notify the SceneManager to resize back
      this.sceneManager.onWindowResize();
    }
  }

  buildModel(blueprintData) {
    console.log("Building model with data:", blueprintData);
  
    // Clear previous model
    this.sceneManager.clearScene();
    
    // Build new model from blueprint data
    this.modelBuilder.buildFromData(blueprintData);
  
    // Center the model first
    this.sceneManager.centerModel();
  
    // Then focus camera on the model
    this.sceneManager.focusOnModel();
  
    // Update info panel
    this.updateModelInfo(blueprintData);
  }

  updateModelInfo(blueprintData) {
    const infoElement = document.getElementById("model-info");
    if (!infoElement) return;
  
    // Count elements
    const wallCount = blueprintData.walls?.length || 0;
    const doorCount = blueprintData.doors?.length || 0;
    const windowCount = blueprintData.windows?.length || 0;
  
    // Create the HTML for model info
    const infoHTML = `
      <p><strong>Elements detected:</strong></p>
      <ul>
        <li>Walls: ${wallCount}</li>
        <li>Doors: ${doorCount}</li>
        <li>Windows: ${windowCount}</li>
      </ul>
      <p><strong>Blueprint dimensions:</strong> ${this.modelBuilder.getModelDimensions()}</p>
    `;
  
    // Update the main info panel
    infoElement.innerHTML = infoHTML;
  
    // Update fullscreen info panel if it exists
    const fullscreenInfoElement = document.getElementById("fullscreen-info");
    if (fullscreenInfoElement) {
      fullscreenInfoElement.innerHTML = '<h3>Model Information</h3>' + infoHTML;
    }
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.sceneManager.update();
  };
}

// Initialize application when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  new BlueprintApp();
});

