import * as THREE from "three";

// This function is used to load blueprints to the 3D space.
export function loadBlueprint(scene, imagePath){
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = "anonymous";
    textureLoader.load(
        imagePath,
        (texture) => {
            // Createing a 3D Plane
            const geometry = new THREE.PlaneGeometry(10, 10); // A flat rectangular surface in a 3D plane

            // Applying the Image as a Texture
            const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

            // Creating a Mesh (Combining Geometry & Material)
            const plane = new THREE.Mesh(geometry, material);

            // Rotating the Plane to Lay Flat (Like a Table)
            plane.rotation.x = -Math.PI / 2;

            // Adding the Plane to the Scene
            scene.add(plane);

            console.log("Blueprint loaded successfully!");
        },
        undefined,
        (error) => {
            console.error("Error loading blueprint:", error.message || error);
        }
    );



}
//This function is used to load blueprint to the 3D space by the user (Dynamic uploads)
export function loaduserInput(scene){
    const input =  document.getElementById("blueprintInput");

    input.addEventListener("change", (event) => {
        const file = event.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            loadBlueprint(scene, url);
        }
    });
    
}