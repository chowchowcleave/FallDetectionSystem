import cv2
import numpy as np
from ultralytics import YOLO
import base64
from datetime import datetime
from pathlib import Path
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SKELETON_CONNECTIONS = [
    (5, 6),
    (5, 7), (7, 9),
    (6, 8), (8, 10),
    (5, 11), (6, 12),
    (11, 12),
    (11, 13), (13, 15),
    (12, 14), (14, 16),
]

def get_bbox_center(bbox):
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)

def get_keypoint_center(kp_array):
    valid_points = []
    for idx in [11, 12]:
        if idx < len(kp_array):
            x, y = kp_array[idx]
            if x > 0 and y > 0:
                valid_points.append((x, y))
    if not valid_points:
        for x, y in kp_array:
            if x > 0 and y > 0:
                valid_points.append((x, y))
    if not valid_points:
        return None
    cx = sum(p[0] for p in valid_points) / len(valid_points)
    cy = sum(p[1] for p in valid_points) / len(valid_points)
    return (cx, cy)

def is_skeleton_inside_bbox(kp_array, bbox, threshold=0.5):
    x1, y1, x2, y2 = bbox
    total = 0
    inside = 0
    for x, y in kp_array:
        if x > 0 and y > 0:
            total += 1
            if x1 <= x <= x2 and y1 <= y <= y2:
                inside += 1
    if total == 0:
        return False
    return (inside / total) >= threshold

def send_sms_alert(phone_number):
    """Send SMS alert via Semaphore when a fall is detected"""
    try:
        import requests

        api_key = os.getenv('SEMAPHORE_API_KEY')

        if not api_key:
            print("Semaphore API key not configured in .env")
            return False

        if not phone_number:
            print("No recipient phone number configured in settings")
            return False

        url = "https://api.semaphore.co/api/v4/messages"
        payload = {
            "apikey": api_key,
            "number": phone_number,
            "message": "A fall has been detected, please respond immediately.",
            "sendername": "CAIRE"
        }

        response = requests.post(url, data=payload)
        result = response.json()

        print(f"SMS sent! Response: {result}")
        return True

    except Exception as e:
        print(f"Failed to send SMS: {e}")
        return False

