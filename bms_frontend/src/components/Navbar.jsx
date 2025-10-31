// src/components/Navbar.jsx

import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import LogoutButton from './LogoutButton';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user } = useContext(AuthContext);

  return (
    <nav style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '10px 20px',
      backgroundColor: '#2c3e50',
      color: 'white'
    }}>
      <div>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold' }}>
          Blood Management System
        </Link>
      </div>

      <div>
        {user ? (
          <>
            <span style={{ marginRight: 15 }}>
              Logged in as: <strong>{user.username}</strong> ({user.user_type || (user.is_staff ? 'Admin' : '')})
            </span>
            <LogoutButton />
          </>
        ) : (
          <>
            <Link to="/login" style={{ color: 'white', marginRight: 10 }}>Login</Link>
            <Link to="/register/donor" style={{ color: 'white', marginRight: 10 }}>Donor Register</Link>
            <Link to="/register/civilian" style={{ color: 'white' }}>Civilian Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
