import React from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Services.css';

const Services = () => {
  const navigate = useNavigate();

  const handleServiceClick = (serviceName) => {
    if (serviceName === 'Home') {
      navigate('/booking');
    } else {
      navigate('/select-center');
    }
  };

  const services = [
    {
      id: 1,
      name: 'Self Drive',
      description: 'Drop your car at our centre and pick it up shining. Includes washes and deep cleaning',
      price: 'Rp299.000',
      color: '#FDB515',
      icon: '🚗'
    },
    {
      id: 2,
      name: 'Home',
      description: 'Professional wash at your parking location. No queues, no driving - we come to you',
      price: 'Rp349.000',
      color: '#4FC3F7',
      icon: '🏠'
    },
    {
      id: 3,
      name: 'ASP care',
      description: 'Authorized partner care with Inspection. Perfect before road trips or after long drives',
      price: 'Rp329.000',
      color: '#FF9999',
      icon: '🔧'
    },
    {
      id: 4,
      name: 'Teflon',
      description: 'Breathe fresh air, every mile of the way!',
      price: 'Rp119.000',
      color: '#FFD54F',
      icon: '✨'
    }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <button className="back-btn-inline" onClick={() => navigate(-1)}>←</button>
        <div className="user-info">
          <div className="avatar">
            <img src="/images/user-avatar.png" alt="User" />
          </div>
          <span className="tier-badge">Good Afternoon, <span className="username">Premchand</span></span>
        </div>
      </header>

      {/* Greeting removed - moved to header */}

      {/* Services List */}
      <div className="services-list">
        {services.map(service => (
          <div 
            key={service.id} 
            className="service-item" 
            style={{ backgroundColor: service.color }}
            onClick={() => handleServiceClick(service.name)}
          >
            <div className="service-icon-large">{service.icon}</div>
            <div className="service-content">
              <h3>{service.name}</h3>
              <p>{service.description}</p>
              <div className="service-price">
                <span>start from</span>
                <h4>{service.price}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Services;
