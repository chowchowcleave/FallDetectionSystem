import cv2
import numpy as np
from ultralytics import YOLO
import base64
import time

class LiveDetector:
    def __init__(self, model_path, rtsp_url):
        """Initialize the live detector with YOLO model and camera stream"""
        self.model = YOLO(model_path)
        self.rtsp_url = rtsp_url
        self.cap = None
        self.is_running = False
        
    def connect_camera(self):
        """Connect to the RTSP camera"""
        self.cap = cv2.VideoCapture(self.rtsp_url)
        if self.cap.isOpened():
            self.is_running = True
            print("✅ Camera connected!")
            return True
        else:
            print("❌ Failed to connect to camera")
            return False
    
    def detect_frame(self):
        """Read a frame, run detection, return annotated frame + results"""
        if not self.cap or not self.cap.isOpened():
            return None, None
        
        ret, frame = self.cap.read()
        if not ret:
            return None, None
        
        # HIGH QUALITY: Larger resolution for better clarity
        frame_resized = cv2.resize(frame, (640, 360))
        
        # Run YOLO detection
        results = self.model(frame_resized, conf=0.5, verbose=False)
        
        # Get detections
        detections = []
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
                
                # Draw bounding box
                color = (0, 0, 255) if class_name == 'fall' else (0, 255, 0)
                cv2.rectangle(frame_resized, 
                            (int(x1), int(y1)), 
                            (int(x2), int(y2)), 
                            color, 2)
                
                # Add label
                label = f"{class_name} {conf:.2f}"
                cv2.putText(frame_resized, label, 
                          (int(x1), int(y1) - 8),
                          cv2.FONT_HERSHEY_SIMPLEX, 
                          0.5, color, 2)
        
        # HIGH QUALITY: 75% JPEG quality
        encode_param = [cv2.IMWRITE_JPEG_QUALITY, 75]
        _, buffer = cv2.imencode('.jpg', frame_resized, encode_param)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return frame_base64, detections
    
    def stop(self):
        """Stop the camera stream"""
        self.is_running = False
        if self.cap:
            self.cap.release()
            print("📷 Camera released")

# Test the detector
if __name__ == "__main__":
    MODEL_PATH = r"C:\Users\user\Desktop\FallDetection\models\best.pt"
    RTSP_URL = "rtsp://chamsroom:admin123@192.168.101.13:554/stream1"
    
    detector = LiveDetector(MODEL_PATH, RTSP_URL)
    
    if detector.connect_camera():
        print("Testing detection for 10 seconds...")
        start_time = time.time()
        
        while time.time() - start_time < 10:
            frame_b64, detections = detector.detect_frame()
            if detections:
                print(f"🔍 Detected: {len(detections)} objects")
                for det in detections:
                    print(f"  - {det['class']}: {det['confidence']:.2f}")
            time.sleep(0.1)
        
        detector.stop()
        print("✅ Test complete!")