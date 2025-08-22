import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabase } from '../services/supabaseClient';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const supabase = getSupabase();
  const { user } = useAuth();
  const [byUser, setByUser] = useState({}); // { [userId]: Array<Notification> }
  const [prefsByUser, setPrefsByUser] = useState({}); // { [userId]: prefs }
  const prefsRef = useRef({}); // { [userId]: prefs }
  const channelsRef = useRef([]);

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

  const clearForUser = async (userId) => {
    if (!userId) return;
    // Clear local list immediately for responsiveness
    setByUser(prev => ({ ...prev, [userId]: [] }));
    // Delete per-user delivery/read rows (optional clean-up)
    if (supabase) {
      try {
        await supabase.from('notification_deliveries').delete().eq('user_id', userId);
      } catch {}
    }
    // Persist a cutoff so older notifications remain hidden on next refreshes
    const nowIso = new Date().toISOString();
    const current = prefsRef.current[userId] || {};
    const nextPrefs = {
      ...current,
      types: { ...(current.types || {}), cleared_at: nowIso }
    };
    try { await updatePrefs(userId, nextPrefs); } catch {}
  };

  // Remove a single notification for a user (hide/dismiss)
  const removeForUser = async (userId, id) => {
    if (!userId || !id) return;
    // Remove locally
    setByUser(prev => {
      const list = prev[userId] || [];
      return { ...prev, [userId]: list.filter(n => n.id !== id) };
    });
    // Persist dismissal in prefs so it stays hidden across refreshes
    const current = prefsRef.current[userId] || {};
    const dismissed = { ...(current.types?.dismissed || {}), [id]: true };
    const nextPrefs = { ...current, types: { ...(current.types || {}), dismissed } };
    try { await updatePrefs(userId, nextPrefs); } catch {}
  };

  // Remove multiple selected notifications
  const removeManyForUser = async (userId, ids = []) => {
    if (!userId || !Array.isArray(ids) || ids.length === 0) return;
    // Remove locally
    setByUser(prev => {
      const list = prev[userId] || [];
      const idSet = new Set(ids);
      return { ...prev, [userId]: list.filter(n => !idSet.has(n.id)) };
    });
    // Persist dismissals
    const current = prefsRef.current[userId] || {};
    const prevDismissed = current.types?.dismissed || {};
    const nextDismissed = { ...prevDismissed };
    ids.forEach(id => { nextDismissed[id] = true; });
    const nextPrefs = { ...current, types: { ...(current.types || {}), dismissed: nextDismissed } };
    try { await updatePrefs(userId, nextPrefs); } catch {}
  };

  const getForUser = (userId) => (userId ? (byUser[userId] || []) : []);
  const getCount = (userId) => (userId ? (byUser[userId]?.length || 0) : 0);
  const getUnreadCount = (userId) => (userId ? ((byUser[userId] || []).filter(n => !n.read).length) : 0);
  const getPrefs = (userId) => (userId ? (prefsByUser[userId] || null) : null);

  const setLocalPrefs = (userId, prefs) => {
    if (!userId) return;
    setPrefsByUser(prev => ({ ...prev, [userId]: prefs }));
    prefsRef.current[userId] = prefs;
  };

  const updatePrefs = async (userId, prefs) => {
    if (!supabase || !userId) return { error: 'no-supabase' };
    const payload = {
      user_id: userId,
      master_enabled: prefs?.master_enabled !== false,
      // Align with SQL schema: also persist push_enabled/email_enabled booleans
      // We interpret master_enabled as push on/off for now
      push_enabled: prefs?.push_enabled ?? (prefs?.master_enabled !== false),
      email_enabled: prefs?.email_enabled ?? (typeof prefs?.types?.email !== 'undefined' ? !!prefs.types.email : true),
      types: prefs?.types || {},
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from('user_notification_prefs')
      .upsert(payload, { onConflict: 'user_id' });
    if (!error) setLocalPrefs(userId, { master_enabled: payload.master_enabled, types: payload.types });
    return { error };
  };

  // Internal: fetch notifications page and merge read states
  const fetchPage = async ({ userId, limit = 20, beforeCreatedAt = null }) => {
    if (!supabase) {
      console.warn('[Notifications] Supabase client not configured. Check EXPO_PUBLIC_SUPABASE_URL/ANON_KEY');
      return [];
    }
    if (!userId) {
      console.warn('[Notifications] Missing userId when fetching page');
      return [];
    }
    let q = supabase
      .from('notifications')
      .select('id, title, body, audience, data, created_at')
      // Use 'in' filter to match either 'all' or 'user:<id>' reliably
      .in('audience', ['all', `user:${userId}`])
      .order('created_at', { ascending: false })
      .limit(limit);
    if (beforeCreatedAt) q = q.lt('created_at', beforeCreatedAt);
    const { data: notifs, error: notifErr } = await q;
    if (notifErr) console.warn('[Notifications] Fetch notifications error:', notifErr?.message || notifErr);
    const ids = (notifs || []).map(n => n.id);
    let readSet = new Set();
    if (ids.length) {
      const { data: reads, error: readErr } = await supabase
        .from('notification_deliveries')
        .select('notification_id, read_at')
        .eq('user_id', userId)
        .in('notification_id', ids);
      if (readErr) console.warn('[Notifications] Fetch deliveries error (ok if unauthenticated):', readErr?.message || readErr);
      readSet = new Set((reads || []).filter(r => !!r.read_at).map(r => r.notification_id));
    }
    let list = (notifs || []).map(n => ({ id: n.id, title: n.title, body: n.body, date: n.created_at, read: readSet.has(n.id), data: n.data || {} }));
    // Gate by prefs (master + types)
    const prefs = prefsRef.current[userId];
    if (prefs && prefs.master_enabled === false) return [];
    // Exclude notifications cleared earlier
    const clearedAt = prefs?.types?.cleared_at;
    if (clearedAt) {
      const cutoff = new Date(clearedAt).getTime();
      list = list.filter(n => new Date(n.date).getTime() > cutoff);
    }
    // Exclude individually dismissed notifications
    const dismissed = prefs?.types?.dismissed || {};
    if (dismissed && typeof dismissed === 'object') {
      list = list.filter(n => !dismissed[n.id]);
    }
    if (prefs && prefs.types) {
      list = list.filter(n => {
        const type = n?.data?.type;
        if (!type) return true; // no type -> allowed
        const allowed = prefs.types[type];
        return allowed !== false;
      });
    }
    return list;
  };

  const markRead = (userId, id) => {
    if (!userId || !id) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === id ? { ...n, read: true } : n)
    }));
    // Persist
    if (supabase) {
      supabase.from('notification_deliveries')
        .upsert({ notification_id: id, user_id: userId, read_at: new Date().toISOString() }, { onConflict: 'notification_id,user_id' })
        .then(() => {})
        .catch(() => {});
    }
  };

  const markUnread = (userId, id) => {
    if (!userId || !id) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => n.id === id ? { ...n, read: false } : n)
    }));
    if (supabase) {
      supabase.from('notification_deliveries')
        .update({ read_at: null })
        .eq('notification_id', id)
        .eq('user_id', userId)
        .then(() => {})
        .catch(() => {});
    }
  };

  const markAllRead = (userId) => {
    if (!userId) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => ({ ...n, read: true }))
    }));
    if (supabase) {
      const ids = (byUser[userId] || []).map(n => n.id);
      if (ids.length) {
        supabase.from('notification_deliveries')
          .upsert(ids.map(id => ({ notification_id: id, user_id: userId, read_at: new Date().toISOString() })), { onConflict: 'notification_id,user_id' })
          .then(() => {})
          .catch(() => {});
      }
    }
  };

  const markAllUnread = (userId) => {
    if (!userId) return;
    setByUser(prev => ({
      ...prev,
      [userId]: (prev[userId] || []).map(n => ({ ...n, read: false }))
    }));
    if (supabase) {
      const ids = (byUser[userId] || []).map(n => n.id);
      if (ids.length) {
        supabase.from('notification_deliveries')
          .update({ read_at: null })
          .in('notification_id', ids)
          .eq('user_id', userId)
          .then(() => {})
          .catch(() => {});
      }
    }
  };

  // Initial load + realtime subscription
  useEffect(() => {
    if (!supabase || !user?.id) return;

    let isCancelled = false;

    const load = async () => {
      try {
        // Load preferences first
        const { data: prefRow } = await supabase
          .from('user_notification_prefs')
          .select('master_enabled, push_enabled, email_enabled, types')
          .eq('user_id', user.id)
          .maybeSingle();
        const effective = {
          master_enabled: (typeof prefRow?.push_enabled !== 'undefined')
            ? !!prefRow.push_enabled
            : (prefRow?.master_enabled ?? true),
          types: prefRow?.types || {}
        };
        setLocalPrefs(user.id, effective);

        const firstPage = await fetchPage({ userId: user.id, limit: 20 });
        if (isCancelled) return;
        setByUser(prev => ({ ...prev, [user.id]: firstPage }));
      } catch {}
    };

    load();

    // Realtime: notifications inserts
    const channel = supabase.channel('realtime:notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const n = payload?.new;
        if (!n) return;
        // Audience filter
        const audience = n.audience;
        const uid = user.id;
        const matches = audience === 'all' || audience === `user:${uid}`;
        if (!matches) return;
        // Gate by prefs in realtime
        const prefs = prefsRef.current[uid];
        if (prefs && prefs.master_enabled === false) return;
        const type = n?.data?.type;
        if (prefs && prefs.types && typeof prefs.types[type] !== 'undefined' && prefs.types[type] === false) return;
        // Ignore inserts older than last clear
        const clearedAt = prefs?.types?.cleared_at;
        if (clearedAt && new Date(n.created_at).getTime() <= new Date(clearedAt).getTime()) return;
        // Ignore if this notification was dismissed earlier
        const dismissed = prefs?.types?.dismissed || {};
        if (dismissed && dismissed[n.id]) return;
        console.log('[Notifications] Realtime insert received:', { id: n.id, audience: n.audience });
        setByUser(prev => {
          const list = prev[user.id] || [];
          // prevent duplicates by id
          if (list.some(x => x.id === n.id)) return prev;
          const item = { id: n.id, title: n.title, body: n.body, date: n.created_at, read: false, data: n.data || {} };
          return { ...prev, [user.id]: [item, ...list] };
        });
      })
      // Realtime: notifications deletes (admin global deletes should propagate)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'notifications' }, (payload) => {
        const oldRow = payload?.old;
        if (!oldRow) return;
        const uid = user.id;
        // Audience filter: remove only if this user would have received it
        const matches = oldRow.audience === 'all' || oldRow.audience === `user:${uid}`;
        if (!matches) return;
        setByUser(prev => {
          const list = prev[uid] || [];
          if (!list.length) return prev;
          const next = list.filter(n => n.id !== oldRow.id);
          if (next.length === list.length) return prev; // no change
          return { ...prev, [uid]: next };
        });
      })
      .subscribe();

    channelsRef.current.push(channel);

    return () => {
      isCancelled = true;
      channelsRef.current.forEach(ch => {
        try { supabase.removeChannel(ch); } catch {}
      });
      channelsRef.current = [];
    };
  }, [supabase, user?.id]);

  // Public: refresh and load more
  const refreshForUser = async (userId) => {
    try {
      const page = await fetchPage({ userId, limit: 20 });
      setByUser(prev => ({ ...prev, [userId]: page }));
      return true;
    } catch { return false; }
  };

  const loadMoreForUser = async (userId) => {
    try {
      const list = byUser[userId] || [];
      const last = list[list.length - 1];
      const more = await fetchPage({ userId, limit: 20, beforeCreatedAt: last?.date });
      if (more.length === 0) return false;
      setByUser(prev => ({ ...prev, [userId]: [...list, ...more.filter(m => !list.some(x => x.id === m.id))] }));
      return true;
    } catch { return false; }
  };

  const value = useMemo(() => ({ addForUser, clearForUser, removeForUser, removeManyForUser, getForUser, getCount, getUnreadCount, markRead, markUnread, markAllRead, markAllUnread, refreshForUser, loadMoreForUser, getPrefs, updatePrefs, setLocalPrefs }), [byUser, prefsByUser]);
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotificationsStore() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationsStore must be used within NotificationProvider');
  return ctx;
}
