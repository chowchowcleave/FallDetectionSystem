from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from ultralytics import YOLO
from pathlib import Path
import cv2
import shutil
import uuid
from datetime import datetime
import os
from live_detection import LiveDetector
from database import save_detection, get_all_detections, get_detection_stats, delete_all_detections, create_user, verify_user, get_all_users, delete_user

# Initialize FastAPI app
app = FastAPI(title="Fall Detection API", version="1.0")

# CORS middleware (allows React frontend to connect)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model (do this once at startup)
MODEL_PATH = r"C:\Users\user\Desktop\FallDetection\models\best.pt"
model = YOLO(MODEL_PATH)
print(f"✅ Model loaded from: {MODEL_PATH}")

# Directories
UPLOAD_DIR = Path(r"C:\Users\user\Desktop\FallDetection\backend\uploads")
OUTPUT_DIR = Path(r"C:\Users\user\Desktop\FallDetection\backend\outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Live detection setup
RTSP_URL = "rtsp://chamsroom:admin123@192.168.101.13:554/stream1"
live_detector = None

# Root endpoint
@app.get("/")
def read_root():
    return {
        "message": "Fall Detection API is running!",
        "version": "1.0",
        "endpoints": {
            "health": "/health",
            "detect_video": "/detect/video",
            "model_info": "/model/info",
            "live_start": "/live/start",
            "live_stop": "/live/stop",
            "live_frame": "/live/frame",
            "stream_url": "/live/stream-url",
            "logs_list": "/logs/list",
            "logs_stats": "/logs/stats",
            "logs_delete_all": "/logs/delete-all",
            "auth_login": "/auth/login",
            "auth_register": "/auth/register",
            "auth_users": "/auth/users"
        }
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "timestamp": datetime.now().isoformat()
    }

# Model info endpoint
@app.get("/model/info")
def model_info():
    return {
        "model_path": MODEL_PATH,
        "model_type": "YOLOv8",
        "classes": model.names,
        "input_size": 640
    }

# Video detection endpoint
@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    """
    Upload a video file and get fall detection results
    """
    try:
        # Validate file type
        if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file format. Use mp4, avi, mov, or mkv")
        
        # Generate unique filename
        file_id = str(uuid.uuid4())[:8]
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename
        
        # Save uploaded file
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"📥 Processing: {input_filename}")
        
        # Run detection
        results = model(
            source=str(input_path),
            conf=0.5,  # Confidence threshold
            save=True,
            project=str(OUTPUT_DIR),
            name=file_id,
            exist_ok=True
        )
        
        # Count detections
        total_detections = 0
        detections_by_frame = []
        
        for i, r in enumerate(results):
            frame_detections = len(r.boxes)
            total_detections += frame_detections
            
            if frame_detections > 0:
                for box in r.boxes:
                    detection_class = model.names[int(box.cls[0])]
                    confidence = float(box.conf[0])
                    
                    detections_by_frame.append({
                        "frame": i,
                        "confidence": confidence,
                        "class": detection_class,
                        "bbox": box.xyxy[0].tolist()
                    })
                    
                    # 🆕 AUTO-SAVE FALLS TO DATABASE FROM VIDEO UPLOAD!
                    if 'fall' in detection_class.lower():
                        save_detection(
                            detection_type='fall',
                            confidence=confidence,
                            camera_source='upload',
                            notes=f"Video: {file.filename}, Frame: {i}"
                        )
                        print(f"💾 Fall saved to database from video! Frame {i}, Confidence: {confidence:.2f}")
        
        # Check what file YOLO actually saved (it might be .avi instead of .mp4)
        output_dir = OUTPUT_DIR / file_id
        saved_files = list(output_dir.glob(f"{file_id}_*"))
        actual_filename = saved_files[0].name if saved_files else input_filename
        
        print(f"📹 Saved as: {actual_filename}")
        
        response = {
            "success": True,
            "file_id": file_id,
            "filename": actual_filename,  # Return the actual saved filename
            "total_frames": len(results),
            "total_detections": total_detections,
            "detections": detections_by_frame[:10],
            "output_video": str(OUTPUT_DIR / file_id / actual_filename),
            "timestamp": datetime.now().isoformat()
        }
        
        # Clean up input file (optional)
        # os.remove(input_path)
        
        print(f"✅ Processed: {total_detections} detections found")
        return JSONResponse(content=response)
    
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Download processed video
@app.get("/download/{file_id}/{filename}")
def download_video(file_id: str, filename: str):
    """
    Download the processed video with bounding boxes
    """
    video_path = OUTPUT_DIR / file_id / filename
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Detect media type based on file extension
    if filename.endswith('.avi'):
        media_type = "video/x-msvideo"
    elif filename.endswith('.mov'):
        media_type = "video/quicktime"
    elif filename.endswith('.mkv'):
        media_type = "video/x-matroska"
    else:
        media_type = "video/mp4"
    
    return FileResponse(
        path=str(video_path),
        filename=f"detected_{filename}",
        media_type=media_type
    )

