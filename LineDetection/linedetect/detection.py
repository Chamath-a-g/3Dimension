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
            potential_walls = []
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            # Calculate line thickness (average pixel intensity)
            line_mask = np.zeros_like(gray)
            cv2.line(line_mask, (x1, y1), (x2, y2), 255, 3)
            mean_intensity = cv2.mean(gray, mask=line_mask)[0]

            if mean_intensity > thickness_threshold and length >= min_wall_length:  # Check length here as well
                potential_walls.append(((x1, y1), (x2, y2), length))

        # Merge close parallel lines
        merged_walls = []
        used_lines = set()

        for i, wall1 in enumerate(potential_walls):
            if i in used_lines:
                continue

            (x1_1, y1_1), (x2_1, y2_1), length1 = wall1
            merged = False

            for j in range(i + 1, len(potential_walls)):
                if j in used_lines:
                    continue

                (x1_2, y1_2), (x2_2, y2_2), length2 = potential_walls[j]

                # Check for parallelism and proximity (simplified)
                # Consider lines parallel if the angle between them is small
                angle1 = np.arctan2(y2_1 - y1_1, x2_1 - x1_1)
                angle2 = np.arctan2(y2_2 - y1_2, x2_2 - x1_2)
                angle_diff = abs(angle1 - angle2)

                # Check if lines are close enough to merge.  Approximate check using the minimum distance
                # between their endpoints.
                dist1 = min(np.sqrt((x1_1 - x1_2)**2 + (y1_1 - y1_2)**2), np.sqrt((x1_1 - x2_2)**2 + (y1_1 - y2_2)**2),
                            np.sqrt((x2_1 - x1_2)**2 + (y2_1 - y1_2)**2), np.sqrt((x2_1 - x2_2)**2 + (y2_1 - y2_2)**2))

                if angle_diff < 0.1 and dist1 <= max_line_separation:  # Adjust angle tolerance and proximity threshold
                    # Merge the lines (simple average of endpoints)
                    new_x1 = int((x1_1 + x1_2) / 2)
                    new_y1 = int((y1_1 + y1_2) / 2)
                    new_x2 = int((x2_1 + x2_2) / 2)
                    new_y2 = int((y2_1 + y2_2) / 2)
                    # Recalculate length
                    new_length = np.sqrt(
                        (new_x2 - new_x1)**2 + (new_y2 - new_y1)**2)

                    merged_walls.append(
                        ((new_x1, new_y1), (new_x2, new_y2), new_length))
                    used_lines.add(i)
                    used_lines.add(j)
                    merged = True
                    break

            if not merged:
                merged_walls.append(wall1)

        # Draw the walls onto the image
        for (x1, y1), (x2, y2), length in merged_walls:
            cv2.line(img_with_walls, (x1, y1), (x2, y2), (0, 255, 0), 2)
            wall_segments.append(((x1, y1), (x2, y2), length))

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
