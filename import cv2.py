import cv2
image_path = r"D:\UNI\OOP [pro]\CW\3Dimension\OPENCV\Photos\bp2.png"
image = cv2.imread(image_path)

if image is None:
    print("Error: Image not found or cannot be loaded.")
else:
    print("Image loaded successfully!")
