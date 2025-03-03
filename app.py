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

# Define constants for API keys
API_KEYS = {'your-secure-api-key'}

# Define constants for status messages
STATUS_SUCCESS = "success"
MESSAGE_SUCCESS = "Data retrieved successfully"

# Define constants for error messages
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

# Helper function to generate the JSON response
def generate_response(items, current_page, total_pages, total_items):
    return {
        "status": STATUS_SUCCESS,
        "message": MESSAGE_SUCCESS,
        "data": {
            "items": items,
            "pagination": {
                "current_page": current_page,
                "total_pages": total_pages,
                "total_items": total_items
            }
        }
    }

# Function to convert OpenCV output into JSON format for Three.js
def convert_to_json_format(rooms_data):
    """Convert processed room data into a JSON format compatible with Three.js."""
    rooms = []
    for room in rooms_data:
        room_json = {
            "id": room['id'],
            "name": room['name'],
            "dimensions": room['dimensions'],
            "walls": []
        }
        for wall in room['walls']:
            wall_json = {
                "id": wall['id'],
                "coordinates": {
                    "start": wall['coordinates']['start'],
                    "end": wall['coordinates']['end']
                },
                "thickness": wall['thickness']
            }
            room_json["walls"].append(wall_json)
        rooms.append(room_json)
    return {
        "status": "success",
        "message": "Data retrieved successfully",
        "data": {
            "rooms": rooms
        },
        "errors": []
    }

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

# Define constants for upload and processed folders
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'

# Define constant for max file size
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB in bytes

# Set max file size limit in Flask config
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE  

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

# Function to process image (convert to grayscale)
def process_image(image_path):
    """Process the given image and convert it to grayscale."""
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
    """Validate the uploaded image for type, size, and dimensions."""
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
    """Upload a file and return its path and response time."""
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
        return jsonify(generate_response([
            {'message': 'File uploaded successfully', 'file_path': file_path, 'response_time': response_time}
        ], 1, 1, 1)), 200
    except Exception:
        return jsonify(ERROR_MESSAGES['PROCESSING_ERROR']), ERROR_MESSAGES['PROCESSING_ERROR']['code']

# Existing API Route: Process an image with text input
@app.route('/process', methods=['POST'])
@require_api_key
@limiter.limit('10 per minute')
def process_blueprint():
    """Process an uploaded image and return the processed image path."""
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
        return jsonify(generate_response([
            {'message': 'Image processed successfully', 'processed_image_path': processed_image_path, 'response_time': response_time}
        ], 1, 1, 1)), 200
    except Exception:
        return jsonify(ERROR_MESSAGES['PROCESSING_ERROR']), ERROR_MESSAGES['PROCESSING_ERROR']['code']

# New API Route: Convert OpenCV output into JSON format for Three.js
@app.route('/convert_to_json', methods=['POST'])
@require_api_key
@limiter.limit('10 per minute')
def convert_to_json():
    """Convert OpenCV output into JSON format for Three.js."""
    start_time = datetime.now()
    
    # Assuming rooms_data is obtained from OpenCV processing
    rooms_data = [
        {
            "id": "room1",
            "name": "Living Room",
            "dimensions": {"width": 5.0, "length": 7.0, "height": 3.0},
            "walls": [
                {
                    "id": "wall1",
                    "coordinates": {
                        "start": {"x": 0, "y": 0, "z": 0},
                        "end": {"x": 5, "y": 0, "z": 0}
                    },
                    "thickness": 0.2
                }
            ]
        }
    ]

    try:
        json_output = convert_to_json_format(rooms_data)
        response_time = (datetime.now() - start_time).total_seconds()
        return jsonify(json_output), 200
    except Exception:
        return jsonify(ERROR_MESSAGES['PROCESSING_ERROR']), ERROR_MESSAGES['PROCESSING_ERROR']['code']

if __name__ == '__main__':
    app.run(debug=True)