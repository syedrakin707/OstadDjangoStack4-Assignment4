// src/contexts/AuthProvide.jsx
import React, { useState, useEffect } from 'react';
import API from '../api';
import { AuthContext } from './AuthContext';

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    // Sync user state with localStorage on changes
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const login = async (username, password) => {
  try {
    // Step 1: Get JWT tokens
    const res = await API.post('login/', { username, password });
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);

    // Step 2: Try to fetch user profile
    try {
      const userRes = await API.get('profile/me/');
      setUser(userRes.data);
    } catch (err) {
        console.log(err)
      // Step 3: Fallback for admin/staff users
      const decodedToken = JSON.parse(atob(res.data.access.split('.')[1]));
      setUser({
        username: decodedToken.username || username,
        is_staff: true,
        user_type: null,
      });
    }
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
