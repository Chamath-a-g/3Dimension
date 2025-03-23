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

   # DOOR DETECTION
    # Method 1: Doors often have arc segments (door swings)
    circles = cv.HoughCircles(
        blurred,
        cv.HOUGH_GRADIENT,
        dp=1,
        minDist=20,
        param1=50,
        param2=15,  # Lower threshold for better arc detection
        minRadius=5,
        maxRadius=30
    )
    
    # Method 2: Look for gaps in walls that are likely door openings
    door_lines = cv.HoughLinesP(
        cleaned_edges,
        rho=1,
        theta=np.pi/180,
        threshold=20,
        minLineLength=10,
        maxLineGap=5
    )
    # Process door arcs (method 1)
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            # Create a circular mask
            center = (i[0], i[1])
            radius = i[2]
            
            # Check if it's near a wall (doors are always connected to walls)
            circle_region = np.zeros_like(gray)
            cv.circle(circle_region, center, radius + 5, 255, 3)
            
            if np.sum(cv.bitwise_and(circle_region, wall_mask)) > 0:
                cv.circle(door_mask, center, radius, 255, 2)
                cv.circle(result, center, radius, (0, 0, 255), 2)  # Red for doors
        # Process potential door openings (method 2)
    if door_lines is not None:
        for line in door_lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            
            # Door openings are medium-length lines near walls but not part of main walls
            if 10 <= length <= 25:
                # Check proximity to walls
                door_line_mask = np.zeros_like(gray)
                cv.line(door_line_mask, (x1, y1), (x2, y2), 255, 3)
                
                # Dilate to check proximity
                door_region = cv.dilate(door_line_mask, np.ones((5, 5), np.uint8), iterations=1)
                
                # If near a wall but not part of the main wall structure
                wall_proximity = cv.bitwise_and(door_region, wall_mask)
                line_on_wall = cv.bitwise_and(door_line_mask, wall_mask)
                
                if np.sum(wall_proximity) > 0 and np.sum(line_on_wall) == 0:
                    # This could be a door opening
                    # Further check: doors typically have perpendicular wall segments
                    angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
                    
                    # Mark as a door if it has specific characteristics
                    if is_perpendicular_to_wall(angle, wall_lines):
                        cv.line(door_mask, (x1, y1), (x2, y2), 255, 2)
                        cv.line(result, (x1, y1), (x2, y2), (0, 0, 255), 2)  # Red for doors
    
    
