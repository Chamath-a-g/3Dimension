from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np

app = Flask(__name__)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(PROCESSED_FOLDER):
    os.makedirs(PROCESSED_FOLDER)

# Function to process image (convert to grayscale)
def process_image(image_path):
    img = cv2.imread(image_path)  # Read image
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)  # Convert to grayscale
    processed_path = os.path.join(PROCESSED_FOLDER, "processed_" + os.path.basename(image_path))
    cv2.imwrite(processed_path, gray)  # Save processed image
    return processed_path

# Default Route (Homepage)
@app.route('/')
def home():
    return "Welcome to the Flask API!", 200

# Image Upload Route
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Process the image
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)  # Save the uploaded file

    processed_image_path = process_image(filepath)

    # Return processed image
    return send_file(processed_image_path, mimetype='image/jpeg')

    return jsonify({'message': 'File uploaded successfully', 'filename': file.filename}), 200

if __name__ == '__main__':
    app.run(debug=True)

