from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse, Response
from ultralytics import YOLO
from pathlib import Path
from dotenv import load_dotenv
import cv2
import shutil
import uuid
from datetime import datetime
import os

# Load .env file
load_dotenv()

from live_detection import LiveDetector
from database import save_detection, get_all_detections, get_detection_stats, delete_all_detections, create_user, verify_user, get_all_users, delete_user, get_all_settings, get_settings_by_category, update_setting, change_password, get_falls_per_day, get_falls_by_hour, get_falls_in_range, get_today_falls, get_week_falls, get_last_fall, get_confidence_distribution, get_recent_detections, delete_detection
from report_generator import generate_report

# Initialize FastAPI app
app = FastAPI(title="Fall Detection API", version="1.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model paths from .env
MODEL_PATH = os.getenv("MODEL_PATH")
POSE_MODEL_PATH = os.getenv("POSE_MODEL_PATH")

model = YOLO(MODEL_PATH)
pose_model = YOLO(POSE_MODEL_PATH)

print(f"Model loaded from: {MODEL_PATH}")
print(f"Pose model loaded from: {POSE_MODEL_PATH}")

# Directories
UPLOAD_DIR = Path(__file__).parent / "uploads"
OUTPUT_DIR = Path(__file__).parent / "outputs"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# Live detection setup
from database import get_setting

def get_camera_url():
    """Get camera URL from settings, fallback to .env"""
    return get_setting('camera_url', os.getenv('CAMERA_URL', ''))

def get_confidence():
    """Get confidence threshold from settings"""
    return float(get_setting('confidence_threshold', '0.75'))

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
            "auth_users": "/auth/users",
            "settings": "/settings",
            "settings_update": "/settings/update"
        }
    }

# Health check
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": True,
        "pose_model_loaded": True,
        "timestamp": datetime.now().isoformat()
    }

# Model info endpoint
@app.get("/model/info")
def model_info():
    return {
        "model_path": MODEL_PATH,
        "pose_model_path": POSE_MODEL_PATH,
        "model_type": "YOLOv8",
        "classes": model.names,
        "input_size": 640
    }

# Video detection endpoint
@app.post("/detect/video")
async def detect_video(file: UploadFile = File(...)):
    try:
        if not file.filename.endswith(('.mp4', '.avi', '.mov', '.mkv')):
            raise HTTPException(status_code=400, detail="Invalid file format. Use mp4, avi, mov, or mkv")
        
        file_id = str(uuid.uuid4())[:8]
        input_filename = f"{file_id}_{file.filename}"
        input_path = UPLOAD_DIR / input_filename
        
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        print(f"Processing: {input_filename}")
        
        confidence = get_confidence()
        results = model(
            source=str(input_path),
            conf=confidence,
            save=True,
            project=str(OUTPUT_DIR),
            name=file_id,
            exist_ok=True
        )
        
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
                    
                    if 'fall' in detection_class.lower():
                        save_detection(
                            detection_type='fall',
                            confidence=confidence,
                            camera_source='upload',
                            notes=f"Video: {file.filename}, Frame: {i}"
                        )
                        print(f"Fall saved to database from video! Frame {i}, Confidence: {confidence:.2f}")
        
        output_dir = OUTPUT_DIR / file_id
        saved_files = list(output_dir.glob(f"{file_id}_*"))
        actual_filename = saved_files[0].name if saved_files else input_filename
        
        print(f"Saved as: {actual_filename}")
        
        response = {
            "success": True,
            "file_id": file_id,
            "filename": actual_filename,
            "total_frames": len(results),
            "total_detections": total_detections,
            "detections": detections_by_frame[:10],
            "output_video": str(OUTPUT_DIR / file_id / actual_filename),
            "timestamp": datetime.now().isoformat()
        }
        
        print(f"Processed: {total_detections} detections found")
        return JSONResponse(content=response)
    
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

# Download processed video
@app.get("/download/{file_id}/{filename}")
def download_video(file_id: str, filename: str):
    video_path = OUTPUT_DIR / file_id / filename
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
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
    global live_detector
    
    if live_detector and live_detector.is_running:
        return {"status": "already_running"}
    
    camera_url = get_camera_url()
    live_detector = LiveDetector(MODEL_PATH, camera_url, pose_model)
    
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
    global live_detector
    
    if live_detector:
        live_detector.stop()
        live_detector = None
        return {"status": "stopped"}
    
    return {"status": "not_running"}

@app.get("/live/frame")
def get_live_frame():
    global live_detector
    
    if not live_detector or not live_detector.is_running:
        raise HTTPException(status_code=400, detail="Live detection not running")
    
    frame_b64, detections, saved_image = live_detector.detect_frame()
    
    if frame_b64 is None:
        raise HTTPException(status_code=500, detail="Failed to read frame")
    
    if saved_image:
        for detection in detections:
            if 'fall' in detection['class'].lower():
                print(f"Saving fall with image: {saved_image}")
                save_detection(
                    detection_type='fall',
                    confidence=detection['confidence'],
                    camera_source='live',
                    image_data=saved_image,
                    notes=f"Bounding box: {detection['bbox']}"
                )
                print(f"Fall saved to database with image!")
                break
    
    return {
        "frame": frame_b64,
        "detections": detections,
        "timestamp": datetime.now().isoformat()
    }
    
