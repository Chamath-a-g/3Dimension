import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt

def detect_floor_plan_elements(image_path):
    image_path = "/Users/imashiariyasinghe/Documents/GitHub/3Dimension/OPENCV/Photos/bp8.png"
    image = cv.imread(image_path)
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None, None, None
    
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
    # The parameters need tuning based on your specific floor plan style
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
            # Check if this is potentially a door arc (quarter circle)
            # This is a simplified approach; real implementation needs more checks
            # Draw detected door on the door mask and visualization
            cv.circle(door_mask, (i[0], i[1]), i[2]//2, 255, 2)
            cv.circle(visualization, (i[0], i[1]), i[2]//2, (0, 0, 255), 2)  # Red for doors
    
    # Window detection (straight lines not part of walls, typically shorter)
    window_mask = np.zeros_like(gray)
    
    # Use contour properties to identify potential windows
    for contour in contours:
        # Simplify the contour to get a polygon approximation
        perimeter = cv.arcLength(contour, True)
        approx = cv.approxPolyDP(contour, 0.02 * perimeter, True)
        
        # Calculate area and aspect ratio
        area = cv.contourArea(contour)
        x, y, w, h = cv.boundingRect(contour)
        aspect_ratio = float(w) / h if h > 0 else 0
        
        # Windows are typically rectangular with specific aspect ratios and sizes
        if 4 <= len(approx) <= 6 and 100 < area < 1000 and 0.2 < aspect_ratio < 5:
            # This is a potential window - check if it's on a wall
            roi = wall_mask[y:y+h, x:x+w]
            if np.sum(roi) > 0:  # If there's overlap with a wall
                cv.drawContours(window_mask, [contour], 0, 255, 2)
                cv.drawContours(visualization, [contour], 0, (255, 0, 0), 2)  # Blue for windows
    
    # Visualize the results in a multi-panel figure
    wall_visualization = image.copy()
    door_visualization = image.copy()
    window_visualization = image.copy()
    
    # Draw detections on the respective visualizations
    wall_contours, _ = cv.findContours(wall_mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    cv.drawContours(wall_visualization, wall_contours, -1, (0, 255, 0), 2)  # Green for walls
    
    door_contours, _ = cv.findContours(door_mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    cv.drawContours(door_visualization, door_contours, -1, (0, 0, 255), 2)  # Red for doors
    
    window_contours, _ = cv.findContours(window_mask, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)
    cv.drawContours(window_visualization, window_contours, -1, (255, 0, 0), 2)  # Blue for windows
    
    return wall_visualization, door_visualization, window_visualization, visualization

def display_results(wall_vis, door_vis, window_vis, combined_vis):
    plt.figure(figsize=(20, 10))
    
    plt.subplot(221)
    plt.title('Wall Detection')
    plt.imshow(cv.cvtColor(wall_vis, cv.COLOR_BGR2RGB))
    
    plt.subplot(222)
    plt.title('Door Detection')
    plt.imshow(cv.cvtColor(door_vis, cv.COLOR_BGR2RGB))
    
    plt.subplot(223)
    plt.title('Window Detection')
    plt.imshow(cv.cvtColor(window_vis, cv.COLOR_BGR2RGB))
    
    plt.subplot(224)
    plt.title('Combined Detection')
    plt.imshow(cv.cvtColor(combined_vis, cv.COLOR_BGR2RGB))
    
    plt.tight_layout()
    plt.show()

# Main execution
if __name__ == "__main__":
    image_path = "path_to_your_floor_plan_image.jpg"
    wall_vis, door_vis, window_vis, combined_vis = detect_floor_plan_elements(image_path)
    
    if wall_vis is not None:
        display_results(wall_vis, door_vis, window_vis, combined_vis)