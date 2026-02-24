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

        const falls = data.detections.filter(d => d.class === 'fall');
        if (falls.length > 0) {
          setFallCount(prev => prev + 1);
        }
      } catch (error) {
        console.error('Frame error:', error);
      }
    }, 120);
  };

  const stopFramePolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDetections([]);
    setCurrentFrame(null);
  };

  useEffect(() => {
    return () => {
      stopFramePolling();
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      api.stopLiveDetection();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const isFall = (det) => det.class === 'fall';

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

      {/* Stats - always rendered, hidden when not running */}
      <div style={{
        ...styles.statsRow,
        opacity: isRunning ? 1 : 0,
        pointerEvents: isRunning ? 'auto' : 'none',
      }}>
        <div style={styles.statBox}>
          <p style={styles.statLabel}>Status</p>
          <p style={{...styles.statValue, color: '#2ecc71'}}>🟢 Live</p>
        </div>
        <div style={styles.statBox}>
          <p style={styles.statLabel}>Falls Detected</p>
          <p style={{...styles.statValue, color: '#e74c3c'}}>{fallCount}</p>
        </div>
        <div style={styles.statBox}>
          <p style={styles.statLabel}>Persons in Frame</p>
          <p style={styles.statValue}>{detections.length}</p>
        </div>
      </div>

      {/* Video Feed */}
      <div style={styles.videoContainer}>
        {currentFrame && isRunning ? (
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

      {/* Detection List - always rendered, hidden when not running */}
      <div style={{
        ...styles.detectionList,
        opacity: isRunning ? 1 : 0,
        pointerEvents: isRunning ? 'auto' : 'none',
      }}>
        <h3 style={styles.detectionTitle}>Current Detections:</h3>
        {detections.length === 0 ? (
          <p style={styles.noDetections}>No detections</p>
        ) : (
          detections.map((det, idx) => (
            <div
              key={idx}
              style={{
                ...styles.detectionItem,
                borderLeftColor: isFall(det) ? '#e74c3c' : '#2ecc71'
              }}
            >
              <div style={styles.detectionLeft}>
                <span style={styles.detectionClass}>
                  {isFall(det) ? '⚠️ FALL' : '🧍 Person'}
                </span>
                {det.track_id && (
                  <span style={styles.trackId}>#{det.track_id}</span>
                )}
              </div>
              <span style={styles.detectionConf}>
                {(det.confidence * 100).toFixed(1)}%
              </span>
            </div>
          ))
        )}
      </div>
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
    transition: 'opacity 0.3s',
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
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
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
    height: '180px',
    overflowY: 'auto',
    transition: 'opacity 0.3s',
  },
  detectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '16px',
  },
  noDetections: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: 0,
    textAlign: 'center',
    paddingTop: '20px',
  },
  detectionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    borderLeft: '4px solid',
    marginBottom: '8px',
  },
  detectionLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  detectionClass: {
    fontWeight: '600',
    fontSize: '14px',
    color: '#2c3e50',
  },
  trackId: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3498db',
    backgroundColor: '#ebf5fb',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  detectionConf: {
    fontSize: '14px',
    color: '#7f8c8d',
  },
};

export default LiveDetection;