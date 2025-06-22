'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  // Authenticated fetch function that includes Authorization header
  const authenticatedFetch = async (url, options = {}) => {
    const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
    
    console.log('[AuthenticatedFetch] Making request:', {
      url,
      method: options.method || 'GET',
      currentUser: currentUser ? {
        id: currentUser.id,
        username: currentUser.username,
        role: currentUser.role
      } : null
    });
    
    if (!currentUser || !currentUser.id) {
      console.error('[AuthenticatedFetch] User not authenticated');
      throw new Error('User not authenticated');
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentUser.id}`,
      ...options.headers,
    };

    console.log('[AuthenticatedFetch] Request headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      console.log('[AuthenticatedFetch] Response received:', {
        url,
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return response;
    } catch (error) {
      console.error('[AuthenticatedFetch] Network error:', {
        url,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, authenticatedFetch }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);