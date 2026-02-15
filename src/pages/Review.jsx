import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Review.css';

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeApplied, setPromoCodeApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeMessage, setPromoCodeMessage] = useState('');
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const [membershipDiscountPercent, setMembershipDiscountPercent] = useState(0);
  const [signupBonus, setSignupBonus] = useState(0);
  const [hasExistingBookings, setHasExistingBookings] = useState(false);
  const [loading, setLoading] = useState(true);

  // Get data from booking page
  const bookingData = location.state || {
    address: 'KIMS Hospital, Old Bombay Highway, Ward 104 K',
    washType: 'Foam',
    selectedDate: new Date('2026-01-18'),
    selectedTimeSlot: '09:00-10:00',
    vehicleType: 'HATCHBACK',
    vehicleNumber: 'TN01AB1234',
    subTotal: 399,
    currency: 'INR',
    waterOption: 'no-thanks'
  };

  // Format date for display
  const formatDateForDisplay = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const day = dateObj.toLocaleDateString('en-IN', { day: '2-digit' });
    const month = dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    const year = dateObj.getFullYear();
    const time = bookingData.selectedTimeSlot;
    const [startTime] = time.split('-');
    const [hours, minutes] = startTime.split(':');
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${day}-${month}-${year}, ${displayHours}:${minutes}${ampm}`;
  };

  // Check for existing bookings with phone number
  useEffect(() => {
    const checkExistingBookings = async () => {
      try {
        setLoading(true);
        const phoneNumber = localStorage.getItem('userPhone');
        
        if (!phoneNumber) {
          // If no phone number, assume new user and show signup bonus
          setHasExistingBookings(false);
          setSignupBonus(20);
          return;
        }

        const authToken = localStorage.getItem('authToken');
        const headers = {
          Accept: 'application/json'
        };
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        // Check if user has any existing bookings
        const response = await fetch(`/bookings/by-phone?phone=${phoneNumber}`, {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          // If bookings array has length > 0, user has existing bookings
          const existingBookings = Array.isArray(data) ? data.length > 0 : false;
          setHasExistingBookings(existingBookings);
          
          if (!existingBookings) {
            setSignupBonus(20);
          } else {
            // User has existing bookings, no signup bonus
            setSignupBonus(0);
          }
        } else {
          // If API fails, assume new user
          setHasExistingBookings(false);
          setSignupBonus(20);
        }
      } catch (error) {
        console.error('Error checking existing bookings:', error);
        // Default to new user on error
        setHasExistingBookings(false);
        setSignupBonus(20);
      } finally {
        setLoading(false);
      }
    };

    checkExistingBookings();
  }, []);

  // Fetch active membership and calculate discount
  useEffect(() => {
    const fetchActiveMembership = async () => {
      try {
        const phone = localStorage.getItem('userPhone');
        if (!phone) {
          setMembershipDiscount(0);
          setMembershipDiscountPercent(0);
          return;
        }

        const authToken = localStorage.getItem('authToken');
        const headers = {
          Accept: 'application/json'
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
          const percent = Number(data.discountPercent || 0);
          const subTotal = Number(bookingData.subTotal || 0);
          const discountAmount = Math.max(0, (subTotal * percent) / 100);
          setMembershipDiscountPercent(percent);
          setMembershipDiscount(discountAmount);
        } else {
          setMembershipDiscount(0);
          setMembershipDiscountPercent(0);
        }
      } catch (error) {
        console.error('Error fetching membership:', error);
        setMembershipDiscount(0);
        setMembershipDiscountPercent(0);
      }
    };

    fetchActiveMembership();
  }, [bookingData.subTotal]);

  // Handle promo code validation
  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) {
      setPromoCodeMessage('Please enter a promo code');
      return;
    }

    setPromoCodeLoading(true);
    setPromoCodeMessage('');

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

      const response = await fetch('/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          couponCode: promoCodeInput.trim().toUpperCase(),
          userPhone: phone,
          orderAmount: bookingData.subTotal
        })
      });

      const data = await response.json();

      if (data.valid) {
        setPromoDiscount(Number(data.discountAmount) || 0);
        setPromoCodeApplied(true);
        setPromoCodeMessage('✓ Coupon applied successfully!');
      } else {
        setPromoCodeMessage(data.message || 'Invalid promo code');
        setPromoCodeApplied(false);
        setPromoDiscount(0);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeMessage('Failed to validate promo code');
      setPromoCodeApplied(false);
    } finally {
      setPromoCodeLoading(false);
    }
  };

  // Handle promo code removal
  const handleRemovePromoCode = () => {
    setPromoCodeInput('');
    setPromoDiscount(0);
    setPromoCodeApplied(false);
    setPromoCodeMessage('');
  };

  // Calculate grand total
  const grandTotal = (bookingData.subTotal || 0) - membershipDiscount - signupBonus - promoDiscount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: bookingData.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate savings
  const savings = (bookingData.subTotal || 0) - Math.max(0, grandTotal);

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

      {/* Greeting */}
      <div className="greeting">
        <h1>Please review the details</h1>
      </div>

      {/* Service Info */}
      <div className="service-info-card">
        <img src="/images/car-wash-splash.png" alt="Service" className="service-image" />
        <div className="service-details">
          <h3 className="service-name">{bookingData.centreName || 'Car Wash Service'}</h3>
          <p className="service-location">📍 {bookingData.address}</p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="booking-info">
        <div className="booking-row">
          <span className="booking-label">Wash Type</span>
          <span className="booking-separator">:</span>
          <span className="booking-value">{bookingData.washType}</span>
        </div>
        <div className="booking-row">
          <span className="booking-label">Vehicle</span>
          <span className="booking-separator">:</span>
          <span className="booking-value">{bookingData.vehicleType}</span>
        </div>
        <div className="booking-row">
          <span className="booking-label">Vehicle Number</span>
          <span className="booking-separator">:</span>
          <span className="booking-value">{bookingData.vehicleNumber}</span>
        </div>
        <div className="booking-row">
          <span className="booking-label">Date</span>
          <span className="booking-separator">:</span>
          <span className="booking-value">{formatDateForDisplay(bookingData.selectedDate)}</span>
        </div>
      </div>

      {/* Promo Code Section */}
      <div className="promo-section">
        <input
          type="text"
          value={promoCodeInput}
          onChange={(e) => {
            setPromoCodeInput(e.target.value);
            setPromoCodeMessage('');
          }}
          placeholder="Enter referral code (e.g., ASP-XXXXX)"
          className="promo-code-input"
          disabled={promoCodeApplied}
        />
        {!promoCodeApplied ? (
          <button 
            className="apply-btn-small" 
            onClick={handleApplyPromoCode}
            disabled={promoCodeLoading}
          >
            {promoCodeLoading ? 'Validating...' : 'Apply'}
          </button>
        ) : (
          <button 
            className="remove-btn-small" 
            onClick={handleRemovePromoCode}
          >
            Remove
          </button>
        )}
        {promoCodeMessage && (
          <p className={`promo-message ${promoCodeApplied ? 'success' : 'error'}`}>
            {promoCodeMessage}
          </p>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="price-breakdown">
        <div className="price-row">
          <span>Sub total(price + Tax)</span>
          <span>{formatCurrency(bookingData.subTotal)}</span>
        </div>
        <div className="price-row discount-row">
          <span>
            Membership discount
            {membershipDiscount > 0 ? ` (${membershipDiscountPercent}%)` : ''}
          </span>
          <span>
            {membershipDiscount > 0
              ? `-${formatCurrency(membershipDiscount)}`
              : 'N/A'}
          </span>
        </div>
        {!hasExistingBookings && signupBonus > 0 && (
          <div className="price-row discount-row">
            <span>Signup Bonus</span>
            <span>-{formatCurrency(signupBonus)}</span>
          </div>
        )}
        {promoCodeApplied && promoDiscount > 0 && (
          <div className="price-row discount-row">
            <span>{promoCodeInput} Applied!</span>
            <span>-{formatCurrency(promoDiscount)}</span>
          </div>
        )}
        <div className="price-divider"></div>
        <div className="price-row total">
          <span><strong>Grand Total</strong></span>
          <span><strong>{formatCurrency(Math.max(0, grandTotal))}</strong></span>
        </div>
      </div>

      {/* Savings Message */}
      {savings > 0 && (
        <div className="savings-message">
          <span>🎉 Hurrahh! You are saving {formatCurrency(savings)}</span>
        </div>
      )}

      {/* Continue Button */}
      <button className="continue-btn" onClick={() => navigate('/terms')}>
        Continue to pay
      </button>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Review;
