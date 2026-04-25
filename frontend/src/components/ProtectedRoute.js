import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import themeModule from '../tailwindTheme';

const { appTheme: T } = themeModule;

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.fonts.display, color: T.text2, fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
