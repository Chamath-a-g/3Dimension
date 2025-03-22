/**
 * Handles loading and parsing blueprint data from JSON files
 */
export class BlueprintLoader {
    constructor() {
      this.reader = new FileReader()
    }
  
    /**
     * Load blueprint data from a File object
     * @param {File} file - JSON file containing blueprint data
     * @returns {Promise<Object>} - Parsed blueprint data
     */
    loadFromFile(file) {
      return new Promise((resolve, reject) => {
        this.reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result)
            resolve(this.validateData(data))
          } catch (error) {
            reject(new Error("Invalid JSON format"))
          }
        }
  
        this.reader.onerror = () => {
          reject(new Error("Error reading file"))
        }
  
        this.reader.readAsText(file)
      })
    }
  
    /**
     * Load blueprint data from a URL
     * @param {string} url - URL to JSON file
     * @returns {Promise<Object>} - Parsed blueprint data
     */
    async loadFromUrl(url) {
      try {
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        return this.validateData(data)
      } catch (error) {
        throw new Error(`Failed to load data: ${error.message}`)
      }
    }
  
    /**
     * Validate the structure of the blueprint data
     * @param {Object} data - Blueprint data to validate
     * @returns {Object} - Validated blueprint data
     */
    validateData(data) {
      // Check if data has the expected structure
      if (!data) {
        throw new Error("Empty data")
      }
  
      // Create default structure if elements are missing
      const validatedData = {
        walls: Array.isArray(data.walls) ? data.walls : [],
        doors: Array.isArray(data.doors) ? data.doors : [],
        windows: Array.isArray(data.windows) ? data.windows : [],
      }
  
      // Ensure each wall has the required properties
      validatedData.walls = validatedData.walls.map((wall) => {
        return {
          start: { x: wall.start?.x || 0, y: wall.start?.y || 0 },
          end: { x: wall.end?.x || 0, y: wall.end?.y || 0 },
          thickness: wall.thickness || 0.2,
        }
      })
  
      // Ensure each door has the required properties
      validatedData.doors = validatedData.doors.map((door) => {
        return {
          position: { x: door.position?.x || 0, y: door.position?.y || 0 },
          width: door.width || 0.9,
          height: door.height || 2.1,
          rotation: door.rotation || 0,
        }
      })
  
      // Ensure each window has the required properties
      validatedData.windows = validatedData.windows.map((window) => {
        return {
          position: { x: window.position?.x || 0, y: window.position?.y || 0 },
          width: window.width || 1.0,
          height: window.height || 1.2,
          sillHeight: window.sillHeight || 0.9,
          rotation: window.rotation || 0,
        }
      })
  
      return validatedData
    }
  
    /**
     * Generate sample blueprint data for testing
     * @returns {Object} - Sample blueprint data
     */
    // generateSampleData() {
    //   // Create sample data based on a simple room
    //   return {
    //     walls: [
    //       { start: { x: 0, y: 0 }, end: { x: 5, y: 0 }, thickness: 0.2 },
    //       { start: { x: 5, y: 0 }, end: { x: 5, y: 4 }, thickness: 0.2 },
    //       { start: { x: 5, y: 4 }, end: { x: 0, y: 4 }, thickness: 0.2 },
    //       { start: { x: 0, y: 4 }, end: { x: 0, y: 0 }, thickness: 0.2 },
    //     ],
    //     doors: [{ position: { x: 2.5, y: 0 }, width: 0.9, height: 2.1, rotation: 0 }],
    //     windows: [{ position: { x: 2.5, y: 4 }, width: 1.5, height: 1.2, sillHeight: 0.9, rotation: 0 }],
    //   }
    // }
  }
  
  