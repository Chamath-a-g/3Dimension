from flask import Flask, request, jsonify
import os
from flask_cors import CORS  # Enable frontend-backend communication
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
    'UNAUTHORIZED_ACCESS': {'message': 'Unauthorized access', 'code': 401},
    'RATE_LIMIT_EXCEEDED': {'message': 'Rate limit exceeded. Try again later.', 'code': 429}
}

# Helper function to generate the JSON response

def generate_response(data):
    return {
        "status": STATUS_SUCCESS,
        "message": MESSAGE_SUCCESS,
        "data": data,
        "errors": []
    }

# Initialize rate limiter
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=['200 per day', '50 per hour']
)

# Update CORS configuration
CORS(app, origins=['https://your-frontend-domain.com'], methods=['GET', 'POST'])

# New API Route: Get mock room and wall data
@app.route('/mock_data', methods=['GET'])
def mock_data():
    """Return mock room and wall data."""
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
    return jsonify(generate_response(rooms_data)), 200

if __name__ == '__main__':
    app.run(debug=True)