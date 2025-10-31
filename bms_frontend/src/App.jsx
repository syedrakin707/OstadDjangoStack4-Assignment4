// src/App.jsx
import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthProvider from './contexts/AuthProvider';
import { AuthContext } from './contexts/AuthContext';

import Navbar from './components/Navbar';
import Login from './components/Login';
import DonorRegister from './components/DonorRegister';
import CivilianRegister from './components/CivilianRegister';
import DonorDashboard from './components/dashboard/DonorDashboard';
import CivilianDashboard from './components/dashboard/CivilianDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';

function AppContent() {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <>
        <Navbar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register/donor" element={<DonorRegister />} />
          <Route path="/register/civilian" element={<CivilianRegister />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </>
    );
  }

  const type = user.user_type;

  return (
    <>
      <Navbar />
      {user.is_staff ? (
        <AdminDashboard />
      ) : type === 'Donor' ? (
        <DonorDashboard />
      ) : type === 'Civilian' ? (
        <CivilianDashboard />
      ) : (
        <div>Unknown user type</div>
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
