import cv2
import numpy as np


def detect_walls(image_path, thickness_threshold=5):
    """
    Detects walls in an architectural blueprint based on line thickness and calculates their lengths.

    Args:
        image_path (str): Path to the blueprint image.
        thickness_threshold (int): Minimum pixel thickness for a line to be considered a wall.

    Returns:
        tuple: A tuple containing:
              - list: A list of tuples, where each tuple represents a wall and contains:
                    - ((x1, y1), (x2, y2)):  Coordinates of the wall's start and end points.
                    - length (float): The length of the wall in pixels.
              - img: The original image.
              - img_with_walls: The original image with the detected walls highlighted.
    """

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not open or read image at {image_path}")
        return [], None, None

    img_with_walls = img.copy()  # Create a copy to draw walls on

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100,
                            minLineLength=100, maxLineGap=10)

    wall_segments = []

    if lines is not None:
        for line in lines:
            x1, y1, x2, y2 = line[0]

            # Calculate line thickness (average pixel intensity)
            line_mask = np.zeros_like(gray)
            cv2.line(line_mask, (x1, y1), (x2, y2), 255, 3)
            mean_intensity = cv2.mean(gray, mask=line_mask)[0]

            if mean_intensity > thickness_threshold:
                length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)
                wall_segments.append(((x1, y1), (x2, y2), length))
                cv2.line(img_with_walls, (x1, y1), (x2, y2),
                         (0, 255, 0), 2)  # Draw green line

    return wall_segments, img, img_with_walls


def main():
    image_path = "blueprint.png"  # Replace with your image path

    walls, original_image, image_with_walls = detect_walls(image_path)

    if walls:
        print("Detected Walls:")
        for wall in walls:
            (x1, y1), (x2, y2), length = wall
            print(
                f"  Start: ({x1}, {y1}), End: ({x2}, {y2}), Length: {length:.2f} pixels")
    else:
        print("No walls detected.")

    # Display the images
    if original_image is not None and image_with_walls is not None:
        cv2.imshow("Original Image", original_image)
        cv2.imshow("Image with Walls", image_with_walls)
        cv2.waitKey(0)  # Wait for a key press to close the windows
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
