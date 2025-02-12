import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// This function is used to load external 3D models dynamically using GLTF loader.
export function loadModel(scene, modelPath) {
    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        (gltf) => {
            const model = gltf.scene;
            model.position.set(0, 0, 0); // Position can be adjusted later.
            scene.add(model);
            console.log("Model loaded successfully!");
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
        },
        (error) => {
            console.error("An error occurred while loading the model:", error);
        }
    );
}