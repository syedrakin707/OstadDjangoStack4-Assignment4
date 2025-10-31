// src/components/DonorRegister.jsx

import React, { useState, useContext } from 'react';
import API from '../api';
import { AuthContext } from '../contexts/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const DonorRegister = () => {
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    blood_group: 'A+',
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await API.post('register/donor/', formData);
      // Auto-login after successful registration
      await login(formData.username, formData.password);
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please check your data.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ccc', borderRadius: 5 }}>
      <h2>Donor Registration</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        {['username', 'email', 'first_name', 'last_name', 'password'].map((field) => (
          <div key={field} style={{ marginBottom: 10 }}>
            <label>{field.replace('_', ' ').toUpperCase()}</label>
            <input
              type={field === 'password' ? 'password' : 'text'}
              name={field}
              value={formData[field]}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
        ))}
        <div style={{ marginBottom: 10 }}>
          <label>Blood Group</label>
          <select name="blood_group" value={formData.blood_group} onChange={handleChange} style={{ width: '100%', padding: 8 }}>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <button type="submit" style={{ padding: 10, width: '100%' }}>Register</button>
      </form>
    </div>
  );
};

export default DonorRegister;
