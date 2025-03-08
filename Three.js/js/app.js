import * as THREE from "three"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"

class BlueprintViewer {
  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    document.getElementById("canvas-container").appendChild(this.renderer.domElement)

    // Set up camera position
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)

    // Add orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    // Add grid and axes helpers
    const gridHelper = new THREE.GridHelper(10, 10)
    this.scene.add(gridHelper)

    const axesHelper = new THREE.AxesHelper(5)
    this.scene.add(axesHelper)

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 5, 5)
    this.scene.add(directionalLight)

    // Update materials
    this.materials = {
      wall: new THREE.MeshStandardMaterial({ color: 0xcccccc }),
      door: new THREE.MeshStandardMaterial({ color: 0x8b4513 }),
      window: new THREE.MeshBasicMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.3 }),
    }

    // Set up event listeners
    this.setupEventListeners()

    // Start animation loop
    this.animate()
  }

  setupEventListeners() {
    // File upload
    const fileInput = document.getElementById("json-file")
    fileInput.addEventListener("change", (e) => this.handleFileUpload(e))

    // View controls
    document.getElementById("top-view").addEventListener("click", () => this.setTopView())
    document.getElementById("perspective-view").addEventListener("click", () => this.setPerspectiveView())
    document.getElementById("reset-camera").addEventListener("click", () => this.resetCamera())

    // Wall height control
    document.getElementById("wall-height").addEventListener("input", (e) => {
      this.updateWallHeight(Number.parseFloat(e.target.value))
    })

    // Window resize
    window.addEventListener("resize", () => this.handleResize())
  }

  handleFileUpload(event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)
        console.log("Loaded data:", data)
        this.createModel(data)
      } catch (error) {
        console.error("Error parsing JSON:", error)
        alert("Error loading file. Please check the console for details.")
      }
    }
    reader.readAsText(file)
  }

  createModel(data) {
    this.clearModel()

    // Create walls first
    if (data.walls) {
      data.walls.forEach((wall) => this.createWall(wall, data.doors, data.windows))
    }

    // Create doors
    if (data.doors) {
      data.doors.forEach((door) => this.createDoor(door))
    }

    // Windows are now created as part of the wall creation process

    this.updateModelInfo(data)
  }

  createWall(wallData, doors, windows) {
    const start = wallData.start
    const end = wallData.end
    const thickness = wallData.thickness || 0.2
    const wallHeight = 2.5 // Default wall height

    // Calculate wall dimensions and orientation
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    // Create wall segments
    let currentLength = 0
    while (currentLength < length) {
      const segmentLength = length - currentLength
      let createSegment = true

      // Check for doors
      doors.forEach((door) => {
        if (this.isPointOnWall(door.position, start, end)) {
          const doorPosition = this.getRelativePosition(door.position, start, angle)
          if (doorPosition > currentLength && doorPosition < currentLength + segmentLength) {
            if (doorPosition > currentLength) {
              this.createWallSegment(start, angle, currentLength, doorPosition - currentLength, thickness, wallHeight)
            }
            currentLength = doorPosition + door.width
            createSegment = false
          }
        }
      })

      // Check for windows
      windows.forEach((window) => {
        if (this.isPointOnWall(window.position, start, end)) {
          const windowPosition = this.getRelativePosition(window.position, start, angle)
          if (windowPosition > currentLength && windowPosition < currentLength + segmentLength) {
            if (windowPosition > currentLength) {
              this.createWallSegment(start, angle, currentLength, windowPosition - currentLength, thickness, wallHeight)
            }
            this.createWindowSegment(
              start,
              angle,
              windowPosition,
              window.width,
              thickness,
              wallHeight,
              window.sillHeight,
            )
            currentLength = windowPosition + window.width
            createSegment = false
          }
        }
      })

      if (createSegment) {
        this.createWallSegment(start, angle, currentLength, segmentLength, thickness, wallHeight)
        currentLength += segmentLength
      }
    }
  }

  createWallSegment(start, angle, position, length, thickness, height) {
    const geometry = new THREE.BoxGeometry(length, height, thickness)
    const wall = new THREE.Mesh(geometry, this.materials.wall)

    wall.position.set(
      start.x + Math.cos(angle) * (position + length / 2),
      height / 2,
      start.y + Math.sin(angle) * (position + length / 2),
    )

    wall.rotation.y = -angle
    this.scene.add(wall)
  }

  createWindowSegment(start, angle, position, width, thickness, wallHeight, sillHeight) {
    // Create window frame
    const frameGeometry = new THREE.BoxGeometry(width, wallHeight, thickness)
    const frame = new THREE.Mesh(frameGeometry, this.materials.window)

    frame.position.set(
      start.x + Math.cos(angle) * (position + width / 2),
      wallHeight / 2,
      start.y + Math.sin(angle) * (position + width / 2),
    )

    frame.rotation.y = -angle
    this.scene.add(frame)

    // Create window glass
    const glassHeight = wallHeight - sillHeight
    const glassGeometry = new THREE.PlaneGeometry(width - 0.1, glassHeight - 0.1)
    const glass = new THREE.Mesh(glassGeometry, this.materials.window)

    glass.position.set(
      start.x + Math.cos(angle) * (position + width / 2),
      sillHeight + glassHeight / 2,
      start.y + Math.sin(angle) * (position + width / 2),
    )

    glass.rotation.y = -angle
    glass.rotation.y += Math.PI / 2
    this.scene.add(glass)
  }

  createDoor(doorData) {
    const geometry = new THREE.BoxGeometry(doorData.width, doorData.height, 0.05)
    const door = new THREE.Mesh(geometry, this.materials.door)

    door.position.set(doorData.position.x, doorData.height / 2, doorData.position.y)

    door.rotation.y = doorData.rotation || 0
    this.scene.add(door)
  }

  isPointOnWall(point, wallStart, wallEnd) {
    const tolerance = 0.1 // Adjust this value as needed
    const d1 = this.distance(point, wallStart)
    const d2 = this.distance(point, wallEnd)
    const wallLength = this.distance(wallStart, wallEnd)
    return Math.abs(d1 + d2 - wallLength) < tolerance
  }

  distance(point1, point2) {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2))
  }

  getRelativePosition(point, start, angle) {
    const dx = point.x - start.x
    const dy = point.y - start.y
    return dx * Math.cos(angle) + dy * Math.sin(angle)
  }

  clearModel() {
    // Remove all meshes except helpers
    this.scene.traverse((object) => {
      if (object.isMesh && !(object instanceof THREE.GridHelper) && !(object instanceof THREE.AxesHelper)) {
        this.scene.remove(object)
      }
    })
  }

  updateModelInfo(data) {
    const info = document.getElementById("model-info")
    info.innerHTML = `
            <p><strong>Elements detected:</strong></p>
            <ul>
                <li>Walls: ${data.walls ? data.walls.length : 0}</li>
                <li>Doors: ${data.doors ? data.doors.length : 0}</li>
                <li>Windows: ${data.windows ? data.windows.length : 0}</li>
            </ul>
        `
  }

  setTopView() {
    this.camera.position.set(0, 10, 0)
    this.camera.lookAt(0, 0, 0)
  }

  setPerspectiveView() {
    this.camera.position.set(5, 5, 5)
    this.camera.lookAt(0, 0, 0)
  }

  resetCamera() {
    this.setPerspectiveView()
  }

  updateWallHeight(height) {
    document.getElementById("wall-height-value").textContent = height.toFixed(1)
    // Update all wall heights
    this.scene.traverse((object) => {
      if (object.isMesh && object.material === this.materials.wall) {
        object.scale.y = height / 2.5 // 2.5 is the default height
        object.position.y = height / 2
      }
    })
  }

  handleResize() {
    const container = document.getElementById("canvas-container")
    const width = container.clientWidth
    const height = container.clientHeight

    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(width, height)
  }

  animate() {
    requestAnimationFrame(() => this.animate())
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}

// Initialize the viewer when the page loads
window.addEventListener("DOMContentLoaded", () => {
  new BlueprintViewer()
})

