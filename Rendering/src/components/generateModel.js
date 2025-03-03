import* as THREE from "three";

export function generate3DModel(scene, blueprintCanvas){
    const ctx = blueprintCanvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, blueprintCanvas.width, blueprintCanvas.height);
    const pixels = imageData.data;

    const width = blueprintCanvas.width;
    const height = blueprintCanvas.height;

    const wallHeight = 5; //Height of walls in 3D space
    const wallThickness = 0.2 ; //Thickness of wall

     // Loop through pixels to detect black (wall) areas
     for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let index = (y * width + x) * 4; // RGBA format
            let r = pixels[index];
            let g = pixels[index + 1];
            let b = pixels[index + 2];

            // Detect black pixels (walls)
            if (r < 50 && g < 50 && b < 50) {
                let wall = new THREE.BoxGeometry(wallThickness, wallHeight, wallThickness);
                let material = new THREE.MeshBasicMaterial({ color: 0x808080 });
                let wallMesh = new THREE.Mesh(wall, material);

                // Positioning in 3D space
                wallMesh.position.set(x * 0.1, wallHeight / 2, y * 0.1);

                scene.add(wallMesh);
            }
        }
    }
}