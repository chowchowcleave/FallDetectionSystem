import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import VideoUpload from './components/VideoUpload';
import Login from './pages/Login';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import LiveDetection from './components/LiveDetection';
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
            <Route path="live" element={<LiveDetection />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="logs" element={<Logs />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
}

export default App;