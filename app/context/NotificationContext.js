import React, { createContext, useContext, useMemo, useState } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [byUser, setByUser] = useState({}); // { [userId]: Array<Notification> }

  const addForUser = (userId, notification) => {
    if (!userId || !notification) return;
    setByUser(prev => {
      const list = prev[userId] || [];
      return { 
        ...prev, 
        [userId]: [
          { id: Date.now().toString(), date: new Date().toISOString(), read: false, ...notification },
          ...list
        ]
      };
    });
  };

  const clearForUser = (userId) => {
    if (!userId) return;
    setByUser(prev => ({ ...prev, [userId]: [] }));
  };

  const getForUser = (userId) => (userId ? (byUser[userId] || []) : []);
  const getCount = (userId) => (userId ? (byUser[userId]?.length || 0) : 0);
  const getUnreadCount = (userId) => (userId ? ((byUser[userId] || []).filter(n => !n.read).length) : 0);

  const markRead = (userId, id) => {
    if (!userId || !id) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const markUnread = (userId, id) => {
    if (!userId || !id) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === id ? { ...n, read: false } : n)
    }));
  };

  const markAllRead = (userId) => {
    if (!userId) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => ({ ...n, read: true }))
    }));
  };

  const markAllUnread = (userId) => {
    if (!userId) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => ({ ...n, read: false }))
    }));
  };

  const value = useMemo(() => ({ addForUser, clearForUser, getForUser, getCount, getUnreadCount, markRead, markUnread, markAllRead, markAllUnread }), [byUser]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationsStore() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationsStore must be used within NotificationProvider');
  return ctx;
}
