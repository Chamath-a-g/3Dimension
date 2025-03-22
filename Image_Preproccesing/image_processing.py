import cv2 as cv 
import pytesseract

# Set Tesseract executable path if needed
# pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Load an image
image = cv.imread(r"Blueprints\blueprint3.jpg")

# Check if image was successfully loaded
if image is None:
    print("Error: Could not load image")
    exit()

# Display the image
cv.imshow("Blueprint", image)
cv.waitKey(0)
cv.destroyAllWindows()

# Extract text using Tesseract OCR
text = pytesseract.image_to_string(image)
print("Extracted Text:\n", text)

def preprocess_image(image_path):
    # Load the image
    image = cv.imread(image_path)
    
    if image is None:
        print("Error: Could not load image")
        return None

    # Convert to grayscale
    gray = cv.cvtColor(image, cv.COLOR_BGR2GRAY)

    # Apply Gaussian blur to reduce noise
    blurred = cv.GaussianBlur(gray, (5, 5), 0)

    # Apply thresholding to binarize the image
    _, binary = cv.threshold(blurred, 150, 255, cv.THRESH_BINARY)

    return binary

# Preprocess the image
processed_image = preprocess_image(r"D:\IIT\2nd Year\SDGP\3Dimension\Blueprints\blueprint5.jpg")

if processed_image is not None:
    # Extract text from the processed image
    text = pytesseract.image_to_string(processed_image)
    print("Improved Text:\n", text)

    # Save the processed image for debugging
    cv.imwrite(r"D:\IIT\2nd Year\SDGP\3Dimension\New folder\blueprint5.jpg", processed_image)
    # image = cv.imread(r"D:\IIT\2nd Year\SDGP\3Dimension\New folder\blueprint2.jpg")