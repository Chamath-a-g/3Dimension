import cv2 as cv
import numpy as np

# Load the image
image_path = "/Users/imashiariyasinghe/Documents/GitHub/3Dimension/OPENCV/Photos/bp5.png"
image = cv.imread(image_path)

if image is None:
    print("Error: Could not load image.")
    exit()

# Preprocessing
gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
# Use a smaller kernel for more detail preservation
blurred = cv.GaussianBlur(gray, (5, 5), 0)
# Lower threshold values to detect more edges
edges = cv.Canny(blurred, 30, 120)

# Detect contours
contours, _ = cv.findContours(edges, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

# Create visualization image
contour_image = image.copy()
cv.drawContours(contour_image, contours, -1, (0, 255, 0), 1)

# Improved Hough Line Transform parameters
lines = cv.HoughLinesP(
    edges, 
    rho=1,              # Distance resolution in pixels
    theta=np.pi/180,    # Angle resolution in radians
    threshold=20,       # Lower threshold to detect more lines
    minLineLength=5,    # Reduced to detect shorter lines
    maxLineGap=10       # Gap between line segments to consider them as a single line
)

if lines is not None:
    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv.line(contour_image, (x1, y1), (x2, y2), (0, 0, 255), 1)  # Thinner line visualization

# Create a comparison view
edge_image = cv.cvtColor(edges, cv.COLOR_GRAY2BGR)
comparison = np.hstack((image, contour_image, edge_image))
cv.imshow("Original | Detected Lines | Edges", comparison)
cv.waitKey(0)
cv.destroyAllWindows()