import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/RewardsCalculation.css';

const RewardsCalculation = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDrops, setTotalDrops] = useState(0);
  const [flippedCard, setFlippedCard] = useState(null);

  // Sample products for redemption
  const products = {
    '200d-300d': {
      image: '/images/car-scent.png',
      name: 'Car Scent'
    },
    '300d-500d': {
      image: '/images/car-keychain.png',
      name: 'Car Keychain'
    },
    '500d-1000d': {
      image: '/images/car-seat.png',
      name: 'Car Seat Cover'
    },
    '1000d-2000d': {
      image: '/images/car-steering-cover.png',
      name: 'Steering Cover'
    }
  };

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
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
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
        const processedOrders = data.map(order => ({
          ...order,
          drops: calculateDrops(order)
        }));
        setOrders(processedOrders);
        const total = processedOrders.reduce((sum, order) => sum + order.drops, 0);
        setTotalDrops(total);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
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
    // Debug: Log all fields from order
    console.log('Order Details:', {
      id: order.id,
      washType: order.washType,
      waterOption: order.waterOption,
      serviceType: order.serviceType,
      water: order.water,
      carWashType: order.carWashType,
      packageType: order.packageType,
      allFields: Object.keys(order).map(key => `${key}: ${order[key]}`)
    });

    const washType = order.washType || order.serviceType || order.carWashType || order.packageType || '';
    const waterOption = order.waterOption || order.water || 'no-thanks';
    
    // Normalize wash type to match keys
    const normalizedWash = String(washType).trim().toUpperCase();
    const normalizedWater = String(waterOption).trim().toLowerCase();
    
    // Normalize water option
    let waterKey = normalizedWater;
    if (waterKey === 'YES' || waterKey === 'TRUE' || waterKey === 'WATER') waterKey = 'water';
    if (waterKey === 'NO' || waterKey === 'FALSE' || waterKey === 'NO-THANKS') waterKey = 'no-thanks';
    if (waterKey === 'SELF-DRIVE' || waterKey === 'SELFDRIVE') waterKey = 'self-drive';

    // Normalize wash type
    let washKey = 'Foam'; // default
    if (normalizedWash.includes('FOAM')) washKey = 'Foam';
    else if (normalizedWash.includes('BASIC')) washKey = 'Basic';
    else if (normalizedWash.includes('PREMIUM')) washKey = 'Premium';

    const key = `${washKey}-${waterKey}`;
    
    console.log(`Calculated key: ${key}, drops: ${dropsMap[key] || 0}`);
    
    return dropsMap[key] || 0;
  };

  const getDropsBadgeClass = (drops) => {
    if (drops > 0) return 'drops-positive';
    if (drops < 0) return 'drops-negative';
    return 'drops-neutral';
  };

  const getStatusBadgeClass = (status) => {
    if (!status) return 'status-completed';
    const statusLower = status.toLowerCase();
    if (statusLower === 'cancelled') return 'status-cancelled';
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'pending') return 'status-pending';
    return 'status-scheduled';
  };

  const getStatusText = (status) => {
    if (!status) return 'Completed';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="rewards-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ←
        </button>
        <h1>Rewards Calculation</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Total Drops Card */}
        <div className="total-drops-card compact">
          <div className="drops-icon-section">
            <span className="drops-icon-animated">💧</span>
          </div>
          <div className="drops-info-section">
            <p className="drops-label">Total drops earned</p>
            <p className={`drops-amount ${totalDrops >= 0 ? 'positive' : 'negative'}`}>
              {totalDrops >= 0 ? '+' : ''}{totalDrops}d
            </p>
          </div>
        </div>

        {/* Redemption Categories */}
        <div className="redemption-section compact">
          <div className="redemption-header">
            <span>Redeem rewards</span>
            <span className="redemption-tc">T&C Apply</span>
          </div>
          <div className="redemption-grid compact">
            {['200d-300d', '300d-500d', '500d-1000d', '1000d-2000d'].map((tier) => (
              <div
                key={tier}
                className={`redemption-card-wrapper ${flippedCard === tier ? 'flipped' : ''}`}
                onClick={() => setFlippedCard(flippedCard === tier ? null : tier)}
              >
                <div className="redemption-card-inner">
                  {/* Front */}
                  <div className="redemption-card-front compact">
                    <div className="card-amount">{tier}</div>
                    <div className="card-cta">Click to avail</div>
                  </div>
                  {/* Back */}
                  <div className="redemption-card-back compact">
                    <img 
                      src={products[tier].image} 
                      alt={products[tier].name}
                      className="product-image"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/100?text=Product';
                      }}
                    />
                    <div className="card-proceed">Proceed to claim</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      {/* Drops Breakdown */}
      {loading ? (
        <div className="loading-state">
          <p>Loading rewards data...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="drops-breakdown">
          <div className="drops-list">
            {orders.map((order) => (
                <div key={order.id} className="drops-item compact">
                  <div className="item-content">
                    <div className="wash-line-row">
                      <p className="wash-line">{order.washType} wash: #{order.id}</p>
                      <p className={`drops-value ${getDropsBadgeClass(order.drops)}`}>
                        {order.drops >= 0 ? '+' : ''}{order.drops}d
                      </p>
                    </div>
                    <p className="date-line">Date: {formatDate(order.bookingDate)}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">💧</div>
          <h3>No Orders Yet</h3>
          <p>Your drops will appear here once you complete a wash</p>
          <button 
            className="book-now-btn"
            onClick={() => navigate('/services')}
          >
            Book a Wash
          </button>
        </div>
      )}

      {/* Drops Guide */}
      {/* Bottom Navigation */}
      <BottomNav active="profile" />
    </div>
  );
};

export default RewardsCalculation;
