import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { TrendingUp, AlertTriangle, Clock, Download } from 'lucide-react';
import { api } from '../services/api';

function Analytics() {
  const [summary, setSummary] = useState(null);
  const [fallsPerDay, setFallsPerDay] = useState([]);
  const [fallsByHour, setFallsByHour] = useState([]);
  const [confidenceDist, setConfidenceDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const diffDays = Math.ceil(
        (new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24)
      ) + 1;

      const [summaryRes, perDayRes, byHourRes, confRes] = await Promise.all([
        api.getAnalyticsSummary(),
        api.getFallsPerDay(diffDays),
        api.getFallsByHour(),
        api.getConfidenceDistribution(),
      ]);

      setSummary(summaryRes);

      const filtered = perDayRes.data.filter(d => d.day >= dateFrom && d.day <= dateTo);
      setFallsPerDay(filtered.map(d => ({ day: d.day.slice(5), count: d.count })));
      setFallsByHour(byHourRes.data.map(d => ({
        hour: `${String(d.hour).padStart(2, '0')}:00`,
        count: d.count,
      })));
      setConfidenceDist(confRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
    setLoading(false);
  };

  const handleExportPDF = () => {
    const url = api.getReport(dateFrom, dateTo);
    window.open(url, '_blank');
  };

  const formatLastFall = (ts) => {
    if (!ts) return 'No falls yet';
    const diff = Math.floor((new Date() - new Date(ts)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
        <p style={{ color: '#7f8c8d', fontSize: '16px' }}>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>Fall detection trends and statistics</p>
        </div>
        <button style={styles.exportBtn} onClick={handleExportPDF}>
          <Download size={16} />
          Export PDF Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div style={styles.filterBar}>
        <span style={styles.filterLabel}>Date Range:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={styles.dateInput}
        />
        <span style={styles.filterLabel}>to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          style={styles.dateInput}
        />
        <button style={styles.applyBtn} onClick={fetchAll}>Apply</button>
      </div>

      {/* Summary Cards */}
      <div style={styles.statsGrid}>
        {[
          { label: 'Total Falls', value: summary?.total_falls ?? 0, color: '#3498db', icon: TrendingUp },
          { label: "Today's Falls", value: summary?.today_falls ?? 0, color: '#e74c3c', icon: AlertTriangle },
          { label: 'This Week', value: summary?.week_falls ?? 0, color: '#f39c12', icon: TrendingUp },
          { label: 'Last Fall', value: formatLastFall(summary?.last_fall), color: '#2ecc71', icon: Clock, small: true },
        ].map((stat, i) => (
          <div key={i} style={styles.statCard}>
            <div style={{ ...styles.iconBox, backgroundColor: stat.color }}>
              <stat.icon size={22} color="#fff" />
            </div>
            <div>
              <p style={styles.statLabel}>{stat.label}</p>
              <h2 style={{ ...styles.statValue, fontSize: stat.small ? '18px' : '28px' }}>
                {stat.value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={styles.chartsRow}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Falls Per Day</h3>
          <p style={styles.chartSub}>{dateFrom} → {dateTo}</p>
          {fallsPerDay.length === 0 ? (
            <div style={styles.empty}>No data for selected range</div>
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
          <h3 style={styles.chartTitle}>📈 Falls by Hour of Day</h3>
          <p style={styles.chartSub}>All time — identifies high-risk periods</p>
          {fallsByHour.every(d => d.count === 0) ? (
            <div style={styles.empty}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={fallsByHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
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

      {/* Confidence Distribution */}
      <div style={{ ...styles.chartCard, marginBottom: '30px' }}>
        <h3 style={styles.chartTitle}>🎯 Confidence Distribution</h3>
        <p style={styles.chartSub}>How confident the model was across all detections</p>
        {confidenceDist.length === 0 ? (
          <div style={styles.empty}>No data yet</div>
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

    </div>
  );
}

const styles = {
  container: { width: '100%' },
  header: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '24px',
  },
  title: { fontSize: '28px', fontWeight: '700', color: '#2c3e50', margin: '0 0 6px 0' },
  subtitle: { fontSize: '14px', color: '#7f8c8d', margin: 0 },
  exportBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#2c3e50',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  filterBar: {
    display: 'flex', alignItems: 'center', gap: '12px',
    backgroundColor: '#fff', padding: '16px 20px',
    borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  filterLabel: { fontSize: '14px', color: '#7f8c8d', fontWeight: '500' },
  dateInput: {
    padding: '8px 12px', border: '2px solid #e0e0e0',
    borderRadius: '8px', fontSize: '14px', outline: 'none',
  },
  applyBtn: {
    padding: '8px 20px', backgroundColor: '#3498db',
    color: '#fff', border: 'none', borderRadius: '8px',
    cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  statsGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px', marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#fff', padding: '20px', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex', gap: '16px', alignItems: 'center',
  },
  iconBox: {
    width: '46px', height: '46px', borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  statLabel: { fontSize: '12px', color: '#7f8c8d', margin: '0 0 4px 0' },
  statValue: { fontWeight: '700', color: '#2c3e50', margin: 0 },
  chartsRow: {
    display: 'grid', gridTemplateColumns: '1fr 1fr',
    gap: '24px', marginBottom: '24px',
  },
  chartCard: {
    backgroundColor: '#fff', padding: '24px',
    borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50', margin: '0 0 4px 0' },
  chartSub: { fontSize: '12px', color: '#95a5a6', margin: '0 0 20px 0' },
  empty: {
    height: '220px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#bdc3c7',
    fontSize: '14px', backgroundColor: '#f8f9fa', borderRadius: '8px',
  },
};

export default Analytics;