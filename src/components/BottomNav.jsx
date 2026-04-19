import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BottomNav.css';

const BottomNav = ({ active }) => {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <button 
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="nav-icon">🏠</span>
        <span className="nav-label">Home</span>
      </button>
      <button 
        className={`nav-item ${active === 'orders' ? 'active' : ''}`}
        onClick={() => navigate('/orders')}
      >
        <span className="nav-icon">📋</span>
        <span className="nav-label">Orders</span>
      </button>
      <button 
        className={`nav-item ${active === 'membership' ? 'active' : ''}`}
        onClick={() => navigate('/my-subscriptions')}
      >
        <span className="nav-icon">💳</span>
        <span className="nav-label">Subscriptions</span>
      </button>
      <button 
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span className="nav-icon">👤</span>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
