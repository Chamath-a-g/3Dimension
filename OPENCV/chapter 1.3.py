iimport cv2 as cv
import numpy as np
import matplotlib.pyplot as plt

def detect_floor_plan_elements(image_path):
    # Load the image
    image = cv.imread(image_path)
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None, None, None, None
    
    # Create a copy for visualization
    visualization = image.copy()
    
    # Preprocessing
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    blurred = cv.GaussianBlur(gray, (5, 5), 0)
    
    # Binary thresholding to separate black lines from background
    _, binary = cv.threshold(blurred, 200, 255, cv.THRESH_BINARY_INV)
    
    # Edge detection 
    edges = cv.Canny(binary, 50, 150)
    
    # Morphological operations to connect nearby edges
    kernel = np.ones((3, 3), np.uint8)
    dilated_edges = cv.dilate(edges, kernel, iterations=1)
    
    # Find contours for wall detection
    contours, _ = cv.findContours(dilated_edges, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    
    # Wall detection (straight lines)
    wall_mask = np.zeros_like(gray)
    
    # Hough lines for straight wall segments
    lines = cv.HoughLinesP(
        dilated_edges, 
        rho=1, 
        theta=np.pi/180, 
        threshold=20, 
        minLineLength=15,  # Walls are usually longer
        maxLineGap=10      # Allow small gaps in walls
    )
    
    # Create wall mask
    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]
            cv.line(wall_mask, (x1, y1), (x2, y2), 255, 2)
    
    # Door detection (looking for arc patterns)
    door_mask = np.zeros_like(gray)
    
    # Use Hough Circles to detect the door arcs
    circles = cv.HoughCircles(
        blurred,
        cv.HOUGH_GRADIENT,
        dp=1,
        minDist=20,
        param1=50,
        param2=30,
        minRadius=10,
        maxRadius=40
    )
    
    # Process detected circles to identify door arcs
    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            # Draw detected door on the door mask and visualization
            cv.circle(door_mask, (i[0], i[1]), i[2]//2, 255, 2)
            cv.circle(visualization, (i[0], i[1]), i[2]//2, (0, 0, 255), 2)  # Red for doors
    
    # IMPROVED WINDOW DETECTION
    window_mask = np.zeros_like(gray)
    
    # Windows are typically represented by parallel lines in blueprints
    # We'll use Hough transform to find lines and then identify parallel pairs
    if lines is not None:
        # Extract all lines
        all_lines = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
            angle = np.arctan2(y2 - y1, x2 - x1) * 180 / np.pi
            all_lines.append((x1, y1, x2, y2, length, angle))
        
        # Group lines by similar angles
        angle_threshold = 5  # degrees
        length_threshold = 10  # minimum length for window lines
        distance_threshold = 20  # maximum distance between parallel lines
        
        # Find potential window lines (shorter lines)
        window_line_candidates = [line for line in all_lines if 10 < line[4] < 50]
        
        # Find pairs of parallel lines
        for i, line1 in enumerate(window_line_candidates):
            x1, y1, x2, y2, length1, angle1 = line1
            for line2 in window_line_candidates[i+1:]:
                x3, y3, x4, y4, length2, angle2 = line2
                
                # Check if lines are parallel (similar angle)
                if abs(angle1 - angle2) < angle_threshold or abs(abs(angle1 - angle2) - 180) < angle_threshold:
                    # Calculate midpoints
                    mid1_x, mid1_y = (x1 + x2) // 2, (y1 + y2) // 2
                    mid2_x, mid2_y = (x3 + x4) // 2, (y3 + y4) // 2
                    
                    # Calculate distance between midpoints
                    distance = np.sqrt((mid2_x - mid1_x)**2 + (mid2_y - mid1_y)**2)
                    
                    # Check if lines are close to each other (potential window)
                    if distance < distance_threshold:
                        # These parallel lines might represent a window
                        cv.line(window_mask, (x1, y1), (x2, y2), 255, 2)
                        cv.line(window_mask, (x3, y3), (x4, y4), 255, 2)
                        
                        # Draw on visualization
                        cv.line(visualization, (x1, y1), (x2, y2), (255, 0, 0), 2)  # Blue for windows
                        cv.line(visualization, (x3, y3), (x4, y4), (255, 0, 0), 2)
    