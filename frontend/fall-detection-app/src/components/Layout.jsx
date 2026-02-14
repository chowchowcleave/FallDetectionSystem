import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

function Layout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', width: '100%' }}>
      <Sidebar />
      
      <div style={{ 
        flex: '1 1 0',
        minWidth: 0,
        display: 'flex', 
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <Navbar />
        
        <main style={{
          flex: '1 1 0',
          minWidth: 0,
          overflow: 'auto',
          backgroundColor: '#f8f9fa',
          padding: '30px'
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default Layout;