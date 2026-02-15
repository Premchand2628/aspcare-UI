import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [totalDrops, setTotalDrops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(() => {
    return localStorage.getItem('userFirstName') || 'User';
  });

  // Drops calculation mapping
  const dropsMap = {
    'Foam-water': 50,
    'Basic-water': 30,
    'Premium-water': 300,
    'Foam-no-thanks': 40,
    'Basic-no-thanks': 20,
    'Premium-no-thanks': 200,
    'Foam-self-drive': 70,
    'Basic-self-drive': 40,
    'Premium-self-drive': 350
  };

  useEffect(() => {
    fetchAndCalculateDrops();
  }, []);

  const fetchAndCalculateDrops = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      const authToken = localStorage.getItem('authToken');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/by-phone?phone=${phone}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const total = data.reduce((sum, order) => sum + calculateDrops(order), 0);
        setTotalDrops(total);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDrops = (order) => {
    // If order is cancelled, return negative drops
    if (order.status && order.status.toLowerCase() === 'cancelled') {
      const baseDrops = getBaseDrops(order);
      return -baseDrops;
    }
    return getBaseDrops(order);
  };

  const getBaseDrops = (order) => {
    const washType = order.washType || order.serviceType || order.carWashType || order.packageType || '';
    const waterOption = order.waterOption || order.water || 'no-thanks';
    
    // Normalize wash type to match keys
    const normalizedWash = String(washType).trim().toUpperCase();
    const normalizedWater = String(waterOption).trim().toLowerCase();
    
    // Normalize water option
    let waterKey = normalizedWater;
    if (waterKey === 'yes' || waterKey === 'true' || waterKey === 'water') waterKey = 'water';
    if (waterKey === 'no' || waterKey === 'false' || waterKey === 'no-thanks') waterKey = 'no-thanks';
    if (waterKey === 'self-drive' || waterKey === 'selfdrive') waterKey = 'self-drive';

    // Normalize wash type
    let washKey = 'Foam'; // default
    if (normalizedWash.includes('FOAM')) washKey = 'Foam';
    else if (normalizedWash.includes('BASIC')) washKey = 'Basic';
    else if (normalizedWash.includes('PREMIUM')) washKey = 'Premium';

    const key = `${washKey}-${waterKey}`;
    return dropsMap[key] || 0;
  };

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem('authToken');
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('userPhone');
    // Navigate to login page
    navigate('/login');
  };

  const accountMenu = [
    { id: 1, icon: '➕', label: 'My Subscriptions', path: '/membership-detail' },
    { id: 2, icon: '💳', label: 'Payment Methods', path: '#' },
    { id: 3, icon: '🎁', label: 'Referrals', path: '/referral-details' }
  ];

  const generalMenu = [
    { id: 1, icon: '🎧', label: 'Help Center', path: '/chatbot' },
    { id: 2, icon: '🛡️', label: 'Privacy Policy & Terms of Service', path: '#' },
    { id: 3, icon: '🚪', label: 'Logout', action: 'logout' }
  ];

  return (
    <div className="page-container">
      {/* User Info Card */}
      <div className="user-card">
        <div className="user-name">
          <h2>{firstName}</h2>
          <button className="edit-btn">Edit ✏️</button>
        </div>
        <div 
          className="drops-earned"
          onClick={() => navigate('/rewards-calculation')}
          style={{ cursor: 'pointer' }}
        >
          <span className="drops-icon">💧</span>
          <span className="drops-label">Drops Earned</span>
          <span className="drops-count">{loading ? 'Loading...' : totalDrops}</span>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="rewards-section">
        <h3>Rewards & Orders</h3>
        <div className="rewards-icons">
          <div className="reward-icon" onClick={() => navigate('/rewards-calculation')} style={{ cursor: 'pointer' }}>
            <img src="/images/trophy.png" alt="Trophy" />
          </div>
          <div className="reward-icon" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
            <img src="/images/orders.png" alt="Orders" />
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="menu-section">
        <h3>Account</h3>
        {accountMenu.map(item => (
          <div 
            key={item.id} 
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-arrow">→</span>
          </div>
        ))}
      </div>

      {/* General Section */}
      <div className="menu-section">
        <h3>General</h3>
        {generalMenu.map(item => (
          <div 
            key={item.id} 
            className="menu-item"
            onClick={() => item.action === 'logout' ? handleLogout() : navigate(item.path || '#')}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-arrow">→</span>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;
