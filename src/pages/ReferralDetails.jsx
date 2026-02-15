import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/ReferralDetails.css';

const ReferralDetails = () => {
  const navigate = useNavigate();
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalBenefit, setTotalBenefit] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(null);

  useEffect(() => {
    // Fetch referral details from API
    const fetchReferralDetails = async () => {
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

        const response = await fetch(`/coupons/referral-details?userPhone=${phone}`, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setReferrals(data.referrals || []);
          setTotalBenefit(data.totalBenefit || 0);
        }
      } catch (error) {
        console.error('Error fetching referral details:', error);
        // Set sample data for demo
        setSampleData();
      } finally {
        setLoading(false);
      }
    };

    const setSampleData = () => {
      const sampleReferrals = [
        {
          id: 1,
          referredPhone: '9876543210',
          referredName: 'Rajesh Kumar',
          referralDate: '2026-01-15',
          benefitAmount: 100,
          status: 'completed'
        },
        {
          id: 2,
          referredPhone: '9765432109',
          referredName: 'Priya Singh',
          referralDate: '2026-01-20',
          benefitAmount: 100,
          status: 'completed'
        },
        {
          id: 3,
          referredPhone: '9654321098',
          referredName: 'Amit Patel',
          referralDate: '2026-01-25',
          benefitAmount: 100,
          status: 'pending'
        }
      ];
      setReferrals(sampleReferrals);
      setTotalBenefit(300);
    };

    fetchReferralDetails();
  }, []);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  const getStatusBadgeClass = (status) => {
    return status === 'completed' ? 'status-completed' : 'status-pending';
  };

  const getStatusText = (status) => {
    return status === 'completed' ? '✓ Completed' : '⏳ Pending';
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
      {/* Header */}
      <header className="referral-header">
        <button className="back-btn" onClick={() => navigate('/profile')}>
          ←
        </button>
        <h1>Referral Details</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Total Benefit Card */}
      <div className="benefit-card">
        <div className="benefit-icon">💰</div>
        <div className="benefit-info">
          <p className="benefit-label">Total Benefit Earned</p>
          <p className="benefit-amount">₹{totalBenefit}</p>
        </div>
      </div>

      {/* Invite Friends Card */}
      <div className="invite-card">
        <div className="invite-icon">🎁</div>
        <div className="invite-content">
          <h3>Invite More Friends</h3>
          <p>Share your referral code and earn ₹20 for each friend</p>
          <button 
            className="invite-action-btn"
            onClick={handleInviteFriends}
            disabled={couponLoading}
          >
            <span className="whatsapp-icon-small">
              <svg viewBox="0 0 32 32" role="img" focusable="false">
                <path
                  d="M16 3C9.373 3 4 8.373 4 15c0 2.39.7 4.61 1.9 6.49L4 29l7.75-2.02C13.6 27.64 14.78 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.1c-1.04 0-2.05-.18-3-.52l-.22-.08-4.6 1.2 1.23-4.47-.15-.23A9.96 9.96 0 0 1 6.9 15C6.9 10.09 11.09 5.9 16 5.9S25.1 10.09 25.1 15 20.91 24.1 16 24.1zm5.62-6.78c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.29.5 1.73.64.73.23 1.4.2 1.93.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35z"
                  fill="currentColor"
                />
              </svg>
            </span>
            {couponLoading ? 'Loading...' : 'Invite on WhatsApp'}
          </button>
          {couponCode && (
            <p className="coupon-display">Code: <strong>{couponCode}</strong></p>
          )}
        </div>
      </div>

      {/* Referral Count */}
      <div className="referral-count">
        <span className="count-label">Total Referrals</span>
        <span className="count-number">{referrals.length}</span>
      </div>

      {/* Referrals List */}
      {loading ? (
        <div className="loading-state">
          <p>Loading referral details...</p>
        </div>
      ) : referrals.length > 0 ? (
        <div className="referrals-list">
          {referrals.map((referral) => (
            <div key={referral.id} className="referral-card">
              <div className="referral-avatar">
                {referral.referredName.charAt(0)}
              </div>
              <div className="referral-info">
                <h3 className="referral-name">{referral.referredName}</h3>
                <p className="referral-phone">{referral.referredPhone}</p>
                <p className="referral-date">Referred on {formatDate(referral.referralDate)}</p>
              </div>
              <div className="referral-right">
                <div className={`status-badge ${getStatusBadgeClass(referral.status)}`}>
                  {getStatusText(referral.status)}
                </div>
                <p className="referral-benefit">+₹{referral.benefitAmount}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-icon">🎁</div>
          <h3>No Referrals Yet</h3>
          <p>Start inviting friends and earn rewards!</p>
        </div>
      )}

      {/* Info Section */}
      <div className="referral-info-section">
        <h3>How Referrals Work</h3>
        <div className="info-steps">
          <div className="step">
            <span className="step-number">1</span>
            <p>Share your unique referral code with friends</p>
          </div>
          <div className="step">
            <span className="step-number">2</span>
            <p>They use your code while booking their first service</p>
          </div>
          <div className="step">
            <span className="step-number">3</span>
            <p>You both get ₹100 discount on your next bookings</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="profile" />
    </div>
  );
};

export default ReferralDetails;
