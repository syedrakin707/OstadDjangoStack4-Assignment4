// src/components/LogoutButton.jsx

import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LogoutButton = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login'); // redirect to login page
  };

  return (
    <button
      onClick={handleLogout}
      style={{ padding: '8px 16px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: 5 }}
    >
      Logout
    </button>
  );
};
export default LogoutButton;
