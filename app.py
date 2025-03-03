
from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
from flask_cors import CORS  # Enable frontend-backend communication

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Create folders if they don't exist
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
from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
from flask_cors import CORS  # Enable frontend-backend communication
from PIL import Image

app = Flask(__name__)
CORS(app)  # Allow requests from React frontend

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB in bytes

# Set max file size limit in Flask config
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE  

# Create folders if they don't exist
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
    except Exception:
        return None

# Function to validate image
def validate_image(file):
    # Check file type
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    if file.content_type not in allowed_types:
        return False, 'Invalid file type. Only JPEG, PNG, and GIF are allowed.'

    # Check file size (max 5MB)
    max_size = 5 * 1024 * 1024
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > max_size:
        return False, 'File size exceeds 5MB limit.'

    # Check image dimensions
    try:
        img = Image.open(file)
        width, height = img.size
        if width > 5000 or height > 5000:
            return False, 'Image dimensions exceed 5000x5000 pixels.'
    except Exception:
        return False, 'Unable to read image dimensions.'

    return True, ''

# New API Route: Upload a file from React (Reject >20MB)
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Check file size
    if request.content_length > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large! Maximum allowed size is 20MB.'}), 400

    is_valid, error = validate_image(file)
    if not is_valid:
        return jsonify({'error': error}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return jsonify({'message': 'File uploaded successfully!', 'file_path': file_path}), 200

# Existing API Route: Process an image with text input (Reject >20MB)
@app.route('/process', methods=['POST'])
def process_blueprint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    text_data = request.form.get('text', '')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Check file size
    if request.content_length > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large! Maximum allowed size is 20MB.'}), 400

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