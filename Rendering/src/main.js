import { createScene } from "./components/scene.js";
import { loadBlueprint } from "./components/blueprintLoader.js";
import { loaduserInput  } from "./components/blueprintLoader.js";
import { generate3DModel } from "./components/generateModel.js";


//Initalizing scene, camera, renderer
const {scene, camera, renderer, controls} = createScene();

// Loading the blueprint as a background
//loadBlueprint(scene, "/blueprint@2x.jpg");

// Loading the user given blueprint as an background
loaduserInput(scene);

// Calling the 3D model generating function
 generate3DModel(scene, blueprintCanvas);

// Animation loop  
function animate() {
  requestAnimationFrame(animate);
  controls.update();5
  renderer.render(scene, camera);
}
animate();

