import cv2
import numpy as np
from ultralytics import YOLO
import base64
import time
from datetime import datetime
from pathlib import Path

class LiveDetector:
    def __init__(self, model_path, rtsp_url):
        """Initialize the live detector with YOLO model and camera stream"""
        self.model = YOLO(model_path)
        self.rtsp_url = rtsp_url
        self.cap = None
        self.is_running = False
        self.last_detection_time = None
        
        # Create images directory
        self.images_dir = Path(__file__).parent / "images"
        self.images_dir.mkdir(exist_ok=True)
        
    def connect_camera(self):
        """Connect to the RTSP camera"""
        self.cap = cv2.VideoCapture(self.rtsp_url)
        if self.cap.isOpened():
            self.is_running = True
            print("Camera connected!")
            return True
        else:
            print("Failed to connect to camera")
            return False
    
    def is_cooldown_active(self):
        """Check if cooldown period is still active"""
        if self.last_detection_time is None:
            return False
        
        from database import get_setting
        cooldown_seconds = int(get_setting('cooldown_seconds', '30'))
        
        time_since_last = (datetime.now() - self.last_detection_time).total_seconds()
        return time_since_last < cooldown_seconds
    
    def save_detection_image(self, frame):
        """Save detection frame as image and return filename"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"fall_{timestamp}.jpg"
        filepath = self.images_dir / filename
        
        # Save high quality image
        cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        
        return filename
    
    def detect_frame(self):
        """Read a frame, run detection, return annotated frame + results"""
        if not self.cap or not self.cap.isOpened():
            return None, None, None
        
        ret, frame = self.cap.read()
        if not ret:
            return None, None, None
        
        # HIGH QUALITY: Larger resolution for better clarity
        frame_resized = cv2.resize(frame, (640, 360))
        
        # Get confidence from settings
        from database import get_setting
        confidence = float(get_setting('confidence_threshold', '0.75'))
        
        # Run YOLO detection with confidence from settings
        results = self.model(frame_resized, conf=confidence, verbose=False)
        
        # Get detections
        detections = []
        fall_detected_this_frame = False
        saved_image_filename = None
        
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = self.model.names[cls]
                
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': conf,
                    'class': class_name
                })
                
                # Check if it's a fall
                if 'fall' in class_name.lower():
                    fall_detected_this_frame = True
                
                # Draw bounding box
                color = (0, 0, 255) if 'fall' in class_name.lower() else (0, 255, 0)
                cv2.rectangle(frame_resized, 
                            (int(x1), int(y1)), 
                            (int(x2), int(y2)), 
                            color, 2)
                
                # Add label
                label = "Fall Detected" if 'fall' in class_name.lower() else class_name
                cv2.putText(frame_resized, label, 
                          (int(x1), int(y1) - 8),
                          cv2.FONT_HERSHEY_SIMPLEX, 
                          0.5, color, 2)
        
        # Update cooldown timer and save image if fall was detected
        if fall_detected_this_frame:
            if not self.is_cooldown_active():
                # Cooldown expired, this is a new detection - SAVE IMAGE
                self.last_detection_time = datetime.now()
                saved_image_filename = self.save_detection_image(frame_resized)
                print(f"New fall detected! Image saved: {saved_image_filename}")
            else:
                # Still in cooldown, skip
                cooldown_seconds = int(get_setting('cooldown_seconds', '30'))
                time_remaining = cooldown_seconds - (datetime.now() - self.last_detection_time).total_seconds()
                print(f"Cooldown active: {time_remaining:.0f}s remaining")
        
        # HIGH QUALITY: 75% JPEG quality
        encode_param = [cv2.IMWRITE_JPEG_QUALITY, 75]
        _, buffer = cv2.imencode('.jpg', frame_resized, encode_param)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return frame_base64, detections, saved_image_filename
    
    def stop(self):
        """Stop the camera stream"""
        self.is_running = False
        if self.cap:
            self.cap.release()
            print("Camera released")