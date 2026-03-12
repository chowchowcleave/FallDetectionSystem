import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {
    console.warn('Audio not available:', e);
  }
}

function FallToast({ trackId, confidence, onClose, onClick }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return ReactDOM.createPortal(
    <div style={{ ...toastStyles.toast, cursor: 'pointer' }} onClick={onClick}>
      <div style={toastStyles.icon}>⚠️</div>
      <div style={toastStyles.body}>
        <p style={toastStyles.title}>Fall Detected!</p>
        <p style={toastStyles.sub}>
          Person #{trackId} · {(confidence * 100).toFixed(1)}% confidence
        </p>
      </div>
      <button style={toastStyles.close} onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
    </div>,
    document.body
  );
}

const toastStyles = {
  toast: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    backgroundColor: '#e74c3c',
    color: '#fff',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 6px 24px rgba(231,76,60,0.4)',
    zIndex: 99999,
    minWidth: '280px',
    animation: 'slideIn 0.3s ease-out',
  },
  icon: { fontSize: '24px', flexShrink: 0 },
  body: { flex: 1 },
  title: { margin: 0, fontWeight: '700', fontSize: '15px' },
  sub: { margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 },
  close: {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 4px',
    opacity: 0.8,
    flexShrink: 0,
  },
};

function LiveDetection() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const [detections, setDetections] = useState([]);
  const [fallCount, setFallCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef(null);
  const activeFallIds = useRef(new Set());
  const navigate = useNavigate();
  const { addNotification, activeToast, dismissToast } = useNotifications();

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

        const falls = data.detections.filter(d => d.class?.toLowerCase().includes('fall'));
        falls.forEach(fall => {
          const id = fall.track_id ?? 'unknown';
          if (!activeFallIds.current.has(id)) {
            activeFallIds.current.add(id);
            setFallCount(prev => prev + 1);
            addNotification(id, fall.confidence);
            playAlertSound();
          }
        });
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
    setFallCount(0);
    activeFallIds.current = new Set();
  };

  useEffect(() => {
    return () => stopFramePolling();
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => api.stopLiveDetection();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {activeToast && (
        <FallToast
          trackId={activeToast.trackId}
          confidence={activeToast.confidence}
          onClose={dismissToast}
          onClick={() => { dismissToast(); navigate('/live'); }}
        />
      )}

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Live Fall Detection</h1>
          <p style={styles.subtitle}>Real-time Monitoring</p>
        </div>

        <div style={styles.controls}>
          {!isRunning ? (
            <button
              onClick={startDetection}
              disabled={loading}
              style={{ ...styles.button, ...styles.startButton, opacity: loading ? 0.5 : 1 }}
            >
              {loading ? '⏳ Connecting...' : '▶️ Start Live Detection'}
            </button>
          ) : (
            <button onClick={stopDetection} style={{ ...styles.button, ...styles.stopButton }}>
              ⏹️ Stop Detection
            </button>
          )}
        </div>

        <div style={{
          ...styles.statsRow,
          opacity: isRunning ? 1 : 0,
          pointerEvents: isRunning ? 'auto' : 'none',
        }}>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Status</p>
            <p style={{ ...styles.statValue, color: '#2ecc71' }}>🟢 Live</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Falls Detected</p>
            <p style={{ ...styles.statValue, color: '#e74c3c' }}>{fallCount}</p>
          </div>
          <div style={styles.statBox}>
            <p style={styles.statLabel}>Falls in Frame</p>
            <p style={styles.statValue}>{detections.length}</p>
          </div>
        </div>

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
              <div key={idx} style={{ ...styles.detectionItem, borderLeftColor: '#e74c3c' }}>
                <div style={styles.detectionLeft}>
                  <span style={styles.detectionClass}>⚠️ Fall Detected</span>
                  {det.track_id && <span style={styles.trackId}>#{det.track_id}</span>}
                </div>
                <span style={styles.detectionConf}>{(det.confidence * 100).toFixed(1)}%</span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

const styles = {
  container: { width: '100%' },
  header: { marginBottom: '30px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: '0 0 8px 0' },
  subtitle: { fontSize: '14px', color: '#7f8c8d', margin: 0 },
  controls: { marginBottom: '30px' },
  button: {
    padding: '16px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  startButton: { backgroundColor: '#2ecc71', color: '#ffffff' },
  stopButton: { backgroundColor: '#e74c3c', color: '#ffffff' },
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
  statLabel: { fontSize: '12px', color: '#7f8c8d', margin: '0 0 8px 0' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: 0 },
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
  video: { width: '100%', height: '100%', objectFit: 'contain', display: 'block' },
  placeholder: { textAlign: 'center', padding: '60px 20px' },
  placeholderText: { color: '#7f8c8d', fontSize: '18px', margin: 0 },
  detectionList: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    height: '180px',
    overflowY: 'auto',
    transition: 'opacity 0.3s',
  },
  detectionTitle: { fontSize: '18px', fontWeight: '600', color: '#2c3e50', marginTop: 0, marginBottom: '16px' },
  noDetections: { fontSize: '14px', color: '#7f8c8d', margin: 0, textAlign: 'center', paddingTop: '20px' },
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
  detectionLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
  detectionClass: { fontWeight: '600', fontSize: '14px', color: '#2c3e50' },
  trackId: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#3498db',
    backgroundColor: '#ebf5fb',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  detectionConf: { fontSize: '14px', color: '#7f8c8d' },
};

export default LiveDetection;