# ==================== LIVE DETECTION ENDPOINTS ====================

@app.get("/live/start")
def start_live_detection():
    """Start live detection from Tapo camera"""
    global live_detector
    
    if live_detector and live_detector.is_running:
        return {"status": "already_running"}
    
    live_detector = LiveDetector(MODEL_PATH, RTSP_URL)
    
    if live_detector.connect_camera():
        return {
            "status": "success",
            "message": "Live detection started"
        }
    else:
        return {
            "status": "error",
            "message": "Failed to connect to camera"
        }

@app.get("/live/stop")
def stop_live_detection():
    """Stop live detection"""
    global live_detector
    
    if live_detector:
        live_detector.stop()
        live_detector = None
        return {"status": "stopped"}
    
    return {"status": "not_running"}

@app.get("/live/frame")
def get_live_frame():
    """Get current frame with detections"""
    global live_detector
    
    if not live_detector or not live_detector.is_running:
        raise HTTPException(status_code=400, detail="Live detection not running")
    
    frame_b64, detections = live_detector.detect_frame()
    
    if frame_b64 is None:
        raise HTTPException(status_code=500, detail="Failed to read frame")
    
    # 🆕 AUTO-SAVE FALLS TO DATABASE FROM LIVE DETECTION!
    print(f"🔍 DEBUG: Got {len(detections)} detections")
    for detection in detections:
        print(f"🔍 DEBUG: Detection class = '{detection['class']}'")
        # FIXED: Check if 'fall' is in the class name (case-insensitive)
        if 'fall' in detection['class'].lower():
            print(f"🔍 DEBUG: Saving fall with confidence {detection['confidence']}")
            save_detection(
                detection_type='fall',
                confidence=detection['confidence'],
                camera_source='live',
                notes=f"Bounding box: {detection['bbox']}"
            )
            print(f"💾 Fall saved to database! Confidence: {detection['confidence']:.2f}")
        else:
            print(f"🔍 DEBUG: Skipping '{detection['class']}' - not a fall")
    
    return {
        "frame": frame_b64,
        "detections": detections,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/live/stream-url")
def get_stream_url():
    """Get RTSP stream URL for direct video playback"""
    return {
        "rtsp_url": RTSP_URL,
        "status": "success"
    }

# ==================== DATABASE/LOGS ENDPOINTS ====================

@app.get("/logs/list")
def list_detections(limit: int = 100):
    """Get list of all detections"""
    detections = get_all_detections(limit=limit)
    return {
        "detections": detections,
        "count": len(detections)
    }

@app.get("/logs/stats")
def get_stats():
    """Get detection statistics for analytics"""
    stats = get_detection_stats()
    return stats

@app.post("/logs/save")
def manual_save_detection(
    detection_type: str,
    confidence: float,
    camera_source: str = "manual",
    notes: str = None
):
    """Manually save a detection (for testing)"""
    detection_id = save_detection(
        detection_type=detection_type,
        confidence=confidence,
        camera_source=camera_source,
        notes=notes
    )
    return {
        "success": True,
        "detection_id": detection_id,
        "message": "Detection saved"
    }

@app.delete("/logs/delete-all")
def delete_all():
    """Delete all detections from database (for testing/reset)"""
    delete_all_detections()
    return {
        "success": True,
        "message": "All detections deleted from database"
    }

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/login")
def login(username: str, password: str):
    """Login endpoint - verify credentials"""
    user = verify_user(username, password)
    
    if user:
        return {
            "success": True,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "role": user['role']
            },
            "message": "Login successful"
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid username or password")

@app.post("/auth/register")
def register(username: str, password: str, role: str = "user"):
    """Register new user endpoint"""
    # Check if username already exists
    user_id = create_user(username, password, role)
    if user_id:
        return {
            "success": True,
            "message": f"User '{username}' created successfully",
            "user_id": user_id
        }
    else:
        raise HTTPException(status_code=400, detail="Username already exists")

@app.get("/auth/users")
def list_users():
    """Get all users (admin only in production)"""
    users = get_all_users()
    return {
        "users": users,
        "count": len(users)
    }

@app.delete("/auth/users/{user_id}")
def remove_user(user_id: int):
    """Delete a user (admin only in production)"""
    delete_user(user_id)
    return {
        "success": True,
        "message": f"User {user_id} deleted"
    }

# Run with: uvicorn app:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)