import React from 'react';
import AuthenticatedProfile from './(authenticated)/Profile';

export default function Profile() {
  // Forward to the real Profile screen used in the app
  return <AuthenticatedProfile />;
}
