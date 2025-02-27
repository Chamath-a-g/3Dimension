import cv2 as cv
import numpy as np

# Load the image
image_path = "/Users/imashiariyasinghe/Documents/GitHub/3Dimension/OPENCV/Photos/bp4.png"
image = cv.imread(image_path)

if image is None:
    print("Error: Could not load image.")
    exit()

# Preprocessing
gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY) #convert to grayscale
blurred = cv.GaussianBlur(gray, (7, 7), 0) #Apply Gaussian Blur to the grayscale image to reduce noise and smooth the image
edges = cv.Canny(blurred, 50, 150) #Canny edge detection algorithm to detect edges in the blurred image

# Detect contours
contours, _ = cv.findContours(edges, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)  # Retrieve all contours
contour_image = image.copy()

cv.drawContours(contour_image, contours, -1, (0, 255, 0), 2) #this creates a copy of the original image and draws the detected contours on it in green

# Hough Line Transform
lines = cv.HoughLinesP(edges, 1, np.pi / 180, threshold=50, minLineLength=50, maxLineGap=10)
if lines is not None:
    for line in lines:
        x1, y1, x2, y2 = line[0]
        cv.line(contour_image, (x1, y1), (x2, y2), (0, 0, 255), 2)


cv.imshow("Detected Lines",contour_image ) #Display image
cv.waitKey(0)
cv.destroyAllWindows()