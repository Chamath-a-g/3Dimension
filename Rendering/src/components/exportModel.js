import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

export function exportModel(scene) {
    const exporter = new GLTFExporter();
    
    exporter.parse(scene, function(result) {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "3DModel.gltf";
        link.click();
    });
}