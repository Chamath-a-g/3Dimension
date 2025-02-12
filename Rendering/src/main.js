import { createScene } from "./components/scene.js";
import { loadModel } from "./components/modelLoader.js";

//Initalizing scene, camera, renderer
const {scene, camera, renderer, controls} = createScene();

//Loading a 3D model
//loadModel(scene, "location of the stored 3D model file. ");

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

