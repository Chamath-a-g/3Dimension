import cv2 as cv
import numpy as np

image = cv.imread("/Users/imashiariyasinghe/Documents/OPENCV/Photos/blueprint2.jpg") #This reads the image file
if image is None:
    print("Error: Could not load image.")
    exit()

# Preprocessing
gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY) #convert to grayscale
blurred = cv.GaussianBlur(gray, (5, 5), 0) #Apply Gaussian Blur to the grayscale image to reduce noise and smooth the image
edges = cv.Canny(blurred, 50, 150) #Canny edge detection algorithm to detect edges in the blurred image

#contour detection
contours, _ = cv.findContours(edges, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE) #finds contours in the edge-detected image
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