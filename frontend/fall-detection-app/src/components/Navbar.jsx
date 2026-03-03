import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, AlertCircle, Settings, Key, ChevronDown, X } from 'lucide-react';
import caireLogo from '../assets/caire.png';
import { api } from '../services/api';
import { useNotifications } from '../context/NotificationContext';

function Navbar() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
    setShowUserDropdown(false);
  };

  const handleConfirmLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleBellClick = () => {
    setShowNotifications(!showNotifications);
    setShowUserDropdown(false);
    if (!showNotifications) markAllRead();
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    try {
      const response = await api.changePassword(user.username, currentPassword, newPassword);
      if (response.success) {
        setPasswordSuccess('Password changed successfully!');
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordSuccess('');
        }, 2000);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setPasswordError('Current password is incorrect');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <>
      <nav style={styles.navbar}>
        <div style={styles.left}>
          <img src={caireLogo} alt="CAIRE Logo" style={styles.logo} />
          <h1 style={styles.title}>CAIRE</h1>
          <span style={styles.subtitle}>Fall Detection System</span>
        </div>

        <div style={styles.right}>
          {/* Bell Button */}
          <div style={{ position: 'relative' }}>
            <button style={styles.iconButton} onClick={handleBellClick}>
              <Bell size={20} />
              {unreadCount > 0 && (
                <span style={styles.badge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div style={styles.notifDropdown}>
                <div style={styles.notifHeader}>
                  <span style={styles.notifTitle}>Fall Alerts</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {notifications.length > 0 && (
                      <button style={styles.notifAction} onClick={clearAll}>Clear all</button>
                    )}
                  </div>
                </div>

                <div style={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div style={styles.noNotif}>
                      <Bell size={28} color="#bdc3c7" />
                      <p style={{ margin: '8px 0 0 0', color: '#bdc3c7', fontSize: '13px' }}>No alerts yet</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        style={{ ...styles.notifItem, cursor: 'pointer' }}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate('/live');
                        }}
                      >
                        <div style={styles.notifIcon}>⚠️</div>
                        <div style={styles.notifBody}>
                          <p style={styles.notifText}>
                            Fall Detected — Person <strong>#{n.trackId}</strong>
                          </p>
                          <p style={styles.notifMeta}>
                            {(n.confidence * 100).toFixed(1)}% confidence · {formatTime(n.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div style={styles.userMenuContainer}>
            <div
              style={styles.userSection}
              onClick={() => {
                setShowUserDropdown(!showUserDropdown);
                setShowNotifications(false);
              }}
            >
              <div style={styles.avatar}>
                <User size={18} />
              </div>
              <div style={styles.userInfo}>
                <p style={styles.userName}>{user.username || 'Admin User'}</p>
                <p style={styles.userRole}>{user.role === 'admin' ? 'Administrator' : 'User'}</p>
              </div>
              <ChevronDown
                size={18}
                style={{
                  ...styles.chevron,
                  transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              />
            </div>

            {showUserDropdown && (
              <div style={styles.dropdown}>
                <button style={styles.dropdownItem} onClick={() => setShowUserDropdown(false)}>
                  <User size={16} />
                  <span>My Profile</span>
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowUserDropdown(false);
                    setShowPasswordModal(true);
                  }}
                >
                  <Key size={16} />
                  <span>Change Password</span>
                </button>

                <button
                  style={styles.dropdownItem}
                  onClick={() => {
                    setShowUserDropdown(false);
                    navigate('/settings');
                  }}
                >
                  <Settings size={16} />
                  <span>Settings</span>
                </button>

                <div style={styles.dropdownDivider}></div>

                <button
                  style={{ ...styles.dropdownItem, ...styles.dropdownItemDanger }}
                  onClick={handleLogoutClick}
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div style={styles.modalOverlay} onClick={handleCancelLogout}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalIcon}>
              <AlertCircle size={48} color="#e74c3c" />
            </div>
            <h2 style={styles.modalTitle}>Confirm Logout</h2>
            <p style={styles.modalMessage}>Are you sure you want to log out?</p>
            <div style={styles.modalButtons}>
              <button style={styles.cancelButton} onClick={handleCancelLogout}>Cancel</button>
              <button style={styles.confirmButton} onClick={handleConfirmLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPasswordModal(false)}>
          <div style={styles.passwordModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.passwordHeader}>
              <Key size={32} color="#3498db" />
              <h2 style={styles.modalTitle}>Change Password</h2>
            </div>

            {passwordError && (
              <div style={styles.errorMessage}>
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div style={styles.successMessage}>
                <span>✓ {passwordSuccess}</span>
              </div>
            )}

            <div style={styles.passwordForm}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.modalButtons}>
              <button
                style={styles.cancelButton}
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
              >
                Cancel
              </button>
              <button style={styles.confirmButton} onClick={handleChangePassword}>
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

      {(showUserDropdown || showNotifications) && (
        <div
          style={styles.dropdownBackdrop}
          onClick={() => {
            setShowUserDropdown(false);
            setShowNotifications(false);
          }}
        />
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
    position: 'relative',
    zIndex: 100,
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
  notifDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
    width: '340px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  notifHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f0f0f0',
  },
  notifTitle: {
    fontSize: '15px',
    fontWeight: '700',
    color: '#2c3e50',
  },
  notifAction: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    color: '#e74c3c',
    cursor: 'pointer',
    fontWeight: '600',
  },
  notifList: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  noNotif: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    padding: '14px 20px',
    borderBottom: '1px solid #f8f8f8',
    alignItems: 'flex-start',
  },
  notifIcon: {
    fontSize: '20px',
    flexShrink: 0,
  },
  notifBody: {
    flex: 1,
  },
  notifText: {
    margin: '0 0 4px 0',
    fontSize: '13px',
    color: '#2c3e50',
  },
  notifMeta: {
    margin: 0,
    fontSize: '11px',
    color: '#95a5a6',
  },
  userMenuContainer: {
    position: 'relative',
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
  chevron: {
    color: '#7f8c8d',
    transition: 'transform 0.3s',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    minWidth: '220px',
    padding: '8px',
    zIndex: 1000,
  },
  dropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#2c3e50',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '6px',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  dropdownItemDanger: {
    color: '#e74c3c',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e0e0e0',
    margin: '8px 0',
  },
  dropdownBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
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
  },
  passwordModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '30px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  passwordHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '25px',
  },
  passwordForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginBottom: '25px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2c3e50',
    textAlign: 'left',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '20px',
  },
};

export default Navbar;