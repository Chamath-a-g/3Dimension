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

    infoElement.innerHTML = `
      <p><strong>Elements detected:</strong></p>
      <ul>
        <li>Walls: ${wallCount}</li>
        <li>Doors: ${doorCount}</li>
        <li>Windows: ${windowCount}</li>
      </ul>
      <p><strong>Blueprint dimensions:</strong> ${this.modelBuilder.getModelDimensions()}</p>
    `;
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.sceneManager.update();
  };
  // Inside the method where you load the JSON file and build the model:
handleJSONFile(file) {
  this.loader.loadFromFile(file)
      .then(data => {
          this.modelData = data;
          this.modelBuilder.buildModel(data, this.wallHeight);
          this.updateModelInfo(data);
          
          // Center the model after building
          this.sceneManager.centerModel();
          
          // Update the scene
          this.sceneManager.render();
      })
      .catch(error => {
          console.error("Error loading JSON file:", error);
          // Show error message
          document.getElementById("model-info").innerHTML = 
              `<p class="error">Error loading model: ${error.message}</p>`;
      });
}
}

// Initialize application when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
  new BlueprintApp();
});
