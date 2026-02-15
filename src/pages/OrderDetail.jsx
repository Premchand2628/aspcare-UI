import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/OrderDetail.css';

const OrderDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelPopup, setShowCancelPopup] = useState(false);
  const [cancelQuote, setCancelQuote] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showReschedulePopup, setShowReschedulePopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [rescheduledReason, setRescheduledReason] = useState('');
  const [availability, setAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
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
        const foundOrder = data.find(o => o.id === parseInt(id));
        setOrder(foundOrder || null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = async () => {
    setCancelLoading(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/${id}/cancel-quote`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setCancelQuote(data);
        setShowCancelPopup(true);
      }
    } catch (error) {
      console.error('Error fetching cancel quote:', error);
      alert('Failed to get cancellation details');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelQuote?.eligible) {
      alert('This booking cannot be cancelled');
      return;
    }

    setCancelling(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/${id}/cancel-confirm`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Booking cancelled successfully');
        setShowCancelPopup(false);
        navigate('/orders');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error confirming cancel:', error);
      alert('Error processing cancellation');
    } finally {
      setCancelling(false);
    }
  };

  const handleRescheduleClick = () => {
    setShowReschedulePopup(true);
    setRescheduledReason('');
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAvailability(today, order?.serviceType || 'HOME');
  };

  const fetchAvailability = async (date, serviceType) => {
    setLoadingSlots(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/availability?date=${date}&serviceType=${serviceType}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSelectedSlot('');
    fetchAvailability(newDate, order?.serviceType || 'HOME');
  };

  const handleUpdateBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      alert('Please select both date and time slot');
      return;
    }

    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(`/bookings/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          bookingDate: selectedDate,
          timeSlot: selectedSlot,
          rescheduledReason: rescheduledReason
        })
      });

      if (response.ok) {
        alert('Booking rescheduled successfully!');
        setShowReschedulePopup(false);
        fetchOrderDetail();
      } else {
        alert('Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error rescheduling booking');
    }
  };

  const formatBookingDateTime = (date, timeSlot) => {
    if (!date && !timeSlot) return 'Not scheduled';
    const dateObj = date ? new Date(date) : null;
    const displayDate = dateObj
      ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : 'N/A';
    return `${displayDate}${timeSlot ? `, ${timeSlot}` : ''}`;
  };

  const formatAmount = (value) => {
    const amount = Number(value ?? 0);
    return `₹${amount.toFixed(2)}`;
  };

  const formatPercent = (value) => {
    const percent = Number(value ?? 0);
    return `${percent.toFixed(0)}%`;
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="header">
        <button className="back-btn-inline" onClick={() => navigate(-1)}>←</button>
        <div className="user-info">
          <div className="avatar">
            <img src="/images/user-avatar.png" alt="User" />
          </div>
          <span className="tier-badge">Tier Member</span>
        </div>
        <div className="header-icons">
          <div className="icon-badge">
            <img src="/images/rewards-icon.png" alt="Rewards" />
          </div>
          <div className="icon-badge notification">
            <span className="notification-emoji">🔔</span>
          </div>
        </div>
      </header>

      {/* Order Header */}
      <div className="order-header">
        <h1>Order#: {order?.id ?? id}</h1>
        <div className="order-title-row">
          <h2>{order?.washType || order?.serviceType || 'Service'}</h2>
          <h2>{order?.phone || localStorage.getItem('userPhone') || 'N/A'}</h2>
        </div>
      </div>

      {/* Service Card */}
      <div className="order-service-card">
        <img src="/images/car-wash-illustration.png" alt="Service" className="service-detail-image" />
        <div className="service-detail-info">
          <h3>{order?.centreName || 'Service Centre'}</h3>
          <p className="location">📍 {order?.address || 'Address not available'}</p>
        </div>
      </div>

      {/* Booking Details */}
      <div className="order-booking-info">
        <p className="booking-time">
          {formatBookingDateTime(order?.bookingDate, order?.timeSlot)}
        </p>
      </div>

      {/* Action Buttons */}
      {order && order.status && order.status.toLowerCase() === 'cancelled' ? (
        <div className="cancelled-badge-detail">
          <span className="cancelled-icon">❌</span>
          <span className="cancelled-text">Order Cancelled</span>
        </div>
      ) : (
        <>
          <div className="order-actions-main">
            <button 
              className="reschedule-btn-main"
              onClick={handleRescheduleClick}
            >
              Re-schedule
            </button>
            <button 
              className="cancel-btn"
              onClick={handleCancelClick}
              disabled={cancelLoading}
            >
              {cancelLoading ? 'Loading...' : 'Cancel'}
            </button>
          </div>
          <button className="download-btn">Download Invoice</button>
        </>
      )}

      {/* Price Breakdown */}
      <div className="order-price-breakdown">
        <div className="price-row">
          <span>Sub total</span>
          <span>{formatAmount(order?.originalAmount)}</span>
        </div>
        <div className="price-row">
          <span>Water discount applied</span>
          <span>-{formatAmount(order?.waterDiscountApplied)}</span>
        </div>
        <div className="price-row">
          <span>Discount percent applied</span>
          <span>{formatPercent(order?.discountPercentApplied)}</span>
        </div>
        <div className="price-divider"></div>
        <div className="price-row total">
          <span><strong>Grand Total</strong></span>
          <span><strong>{formatAmount(order?.payableAmount)}</strong></span>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="orders" />

      {/* Cancel Popup Modal */}
      {showCancelPopup && cancelQuote && (
        <div className="modal-overlay">
          <div className="cancel-popup">
            <div className="popup-header">
              <button 
                className="popup-back-btn"
                onClick={() => setShowCancelPopup(false)}
              >
                ←
              </button>
              <h2>Cancellation Details</h2>
              <div className="popup-spacer"></div>
            </div>

            <div className="popup-content">
              {!cancelQuote.eligible ? (
                <div className="cancel-ineligible">
                  <div className="ineligible-icon">❌</div>
                  <p className="ineligible-message">{cancelQuote.message}</p>
                </div>
              ) : (
                <div className="cancel-eligible">
                  <div className="refund-card">
                    <h3>Refund Information</h3>
                    
                    <div className="refund-item">
                      <span className="refund-label">Booking Amount:</span>
                      <span className="refund-value">₹{cancelQuote.bookingAmount?.toFixed(2)}</span>
                    </div>

                    <div className="refund-item">
                      <span className="refund-label">Hours Remaining:</span>
                      <span className="refund-value">{cancelQuote.hoursRemaining?.toFixed(1)} hours</span>
                    </div>

                    <div className="refund-item">
                      <span className="refund-label">Refund Percentage:</span>
                      <span className="refund-value">{cancelQuote.refundPercent}%</span>
                    </div>

                    <div className="refund-divider"></div>

                    <div className="refund-item total">
                      <span className="refund-label">Refund Amount:</span>
                      <span className="refund-value-total">₹{cancelQuote.refundAmount?.toFixed(2)}</span>
                    </div>

                    <p className="refund-message">{cancelQuote.message}</p>
                  </div>

                  <div className="popup-actions">
                    <button 
                      className="cancel-confirm-btn"
                      onClick={handleConfirmCancel}
                      disabled={cancelling}
                    >
                      {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Popup Modal */}
      {showReschedulePopup && order && (
        <div className="modal-overlay">
          <div className="reschedule-popup">
            <div className="popup-header">
              <button 
                className="popup-back-btn"
                onClick={() => setShowReschedulePopup(false)}
              >
                ←
              </button>
              <h2>Reschedule Booking</h2>
              <div className="popup-spacer"></div>
            </div>

            <div className="popup-content">
              <div className="reschedule-form">
                {/* Date Picker */}
                <div className="form-group">
                  <label className="form-label">Select Date</label>
                  <input
                    type="date"
                    className="date-input"
                    value={selectedDate}
                    onChange={handleDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Time Slots */}
                <div className="form-group">
                  <label className="form-label">Select Time Slot</label>
                  {loadingSlots ? (
                    <p className="loading-slots">Loading available slots...</p>
                  ) : (
                    <div className="slots-grid">
                      {Object.entries(availability).map(([slot, isAvailable]) => (
                        <button
                          key={slot}
                          className={`slot-btn ${!isAvailable ? 'slot-booked' : ''} ${selectedSlot === slot ? 'slot-selected' : ''}`}
                          onClick={() => isAvailable && setSelectedSlot(slot)}
                          disabled={!isAvailable}
                        >
                          <span className="slot-time">{slot}</span>
                          <span className="slot-status">
                            {isAvailable ? '✓ Available' : '✗ Booked'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reschedule Reason */}
                <div className="form-group">
                  <label className="form-label">Reason for Rescheduling (Optional)</label>
                  <textarea
                    className="reason-input"
                    placeholder="Tell us why you're rescheduling (e.g., Car not ready, Emergency work, etc.)"
                    value={rescheduledReason}
                    onChange={(e) => setRescheduledReason(e.target.value)}
                    maxLength="500"
                    rows="3"
                  />
                  <span className="char-count">{rescheduledReason.length}/500</span>
                </div>

                {/* Update Button */}
                <button
                  className="update-booking-btn"
                  onClick={handleUpdateBooking}
                  disabled={!selectedDate || !selectedSlot}
                >
                  Update Booking
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
