import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function AnimatedLayout() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animations after component mounts
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
      width: '100%',
      opacity: isVisible ? 1 : 0,
      transition: 'opacity 0.6s ease-out',
    }}>
      <div style={{
        transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s ease-out',
      }}>
        <Sidebar />
      </div>
      
      <div style={{ 
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden',
        transform: isVisible ? 'translateY(0)' : 'translateY(-30px)',
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.6s ease-out 0.1s',
      }}>
        <Navbar />
        
        <main style={{
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '30px',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1)' : 'scale(0.95)',
          transition: 'all 0.6s ease-out 0.2s',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AnimatedLayout;