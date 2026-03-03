import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VideoUpload from './components/VideoUpload';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import AnimatedLayout from './components/AnimatedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { NotificationProvider } from './context/NotificationContext';

function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route element={
            <ProtectedRoute>
              <AnimatedLayout />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="detection" element={<VideoUpload />} />
            <Route path="live" element={<div />} />
            <Route path="analytics" element={<ComingSoon page="Analytics" />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

function ComingSoon({ page }) {
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      color: '#7f8c8d'
    }}>
      <h1 style={{ fontSize: '48px', margin: '0 0 10px 0' }}>🚧</h1>
      <h2 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{page}</h2>
      <p>This page is coming soon!</p>
    </div>
  );
}

export default App;