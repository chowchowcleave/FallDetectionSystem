import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, AlertTriangle, Clock, Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { api } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [fallsPerDay, setFallsPerDay] = useState([]);
  const [fallsByHour, setFallsByHour] = useState([]);
  const [confidenceDist, setConfidenceDist] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);
  const sevenDaysAgo = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  })();

  const [dateFrom, setDateFrom] = useState(sevenDaysAgo);
  const [dateTo, setDateTo] = useState(today);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const diffDays = Math.ceil(
        (new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)
      ) + 1;

      const [summaryRes, perDayRes, byHourRes, confRes, recentRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getFallsPerDay(diffDays),
        api.getFallsByHour(),
        api.getConfidenceDistribution(),
        api.getRecentDetections(5),
      ]);

      setSummary(summaryRes);

      const filtered = perDayRes.data.filter(d => d.day >= dateFrom && d.day <= dateTo);
      setFallsPerDay(filtered.map(d => ({ day: d.day.slice(5), count: d.count })));
      setFallsByHour(byHourRes.data.map(d => ({
        hour: String(d.hour).padStart(2, '0') + ':00',
        count: d.count,
      })));
      setConfidenceDist(confRes.data);
      setRecentDetections(recentRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    const url = api.getReport(dateFrom, dateTo);
    window.open(url, '_blank');
  };

  const formatLastFall = (timestamp) => {
    if (!timestamp) return 'No falls yet';
    const diff = Math.floor((new Date() - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff / 60) + 'h ago';
    return Math.floor(diff / 1440) + 'd ago';
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const stats = summary ? [
    { icon: Activity, label: 'Total Falls', value: summary.total_falls, color: '#3498db', sub: 'All time' },
    { icon: AlertTriangle, label: "Today's Falls", value: summary.today_falls, color: '#e74c3c', sub: 'Last 24 hours' },
    { icon: TrendingUp, label: 'This Week', value: summary.week_falls, color: '#f39c12', sub: 'Last 7 days' },
    { icon: Clock, label: 'Last Fall', value: formatLastFall(summary.last_fall), color: '#2ecc71', sub: summary.last_fall ? new Date(summary.last_fall).toLocaleDateString() : '-', small: true },
  ] : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#7f8c8d', fontSize: '16px' }}>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>

      <div style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Dashboard</h1>
          <p style={styles.pageSubtitle}>Fall detection analytics and monitoring</p>
        </div>
        <button style={styles.exportBtn} onClick={handleExportPDF}>
          <Download size={16} />
          Export PDF Report
        </button>
      </div>

      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Date Range:</span>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={styles.dateInput} />
        <span style={styles.filterLabel}>to</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={styles.dateInput} />
        <button style={styles.applyBtn} onClick={fetchAll}>Apply</button>
      </div>

      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: stat.color }}>
              <stat.icon size={24} color="#ffffff" />
            </div>
            <div style={styles.statContent}>
              <p style={styles.statLabel}>{stat.label}</p>
              <h2 style={{ ...styles.statValue, fontSize: stat.small ? '20px' : '28px' }}>{stat.value}</h2>
              <p style={styles.statSub}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Falls Per Day</h3>
          <p style={styles.chartSub}>{dateFrom} to {dateTo}</p>
          {fallsPerDay.length === 0 ? (
            <div style={styles.emptyChart}>No data for selected range</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fallsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#e74c3c" radius={[4, 4, 0, 0]} name="Falls" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>Falls by Hour of Day</h3>
          <p style={styles.chartSub}>All time — identifies high-risk periods</p>
          {fallsByHour.every(d => d.count === 0) ? (
            <div style={styles.emptyChart}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={fallsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3498db" strokeWidth={2} dot={false} name="Falls" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ ...styles.chartCard, marginBottom: '24px' }}>
        <h3 style={styles.chartTitle}>Confidence Distribution</h3>
        <p style={styles.chartSub}>How confident the model was across all detections</p>
        {confidenceDist.length === 0 ? (
          <div style={styles.emptyChart}>No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={confidenceDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#9b59b6" radius={[4, 4, 0, 0]} name="Falls" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div style={styles.activityCard}>
        <h3 style={styles.activityTitle}>Recent Fall Detections</h3>
        {recentDetections.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No detections yet</p>
        ) : (
          <div style={styles.activityList}>
            {recentDetections.map((det) => (
              <div key={det.id} style={styles.activityItem}>
                <div style={styles.activityDot} />
                <div style={styles.activityContent}>
                  <p style={styles.activityText}>
                    Fall detected via <strong>{det.camera_source}</strong> — <span style={{ color: '#e74c3c' }}>{(det.confidence * 100).toFixed(1)}% confidence</span>
                  </p>
                  <p style={styles.activityTime}>{formatTime(det.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: '0 0 6px 0' },
  pageSubtitle: { fontSize: '14px', color: '#7f8c8d', margin: 0 },
  exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#2c3e50', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  filterBar: { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  filterLabel: { fontSize: '14px', color: '#7f8c8d', fontWeight: '500' },
  dateInput: { padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none' },
  applyBtn: { padding: '8px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '24px' },
  statCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', display: 'flex', gap: '16px', alignItems: 'flex-start' },
  iconBox: { width: '50px', height: '50px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statContent: { flex: 1 },
  statLabel: { fontSize: '13px', color: '#7f8c8d', margin: '0 0 4px 0', fontWeight: '500' },
  statValue: { fontWeight: '700', color: '#2c3e50', margin: '0 0 4px 0' },
  statSub: { fontSize: '11px', color: '#95a5a6', margin: 0 },
  chartsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' },
  chartCard: { backgroundColor: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: '0 0 4px 0' },
  chartSub: { fontSize: '12px', color: '#95a5a6', margin: '0 0 20px 0' },
  emptyChart: { height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdc3c7', fontSize: '14px', backgroundColor: '#f8f9fa', borderRadius: '8px' },
  activityCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  activityTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginTop: 0, marginBottom: '20px' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '250px', overflowY: 'auto' },
  activityItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  activityDot: { width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e74c3c', marginTop: '6px', flexShrink: 0 },
  activityContent: { flex: 1 },
  activityText: { fontSize: '14px', color: '#2c3e50', margin: '0 0 4px 0' },
  activityTime: { fontSize: '12px', color: '#7f8c8d', margin: 0 },
};

export default Dashboard;