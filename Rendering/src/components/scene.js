import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function createScene(){

// Setting up a Scene 
const scene = new THREE.Scene();

//Creating a perspective camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 10);

//Creating webGL renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Adding a grid helper to acts as the blueprint background
const gridHelper = new THREE.GridHelper(10, 10);
scene.add(gridHelper);

// Using Lighting effects
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Orbit Controls (to move around the scene) for user interaction
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Handle window resize
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return {scene, camera, renderer, controls};

}