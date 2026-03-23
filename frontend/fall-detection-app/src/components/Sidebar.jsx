import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Radio, Users } from 'lucide-react';
import caireLogo from '../assets/caire.png';

function Sidebar() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isAdmin = user?.role === 'admin';

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', adminOnly: true },
    { icon: Radio, label: 'Live Detection', path: '/live', adminOnly: false },
    { icon: FileText, label: 'Incident Logs', path: '/logs', adminOnly: false },
    { icon: Users, label: 'Manage Users', path: '/manage-users', adminOnly: true },
    { icon: Settings, label: 'Settings', path: '/settings', adminOnly: true },
  ];

  const menuItems = allMenuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <div style={styles.sidebar}>
      {/* Logo */}
      <div style={styles.logo}>
        <img src={caireLogo} alt="CAIRE Logo" style={styles.logoIcon} />
        <h2 style={styles.logoText}>CAIRE</h2>
      </div>

      {/* User Profile Card */}
      {user && (
        <div style={styles.profileCard}>
          <div style={styles.avatar}>
            {user.username?.charAt(0).toUpperCase()}
          </div>
          <p style={styles.userName}>{user.username}</p>
          <span style={styles.roleBadge}>
            {user.role === 'admin' ? 'Administrator' : 'Caregiver'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.menuItem,
              ...(isActive ? styles.menuItemActive : styles.menuItemInactive)
            })}
          >
            <item.icon size={20} />
            <span style={styles.menuLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={styles.footer}>
        <p style={styles.footerText}>CAIRE v1.0.0</p>
        <p style={styles.footerSubtext}>Fall Detection System</p>
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
    padding: '24px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  logoIcon: {
    height: '48px',
    width: '48px',
    objectFit: 'contain',
  },
  logoText: {
    color: '#ffffff',
    margin: 0,
    fontSize: '28px',
    fontWeight: '700',
    letterSpacing: '0.5px',
  },
  profileCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  avatar: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontWeight: '700',
    fontSize: '24px',
    marginBottom: '12px',
    boxShadow: '0 4px 12px rgba(52, 152, 219, 0.4)',
  },
  userName: {
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    margin: '0 0 8px 0',
    textAlign: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    color: '#3498db',
    border: '1px solid rgba(52, 152, 219, 0.4)',
    borderRadius: '20px',
    padding: '3px 12px',
    fontSize: '12px',
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
  menuItemInactive: {
    borderLeftColor: 'transparent',
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
    color: '#ffffff',
    fontSize: '13px',
    margin: '0 0 4px 0',
    textAlign: 'center',
    fontWeight: '600',
  },
  footerSubtext: {
    color: '#7f8c8d',
    fontSize: '11px',
    margin: 0,
    textAlign: 'center',
  },
};

export default Sidebar;