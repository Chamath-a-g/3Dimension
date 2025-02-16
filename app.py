from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
import base64
import uuid

app = Flask(__name__)

# Folders for file storage
UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

blueprint_storage = {}  # Dictionary to store processed blueprints

# -----------------------
# Helper Functions
# -----------------------

def process_image(image_path):
    """
    Process the image by converting it to grayscale.
    Returns the path of the processed image, or None if processing fails.
    """
    try:
        img = cv2.imread(image_path)
        if img is None:
            return None  # Could not read image
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        processed_path = os.path.join(PROCESSED_FOLDER, "processed_" + os.path.basename(image_path))
        cv2.imwrite(processed_path, gray)
        return processed_path
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

def encode_image_to_base64(image_path):
    """
    Encodes an image file to a Base64 string.
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# -----------------------
# API Endpoints
# -----------------------

@app.route('/')
def home():
    return "Welcome to the Flask API!", 200

@app.route('/upload', methods=['POST'])
def upload_file():
    """
    Uploads an image, processes it (converts to grayscale), and returns
    the processed image both as a file path and as a Base64 string.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    processed_image_path = process_image(filepath)
    if processed_image_path is None:
        return jsonify({'error': 'Invalid image file'}), 400

    processed_image_base64 = encode_image_to_base64(processed_image_path)

    return jsonify({
        'message': 'File processed successfully',
        'original_filename': file.filename,
        'processed_image_path': processed_image_path,
        'processed_image_base64': processed_image_base64
    }), 200

@app.route('/process', methods=['POST'])
def process_blueprint():
    """
    Receives blueprint data consisting of a text element and an image.
    Processes the image and returns the original text along with the processed image.
    Stores the processed data for later retrieval.
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    text_data = request.form.get('text', '')

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    processed_image_path = process_image(filepath)
    if processed_image_path is None:
        return jsonify({'error': 'Invalid image file'}), 400

    processed_image_base64 = encode_image_to_base64(processed_image_path)

    # Generate a unique ID for the blueprint
    blueprint_id = str(uuid.uuid4())

    # Store the processed data
    blueprint_storage[blueprint_id] = {
        'original_text': text_data,
        'processed_image_path': processed_image_path,
        'processed_image_base64': processed_image_base64
    }

    return jsonify({
        'message': 'File processed successfully',
        'blueprint_id': blueprint_id,  # Return the ID
        'original_text': text_data,
        'processed_image_path': processed_image_path,
        'processed_image_base64': processed_image_base64
    }), 200


@app.route('/blueprint/<blueprint_id>', methods=['GET'])
def get_processed_blueprint(blueprint_id):
    """
    Retrieves a previously processed blueprint by its ID.
    """
    if blueprint_id in blueprint_storage:
        blueprint_data = blueprint_storage[blueprint_id]
        return jsonify(blueprint_data), 200
    else:
        return jsonify({'error': 'Blueprint not found'}), 404
# -----------------------
# Blueprint Data Endpoint
# -----------------------

# Sample blueprint data in a Three.js–compatible JSON format.
blueprint_data = {
    "lines": [
        [[0, 0, 0], [10, 0, 0]],
        [[10, 0, 0], [10, 10, 0]],
        [[10, 10, 0], [0, 10, 0]],
        [[0, 10, 0], [0, 0, 0]]
    ],
    "rooms": [
        {
            "id": "room1",
            "name": "Living Room",
            "polygon": [
                [0, 0, 0],
                [10, 0, 0],
                [10, 10, 0],
                [0, 10, 0]
            ]
        }
    ]
}

@app.route('/get-blueprint', methods=['GET'])
def get_blueprint():
    """
    Returns structured blueprint data formatted for Three.js.
    """
    try:
        return jsonify(blueprint_data), 200
    except Exception as e:
        return jsonify({"error": "Failed to fetch blueprint data", "details": str(e)}), 500

# -----------------------
# Run the Flask App
# -----------------------

if __name__ == '__main__':
    app.run(debug=True)
