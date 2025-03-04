import cv2
import numpy as np

# Load the blueprint image in grayscale
# or cv2.IMREAD_GRAYSCALE
img = cv2.imread('images/bp1.png', cv2.IMREAD_GRAYSCALE)

if img is None:
    print("Error: Could not load blueprint.jpg")
    exit()

# 1. Canny Edge Detection
edges = cv2.Canny(img, 50, 150)  # Adjust thresholds for your image

cv2.imshow('Canny Edges', edges)
cv2.waitKey(0)

# 2. Hough Line Transform
lines = cv2.HoughLines(edges, 1, np.pi / 180, 200)  # Adjust parameters

if lines is not None:
    for line in lines:
        rho, theta = line[0]
        a = np.cos(theta)
        b = np.sin(theta)
        x0 = a * rho
        y0 = b * rho
        x1 = int(x0 + 1000 * (-b))
        y1 = int(y0 + 1000 * (a))
        x2 = int(x0 - 1000 * (-b))
        y2 = int(y0 - 1000 * (a))
        cv2.line(img, (x1, y1), (x2, y2), (0, 0, 255), 2)  # Red lines

    cv2.imshow('Hough Lines', img)
    cv2.waitKey(0)
else:
    print("No lines detected using Hough Transform")

cv2.destroyAllWindows()
