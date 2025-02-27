import cv2 as cv
import numpy as np

# Load the image
image_path = "/Users/imashiariyasinghe/Documents/GitHub/3Dimension/OPENCV/Photos/bp8.png"
image = cv.imread(image_path)

if image is None:
    print("Error: Could not load image.")
    exit()

# Create a copy for final visualization
result_image = image.copy()

# Preprocessing
gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
blurred = cv.GaussianBlur(gray, (5, 5), 0)

# Edge detection
edges = cv.Canny(blurred, 30, 120)

# Dilate edges to connect nearby edges
kernel = np.ones((3, 3), np.uint8)
dilated_edges = cv.dilate(edges, kernel, iterations=1)

# Find contours from edges
contours, hierarchy = cv.findContours(dilated_edges, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

# Lists to store different elements
walls = []
windows = []
doors = []

# Process contours to categorize architectural elements
for contour in contours:
    # Skip very small contours (noise)
    if cv.contourArea(contour) < 100:
        continue
        
    # Approximate the contour to analyze its shape
    epsilon = 0.02 * cv.arcLength(contour, True)
    approx = cv.approxPolyDP(contour, epsilon, True)
    
    # Get bounding rectangle
    x, y, w, h = cv.boundingRect(contour)
    aspect_ratio = float(w) / h if h > 0 else 0
    
    # Check if the contour is closed
    is_closed = cv.isContourConvex(approx)
    
    # WINDOWS: Rectangle shapes with 4-6 vertices (allowing for some imperfection)
    if len(approx) >= 4 and len(approx) <= 6 and is_closed and 0.5 < aspect_ratio < 2.0:
        windows.append(contour)
    
    # DOORS: Shapes with curved sections (more vertices) or specific door-like aspect ratio
    elif (len(approx) > 6 and is_closed) or (len(approx) >= 4 and 0.25 < aspect_ratio < 0.6):
        doors.append(contour)
    
    # WALLS: Long straight segments (default case)
    else:
        walls.append(contour)

# Create a clean image for line detection
line_detection = np.zeros_like(edges)
cv.drawContours(line_detection, walls, -1, 255, 1)

# Use Hough Line Transform to detect wall lines
wall_lines = cv.HoughLinesP(
    line_detection,
    rho=1,
    theta=np.pi/180,
    threshold=20,
    minLineLength=40,
    maxLineGap=5
)

# Draw the detected elements with different colors
# Walls - Green
cv.drawContours(result_image, walls, -1, (0, 255, 0), 1)

# Safely draw wall lines without using pointPolygonTest
if wall_lines is not None:
    for line in wall_lines:
        x1, y1, x2, y2 = line[0]
        cv.line(result_image, (x1, y1), (x2, y2), (0, 255, 0), 2)

# Doors - Blue
cv.drawContours(result_image, doors, -1, (255, 0, 0), 2)

# Windows - Red
cv.drawContours(result_image, windows, -1, (0, 0, 255), 2)

# Create separate visualization images
wall_image = image.copy()
door_image = image.copy()
window_image = image.copy()

# Draw each feature type in its respective image
cv.drawContours(wall_image, walls, -1, (0, 255, 0), 2)
if wall_lines is not None:
    for line in wall_lines:
        x1, y1, x2, y2 = line[0]
        cv.line(wall_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
cv.drawContours(window_image, doors, -1, (0, 0, 255), 2)
cv.drawContours(door_image, windows, -1, (255, 0, 0), 2)

# Add labels
cv.putText(wall_image, "Walls", (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
cv.putText(door_image, "Doors", (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 0, 0), 2)
cv.putText(window_image, "Windows", (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
cv.putText(result_image, "All Features", (10, 30), cv.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)

# Display results
cv.imshow("Walls (Green)", wall_image)
cv.imshow("Doors (Blue)", door_image)
cv.imshow("Windows (Red)", window_image)
cv.imshow("All Features", result_image)
cv.imshow("Edges", dilated_edges)

cv.waitKey(0)
cv.destroyAllWindows()