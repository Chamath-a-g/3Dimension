import { BlueprintLoader } from "./BlueprintLoader.js";
import { SceneManager } from "./SceneManager.js";
import { ModelBuilder } from "./ModelBuilder.js";
import * as THREE from "three";
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';


class BlueprintApp {
    constructor() {
        // Initialize components
        this.sceneManager = new SceneManager("canvas-container");
        this.blueprintLoader = new BlueprintLoader();
        this.modelBuilder = new ModelBuilder(this.sceneManager);

        // Store current blueprint data
        this.currentBlueprintData = null;

        // Check for blueprint data in URL parameters
        this.loadBlueprintFromURL();

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

    async loadBlueprintFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const blueprintDataJson = urlParams.get('blueprintDataJson');

        if (blueprintDataJson) {
            try {
                const blueprintData = JSON.parse(decodeURIComponent(blueprintDataJson)); // Decode URL-encoded JSON
                console.log("Loaded blueprint data from URL:", blueprintData);
                this.currentBlueprintData = blueprintData;
                this.buildModel(blueprintData);
                alert("Blueprint loaded from URL!"); // Optional success alert
            } catch (error) {
                console.error("Error loading blueprint from URL:", error);
                alert("Error loading blueprint from URL. Please check console for details.");
            }
        } else {
            console.log("No blueprint data in URL. Waiting for file upload.");
            alert("No blueprint data in URL. Please upload a JSON file to load blueprint."); // Optional instruction alert
        }
    }


