import React from 'react';
import { TrendingUp, Activity, CheckCircle, AlertTriangle } from 'lucide-react';

function Dashboard() {
  const stats = [
    { icon: Activity, label: 'Total Detections', value: '53', color: '#3498db', change: '+12%' },
    { icon: AlertTriangle, label: "Today's Falls", value: '12', color: '#e74c3c', change: '+3' },
    { icon: CheckCircle, label: 'Accuracy', value: '100%', color: '#2ecc71', change: 'Perfect' },
    { icon: TrendingUp, label: 'This Week', value: '38', color: '#f39c12', change: '+8%' },
  ];

return (
  <div style={{ width: '100%', maxWidth: 'none', minWidth: '100%' }}>
      <div style={styles.header}>
        <h1 style={styles.pageTitle}>Dashboard Overview</h1>
        <p style={styles.pageSubtitle}>Real-time fall detection monitoring</p>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <div key={index} style={styles.statCard}>
            <div style={{...styles.iconBox, backgroundColor: stat.color}}>
              <stat.icon size={24} color="#ffffff" />
            </div>
            <div style={styles.statContent}>
              <p style={styles.statLabel}>{stat.label}</p>
              <div style={styles.statBottom}>
                <h2 style={styles.statValue}>{stat.value}</h2>
                <span style={{...styles.statChange, color: stat.color}}>{stat.change}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Placeholder for Charts */}
      <div style={styles.chartsSection}>
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📊 Detection Trends</h3>
          <div style={styles.chartPlaceholder}>
            <p style={styles.placeholderText}>Chart will go here</p>
            <p style={styles.placeholderSubtext}>(We'll add Recharts later)</p>
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Weekly Overview</h3>
          <div style={styles.chartPlaceholder}>
            <p style={styles.placeholderText}>Chart will go here</p>
            <p style={styles.placeholderSubtext}>(We'll add Recharts later)</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.activityCard}>
        <h3 style={styles.activityTitle}>Recent Detections</h3>
        <div style={styles.activityList}>
          <div style={styles.activityItem}>
            <div style={styles.activityDot}></div>
            <div style={styles.activityContent}>
              <p style={styles.activityText}>Fall detected in Camera 1</p>
              <p style={styles.activityTime}>2 minutes ago</p>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityDot}></div>
            <div style={styles.activityContent}>
              <p style={styles.activityText}>Fall detected in Camera 2</p>
              <p style={styles.activityTime}>15 minutes ago</p>
            </div>
          </div>
          <div style={styles.activityItem}>
            <div style={styles.activityDot}></div>
            <div style={styles.activityContent}>
              <p style={styles.activityText}>Fall detected in Camera 1</p>
              <p style={styles.activityTime}>1 hour ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  header: {
    marginBottom: '30px',
    width: '100%',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: '0 0 8px 0',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    margin: 0,
  },
statsGrid: {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '24px',
  marginBottom: '30px',
  width: '100%',
  maxWidth: 'none',
  minWidth: '100%',
},
  statCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    display: 'flex',
    gap: '16px',
  },
  iconBox: {
    width: '50px',
    height: '50px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '13px',
    color: '#7f8c8d',
    margin: '0 0 8px 0',
    fontWeight: '500',
  },
  statBottom: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '10px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0,
  },
  statChange: {
    fontSize: '12px',
    fontWeight: '600',
  },
  chartsSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '30px',
    width: '100%',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '20px',
  },
  chartPlaceholder: {
    height: '200px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px dashed #e0e0e0',
  },
  placeholderText: {
    fontSize: '16px',
    color: '#7f8c8d',
    margin: '0 0 5px 0',
  },
  placeholderSubtext: {
    fontSize: '12px',
    color: '#95a5a6',
    margin: 0,
  },
  activityCard: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    width: '100%',
  },
  activityTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 0,
    marginBottom: '20px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  activityItem: {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
  },
  activityDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    marginTop: '6px',
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: '14px',
    color: '#2c3e50',
    margin: '0 0 4px 0',
  },
  activityTime: {
    fontSize: '12px',
    color: '#7f8c8d',
    margin: 0,
  },
};

export default Dashboard;