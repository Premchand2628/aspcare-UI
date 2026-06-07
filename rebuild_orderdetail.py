import sys
sys.stdout.reconfigure(encoding='utf-8')

content = r'''import React, { useState, useEffect } from 'react';
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
      const response = await fetch('/bookings/me', { method: 'GET', headers });
      if (response.ok) {
        const data = await response.json();
        const numericId = Number(id);
        const foundOrder = data.find((o) => {
          const orderBookingCode = String(o?.bookingCode || '').trim();
          if (orderBookingCode && orderBookingCode === String(id).trim()) return true;
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
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetch(`/bookings/${id}/cancel-quote`, { method: 'GET', headers });
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
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetch(`/bookings/${id}/cancel-confirm`, { method: 'POST', headers });
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
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
    fetchAvailability(today, order?.serviceType || 'HOME');
  };

  const fetchAvailability = async (date, serviceType) => {
    setLoadingSlots(true);
    try {
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetch(`/bookings/availability?date=${date}&serviceType=${serviceType}`, { method: 'GET', headers });
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
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetch(`/bookings/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ bookingDate: selectedDate, timeSlot: selectedSlot, rescheduledReason })
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
      if (!authToken) { alert('Please login to download invoice'); return; }
      const bookingId = order?.id || id;
      const headers = withAuthHeader({ 'Accept': 'application/pdf' });
      const response = await fetch(`/bookings/${bookingId}/invoice`, { method: 'GET', headers });
      if (!response.ok) {
        if (response.status === 404) { alert('Invoice is not available for this booking'); return; }
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

  const formatAmount = (value) => {
    const amount = Number(value ?? 0);
    return `\u20B9${amount.toFixed(2)}`;
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
    return slot.toUpperCase();
  };

  if (loading) {
    return (
      <div className="od-page">
        <div className="od-loading">Loading order details...</div>
        <BottomNav active="orders" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="od-page">
        <div className="od-top-bar">
          <button className="od-back-btn" onClick={() => navigate(-1)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <h1 className="od-order-number">Order Not Found</h1>
        </div>
        <BottomNav active="orders" />
      </div>
    );
  }

  return (
    <div className="od-page">

      {/* ── Top bar ── */}
      <div className="od-top-bar">
        <button className="od-back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <h1 className="od-order-number">Order#: {displayOrderCode}</h1>
      </div>

      {/* ── Info cards: SERVICE TYPE & PHONE ── */}
      <div className="od-info-cards">
        <div className="od-info-card">
          <div className="od-info-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="od-info-text">
            <span className="od-info-label">SERVICE TYPE</span>
            <span className="od-info-val">{order?.serviceType || 'HOME'}</span>
          </div>
        </div>
        <div className="od-info-card">
          <div className="od-info-icon-wrap">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.7 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.68a16 16 0 0 0 6.29 6.29l1.04-1.04a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </div>
          <div className="od-info-text">
            <span className="od-info-label">CUSTOMER PHONE</span>
            <span className="od-info-val">{userPhone}</span>
          </div>
        </div>
      </div>

      {/* ── Car image ── */}
      <div className="od-image-wrapper">
        <img className="od-service-image" src="/images/suv.png" alt="Car Wash Service" />
        <div className="od-img-dots">
          <span className="od-dot active"></span>
          <span className="od-dot"></span>
          <span className="od-dot"></span>
        </div>
      </div>

      {/* ── Detail rows ── */}
      <div className="od-detail-rows">
        <div className="od-detail-row">
          <div className="od-detail-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="od-detail-text">
            <span className="od-detail-label">SERVICE ADDRESS</span>
            <span className="od-detail-val">{order?.address || 'N/A'}</span>
          </div>
          <svg className="od-detail-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>

        <div className="od-detail-row">
          <div className="od-detail-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
            </svg>
          </div>
          <div className="od-detail-text">
            <span className="od-detail-label">APPOINTMENT</span>
            <span className="od-detail-val od-appt-val">
              {formatDateDisplay(order?.bookingDate)}{order?.timeSlot ? `, ${formatTimeSlotDisplay(order.timeSlot)}` : ''}
            </span>
          </div>
          <svg className="od-detail-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </div>
      </div>

      {/* ── Subscription redeemed ── */}
      {order?.subscriptionRedeemed && (
        <div className="od-sub-redeemed-card">
          <span className="od-sub-redeemed-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#43a047" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </span>
          <span className="od-sub-redeemed-text">Subscription redeemed</span>
        </div>
      )}

      {/* ── Price breakdown ── */}
      <div className="od-price-breakdown">
        <div className="od-price-row">
          <span className="od-price-label">Sub total</span>
          <span className="od-price-value">{formatAmount(order?.originalAmount)}</span>
        </div>
        <div className="od-price-row">
          <span className="od-price-label">Membership discount</span>
          <span className="od-price-value">{formatAmount(order?.membershipDiscount ?? order?.waterDiscountApplied)}</span>
        </div>
        <div className="od-price-row">
          <span className="od-price-label">Signup Bonus</span>
          <span className="od-price-value">{formatAmount(order?.signupBonus ?? 0)}</span>
        </div>
        <div className="od-price-divider"></div>
        <div className="od-price-row od-total-row">
          <span className="od-price-label od-total-label">Grand Total</span>
          <span className="od-price-value od-total-value">{formatAmount(order?.payableAmount)}</span>
        </div>
      </div>

      {/* ── Status badge or action buttons ── */}
      {String(order?.status || '').toLowerCase() === 'completed' ? (
        <div className="od-status-badge od-status-completed">Completed</div>
      ) : String(order?.status || '').toLowerCase() === 'cancelled' ? (
        <div className="od-status-badge od-status-cancelled">Cancelled</div>
      ) : String(order?.status || '').toLowerCase() === 'in_servicing' ? (
        <div className="od-status-badge od-status-in-servicing">In Servicing</div>
      ) : (
        <div className="od-actions-row">
          <button className="od-reschedule-btn" onClick={handleRescheduleClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
            </svg>
            Re-schedule
          </button>
          <button className="od-cancel-btn" onClick={handleCancelClick} disabled={cancelLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {cancelLoading ? 'Loading...' : 'Cancel'}
          </button>
        </div>
      )}

      {/* ── Invoice download (completed) ── */}
      {String(order?.status || '').toLowerCase() === 'completed' && (
        <div className="od-invoice-section">
          <button className="od-download-btn" onClick={handleDownloadInvoice} disabled={downloadingInvoice}>
            {downloadingInvoice ? 'Downloading...' : '\uD83D\uDCC4 Download Invoice'}
          </button>
          {invoiceNumber && <p className="od-invoice-number">Invoice #: {invoiceNumber}</p>}
        </div>
      )}

      <BottomNav active="orders" />

      {/* ── Cancel Popup ── */}
      {showCancelPopup && cancelQuote && (
        <div className="modal-overlay">
          <div className="cancel-popup">
            <div className="popup-header">
              <button className="popup-back-btn" onClick={() => setShowCancelPopup(false)}>&#8592;</button>
              <h2>Cancellation Details</h2>
              <div className="popup-spacer"></div>
            </div>
            <div className="popup-content">
              {!cancelQuote.eligible ? (
                <div className="cancel-ineligible">
                  <div className="ineligible-icon">&#10060;</div>
                  <p className="ineligible-message">{cancelQuote.message}</p>
                </div>
              ) : (
                <div className="cancel-eligible">
                  <div className="refund-card">
                    <h3>Refund Information</h3>
                    <div className="refund-item">
                      <span className="refund-label">Booking Amount:</span>
                      <span className="refund-value">\u20B9{cancelQuote.bookingAmount?.toFixed(2)}</span>
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
                      <span className="refund-value-total">\u20B9{cancelQuote.refundAmount?.toFixed(2)}</span>
                    </div>
                    <p className="refund-message">{cancelQuote.message}</p>
                  </div>
                  <div className="popup-actions">
                    <button className="cancel-confirm-btn" onClick={handleConfirmCancel} disabled={cancelling}>
                      {cancelling ? 'Processing...' : 'Confirm Cancellation'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Popup ── */}
      {showReschedulePopup && order && (
        <div className="modal-overlay">
          <div className="reschedule-popup">
            <div className="popup-header">
              <button className="popup-back-btn" onClick={() => setShowReschedulePopup(false)}>&#8592;</button>
              <h2>Reschedule Booking</h2>
              <div className="popup-spacer"></div>
            </div>
            <div className="popup-content">
              <div className="reschedule-form">
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
                          <span className="slot-status">{isAvailable ? '\u2713 Available' : '\u2717 Booked'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
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
'''

with open(r'E:\Car wash\MainApp\src\pages\OrderDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('OrderDetail.jsx written OK, lines:', content.count('\n'))
