import { createScene } from "./components/scene.js";
import { loadModel } from "./components/modelLoader.js";
import { loadBlueprint } from "./components/blueprintLoader.js";

//Initalizing scene, camera, renderer
const {scene, camera, renderer, controls} = createScene();

//Loading a 3D model
//loadModel(scene, "location of the stored 3D model file. ");

// Loading the blueprint as a background
loadBlueprint(scene, "/Rendering/public/blueprint1.png");

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

