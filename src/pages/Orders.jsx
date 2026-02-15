import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradeOrder, setUpgradeOrder] = useState(null);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [selectedUpgrade, setSelectedUpgrade] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    // Get phone number from localStorage (stored during login)
    const phoneNumber = localStorage.getItem('userPhone') || '9010340125';
    const authToken = localStorage.getItem('authToken');
    
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/by-phone?phone=${phoneNumber}`, {
        method: 'GET',
        mode: 'cors',
        headers: headers
      });

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      const parsed = contentType.includes('application/json') && responseText
        ? JSON.parse(responseText)
        : null;

      if (response.ok) {
        const data = parsed || [];
        setOrders(data);
        setError('');
      } else {
        if (response.status === 403) {
          setError('Unauthorized. Please login again.');
        } else {
          setError((parsed && parsed.message) || 'Failed to fetch orders');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Fetch Orders Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (date, time) => {
    if (!date || !time) return 'Not scheduled';
    // Format: DD-MMM-YYYY, HH:MM AM/PM
    const dateObj = new Date(date);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}, ${time}`;
  };

  const getCarIcon = (carType) => {
    const carIcons = {
      'SEDAN': '🚗',
      'HATCHBACK': '🚗',
      'SUV': '🚙',
      'MUV': '🚌',
      'default': '🚗'
    };
    return carIcons[carType] || carIcons['default'];
  };

  const getStatusLabel = (bookingDate, timeSlot) => {
    if (!bookingDate || !timeSlot) return 'Not scheduled';
    const bookingDateTime = new Date(`${bookingDate}T${timeSlot.split('-')[0]}`);
    const now = new Date();
    return bookingDateTime > now ? `Scheduled: ${timeSlot}` : 'Completed';
  };

  const normalizeWashType = (value) => String(value || '').toLowerCase();

  const getUpgradeOptions = (washType) => {
    const current = normalizeWashType(washType);
    if (current === 'basic') return ['Foam', 'Premium'];
    if (current === 'foam') return ['Premium'];
    return [];
  };

  const handleOpenUpgrade = (order) => {
    const options = getUpgradeOptions(order?.washType);
    setUpgradeOrder(order);
    setUpgradeOptions(options);
    setSelectedUpgrade(options[0] || '');
    setUpgradeError('');
    setShowUpgradePopup(true);
  };

  const handleConfirmUpgrade = async () => {
    if (!upgradeOrder || !selectedUpgrade) {
      setUpgradeError('Please select a wash type to upgrade.');
      return;
    }

    setUpgrading(true);
    setUpgradeError('');
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/${upgradeOrder.id}/upgrade`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ washType: selectedUpgrade })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setUpgradeError(data?.message || 'Failed to upgrade booking');
        return;
      }

      setShowUpgradePopup(false);
      setUpgradeOrder(null);
      setSelectedUpgrade('');
      await fetchOrders();
    } catch (err) {
      setUpgradeError('Failed to upgrade booking');
    } finally {
      setUpgrading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="orders-header">
        <div className="avatar">
          <img src="/images/user-avatar.png" alt="User" />
        </div>
        <h1 className="orders-title">Your orders</h1>
      </header>

      {/* Orders List */}
      <div className="orders-list">
        {loading && <p className="loading-message">Loading orders...</p>}
        {error && <p className="error-message">{error}</p>}
        {!loading && !error && orders.length === 0 && (
          <div 
            onClick={() => navigate('/services')}
            style={{
              background: 'linear-gradient(135deg, #5E4DB2 0%, #764ba2 100%)',
              borderRadius: '15px',
              padding: '40px 20px',
              textAlign: 'center',
              color: 'white',
              cursor: 'pointer',
              marginTop: '30px',
              boxShadow: '0 8px 24px rgba(94, 77, 178, 0.3)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(94, 77, 178, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(94, 77, 178, 0.3)';
            }}
          >
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>😢</div>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px', margin: '0 0 10px 0' }}>
              Oops! No Orders Found
            </h2>
            <p style={{ fontSize: '14px', marginBottom: '5px', opacity: 0.95 }}>
              Make your first booking and get
            </p>
            <p style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px', margin: '5px 0 15px 0' }}>
              <span className="bonus-dancing" style={{ color: '#FFD700' }}>💰 ₹20 Signup Bonus 💰</span>
            </p>
            <p style={{ fontSize: '13px', opacity: 0.85 }}>
              Tap to book your first car wash
            </p>
          </div>
        )}
        {!loading && !error && orders.map((order, index) => (
          (() => {
            const status = String(order.status || '').toLowerCase();
            const isCancelled = status === 'cancelled';
            const isUpgraded = String(order.upgradeStatus || '').toLowerCase() === 'upgraded' || order.isUpgraded === true;
            
            // Check if booking is in the future (not completed/past)
            const isFutureBooking = (() => {
              if (!order.bookingDate || !order.timeSlot) return false;
              try {
                const bookingDateTime = new Date(`${order.bookingDate}T${order.timeSlot.split('-')[0]}`);
                return bookingDateTime > new Date();
              } catch {
                return false;
              }
            })();
            
            // Show upgrade button if: not cancelled, not upgraded, and is future booking
            const isBooked = isFutureBooking && !isCancelled && !isUpgraded;

            return (
          <div key={order.id || index} className="order-card">
            <div className="order-main-info">
              <div className="order-icon">{getCarIcon(order.carType)}</div>
              <div className="order-details">
                <p className="order-id">Order#: {order.id}</p>
                <p className="order-service">{order.washType}</p>
                <p className="order-date">{getStatusLabel(order.bookingDate, order.timeSlot)}</p>
              </div>
              <div className="order-price">Rs.{order.payableAmount}/-</div>
            </div>
            <div className="order-secondary-info">
              <div className="info-row">
                <span className="info-label">Car Type:</span>
                <span className="info-value">{order.carType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Car Number:</span>
                <span className="info-value">{order.carNumber}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Service Type:</span>
                <span className="info-value">{order.serviceType}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Booking Date:</span>
                <span className="info-value">{order.bookingDate}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Time Slot:</span>
                <span className="info-value">{order.timeSlot}</span>
              </div>
            </div>
            <div className="order-actions">
              {isCancelled ? (
                <div className="cancelled-status">Cancelled</div>
              ) : isBooked ? (
                <button
                  className="upgrade-btn"
                  onClick={() => handleOpenUpgrade(order)}
                >
                  Upgrade
                </button>
              ) : (
                <button 
                  className="reschedule-btn"
                  onClick={() => navigate(`/order-detail/${order.id}`)}
                >
                  Re-schedule/Cancel
                </button>
              )}
              <button 
                className="details-btn"
                onClick={() => navigate(`/order-detail/${order.id}`)}
              >
                Details&gt;&gt;
              </button>
            </div>
          </div>
            );
          })()
        ))}
      </div>

      {showUpgradePopup && (
        <div className="modal-overlay" onClick={() => setShowUpgradePopup(false)}>
          <div className="upgrade-modal" onClick={(e) => e.stopPropagation()}>
            <div className="upgrade-header">
              <button className="upgrade-back-btn" onClick={() => setShowUpgradePopup(false)}>←</button>
              <h3>Upgrade Wash Type</h3>
              <div className="upgrade-spacer"></div>
            </div>

            <div className="upgrade-body">
              {upgradeOptions.length === 0 ? (
                <p className="upgrade-empty">No upgrade available for this booking.</p>
              ) : (
                <div className="upgrade-options">
                  {upgradeOptions.map((option) => (
                    <button
                      key={option}
                      className={`upgrade-option ${selectedUpgrade === option ? 'active' : ''}`}
                      onClick={() => setSelectedUpgrade(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {upgradeError && <p className="upgrade-error">{upgradeError}</p>}

              <button
                className="upgrade-confirm-btn"
                onClick={handleConfirmUpgrade}
                disabled={upgrading || upgradeOptions.length === 0 || !selectedUpgrade}
              >
                {upgrading ? 'Updating...' : 'Update Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="orders" />
    </div>
  );
};

export default Orders;
