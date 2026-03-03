import React, { createContext, useContext, useState, useRef } from 'react';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);
  const seenFallIds = useRef(new Set());

  const addNotification = (fallId, confidence) => {
    const id = fallId ?? 'unknown';
    if (seenFallIds.current.has(id)) return;
    seenFallIds.current.add(id);

    const notification = {
      id: Date.now(),
      trackId: id,
      confidence,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    setActiveToast({ trackId: id, confidence });
  };

  const dismissToast = () => setActiveToast(null);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
    setActiveToast(null);
    seenFallIds.current = new Set();
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, activeToast, dismissToast, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}