    setupEventListeners() {
        // File upload handler - Keep File Upload Functionality for Fallback
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


        // Camera view controls - No changes needed
        document.getElementById("top-view")?.addEventListener("click", () => {
            this.sceneManager.setTopView();
        });

        document.getElementById("perspective-view")?.addEventListener("click", () => {
            this.sceneManager.setPerspectiveView();
        });

        document.getElementById("reset-camera")?.addEventListener("click", () => {
            this.sceneManager.resetCamera();
        });

        // Add fullscreen toggle listener - No changes needed
        document.getElementById("fullscreen-view")?.addEventListener("click", () => {
            this.toggleFullscreen();
        });


        // Wall height slider handler - No changes needed
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

        // Export format handlers - No changes needed
        document.getElementById("export-gltf")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.exportModel('gltf');
        });

        document.getElementById("export-obj")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.exportModel('obj');
        });

        document.getElementById("export-dxf")?.addEventListener("click", (e) => {
            e.preventDefault();
            this.exportModel('dxf');
        });


        // Handle window resize - No changes needed
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

    // Fullscreen toggle method - No changes needed
    toggleFullscreen() {
        // ... (rest of toggleFullscreen function - no changes) ...
    }

    // Handle fullscreen change events - No changes needed
    handleFullscreenChange() {
        // ... (rest of handleFullscreenChange function - no changes) ...
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

    async exportModel(format = 'gltf') {
        if (!this.sceneManager || !this.sceneManager.scene) {
            console.warn("No scene to export");
            alert("Nothing to export. Please load a blueprint first.");
            return;
        }

        // Create a copy of the scene with only model elements (no helpers)
        const exportScene = new THREE.Scene();
        this.sceneManager.scene.traverse((object) => {
            // Only copy meshes (walls, doors, windows), not helpers or lights
            if (object.isMesh &&
                !(object instanceof THREE.GridHelper) &&
                !(object instanceof THREE.AxesHelper)) {
                exportScene.add(object.clone());
            }
        });

        const filename = this.currentBlueprintData?.name || 'blueprint-model';

        try {
            switch (format) {
                case 'gltf':
                    // GLTF Export
                    const GLTFExporter = await import('three/addons/exporters/GLTFExporter.js').then(m => m.GLTFExporter);
                    const gltfExporter = new GLTFExporter();

                    gltfExporter.parse(
                        exportScene,
                        (gltf) => {
                            const blob = new Blob([JSON.stringify(gltf)], { type: 'application/json' });
                            saveAs(blob, `${filename}.gltf`);
                        },
                        (error) => {
                            throw error;
                        },
                        { binary: false }
                    );
                    break;

                case 'obj':
                    // OBJ Export
                    const OBJExporter = await import('three/addons/exporters/OBJExporter.js').then(m => m.OBJExporter);
                    const objExporter = new OBJExporter();

                    const objOutput = objExporter.parse(exportScene);
                    const objBlob = new Blob([objOutput], { type: 'text/plain' });
                    saveAs(objBlob, `${filename}.obj`);
                    break;

                case 'dxf':
                    // DXF Export - This is more complex as Three.js doesn't have a built-in DXF exporter
                    // We'll use a simplified approach that exports the 2D outline
                    alert("Exporting to DXF. Note: This will export a 2D floor plan only.");

                    // Create a 2D representation (floorplan) from the 3D model
                    const dxfContent = this.createDXFContent();
                    const dxfBlob = new Blob([dxfContent], { type: 'application/dxf' });
                    saveAs(dxfBlob, `${filename}.dxf`);
                    break;

                default:
                    alert("Unknown export format");
            }
        } catch (error) {
            console.error('An error happened during export:', error);
            alert(`Error exporting model to ${format.toUpperCase()} format. See console for details.`);
        }
    }

    // Helper method for creating DXF content
    createDXFContent() {
        // This is a very simplified DXF export
        // For a complete DXF exporter, you would need a more complex implementation

        let dxf = '';

        // DXF header
        dxf += '0\nSECTION\n';
        dxf += '2\nHEADER\n';
        dxf += '0\nENDSEC\n';

        // Entities section
        dxf += '0\nSECTION\n';
        dxf += '2\nENTITIES\n';

        // Add walls as lines
        if (this.currentBlueprintData?.walls) {
            this.currentBlueprintData.walls.forEach(wall => {
                // Add LINE entity
                dxf += '0\nLINE\n';
                dxf += '8\nWALLS\n'; // Layer name
                dxf += `10\n${wall.start.x}\n`; // Start X
                dxf += `20\n${wall.start.y}\n`; // Start Y
                dxf += `30\n0\n`;               // Start Z
                dxf += `11\n${wall.end.x}\n`;   // End X
                dxf += `21\n${wall.end.y}\n`;   // End Y
                dxf += `31\n0\n`;               // End Z
            });
        }

        // Add doors as polylines
        if (this.currentBlueprintData?.doors) {
            this.currentBlueprintData.doors.forEach(door => {
                const pos = door.position;
                const width = door.width || 0.9;
                const rotation = door.rotation || 0;

                // Calculate door endpoints
                const halfWidth = width / 2;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);

                const x1 = pos.x - halfWidth * cos;
                const y1 = pos.y - halfWidth * sin;
                const x2 = pos.x + halfWidth * cos;
                const y2 = pos.y + halfWidth * sin;

                // Add LINE entity for door
                dxf += '0\nLINE\n';
                dxf += '8\nDOORS\n'; // Layer name
                dxf += `10\n${x1}\n`; // Start X
                dxf += `20\n${y1}\n`; // Start Y
                dxf += `30\n0\n`;     // Start Z
                dxf += `11\n${x2}\n`; // End X
                dxf += `21\n${y2}\n`; // End Y
                dxf += `31\n0\n`;     // End Z
            });
        }

        // Add windows
        if (this.currentBlueprintData?.windows) {
            this.currentBlueprintData.windows.forEach(window => {
                const pos = window.position;
                const width = window.width || 1.0;
                const rotation = window.rotation || 0;

                // Calculate window endpoints
                const halfWidth = width / 2;
                const cos = Math.cos(rotation);
                const sin = Math.sin(rotation);

                const x1 = pos.x - halfWidth * cos;
                const y1 = pos.y - halfWidth * sin;
                const x2 = pos.x + halfWidth * cos;
                const y2 = pos.y + halfWidth * sin;

                // Add LINE entity for window
                dxf += '0\nLINE\n';
                dxf += '8\nWINDOWS\n'; // Layer name
                dxf += `10\n${x1}\n`;  // Start X
                dxf += `20\n${y1}\n`;  // Start Y
                dxf += `30\n0\n`;      // Start Z
                dxf += `11\n${x2}\n`;  // End X
                dxf += `21\n${y2}\n`;  // End Y
                dxf += `31\n0\n`;      // End Z
            });
        }

        // End of entities section
        dxf += '0\nENDSEC\n';

        // End of file
        dxf += '0\nEOF\n';

        return dxf;
    }

}

// Initialize application when DOM is loaded
window.addEventListener("DOMContentLoaded", () => {
    new BlueprintApp();
});