import cv2
import numpy as np


def detect_walls_and_doors(image_path, thickness_threshold=5, min_wall_length=50, max_line_separation=5, door_gap_threshold=200, door_min_length=30):
    """
    Detects walls and doors in an architectural blueprint. Filters by gap length.

    Args:
        image_path (str): Path to the blueprint image.
        thickness_threshold (int): Minimum pixel intensity for a line to be a wall.
        min_wall_length (int): Minimum length in pixels for a line to be a wall.
        max_line_separation (int): Maximum pixel distance to merge parallel lines.
        door_gap_threshold (int): Average pixel value threshold to consider a gap a door (higher = more strict).
        door_min_length (int): Minimum length of the gap to be considered a door.
    Returns:
        tuple: Lists of walls, doors, original image, and image with detections.
    """

    img = cv2.imread(image_path)
    if img is None:
        print(f"Error: Could not open or read image at {image_path}")
        return [], [], None, None

    img_with_detections = img.copy()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)

    lines = cv2.HoughLinesP(edges, 1, np.pi / 180, 100,
                            minLineLength=10, maxLineGap=10)  # Reduced minLineLength

    wall_segments = []
    door_segments = []

    if lines is not None:
        potential_walls = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2)

            line_mask = np.zeros_like(gray)
            cv2.line(line_mask, (x1, y1), (x2, y2), 255, 3)
            mean_intensity = cv2.mean(gray, mask=line_mask)[0]

            if mean_intensity > thickness_threshold and length >= min_wall_length:
                potential_walls.append(((x1, y1), (x2, y2), length))

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

                angle1 = np.arctan2(y2_1 - y1_1, x2_1 - x1_1)
                angle2 = np.arctan2(y2_2 - y1_2, x2_2 - x1_2)
                angle_diff = abs(angle1 - angle2)

                dist1 = min(np.sqrt((x1_1 - x1_2)**2 + (y1_1 - y1_2)**2), np.sqrt((x1_1 - x2_2)**2 + (y1_1 - y2_2)**2),
                            np.sqrt((x2_1 - x1_2)**2 + (y2_1 - y1_2)**2), np.sqrt((x2_1 - x2_2)**2 + (y2_1 - y2_2)**2))

                if angle_diff < 0.1 and dist1 <= max_line_separation:
                    new_x1 = int((x1_1 + x1_2) / 2)
                    new_y1 = int((y1_1 + y1_2) / 2)
                    new_x2 = int((x2_1 + x2_2) / 2)
                    new_y2 = int((y2_1 + y2_2) / 2)
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

        # Door Detection: Require a more rectangular shape of the gap, and check gap length
        for (x1, y1), (x2, y2), length in merged_walls:
            # Find midpoint of the wall
            mid_x = int((x1 + x2) / 2)
            mid_y = int((y1 + y2) / 2)

            # Define the rectangular region
            # Width of the rectangular area to check (adjust as needed)
            width = 20
            # Height of the rectangular area to check (adjust as needed)
            height = 20

            # Define the rectangular region
            x_start = max(0, mid_x - width // 2)
            x_end = min(gray.shape[1], mid_x + width // 2)
            y_start = max(0, mid_y - height // 2)
            y_end = min(gray.shape[0], mid_y + height // 2)

            # Extract the region of interest (ROI) from the grayscale image
            roi = gray[y_start:y_end, x_start:x_end]

            # Check if the ROI is empty
            if roi.size == 0:
                continue

            # Calculate the average intensity value within the ROI
            average_val = np.mean(roi)

            # Calculate gap length
            gap_length = length  # Approximation

            # Apply the threshold based on average value and gap length
            if average_val > door_gap_threshold and gap_length > door_min_length:  # Check Length as well
                # Door detected, mark it
                cv2.rectangle(img_with_detections, (x_start, y_start),
                              (x_end, y_end), (255, 0, 0), 2)  # Red for doors
                door_segments.append(
                    ((x_start + x_end) // 2, (y_start + y_end) // 2))

            else:
                # Draw just wall
                cv2.line(img_with_detections, (x1, y1),
                         (x2, y2), (0, 255, 0), 2)
                wall_segments.append(((x1, y1), (x2, y2), length))

    return wall_segments, door_segments, img, img_with_detections


def main():
    image_path = "images/bp1.png"
    thickness_threshold = 5
    min_wall_length = 50
    max_line_separation = 5
    door_gap_threshold = 200
    door_min_length = 30

    walls, doors, original_image, image_with_detections = detect_walls_and_doors(
        image_path, thickness_threshold, min_wall_length, max_line_separation, door_gap_threshold, door_min_length)

    if walls:
        print("Detected Walls:")
        for wall in walls:
            (x1, y1), (x2, y2), length = wall
            print(
                f"  Start: ({x1}, {y1}), End: ({x2}, {y2}), Length: {length:.2f} pixels")
    else:
        print("No walls detected.")

    if doors:
        print("Detected Doors:")
        for door in doors:
            print(f"  Center: {door}")
    else:
        print("No doors detected.")

    if original_image is not None and image_with_detections is not None:
        cv2.imshow("Original Image", original_image)
        cv2.imshow("Image with Detections", image_with_detections)
        cv2.waitKey(0)
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
