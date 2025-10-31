// src/components/dashboard/AdminDashboard.jsx

import React, { useEffect, useState } from 'react';
import API from '../../api';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats] = useState({ donors: 0, blood: {}, requests: 0 });

  useEffect(() => {
    const fetchData = async () => {
      const donorsRes = await API.get('profiles/?user_type=Donor');
      const banksRes = await API.get('bloodbanks/');
      const requestsRes = await API.get('requests/');

      const bloodAvailability = {};
      banksRes.data.forEach(bank => {
        for (const [bg, qty] of Object.entries(bank.available_blood)) {
          bloodAvailability[bg] = (bloodAvailability[bg] || 0) + qty;
        }
      });

      setStats({
        donors: donorsRes.data.length,
        blood: bloodAvailability,
        requests: requestsRes.data.length
      });
    };
    fetchData();
  }, []);

  const data = {
    labels: Object.keys(stats.blood),
    datasets: [
      {
        label: 'Available Units',
        data: Object.values(stats.blood),
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total Donors: {stats.donors}</p>
      <p>Total Requests: {stats.requests}</p>
      <h2>Blood Availability</h2>
      <Bar data={data} />
    </div>
  );
};

export default AdminDashboard;