@app.get("/live/stream-url")
def get_stream_url():
    camera_url = get_camera_url()
    return {
        "rtsp_url": camera_url,
        "status": "success"
    }

# ==================== DATABASE/LOGS ENDPOINTS ====================

@app.get("/logs/list")
def list_detections(limit: int = 100):
    detections = get_all_detections(limit=limit)
    return {
        "detections": detections,
        "count": len(detections)
    }

@app.get("/logs/stats")
def get_stats():
    stats = get_detection_stats()
    return stats

@app.post("/logs/save")
def manual_save_detection(
    detection_type: str,
    confidence: float,
    camera_source: str = "manual",
    notes: str = None
):
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
    delete_all_detections()
    return {
        "success": True,
        "message": "All detections deleted from database"
    }

@app.delete("/logs/delete/{detection_id}")
def delete_single_log(detection_id: int):
    delete_detection(detection_id)
    return {"success": True, "message": f"Detection {detection_id} deleted"}

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.post("/auth/login")
def login(username: str, password: str):
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
    users = get_all_users()
    return {
        "users": users,
        "count": len(users)
    }

@app.delete("/auth/users/{user_id}")
def remove_user(user_id: int):
    delete_user(user_id)
    return {
        "success": True,
        "message": f"User {user_id} deleted"
    }

@app.post("/auth/change-password")
def change_user_password(username: str, current_password: str, new_password: str):
    if change_password(username, current_password, new_password):
        return {
            "success": True,
            "message": "Password changed successfully"
        }
    else:
        raise HTTPException(status_code=401, detail="Current password is incorrect")

# ==================== SETTINGS ENDPOINTS ====================

@app.get("/settings")
def get_settings():
    settings = get_settings_by_category()
    return {
        "success": True,
        "settings": settings
    }

@app.get("/settings/raw")
def get_raw_settings():
    settings = get_all_settings()
    return {
        "success": True,
        "settings": settings
    }

@app.post("/settings/update")
def update_settings(settings: dict):
    try:
        updated_count = 0
        
        for key, value in settings.items():
            if isinstance(value, bool):
                value = 'true' if value else 'false'
            elif isinstance(value, (int, float)):
                value = str(value)
            
            if update_setting(key, value):
                updated_count += 1
        
        return {
            "success": True,
            "message": f"Updated {updated_count} settings",
            "updated_count": updated_count
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update settings: {str(e)}")

@app.post("/settings/{key}")
def update_single_setting(key: str, value: str):
    if update_setting(key, value):
        return {
            "success": True,
            "message": f"Setting '{key}' updated",
            "key": key,
            "value": value
        }
    else:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")

@app.get("/images/{filename}")
def get_image(filename: str):
    image_path = Path(__file__).parent / "images" / filename
    
    if not image_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")
    
    return FileResponse(path=str(image_path), media_type="image/jpeg")

# ==================== ANALYTICS ENDPOINTS ====================

@app.get("/analytics/summary")
def get_analytics_summary():
    stats = get_detection_stats()
    return {
        "total_falls": stats['total_falls'],
        "today_falls": get_today_falls(),
        "week_falls": get_week_falls(),
        "last_fall": get_last_fall(),
        "recent_24h": stats['recent_24h'],
    }

@app.get("/analytics/falls-per-day")
def falls_per_day(days: int = 7):
    return {"data": get_falls_per_day(days)}

@app.get("/analytics/falls-by-hour")
def falls_by_hour():
    return {"data": get_falls_by_hour()}

@app.get("/analytics/confidence-distribution")
def confidence_distribution():
    return {"data": get_confidence_distribution()}

@app.get("/analytics/recent")
def recent_detections(limit: int = 5):
    return {"data": get_recent_detections(limit)}

@app.get("/analytics/range")
def falls_in_range(date_from: str, date_to: str):
    data = get_falls_in_range(date_from, date_to)
    return {"data": data, "count": len(data)}

@app.get("/analytics/report")
def generate_analytics_report(date_from: str, date_to: str):
    stats = get_detection_stats()
    last_fall = get_last_fall()

    last_fall_fmt = 'None'
    if last_fall:
        try:
            last_fall_fmt = datetime.fromisoformat(last_fall).strftime('%b %d, %Y')
        except:
            last_fall_fmt = last_fall

    summary = {
        'total_falls': stats['total_falls'],
        'today_falls': get_today_falls(),
        'week_falls': get_week_falls(),
        'last_fall_fmt': last_fall_fmt,
    }

    diff_days = (datetime.fromisoformat(date_to) - datetime.fromisoformat(date_from)).days + 1
    all_per_day = get_falls_per_day(diff_days)
    falls_per_day_data = [d for d in all_per_day if d['day'] >= date_from and d['day'] <= date_to]

    detections = get_falls_in_range(date_from, date_to)
    org_name = get_setting('organization_name', 'CAIRE Healthcare')

    pdf_bytes = generate_report(date_from, date_to, summary, falls_per_day_data, detections, org_name)

    return Response(
        content=bytes(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=CAIRE_Report_{date_from}_{date_to}.pdf"
        }
    )

# Run with: uvicorn app:app --reload --host 0.0.0.0 --port 8000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)