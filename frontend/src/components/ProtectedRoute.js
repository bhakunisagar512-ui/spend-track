import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ background: '#0e0f12', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", color: '#8a8aa8', fontSize: 14 }}>
        Loading...
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
