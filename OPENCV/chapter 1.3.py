import cv2 as cv
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