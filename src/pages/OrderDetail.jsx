import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { getStoredPhone } from '../utils/apiMappers';
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
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        setLoading(false);
        return;
      }
      
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch('/bookings/me', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const numericId = Number(id);
        const foundOrder = data.find((o) => {
          const orderBookingCode = String(o?.bookingCode || '').trim();
          if (orderBookingCode && orderBookingCode === String(id).trim()) {
            return true;
          }
          return Number.isFinite(numericId) && o.id === numericId;
        });
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
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

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
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch(`/bookings/${id}/cancel-confirm`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.message || 'Booking cancelled successfully'} (Order#: ${getOrderRef()})`);
        setShowCancelPopup(false);
        navigate('/orders');
      } else {
        const errorData = await response.json();
        alert(`${errorData.message || 'Failed to cancel booking'} (Order#: ${getOrderRef()})`);
      }
    } catch (error) {
      console.error('Error confirming cancel:', error);
      alert(`Error processing cancellation (Order#: ${getOrderRef()})`);
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
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const params = new URLSearchParams();
      params.set('date', date);
      params.set('serviceType', serviceType);
      // For non-HOME services, scope availability to the booked centre so other
      // centres' bookings don't block this centre's slots (and vice-versa).
      const isHome = String(serviceType || '').toUpperCase() === 'HOME';
      if (!isHome) {
        if (order?.serviceCentreId !== undefined && order?.serviceCentreId !== null) {
          params.set('serviceCentreId', String(order.serviceCentreId));
        }
        if (order?.centreName) {
          params.set('centreName', order.centreName);
        }
      }

      const response = await fetch(`/bookings/availability?${params.toString()}`, {
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
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

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
        alert(`Booking rescheduled successfully! (Order#: ${getOrderRef()})`);
        setShowReschedulePopup(false);
        fetchOrderDetail();
      } else {
        alert(`Failed to reschedule booking (Order#: ${getOrderRef()})`);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert(`Error rescheduling booking (Order#: ${getOrderRef()})`);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        alert('Please login to download invoice');
        return;
      }

      const bookingId = order?.id || id;
      const headers = withAuthHeader({ 'Accept': 'application/pdf' });
      const response = await fetch(`/bookings/${bookingId}/invoice`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          alert('Invoice is not available for this booking');
          return;
        }
        const errorData = await response.json().catch(() => null);
        alert(errorData?.message || 'Failed to download invoice');
        return;
      }

      const blob = await response.blob();
      const invNum = response.headers.get('X-Invoice-Number');
      if (invNum) setInvoiceNumber(invNum);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Invoice_${invNum || getOrderRef()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      alert('Failed to download invoice');
    } finally {
      setDownloadingInvoice(false);
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

  const getOrderRef = () => ((order?.bookingCode && String(order.bookingCode).trim())
    ? String(order.bookingCode).trim()
    : (order?.id ?? id));

  const displayOrderCode = getOrderRef();
  const userPhone = getStoredPhone() || order?.phone || '';

  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace(/ /g, '-');
  };

  const formatTimeSlotDisplay = (slot) => {
    if (!slot) return '';
    return slot.replace(/-/g, '-').toUpperCase();
  };

  return (
    <div className="page-container">
      {/* Back Button + Order Header */}
      <div className="od-top-bar">
        <button className="od-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1 className="od-order-number">Order#: {displayOrderCode}</h1>
      </div>

      {/* Service Type & Phone Row */}
      <div className="od-title-row">
        <span className="od-service-type">{order?.serviceType || 'Home'}</span>
        <span className="od-phone">{userPhone}</span>
      </div>

      {/* Service Image */}
      <div className="od-image-wrapper">
        <img
          className="od-service-image"
          src="/images/suv.png"
          alt="Car Wash Service"
        />
      </div>

      {/* Center Name */}
      <h2 className="od-center-name">{order?.centreName || 'ASP Care'}</h2>

      {/* Location */}
      <div className="od-location">
        <span className="od-location-pin">📍</span>
        <span className="od-location-text">{order?.address || 'N/A'}</span>
      </div>

      {/* Date & Time */}
      <p className="od-datetime">
        {formatDateDisplay(order?.bookingDate)},&nbsp;&nbsp;&nbsp;{formatTimeSlotDisplay(order?.timeSlot)}
      </p>

      {/* Subscription Redeemed - only when true */}
      {order?.subscriptionRedeemed && (
        <p className="od-subscription-redeemed">Subscription redeemed</p>
      )}

      {/* Price Breakdown */}
      <div className="od-price-breakdown">
        <div className="od-price-row">
          <span className="od-price-label">Sub total</span>
          <span className="od-price-colon">:</span>
          <span className="od-price-value">{formatAmount(order?.originalAmount)}</span>
        </div>
        <div className="od-price-row">
          <span className="od-price-label">Membership discount</span>
          <span className="od-price-colon">:</span>
          <span className="od-price-value">{formatAmount(order?.membershipDiscount ?? order?.waterDiscountApplied)}</span>
        </div>
        <div className="od-price-row">
          <span className="od-price-label">Signup Bonus</span>
          <span className="od-price-colon">:</span>
          <span className="od-price-value">{formatAmount(order?.signupBonus ?? 0)}</span>
        </div>
        <div className="od-price-divider"></div>
        <div className="od-price-row od-total-row">
          <span className="od-price-label"><strong>Grand Total</strong></span>
          <span className="od-price-colon">:</span>
          <span className="od-price-value"><strong>{formatAmount(order?.payableAmount)}</strong></span>
        </div>
      </div>

      {/* Status Badge or Action Buttons */}
      {String(order?.status || '').toLowerCase() === 'completed' ? (
        <div className="od-status-badge od-status-completed">completed</div>
      ) : String(order?.status || '').toLowerCase() === 'cancelled' ? (
        <div className="od-status-badge od-status-cancelled">cancelled</div>
      ) : String(order?.status || '').toLowerCase() === 'in_servicing' ? (
        <div className="od-status-badge od-status-in-servicing">IN_SERVICING</div>
      ) : (
        <div className="od-actions-row">
          <button className="od-reschedule-btn" onClick={handleRescheduleClick}>Re-schedule</button>
          <button className="od-cancel-btn" onClick={handleCancelClick} disabled={cancelLoading}>
            {cancelLoading ? 'Loading...' : 'cancel'}
          </button>
        </div>
      )}
      {String(order?.status || '').toLowerCase() === 'completed' && (
        <div className="od-invoice-section">
          <button
            className="od-download-btn"
            onClick={handleDownloadInvoice}
            disabled={downloadingInvoice}
          >
            {downloadingInvoice ? 'Downloading...' : '📄 Download Invoice'}
          </button>
          {invoiceNumber && (
            <p className="od-invoice-number">Invoice #: {invoiceNumber}</p>
          )}
        </div>
      )}

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
