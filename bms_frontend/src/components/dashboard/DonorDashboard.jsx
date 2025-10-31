// src/components/dashboard/DonorDashboard.jsx

import React, { useEffect, useState, useContext } from 'react';
import API from '../../api';
import { AuthContext } from '../../contexts/AuthContext';

const DonorDashboard = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState({});
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch profile, available requests, and donor's offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await API.get('profile/me/');
        setProfile(profileRes.data);

        const requestsRes = await API.get('requests/?status=pending');
        setRequests(requestsRes.data);

        const offersRes = await API.get(`offers/?donor=${user.id}`);
        setOffers(offersRes.data);

        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data.');
        setLoading(false);
      }
    };
    fetchData();
  }, [user.id]);

  // Make a new offer
  const makeOffer = async (requestId) => {
    setError('');
    setSuccess('');

    try {
      const res = await API.post('offers/', { request: requestId });

      // Fetch the full request object
      const requestRes = await API.get(`requests/${requestId}/`);

      const fullOffer = {
        id: res.data.id,          // ensure Offer ID
        status: res.data.status,  // ensure Status
        donor: res.data.donor,    // donor ID
        request: requestRes.data, // full request info
        created_at: res.data.created_at || requestRes.data.created_at,
      };

      setOffers([...offers, fullOffer]);
      setRequests(requests.filter((req) => req.id !== requestId));

      setSuccess('Offer made successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to make offer.');
    }
  };

  // Delete an existing offer
  const deleteOffer = async (offerId) => {
    setError('');
    setSuccess('');

    try {
      await API.delete(`offers/${offerId}/`);
      setOffers(offers.filter((o) => o.id !== offerId));
      setSuccess('Offer deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      setError('Failed to delete offer.');
    }
  };

  // Format date safely
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return isNaN(date) ? '-' : date.toLocaleString();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container">
      <h1>Welcome, {profile.user?.username}</h1>
      <p><strong>Blood Group:</strong> {profile.blood_group}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <h2>Available Blood Requests</h2>
      {requests.length === 0 ? (
        <p>No pending requests at the moment.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Blood Group</th>
              <th>Quantity</th>
              <th>Address</th>
              <th>Requested By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const alreadyOffered = offers.some((o) => o.request.id === req.id);
              const compatible = req.blood_group === profile.blood_group;

              return (
                <tr key={req.id} style={{ opacity: compatible ? 1 : 0.6 }}>
                  <td>{req.id}</td>
                  <td>{req.blood_group}</td>
                  <td>{req.quantity}</td>
                  <td>{req.address}</td>
                  <td>{req.civilian.username}</td>
                  <td>
                    {alreadyOffered ? (
                      <span>Offer Made</span>
                    ) : (
                      <button
                        disabled={!compatible}
                        onClick={() => makeOffer(req.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: compatible ? '#28a745' : '#ccc',
                          color: 'white',
                          border: 'none',
                          borderRadius: 5,
                          cursor: compatible ? 'pointer' : 'not-allowed',
                        }}
                      >
                        Make Offer
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: '30px' }}>My Offers</h2>
      {offers.filter(o => o.donor === user.id).length === 0 ? (
        <p>You haven’t made any offers yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Offer ID</th>
              <th>Blood Group</th>
              <th>Quantity</th>
              <th>Address</th>
              <th>Requested By</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offers
              .filter(o => o.donor === user.id)
              .map((offer) => {
                const req = offer.request;
                return (
                  <tr key={offer.id}>
                    <td>{offer.id}</td>
                    <td>{req?.blood_group || '-'}</td>
                    <td>{req?.quantity || '-'}</td>
                    <td>{req?.address || '-'}</td>
                    <td>{req?.civilian?.username || '-'}</td>
                    <td>{offer.status || 'Pending'}</td>
                    <td>{formatDate(offer.created_at || req?.created_at)}</td>
                    <td>
                      <button
                        onClick={() => deleteOffer(offer.id)}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: 5,
                          cursor: 'pointer',
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DonorDashboard;
