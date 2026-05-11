import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import PaymentMethodModal from '../components/PaymentMethodModal';
import { readBookingsCache, writeBookingsCache, readBookingsCacheEntry, readStaleBookingsCache } from '../utils/bookingsCache';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { fetchWithTimeout } from '../utils/api';
import '../styles/Orders.css';

const Orders = () => {
  const ORDERS_BATCH_SIZE = 3;
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [visibleOrdersCount, setVisibleOrdersCount] = useState(ORDERS_BATCH_SIZE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [upgradeOrder, setUpgradeOrder] = useState(null);
  const [upgradeOptions, setUpgradeOptions] = useState([]);
  const [selectedUpgrade, setSelectedUpgrade] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [upgradePrice, setUpgradePrice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [showUpgradePayment, setShowUpgradePayment] = useState(false);
  const [noPhone, setNoPhone] = useState(false);
  const [notLoggedIn, setNotLoggedIn] = useState(false);
  const [activeFilter, setActiveFilter] = useState('upcoming');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filterCarType, setFilterCarType] = useState('');
  const [filterWashType, setFilterWashType] = useState('');
  const [filterCarNumber, setFilterCarNumber] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setVisibleOrdersCount(ORDERS_BATCH_SIZE);
  }, [orders]);

  const fetchOrders = async ({ forceRefresh = false } = {}) => {
    const authToken = getValidatedAuthToken();
    
    if (!authToken) {
      setNotLoggedIn(true);
      setLoading(false);
      return;
    }

    const userPhone = localStorage.getItem('userPhone');
    if (!userPhone || userPhone === 'null' || userPhone.trim() === '') {
      setNoPhone(true);
      setLoading(false);
      return;
    }

    if (!forceRefresh) {
      // Render fresh cache instantly and skip the network call.
      const cached = readBookingsCacheEntry();
      if (cached?.data && !cached.isStale) {
        setOrders(cached.data);
        setError('');
        setLoading(false);
        return;
      }
      // Stale cache: still show it immediately, then revalidate in background.
      if (cached?.data) {
        setOrders(cached.data);
        setError('');
        setLoading(false);
      }
    }

    try {
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      });

      const response = await fetchWithTimeout('/bookings/me', {
        method: 'GET',
        mode: 'cors',
        headers: headers
      }, 10000);

      const contentType = response.headers.get('content-type') || '';
      const responseText = await response.text();
      const parsed = contentType.includes('application/json') && responseText
        ? JSON.parse(responseText)
        : null;

      if (response.ok) {
        const data = parsed || [];
        setOrders(data);
        writeBookingsCache(data);
        setError('');
      } else {
        if (response.status === 403) {
          setNotLoggedIn(true);
        } else {
          // Backend slow / 504 — fall back to stale cache rather than blanking.
          const stale = readStaleBookingsCache();
          if (stale && stale.length) {
            setOrders(stale);
            setError('');
          } else {
            const errMsg = (parsed && parsed.message) || 'Failed to fetch orders';
            if (errMsg.toLowerCase().includes('phone')) {
              setNoPhone(true);
            } else {
              setError(errMsg);
            }
          }
        }
      }
    } catch (err) {
      // Network error / timeout — fall back to stale cache.
      const stale = readStaleBookingsCache();
      if (stale && stale.length) {
        setOrders(stale);
        setError('');
      } else {
        setError('Network error. Please check your connection.');
      }
      console.warn('Fetch Orders Error:', err?.name || err);
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
    return '';
  };

  const getOrderRef = (order) => {
    const bookingCode = String(order?.bookingCode || '').trim();
    return bookingCode || order?.id;
  };

  const normalizeWashType = (value) => String(value || '').toLowerCase();

  const getStatusCategory = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CANCELLED') return 'cancelled';
    if (s === 'COMPLETED' || s === 'CLOSED') return 'completed';
    if (s === 'IN_SERVICING') return 'inServicing';
    return 'upcoming';
  };

  const filteredOrders = orders.filter(o => {
    if (getStatusCategory(o.status) !== activeFilter) return false;
    if (filterCarType && String(o.carType || '').toUpperCase() !== filterCarType.toUpperCase()) return false;
    if (filterWashType && String(o.washType || '').toUpperCase() !== filterWashType.toUpperCase()) return false;
    if (filterCarNumber && !String(o.carNumber || '').toUpperCase().includes(filterCarNumber.toUpperCase())) return false;
    if (filterDate && String(o.bookingDate || '') !== filterDate) return false;
    return true;
  });
  const visibleOrders = filteredOrders.slice(0, visibleOrdersCount);
  const canShowMoreOrders = visibleOrdersCount < filteredOrders.length;

  const getUpgradeOptions = (washType) => {
    const current = normalizeWashType(washType);
    if (current === 'basic') return ['Foam', 'Premium'];
    if (current === 'foam') return ['Premium'];
    return [];
  };

  const handleOpenUpgrade = async (order) => {
    const options = getUpgradeOptions(order?.washType);
    setUpgradeOrder(order);
    setUpgradeOptions(options);
    setSelectedUpgrade(options[0] || '');
    setUpgradeError('');
    setCurrentPrice(null);
    setUpgradePrice(null);
    setShowUpgradePopup(true);

    // Fetch current wash price
    if (order?.carType && order?.washType) {
      fetchUpgradePrices(order.carType, order.washType, options[0] || '');
    }
  };

  const fetchRate = async (vehicleType, washLevel) => {
    try {
      const params = new URLSearchParams({ vehicleType, washLevel: washLevel.toUpperCase() });
      const headers = withAuthHeader({ Accept: 'application/json' });
      const response = await fetch(`/rates?${params.toString()}`, { method: 'GET', headers });
      if (!response.ok) return null;
      const data = await response.json();
      return data.amount != null ? Number(data.amount) : null;
    } catch {
      return null;
    }
  };

  const fetchUpgradePrices = async (carType, currentWash, upgradeWash) => {
    if (!carType || !currentWash || !upgradeWash) return;
    setPriceLoading(true);
    try {
      const [cur, upg] = await Promise.all([
        fetchRate(carType, currentWash),
        fetchRate(carType, upgradeWash)
      ]);
      setCurrentPrice(cur);
      setUpgradePrice(upg);
    } finally {
      setPriceLoading(false);
    }
  };

  const handleUpgradeOptionChange = (option) => {
    setSelectedUpgrade(option);
    if (upgradeOrder?.carType) {
      fetchUpgradePrices(upgradeOrder.carType, upgradeOrder.washType, option);
    }
  };

  const priceDifference = (upgradePrice != null && currentPrice != null) ? Math.max(0, upgradePrice - currentPrice) : null;

  const handleConfirmUpgrade = () => {
    if (!upgradeOrder || !selectedUpgrade) {
      setUpgradeError('Please select a wash type to upgrade.');
      return;
    }
    setShowUpgradePopup(false);
    setShowUpgradePayment(true);
  };

  const handleUpgradePaymentSelect = async (method) => {
    setShowUpgradePayment(false);
    setUpgrading(true);
    setUpgradeError('');
    try {
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch(`/bookings/${upgradeOrder.id}/upgrade`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ washType: selectedUpgrade, paymentMethod: method })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setUpgradeError(data?.message || 'Failed to upgrade booking');
        setShowUpgradePopup(true);
        return;
      }

      setUpgradeOrder(null);
      setSelectedUpgrade('');
      await fetchOrders({ forceRefresh: true });
    } catch (err) {
      setUpgradeError('Failed to upgrade booking');
      setShowUpgradePopup(true);
    } finally {
      setUpgrading(false);
    }
  };

  const statusCounts = React.useMemo(() => {
    const counts = { upcoming: 0, inServicing: 0, completed: 0, cancelled: 0 };
    orders.forEach(o => {
      const s = String(o.status || '').toUpperCase();
      if (s === 'CANCELLED') counts.cancelled++;
      else if (s === 'COMPLETED' || s === 'CLOSED') counts.completed++;
      else if (s === 'IN_SERVICING') counts.inServicing++;
      else counts.upcoming++;
    });
    return counts;
  }, [orders]);

  const filterOptions = React.useMemo(() => {
    const carTypes = [...new Set(orders.map(o => o.carType).filter(Boolean))];
    const washTypes = [...new Set(orders.map(o => o.washType).filter(Boolean))];
    const carNumbers = [...new Set(orders.map(o => o.carNumber).filter(Boolean))];
    return { carTypes, washTypes, carNumbers };
  }, [orders]);

  const activeSearchCount = [filterCarType, filterWashType, filterCarNumber, filterDate].filter(Boolean).length;

  const clearAllFilters = () => {
    setFilterCarType('');
    setFilterWashType('');
    setFilterCarNumber('');
    setFilterDate('');
    setVisibleOrdersCount(ORDERS_BATCH_SIZE);
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="orders-ux-header">
        <header className="orders-header">
          <button className="orders-back-btn" onClick={() => navigate(-1)}>←</button>
          <div className="orders-header-copy">
            <h1 className="orders-title">Your orders</h1>
          </div>
          {!loading && !notLoggedIn && orders.length > 0 && (
            <button className={`orders-header-filter-btn${showFilterPanel ? ' active' : ''}${activeSearchCount > 0 ? ' has-filters' : ''}`} onClick={() => setShowFilterPanel(prev => !prev)}>
              🔍
              {activeSearchCount > 0 && <span className="header-filter-badge">{activeSearchCount}</span>}
            </button>
          )}
        </header>
      </div>

      {/* Status Summary Blocks */}
      {!loading && !notLoggedIn && orders.length > 0 && (
        <div className="orders-stats-row">
          <div className={`orders-stat-card${activeFilter === 'upcoming' ? ' stat-active' : ''}`} onClick={() => { setActiveFilter('upcoming'); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
            <span className="orders-stat-count stat-upcoming">{statusCounts.upcoming}</span>
            <span className="orders-stat-label">UPCOMING</span>
          </div>
          <div className={`orders-stat-card${activeFilter === 'inServicing' ? ' stat-active' : ''}`} onClick={() => { setActiveFilter('inServicing'); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
            <span className="orders-stat-count stat-in-servicing">{statusCounts.inServicing}</span>
            <span className="orders-stat-label">IN SERVICING</span>
          </div>
          <div className={`orders-stat-card${activeFilter === 'completed' ? ' stat-active' : ''}`} onClick={() => { setActiveFilter('completed'); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
            <span className="orders-stat-count stat-completed">{statusCounts.completed}</span>
            <span className="orders-stat-label">COMPLETED</span>
          </div>
          <div className={`orders-stat-card${activeFilter === 'cancelled' ? ' stat-active' : ''}`} onClick={() => { setActiveFilter('cancelled'); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
            <span className="orders-stat-count stat-cancelled">{statusCounts.cancelled}</span>
            <span className="orders-stat-label">CANCELLED</span>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      {showFilterPanel && !loading && orders.length > 0 && (
        <div className="orders-filter-panel">
          <div className="filter-row">
            <div className="filter-field">
              <label className="filter-label">Car Type</label>
              <select className="filter-select" value={filterCarType} onChange={e => { setFilterCarType(e.target.value); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
                <option value="">All</option>
                {filterOptions.carTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-label">Wash Type</label>
              <select className="filter-select" value={filterWashType} onChange={e => { setFilterWashType(e.target.value); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }}>
                <option value="">All</option>
                {filterOptions.washTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="filter-row">
            <div className="filter-field">
              <label className="filter-label">Car Number</label>
              <input className="filter-input" type="text" placeholder="e.g. AP01TS4587" value={filterCarNumber} onChange={e => { setFilterCarNumber(e.target.value); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }} />
            </div>
            <div className="filter-field">
              <label className="filter-label">Date</label>
              <input className="filter-input" type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setVisibleOrdersCount(ORDERS_BATCH_SIZE); }} />
            </div>
          </div>
          {activeSearchCount > 0 && (
            <button className="filter-clear-btn" onClick={clearAllFilters}>Clear all filters</button>
          )}
        </div>
      )}

      {/* Orders List */}
      <div className="orders-list">
        {loading && <p className="loading-message">Loading orders...</p>}
        {!loading && notLoggedIn && (
          <div className="orders-login-prompt">
            <div className="orders-login-icon">🎉</div>
            <h2 className="orders-login-title">Get ₹20 Off on your first order!</h2>
            <p className="orders-login-desc">Login or signup to book your first wash and claim your discount</p>
            <button className="orders-login-btn" onClick={() => navigate('/login', { state: { from: { pathname: '/orders' } } })}>Login / Signup</button>
          </div>
        )}
        {error && !noPhone && !notLoggedIn && <p className="error-message">{error}</p>}
        {!loading && !error && (orders.length === 0 || noPhone) && (
          <div 
            onClick={() => navigate('/')}
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
        {!loading && !error && visibleOrders.map((order, index) => (
          (() => {
            const status = String(order.status || '').toLowerCase();
            const isCancelled = status === 'cancelled';
            const isCompleted = status === 'completed';
            const isUpgraded = String(order.upgradeStatus || '').toLowerCase() === 'upgraded' || order.isUpgraded === true;
            const displayOrderCode = getOrderRef(order);

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
            const isBooked = isFutureBooking && !isCancelled && !isUpgraded && !isCompleted;

            return (
          <div key={order.id || index} className="order-card">
            <div className="order-main-info">
              <div className="order-icon">{getCarIcon(order.carType)}</div>
              <div className="order-details">
                <p className="order-id">Order#: {displayOrderCode}</p>
                <p className="order-service">{order.washType}</p>
              </div>
              <div className="order-service-label">{order.serviceType}</div>
            </div>
            <div className="order-secondary-info compact-info-block">
              <div className="info-row-inline">
                <span className="info-label-inline">Car Type:</span>
                <span className="info-value-inline">{order.carType}</span>
                <span className="info-label-inline">Car Number:</span>
                <span className="info-value-inline">{order.carNumber}</span>
              </div>
              <div className="info-row-inline">
                <span className="info-label-inline">Booking Date:</span>
                <span className="info-value-inline">{order.bookingDate}</span>
                <span className="info-label-inline">Time Slot:</span>
                <span className="info-value-inline">{order.timeSlot}</span>
              </div>
            </div>
            <div className="order-actions">
              {isCancelled ? (
                <div className="cancelled-status">Cancelled</div>
              ) : isCompleted ? (
                <></>
              ) : status === 'in_servicing' ? (
                <div className="in-servicing-status">IN_SERVICING</div>
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

        {!loading && !error && canShowMoreOrders && (
          <button
            type="button"
            className="show-more-orders-btn"
            onClick={() => setVisibleOrdersCount((prev) => prev + ORDERS_BATCH_SIZE)}
          >
            Show more
          </button>
        )}
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
                      onClick={() => handleUpgradeOptionChange(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {selectedUpgrade && (
                <div className="upgrade-price-diff">
                  {priceLoading ? (
                    <p className="upgrade-price-loading">Fetching price...</p>
                  ) : priceDifference != null ? (
                    <p className="upgrade-price-text">
                      <span className="upgrade-price-label">{upgradeOrder?.washType} → {selectedUpgrade}</span>
                      <span className="upgrade-price-value">₹{priceDifference.toLocaleString('en-IN')}</span>
                    </p>
                  ) : null}
                </div>
              )}

              {upgradeError && <p className="upgrade-error">{upgradeError}</p>}

              <button
                className="upgrade-confirm-btn"
                onClick={handleConfirmUpgrade}
                disabled={upgrading || upgradeOptions.length === 0 || !selectedUpgrade || priceLoading}
              >
                {upgrading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="orders" />

      <PaymentMethodModal
        open={showUpgradePayment}
        onClose={() => { setShowUpgradePayment(false); setShowUpgradePopup(true); }}
        onSelect={handleUpgradePaymentSelect}
        amount={priceDifference}
      />
    </div>
  );
};

export default Orders;
