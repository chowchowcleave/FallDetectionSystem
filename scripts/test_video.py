from ultralytics import YOLO
from pathlib import Path
import cv2

print("="*60)
print("🚀 FALL DETECTION VIDEO TESTING")
print("="*60)

# Load your trained model
model_path = r"C:\FallDetection\models\best.pt"
print(f"\n📦 Loading model from: {model_path}")
model = YOLO(model_path)
print("✅ Model loaded successfully!")

# Get video files
video_folder = Path(r"C:\FallDetection\test_videos")
video_files = list(video_folder.glob("*.mp4")) + list(video_folder.glob("*.avi"))

if not video_files:
    print("❌ No video files found in test_videos folder!")
    exit()

print(f"\n🎥 Found {len(video_files)} video(s) to test")
print("="*60)

# Process each video
for i, video_path in enumerate(video_files, 1):
    print(f"\n📹 Processing video {i}/{len(video_files)}: {video_path.name}")
    
    # Run detection on video
    results = model(
        source=str(video_path),
        conf=0.5,  # 50% confidence threshold
        save=True,  # Save output video
        project=r"C:\FallDetection\scripts\results",
        name=f"video_{i}",
        exist_ok=True
    )
    
    # Count detections
    total_detections = 0
    for r in results:
        total_detections += len(r.boxes)
    
    print(f"   ✅ Complete! Total fall detections: {total_detections}")
    print(f"   💾 Output saved to: C:\\FallDetection\\scripts\\results\\video_{i}")

print("\n" + "="*60)
print("✅ ALL VIDEOS PROCESSED!")
print(f"📂 Check output videos in: C:\\FallDetection\\scripts\\results\\")
print("="*60)