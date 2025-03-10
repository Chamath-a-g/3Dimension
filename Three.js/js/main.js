import { BlueprintLoader } from "./BlueprintLoader.js";
import { SceneManager } from "./SceneManager.js";
import { ModelBuilder } from "./ModelBuilder.js";

class BlueprintApp {
  constructor() {
    // Initialize components
    this.sceneManager = new SceneManager("canvas-container");
    this.blueprintLoader = new BlueprintLoader();
    this.modelBuilder = new ModelBuilder(this.sceneManager);

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
            const blueprintData = await this.blueprintLoader.loadFromFile(file);
            console.log("Loaded blueprint data:", blueprintData);
            this.buildModel(blueprintData);
          } catch (error) {
            console.error("Error loading blueprint:", error);
            alert("Error loading blueprint file. Please check the console for details.");
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

    // Wall height slider
    const wallHeightSlider = document.getElementById("wall-height");
    const wallHeightValue = document.getElementById("wall-height-value");

    if (wallHeightSlider && wallHeightValue) {
      wallHeightSlider.addEventListener("input", (event) => {
        const height = Number.parseFloat(event.target.value);
        wallHeightValue.textContent = height.toFixed(1);
        this.modelBuilder.updateWallHeight(height);
      });
    }

    // Handle window resize
    window.addEventListener("resize", () => {
      this.sceneManager.onWindowResize();
    });
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

