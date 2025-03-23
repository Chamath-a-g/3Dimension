import cv2 as cv
import numpy as np
import matplotlib.pyplot as plt


def display_results(image_path):
    """Process and display the blueprint detection results."""
    result, wall_mask, door_mask, window_mask = detect_blueprint_elements(image_path)
    
    if result is None:
        print("Detection failed.")
        return
    
    # Convert masks to BGR for visualization
    wall_vis = cv.cvtColor(wall_mask, cv.COLOR_GRAY2BGR)
    door_vis = cv.cvtColor(door_mask, cv.COLOR_GRAY2BGR)
    window_vis = cv.cvtColor(window_mask, cv.COLOR_GRAY2BGR)
    
    # Make the mask visualization more visible
    wall_vis[wall_mask > 0] = [0, 255, 0]  # Green for walls
    door_vis[door_mask > 0] = [0, 0, 255]  # Red for doors
    window_vis[window_mask > 0] = [255, 0, 0]  # Blue for windows
    
    # Create a figure for visualization
    plt.figure(figsize=(15, 10))
    
    # Original image
    plt.subplot(231)
    plt.title('Original Blueprint')
    plt.imshow(cv.cvtColor(cv.imread(image_path), cv.COLOR_BGR2RGB))
    plt.axis('off')
    
    # Combined result
    plt.subplot(232)
    plt.title('Combined Detection')
    plt.imshow(cv.cvtColor(result, cv.COLOR_BGR2RGB))
    plt.axis('off')
    
    # Wall mask
    plt.subplot(233)
    plt.title('Walls (Green)')
    plt.imshow(cv.cvtColor(wall_vis, cv.COLOR_BGR2RGB))
    plt.axis('off')
    
    # Door mask
    plt.subplot(234)
    plt.title('Doors (Red)')
    plt.imshow(cv.cvtColor(door_vis, cv.COLOR_BGR2RGB))
    plt.axis('off')
    
    # Window mask
    plt.subplot(235)
    plt.title('Windows (Blue)')
    plt.imshow(cv.cvtColor(window_vis, cv.COLOR_BGR2RGB))
    plt.axis('off')
    
    plt.tight_layout()
    plt.show()