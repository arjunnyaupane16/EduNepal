import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSupabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  // Supabase is the single source of truth for users
  const [users, setUsers] = useState([]);
  // Fields that must remain immutable unless a special verification flow is used
  const IMMUTABLE_FIELDS = ['username', 'email'];

  // Resolve backend URL. On physical devices, "localhost" points to the phone.
  // Replace with Expo host IP when available so device can reach the dev server.
  let SERVER_URL = Constants?.expoConfig?.extra?.serverUrl ?? 'http://localhost:4000';
  try {
    const raw = String(SERVER_URL || '');
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(raw)) {
      const hostUri = Constants?.expoConfig?.hostUri; // e.g. "192.168.1.10:19000"
      if (hostUri) {
        const ip = hostUri.split(':')[0];
        const portMatch = raw.match(/:(\d+)/);
        const port = portMatch ? portMatch[1] : '4000';
        SERVER_URL = `http://${ip}:${port}`;
      }
    }
  } catch {}
  const supabase = getSupabase();
  const ENABLE_ADMIN_BOOTSTRAP = Constants?.expoConfig?.extra?.enableAdminBootstrap === true;
  // Prefer bucket from app config, fallback to a sensible default
  const STORAGE_BUCKET = Constants?.expoConfig?.extra?.storageBucket || 'ArjunNyaupane';

  // Storage keys
  const STORAGE_KEYS = {
    loggedIn: 'auth:isLoggedIn',
    userId: 'auth:userId',
    userSnapshot: 'auth:userSnapshot', // fallback if we cannot fetch by id (non-admin only)
    isAdmin: 'auth:isAdmin',
  };

  // Username change: request code to CURRENT email, then confirm and update DB
  const requestUsernameChange = async ({ newUsername, password }) => {
    if (!user?.email) return { success: false, message: 'No current email' };
    if (!newUsername || newUsername.length < 3) return { success: false, message: 'Username too short' };
    if (String(user?.password || '') !== String(password || '')) {
      return { success: false, message: 'Current password is incorrect' };
    }
    return await sendVerificationCode({ purpose: 'change_username', email: user?.email });
  };

  const confirmUsernameChange = async ({ newUsername, code }) => {
    try {
      const v = await verifyCode({ purpose: 'change_username', code, email: user?.email });
      if (!v.success) return v;
      if (!supabase || !user?.id) return { success: false, message: 'Supabase unavailable' };
      const targetId = user.id;
      const { data: updated, error } = isLikelyUuid(targetId)
        ? await supabaseUpdateWithPrune(targetId, { username: newUsername })
        : await supabase
          .from('users')
          .update({ username: newUsername })
          .or([user?.email ? `email.eq.${user.email}` : null, user?.username ? `username.eq.${user.username}` : null].filter(Boolean).join(','))
          .select('*')
          .single();
      if (error) return { success: false, message: error?.message || 'Failed to update username' };
      const mapped = fromDbUser(updated);
      setUser(mapped);
      setUsers(list => {
        const without = list.filter(u => u.id !== mapped.id);
        return [...without, mapped];
      });
      try { await saveUserProfileJsonToStorage(mapped); } catch { }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unexpected error updating username' };
    }
  };

  // --- Sensitive action verification helpers ---
  const sendVerificationCode = async ({ purpose, email }) => {
    try {
      const targetEmail = String(email || user?.email || '').trim();
      if (!targetEmail) return { success: false, message: 'No email available' };
      const res = await fetch(`${SERVER_URL}/auth/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, purpose })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) return { success: false, message: json?.error || 'Failed to send code' };
      return { success: true, expiresInSeconds: json.expiresInSeconds };
    } catch (e) {
      return { success: false, message: 'Network error while sending code' };
    }
  };

  const verifyCode = async ({ purpose, code, email }) => {
    try {
      const targetEmail = String(email || user?.email || '').trim();
      if (!targetEmail) return { success: false, message: 'No email available' };
      const res = await fetch(`${SERVER_URL}/auth/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, purpose, code })
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) return { success: false, message: json?.error || 'Invalid code' };
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Network error while verifying code' };
    }
  };

  // Change password with verification code
  const changePasswordWithVerification = async ({ currentPassword, newPassword, code }) => {
    try {
      if (!user?.id) return { success: false, message: 'No current user' };
      // Basic local check to avoid unnecessary calls
      if (String(user?.password || '') !== String(currentPassword || '')) {
        return { success: false, message: 'Current password is incorrect' };
      }
      const v = await verifyCode({ purpose: 'change_password', code, email: user?.email });
      if (!v.success) return v;
      if (!supabase || !isLikelyUuid(user.id)) return { success: false, message: 'Supabase unavailable' };
      const { data: updated, error } = await supabaseUpdateWithPrune(user.id, { password: newPassword });
      if (error) return { success: false, message: error?.message || 'Failed to update password' };
      const mapped = fromDbUser(updated);
      setUser(mapped);
      setUsers(list => {
        const without = list.filter(u => u.id !== mapped.id);
        return [...without, mapped];
      });
      try { await saveUserProfileJsonToStorage(mapped); } catch { }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unexpected error changing password' };
    }
  };

  // Email change: request code to NEW email, then confirm and update DB
  const requestEmailChange = async ({ newEmail, password }) => {
    if (!user?.email) return { success: false, message: 'No current email' };
    if (String(user?.password || '') !== String(password || '')) {
      return { success: false, message: 'Current password is incorrect' };
    }
    return await sendVerificationCode({ purpose: 'change_email', email: newEmail });
  };

  const confirmEmailChange = async ({ newEmail, code }) => {
    try {
      const v = await verifyCode({ purpose: 'change_email', code, email: newEmail });
      if (!v.success) return v;
      if (!supabase || !user?.id) return { success: false, message: 'Supabase unavailable' };
      const targetId = user.id;
      const { data: updated, error } = isLikelyUuid(targetId)
        ? await supabaseUpdateWithPrune(targetId, { email: newEmail })
        : await supabase
          .from('users')
          .update({ email: newEmail })
          .or([user?.email ? `email.eq.${user.email}` : null, user?.username ? `username.eq.${user.username}` : null].filter(Boolean).join(','))
          .select('*')
          .single();
      if (error) return { success: false, message: error?.message || 'Failed to update email' };
      const mapped = fromDbUser(updated);
      setUser(mapped);
      setUsers(list => {
        const without = list.filter(u => u.id !== mapped.id);
        return [...without, mapped];
      });
      // Register updated email for server notifications
      if (mapped?.email) {
        fetch(`${SERVER_URL}/register-email`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: mapped.email })
        }).catch(() => { });
      }
      try { await saveUserProfileJsonToStorage(mapped); } catch { }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unexpected error changing email' };
    }
  };

  // Account deletion: request/confirm
  const requestAccountDeletion = async ({ password }) => {
    if (String(user?.password || '') !== String(password || '')) {
      return { success: false, message: 'Current password is incorrect' };
    }
    return await sendVerificationCode({ purpose: 'delete_account', email: user?.email });
  };

  const confirmAccountDeletion = async ({ code }) => {
    try {
      const v = await verifyCode({ purpose: 'delete_account', code, email: user?.email });
      if (!v.success) return v;
      if (!supabase || !user?.id) {
        // Even if DB not reachable, at least log out
        logout();
        return { success: true };
      }
      try {
        if (isLikelyUuid(user.id)) {
          await supabase.from('users').delete().eq('id', user.id);
        } else if (user?.email) {
          await supabase.from('users').delete().eq('email', user.email);
        }
      } catch { }
      logout();
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unexpected error deleting account' };
    }
  };

  // Forgot password: request code to provided email and confirm without needing current password
  const requestPasswordReset = async ({ email }) => {
    try {
      const target = String(email || '').trim();
      if (!target) return { success: false, message: 'Email required' };
      return await sendVerificationCode({ purpose: 'reset_password', email: target });
    } catch (e) {
      return { success: false, message: 'Unexpected error requesting reset' };
    }
  };

  const confirmPasswordReset = async ({ email, code, newPassword }) => {
    try {
      const target = String(email || '').trim();
      if (!target) return { success: false, message: 'Email required' };
      if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password too short' };
      const v = await verifyCode({ purpose: 'reset_password', code, email: target });
      if (!v.success) return v;
      if (!supabase) return { success: false, message: 'Supabase unavailable' };
      // Update by email; support both uuid id and email match as fallback
      let updateRes = { data: null, error: null };
      try {
        updateRes = await supabase
          .from('users')
          .update({ password: newPassword })
          .eq('email', target)
          .select('*')
          .single();
      } catch (e) {
        updateRes = { data: null, error: e };
      }
      if (updateRes.error) return { success: false, message: updateRes.error?.message || 'Failed to update password' };
      const updated = fromDbUser(updateRes.data || {});
      // If the reset email matches current session user, sync local state
      if (user?.email && user.email.toLowerCase() === target.toLowerCase()) {
        setUser(prev => ({ ...(prev || {}), ...updated }));
        try { await saveUserProfileJsonToStorage(updated); } catch {}
      }
      return { success: true };
    } catch (e) {
      return { success: false, message: 'Unexpected error confirming reset' };
    }
  };

  // Delete profile image: clear DB fields and try to remove stored files
  const deleteProfileImage = async () => {
    try {
      if (!supabase || !user?.id) return { success: false, error: 'Supabase unavailable or no user' };
      // 1) Clear the DB fields first
      const resp = await updateUser({ profileImage: null, profileImagePath: null });
      if (!resp?.success) {
        return { success: false, error: resp?.error || 'Failed to clear profile image' };
      }
      // 2) Best-effort: remove any files under users/{id}/ that are profile images
      try {
        const folder = `users/${user.id}`;
        const { data: list, error: listErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folder, { limit: 100, offset: 0 });
        if (!listErr && Array.isArray(list) && list.length) {
          const toRemove = list
            .filter((f) => {
              const n = String(f?.name || '');
              return n.startsWith('profile_') || n.startsWith('profile.');
            })
            .map((f) => `${folder}/${f.name}`);
          if (toRemove.length) {
            await supabase.storage.from(STORAGE_BUCKET).remove(toRemove);
          }
        }
      } catch { }
      // 3) Persist latest profile JSON snapshot (optional)
      try { await saveUserProfileJsonToStorage(resp.user || user); } catch { }
      return { success: true };
    } catch (e) {
      console.warn('deleteProfileImage exception:', e?.message || e);
      return { success: false, error: e };
    }
  };

  // Heuristic: check if an id looks like a Postgres UUID
  const isLikelyUuid = (val) => {
    const s = String(val || '').trim();
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
  };

  // Extract missing column from PostgREST PGRST204 message
  const getMissingColumnFromError = (err) => {
    try {
      const msg = err?.message || '';
      const m = msg.match(/Could not find the '([^']+)' column/);
      return m ? m[1] : null;
    } catch { return null; }
  };

  // Generic update retry that prunes unknown columns on PGRST204
  const supabaseUpdateWithPrune = async (id, updates) => {
    let payload = toDbUser(updates);
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();
      if (!error) return { data, error: null };
      if (error.code === 'PGRST116') return { data: null, error };
      if (error.code !== 'PGRST204') return { data: null, error };
      const missing = getMissingColumnFromError(error);
      if (missing) {
        const toDbKey = (k) => {
          const map = { fullName: 'full_name', profileImage: 'profile_image', profileImagePath: 'profile_image_path', joinDate: 'join_date', dateOfBirth: 'date_of_birth' };
          return map[k] || k;
        };
        delete payload[toDbKey(missing)];
      } else {
        return { data: null, error };
      }
      if (Object.keys(payload).length === 0) return { data: null, error };
    }
    return { data: null, error: { message: 'Exceeded retry attempts', code: 'RETRY' } };
  };

  // Generic insert with prune on PGRST204
  const supabaseInsertWithPrune = async (userObj) => {
    let payload = toDbUser(userObj);
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('users')
        .insert(payload)
        .select('*')
        .single();
      if (!error) return { data, error: null };
      if (error.code !== 'PGRST204') return { data: null, error };
      const missing = getMissingColumnFromError(error);
      if (missing) {
        const toDbKey = (k) => {
          const map = { fullName: 'full_name', profileImage: 'profile_image', joinDate: 'join_date', dateOfBirth: 'date_of_birth' };
          return map[k] || k;
        };
        delete payload[toDbKey(missing)];
      } else {
        return { data: null, error };
      }
      if (Object.keys(payload).length === 0) return { data: null, error };
    }
    return { data: null, error: { message: 'Exceeded retry attempts', code: 'RETRY' } };
  };

  // Map between app (camelCase) and DB (snake_case) field names for users
  // Whitelist only columns that exist in the DB schema to avoid PGRST204
  const toDbUser = (input = {}) => {
    if (!input || typeof input !== 'object') return {};
    const out = {};
    const map = {
      fullName: 'full_name',
      profileImage: 'profile_image',
      profileImagePath: 'profile_image_path',
      joinDate: 'join_date',
      dateOfBirth: 'date_of_birth',
    };
    // known direct db columns
    const direct = new Set(['email', 'username', 'password', 'phone', 'role', 'gender', 'address', 'settings']);
    for (const [k, v] of Object.entries(input)) {
      if (Object.prototype.hasOwnProperty.call(map, k)) {
        out[map[k]] = v;
      } else if (direct.has(k)) {
        out[k] = v;
      }
      // ignore unknown keys like gender, settings, address, age, etc.
    }
    return out;
  };

  const fromDbUser = (row = {}) => {
    if (!row || typeof row !== 'object') return row;
    const map = {
      full_name: 'fullName',
      profile_image: 'profileImage',
      profile_image_path: 'profileImagePath',
      join_date: 'joinDate',
      date_of_birth: 'dateOfBirth',
    };
    const out = { ...row };
    for (const [dbKey, appKey] of Object.entries(map)) {
      if (Object.prototype.hasOwnProperty.call(row, dbKey)) {
        out[appKey] = row[dbKey];
        delete out[dbKey];
      }
    }
    return out;
  };

  // On mount, load users from Supabase if configured (fallback to local defaults)
  useEffect(() => {
    let mounted = true;
    async function loadUsers() {
      if (!supabase) return;
      try {
        let data = null, error = null;
        // Try snake_case order
        ({ data, error } = await supabase
          .from('users')
          .select('*')
          .order('join_date', { ascending: false }));
        if (error && (error.code === 'PGRST204' || error.code === '42703' || /column\s+"?join_date"?\s+does not exist/i.test(String(error.message || '')))) {
          // Retry camelCase order when snake_case column not present
          ({ data, error } = await supabase
            .from('users')
            .select('*')
            .order('joinDate', { ascending: false }));
        }
        if (error) {
          // Final retry without order
          ({ data, error } = await supabase
            .from('users')
            .select('*'));
        }
        if (error) throw error;
        let list = Array.isArray(data) ? data.map(fromDbUser) : [];

        // Auto-bootstrap demo admin only if NO admin-type role exists at all
        const hasAdministratorRole = list.some(u => (u?.role || '').toLowerCase().startsWith('admin'));
        if (!hasAdministratorRole && ENABLE_ADMIN_BOOTSTRAP) {
          const demoAdmin = toDbUser({
            fullName: 'Arjun Nyaupane',
            email: 'arjunnyaupane16@gmail.com',
            username: 'admin',
            password: 'admin1234',
            phone: '',
            role: 'Administrator',
            joinDate: new Date().toISOString().split('T')[0],
            profileImage: null,
          });
          try {
            let { data: upData, error: upErr } = await supabase
              .from('users')
              .upsert(demoAdmin, { onConflict: 'username', ignoreDuplicates: true });
            if (upErr && upErr.code === 'PGRST204') {
              // Retry with camelCase payload in case DB columns are camelCase
              ({ data: upData, error: upErr } = await supabase
                .from('users')
                .upsert(fromDbUser(demoAdmin), { onConflict: 'username', ignoreDuplicates: true }));
            }
            if (!upErr) {
              // If a new row was inserted, Supabase returns it in data; otherwise (duplicate ignored) data may be empty
              if (upData && Array.isArray(upData) && upData.length > 0) {
                const added = upData.find(u => u.username === 'admin');
                if (added) {
                  list = [fromDbUser(added), ...list.filter(u => u.username !== 'admin')];
                }
              } else {
                // Duplicate ignored: do NOT inject local demoAdmin; instead, fetch the authoritative admin row if needed
                const { data: adminRow } = await supabase
                  .from('users')
                  .select('*')
                  .eq('username', 'admin')
                  .limit(1)
                  .maybeSingle();
                if (adminRow) {
                  list = [fromDbUser(adminRow), ...list.filter(u => u.username !== 'admin')];
                }
              }
            } else {
              console.warn('Supabase admin bootstrap upsert error:', upErr?.message || upErr);
            }
          } catch (err) {
            console.warn('Supabase admin bootstrap exception:', err?.message || err);
          }
        }

        if (mounted) {
          setUsers(list);
        }
      } catch (e) {
        // Silent fail; keep current state
      }
    }
    loadUsers();
    return () => { mounted = false; };
  }, [supabase]);

  // Hydrate auth session on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loggedInStr, storedUserId, storedUserJson, isAdminStr] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.loggedIn),
          AsyncStorage.getItem(STORAGE_KEYS.userId),
          AsyncStorage.getItem(STORAGE_KEYS.userSnapshot),
          AsyncStorage.getItem(STORAGE_KEYS.isAdmin),
        ]);
        const wasLoggedIn = loggedInStr === 'true';
        if (!wasLoggedIn) return;

        // Determine if previous session was admin using explicit flag
        const wasAdmin = isAdminStr === 'true';
        let snapshotObj = null;
        try { snapshotObj = storedUserJson ? JSON.parse(storedUserJson) : null; } catch { }

        // Prefer fetching fresh user by id from Supabase
        if (storedUserId && supabase) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', storedUserId)
            .limit(1)
            .maybeSingle();
          if (!cancelled) {
            if (!error && data) {
              const mapped = fromDbUser(data);
              setUser(mapped);
              setIsLoggedIn(true);
              // merge into users cache
              setUsers(prev => {
                const without = prev.filter(u => u.id !== mapped.id);
                return [...without, mapped];
              });
              return;
            }
            // If fetch failed, try snapshot fallback even for admin
            if (storedUserJson) {
              try {
                const snap = snapshotObj || JSON.parse(storedUserJson);
                if (snap?.id) {
                  setUser(snap);
                  setIsLoggedIn(true);
                  return;
                }
              } catch { }
            }
            // No snapshot available: clear session
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.loggedIn,
              STORAGE_KEYS.userId,
              STORAGE_KEYS.userSnapshot,
              STORAGE_KEYS.isAdmin,
            ]);
            setIsLoggedIn(false);
            setUser(null);
            return;
          }
        }
        // Fallback to snapshot
        if (!cancelled && storedUserJson) {
          const snap = snapshotObj || JSON.parse(storedUserJson);
          if (snap?.id) setUser(snap);
          setIsLoggedIn(true);
        }
      } catch { }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  // Persist auth session whenever it changes
  useEffect(() => {
    (async () => {
      try {
        if (isLoggedIn && user) {
          const roleLower = String(user.role || '').toLowerCase();
          const admin = roleLower.startsWith('admin') || String(user.username || '').toLowerCase() === 'admin';
          const pairs = [
            [STORAGE_KEYS.loggedIn, 'true'],
            [STORAGE_KEYS.userId, user.id ? String(user.id) : ''],
            [STORAGE_KEYS.isAdmin, admin ? 'true' : 'false'],
          ];
          // Store snapshot for all users to allow offline/fallback hydration
          pairs.push([STORAGE_KEYS.userSnapshot, JSON.stringify(user)]);
          await AsyncStorage.multiSet(pairs);
        } else {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.loggedIn,
            STORAGE_KEYS.userId,
            STORAGE_KEYS.userSnapshot,
            STORAGE_KEYS.isAdmin,
          ]);
        }
      } catch { }
    })();
  }, [isLoggedIn, user]);

  // Heartbeat: mark user as active by updating last_seen/lastSeen periodically and on app resume
  useEffect(() => {
    if (!isLoggedIn || !user?.id || !supabase) return;
    let cancelled = false;
    let intervalId = null;
    const touch = async () => {
      if (cancelled) return;
      const nowIso = new Date().toISOString();
      try {
        // Try snake_case first
        await supabase.from('users').update({ last_seen: nowIso }).eq('id', user.id);
      } catch {}
      try {
        // Fallback camelCase
        await supabase.from('users').update({ lastSeen: nowIso }).eq('id', user.id);
      } catch {}
    };
    // initial touch
    touch();
    // repeat every 2 minutes
    intervalId = setInterval(touch, 2 * 60 * 1000);
    // on app resume
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') touch();
    });
    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
      try { sub?.remove && sub.remove(); } catch {}
    };
  }, [isLoggedIn, user?.id, supabase]);

  const login = async (credentials) => {
    const { username, email, identifier, password, mode } = credentials || {};
    console.log('Login attempt:', { username, email, identifier, mode });

    // Admin login: accept any user with role 'Administrator' using entered username/password
    if (mode === 'admin') {
      if (!username || !password) {
        return { success: false, message: 'Missing admin credentials' };
      }

      // Try local cache first
      let adminUser = users.find(u => u.username === username && u.password === password);

      // If not found in cache, query Supabase directly
      if (!adminUser && supabase) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .limit(1)
            .maybeSingle();
          if (error) {
            return { success: false, message: `Login query failed: ${error.message || 'unknown error'}` };
          }
          if (data) {
            adminUser = fromDbUser(data);
            // Merge into local cache for future
            setUsers(prev => {
              const without = prev.filter(u => u.id !== adminUser.id);
              return [...without, adminUser];
            });
          }
        } catch (e) {
          return { success: false, message: 'Network error while logging in' };
        }
      }

      if (!adminUser) {
        return { success: false, message: 'Invalid admin credentials' };
      }

      if (!(String(adminUser.role || '').toLowerCase().startsWith('admin'))) {
        return { success: false, message: 'This account is not an Administrator' };
      }

      // Ensure we have the authoritative row from Supabase
      if (supabase && adminUser?.id) {
        try {
          const { data: fresh, error: freshErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', adminUser.id)
            .limit(1)
            .maybeSingle();
          if (!freshErr && fresh) {
            adminUser = fromDbUser(fresh);
          }
        } catch { }
      }

      setIsLoggedIn(true);
      setUser(adminUser);
      if (adminUser?.email) {
        fetch(`${SERVER_URL}/register-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: adminUser.email })
        }).catch(() => { });
      }
      return { success: true, user: adminUser };
    }

    // Normalize identifier (username or email or phone)
    const rawId = identifier || username || email;
    if (!rawId || !password) {
      return { success: false, message: 'Missing credentials' };
    }

    const id = String(rawId).trim();
    const idLower = id.toLowerCase();
    const idDigits = id.replace(/[^\d]/g, '');

    // Find by email OR username OR phone
    let foundUser = users.find(u => {
      const emailMatch = (u.email || '').toLowerCase() === idLower;
      const usernameMatch = (u.username || '').toLowerCase() === idLower;
      const phoneMatch = (u.phone || '').replace(/[^\d]/g, '') === idDigits;
      return (emailMatch || usernameMatch || phoneMatch) && u.password === password;
    });

    if (foundUser) {
      // Block admin from logging in via User mode
      if ((mode === 'user' || !mode) && ((String(foundUser.role || '').toLowerCase().startsWith('admin')) || String(foundUser.username || '').toLowerCase() === 'admin')) {
        return { success: false, message: 'Please use the Admin Login tab for admin account' };
      }
      // Fetch authoritative row by id when possible
      if (supabase && foundUser?.id) {
        try {
          const { data: fresh, error: freshErr } = await supabase
            .from('users')
            .select('*')
            .eq('id', foundUser.id)
            .limit(1)
            .maybeSingle();
          if (!freshErr && fresh) {
            const mapped = fromDbUser(fresh);
            // Merge into cache immediately
            setUsers(prev => {
              const without = prev.filter(u => u.id !== mapped.id);
              return [...without, mapped];
            });
            setIsLoggedIn(true);
            setUser(mapped);
            if (fresh?.email) {
              fetch(`${SERVER_URL}/register-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: mapped.email })
              }).catch(() => { });
            }
            return { success: true, user: mapped };
          }
        } catch { }
      }
      setIsLoggedIn(true);
      setUser(foundUser);
      // Register email for fallback notifications (swallow network errors)
      if (foundUser?.email) {
        fetch(`${SERVER_URL}/register-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: foundUser.email })
        }).catch(() => { });
      }
      return { success: true, user: foundUser };
    }

    // Web-safe fallback: if cache hasn't populated yet, query Supabase directly for regular users
    if (supabase) {
      try {
        // Build an OR filter for identifier; AND with password equality
        const orFilterParts = [];
        // Match by email
        orFilterParts.push(`email.eq.${id}`);
        // Match by username (lowercase compare via DB col is fine for exact, if case differs you may normalize)
        orFilterParts.push(`username.eq.${id}`);
        // Match by phone digits if provided
        if (idDigits) orFilterParts.push(`phone_digits.eq.${idDigits}`);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .or(orFilterParts.join(','))
          .eq('password', password)
          .limit(1)
          .maybeSingle();
        if (!error && data) {
          const mapped = fromDbUser(data);
          // Merge into cache
          setUsers(prev => {
            const without = prev.filter(u => u.id !== mapped.id);
            return [...without, mapped];
          });
          setIsLoggedIn(true);
          setUser(mapped);
          if (mapped?.email) {
            fetch(`${SERVER_URL}/register-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: mapped.email })
            }).catch(() => { });
          }
          return { success: true, user: mapped };
        }
      } catch { /* ignore and fall through */ }
    }

    return { success: false, message: 'Invalid credentials' };
  };

  const signup = async (signupData) => {
    // Avoid logging sensitive data like passwords
    console.log('Signup attempt:', {
      fullName: signupData?.fullName,
      email: signupData?.email,
      username: signupData?.username,
    });

    // Check if email already exists
    if (users.find(u => u.email === signupData.email)) {
      return { success: false, message: 'Email already exists' };
    }

    // Create new user (prefer DB-generated UUID)
    const baseUser = {
      fullName: signupData.fullName,
      email: signupData.email,
      username: signupData.username || signupData.email.split('@')[0],
      password: signupData.password,
      phone: signupData.phone || '',
      role: 'Student', // Default role
      joinDate: new Date().toISOString().split('T')[0],
      profileImage: signupData.profileImage || null,
    };

    // Require Supabase and use returned row
    if (supabase) {
      try {
        const { data: inserted, error } = await supabaseInsertWithPrune(baseUser);
        if (error) {
          console.warn('Supabase insert user error:', error);
        } else if (inserted) {
          const mapped = fromDbUser(inserted);
          console.log('New user created (DB):', {
            id: mapped.id,
            email: mapped.email,
            username: mapped.username,
            role: mapped.role,
          });
          setUsers(prev => {
            const updatedUsers = [...prev, mapped];
            console.log('Users count after signup:', updatedUsers.length);
            return updatedUsers;
          });
          // Immediately set session so it persists via AsyncStorage hydration
          setIsLoggedIn(true);
          setUser(mapped);
          // Optional: register email like in login flow
          if (mapped?.email) {
            fetch(`${SERVER_URL}/register-email`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: mapped.email })
            }).catch(() => { });
          }
          // Persist profile JSON to Storage under users/{id}/profile.json
          try { await saveUserProfileJsonToStorage(mapped); } catch { }
          return { success: true, user: mapped };
        }
      } catch (e) {
        console.warn('Supabase insert user exception:', e?.message || e);
      }
    }
    // No local fallback for signup
    return { success: false, message: 'Supabase is required to sign up. Please check your connection.' };
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    // Clear persisted session
    (async () => {
      try {
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.loggedIn,
          STORAGE_KEYS.userId,
          STORAGE_KEYS.userSnapshot,
          STORAGE_KEYS.isAdmin,
        ]);
      } catch { }
    })();
  };

  const updateUser = async (updates) => {
    const applyMapping = (input) => {
      // Whitelist fields (immutable username/email excluded)
      const allowed = [
        'fullName', 'phone', 'profileImage', 'profileImagePath', 'joinDate',
        'dateOfBirth', 'role', 'password',
        // Newly supported profile fields
        'gender', 'address', 'settings'
      ];
      const safe = {};
      // Warn if immutable fields were attempted to be changed
      for (const key of IMMUTABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          console.warn(`Attempt to modify immutable field: ${key} — ignored`);
        }
      }
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          safe[key] = input[key];
        }
      }
      return safe;
    };

    const safeUpdates = applyMapping(updates || {});
    try {
      // If nothing to update, return success no-op
      if (Object.keys(safeUpdates).length === 0) {
        return { success: true, user };
      }
      const current = user;
      if (!current?.id) return { success: false, error: 'No current user' };

      if (supabase && isLikelyUuid(current.id)) {
        let { data: updated, error } = await supabaseUpdateWithPrune(current.id, safeUpdates);
        if (!error && updated) {
          const mapped = fromDbUser(updated);
          setUser(mapped);
          setUsers(list => {
            const without = list.filter(u => u.id !== mapped.id);
            return [...without, mapped];
          });
          // Best-effort: persist latest profile JSON to Storage
          try { await saveUserProfileJsonToStorage(mapped); } catch { }
          return { success: true, user: mapped };
        }
        // If 0 rows matched, try to repair by refetching authoritative row via unique keys
        if (error && error.code === 'PGRST116') {
          try {
            const email = current?.email ? String(current.email) : null;
            const username = current?.username ? String(current.username) : null;
            // First try exact match on email/username
            if (email || username) {
              const filters = [];
              if (email) filters.push(`email.eq.${email}`);
              if (username) filters.push(`username.eq.${username}`);
              let { data: fresh, error: freshErr } = await supabase
                .from('users')
                .select('*')
                .or(filters.join(','))
                .limit(1)
                .maybeSingle();
              // If not found, try a case-insensitive search as fallback
              if ((!fresh || freshErr?.code === 'PGRST116') && (email || username)) {
                const orClauses = [];
                if (email) orClauses.push(`email.ilike.${email}`);
                if (username) orClauses.push(`username.ilike.${username}`);
                const resp = await supabase
                  .from('users')
                  .select('*')
                  .or(orClauses.join(','))
                  .limit(1)
                  .maybeSingle();
                fresh = resp.data;
                freshErr = resp.error;
              }
              if (!freshErr && fresh?.id && isLikelyUuid(fresh.id)) {
                // Retry update with authoritative id
                const retry = await supabaseUpdateWithPrune(fresh.id, safeUpdates);
                if (!retry.error && retry.data) {
                  const mapped = fromDbUser(retry.data);
                  // Repair session id and caches
                  setUser(mapped);
                  setUsers(list => {
                    const without = list.filter(u => u.id !== mapped.id);
                    return [...without, mapped];
                  });
                  try {
                    await AsyncStorage.multiSet([
                      [STORAGE_KEYS.userId, String(mapped.id)],
                      [STORAGE_KEYS.userSnapshot, JSON.stringify(mapped)],
                    ]);
                  } catch { }
                  try { await saveUserProfileJsonToStorage(mapped); } catch { }
                  return { success: true, user: mapped };
                }
              }
            }
          } catch { }
        }
        // Do not fallback to local state; enforce DB as source of truth
        console.warn('Supabase update self user error (no local fallback):', error);
        return { success: false, error };
      }

      // Supabase available but id is not a UUID: fall back to updating via unique keys (email/username)
      if (supabase && !isLikelyUuid(current.id)) {
        try {
          const email = current?.email ? String(current.email) : null;
          const username = current?.username ? String(current.username) : null;
          const filters = [];
          if (email) filters.push(`email.eq.${email}`);
          if (username) filters.push(`username.eq.${username}`);
          if (filters.length === 0) {
            return { success: false, error: 'No unique identifier to update user' };
          }
          // Attempt update by unique identifiers
          let { data: upd, error: updErr } = await supabase
            .from('users')
            .update(toDbUser(safeUpdates))
            .or(filters.join(','))
            .select('*')
            .single();
          if (!updErr && upd) {
            const mapped = fromDbUser(upd);
            // Repair session id and caches if the DB has a proper UUID now
            setUser(mapped);
            setUsers(list => {
              const without = list.filter(u => u.id !== mapped.id);
              return [...without, mapped];
            });
            try {
              await AsyncStorage.multiSet([
                [STORAGE_KEYS.userId, String(mapped.id || '')],
                [STORAGE_KEYS.userSnapshot, JSON.stringify(mapped)],
              ]);
            } catch { }
            try { await saveUserProfileJsonToStorage(mapped); } catch { }
            return { success: true, user: mapped };
          }
          // If update failed, try to fetch authoritative row and then retry with its id
          let { data: fresh, error: freshErr } = await supabase
            .from('users')
            .select('*')
            .or(filters.join(','))
            .limit(1)
            .maybeSingle();
          if (!freshErr && fresh && isLikelyUuid(fresh.id)) {
            const retry = await supabaseUpdateWithPrune(fresh.id, safeUpdates);
            if (!retry.error && retry.data) {
              const mapped = fromDbUser(retry.data);
              setUser(mapped);
              setUsers(list => {
                const without = list.filter(u => u.id !== mapped.id);
                return [...without, mapped];
              });
              try {
                await AsyncStorage.multiSet([
                  [STORAGE_KEYS.userId, String(mapped.id)],
                  [STORAGE_KEYS.userSnapshot, JSON.stringify(mapped)],
                ]);
              } catch { }
              try { await saveUserProfileJsonToStorage(mapped); } catch { }
              return { success: true, user: mapped };
            }
          }
          return { success: false, error: updErr || freshErr || 'Update failed for non-UUID user' };
        } catch (e) {
          console.warn('Non-UUID user update exception:', e?.message || e);
          return { success: false, error: e };
        }
      }

      // No Supabase available
      return { success: false, error: 'Supabase unavailable' };
    } catch (e) {
      console.warn('updateUser exception:', e?.message || e);
      return { success: false, error: e };
    }
  };

  // Admin-only helpers for managing users list
  const updateUserById = async (id, updates) => {
    const isAdmin = !!user && (String(user.role || '').toLowerCase().startsWith('admin'));
    if (!isAdmin) {
      console.warn('updateUserById blocked: current user is not an Administrator');
      return { success: false, error: 'Not authorized' };
    }
    // Admin can edit any user except immutable fields (username, email). Apply same whitelist mapping.
    const applyMapping = (input) => {
      const allowed = [
        // username and email are intentionally excluded
        'fullName', 'phone', 'profileImage', 'profileImagePath', 'joinDate',
        'dateOfBirth', 'role', 'password',
        // Newly supported profile fields
        'gender', 'address', 'settings'
      ];
      const safe = {};
      // Warn if immutable fields were attempted to be changed
      for (const key of IMMUTABLE_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          console.warn(`Admin attempt to modify immutable field: ${key} — ignored`);
        }
      }
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
          safe[key] = input[key];
        }
      }
      return safe;
    };

    const safeUpdates = applyMapping(updates || {});

    // If Supabase is available, persist first then sync local state
    if (supabase && isLikelyUuid(id)) {
      try {
        if (Object.keys(safeUpdates).length === 0) return { success: true };
        const { data: updated, error } = await supabaseUpdateWithPrune(id, safeUpdates);
        if (!error && updated) {
          const mapped = fromDbUser(updated);
          // Update local users cache
          setUsers(list => {
            const without = list.filter(u => u.id !== mapped.id);
            return [...without, mapped];
          });
          // If admin updated themselves, reflect in current session immediately
          if (user && user.id === mapped.id) {
            setUser(mapped);
          }
          // Best-effort: persist latest profile JSON to Storage for the target user
          try { await saveUserProfileJsonToStorage(mapped); } catch { }
          return { success: true, user: mapped };
        }
        // Graceful fallback to local state when target row not in DB or schema mismatch
        if (error) {
          console.warn('Supabase admin update user error (falling back to local):', error);
        }
        // Continue to local update below
      } catch (e) {
        console.warn('Supabase admin update exception:', e?.message || e);
        // Continue to local update below
      }
    }

    // Local fallback: update in-memory cache when Supabase is unavailable, id is not a UUID,
    // or the remote update failed. This keeps the admin UI functional for demo/local users.
    try {
      if (Object.keys(safeUpdates).length === 0) return { success: true };
      let updatedUser = null;
      setUsers(list => {
        const next = list.map(u => {
          if (String(u.id) !== String(id)) return u;
          const merged = { ...u, ...safeUpdates };
          updatedUser = merged;
          return merged;
        });
        return next;
      });
      if (updatedUser && user && String(user.id) === String(id)) {
        setUser(updatedUser);
      }
      return { success: true, user: updatedUser };
    } catch (e) {
      return { success: false, error: e?.message || 'Local update failed' };
    }
  };

  const addUser = (newUser) => {
    const isAdmin = !!user && (String(user.role || '').toLowerCase().startsWith('admin'));
    if (!isAdmin) {
      console.warn('addUser blocked: current user is not an Administrator');
      return;
    }
    setUsers(prev => [...prev, newUser]);
    // Persist to Supabase if available
    (async () => {
      if (!supabase) return;
      try {
        const { error } = await supabase.from('users').insert(newUser);
        if (error) console.warn('Supabase insert user error:', error);
      } catch { }
    })();
  };

  const removeUser = (id) => {
    const isAdmin = !!user && (String(user.role || '').toLowerCase().startsWith('admin'));
    if (!isAdmin) {
      console.warn('removeUser blocked: current user is not an Administrator');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    if (user && user.id === id) {
      // If removing current user, log them out
      setIsLoggedIn(false);
      setUser(null);
    }
    // Persist to Supabase if available
    (async () => {
      if (!supabase) return;
      try {
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (error) console.warn('Supabase delete user error:', error);
      } catch { }
    })();
  };

  const setUserRole = (id, role) => {
    const isAdmin = !!user && (String(user.role || '').toLowerCase().startsWith('admin'));
    if (!isAdmin) {
      console.warn('setUserRole blocked: current user is not an Administrator');
      return;
    }
    updateUserById(id, { role });
  };

  const resetPassword = (id, newPassword) => {
    const isAdmin = !!user && (String(user.role || '').toLowerCase().startsWith('admin'));
    if (!isAdmin) {
      console.warn('resetPassword blocked: current user is not an Administrator');
      return;
    }
    updateUserById(id, { password: newPassword });
  };
  // Upload a profile image to Supabase Storage and update the user with a URL (signed preferred)
  const uploadProfileImage = async (localUri) => {
    try {
      if (!supabase || !user?.id) return { success: false, error: 'Supabase unavailable or no user' };
      // Fetch file data (Expo ImagePicker returns file:// or content:// URIs)
      let res = await fetch(localUri);
      if (!res.ok) {
        try { console.warn('[uploadProfileImage] initial fetch failed', { status: res.status, uri: String(localUri) }); } catch {}
        // On some Android devices, content:// URIs are not fetchable. Copy to cache and retry.
        if (String(localUri).startsWith('content://') || String(localUri).startsWith('file://')) {
          try {
            const extGuess = (String(localUri).match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/)?.[1] || 'jpg').toLowerCase();
            const cachePath = `${FileSystem.cacheDirectory}upload_${Date.now()}.${extGuess}`;
            await FileSystem.copyAsync({ from: localUri, to: cachePath });
            res = await fetch(cachePath);
          } catch (copyErr) {
            try { console.warn('[uploadProfileImage] copy to cache failed', copyErr?.message || copyErr); } catch {}
          }
        }
      }
      if (!res.ok) {
        return { success: false, error: `Unable to read selected file after retry (${res.status})` };
      }
      // Prefer ArrayBuffer on native to avoid Blob quirks
      const arrayBuffer = await res.arrayBuffer();
      // Derive extension from headers or uri as fallback
      let headerType = (res.headers && (res.headers.get?.('Content-Type') || res.headers.get?.('content-type'))) || '';
      let ext = '';
      if (headerType && headerType.includes('/')) {
        ext = headerType.split('/')[1];
      }
      if (!ext) {
        const m = String(localUri).match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
        ext = m ? m[1] : 'jpg';
      }
      // Normalize HEIC/unknown types to jpg for broader compatibility
      let contentType = headerType || (ext ? `image/${ext}` : 'image/jpeg');
      const lowerType = String(contentType || '').toLowerCase();
      const lowerExt = String(ext || '').toLowerCase();
      if (!lowerType.startsWith('image/') || lowerType.includes('heic') || lowerType.includes('heif') || lowerExt === 'heic' || lowerExt === 'heif') {
        contentType = 'image/jpeg';
        ext = 'jpg';
      }
      const folder = `users/${user.id}`;
      // Clean up old profile image variants before uploading (keep profile.json)
      try {
        const { data: listOld } = await supabase.storage
          .from(STORAGE_BUCKET)
          .list(folder, { limit: 100, offset: 0 });
        if (Array.isArray(listOld) && listOld.length) {
          const oldPics = listOld
            .filter((f) => {
              const n = String(f?.name || '');
              return (n.startsWith('profile_') || n.startsWith('profile.')) && n !== 'profile.json';
            })
            .map((f) => `${folder}/${f.name}`);
          if (oldPics.length) {
            await supabase.storage.from(STORAGE_BUCKET).remove(oldPics);
          }
        }
      } catch { }
      // Deterministic path to keep a permanent URL; upsert overwrites
      const filePath = `${folder}/profile.${ext}`;
      // Upload with upsert to allow replacements
      const { error: upErr } = await supabase.storage.from(STORAGE_BUCKET).upload(filePath, arrayBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType,
      });
      if (upErr) {
        console.warn('Supabase storage upload error:', upErr);
        return { success: false, error: upErr };
      }
      // Build permanent public URL if bucket is public and the URL is reachable; otherwise compute a signed URL for display only.
      let publicUrl = null;
      let publicUrlReachable = false;
      {
        const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
        publicUrl = pub?.publicUrl || null;
        if (publicUrl) {
          try {
            const head = await fetch(`${publicUrl}${publicUrl.includes('?') ? '&' : '?'}_probe=${Date.now()}`, { method: 'HEAD' });
            publicUrlReachable = !!head?.ok;
            if (!publicUrlReachable) {
              // Some CDNs may not support HEAD; try GET with small timeout
              const ctrl = new AbortController();
              const to = setTimeout(() => ctrl.abort(), 2500);
              try {
                const getResp = await fetch(`${publicUrl}${publicUrl.includes('?') ? '&' : '?'}_probe=${Date.now()}`, { method: 'GET', signal: ctrl.signal });
                publicUrlReachable = !!getResp?.ok;
              } catch { }
              clearTimeout(to);
            }
          } catch { }
        }
      }
      let displayUrl = publicUrlReachable ? publicUrl : null;
      if (!displayUrl) {
        // Bucket is private: create a short-lived signed URL for display only.
        try {
          const { data: signed, error: signErr } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days
          if (!signErr) displayUrl = signed?.signedUrl || null;
        } catch { }
      }
      if (!displayUrl) return { success: false, error: 'Failed to obtain image URL' };
      // Cache-bust to ensure the just-uploaded image shows immediately
      const finalDisplayUrl = `${displayUrl}${displayUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      try { console.log('Profile image uploaded URL:', finalDisplayUrl); } catch { }
      // Persist only stable data: always store the storage path, and store a permanent public URL when available.
      const persistPatch = publicUrlReachable
        ? { profileImagePath: filePath, profileImage: publicUrl }
        : { profileImagePath: filePath };
      const resp = await updateUser(persistPatch);
      if (!resp?.success) return { success: false, error: resp?.error || 'Failed to save profile image metadata' };
      try { await saveUserProfileJsonToStorage(resp.user || user); } catch { }
      return { success: true, url: finalDisplayUrl, path: filePath };
    } catch (e) {
      console.warn('uploadProfileImage exception:', e?.message || e);
      return { success: false, error: e };
    }
  };

  // Generate a fresh URL for the current user's profile image.
  // If the bucket is public, return permanent public URL. Otherwise, re-sign.
  // If profileImagePath is missing, try to derive it from the existing URL.
  const getFreshProfileImageUrl = async (pathOverride) => {
    try {
      if (!supabase || !user?.id) return { success: false, error: 'Supabase unavailable or no user' };
      let path = pathOverride || user?.profileImagePath;
      if (!path) {
        const url = String(user?.profileImage || '');
        // Expected formats:
        //  - .../storage/v1/object/public/{bucket}/{path}
        //  - .../storage/v1/object/sign/{bucket}/{path}?token=...
        // Try to extract `{bucket}/{path}` and ensure bucket matches STORAGE_BUCKET
        const m = url.match(/\/storage\/v1\/object\/(?:public|sign)\/([^\/]+)\/([^?]+)(?:\?|$)/);
        if (m && m[1] && m[2]) {
          const bucket = decodeURIComponent(m[1]);
          const p = decodeURIComponent(m[2]);
          if (bucket === STORAGE_BUCKET) {
            path = p; // e.g. users/<id>/profile_123.jpg
          }
        }
        if (!path) return { success: false, error: 'No stored profile image path' };
        // Best-effort backfill of the derived path so future loads are stable
        try { await updateUser({ profileImagePath: path }); } catch { }
      }
      // Try to get a permanent public URL first and verify reachability
      const { data: pub } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      if (pub?.publicUrl) {
        let reachable = false;
        try {
          const head = await fetch(`${pub.publicUrl}${pub.publicUrl.includes('?') ? '&' : '?'}_probe=${Date.now()}`, { method: 'HEAD' });
          reachable = !!head?.ok;
          if (!reachable) {
            const ctrl = new AbortController();
            const to = setTimeout(() => ctrl.abort(), 2500);
            try {
              const getResp = await fetch(`${pub.publicUrl}${pub.publicUrl.includes('?') ? '&' : '?'}_probe=${Date.now()}`, { method: 'GET', signal: ctrl.signal });
              reachable = !!getResp?.ok;
            } catch { }
            clearTimeout(to);
          }
        } catch { }
        if (reachable) {
          const url = `${pub.publicUrl}${pub.publicUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
          // Persist permanent public URL if current stored URL looks signed/temporary
          try {
            const looksSigned = typeof user?.profileImage === 'string' && /\/storage\/v1\/object\/sign\//.test(user.profileImage);
            if (looksSigned) await updateUser({ profileImage: pub.publicUrl });
          } catch { }
          return { success: true, url };
        }
      }
      // Fallback: sign a temporary URL if bucket is private
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, 60 * 60 * 24 * 7); // 7 days
      if (error || !data?.signedUrl) return { success: false, error: error || 'Failed to sign URL' };
      const url = `${data.signedUrl}${data.signedUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      return { success: true, url };
    } catch (e) {
      return { success: false, error: e };
    }
  };

  // Save a JSON snapshot of the user's profile to Storage under users/{id}/profile.json
  const saveUserProfileJsonToStorage = async (uObj) => {
    if (!supabase) return { success: false, error: 'Supabase unavailable' };
    if (!uObj?.id) return { success: false, error: 'Missing user id' };
    try {
      const json = JSON.stringify(uObj);
      const blob = new Blob([json], { type: 'application/json' });
      const filePath = `users/${uObj.id}/profile.json`;
      const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePath, blob, { upsert: true, contentType: 'application/json', cacheControl: '0' });
      if (error) return { success: false, error };
      return { success: true, path: filePath };
    } catch (err) {
      console.warn('saveUserProfileJsonToStorage exception:', err?.message || err);
      return { success: false, error: err };
    }
  };

  const value = useMemo(() => ({
    isLoggedIn,
    user,
    users,
    // Helpers for UI to determine admin and editability
    isAdmin: !!user && (String(user.role || '').toLowerCase().startsWith('admin') || String(user.username || '').toLowerCase() === 'admin'),
    canAdminEditField: (field) => !IMMUTABLE_FIELDS.includes(String(field || '')),
    login,
    signup,
    logout,
    updateUser,
    updateUserById,
    uploadProfileImage,
    deleteProfileImage,
    getFreshProfileImageUrl,
    addUser,
    removeUser,
    setUserRole,
    resetPassword,
    // Forgot password (not logged-in) helpers
    requestPasswordReset: async (email) => {
      try {
        const targetEmail = String(email || '').trim();
        if (!targetEmail || !targetEmail.includes('@')) return { success: false, message: 'Enter a valid email' };
        const resp = await fetch(`${SERVER_URL}/auth/send-code`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose: 'reset_password' })
        });
        const json = await resp.json();
        if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Failed to send reset code' };
        return { success: true, expiresInSeconds: json.expiresInSeconds };
      } catch {
        return { success: false, message: 'Network error sending reset email' };
      }
    },
    confirmPasswordReset: async (email, code, newPassword) => {
      try {
        const targetEmail = String(email || '').trim();
        if (!targetEmail || !targetEmail.includes('@')) return { success: false, message: 'Enter a valid email' };
        if (!code) return { success: false, message: 'Enter verification code' };
        if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password too short' };
        // Verify code
        const v = await fetch(`${SERVER_URL}/auth/verify-code`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose: 'reset_password', code })
        });
        const vjson = await v.json();
        if (!v.ok || !vjson?.ok) return { success: false, message: vjson?.error || 'Invalid or expired code' };
        // Update password in Supabase by email
        if (!supabase) return { success: false, message: 'Supabase unavailable' };
        const { data, error } = await supabase
          .from('users')
          .update({ password: newPassword })
          .eq('email', targetEmail)
          .select('*')
          .maybeSingle();
        if (error) return { success: false, message: error.message };
        if (!data) return { success: false, message: 'Account not found for this email' };
        return { success: true };
      } catch (e) {
        return { success: false, message: 'Unexpected error completing reset' };
      }
    },
    // Verification helpers
    requestVerificationCode: async (purpose, emailOverride) => {
      try {
        const targetEmail = String(emailOverride || user?.email || '').trim();
        if (!targetEmail) return { success: false, message: 'No email available for verification' };
        const resp = await fetch(`${SERVER_URL}/auth/send-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose })
        });
        const json = await resp.json();
        if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Failed to send code' };
        return { success: true, expiresInSeconds: json.expiresInSeconds };
      } catch (e) {
        return { success: false, message: 'Network error sending code' };
      }
    },
    // Username change flow helpers
    requestUsernameChangeFlow: async (newUsername, password) => {
      try { return await requestUsernameChange({ newUsername, password }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    confirmUsernameChangeFlow: async (newUsername, code) => {
      try { return await confirmUsernameChange({ newUsername, code }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    verifyCode: async (purpose, code, emailOverride) => {
      try {
        const targetEmail = String(emailOverride || user?.email || '').trim();
        if (!targetEmail) return { success: false, message: 'No email available for verification' };
        const resp = await fetch(`${SERVER_URL}/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose, code })
        });
        const json = await resp.json();
        if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Invalid or expired code' };
        return { success: true };
      } catch {
        return { success: false, message: 'Network error verifying code' };
      }
    },
    // Email change flow helpers (request requires current password)
    requestEmailChangeFlow: async (newEmail, password) => {
      try { return await requestEmailChange({ newEmail, password }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    confirmEmailChangeFlow: async (newEmail, code) => {
      try { return await confirmEmailChange({ newEmail, code }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    changePasswordWithVerification: async (newPassword, code) => {
      if (!newPassword || newPassword.length < 6) return { success: false, message: 'Password too short' };
      const v = await (async () => {
        const targetEmail = String(user?.email || '').trim();
        if (!targetEmail) return { success: false, message: 'No email on file' };
        try {
          const resp = await fetch(`${SERVER_URL}/auth/verify-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, purpose: 'change_password', code })
          });
          const json = await resp.json();
          if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Invalid code' };
          return { success: true };
        } catch { return { success: false, message: 'Network error' }; }
      })();
      if (!v.success) return v;
      const r = await updateUser({ password: newPassword });
      if (!r?.success) return { success: false, message: 'Failed to update password' };
      return { success: true };
    },
    changeEmailWithVerification: async (newEmail, code) => {
      // UI is expected to disable direct email change for normal users. Keep method for future admin tooling.
      if (!newEmail || !newEmail.includes('@')) return { success: false, message: 'Invalid email' };
      const v = await (async () => {
        // Verification code is sent to the NEW email, so verify against newEmail
        const targetEmail = String(newEmail || '').trim();
        try {
          const resp = await fetch(`${SERVER_URL}/auth/verify-code`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, purpose: 'change_email', code })
          });
          const json = await resp.json();
          if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Invalid code' };
          return { success: true };
        } catch { return { success: false, message: 'Network error' }; }
      })();
      if (!v.success) return v;
      // For verified email change, bypass immutable whitelist and update directly via Supabase
      try {
        const { data, error } = await supabase
          .from('users')
          .update({ email: newEmail })
          .eq('id', user.id)
          .select('*')
          .single();
        if (error) return { success: false, message: error.message };
        // Sync local state
        setUser((prev) => ({ ...(prev || {}), email: data.email }));
        try { await AsyncStorage.setItem(STORAGE_KEYS.userSnapshot, JSON.stringify(data)); } catch { }
        return { success: true };
      } catch (e) {
        return { success: false, message: 'Unexpected error updating email' };
      }
    },
    updateEmailWithVerification: async (newEmail, code) => {
      return await value.changeEmailWithVerification(newEmail, code);
    },
    // Account deletion flow helpers (request requires current password)
    requestAccountDeletionFlow: async (password) => {
      try { return await requestAccountDeletion({ password }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    confirmAccountDeletionFlow: async (code) => {
      try { return await confirmAccountDeletion({ code }); }
      catch { return { success: false, message: 'Unexpected error' }; }
    },
    deleteAccountWithVerification: async (code) => {
      const targetEmail = String(user?.email || '').trim();
      if (!user?.id) return { success: false, message: 'No active user' };
      if (!targetEmail) return { success: false, message: 'No email on file' };
      try {
        const resp = await fetch(`${SERVER_URL}/auth/verify-code`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, purpose: 'delete_account', code })
        });
        const json = await resp.json();
        if (!resp.ok || !json?.ok) return { success: false, message: json?.error || 'Invalid code' };
      } catch { return { success: false, message: 'Network error' }; }
      // Delete from Supabase users and cleanup storage folder
      try {
        if (supabase) {
          try {
            // Remove storage folder users/{id}
            const folder = `users/${user.id}`;
            const { data: list } = await supabase.storage.from(STORAGE_BUCKET).list(folder, { limit: 100, offset: 0 });
            if (Array.isArray(list) && list.length) {
              await supabase.storage.from(STORAGE_BUCKET).remove(list.map(f => `${folder}/${f.name}`));
            }
          } catch { }
          await supabase.from('users').delete().eq('id', user.id);
        }
      } catch { }
      logout();
      return { success: true };
    },
  }), [isLoggedIn, user, users]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
