from flask import Flask, request, jsonify, send_file
import os
import cv2
import numpy as np
from flask_cors import CORS
from werkzeug.utils import secure_filename
from detect1 import detect_blueprint_elements

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
PROCESSED_FOLDER = 'processed'
MAX_FILE_SIZE = 20 * 1024 * 1024
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)
app.config['STATIC_FOLDER'] = PROCESSED_FOLDER

@app.route('/process', methods=['POST'])
def process_blueprint():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if request.content_length > MAX_FILE_SIZE:
        return jsonify({'error': 'File too large! Maximum allowed size is 20MB.'}), 400
    filename = file.filename
    if not filename.lower().endswith(('.png', '.jpg', '.jpeg')):
        return jsonify({'error': 'Only .png, .jpg, and .jpeg files are allowed!'}), 400
    secure_name = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, secure_name)
    file.save(filepath)

    blueprint_data = detect_blueprint_elements(filepath)
    if blueprint_data is None:
        return jsonify({'error': 'Blueprint processing failed'}), 500

    # --- ADDED PRINT STATEMENT HERE TO LOG blueprint_data to BACKEND TERMINAL ---
    import json # Import json module
    print("Blueprint Data from OpenCV:\n", json.dumps(blueprint_data, indent=4))

    return jsonify({
        'message': 'Blueprint processed successfully',
        'blueprint_data': blueprint_data
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True)