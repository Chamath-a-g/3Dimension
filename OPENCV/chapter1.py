import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt
import json


def detect_blueprint_elements(image_path):
    """
    Detect walls, doors, and windows in a blueprint/floor plan.
    Uses general characteristics of these elements rather than specific patterns.
    """
    # Load the image
    image = cv.imread(image_path)
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None, None, None, None
    
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
    
    detected_elements = {
        'walls': [],
        'doors': [],
        'windows': []
    }
    
    # WALL DETECTION
    wall_lines = cv.HoughLinesP(
        cleaned_edges,
        rho=1,
        theta=np.pi/180,
        threshold=30,
        minLineLength=30,
        maxLineGap=10
    )
    
    if wall_lines is not None:
        for line in wall_lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            if length > 30:
                cv.line(wall_mask, (x1, y1), (x2, y2), 255, 2)
                cv.line(result, (x1, y1), (x2, y2), (0, 255, 0), 2)
                detected_elements['walls'].append({'start': (x1, y1), 'end': (x2, y2)})
    
    # DOOR DETECTION
    circles = cv.HoughCircles(
        blurred,
        cv.HOUGH_GRADIENT,
        dp=1,
        minDist=20,
        param1=50,
        param2=15,
        minRadius=5,
        maxRadius=30
    )
    
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            center = (i[0], i[1])
            radius = i[2]
            circle_region = np.zeros_like(gray)
            cv.circle(circle_region, center, radius + 5, 255, 3)
            if np.sum(cv.bitwise_and(circle_region, wall_mask)) > 0:
                cv.circle(door_mask, center, radius, 255, 2)
                cv.circle(result, center, radius, (0, 0, 255), 2)
                detected_elements['doors'].append({'center': center, 'radius': radius})
    
    # WINDOW DETECTION
    window_lines = cv.HoughLinesP(
        cleaned_edges,
        rho=1,
        theta=np.pi/180,
        threshold=15,
        minLineLength=5,
        maxLineGap=3
    )
    
    if window_lines is not None:
        for line in window_lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            if 5 <= length <= 20:
                cv.line(window_mask, (x1, y1), (x2, y2), 255, 2)
                cv.line(result, (x1, y1), (x2, y2), (255, 0, 0), 2)
                detected_elements['windows'].append({'start': (x1, y1), 'end': (x2, y2)})
    
    # Save detected elements to JSON file
    with open('detected_elements.json', 'w') as json_file:
        json.dump(detected_elements, json_file)
    
    return result, wall_mask, door_mask, window_mask

def is_perpendicular_to_wall(angle, wall_lines, threshold=20):
    """Check if a line is perpendicular to any wall line."""
    if wall_lines is None:
        return False
        
    for wall in wall_lines:
        wx1, wy1, wx2, wy2 = wall[0]
        wall_angle = np.arctan2(wy2 - wy1, wx2 - wx1) * 180 / np.pi
        
        # Calculate angle difference and normalize to 0-90
        angle_diff = abs(angle - wall_angle) % 180
        if angle_diff > 90:
            angle_diff = 180 - angle_diff
            
        # If close to 90 degrees (perpendicular)
        if 90 - threshold <= angle_diff <= 90 + threshold:
            return True
            
    return False

def is_parallel_to_wall(angle, wall_lines, threshold=20):
    """Check if a line is parallel to any wall line."""
    if wall_lines is None:
        return False
        
    for wall in wall_lines:
        wx1, wy1, wx2, wy2 = wall[0]
        wall_angle = np.arctan2(wy2 - wy1, wx2 - wx1) * 180 / np.pi
        
        # Calculate angle difference and normalize to 0-90
        angle_diff = abs(angle - wall_angle) % 180
        if angle_diff > 90:
            angle_diff = 180 - angle_diff
            
        # If close to 0 degrees (parallel) or 180 degrees (anti-parallel)
        if angle_diff <= threshold or angle_diff >= 180 - threshold:
            return True
            
    return False

# Example usage
image_path = "/Users/imashiariyasinghe/Documents/OPENCV/Photos/blueprint2.jpg"
result, wall_mask, door_mask, window_mask = detect_blueprint_elements(image_path)

cv.imshow("Detected Elements", result)
cv.waitKey(0)
cv.destroyAllWindows()