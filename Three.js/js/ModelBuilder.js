import * as THREE from "three";
import { MaterialLibrary } from "./utils/MaterialLibrary.js";

/**
 * Converts 2D blueprint data to 3D objects and adds them to the scene
 */
export class ModelBuilder {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.wallHeight = 3; // Default wall height in meters
    this.wallThickness = 0.2; // Default wall thickness in meters
    this.currentBlueprintData = null; // Store blueprint data for rebuilding
  
    // Get materials from the library
    this.materials = MaterialLibrary.getMaterials();
  
    // Model bounds for centering and scaling
    this.modelBounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };
    
    // Store openings (doors and windows)
    this.openings = [];
  }

  /**
   * Register an opening (door or window) for processing with walls
   * @param {string} type - Type of opening ('door' or 'window')
   * @param {Object} data - Opening data
   */
  registerOpening(type, data) {
    const position = data.position;
    const width = data.width || (type === 'door' ? 0.9 : 1.0);
    const height = data.height || (type === 'door' ? 2.1 : 1.2);
    const sillHeight = type === 'window' ? (data.sillHeight || 0.9) : 0;
    const rotation = data.rotation || 0;
    
    // Calculate the half-width for intersection tests
    const halfWidth = width / 2;
    
    // Calculate the corners of the opening based on rotation
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    
    const corners = [
      { // Bottom-left corner
        x: position.x - halfWidth * cos,
        y: position.y - halfWidth * sin
      },
      { // Bottom-right corner
        x: position.x + halfWidth * cos,
        y: position.y + halfWidth * sin
      }
    ];
    
    this.openings.push({
      type,
      position,
      width,
      height,
      sillHeight,
      rotation,
      corners
    });
  }

  /**
   * Create a wall with openings for doors and windows
   * @param {Object} wallData - Wall data with start and end points
   */
  createWallWithOpenings(wallData) {
    const start = wallData.start;
    const end = wallData.end;
    const thickness = wallData.thickness || this.wallThickness;

    // Update model bounds
    this.updateModelBounds(start);
    this.updateModelBounds(end);

    // Calculate wall length and orientation
    const length = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    // Skip walls with zero length
    if (length < 0.01) return;

    // Calculate wall angle
    const angle = Math.atan2(end.y - start.y, end.x - start.x);
    
    // Direction vector of the wall
    const wallDirX = (end.x - start.x) / length;
    const wallDirY = (end.y - start.y) / length;
    
    // Find openings that intersect with this wall
    const wallOpenings = this.getWallOpenings(start, end, thickness, angle);
    
    if (wallOpenings.length === 0) {
      // No openings, create the wall as a single piece
      this.createWallSegment(start, end, thickness, angle, length);
      return;
    }
    
    // Sort openings by distance from start of wall
    wallOpenings.sort((a, b) => a.wallDistance - b.wallDistance);
    
    // Create wall segments between openings
    let currentPos = 0;
    let prevEnd = null;
    
    // For each opening, create a wall segment before it
    for (const opening of wallOpenings) {
      // Skip if opening is beyond the end of the wall
      if (opening.wallDistance > length) continue;
      
      // Skip if opening is at the very start of the wall
      if (opening.wallDistance - opening.width / 2 <= 0) {
        currentPos = opening.wallDistance + opening.width / 2;
        prevEnd = {
          x: start.x + currentPos * wallDirX,
          y: start.y + currentPos * wallDirY
        };
        continue;
      }
      
      // Create segment from current position to start of opening
      const segmentStart = prevEnd || start;
      const segmentEnd = {
        x: start.x + (opening.wallDistance - opening.width / 2) * wallDirX,
        y: start.y + (opening.wallDistance - opening.width / 2) * wallDirY
      };
      
      // Only create segment if it has some length
      const segLength = Math.sqrt(
        Math.pow(segmentEnd.x - segmentStart.x, 2) + 
        Math.pow(segmentEnd.y - segmentStart.y, 2)
      );
      
      if (segLength > 0.01) {
        this.createWallSegment(segmentStart, segmentEnd, thickness, angle, segLength);
      }
      
      // Update current position to end of opening
      currentPos = opening.wallDistance + opening.width / 2;
      prevEnd = {
        x: start.x + currentPos * wallDirX,
        y: start.y + currentPos * wallDirY
      };
    }
    
    // Create final segment from last opening to end of wall
    if (prevEnd && currentPos < length) {
      const segLength = length - currentPos;
      if (segLength > 0.01) {
        this.createWallSegment(prevEnd, end, thickness, angle, segLength);
      }
    }
    
    // Create top segment above doors (if any door exists in this wall)
    const doorOpenings = wallOpenings.filter(o => o.type === 'door');
    for (const door of doorOpenings) {
      // Skip if door is beyond wall boundaries
      if (door.wallDistance - door.width/2 < 0 || door.wallDistance + door.width/2 > length) {
        continue;
      }
      
      // Create segment above door
      const doorStartX = start.x + (door.wallDistance - door.width/2) * wallDirX;
      const doorStartY = start.y + (door.wallDistance - door.width/2) * wallDirY;
      const doorEndX = start.x + (door.wallDistance + door.width/2) * wallDirX;
      const doorEndY = start.y + (door.wallDistance + door.width/2) * wallDirY;
      
      // Create top segment
      const topHeight = this.wallHeight - door.height;
      if (topHeight > 0.01) {
        const geometry = new THREE.BoxGeometry(door.width, topHeight, thickness);
        const topSegment = new THREE.Mesh(geometry, this.materials.wall);
        
        topSegment.position.set(
          (doorStartX + doorEndX) / 2,
          this.wallHeight - topHeight/2,
          (doorStartY + doorEndY) / 2
        );
        
        topSegment.rotation.y = -angle;
        topSegment.castShadow = true;
        topSegment.receiveShadow = true;
        
        this.sceneManager.addToScene(topSegment);
      }
    }
    
    // Create segments above and below windows
    const windowOpenings = wallOpenings.filter(o => o.type === 'window');
    for (const window of windowOpenings) {
      // Skip if window is beyond wall boundaries
      if (window.wallDistance - window.width/2 < 0 || window.wallDistance + window.width/2 > length) {
        continue;
      }
      
      // Calculate window positions
      const winStartX = start.x + (window.wallDistance - window.width/2) * wallDirX;
      const winStartY = start.y + (window.wallDistance - window.width/2) * wallDirY;
      const winEndX = start.x + (window.wallDistance + window.width/2) * wallDirX;
      const winEndY = start.y + (window.wallDistance + window.width/2) * wallDirY;
      
      // Create bottom segment (below window)
      if (window.sillHeight > 0.01) {
        const geometry = new THREE.BoxGeometry(window.width, window.sillHeight, thickness);
        const bottomSegment = new THREE.Mesh(geometry, this.materials.wall);
        
        bottomSegment.position.set(
          (winStartX + winEndX) / 2,
          window.sillHeight / 2,
          (winStartY + winEndY) / 2
        );
        
        bottomSegment.rotation.y = -angle;
        bottomSegment.castShadow = true;
        bottomSegment.receiveShadow = true;
        
        this.sceneManager.addToScene(bottomSegment);
      }
      
      // Create top segment (above window)
      const topHeight = this.wallHeight - window.height - window.sillHeight;
      if (topHeight > 0.01) {
        const geometry = new THREE.BoxGeometry(window.width, topHeight, thickness);
        const topSegment = new THREE.Mesh(geometry, this.materials.wall);
        
        topSegment.position.set(
          (winStartX + winEndX) / 2,
          window.sillHeight + window.height + topHeight/2,
          (winStartY + winEndY) / 2
        );
        
        topSegment.rotation.y = -angle;
        topSegment.castShadow = true;
        topSegment.receiveShadow = true;
        
        this.sceneManager.addToScene(topSegment);
      }
    }
  }
  
  /**
   * Create a wall segment between two points
   * @param {Object} start - Start point
   * @param {Object} end - End point
   * @param {number} thickness - Wall thickness
   * @param {number} angle - Wall angle
   * @param {number} length - Wall length
   */
  createWallSegment(start, end, thickness, angle, length) {
    const geometry = new THREE.BoxGeometry(length, this.wallHeight, thickness);
    const wall = new THREE.Mesh(geometry, this.materials.wall);
    
    wall.position.set(
      (start.x + end.x) / 2,
      this.wallHeight / 2,
      (start.y + end.y) / 2
    );
    
    wall.rotation.y = -angle;
    wall.castShadow = true;
    wall.receiveShadow = true;
    
    this.sceneManager.addToScene(wall);
  }
  
  /**
   * Get openings that intersect with a wall
   * @param {Object} start - Wall start point
   * @param {Object} end - Wall end point
   * @param {number} thickness - Wall thickness
   * @param {number} angle - Wall angle in radians
   * @returns {Array} - Array of intersecting openings with distance along the wall
   */
  getWallOpenings(start, end, thickness, angle) {
    const wallLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    const wallDirX = (end.x - start.x) / wallLength;
    const wallDirY = (end.y - start.y) / wallLength;
    
    // Find openings that intersect this wall
    const intersectingOpenings = [];
    
    for (const opening of this.openings) {
      // Calculate projection of opening center onto wall line
      const dx = opening.position.x - start.x;
      const dy = opening.position.y - start.y;
      
      // Calculate distance along wall
      const wallDistance = dx * wallDirX + dy * wallDirY;
      
      // Calculate perpendicular distance to wall
      const perpDistance = Math.abs(dx * (-wallDirY) + dy * wallDirX);
      
      // Check if opening is close to wall
      const threshold = thickness / 2 + 0.05; // Small buffer for detection
      
      // Check if opening is within wall length and close enough to wall
      if (perpDistance <= threshold && wallDistance >= 0 && wallDistance <= wallLength) {
        intersectingOpenings.push({
          ...opening,
          wallDistance
        });
      }
    }
    
    return intersectingOpenings;
  }

  /**
   * Create a door frame for visual representation
   * @param {Object} doorData - Door data with position, width, height, and rotation
   */
  createDoorFrame(doorData) {
    const position = doorData.position;
    const width = doorData.width || 0.9;
    const height = doorData.height || 2.1;
    const rotation = doorData.rotation || 0;
    const frameThickness = 0.03;
    
    // Create main door frame (thin box)
    const frameGeometry = new THREE.BoxGeometry(width + frameThickness, height + frameThickness, frameThickness);
    const frame = new THREE.Mesh(frameGeometry, this.materials.door);
    
    frame.position.set(position.x, height / 2, position.y);
    frame.rotation.y = rotation;
    frame.castShadow = true;
    
    this.sceneManager.addToScene(frame);
  }
  
  /**
   * Create a window frame for visual representation
   * @param {Object} windowData - Window data with position, width, height, sillHeight, and rotation
   */
  createWindowFrame(windowData) {
    const position = windowData.position;
    const width = windowData.width || 1.0;
    const height = windowData.height || 1.2;
    const sillHeight = windowData.sillHeight || 0.9;
    const rotation = windowData.rotation || 0;
    const frameThickness = 0.03;
    
    // Create window frame (slightly transparent)
    const frameGeometry = new THREE.BoxGeometry(width, height, frameThickness);
    const frame = new THREE.Mesh(frameGeometry, this.materials.window);
    
    frame.position.set(position.x, sillHeight + height / 2, position.y);
    frame.rotation.y = rotation;
    
    this.sceneManager.addToScene(frame);
    
    // Add a thin windowsill
    const sillGeometry = new THREE.BoxGeometry(width + 0.1, 0.04, 0.1);
    const sill = new THREE.Mesh(sillGeometry, this.materials.door); // Use door material for sill
    
    sill.position.set(position.x, sillHeight, position.y);
    sill.rotation.y = rotation;
    sill.castShadow = true;
    
    this.sceneManager.addToScene(sill);
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
   * Update wall height and rebuild model
   * @param {number} height - New wall height in meters
   * @returns {boolean} Success indicator
   */
  updateWallHeight(height) {
    console.log(`Updating wall height from ${this.wallHeight}m to ${height}m`);
    
    // Update the wall height property
    this.wallHeight = height;
    
    // Rebuild the model with the current blueprint data
    if (this.currentBlueprintData) {
      // Clear the scene first - important to avoid duplicate objects
      this.sceneManager.clearScene();
      
      // Rebuild with current data
      this.buildFromData(this.currentBlueprintData);
      return true;
    } else {
      console.warn("No blueprint data available to rebuild model");
      return false;
    }
  }
  resetState() {
    // Reset model bounds
    this.modelBounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };
    
    // Clear openings array
    this.openings = [];
    
    // Keep the current wall height as set by user
    // this.wallHeight should remain unchanged
    
    // Reset the current blueprint data reference
    this.currentBlueprintData = null;
  }

 /**
   * Build 3D model from blueprint data
   * @param {Object} data - Blueprint data with walls, doors, and windows
   */
 buildFromData(data) {
  // Reset state for a clean build
  this.resetState();
  
  // Store data for rebuilding
  this.currentBlueprintData = data;
  
  // Process doors
  if (data.doors) {
    data.doors.forEach(door => this.registerOpening('door', door));
  }

  // Process windows
  if (data.windows) {
    data.windows.forEach(window => this.registerOpening('window', window));
  }

  // Create walls with openings
  if (data.walls) {
    data.walls.forEach(wall => this.createWallWithOpenings(wall));
  }

  // Create floor
  this.createFloor(data);

  // Add door frames
  if (data.doors) {
    data.doors.forEach(door => this.createDoorFrame(door));
  }

   // Add window frames
    if (data.windows) {
     data.windows.forEach(window => this.createWindowFrame(window));
    }
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