def send_email_alert(recipient_email):
    """Send email alert via Gmail SMTP when a fall is detected"""
    try:
        sender_email = os.getenv('EMAIL_SENDER')
        app_password = os.getenv('EMAIL_APP_PASSWORD')

        if not sender_email or not app_password:
            print("Email credentials not configured in .env")
            return False

        if not recipient_email:
            print("No recipient email configured in settings")
            return False

        timestamp = datetime.now().strftime("%B %d, %Y at %I:%M:%S %p")

        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = recipient_email
        msg['Subject'] = "CAIRE Alert: Fall Detected"

        body = f"""A fall has been detected, please respond immediately.

Detection Time: {timestamp}

This is an automated alert from the CAIRE Fall Detection System."""

        msg.attach(MIMEText(body, 'plain'))

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(sender_email, app_password)
            server.sendmail(sender_email, recipient_email, msg.as_string())

        print(f"Email alert sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

class LiveDetector:
    def __init__(self, model_path, camera_source, pose_model=None):
        self.model = YOLO(model_path)
        self.pose_model = pose_model
        self.camera_source = camera_source
        self.cap = None
        self.is_running = False
        self.last_detection_time = None
        self.images_dir = Path(__file__).parent / "images"
        self.images_dir.mkdir(exist_ok=True)
        self.startup_time = None
        self.startup_cooldown = 7  # seconds

    def connect_camera(self):
        self.cap = cv2.VideoCapture(self.camera_source)
        if self.cap.isOpened():
            self.is_running = True
            self.startup_time = datetime.now()
            if isinstance(self.camera_source, int):
                print(f"Webcam connected! Index: {self.camera_source}")
            else:
                print(f"RTSP camera connected!")
            return True
        else:
            if isinstance(self.camera_source, int):
                print(f"Failed to connect to webcam at index {self.camera_source}")
            else:
                print(f"Failed to connect to RTSP stream")
            return False

    def is_cooldown_active(self):
        if self.last_detection_time is None:
            return False
        from database import get_setting
        cooldown_seconds = int(get_setting('cooldown_seconds', '30'))
        time_since_last = (datetime.now() - self.last_detection_time).total_seconds()
        return time_since_last < cooldown_seconds

    def save_detection_image(self, frame):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"fall_{timestamp}.jpg"
        filepath = self.images_dir / filename
        cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return filename

    def draw_pose(self, frame, keypoints, color=(0, 255, 255)):
        if keypoints is None:
            return frame
        kp_array = keypoints.xy[0].cpu().numpy()
        kp_conf = keypoints.conf[0].cpu().numpy() if keypoints.conf is not None else None
        for i, (x, y) in enumerate(kp_array):
            if i < 5:
                continue
            if kp_conf is not None and kp_conf[i] < 0.3:
                continue
            if x > 0 and y > 0:
                cv2.circle(frame, (int(x), int(y)), 4, color, -1)
        for start_idx, end_idx in SKELETON_CONNECTIONS:
            if start_idx >= len(kp_array) or end_idx >= len(kp_array):
                continue
            x1, y1 = kp_array[start_idx]
            x2, y2 = kp_array[end_idx]
            if kp_conf is not None:
                if kp_conf[start_idx] < 0.3 or kp_conf[end_idx] < 0.3:
                    continue
            if x1 > 0 and y1 > 0 and x2 > 0 and y2 > 0:
                cv2.line(frame, (int(x1), int(y1)), (int(x2), int(y2)), color, 2)
        return frame

    def detect_frame(self):
        if not self.cap or not self.cap.isOpened():
            return None, None, None

        ret, frame = self.cap.read()
        if not ret:
            return None, None, None

        frame_resized = cv2.resize(frame, (640, 360))

        from database import get_setting

        fall_confidence = float(get_setting('confidence_threshold', '0.75'))
        tracking_confidence = float(get_setting('person_tracking_confidence', '0.45'))

        pose_keypoints = []
        if self.pose_model is not None:
            pose_results = self.pose_model(
                frame_resized,
                conf=tracking_confidence,
                verbose=False,
                show=False
            )
            for pose_r in pose_results:
                if pose_r.keypoints is not None:
                    for keypoints in pose_r.keypoints:
                        pose_keypoints.append(keypoints)

        results = self.model.track(
            frame_resized,
            conf=tracking_confidence,
            persist=True,
            verbose=False,
            tracker="bytetrack.yaml",
            iou=0.3,
        )

        fall_bboxes = []
        all_boxes = []

        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                class_name = self.model.names[cls]
                track_id = int(box.id[0]) if box.id is not None else None
                is_fall = 'fall' in class_name.lower()

                all_boxes.append({
                    'bbox': [x1, y1, x2, y2],
                    'conf': conf,
                    'class_name': class_name,
                    'track_id': track_id,
                    'is_fall': is_fall and conf >= fall_confidence
                })

                if is_fall and conf >= fall_confidence:
                    fall_bboxes.append([x1, y1, x2, y2])

        for keypoints in pose_keypoints:
            kp_array = keypoints.xy[0].cpu().numpy()
            is_fall_skeleton = False
            for fall_bbox in fall_bboxes:
                if is_skeleton_inside_bbox(kp_array, fall_bbox, threshold=0.3):
                    is_fall_skeleton = True
                    break
            color = (0, 0, 255) if is_fall_skeleton else (0, 255, 255)
            frame_resized = self.draw_pose(frame_resized, keypoints, color)

        detections = []
        fall_detected_this_frame = False
        saved_image_filename = None

        for box_data in all_boxes:
            x1, y1, x2, y2 = box_data['bbox']
            conf = box_data['conf']
            class_name = box_data['class_name']
            track_id = box_data['track_id']
            is_fall = box_data['is_fall']

            if is_fall:
                detections.append({
                    'bbox': [x1, y1, x2, y2],
                    'confidence': conf,
                    'class': class_name,
                    'track_id': track_id
                })
                fall_detected_this_frame = True

                cv2.rectangle(frame_resized,
                            (int(x1), int(y1)),
                            (int(x2), int(y2)),
                            (0, 0, 255), 2)

                label = f"Fall Detected #{track_id}" if track_id else "Fall Detected"
                cv2.putText(frame_resized, label,
                          (int(x1), int(y1) - 8),
                          cv2.FONT_HERSHEY_SIMPLEX,
                          0.5, (0, 0, 255), 2)

        if fall_detected_this_frame:
            startup_elapsed = (datetime.now() - self.startup_time).total_seconds() if self.startup_time else 999
            if startup_elapsed < self.startup_cooldown:
                print(f"Startup cooldown: {self.startup_cooldown - startup_elapsed:.0f}s remaining")
            elif not self.is_cooldown_active():
                self.last_detection_time = datetime.now()
                saved_image_filename = self.save_detection_image(frame_resized)
                print(f"New fall detected! Image saved: {saved_image_filename}")

                # Send SMS alert if enabled in settings
                sms_enabled = get_setting('alert_sms_enabled', 'false') == 'true'
                if sms_enabled:
                    phone_number = get_setting('alert_phone_number', '')
                    send_sms_alert(phone_number)

                # Send email alert if enabled in settings
                email_enabled = get_setting('alert_email_enabled', 'false') == 'true'
                if email_enabled:
                    email_address = get_setting('alert_email_address', '')
                    send_email_alert(email_address)

            else:
                cooldown_seconds = int(get_setting('cooldown_seconds', '30'))
                time_remaining = cooldown_seconds - (datetime.now() - self.last_detection_time).total_seconds()
                print(f"Cooldown active: {time_remaining:.0f}s remaining")

        encode_param = [cv2.IMWRITE_JPEG_QUALITY, 75]
        _, buffer = cv2.imencode('.jpg', frame_resized, encode_param)
        frame_base64 = base64.b64encode(buffer).decode('utf-8')

        return frame_base64, detections, saved_image_filename

    def stop(self):
        self.is_running = False
        if self.cap:
            self.cap.release()
            print("Camera released")