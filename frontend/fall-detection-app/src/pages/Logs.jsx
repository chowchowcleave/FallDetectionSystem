import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Trash2, AlertCircle, Filter } from 'lucide-react';
import { api } from '../services/api';

function Logs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSource, setFilterSource] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minConfidence, setMinConfidence] = useState(0);

  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs(500);
      setLogs(data.detections);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
    setLoading(false);
  };

  const openImage = (url) => {
    setSelectedImage(url);
    document.body.style.overflow = 'hidden';
  };

  const closeImage = () => {
    setSelectedImage(null);
    document.body.style.overflow = 'unset';
  };

  const handleDeleteAll = async () => {
    try {
      await api.deleteAllLogs();
      setShowDeleteModal(false);
      fetchLogs();
    } catch (error) {
      console.error('Failed to delete logs:', error);
    }
  };

  const handleDeleteSingle = async (id) => {
    setDeletingId(id);
    try {
      await api.deleteLog(id);
      setLogs(prev => prev.filter(log => log.id !== id));
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
    setDeletingId(null);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMinConfidence(0);
    setFilterSource('all');
    setSearchTerm('');
  };

  const hasActiveFilters = dateFrom || dateTo || minConfidence > 0 || filterSource !== 'all' || searchTerm;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          log.detection_type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSource = filterSource === 'all' || log.camera_source === filterSource;
    const matchesConfidence = log.confidence >= minConfidence / 100;
    const logDate = log.timestamp ? log.timestamp.slice(0, 10) : '';
    const matchesDateFrom = !dateFrom || logDate >= dateFrom;
    const matchesDateTo = !dateTo || logDate <= dateTo;
    return matchesSearch && matchesSource && matchesConfidence && matchesDateFrom && matchesDateTo;
  });

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const colSpan = isAdmin ? 6 : 4;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Incident Logs</h1>
          <p style={styles.subtitle}>View all fall detection events with captured images</p>
        </div>
        {isAdmin && (
          <button style={styles.deleteButton} onClick={() => setShowDeleteModal(true)}>
            <Trash2 size={18} />
            Clear All Logs
          </button>
        )}
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
        <button
          style={{
            ...styles.filterButton,
            backgroundColor: showFilters ? '#3498db' : '#ffffff',
            color: showFilters ? '#ffffff' : '#2c3e50',
          }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={16} />
          Filters {hasActiveFilters ? '●' : ''}
        </button>
        {hasActiveFilters && (
          <button style={styles.clearButton} onClick={clearFilters}>Clear</button>
        )}
      </div>

      {showFilters && (
        <div style={styles.filterPanel}>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={styles.dateInput} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={styles.dateInput} />
          </div>
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Min Confidence: <strong>{minConfidence}%</strong></label>
            <input type="range" min="0" max="100" step="5" value={minConfidence} onChange={(e) => setMinConfidence(Number(e.target.value))} style={styles.rangeInput} />
            <div style={styles.rangeLabels}>
              <span>0%</span><span>50%</span><span>100%</span>
            </div>
          </div>
        </div>
      )}

      <div style={styles.statsBar}>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Total in DB</span>
          <span style={styles.statValue}>{logs.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Showing</span>
          <span style={styles.statValue}>{filteredLogs.length}</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statLabel}>Live Camera</span>
          <span style={styles.statValue}>{filteredLogs.filter(l => l.camera_source === 'live').length}</span>
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
                {isAdmin && <th style={styles.th}>Type</th>}
                <th style={styles.th}>Confidence</th>
                <th style={styles.th}>Source</th>
                {isAdmin && <th style={styles.th}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} style={styles.noData}>No logs found</td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} style={styles.tr}>
                    <td style={styles.td}>
                      {log.image_data ? (
                        <img
                          src={api.getImageUrl(log.image_data)}
                          alt="Detection"
                          style={styles.thumbnail}
                          onClick={() => openImage(api.getImageUrl(log.image_data))}
                        />
                      ) : (
                        <div style={styles.noImage}>No Image</div>
                      )}
                    </td>
                    <td style={styles.td}>{formatDate(log.timestamp)}</td>
                    {isAdmin && (
                      <td style={styles.td}>
                        <span style={styles.typeBadge}>{log.detection_type}</span>
                      </td>
                    )}
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
                    {isAdmin && (
                      <td style={styles.td}>
                        <button style={styles.deleteRowButton} onClick={() => setConfirmDeleteId(log.id)}>
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedImage && createPortal(
        <div style={styles.modalOverlay} onClick={closeImage}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <img src={selectedImage} alt="Full size" style={styles.fullImage} />
            <button style={styles.closeButton} onClick={closeImage}><X size={20} /></button>
          </div>
        </div>,
        document.body
      )}

      {isAdmin && showDeleteModal && createPortal(
        <div style={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}><AlertCircle size={48} color="#e74c3c" /></div>
            <h2 style={styles.modalTitle}>Clear All Logs</h2>
            <p style={styles.modalMessage}>Are you sure you want to delete all logs? This cannot be undone.</p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button style={styles.confirmButton} onClick={handleDeleteAll}>Clear All</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isAdmin && confirmDeleteId && createPortal(
        <div style={styles.modalOverlay} onClick={() => setConfirmDeleteId(null)}>
          <div style={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}><AlertCircle size={48} color="#e74c3c" /></div>
            <h2 style={styles.modalTitle}>Delete Log</h2>
            <p style={styles.modalMessage}>Are you sure you want to delete this detection log? This cannot be undone.</p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button
                style={{ ...styles.confirmButton, opacity: deletingId === confirmDeleteId ? 0.5 : 1 }}
                disabled={deletingId === confirmDeleteId}
                onClick={async () => {
                  await handleDeleteSingle(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
              >
                {deletingId === confirmDeleteId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const styles = {
  container: { padding: '30px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  title: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: '0 0 5px 0' },
  subtitle: { fontSize: '14px', color: '#7f8c8d', margin: 0 },
  deleteButton: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  controls: { display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' },
  searchContainer: { position: 'relative', flex: 1 },
  searchIcon: { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#7f8c8d' },
  searchInput: { width: '100%', padding: '12px 15px 12px 45px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
  filterButton: { display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s', whiteSpace: 'nowrap' },
  clearButton: { padding: '12px 16px', border: 'none', borderRadius: '8px', backgroundColor: '#ecf0f1', color: '#7f8c8d', fontSize: '14px', cursor: 'pointer', fontWeight: '600' },
  filterPanel: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '24px' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  filterLabel: { fontSize: '13px', fontWeight: '600', color: '#2c3e50' },
  dateInput: { padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  rangeInput: { width: '100%', cursor: 'pointer', accentColor: '#3498db' },
  rangeLabels: { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#95a5a6' },
  statsBar: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  statCard: { backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', flexDirection: 'column', gap: '8px' },
  statLabel: { fontSize: '13px', color: '#7f8c8d', fontWeight: '500' },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#2c3e50' },
  tableContainer: { backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '15px', textAlign: 'left', backgroundColor: '#f8f9fa', color: '#2c3e50', fontWeight: '600', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #e0e0e0' },
  tr: { borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.2s' },
  td: { padding: '15px', fontSize: '14px', color: '#2c3e50' },
  thumbnail: { width: '80px', height: '60px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', border: '2px solid #e0e0e0' },
  noImage: { width: '80px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f0f0', borderRadius: '6px', fontSize: '11px', color: '#7f8c8d' },
  typeBadge: { padding: '4px 10px', backgroundColor: '#fee', color: '#c33', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  confidenceBadge: { padding: '4px 10px', backgroundColor: '#e8f5e9', color: '#2e7d32', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  sourceBadge: { padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize' },
  deleteRowButton: { display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#fff0f0', color: '#e74c3c', border: '1px solid #fcc', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' },
  loading: { textAlign: 'center', padding: '50px', fontSize: '16px', color: '#7f8c8d' },
  noData: { textAlign: 'center', padding: '50px', color: '#7f8c8d' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, overflow: 'hidden' },
  modalContent: { position: 'relative', maxWidth: '80%', maxHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  closeButton: { position: 'absolute', top: '-15px', right: '-15px', background: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100000, boxShadow: '0 2px 8px rgba(0,0,0,0.4)' },
  fullImage: { maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', display: 'block' },
  confirmModal: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '40px', width: '90%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', textAlign: 'center' },
  modalIcon: { marginBottom: '20px', display: 'flex', justifyContent: 'center' },
  modalTitle: { margin: '0 0 15px 0', fontSize: '24px', fontWeight: '700', color: '#2c3e50' },
  modalMessage: { margin: '0 0 30px 0', fontSize: '16px', color: '#7f8c8d', lineHeight: '1.5' },
  modalButtons: { display: 'flex', gap: '12px', justifyContent: 'center' },
  cancelButton: { padding: '12px 24px', backgroundColor: '#ecf0f1', border: 'none', borderRadius: '8px', color: '#2c3e50', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  confirmButton: { padding: '12px 24px', backgroundColor: '#e74c3c', border: 'none', borderRadius: '8px', color: '#ffffff', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
};

export default Logs;