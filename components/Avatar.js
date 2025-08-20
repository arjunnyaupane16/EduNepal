import React, { useEffect, useState } from 'react';
import { Image, Text, View } from 'react-native';
import { useAuth } from '../app/context/AuthContext';
import { useTheme } from '../app/context/ThemeContext';

function getInitials(name) {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function Avatar({
  size = 32,
  borderColor = '#007bff',
  style,
}) {
  const { user, getFreshProfileImageUrl } = useAuth();
  const { theme } = useTheme();
  const [uri, setUri] = useState(user?.profileImage || null);
  const [attemptedRefresh, setAttemptedRefresh] = useState(false);

  // Try to fetch a fresh URL based on stored path
  useEffect(() => {
    let mounted = true;
    (async () => {
      setAttemptedRefresh(false);
      // If we have a stored path, ask for a fresh url
      if (user?.profileImagePath && getFreshProfileImageUrl) {
        const res = await getFreshProfileImageUrl();
        if (mounted && res?.success && res.url) {
          setUri(res.url);
        } else if (mounted) {
          // fallback to whatever is stored (may be public) with cache-busting
          const base = user?.profileImage || null;
          if (base) {
            const sep = base.includes('?') ? '&' : '?';
            setUri(`${base}${sep}t=${Date.now()}`);
          } else {
            setUri(null);
          }
        }
      } else {
        const base = user?.profileImage || null;
        if (base) {
          const sep = base.includes('?') ? '&' : '?';
          setUri(`${base}${sep}t=${Date.now()}`);
        } else {
          setUri(null);
        }
      }
    })();
    return () => { mounted = false; };
  }, [user?.profileImagePath, user?.profileImage]);

  const sizeStyle = { width: size, height: size, borderRadius: size / 2 };

  if (!uri) {
    return (
      <View style={[{
        ...sizeStyle,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.primary || '#007bff',
      }, style]}
      >
        <Text style={{ color: '#fff', fontSize: Math.max(12, size * 0.4), fontWeight: '700' }}>
          {getInitials(user?.fullName || user?.name)}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: String(uri) }}
      style={[sizeStyle, { borderWidth: 2, borderColor }, style]}
      resizeMode="cover"
      onError={async () => {
        // One-time refresh attempt if image fails to load
        if (!attemptedRefresh && getFreshProfileImageUrl) {
          setAttemptedRefresh(true);
          try {
            const res = await getFreshProfileImageUrl();
            if (res?.success && res.url) {
              setUri(res.url);
              return;
            }
          } catch {}
        }
        // Final attempt: cache-bust current stored URL, then fallback to initials
        const base = user?.profileImage || null;
        if (base) {
          const sep = base.includes('?') ? '&' : '?';
          setUri(`${base}${sep}t=${Date.now()}`);
        } else {
          setUri(null);
        }
      }}
    />
  );
}
