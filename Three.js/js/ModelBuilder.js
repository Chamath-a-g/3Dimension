import * as THREE from "three"

/**
 * Converts 2D blueprint data to 3D objects and adds them to the scene
 */
export class ModelBuilder {
  constructor(sceneManager) {
    this.sceneManager = sceneManager
    this.wallHeight = 2.5 // Default wall height in meters
    this.wallThickness = 0.2 // Default wall thickness in meters

    // Materials
    this.materials = {
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
    }

    // Model bounds for centering and scaling
    this.modelBounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  }

  /**
   * Build 3D model from blueprint data
   * @param {Object} data - Blueprint data with walls, doors, and windows
   */
  buildFromData(data) {
    // Reset model bounds
    this.resetModelBounds()

    // Create floor
    this.createFloor(data)

    // Create walls
    if (data.walls && data.walls.length > 0) {
      data.walls.forEach((wall) => this.createWall(wall))
    }

    // Create doors
    if (data.doors && data.doors.length > 0) {
      data.doors.forEach((door) => this.createDoor(door))
    }

    // Create windows
    if (data.windows && data.windows.length > 0) {
      data.windows.forEach((window) => this.createWindow(window))
    }
  }

  /**
   * Reset model bounds tracking
   */
  resetModelBounds() {
    this.modelBounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    }
  }

  /**
   * Update model bounds based on a point
   * @param {Object} point - Point with x and y coordinates
   */
  updateModelBounds(point) {
    this.modelBounds.minX = Math.min(this.modelBounds.minX, point.x)
    this.modelBounds.maxX = Math.max(this.modelBounds.maxX, point.x)
    this.modelBounds.minY = Math.min(this.modelBounds.minY, point.y)
    this.modelBounds.maxY = Math.max(this.modelBounds.maxY, point.y)
  }

  /**
   * Create floor based on model bounds
   * @param {Object} data - Blueprint data
   */
  createFloor(data) {
    // First determine the bounds from walls
    if (data.walls && data.walls.length > 0) {
      data.walls.forEach((wall) => {
        this.updateModelBounds(wall.start)
        this.updateModelBounds(wall.end)
      })
    }

    // Add some padding to the floor
    const padding = 1
    const width = this.modelBounds.maxX - this.modelBounds.minX + padding * 2
    const depth = this.modelBounds.maxY - this.modelBounds.minY + padding * 2

    // Create floor geometry
    const geometry = new THREE.BoxGeometry(width, 0.1, depth)
    const floor = new THREE.Mesh(geometry, this.materials.floor)

    // Position floor at the center of the model
    floor.position.set(
      (this.modelBounds.minX + this.modelBounds.maxX) / 2,
      -0.05, // Half of floor thickness
      (this.modelBounds.minY + this.modelBounds.maxY) / 2,
    )

    floor.receiveShadow = true
    this.sceneManager.addToScene(floor)
  }

  /**
   * Create a wall from wall data
   * @param {Object} wallData - Wall data with start and end points
   */
  createWall(wallData) {
    const start = wallData.start
    const end = wallData.end
    const thickness = wallData.thickness || this.wallThickness

    // Update model bounds
    this.updateModelBounds(start)
    this.updateModelBounds(end)

    // Calculate wall length and orientation
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2))

    // Skip walls with zero length
    if (length < 0.01) return

    // Calculate wall angle
    const angle = Math.atan2(end.y - start.y, end.x - start.x)

    // Create wall geometry
    const geometry = new THREE.BoxGeometry(length, this.wallHeight, thickness)
    const wall = new THREE.Mesh(geometry, this.materials.wall)

    // Position wall
    wall.position.set((start.x + end.x) / 2, this.wallHeight / 2, (start.y + end.y) / 2)

    // Rotate wall to align with angle
    wall.rotation.y = -angle

    wall.castShadow = true
    wall.receiveShadow = true

    this.sceneManager.addToScene(wall)
  }

  /**
   * Create a door from door data
   * @param {Object} doorData - Door data with position, width, height, and rotation
   */
  createDoor(doorData) {
    const position = doorData.position
    const width = doorData.width || 0.9
    const height = doorData.height || 2.1
    const rotation = doorData.rotation || 0

    // Create door frame
    const frameGeometry = new THREE.BoxGeometry(width, height, 0.05)
    const frame = new THREE.Mesh(frameGeometry, this.materials.door)

    // Position door
    frame.position.set(position.x, height / 2, position.y)

    // Rotate door
    frame.rotation.y = rotation

    frame.castShadow = true
    frame.receiveShadow = true

    this.sceneManager.addToScene(frame)
  }

  /**
   * Create a window from window data
   * @param {Object} windowData - Window data with position, width, height, sillHeight, and rotation
   */
  createWindow(windowData) {
    const position = windowData.position
    const width = windowData.width || 1.0
    const height = windowData.height || 1.2
    const sillHeight = windowData.sillHeight || 0.9
    const rotation = windowData.rotation || 0

    // Create window pane
    const paneGeometry = new THREE.BoxGeometry(width, height, 0.05)
    const pane = new THREE.Mesh(paneGeometry, this.materials.window)

    // Position window
    pane.position.set(position.x, sillHeight + height / 2, position.y)

    // Rotate window
    pane.rotation.y = rotation

    pane.castShadow = true
    pane.receiveShadow = true

    this.sceneManager.addToScene(pane)
  }

  /**
   * Update wall height and rebuild model
   * @param {number} height - New wall height in meters
   */
  updateWallHeight(height) {
    this.wallHeight = height

    // Find all wall meshes and update their height
    this.sceneManager.scene.traverse((object) => {
      if (object.isMesh && object.material === this.materials.wall) {
        // Get current scale
        const currentScale = object.scale.y

        // Calculate new scale based on height ratio
        const newScale = height / (this.wallHeight / currentScale)

        // Update scale
        object.scale.y = newScale

        // Update position to keep bottom of wall at ground level
        object.position.y = height / 2
      }
    })
  }

  /**
   * Get model dimensions as a formatted string
   * @returns {string} - Formatted dimensions string
   */
  getModelDimensions() {
    if (this.modelBounds.minX === Number.POSITIVE_INFINITY) {
      return "No model data available"
    }

    const width = (this.modelBounds.maxX - this.modelBounds.minX).toFixed(2)
    const depth = (this.modelBounds.maxY - this.modelBounds.minY).toFixed(2)

    return `Width: ${width}m × Depth: ${depth}m × Height: ${this.wallHeight}m`
  }
}

