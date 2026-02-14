import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

function LiveDetection() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [detections, setDetections] = useState([]);
  const [fallCount, setFallCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);

  const startDetection = async () => {
    setLoading(true);
    try {
      const response = await api.startLiveDetection();
      if (response.status === 'success' || response.status === 'already_running') {
        setIsRunning(true);
        startFramePolling();
      } else {
        alert('Failed to start camera: ' + response.message);
      }
    } catch (error) {
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const stopDetection = async () => {
    try {
      await api.stopLiveDetection();
      setIsRunning(false);
      stopFramePolling();
      setCurrentFrame(null);
      setDetections([]);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const startFramePolling = () => {
    intervalRef.current = setInterval(async () => {
      try {
        const data = await api.getLiveFrame();
        setCurrentFrame(data.frame);
        setDetections(data.detections || []);
        
        // Count falls
        const falls = data.detections.filter(d => d.class === 'fall');
        if (falls.length > 0) {
          setFallCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Frame error:', error);
      }
    }, 120); // Adjusted for better quality - ~8 FPS
  };

  const stopFramePolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopFramePolling();
    };
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Live Fall Detection</h1>
        <p style={styles.subtitle}>Real-time monitoring with Tapo C210</p>
      </div>

      {/* Control Buttons */}
      <div style={styles.controls}>
        {!isRunning ? (
          <button 
            onClick={startDetection}
            disabled={loading}
            style={{
              ...styles.button,
              ...styles.startButton,
              opacity: loading ? 0.5 : 1
            }}
          >
            {loading ? '⏳ Connecting...' : '▶️ Start Live Detection'}
          </button>
        ) : (
          <button 
            onClick={stopDetection}
            style={{...styles.button, ...styles.stopButton}}
          >
            ⏹️ Stop Detection
          </button>
        )}
      </div>

      {/* Stats */}
      {isRunning && (
        <div style={styles.statsRow}>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Status</p>
            <p style={{...styles.statValue, color: '#2ecc71'}}>🟢 Live</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Falls Detected</p>
            <p style={{...styles.statValue, color: '#e74c3c'}}>{fallCount}</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Current Detections</p>
            <p style={styles.statValue}>{detections.length}</p>
          </div>
        </div>
      )}

      {/* Video Feed */}
      <div style={styles.videoContainer}>
        {currentFrame ? (
          <img 
            src={`data:image/jpeg;base64,${currentFrame}`}
            alt="Live feed"
            style={styles.video}
          />
        ) : (
          <div style={styles.placeholder}>
            <p style={styles.placeholderText}>
              {isRunning ? 'Loading video feed...' : 'Click Start to begin monitoring'}
            </p>
          </div>
        )}
      </div>

      {/* Detection List */}
      {detections.length > 0 && (
        <div style={styles.detectionList}>
          <h3 style={styles.detectionTitle}>Current Detections:</h3>
          {detections.map((det, idx) => (
            <div 
              key={idx}
              style={{
                ...styles.detectionItem,
                borderLeftColor: det.class === 'fall' ? '#e74c3c' : '#2ecc71'
              }}
            >
              <span style={styles.detectionClass}>
                {det.class === 'fall' ? '⚠️ FALL' : '✅ ' + det.class.toUpperCase()}
              </span>
              <span style={styles.detectionConf}>
                {(det.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  header: {
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: 0,
  },
  controls: {
    marginBottom: '30px',
  },
  button: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  startButton: {
    backgroundColor: '#2ecc71',
    color: '#ffffff',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
    color: '#ffffff',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statBox: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    margin: '0 0 8px 0',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0,
  },
  videoContainer: {
    backgroundColor: '#000000',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '30px',
    minHeight: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: 'auto',
    display: 'block',
  },
  placeholder: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  placeholderText: {
    color: '#7f8c8d',
    fontSize: '18px',
    margin: 0,
  },
  detectionList: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  detectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '16px',
  },
  detectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '4px solid',
    marginBottom: '8px',
  },
  detectionClass: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#2c3e50',
  },
  detectionConf: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
};

export default LiveDetection;