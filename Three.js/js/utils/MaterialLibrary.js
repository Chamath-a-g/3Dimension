import * as THREE from "three";

/**
 * Centralized definition of materials used throughout the application
 */
export class MaterialLibrary {
  static getMaterials() {
    return {
      wall: new THREE.MeshStandardMaterial({
        color: 0xeeeeee,
        roughness: 0.7,
        metalness: 0.1,
      }),
      floor: new THREE.MeshStandardMaterial({
        color: 0xddddcc,
        roughness: 0.8,
        metalness: 0.1,
      }),
      door: new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.5,
        metalness: 0.2,
      }),
      window: new THREE.MeshStandardMaterial({
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.6,
        roughness: 0.2,
        metalness: 0.5,
      }),
    };
  }
}