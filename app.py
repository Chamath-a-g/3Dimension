from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
from flask_cors import CORS  # Enable frontend-backend communication
from PIL import Image
from datetime import datetime
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from functools import wraps

app = Flask(__name__)

API_KEYS = {'your-secure-api-key'}

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=['200 per day', '50 per hour']
)

# Security headers
@app.after_request
def add_security_headers(response):
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'SAMEORIGIN'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    return response

# API key authentication
def require_api_key(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-KEY')
        if api_key not in API_KEYS:
            return jsonify(ERROR_MESSAGES['UNAUTHORIZED_ACCESS']), ERROR_MESSAGES['UNAUTHORIZED_ACCESS']['code']
        return f(*args, **kwargs)
    return decorated_function

# Update CORS configuration
CORS(app, origins=['https://your-frontend-domain.com'], methods=['GET', 'POST'])

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB in bytes

# Set max file size limit in Flask config
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE  

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Ensure all error messages are consistent and cover various scenarios
ERROR_MESSAGES = {
    'NO_FILE': {'message': 'No file part in request', 'code': 400},
    'NO_SELECTED_FILE': {'message': 'No file selected', 'code': 400},
    'INVALID_IMAGE': {'message': 'Invalid or corrupted image file', 'code': 400},
    'FILE_TOO_LARGE': {'message': 'File size exceeds maximum allowed size of 20MB', 'code': 413},
    'PROCESSING_ERROR': {'message': 'Error processing image', 'code': 500},
    'INVALID_FILE_TYPE': {'message': 'Invalid file type. Only JPEG, PNG, and GIF are allowed', 'code': 400},
    'DIMENSIONS_TOO_LARGE': {'message': 'Image dimensions exceed 5000x5000 pixels', 'code': 400},
    'UNAUTHORIZED_ACCESS': {'message': 'Unauthorized access', 'code': 401},
    'RATE_LIMIT_EXCEEDED': {'message': 'Rate limit exceeded. Try again later.', 'code': 429}
}

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
        return False, ERROR_MESSAGES['INVALID_FILE_TYPE']

    # Check file size (max 5MB)
    max_size = 5 * 1024 * 1024
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > max_size:
        return False, ERROR_MESSAGES['FILE_TOO_LARGE']

    # Check image dimensions
    try:
        img = Image.open(file)
        width, height = img.size
        if width > 5000 or height > 5000:
            return False, ERROR_MESSAGES['DIMENSIONS_TOO_LARGE']
    except Exception:
        return False, ERROR_MESSAGES['INVALID_IMAGE']

    return True, None

# New API Route: Upload a file from React
@app.route('/upload', methods=['POST'])
@require_api_key
@limiter.limit('10 per minute')
def upload_file():
    start_time = datetime.now()
    
    if 'file' not in request.files:
        return jsonify(ERROR_MESSAGES['NO_FILE']), ERROR_MESSAGES['NO_FILE']['code']

    file = request.files['file']
    if file.filename == '':
        return jsonify(ERROR_MESSAGES['NO_SELECTED_FILE']), ERROR_MESSAGES['NO_SELECTED_FILE']['code']

    # Validate file size
    if request.content_length > MAX_FILE_SIZE:
        return jsonify(ERROR_MESSAGES['FILE_TOO_LARGE']), ERROR_MESSAGES['FILE_TOO_LARGE']['code']

    # Validate image
    is_valid, error = validate_image(file)
    if not is_valid:
        return jsonify(error), error['code']

    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)
        
        response_time = (datetime.now() - start_time).total_seconds()
        return jsonify({
            'message': 'File uploaded successfully',
            'file_path': file_path,
            'response_time': response_time
        }), 200
    except Exception:
        return jsonify(ERROR_MESSAGES['PROCESSING_ERROR']), ERROR_MESSAGES['PROCESSING_ERROR']['code']

# Existing API Route: Process an image with text input
@app.route('/process', methods=['POST'])
@require_api_key
@limiter.limit('10 per minute')
def process_blueprint():
    start_time = datetime.now()
    
    if 'file' not in request.files:
        return jsonify(ERROR_MESSAGES['NO_FILE']), ERROR_MESSAGES['NO_FILE']['code']

    file = request.files['file']
    text_data = request.form.get('text', '')

    if file.filename == '':
        return jsonify(ERROR_MESSAGES['NO_SELECTED_FILE']), ERROR_MESSAGES['NO_SELECTED_FILE']['code']

    # Validate file size
    if request.content_length > MAX_FILE_SIZE:
        return jsonify(ERROR_MESSAGES['FILE_TOO_LARGE']), ERROR_MESSAGES['FILE_TOO_LARGE']['code']

    # Validate image
    is_valid, error = validate_image(file)
    if not is_valid:
        return jsonify(error), error['code']

    try:
        filepath = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(filepath)

        processed_image_path = process_image(filepath)
        if processed_image_path is None:
            return jsonify(ERROR_MESSAGES['INVALID_IMAGE']), ERROR_MESSAGES['INVALID_IMAGE']['code']

        response_time = (datetime.now() - start_time).total_seconds()
        return jsonify({
            'message': 'File processed successfully',
            'original_text': text_data,
            'processed_image': processed_image_path,
            'response_time': response_time
        }), 200
    except Exception:
        return jsonify(ERROR_MESSAGES['PROCESSING_ERROR']), ERROR_MESSAGES['PROCESSING_ERROR']['code']

if __name__ == '__main__':
    app.run(debug=True)