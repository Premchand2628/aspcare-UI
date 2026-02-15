import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOffersBanner, setShowOffersBanner] = useState(() => {
    // Show banner only if not closed in this session
    return !sessionStorage.getItem('offersBannerClosed');
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(() => {
    return !sessionStorage.getItem('upgradeBannerClosed');
  });
  const [upgradeableBooking, setUpgradeableBooking] = useState(null);
  const [greeting, setGreeting] = useState('Good Morning');
  const [firstName, setFirstName] = useState('User');
  const [hasBookings, setHasBookings] = useState(true);

  useEffect(() => {
    fetchActiveMembership();
    fetchUpcomingBookings();
    fetchUserGreeting();
  }, []);

  const fetchActiveMembership = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        setLoading(false);
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/memberships/active/by-phone?phone=${phone}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setMembership(data);
      } else {
        setMembership(null);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBanner = () => {
    setShowOffersBanner(false);
    sessionStorage.setItem('offersBannerClosed', 'true');
  };

  const handleCloseUpgradeBanner = () => {
    setShowUpgradeBanner(false);
    sessionStorage.setItem('upgradeBannerClosed', 'true');
  };

  const handleBannerClick = () => {
    navigate('/offers');
  };

  const handleUpgradeBannerClick = () => {
    navigate('/orders');
  };

  const fetchUpcomingBookings = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) return;

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/by-phone?phone=${phone}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      
      // Track if user has any bookings
      setHasBookings(data && data.length > 0);
      
      // Find upgradeable booking (future booking with Basic or Foam wash)
      const now = new Date();
      const upgradeable = data.find(order => {
        if (!order.bookingDate || !order.timeSlot) return false;
        
        try {
          const bookingDateTime = new Date(`${order.bookingDate}T${order.timeSlot.split('-')[0]}`);
          const isFuture = bookingDateTime > now;
          const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';
          const isUpgraded = String(order.upgradeStatus || '').toLowerCase() === 'upgraded';
          const washType = String(order.washType || order.serviceType || '').toLowerCase();
          const isUpgradeable = washType === 'basic' || washType === 'foam';
          
          return isFuture && !isCancelled && !isUpgraded && isUpgradeable;
        } catch {
          return false;
        }
      });

      setUpgradeableBooking(upgradeable || null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setHasBookings(false);
    }
  };

  const getUpgradeOptions = (washType) => {
    const normalizedType = String(washType || '').toLowerCase();
    if (normalizedType === 'basic') {
      return 'Foam or Premium';
    } else if (normalizedType === 'foam') {
      return 'Premium';
    }
    return '';
  };

  const fetchUserGreeting = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) return;

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/users/greeting?phone=${phone}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setGreeting(data.greeting);
        setFirstName(data.firstName);
        localStorage.setItem('userFirstName', data.firstName);
      }
    } catch (error) {
      console.error('Error fetching greeting:', error);
    }
  };

  const handleInviteFriends = async () => {
    setCouponLoading(true);
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        alert('Please login first');
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch('/coupons/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          createdByPhone: phone,
          discountType: 'FLAT',
          discountValue: 20,
          maxUses: 5,
          validDays: 30,
          minOrderAmount: 100
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate coupon');
      }

      const data = await response.json();
      setCouponCode(data.couponCode);
      
      // Share via WhatsApp
      const text = encodeURIComponent(
        `Hey! 👋 I'm using ASP Car Care 🚗💦\n\n` +
        `Use my coupon code *${data.couponCode}* to get ₹20 discount 🎉\n` +
        `Book here: https://carwash.com\n` +
        `(Apply coupon at checkout)`
      );
      
      const whatsappUrl = `https://wa.me/?text=${text}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error generating coupon:', error);
      alert('Failed to generate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="page-container">
      {/* Deals & Offers Banner */}
      {showOffersBanner && (
        <div className="offers-banner">
          <div className="offers-banner-content" onClick={handleBannerClick}>
            <span className="offers-icon">🎁</span>
            <div className="offers-text">
              <h3>Deals & Offers</h3>
              <p>Check out amazing discounts on car wash packages!</p>
            </div>
          </div>
          <button className="close-banner" onClick={handleCloseBanner}>
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="user-info">
          <div className="avatar">
            <img src="/images/user-avatar.png" alt="User" />
          </div>
          <div className="greeting-header">
            <h1>{greeting}, <span className="username">{firstName}</span></h1>
          </div>
        </div>
        <div className="header-icons">
          <div className="icon-badge notification">
            <span className="notification-emoji">🔔</span>
          </div>
        </div>
      </header>

      {/* Membership Info */}
      <div className="membership-section">
        <div className="membership-info-main">
          <span className="tier-badge">
            {membership ? `${membership.planName} Member` : 'Tier Member'}
          </span>
          {membership && (
            <button 
              className="upgrade-btn-small" 
              onClick={() => navigate('/membership-plans')}
            >
              Upgrade
            </button>
          )}
        </div>
      </div>

      {/* Trophy/Rewards Card */}
      <div className="rewards-card">
        <div className="trophy-icon">🏆</div>
        <div className="rewards-content">
          <h2>
            <span className="bonus-dancing" style={{ color: '#FFD700' }}>
              💰 Get Flat ₹20 Off 💰
            </span>
          </h2>
          <button 
            className="invite-btn" 
            onClick={handleInviteFriends}
            disabled={couponLoading}
          >
            <span className="whatsapp-icon" aria-hidden="true">
              <svg viewBox="0 0 32 32" role="img" focusable="false">
                <path
                  d="M16 3C9.373 3 4 8.373 4 15c0 2.39.7 4.61 1.9 6.49L4 29l7.75-2.02C13.6 27.64 14.78 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.1c-1.04 0-2.05-.18-3-.52l-.22-.08-4.6 1.2 1.23-4.47-.15-.23A9.96 9.96 0 0 1 6.9 15C6.9 10.09 11.09 5.9 16 5.9S25.1 10.09 25.1 15 20.91 24.1 16 24.1zm5.62-6.78c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.29.5 1.73.64.73.23 1.4.2 1.93.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35z"
                  fill="currentColor"
                />
              </svg>
            </span>
            {couponLoading ? 'Loading...' : 'Invite friends'}
          </button>
          {couponCode && (
            <p className="coupon-code-display">Code: {couponCode}</p>
          )}
        </div>
      </div>

      {/* Upgrade Banner */}
      {showUpgradeBanner && upgradeableBooking && (
        <div className="upgrade-banner">
          <div className="upgrade-banner-content" onClick={handleUpgradeBannerClick}>
            <span className="upgrade-icon">🚀</span>
            <div className="upgrade-text">
              <h3>Upgrade Your Wash!</h3>
              <p>
                Upgrade your upcoming {upgradeableBooking.washType || upgradeableBooking.serviceType} wash 
                to {getUpgradeOptions(upgradeableBooking.washType || upgradeableBooking.serviceType)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Service Cards */}
      <div className="service-cards">
        <div className="service-card" onClick={() => navigate('/services')}>
          <div className="service-icon">
            <img src="/images/checkout-icon.png" alt="Checkout" />
          </div>
          <p className="service-title">Check out<br />ASP Services</p>
        </div>
        <div className="service-card" onClick={() => navigate('/offers')}>
          <div className="service-icon">
            <span className="deals-icon">🎁</span>
          </div>
          <p className="service-title">More Deals<br />& Offers</p>
        </div>
        {!membership && (
          <div className="service-card" onClick={() => navigate('/membership-plans')}>
            <div className="service-icon">
              <img src="/images/membership-icon.png" alt="Membership" />
            </div>
            <p className="service-title">Join Membership<br />for great benefits</p>
          </div>
        )}
      </div>

      {/* Promo Banner - Show only if no bookings found */}
      {!hasBookings && (
        <div className="promo-banner">
          <p>
            <span className="bonus-dancing">
              💰 Claim your ₹20 off by your first booking 💰
            </span>
          </p>
        </div>
      )}

      {/* Car Image */}
      <div className="car-showcase">
        <img src="/images/car-main.png" alt="Car" />
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© 2025 Copyrights</p>
        <p>About Us</p>
        <p>Privacy Policy</p>
      </footer>

      {/* Floating Chatbot Bubble */}
      <button 
        className="chatbot-bubble"
        onClick={() => navigate('/chatbot')}
        title="Open Chat Support"
      >
        💬
      </button>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Home;
