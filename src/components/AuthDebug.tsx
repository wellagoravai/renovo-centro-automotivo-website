import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export const AuthDebug: React.FC = () => {
  const { token, user, isAuthenticated, hasPermission } = useAuth();
  const [localStorageToken, setLocalStorageToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('token');
    setLocalStorageToken(stored);
  }, [token]);

  // Only show in development mode
  const isDevelopment = false; // Change to true to show debug panel
  
  if (!isDevelopment) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      background: '#f0f0f0',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
      fontSize: '12px',
      maxWidth: '400px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔍 Auth Debug Info</h4>
      <div><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
      <div><strong>Token exists:</strong> {token ? '✅ Yes' : '❌ No'}</div>
      <div><strong>localStorage token:</strong> {localStorageToken ? '✅ Yes' : '❌ No'}</div>
      {user && (
        <>
          <div><strong>User:</strong> {user.fullName}</div>
          <div><strong>Role:</strong> {user.role}</div>
          <div><strong>Permissions:</strong> {user.permissions}</div>
          <div><strong>Can create orders:</strong> {hasPermission('orders.write') ? '✅ Yes' : '❌ No'}</div>
        </>
      )}
      {!isAuthenticated && (
        <div style={{ color: 'red', marginTop: '10px' }}>
          ⚠️ Not authenticated! Please login first.
        </div>
      )}
    </div>
  );
};