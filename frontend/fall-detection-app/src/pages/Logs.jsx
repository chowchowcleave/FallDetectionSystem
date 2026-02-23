import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, X, Download, Trash2 } from 'lucide-react';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

 const fetchLogs = async () => {
  try {
    const response = await fetch('http://localhost:8000/logs/list?limit=100');
    const data = await response.json();
    
    setLogs(data.detections);
    setLoading(false);
  } catch (error) {
    console.error('Failed to fetch logs:', error);
    setLoading(false);
  }
};
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.detection_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSource === 'all' || log.camera_source === filterSource;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    return `http://localhost:8000/images/${filename}`;
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete all logs? This cannot be undone.')) {
      try {
        await fetch('http://localhost:8000/logs/delete-all', { method: 'DELETE' });
        fetchLogs();
      } catch (error) {
        console.error('Failed to delete logs:', error);
      }
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Detection Logs</h1>
          <p style={styles.subtitle}>View all fall detection events with captured images</p>
        </div>
        <button style={styles.deleteButton} onClick={handleDeleteAll}>
          <Trash2 size={18} />
          Clear All Logs
        </button>
      </div>

      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Sources</option>
          <option value="live">Live Camera</option>
          <option value="upload">Video Upload</option>
        </select>
      </div>

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total Detections</span>
          <span style={styles.statValue}>{logs.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Live Camera</span>
          <span style={styles.statValue}>
            {logs.filter(l => l.camera_source === 'live').length}
          </span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Video Upload</span>
          <span style={styles.statValue}>
            {logs.filter(l => l.camera_source === 'upload').length}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading logs...</div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Thumbnail</th>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Confidence</th>
                <th style={styles.th}>Source</th>
                <th style={styles.th}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={styles.noData}>
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      {log.image_data ? (
                        <img
                          src={getImageUrl(log.image_data)}
                          alt="Detection"
                          style={styles.thumbnail}
                          onClick={() => setSelectedImage(getImageUrl(log.image_data))}
                        />
                      ) : (
                        <div style={styles.noImage}>No Image</div>
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(log.timestamp)}</td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{log.detection_type}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.confidenceBadge}>
                        {(log.confidence * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.sourceBadge,
                        backgroundColor: log.camera_source === 'live' ? '#e8f5e9' : '#e3f2fd',
                        color: log.camera_source === 'live' ? '#2e7d32' : '#1565c0'
                      }}>
                        {log.camera_source}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.notes}>{log.notes || '-'}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedImage && (
        <div style={styles.modalOverlay} onClick={() => setSelectedImage(null)}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button style={styles.closeButton} onClick={() => setSelectedImage(null)}>
              <X size={24} />
            </button>
            <img src={selectedImage} alt="Full size" style={styles.fullImage} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: '30px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 5px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: 0,
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 20px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
  },
  controls: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
  },
  searchContainer: {
    position: 'relative',
    flex: 1,
  },
  searchIcon: {
    position: 'absolute',
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#7f8c8d',
  },
  searchInput: {
    width: '100%',
    padding: '12px 15px 12px 45px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
  },
  filterSelect: {
    padding: '12px 15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    outline: 'none',
    minWidth: '150px',
  },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    padding: '15px',
    textAlign: 'left',
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
    fontWeight: '600',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '2px solid #e0e0e0',
  },
  tr: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s',
    cursor: 'pointer',
  },
  td: {
    padding: '15px',
    fontSize: '14px',
    color: '#2c3e50',
  },
  thumbnail: {
    width: '80px',
    height: '60px',
    objectFit: 'cover',
    borderRadius: '6px',
    cursor: 'pointer',
    border: '2px solid #e0e0e0',
  },
  noImage: {
    width: '80px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#7f8c8d',
  },
  typeBadge: {
    padding: '4px 10px',
    backgroundColor: '#fee',
    color: '#c33',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  confidenceBadge: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  sourceBadge: {
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  notes: {
    fontSize: '13px',
    color: '#7f8c8d',
  },
  loading: {
    textAlign: 'center',
    padding: '50px',
    fontSize: '16px',
    color: '#7f8c8d',
  },
  noData: {
    textAlign: 'center',
    padding: '50px',
    color: '#7f8c8d',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: '-40px',
    right: '0',
    background: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  fullImage: {
    maxWidth: '100%',
    maxHeight: '90vh',
    borderRadius: '8px',
  },
};

export default Logs;