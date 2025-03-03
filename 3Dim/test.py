import cv2
import torch
import ultralytics

print(f"OpenCV version: {cv2.__version__}")
print(f"PyTorch version: {torch.__version__}")
print(f"Ultralytics version: {ultralytics.__version__}")

# Test OpenCV
img = cv2.imread("your_image.jpg")  # Replace with a valid image path
if img is not None:
    print("OpenCV image loaded successfully.")
else:
    print("OpenCV image loading failed!")

# Test PyTorch
x = torch.rand(5, 3)
print(f"PyTorch tensor: {x}")
print("PyTorch is working")

# Test Ultralytics (YOLOv8)
try:
    from ultralytics import YOLO
    model = YOLO("yolov8n.pt")  # Load default weights
    print("YOLO loaded succesfully")
except Exception as e:
    print(f"YOLO loading failed with error: {e}")
