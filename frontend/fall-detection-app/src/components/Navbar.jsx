import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, AlertCircle } from 'lucide-react';
import caireLogo from '../assets/caire.png';

function Navbar() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Get user info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.left}>
          {/* Logo and Title */}
          <img 
            src={caireLogo} 
            alt="CAIRE Logo" 
            style={styles.logo}
          />
          <h1 style={styles.title}>CAIRE</h1>
          <span style={styles.subtitle}>Fall Detection System</span>
        </div>

        <div style={styles.right}>
          {/* Notifications */}
          <button style={styles.iconButton}>
            <Bell size={20} />
            <span style={styles.badge}>3</span>
          </button>

          {/* User Menu */}
          <div style={styles.userSection}>
            <div style={styles.avatar}>
              <User size={18} />
            </div>
            <div style={styles.userInfo}>
              <p style={styles.userName}>{user.username || 'Admin User'}</p>
              <p style={styles.userRole}>{user.role === 'admin' ? 'Administrator' : 'User'}</p>
            </div>
          </div>

          {/* Logout */}
          <button style={styles.logoutButton} onClick={handleLogoutClick}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay} onClick={handleCancelLogout}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <AlertCircle size={48} color="#e74c3c" />
            </div>
            <h2 style={styles.modalTitle}>Confirm Logout</h2>
            <p style={styles.modalMessage}>Are you sure you want to log out?</p>
            
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={handleCancelLogout}>
                Cancel
              </button>
              <button style={styles.confirmButton} onClick={handleConfirmLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  navbar: {
    height: '70px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logo: {
    height: '40px',
    width: '40px',
    objectFit: 'contain',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7f8c8d',
    fontWeight: '400',
    marginLeft: '8px',
    paddingLeft: '12px',
    borderLeft: '2px solid #e0e0e0',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  iconButton: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '8px',
    color: '#7f8c8d',
    transition: 'all 0.3s',
  },
  badge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    backgroundColor: '#e74c3c',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 5px',
    borderRadius: '10px',
    minWidth: '16px',
    textAlign: 'center',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  avatar: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#3498db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    margin: 0,
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
  },
  userRole: {
    margin: 0,
    fontSize: '12px',
    color: '#7f8c8d',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #e74c3c',
    borderRadius: '8px',
    color: '#e74c3c',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s',
  },
  
  // Modal Styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '90%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
  modalIcon: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'center',
  },
  modalTitle: {
    margin: '0 0 15px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  modalMessage: {
    margin: '0 0 30px 0',
    fontSize: '16px',
    color: '#7f8c8d',
    lineHeight: '1.5',
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  cancelButton: {
    padding: '12px 24px',
    backgroundColor: '#ecf0f1',
    border: 'none',
    borderRadius: '8px',
    color: '#2c3e50',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
  confirmButton: {
    padding: '12px 24px',
    backgroundColor: '#e74c3c',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s',
  },
};

export default Navbar;