from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
from flask_cors import CORS  # Enable frontend-backend communication

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Create folders if they don't existttttttttttttttttttttttt
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Function to process image (convert to grayscale)
def process_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None  # Return None if the image is invalid
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        processed_path = os.path.join(PROCESSED_FOLDER, "processed_" + os.path.basename(image_path))
        cv2.imwrite(processed_path, gray)
        return processed_path
    except Exception as e:
        return None

# New API Route: Upload a file from React
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return jsonify({'message': 'File uploaded successfully!', 'file_path': file_path}), 200

# Existing API Route: Process an image with text input
@app.route('/process', methods=['POST'])
def process_blueprint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    text_data = request.form.get('text', '')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Save uploaded file
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    # Process the image
    processed_image_path = process_image(filepath)
    if processed_image_path is None:
        return jsonify({'error': 'Invalid image file'}), 400

    # Response JSON with processed text + image
    return jsonify({
        'message': 'File processed successfully',
        'original_text': text_data,
        'processed_image': processed_image_path
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
