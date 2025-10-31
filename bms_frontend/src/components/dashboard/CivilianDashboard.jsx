// src/components/dashboard/CivilianDashboard.jsx

import React, { useEffect, useState, useContext } from 'react';
import API from '../../api';
import LogoutButton from '../LogoutButton';
import { AuthContext } from '../../contexts/AuthContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const CivilianDashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    blood_group: 'A+',
    quantity: 1,
    address: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile & existing requests
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get('profile/me/');
        setProfile(profileRes.data);

        const requestsRes = await API.get(`requests/?civilian=${user.id}`);
        setRequests(requestsRes.data);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit new blood request
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.address.trim()) {
      setError('Address is required.');
      return;
    }

    try {
      const res = await API.post('requests/', formData);
      setRequests([...requests, res.data]);
      setSuccess('Request submitted successfully!');
      setFormData({ blood_group: 'A+', quantity: 1, address: '' });
    } catch (err) {
      console.error(err);
      setError('Failed to submit request.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1>Civilian Dashboard</h1>

      <h2>Profile Info</h2>
      <p><strong>Name:</strong> {profile.user?.first_name} {profile.user?.last_name}</p>
      <p><strong>Email:</strong> {profile.user?.email}</p>
      <p><strong>Blood Group:</strong> {profile.blood_group || 'N/A'}</p>

      <h2>Create New Blood Request</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 10 }}>
          <label>Blood Group</label>
          <select
            name="blood_group"
            value={formData.blood_group}
            onChange={handleChange}
            style={{ width: '100%', padding: 8 }}
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Quantity (Units)</label>
          <input
            type="number"
            name="quantity"
            min="1"
            value={formData.quantity}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            placeholder="Enter full address where blood is needed"
            style={{ width: '100%', padding: 8, minHeight: 60 }}
          />
        </div>

        <button type="submit" style={{ padding: 10, width: '100%' }}>Submit Request</button>
      </form>

      <h2>My Blood Donation Requests</h2>
      {requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Blood Group</th>
              <th>Quantity</th>
              <th>Address</th>
              <th>Status</th>
              <th>Blood Bank</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id}>
                <td>{req.id}</td>
                <td>{req.blood_group}</td>
                <td>{req.quantity}</td>
                <td>{req.address}</td>
                <td>{req.status}</td>
                <td>{req.blood_bank?.name || '-'}</td>
                <td>{new Date(req.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CivilianDashboard;
