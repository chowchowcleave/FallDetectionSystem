import React, { useState, useEffect } from 'react';
import { Users, Plus, Trash2, Edit2, X, Check, Shield, Heart } from 'lucide-react';
import { api } from '../services/api';

function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'caregiver' });

  const currentUser = JSON.parse(localStorage.getItem('user') || 'null');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await api.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      showMessage('error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password) {
      showMessage('error', 'Username and password are required');
      return;
    }
    try {
      await api.register(newUser.username, newUser.password, newUser.role);
      showMessage('success', `User "${newUser.username}" created successfully`);
      setNewUser({ username: '', password: '', role: 'caregiver' });
      setShowAddForm(false);
      loadUsers();
    } catch (err) {
      showMessage('error', 'Failed to create user — username may already exist');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (userId === currentUser?.id) {
      showMessage('error', 'You cannot delete your own account');
      return;
    }
    if (!window.confirm(`Delete user "${username}"?`)) return;
    try {
      await api.deleteUser(userId);
      showMessage('success', `User "${username}" deleted`);
      loadUsers();
    } catch (err) {
      showMessage('error', 'Failed to delete user');
    }
  };

  const getRoleBadge = (role) => {
    const isAdmin = role === 'admin';
    return (
      <span style={{
        ...styles.badge,
        backgroundColor: isAdmin ? 'rgba(52, 152, 219, 0.15)' : 'rgba(46, 204, 113, 0.15)',
        color: isAdmin ? '#2980b9' : '#27ae60',
        border: `1px solid ${isAdmin ? 'rgba(52, 152, 219, 0.3)' : 'rgba(46, 204, 113, 0.3)'}`,
      }}>
        {isAdmin ? <Shield size={12} /> : <Heart size={12} />}
        {isAdmin ? 'Administrator' : 'Caregiver'}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={styles.loading}>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Manage Users</h1>
          <p style={styles.subtitle}>Add, edit, or remove system users and assign roles</p>
        </div>
        <button onClick={() => setShowAddForm(true)} style={styles.addBtn}>
          <Plus size={18} />
          Add User
        </button>
      </div>

      {message.text && (
        <div style={{
          ...styles.alert,
          ...(message.type === 'success' ? styles.alertSuccess : styles.alertError)
        }}>
          {message.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {message.text}
        </div>
      )}

      {/* Add User Form */}
      {showAddForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>New User</h3>
            <button onClick={() => setShowAddForm(false)} style={styles.closeBtn}>
              <X size={18} />
            </button>
          </div>
          <div style={styles.formGrid}>
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Role</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                style={styles.input}
              >
                <option value="caregiver">Caregiver</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>
          <div style={styles.formActions}>
            <button onClick={() => setShowAddForm(false)} style={styles.cancelBtn}>Cancel</button>
            <button onClick={handleAddUser} style={styles.saveBtn}>
              <Check size={16} /> Create User
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <Users size={20} color="#3498db" />
          <span style={styles.tableTitle}>{users.length} Users</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thead}>
              <th style={styles.th}>Username</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.userCell}>
                    <div style={styles.avatar}>
                      {user.username?.charAt(0).toUpperCase()}
                    </div>
                    <span style={styles.username}>
                      {user.username}
                      {user.id === currentUser?.id && (
                        <span style={styles.youTag}> (you)</span>
                      )}
                    </span>
                  </div>
                </td>
                <td style={styles.td}>{getRoleBadge(user.role)}</td>
                <td style={styles.td}>
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      style={styles.deleteBtn}
                      disabled={user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "Can't delete your own account" : "Delete user"}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={3} style={{ ...styles.td, textAlign: 'center', color: '#95a5a6', padding: '40px' }}>
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '900px', margin: '0 auto' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: '24px',
  },
  title: { fontSize: '32px', fontWeight: '700', color: '#2c3e50', margin: '0 0 8px 0' },
  subtitle: { fontSize: '15px', color: '#7f8c8d', margin: 0 },
  addBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '12px 20px', backgroundColor: '#3498db', color: '#fff',
    border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600',
    cursor: 'pointer',
  },
  alert: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 18px', borderRadius: '10px', marginBottom: '20px', fontSize: '14px',
  },
  alertSuccess: { backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' },
  alertError: { backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' },
  formCard: {
    backgroundColor: '#fff', borderRadius: '12px', padding: '24px',
    marginBottom: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    border: '2px solid #3498db',
  },
  formHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  formTitle: { fontSize: '18px', fontWeight: '600', color: '#2c3e50', margin: 0 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#95a5a6', padding: '4px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#2c3e50' },
  input: {
    padding: '10px 14px', fontSize: '14px', border: '2px solid #e0e0e0',
    borderRadius: '8px', outline: 'none', fontFamily: 'inherit',
  },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px' },
  cancelBtn: {
    padding: '10px 20px', backgroundColor: '#f5f5f5', color: '#7f8c8d',
    border: '1px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px',
  },
  saveBtn: {
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 20px', backgroundColor: '#3498db', color: '#fff',
    border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  },
  tableCard: {
    backgroundColor: '#fff', borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
  },
  tableTitle: { fontSize: '16px', fontWeight: '600', color: '#2c3e50' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { backgroundColor: '#f8f9fa' },
  th: {
    padding: '12px 24px', textAlign: 'left', fontSize: '13px',
    fontWeight: '600', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  tr: { borderBottom: '1px solid #f5f5f5' },
  td: { padding: '16px 24px', fontSize: '14px', color: '#2c3e50' },
  userCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: {
    width: '34px', height: '34px', borderRadius: '50%',
    backgroundColor: '#3498db', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: '700', fontSize: '14px', flexShrink: 0,
  },
  username: { fontWeight: '500' },
  youTag: { color: '#95a5a6', fontWeight: '400', fontSize: '13px' },
  badge: {
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
  },
  actions: { display: 'flex', gap: '8px' },
  deleteBtn: {
    padding: '7px', backgroundColor: 'rgba(231, 76, 60, 0.1)', color: '#e74c3c',
    border: '1px solid rgba(231, 76, 60, 0.2)', borderRadius: '6px',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
};

export default ManageUsers;