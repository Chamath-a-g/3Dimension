import cv2
import numpy as np


def detect_walls(image_path, thickness_threshold=100):
    """
    Detects walls in an architectural blueprint based on line thickness and calculates their lengths.

    Args:
        image_path (str): Path to the blueprint image.
        thickness_threshold (int): Minimum pixel thickness for a line to be considered a wall.

    Returns:
        list: A list of tuples, where each tuple represents a wall and contains:
              - ((x1, y1), (x2, y2)):  Coordinates of the wall's start and end points.
              - length (float): The length of the wall in pixels.
    """

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not open or read image at {image_path}")
        return []

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    # Use Canny edge detection
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    # Detect lines using HoughLinesP
    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100,
                            minLineLength=100, maxLineGap=10)

    wall_segments = []

    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]

            # Calculate line thickness
            # A simplified approach: Check the average pixel intensity in a region around the line
            line_mask = np.zeros_like(gray)
            # Draw a line on the mask, thickness 3
            cv2.line(line_mask, (x1, y1), (x2, y2), 255, 5)
            mean_intensity = cv2.mean(gray, mask=line_mask)[0]

            # Determine if the line is a wall based on thickness (represented by mean intensity)
            if mean_intensity > thickness_threshold:
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                wall_segments.append(((x1, y1), (x2, y2), length))

    return wall_segments


def main():
    image_path = "images/bp1.png"  # Replace with the actual path to your image

    walls = detect_walls(image_path)

    if walls:
        print("Detected Walls:")
        for wall in walls:
            (x1, y1), (x2, y2), length = wall
            print(
                f"  Start: ({x1}, {y1}), End: ({x2}, {y2}), Length: {length:.2f} pixels")
    else:
        print("No walls detected.")


if __name__ == "__main__":
    main()
