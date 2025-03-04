from ultralytics import YOLO
import cv2

# Load a pretrained YOLOv8n model
model = YOLO('runs/detect/train7/weights/best.pt')  # Download if needed

# Read image
img = cv2.imread('images/B2.png')  # Replace with a real image path

# Run inference on the image
results = model.predict(img)

# Visualize results
for r in results:
    boxes = r.boxes
    for box in boxes:
        # Extracting Bounding Box
        x1, y1, x2, y2 = box.xyxy[0]
        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
        cv2.rectangle(img, (x1, y1), (x2, y2),
                      (0, 255, 0), 3)  # Draw Rectangle

cv2.imshow('YOLO Object Detection', img)
cv2.waitKey(0)
cv2.destroyAllWindows()
