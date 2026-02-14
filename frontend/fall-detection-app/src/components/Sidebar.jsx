import logo from '/logo.png';
import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Video, BarChart3, FileText, Settings, Radio } from 'lucide-react';

function Sidebar() {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Video, label: 'Detection', path: '/detection' },
    { icon: Radio, label: 'Live Detection', path: '/live' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: FileText, label: 'Logs', path: '/logs' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoIcon}>🎥</div>
        <h2 style={styles.logoText}>FallDetect</h2>
      </div>

      {/* Menu Items */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.menuItem,
              ...(isActive ? styles.menuItemActive : {})
            })}
          >
            <item.icon size={20} />
            <span style={styles.menuLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>v1.0.0</p>
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#2c3e50',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
  },
  logo: {
    padding: '30px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    fontSize: '28px',
  },
  logoText: {
    color: '#ffffff',
    margin: 0,
    fontSize: '20px',
    fontWeight: '600',
  },
  nav: {
    flex: 1,
    padding: '20px 0',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    color: '#95a5a6',
    textDecoration: 'none',
    transition: 'all 0.3s',
    borderLeft: '3px solid transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    color: '#3498db',
    borderLeftColor: '#3498db',
  },
  menuLabel: {
    fontSize: '15px',
    fontWeight: '500',
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: '12px',
    margin: 0,
    textAlign: 'center',
  },
};

export default Sidebar;