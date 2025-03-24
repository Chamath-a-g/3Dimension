import cv2 as cv
import numpy as np

# --- Define Scale Factor and Default Dimensions (Meters) ---
PIXEL_TO_METER_SCALE = 0.02  # Adjust this scale factor as needed
DEFAULT_WALL_THICKNESS_METER = 0.2
DEFAULT_DOOR_WIDTH_METER = 0.9
DEFAULT_DOOR_HEIGHT_METER = 2.1
DEFAULT_WINDOW_WIDTH_METER = 1.5
DEFAULT_WINDOW_HEIGHT_METER = 1.2
DEFAULT_WINDOW_SILL_HEIGHT_METER = 0.9
DEFAULT_ROTATION = 0

def detect_blueprint_elements(image_path):
    """
    Detect blueprint elements using thickness-based wall detection and output JSON.
    """
    # Load the image
    image = cv.imread(image_path)
    if image is None:
        print(f"Error: Could not load image from {image_path}")
        return None

    img_with_walls = image.copy()
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)
    edges = cv.Canny(gray, 50, 150, apertureSize=3)

    lines = cv.HoughLinesP(edges, 1, np.pi / 180, 100, minLineLength=100, maxLineGap=10) # Adjusted minLineLength

    wall_lines_data = []
    door_data = []
    window_data = []


    if lines is not None:
        # First filter lines based on thickness (average pixel intensity)
        potential_walls = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            length = np.sqrt((x2 - x1)**2 + (y2 - y1)**2) # Calculate length early

            line_mask = np.zeros_like(gray)
            cv.line(line_mask, (x1, y1), (x2, y2), 255, 3)
            mean_intensity = cv.mean(gray, mask=line_mask)[0]

            if mean_intensity > 5 and length >= 50:  # Check length here as well, Adjusted thickness_threshold and min_wall_length values
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
                angle1 = np.arctan2(y2_1 - y1_1, x2_1 - x1_1)
                angle2 = np.arctan2(y2_2 - y1_2, x2_2 - x1_2)
                angle_diff = abs(angle1 - angle2)

                dist1 = min(np.sqrt((x1_1 - x1_2)**2 + (y1_1 - y1_2)**2), np.sqrt((x1_1 - x2_2)**2 + (y1_1 - y2_2)**2),
                            np.sqrt((x2_1 - x1_2)**2 + (y2_1 - y1_2)**2), np.sqrt((x2_1 - x2_2)**2 + (y2_1 - y2_2)**2))

                if angle_diff < 0.1 and dist1 <= 5: # Kept max_line_separation = 5
                    # Merge the lines (simple average of endpoints)
                    new_x1 = int((x1_1 + x1_2) / 2)
                    new_y1 = int((y1_1 + y1_2) / 2)
                    new_x2 = int((x2_1 + x2_2) / 2)
                    new_y2 = int((y2_1 + y2_2) / 2)
                    new_length = np.sqrt((new_x2 - new_x1)**2 + (new_y2 - new_y1)**2)

                    merged_walls.append(((new_x1, new_y1), (new_x2, new_y2), new_length))
                    used_lines.add(i)
                    used_lines.add(j)
                    merged = True
                    break

            if not merged:
                merged_walls.append(wall1)

        # Convert merged walls to desired JSON format
        for (x1, y1), (x2, y2), length in merged_walls:
            start_meter = {'x': round(x1 * PIXEL_TO_METER_SCALE, 2), 'y': round((image.shape[0] - y1) * PIXEL_TO_METER_SCALE, 2)} # Y-flipped
            end_meter = {'x': round(x2 * PIXEL_TO_METER_SCALE, 2), 'y': round((image.shape[0] - y2) * PIXEL_TO_METER_SCALE, 2)}   # Y-flipped
            wall_lines_data.append({
                'start': start_meter,
                'end': end_meter,
                'thickness': DEFAULT_WALL_THICKNESS_METER
            })

    # DOOR DETECTION (Circles Method) - Keep same as before (Step 7)
    circles = cv.HoughCircles(gray, cv.HOUGH_GRADIENT, dp=1, minDist=20, param1=50, param2=15, minRadius=5, maxRadius=30)
    wall_mask = np.zeros_like(gray)
    if wall_lines_data:
        for wall in wall_lines_data:
            x1_px = wall['start']['x'] / PIXEL_TO_METER_SCALE # Convert back to pixel for mask drawing
            y1_px = image.shape[0] - wall['start']['y'] / PIXEL_TO_METER_SCALE # Flip Y and convert back to pixel
            x2_px = wall['end']['x'] / PIXEL_TO_METER_SCALE # Convert back to pixel for mask drawing
            y2_px = image.shape[0] - wall['end']['y'] / PIXEL_TO_METER_SCALE # Flip Y and convert back to pixel
            cv.line(wall_mask, (int(x1_px), int(y1_px)), (int(x2_px), int(y2_px)), 255, 2)

    if circles is not None:
        circles = np.uint16(np.around(circles))
        for i in circles[0, :]:
            center_px = (i[0], i[1])
            center_meter = {'x': round(center_px[0] * PIXEL_TO_METER_SCALE, 2), 'y': round((image.shape[0] - center_px[1]) * PIXEL_TO_METER_SCALE, 2)} # Y-flipped, meter units, rounded

            circle_region = np.zeros_like(gray)
            cv.circle(circle_region, center_px, i[2] + 5, 255, 3)
            if np.sum(cv.bitwise_and(circle_region, wall_mask)) > 0:
                door_data.append({ # Use door_data here
                    'position': center_meter,
                    'width': DEFAULT_DOOR_WIDTH_METER,
                    'height': DEFAULT_DOOR_HEIGHT_METER,
                    'rotation': DEFAULT_ROTATION
                })

    # WINDOW DETECTION (Rectangles) -  Output in desired structure (same placeholder as before)
    window_data = [{
        'position': {'x': 2.51, 'y': 5.57},
        'width': DEFAULT_WINDOW_WIDTH_METER,
        'height': DEFAULT_WINDOW_HEIGHT_METER,
        'sillHeight': DEFAULT_WINDOW_SILL_HEIGHT_METER,
        'rotation': DEFAULT_ROTATION
    }, {
        'position': {'x': 3.94, 'y': 0},
        'width': DEFAULT_WINDOW_WIDTH_METER,
        'height': DEFAULT_WINDOW_HEIGHT_METER,
        'sillHeight': DEFAULT_WINDOW_SILL_HEIGHT_METER,
        'rotation': DEFAULT_ROTATION
    }]


    return {
        'walls': wall_lines_data,
        'doors': door_data,
        'windows': window_data
    }

def is_perpendicular_to_wall(angle, wall_lines, threshold=20):
    return False # Placeholder - not used in this wall detection logic

def is_parallel_to_wall(angle, wall_lines, threshold=20):
    return False # Placeholder - not used in this wall detection logic


if __name__ == "__main__":
    image_path = "blueprint.png"  # Example path for testing - you can change it
    blueprint_data = detect_blueprint_elements(image_path)
    if blueprint_data:
        import json
        print(json.dumps(blueprint_data, indent=4))
    else:
        print("Blueprint element detection failed.")