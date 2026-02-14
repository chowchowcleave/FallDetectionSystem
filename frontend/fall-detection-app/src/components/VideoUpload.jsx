import React, { useState } from 'react';
import { api } from '../services/api';

function VideoUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const result = await api.detectVideo(selectedFile);
      setResults(result);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setUploading(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Fall Detection Model Tester</h1>
        <p style={styles.subtitle}>Upload a video to detect falls</p>
      </div>

      <div style={styles.uploadCard}>
        <input 
          type="file" 
          accept="video/*" 
          onChange={(e) => setSelectedFile(e.target.files[0])} 
          style={styles.fileInput}
        />
        
        {selectedFile && (
          <div style={styles.selectedFile}>
            <p style={styles.fileName}>📄 {selectedFile.name}</p>
            <p style={styles.fileSize}>
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
        
        <button 
          onClick={handleUpload} 
          disabled={!selectedFile || uploading}
          style={{
            ...styles.uploadButton,
            opacity: (!selectedFile || uploading) ? 0.5 : 1,
            cursor: (!selectedFile || uploading) ? 'not-allowed' : 'pointer'
          }}
        >
          {uploading ? '⏳ Processing...' : '🚀 Detect Falls'}
        </button>
      </div>

      {results && (
        <div style={styles.resultsCard}>
          <h2 style={styles.resultsTitle}>✅ Detection Complete!</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Total Frames</p>
              <p style={styles.statValue}>{results.total_frames}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Falls Detected</p>
              <p style={{...styles.statValue, color: '#e74c3c'}}>{results.total_detections}</p>
            </div>
            <div style={styles.statBox}>
              <p style={styles.statLabel}>Detection Rate</p>
              <p style={styles.statValue}>
                {((results.total_detections / results.total_frames) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
          <a 
            href={api.downloadVideo(results.file_id, results.filename)}
            download
            style={styles.downloadButton}
          >
            📥 Download Processed Video
          </a>
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
    width: '100%',
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
  uploadCard: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '30px',
    width: '100%',
  },
  fileInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px dashed #e0e0e0',
    borderRadius: '8px',
    marginBottom: '20px',
    cursor: 'pointer',
  },
  selectedFile: {
    backgroundColor: '#f8f9fa',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
  },
  fileName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    margin: '0 0 4px 0',
  },
  fileSize: {
    fontSize: '12px',
    color: '#7f8c8d',
    margin: 0,
  },
  uploadButton: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#3498db',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
  resultsCard: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    width: '100%',
  },
  resultsTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '24px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px',
    width: '100%',
  },
  statBox: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#7f8c8d',
    margin: '0 0 8px 0',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0,
  },
  downloadButton: {
    display: 'block',
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#2ecc71',
    color: '#ffffff',
    textAlign: 'center',
    textDecoration: 'none',
    borderRadius: '8px',
    transition: 'all 0.3s',
  },
};

export default VideoUpload;