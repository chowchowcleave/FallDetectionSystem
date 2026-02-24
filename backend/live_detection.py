import cv2
import numpy as np
from ultralytics import YOLO
import base64
from datetime import datetime
from pathlib import Path

# Only torso and below — no nose, eyes, ears
SKELETON_CONNECTIONS = [
    (5, 6),                   # shoulders
    (5, 7), (7, 9),           # left arm
    (6, 8), (8, 10),          # right arm
    (5, 11), (6, 12),         # shoulders to hips
    (11, 12),                 # hips
    (11, 13), (13, 15),       # left leg
    (12, 14), (14, 16),       # right leg
]

def get_bbox_center(bbox):
    """Get center point of a bounding box"""
    x1, y1, x2, y2 = bbox
    return ((x1 + x2) / 2, (y1 + y2) / 2)

def get_keypoint_center(kp_array):
    """Get center of a skeleton using hip keypoints (11, 12) or fallback to all points"""
    valid_points = []

    # Try hips first (most stable center)
    for idx in [11, 12]:
        if idx < len(kp_array):
            x, y = kp_array[idx]
            if x > 0 and y > 0:
                valid_points.append((x, y))

    # Fallback to all valid keypoints
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
    """Check if enough keypoints are inside the bounding box"""
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

class LiveDetector:
    def __init__(self, model_path, rtsp_url, pose_model=None):
        """Initialize the live detector with YOLO model and camera stream"""
        self.model = YOLO(model_path)
        self.pose_model = pose_model
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

        cv2.imwrite(str(filepath), frame, [cv2.IMWRITE_JPEG_QUALITY, 90])

        return filename

    def draw_pose(self, frame, keypoints, color=(0, 255, 255)):
        """Draw skeleton on frame given keypoints and color"""
        if keypoints is None:
            return frame

        kp_array = keypoints.xy[0].cpu().numpy()
        kp_conf = keypoints.conf[0].cpu().numpy() if keypoints.conf is not None else None

        # Draw keypoint dots — skip head keypoints (0-4)
        for i, (x, y) in enumerate(kp_array):
            if i < 5:
                continue
            if kp_conf is not None and kp_conf[i] < 0.3:
                continue
            if x > 0 and y > 0:
                cv2.circle(frame, (int(x), int(y)), 4, color, -1)

        # Draw skeleton lines
        for start_idx, end_idx in SKELETON_CONNECTIONS:
            if start_idx >= len(kp_array) or end_idx >= len(kp_array):
                continue

            x1, y1 = kp_array[start_idx]
            x2, y2 = kp_array[end_idx]

            if kp_conf is not None:
                if kp_conf[start_idx] < 0.3 or kp_conf[end_idx] < 0.3:
                    continue

            if x1 > 0 and y1 > 0 and x2 > 0 and y2 > 0:
                cv2.line(frame,
                        (int(x1), int(y1)),
                        (int(x2), int(y2)),
                        color, 2)

        return frame

    def detect_frame(self):
        """Read a frame, run detection, return annotated frame + results"""
        if not self.cap or not self.cap.isOpened():
            return None, None, None

        ret, frame = self.cap.read()
        if not ret:
            return None, None, None

        frame_resized = cv2.resize(frame, (640, 360))

        from database import get_setting

        # Read two separate confidence thresholds
        fall_confidence = float(get_setting('confidence_threshold', '0.75'))
        tracking_confidence = float(get_setting('person_tracking_confidence', '0.45'))

        # Run pose estimation FIRST and collect keypoints
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

        # Run YOLO tracking
        results = self.model.track(
            frame_resized,
            conf=tracking_confidence,
            persist=True,
            verbose=False,
            tracker="bytetrack.yaml",
            iou=0.3,
        )

        # Collect fall bounding boxes
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

        # Match skeletons to fall bounding boxes and draw them
        for keypoints in pose_keypoints:
            kp_array = keypoints.xy[0].cpu().numpy()
            is_fall_skeleton = False

            # Check if this skeleton overlaps with any fall bounding box
            for fall_bbox in fall_bboxes:
                if is_skeleton_inside_bbox(kp_array, fall_bbox, threshold=0.3):
                    is_fall_skeleton = True
                    break

            # Draw red skeleton for falls, yellow for normal
            color = (0, 0, 255) if is_fall_skeleton else (0, 255, 255)
            frame_resized = self.draw_pose(frame_resized, keypoints, color)

        # Now draw bounding boxes and labels on top
        detections = []
        fall_detected_this_frame = False
        saved_image_filename = None

        for box_data in all_boxes:
            x1, y1, x2, y2 = box_data['bbox']
            conf = box_data['conf']
            class_name = box_data['class_name']
            track_id = box_data['track_id']
            is_fall = box_data['is_fall']

            detections.append({
                'bbox': [x1, y1, x2, y2],
                'confidence': conf,
                'class': class_name,
                'track_id': track_id
            })

            if is_fall:
                fall_detected_this_frame = True

            # Draw bounding box
            color = (0, 0, 255) if is_fall else (0, 255, 0)
            cv2.rectangle(frame_resized,
                        (int(x1), int(y1)),
                        (int(x2), int(y2)),
                        color, 2)

            # Build label
            if is_fall:
                label = f"Fall Detected #{track_id}" if track_id else "Fall Detected"
            else:
                label = f"Person #{track_id}" if track_id else "Person"

            cv2.putText(frame_resized, label,
                      (int(x1), int(y1) - 8),
                      cv2.FONT_HERSHEY_SIMPLEX,
                      0.5, color, 2)

        # Save to database only if fall confidence threshold is met
        if fall_detected_this_frame:
            if not self.is_cooldown_active():
                self.last_detection_time = datetime.now()
                saved_image_filename = self.save_detection_image(frame_resized)
                print(f"New fall detected! Image saved: {saved_image_filename}")
            else:
                cooldown_seconds = int(get_setting('cooldown_seconds', '30'))
                time_remaining = cooldown_seconds - (datetime.now() - self.last_detection_time).total_seconds()
                print(f"Cooldown active: {time_remaining:.0f}s remaining")

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