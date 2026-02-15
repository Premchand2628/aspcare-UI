import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/MembershipDetail.css';

const MembershipDetail = () => {
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [allMemberships, setAllMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembershipDetails();
  }, []);

  const fetchMembershipDetails = async () => {
    try {
      const phone = localStorage.getItem('userPhone');
      
      if (!phone) {
        navigate('/login');
        return;
      }

      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Accept': 'application/json'
      };
      
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      // Always try to get the active membership first
      const response = await fetch(`/memberships/active/by-phone?phone=${phone}`, {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        setMembership(data);
        setError('');
      } else if (response.status === 404) {
        setError('No active membership found');
        setMembership(null);
      } else {
        setError('Failed to fetch membership details');
        setMembership(null);
      }

      // Fetch ALL memberships for payment history
      try {
        const allResponse = await fetch(`/memberships/by-phone?phone=${phone}`, {
          method: 'GET',
          headers: headers
        });

        if (allResponse.ok) {
          const allMembershipsList = await allResponse.json();
          
          // Handle both array and single object responses
          let membershipsToSet = [];
          if (Array.isArray(allMembershipsList)) {
            membershipsToSet = allMembershipsList;
          } else if (allMembershipsList && typeof allMembershipsList === 'object') {
            // Single object received - wrap it in array
            membershipsToSet = [allMembershipsList];
          }
          
          // Sort by creation date (newest first)
          if (membershipsToSet.length > 0) {
            const sorted = membershipsToSet.sort((a, b) => {
              const dateA = new Date(a.createdAt || 0);
              const dateB = new Date(b.createdAt || 0);
              return dateB - dateA;
            });
            setAllMemberships(sorted);
            console.log('All memberships fetched:', sorted.length);
          }
        } else {
          console.warn('Failed to fetch all memberships, status:', allResponse.status);
        }
      } catch (err) {
        console.error('Error fetching all memberships:', err);
        // Fallback: if only active membership exists, use that for payment history
        if (response.ok) {
          try {
            const activeMembership = await response.json();
            setAllMemberships([activeMembership]);
            console.log('Using active membership as fallback for payment history');
          } catch (e) {
            console.error('Error parsing active membership:', e);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching membership:', err);
      setError('Failed to load membership details');
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${getMonthName(date.getMonth())} ${year} ${hours}:${minutes}`;
  };

  const getMonthName = (month) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month];
  };

  const getBenefits = () => {
    if (!membership) return [];
    
    const benefits = [];
    
    if (membership.discountPercent) {
      benefits.push(`Get discount ${membership.discountPercent}% for every purchase`);
    }
    
    if (membership.freeFoamRemaining > 0) {
      benefits.push(`${membership.freeFoamRemaining} Free Foam wash${membership.freeFoamRemaining > 1 ? 'es' : ''} remaining`);
    }
    
    if (membership.freePremiumRemaining > 0) {
      benefits.push(`${membership.freePremiumRemaining} Free Premium wash${membership.freePremiumRemaining > 1 ? 'es' : ''} remaining`);
    }
    
    // Add default benefits based on plan
    if (membership.planCode === 'BASIC' || membership.planCode === 'PREMIUM' || membership.planCode === 'ULTRA') {
      benefits.push('Wheel Polish');
      benefits.push('Air check');
    }
    
    return benefits;
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `₹${price}`;
  };

  if (loading) {
    return (
      <div className="page-container">
        <button className="back-btn-absolute" onClick={() => navigate(-1)}>←</button>
        <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>
      </div>
    );
  }

  if (error || !membership) {
    return (
      <div className="page-container">
        <button className="back-btn-absolute" onClick={() => navigate(-1)}>←</button>
        
        {/* Hero Section */}
        <div className="membership-hero">
          <div className="hero-image" style={{
            background: 'linear-gradient(135deg, #5E4DB2 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            paddingBottom: '40px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '60px', marginBottom: '10px' }}>✨</div>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0' }}>Be a Part of ASP</h2>
            </div>
          </div>
        </div>

        {/* No Membership Card */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '30px 20px',
          marginTop: '-20px',
          marginLeft: '20px',
          marginRight: '20px',
          marginBottom: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          position: 'relative',
          zIndex: 10,
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '22px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '10px'
          }}>
            No Membership Yet?
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#666',
            marginBottom: '20px',
            lineHeight: '1.6'
          }}>
            Join our exclusive membership and unlock amazing benefits
          </p>
        </div>

        {/* Pricing Card */}
        <div style={{
          background: 'linear-gradient(135deg, #5E4DB2 0%, #764ba2 100%)',
          borderRadius: '15px',
          padding: '25px 20px',
          marginLeft: '20px',
          marginRight: '20px',
          marginBottom: '20px',
          color: 'white',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '14px', margin: '0 0 10px 0', opacity: 0.9 }}>
            Special Introductory Price
          </p>
          <h2 style={{
            fontSize: '48px',
            fontWeight: 'bold',
            margin: '10px 0',
            textDecoration: 'underline wavy'
          }}>
            ₹499
          </h2>
          <p style={{ fontSize: '13px', margin: '10px 0 0 0', opacity: 0.85 }}>
            for a year of benefits
          </p>
        </div>

        {/* Benefits Section */}
        <div className="benefits-section" style={{ marginTop: '20px', marginLeft: '20px', marginRight: '20px' }}>
          <h3>✨ What You'll Get</h3>
          <ul className="benefits-list">
            <li>💰 Exclusive discounts on all bookings</li>
            <li>🎁 Special gifts and rewards</li>
            <li>⭐ Priority customer support</li>
            <li>🚀 Early access to new services</li>
            <li>🎉 Birthday surprises and offers</li>
          </ul>
        </div>

        {/* CTA Button */}
        <button 
          onClick={() => navigate('/membership-plans')}
          style={{
            width: '100%',
            background: '#5E4DB2',
            color: 'white',
            padding: '16px',
            borderRadius: '15px',
            fontSize: '16px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(94, 77, 178, 0.3)',
            marginLeft: '20px',
            marginRight: '20px',
            marginBottom: '20px',
            marginTop: '20px',
            boxSizing: 'border-box',
            width: 'calc(100% - 40px)'
          }}
        >
          Get Started Now
        </button>

        {/* Footer Note */}
        <p style={{
          textAlign: 'center',
          fontSize: '12px',
          color: '#999',
          marginBottom: '30px'
        }}>
          Cancel anytime. No lock-in period.
        </p>
      </div>
    );
  }

  const benefits = getBenefits();
  
  // Build payment history from all memberships
  const paymentHistory = allMemberships.map(m => ({
    date: formatDate(m.createdAt),
    amount: formatPrice(m.price),
    planName: m.planName
  }));

  return (
    <div className="page-container">
      {/* Back Button */}
      <button className="back-btn-absolute" onClick={() => navigate(-1)}>←</button>
      
      {/* Car Image Header */}
      <div className="membership-hero">
        <img src="/images/car-wash-splash.png" alt="Car Wash" className="hero-image" />
      </div>

      {/* Membership Status */}
      <div className="membership-status">
        <h2>You're now a</h2>
        <h1 className="membership-tier">{membership.planName} Pass Member</h1>
        <p className="expiry-info">⏱ {membership.status === 'ACTIVE' ? 'Expires' : 'Expired'} on {formatDateTime(membership.endDate)}</p>
        <p style={{ textAlign: 'center', marginTop: '10px', color: membership.status === 'ACTIVE' ? 'green' : membership.status === 'HOLD' ? 'orange' : 'red' }}>
          Status: {membership.status}
        </p>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <h3>Benefit</h3>
        <ul className="benefits-list">
          {benefits.map((benefit, index) => (
            <li key={index}>{index + 1}. {benefit}</li>
          ))}
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="membership-actions">
        <button 
          className="book-now-btn" 
          onClick={() => navigate('/services')}
        >
          Book Now
        </button>
        <button className="upgrade-btn" onClick={() => navigate('/membership-plans')}>
          Upgrade
        </button>
      </div>

      {/* Payment History */}
      <div className="payment-history">
        <h3>Payment History</h3>
        {paymentHistory.length > 0 ? (
          paymentHistory.map((payment, index) => (
            <div key={index} className="payment-row">
              <div className="payment-info">
                <span className="payment-date">{payment.date}</span>
                <span className="payment-plan">{payment.planName} Pass</span>
              </div>
              <span className="payment-amount">{payment.amount}</span>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#999' }}>No payment history found</p>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="membership" />
    </div>
  );
};

export default MembershipDetail;
