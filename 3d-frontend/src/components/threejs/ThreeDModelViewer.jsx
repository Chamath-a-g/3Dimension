import React, { useRef, useEffect } from 'react';
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const ThreeDModelViewer = ({ blueprintData }) => {
    const canvasContainerRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const rendererRef = useRef(null);
    const controlsRef = useRef(null);

    useEffect(() => {
        const container = canvasContainerRef.current;
        if (!container) return;

        // 1. Scene, Camera, Renderer
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf0f0f0); // Background color remains light grey
        const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth / container.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);

        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        // 2. OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controlsRef.current = controls;

        // 3. Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        // 4. Build 3D Model (initially empty)
        if (blueprintData) {
            buildModel(blueprintData, scene);
        }

        // 5. Animation Loop
        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        // 6. Resize Handling
        const handleResize = () => {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // 7. Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            controlsRef.current?.dispose();
            rendererRef.current?.dispose();
            if (sceneRef.current && typeof sceneRef.current.dispose === 'function') {
                sceneRef.current.dispose();
            }
        };
    }, [blueprintData]); // Re-run when blueprintData changes

    const buildModel = (data, scene) => {
        // Clear previous model (if any) - simple clear for now
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }
        // Re-add lights and helpers (grid, axis) - if you had them initially, re-add here

        // Add a white grid helper
        const gridHelper = new THREE.GridHelper(30, 30, 0xffffff, 0xffffff); // White grid lines and center lines
        scene.add(gridHelper);

        // Add a basic floor - Keep light grey floor if you want, or change to white too
        const floorGeometry = new THREE.PlaneGeometry(30, 30);
        const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9, metalness: 0.1 }); // Light grey floor
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        if (data && data.walls) {
            data.walls.forEach(wall => {
                const start = wall.start;
                const end = wall.end;
                const thickness = wall.thickness || 0.2; // Default thickness

                // Calculate wall length and angle
                const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                const angle = Math.atan2(end.y - start.y, end.x - start.x);

                const wallGeometry = new THREE.BoxGeometry(length, 2.5, thickness);
                const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0.1 }); // White walls - CHANGED COLOR TO WHITE
                const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);

                // Position and rotate wall
                wallMesh.position.set((start.x + end.x) / 2, 1.25, (start.y + end.y) / 2);
                wallMesh.rotation.y = -angle;
                wallMesh.castShadow = true;
                wallMesh.receiveShadow = true;
                scene.add(wallMesh);
            });
        }

        if (data && data.doors) {
            data.doors.forEach(door => {
                const position = door.position;
                const width = door.width || 0.9;
                const height = door.height || 2.1;

                const doorGeometry = new THREE.BoxGeometry(width, height, 0.1);
                const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513, roughness: 0.6, metalness: 0.1 }); // Brown doors - CHANGED COLOR TO BROWN (0x8b4513 is brown)
                const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
                doorMesh.position.set(position.x, height / 2, position.y);
                doorMesh.castShadow = true;
                doorMesh.receiveShadow = true;
                scene.add(doorMesh);
            });
        }

        if (data && data.windows) {
            data.windows.forEach(window => {
                const position = window.position;
                const width = window.width || 1.2;
                const height = window.height || 1.0;
                const sillHeight = window.sillHeight || 0.9;

                const windowGeometry = new THREE.BoxGeometry(width, height, 0.05);
                const windowMaterial = new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.5, roughness: 0.1, metalness: 0.1 }); // Transparent light blue windows - KEPT TRANSPARENT, but you can change color if needed
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(position.x, sillHeight + height / 2, position.y);
                windowMesh.castShadow = true;
                windowMesh.receiveShadow = true;
                scene.add(windowMesh);
            });
        }

        // Focus camera on the model (very basic auto-focus) - No changes
        if (data && data.walls && data.walls.length > 0) {
            const boundingBox = new THREE.Box3().setFromObject(scene);
            const center = boundingBox.getCenter(new THREE.Vector3());
            controlsRef.current.target.copy(center);
            cameraRef.current.lookAt(center);
            controlsRef.current.update();
        } else {
            // Default camera position if no walls - No changes
            cameraRef.current.position.set(10, 10, 10);
            cameraRef.current.lookAt(0, 0, 0);
            controlsRef.current.update();
        }
    };

    return (
        <div id="canvas-container" ref={canvasContainerRef} style={{ width: '100%', height: '70vh' }} />
    );
};

export default ThreeDModelViewer;