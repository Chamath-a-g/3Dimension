import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt

def detect_blueprint_elements(image_path):
    """
    Detect walls, doors, and windows in a blueprint/floor plan.
    Uses general characteristics of these elements rather than specific patterns.
    """
    # Load the image
    image = cv.imread(image_path)
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None
    
    # Create a copy for visualization
    result = image.copy()
    
    # Preprocessing
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    blurred = cv.GaussianBlur(gray, (5, 5), 0)
    _, binary = cv.threshold(blurred, 200, 255, cv.THRESH_BINARY_INV)
    
    # Edge detection and cleanup
    edges = cv.Canny(binary, 50, 150)
    kernel = np.ones((2, 2), np.uint8)
    cleaned_edges = cv.dilate(edges, kernel, iterations=1)

  # Create masks for each element type
    wall_mask = np.zeros_like(gray)
    door_mask = np.zeros_like(gray)
    window_mask = np.zeros_like(gray)
    
    # WALL DETECTION
    # Walls are typically longer straight lines
    wall_lines = cv.HoughLinesP(
        cleaned_edges,
        rho=1,
        theta=np.pi/180,
        threshold=30,
        minLineLength=30,  # Walls are usually longer
        maxLineGap=10
    )
  if wall_lines is not None:
        for line in wall_lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            if length > 30:  # Definite walls
                cv.line(wall_mask, (x1, y1), (x2, y2), 255, 2)
                cv.line(result, (x1, y1), (x2, y2), (0, 255, 0), 2)  # Green for walls
    
