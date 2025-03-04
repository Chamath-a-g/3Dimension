import cv2
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional
import logging
##import matplotlib.pyplot as plt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class ArchitecturalElement:
    """Represents architectural elements like walls, windows, and doors"""
    element_type: str
    coordinates: List[Tuple[int, int]]
    properties: Dict
    confidence: float

class BlueprintProcessor:
    def __init__(self, image_path: str, scale_factor: float = 1.0):
        """Initialize blueprint processor with image path and scale factor"""
        self.image_path = image_path
        self.scale_factor = scale_factor
        self.original_image = self._load_image()
        self.processed_image = None
        self.elements = []
        
        if self.original_image is None:
            raise ValueError(f"Failed to load image: {image_path}")

    def _load_image(self) -> np.ndarray:
        """Load and validate input image"""
        image = cv2.imread(self.image_path)
        if image is not None:
            # Resize image based on scale factor
            width = int(image.shape[1] * self.scale_factor)
            height = int(image.shape[0] * self.scale_factor)
            return cv2.resize(image, (width, height))
        return None

    def _lines_are_similar(self, line1, line2, angle_threshold=10, distance_threshold=20):
        """
        Check if two lines are similar based on angle and proximity.
        """
        x1, y1, x2, y2 = line1[0]
        x3, y3, x4, y4 = line2[0]
        
        # Calculate angles in degrees
        angle1 = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        angle2 = np.degrees(np.arctan2(y4 - y3, x4 - x3))
        
        # Check if angles are similar
        if abs(angle1 - angle2) > angle_threshold:
            return False
        
        # Calculate distances between midpoints
        midpoint1 = ((x1 + x2) / 2, (y1 + y2) / 2)
        midpoint2 = ((x3 + x4) / 2, (y3 + y4) / 2)
        
        distance = np.linalg.norm(np.array(midpoint1) - np.array(midpoint2))
        
        return distance < distance_threshold

    

    def preprocess(self) -> np.ndarray:
        """Preprocess blueprint for feature detection"""
        try:
            # Convert to grayscale
            gray = cv2.cvtColor(self.original_image, cv2.COLOR_BGR2GRAY)
            
            # Denoise image
            denoised = cv2.fastNlMeansDenoising(gray)
            
            # Enhance contrast using CLAHE
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
            enhanced = clahe.apply(denoised)
            
            # Adaptive thresholding
            binary = cv2.adaptiveThreshold(
                enhanced,
                255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV,
                11,
                2
            )
            
            # Morphological operations
            kernel = np.ones((3,3), np.uint8)
            self.processed_image = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
            
            logger.info("Image preprocessing completed successfully")
            return self.processed_image
            
        except Exception as e:
            logger.error(f"Error during preprocessing: {str(e)}")
            raise

    def detect_walls(self) -> List[ArchitecturalElement]:
        """Detect walls using improved line detection"""
        walls = []
        try:
            # Apply probabilistic Hough transform
            lines = cv2.HoughLinesP(
                self.processed_image,
                rho=1,
                theta=np.pi/180,
                threshold=50,
                minLineLength=100,
                maxLineGap=10
            )
            
            if lines is None:
                return walls

            # Group similar lines
            grouped_lines = self._group_lines(lines)
            
            for line_group in grouped_lines:
                # Calculate average line for each group
                avg_line = self._calculate_average_line(line_group)
                length = self._calculate_line_length(avg_line)
                angle = self._calculate_line_angle(avg_line)
                
                walls.append(ArchitecturalElement(
                    element_type='wall',
                    coordinates=[(avg_line[0], avg_line[1]), 
                               (avg_line[2], avg_line[3])],
                    properties={
                        'length': length,
                        'angle': angle,
                        'thickness': self._estimate_wall_thickness(avg_line)
                    },
                    confidence=self._calculate_wall_confidence(length, angle)
                ))
            
            logger.info(f"Detected {len(walls)} walls")
            return walls
            
        except Exception as e:
            logger.error(f"Error during wall detection: {str(e)}")
            raise

    def _group_lines(self, lines: np.ndarray, 
                    distance_threshold: float = 10, 
                    angle_threshold: float = 5) -> List[List]:
        """Group similar lines together"""
        groups = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            matched = False
            
            for group in groups:
                if self._lines_are_similar(
                    (x1, y1, x2, y2), 
                    group[0][0], 
                    distance_threshold, 
                    angle_threshold
                ):
                    group.append(line)
                    matched = True
                    break
                    
            if not matched:
                groups.append([line])
                
        return groups

    def _calculate_wall_confidence(self, length: float, angle: float) -> float:
        """Calculate confidence score for wall detection"""
        length_score = min(length / 200, 1.0)  # Normalize length score
        angle_score = 1.0 - min(abs(angle % 90) / 45, 1.0)  # Prefer right angles
        return (length_score + angle_score) / 2

    def _estimate_wall_thickness(self, line: Tuple[int, int, int, int]) -> float:
        """Estimate wall thickness using local image analysis"""
        # Implementation details for wall thickness estimation
        return 1.0  # Placeholder

    @staticmethod
    def _calculate_line_length(line: Tuple[int, int, int, int]) -> float:
        """Calculate length of a line segment"""
        x1, y1, x2, y2 = line
        return np.sqrt((x2 - x1)**2 + (y2 - y1)**2)

    @staticmethod
    def _calculate_line_angle(line: Tuple[int, int, int, int]) -> float:
        """Calculate angle of a line segment"""
        x1, y1, x2, y2 = line
        return np.degrees(np.arctan2(y2 - y1, x2 - x1)) 

    def detect_openings(self) -> List[ArchitecturalElement]:
        """Detect windows and doors using contour analysis"""
        try:
            # Find contours in the processed image
            contours, _ = cv2.findContours(
                self.processed_image,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            openings = []
            for contour in contours:
                area = cv2.contourArea(contour)
                if area < 100:  # Filter out small contours
                    continue
                    
                # Approximate the contour to simplify shape
                perimeter = cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)
                
                # Get bounding rectangle
                x, y, w, h = cv2.boundingRect(approx)
                aspect_ratio = float(w) / h
                
                # Classify the opening based on shape and size
                element_type, confidence = self._classify_opening(
                    approx, aspect_ratio, area
                )
                
                if element_type:
                    openings.append(ArchitecturalElement(
                        element_type=element_type,
                        coordinates=[(x, y), (x+w, y), (x+w, y+h), (x, y+h)],
                        properties={
                            'area': area,
                            'aspect_ratio': aspect_ratio,
                            'width': w,
                            'height': h
                        },
                        confidence=confidence
                    ))
            
            logger.info(f"Detected {len(openings)} openings")
            return openings
            
        except Exception as e:
            logger.error(f"Error during opening detection: {str(e)}")
            raise

    def _classify_opening(self, 
                        contour: np.ndarray, 
                        aspect_ratio: float, 
                        area: float) -> Tuple[Optional[str], float]:
        """Classify opening as window or door based on features"""
        # Number of vertices in approximated contour
        num_vertices = len(contour)
        
        # Base confidence on shape regularity
        shape_confidence = 1.0 if num_vertices == 4 else 0.5
        
        if num_vertices >= 4 and num_vertices <= 6:
            if 1.3 <= aspect_ratio <= 2.5:  # Typical window proportions
                if area < 5000:  # Small opening - likely a window
                    return 'window', shape_confidence * 0.9
                else:
                    return 'window', shape_confidence * 0.7
            elif 0.3 <= aspect_ratio <= 0.7:  # Typical door proportions
                if area > 3000:  # Larger opening - likely a door
                    return 'door', shape_confidence * 0.9
                else:
                    return 'door', shape_confidence * 0.7
                    
        return None, 0.0

    def process_blueprint(self) -> Dict[str, List[ArchitecturalElement]]:
        """Process blueprint and detect all architectural elements"""
        try:
            self.preprocess()
            
            # Detect all elements
            walls = self.detect_walls()
            openings = self.detect_openings()
            
            # Store results
            self.elements = {
                'walls': walls,
                'openings': openings
            }
            
            # Additional post-processing
            self._resolve_conflicts()
            self._validate_structure()
            
            return self.elements
            
        except Exception as e:
            logger.error(f"Error processing blueprint: {str(e)}")
            raise

    def _resolve_conflicts(self):
        """Resolve conflicts between detected elements"""
        # Implement conflict resolution logic here
        # For example, merge overlapping walls, adjust opening positions
        pass

    def _validate_structure(self):
        """Validate the overall structure for architectural consistency"""
        # Implement validation logic here
        # Check for disconnected walls, floating openings, etc.
        pass

    def visualize_results(self, output_path: str = None) -> np.ndarray:
        """Visualize detected elements on the original image"""
        try:
            # Create a copy of the original image for visualization
            vis_image = self.original_image.copy()
            
            # Draw walls
            for wall in self.elements.get('walls', []):
                p1, p2 = wall.coordinates
                cv2.line(
                    vis_image,
                    (int(p1[0]), int(p1[1])),
                    (int(p2[0]), int(p2[1])),
                    (0, 255, 0),  # Green for walls
                    2
                )
            
            # Draw openings
            for opening in self.elements.get('openings', []):
                coords = opening.coordinates
                color = (255, 0, 0) if opening.element_type == 'window' else (0, 0, 255)
                cv2.polylines(
                    vis_image,
                    [np.array(coords, dtype=np.int32)],
                    True,
                    color,
                    2
                )
            
            if output_path:
                cv2.imwrite(output_path, vis_image)
            
            # Convert BGR to RGB for matplotlib display
            vis_image_rgb = cv2.cvtColor(vis_image, cv2.COLOR_BGR2RGB)
            
            # Display the image
            plt.figure(figsize=(12, 8))
            plt.imshow(vis_image_rgb)
            plt.axis('off')
            plt.show()
            
            return vis_image
            
        except Exception as e:
            logger.error(f"Error visualizing results: {str(e)}")
            raise 