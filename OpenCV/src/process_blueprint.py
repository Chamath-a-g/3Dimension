# Create a new file called process_blueprint.py
from blueprint_processor import BlueprintProcessor
import os

# Get the absolute path to the image
current_dir = os.path.dirname(os.path.abspath(__file__))
image_path = os.path.join(current_dir, "..","2D", "2D", "B1.png")

# Initialize and process the blueprint
processor = BlueprintProcessor(image_path)
results = processor.process_blueprint()
processor.visualize_results()