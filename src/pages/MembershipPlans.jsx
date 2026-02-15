import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/MembershipPlans.css';

const MembershipPlans = () => {
  const navigate = useNavigate();
  const premiumCardRef = useRef(null);
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(1); // Start at Premium (index 1)
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const autoScrollInterval = useRef(null);
  const [loading, setLoading] = useState(false);
  const [activeMembership, setActiveMembership] = useState(null);
  const [loadingMembership, setLoadingMembership] = useState(true);
  const [waterProvided, setWaterProvided] = useState(false);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      planCode: 'BASIC',
      subtitle: 'Perfect if you wash twice a month',
      price: '₹499',
      priceValue: 499,
      color: '#5E4DB2',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        '1 booking free – Foam (Exterior)',
        '10% discount on every wash for next 2 months',
        'Air check'
      ],
      mostPopular: false
    },
    {
      id: 'premium',
      name: 'Premium',
      planCode: 'PREMIUM',
      subtitle: 'For regular care and extra savings',
      price: '₹799',
      priceValue: 799,
      color: '#FF9999',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        'First 2 bookings free – Foam (Exterior)',
        '10% discount on every wash for next 3 months',
        'Wheel polish',
        'Air check'
      ],
      mostPopular: true
    },
    {
      id: 'ultra',
      name: 'Ultra',
      planCode: 'ULTRA',
      subtitle: 'Max benefits for frequent washers',
      price: '₹1599',
      priceValue: 1599,
      color: '#4FC3F7',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      features: [
        '1 Premium wash free',
        'Next 2 bookings free – Foam (Exterior)',
        '15% discount on every wash for next 6 months',
        'Wheel polish',
        'Air check',
        'Premium service checks'
      ],
      mostPopular: false
    }
  ];

  useEffect(() => {
    fetchActiveMembership();
    // Scroll to premium card on mount
    if (premiumCardRef.current) {
      premiumCardRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, []);

  const fetchActiveMembership = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        setLoadingMembership(false);
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
        setActiveMembership(data);
      } else {
        setActiveMembership(null);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setActiveMembership(null);
    } finally {
      setLoadingMembership(false);
    }
  };

  // Auto-scroll functionality
  useEffect(() => {
    const startAutoScroll = () => {
      autoScrollInterval.current = setInterval(() => {
        if (!isUserInteracting && containerRef.current) {
          setCurrentIndex((prevIndex) => {
            const nextIndex = (prevIndex + 1) % plans.length;
            const cards = containerRef.current.querySelectorAll('.plan-card');
            if (cards[nextIndex]) {
              cards[nextIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
              });
            }
            return nextIndex;
          });
        }
      }, 5000);
    };

    startAutoScroll();

    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [isUserInteracting, plans.length]);

  // Handle touch/mouse events to pause auto-scroll
  const handleInteractionStart = () => {
    setIsUserInteracting(true);
  };

  const handleInteractionEnd = () => {
    setIsUserInteracting(false);
  };

  const handleBuyNow = async (plan, isUpgrade = false) => {
    setLoading(true);
    
    try {
      const phone = localStorage.getItem('userPhone');
      
      if (!phone) {
        alert('Please login first');
        navigate('/login');
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

      let requestBody = {
        phone: phone,
        planCode: plan.planCode,
        planName: plan.name,
        originalPlanPrice: plan.priceValue,
        paidAmount: plan.priceValue,
        purchaseMode: 'NEW'
      };

      // If upgrading, add upgrade fields
      if (isUpgrade && activeMembership) {
        const priceDiff = plan.priceValue - (activeMembership.price || 0);
        requestBody = {
          ...requestBody,
          purchaseMode: 'UPGRADE',
          sourceMembershipDbId: activeMembership.id,
          previousPlanCode: activeMembership.planCode,
          upgradeDifferenceAmount: priceDiff > 0 ? priceDiff : 0,
          paidAmount: priceDiff > 0 ? priceDiff : 0
        };
      }

      const response = await fetch('/memberships', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error('Failed to create membership');
      }

      const data = await response.json();
      console.log('Membership created:', data);
      
      // Activate the membership if status is HOLD
      if (data.status === 'HOLD') {
        try {
          const activateResponse = await fetch(`/memberships/${data.id}/activate`, {
            method: 'PUT',
            headers: headers
          });
          
          if (activateResponse.ok) {
            const activatedData = await activateResponse.json();
            console.log('Membership activated:', activatedData);
          }
        } catch (activateErr) {
          console.error('Failed to activate membership:', activateErr);
        }
      }
      
      // Refresh active membership
      await fetchActiveMembership();
      
      // Navigate to membership detail page
      navigate('/membership-detail', { state: { plan, membership: data } });
      
    } catch (error) {
      console.error('Error creating membership:', error);
      alert('Failed to create membership. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = () => {
    if (!waterProvided) {
      alert('Please confirm water provision');
      return;
    }
    navigate('/booking');
  };

  const isCurrentPlan = (planCode) => {
    return activeMembership && activeMembership.planCode === planCode;
  };

  const canUpgrade = (planCode) => {
    if (!activeMembership) return false;
    const currentPlan = activeMembership.planCode;
    if (currentPlan === 'BASIC' && (planCode === 'PREMIUM' || planCode === 'ULTRA')) return true;
    if (currentPlan === 'PREMIUM' && planCode === 'ULTRA') return true;
    return false;
  };

  return (
    <div className="page-container membership-page">
      {/* Header */}
      <header className="membership-header">
        <button className="back-btn-inline" onClick={() => navigate(-1)}>←</button>
        <h2 className="header-title">Subscription Plan</h2>
        <div className="header-icons">
          <div className="icon-badge notification">
            <span>🔔</span>
          </div>
          <div className="avatar-small">
            <img src="/images/user-avatar.png" alt="User" />
          </div>
        </div>
      </header>

      {/* Title Section */}
      <div className="plan-title-section">
        <h1 className="plan-main-title">CHOOSE YOUR PLAN</h1>
        <p className="plan-subtitle">Start with 14 days free trial. Upgrade or downgrade anytime</p>
      </div>

      {/* Membership Plans */}
      <div 
        className="plans-container"
        ref={containerRef}
        onTouchStart={handleInteractionStart}
        onTouchEnd={handleInteractionEnd}
        onMouseDown={handleInteractionStart}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={handleInteractionEnd}
      >
        {plans.map(plan => (
          <div 
            key={plan.id} 
            ref={plan.id === 'premium' ? premiumCardRef : null}
            className={`plan-card ${plan.mostPopular ? 'most-popular' : ''}`}
          >
            {plan.mostPopular && (
              <div className="popular-badge">
                <span className="crown-icon">👑</span>
                <span className="popular-text">MOST POPULAR</span>
              </div>
            )}
            
            <div className="plan-content" style={{ background: plan.gradient }}>
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price-box">
                <div className="price-amount">{plan.price} / <span className="price-period">1 MO</span></div>
              </div>
              
              <div className="plan-features-list">
                {plan.features.map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="check-icon">✓</span>
                    <span className="feature-text">{feature}</span>
                  </div>
                ))}
              </div>

              {isCurrentPlan(plan.planCode) ? (
                <div className="plan-actions">
                  <button 
                    className="book-now-btn"
                    onClick={handleBookNow}
                  >
                    Book now
                  </button>
                  <button 
                    className="buy-again-btn"
                    onClick={() => handleBuyNow(plan, false)}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Buy again'}
                  </button>
                </div>
              ) : canUpgrade(plan.planCode) ? (
                <button 
                  className="upgrade-btn-plan"
                  onClick={() => handleBuyNow(plan, true)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Upgrade'}
                </button>
              ) : (
                <button 
                  className="buy-now-btn"
                  onClick={() => handleBuyNow(plan, false)}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Buy now'}
                </button>
              )}
            </div>

            <p className="plan-description">{plan.subtitle}</p>
          </div>
        ))}
      </div>

      {/* Water Provision Checkbox */}
      <div className="water-checkbox-section-plans">
        <label className="water-checkbox-label">
          <input
            type="checkbox"
            checked={waterProvided}
            onChange={(e) => setWaterProvided(e.target.checked)}
            className="water-checkbox"
          />
          <span>Please provide water for wash</span>
        </label>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="membership" />
    </div>
  );
};

export default MembershipPlans;
