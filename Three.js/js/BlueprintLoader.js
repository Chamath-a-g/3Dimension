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

