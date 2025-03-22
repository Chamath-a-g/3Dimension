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
        // Add wood-like appearance
        map: this.generateWoodTexture()
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
  
  // Generate a procedural wood texture for doors
  static generateWoodTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    
    // Background color
    context.fillStyle = '#8B4513';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    // Wood grain
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * canvas.width;
      context.strokeStyle = `rgba(60, 30, 15, ${Math.random() * 0.1 + 0.05})`;
      context.lineWidth = Math.random() * 5 + 1;
      context.beginPath();
      context.moveTo(x, 0);
      context.bezierCurveTo(
        x + Math.random() * 100 - 50, canvas.height / 3,
        x + Math.random() * 100 - 50, canvas.height * 2/3,
        x, canvas.height
      );
      context.stroke();
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
  }
}