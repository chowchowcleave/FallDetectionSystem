import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VideoUpload from './components/VideoUpload';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import LiveDetection from './components/LiveDetection';
import AnimatedLayout from './components/AnimatedLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ManageUsers from './pages/ManageUsers';
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
            {/* Admin only routes */}
            <Route path="dashboard" element={
              <ProtectedRoute adminOnly>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute adminOnly>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="manage-users" element={
              <ProtectedRoute adminOnly>
                <ManageUsers />
              </ProtectedRoute>
            } />

            {/* Shared routes — admin and caregiver */}
            <Route path="live" element={<LiveDetection />} />
            <Route path="logs" element={<Logs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;