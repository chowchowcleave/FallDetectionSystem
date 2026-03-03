import React, { useState, useEffect } from 'react';
import { TrendingUp, Activity, AlertTriangle, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { api } from '../services/api';

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [fallsPerDay, setFallsPerDay] = useState([]);
  const [fallsByHour, setFallsByHour] = useState([]);
  const [recentDetections, setRecentDetections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [summaryRes, perDayRes, byHourRes, recentRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getFallsPerDay(7),
        api.getFallsByHour(),
        api.getRecentDetections(5),
      ]);

      setSummary(summaryRes);
      setFallsPerDay(perDayRes.data.map(d => ({
        day: d.day ? d.day.slice(5) : '',
        count: d.count
      })));
      setFallsByHour(byHourRes.data.map(d => ({
        hour: `${String(d.hour).padStart(2, '0')}:00`,
        count: d.count
      })));
      setRecentDetections(recentRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
    setLoading(false);
  };

  const formatLastFall = (timestamp) => {
    if (!timestamp) return 'No falls yet';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const stats = summary ? [
    {
      icon: Activity,
      label: 'Total Falls',
      value: summary.total_falls,
      color: '#3498db',
      sub: 'All time'
    },
    {
      icon: AlertTriangle,
      label: "Today's Falls",
      value: summary.today_falls,
      color: '#e74c3c',
      sub: 'Last 24 hours'
    },
    {
      icon: TrendingUp,
      label: 'This Week',
      value: summary.week_falls,
      color: '#f39c12',
      sub: 'Last 7 days'
    },
    {
      icon: Clock,
      label: 'Last Fall',
      value: formatLastFall(summary.last_fall),
      color: '#2ecc71',
      sub: summary.last_fall ? new Date(summary.last_fall).toLocaleDateString() : '-',
      small: true
    },
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
        <h1 style={styles.pageTitle}>Dashboard Overview</h1>
        <p style={styles.pageSubtitle}>Real-time fall detection monitoring</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: stat.color }}>
              <stat.icon size={24} color="#ffffff" />
            </div>
            <div style={styles.statContent}>
              <p style={styles.statLabel}>{stat.label}</p>
              <h2 style={{ ...styles.statValue, fontSize: stat.small ? '20px' : '28px' }}>
                {stat.value}
              </h2>
              <p style={styles.statSub}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={styles.chartsSection}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Falls — Last 7 Days</h3>
          {fallsPerDay.length === 0 ? (
            <div style={styles.emptyChart}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fallsPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#e74c3c" radius={[4, 4, 0, 0]} name="Falls" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Falls by Hour of Day</h3>
          {fallsByHour.every(d => d.count === 0) ? (
            <div style={styles.emptyChart}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={fallsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3498db"
                  strokeWidth={2}
                  dot={false}
                  name="Falls"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.activityCard}>
        <h3 style={styles.activityTitle}>Recent Fall Detections</h3>
        {recentDetections.length === 0 ? (
          <p style={{ color: '#7f8c8d', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No detections yet
          </p>
        ) : (
          <div style={styles.activityList}>
            {recentDetections.map((det) => (
              <div key={det.id} style={styles.activityItem}>
                <div style={styles.activityDot} />
                <div style={styles.activityContent}>
                  <p style={styles.activityText}>
                    Fall detected via <strong>{det.camera_source}</strong> —{' '}
                    <span style={{ color: '#e74c3c' }}>
                      {(det.confidence * 100).toFixed(1)}% confidence
                    </span>
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
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: '0 0 8px 0' },
  pageSubtitle: { fontSize: '14px', color: '#7f8c8d', margin: 0 },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '24px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  iconBox: {
    width: '50px',
    height: '50px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  statContent: { flex: 1 },
  statLabel: { fontSize: '13px', color: '#7f8c8d', margin: '0 0 4px 0', fontWeight: '500' },
  statValue: { fontWeight: '700', color: '#2c3e50', margin: '0 0 4px 0' },
  statSub: { fontSize: '11px', color: '#95a5a6', margin: 0 },
  chartsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '30px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginTop: 0, marginBottom: '20px' },
  emptyChart: {
    height: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#bdc3c7',
    fontSize: '14px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  activityTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50', marginTop: 0, marginBottom: '20px' },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxHeight: '250px',
    overflowY: 'auto',
  },
  activityItem: { display: 'flex', gap: '12px', alignItems: 'flex-start' },
  activityDot: {
    width: '10px', height: '10px', borderRadius: '50%',
    backgroundColor: '#e74c3c', marginTop: '6px', flexShrink: 0,
  },
  activityContent: { flex: 1 },
  activityText: { fontSize: '14px', color: '#2c3e50', margin: '0 0 4px 0' },
  activityTime: { fontSize: '12px', color: '#7f8c8d', margin: 0 },
};

export default Dashboard;