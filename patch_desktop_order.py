import sys
sys.stdout.reconfigure(encoding='utf-8')

# ─────────────────────────────────────────────────────────────
# 1. Rewrite OrderDetail.jsx  (only the return block)
# ─────────────────────────────────────────────────────────────
od_path = r'E:\Car wash\MainApp\src\pages\OrderDetail.jsx'
with open(od_path, encoding='utf-8') as f:
    src = f.read()

split_marker = '  return (\n    <div className="page-container">'
idx = src.find(split_marker)
if idx == -1:
    print('ERROR: return marker not found in OrderDetail.jsx')
    sys.exit(1)

before = src[:idx]

new_return = r"""  if (loading) return <div className="od-loading">Loading order details...</div>;

  if (!order) return (
    <div className="od-page">
      <div className="od-top-bar">
        <button className="od-back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="od-order-number">Order not found</h1>
      </div>
      <BottomNav active="orders" />
    </div>
  );

  return (
    <div className="od-page">

      {/* ── Top bar ── */}
      <div className="od-top-bar">
        <button className="od-back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <h1 className="od-order-number">Order#: {displayOrderCode}</h1>
      </div>

      {/* ── Info cards: SERVICE TYPE | PHONE ── */}
      <div className="od-info-cards">
        <div className="od-info-card">
          <div className="od-info-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div className="od-info-text">
            <span className="od-info-label">SERVICE TYPE</span>
            <span className="od-info-val">{order?.serviceType || 'HOME'}</span>
          </div>
        </div>
        <div className="od-info-vdivider"></div>
        <div className="od-info-card">
          <div className="od-info-icon-wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.34 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.34a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
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
          <div className="od-dot active"></div>
          <div className="od-dot"></div>
          <div className="od-dot"></div>
        </div>
      </div>

      {/* ── Detail rows: ADDRESS | APPOINTMENT ── */}
      <div className="od-detail-rows">
        <div className="od-detail-row">
          <div className="od-detail-icon-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="od-detail-text">
            <span className="od-detail-label">SERVICE ADDRESS</span>
            <span className="od-detail-val">{order?.address || 'N/A'}</span>
          </div>
          <svg className="od-detail-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
        <div className="od-detail-row">
          <div className="od-detail-icon-wrap">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="od-detail-text">
            <span className="od-detail-label">APPOINTMENT</span>
            <span className="od-detail-val od-appt-val">
              {formatDateDisplay(order?.bookingDate)}{order?.timeSlot ? `, ${formatTimeSlotDisplay(order.timeSlot)}` : ''}
            </span>
          </div>
          <svg className="od-detail-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
        </div>
      </div>

      {/* ── Subscription redeemed ── */}
      {order?.subscriptionRedeemed && (
        <div className="od-sub-redeemed-card">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
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
          <span className="od-total-label">Grand Total</span>
          <span className="od-total-value">{formatAmount(order?.payableAmount)}</span>
        </div>
      </div>

      {/* ── Status badge or action buttons ── */}
      {String(order?.status || '').toLowerCase() === 'completed' ? (
        <div className="od-status-badge od-status-completed">&#10003; Completed</div>
      ) : String(order?.status || '').toLowerCase() === 'cancelled' ? (
        <div className="od-status-badge od-status-cancelled">&#10005; Cancelled</div>
      ) : String(order?.status || '').toLowerCase() === 'in_servicing' ? (
        <div className="od-status-badge od-status-in-servicing">In Servicing</div>
      ) : (
        <div className="od-actions-row">
          <button className="od-reschedule-btn" onClick={handleRescheduleClick}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Re-schedule
          </button>
          <button className="od-cancel-btn" onClick={handleCancelClick} disabled={cancelLoading}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            {cancelLoading ? 'Loading...' : 'Cancel'}
          </button>
        </div>
      )}

      {/* ── Invoice (completed orders) ── */}
      {String(order?.status || '').toLowerCase() === 'completed' && (
        <div className="od-invoice-section">
          <button className="od-download-btn" onClick={handleDownloadInvoice} disabled={downloadingInvoice}>
            &#128196; {downloadingInvoice ? 'Downloading...' : 'Download Invoice'}
          </button>
          {invoiceNumber && <p className="od-invoice-number">Invoice #: {invoiceNumber}</p>}
        </div>
      )}

      <BottomNav active="orders" />

      {/* ── Cancel Modal ── */}
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
                      <span className="refund-value">&#8377;{cancelQuote.bookingAmount?.toFixed(2)}</span>
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
                      <span className="refund-value-total">&#8377;{cancelQuote.refundAmount?.toFixed(2)}</span>
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

      {/* ── Reschedule Modal ── */}
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
                  <input type="date" className="date-input" value={selectedDate} onChange={handleDateChange} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Select Time Slot</label>
                  {loadingSlots ? (
                    <p className="loading-slots">Loading available slots...</p>
                  ) : (
                    <div className="slots-grid">
                      {Object.entries(availability).map(([slot, isAvailable]) => (
                        <button key={slot} className={`slot-btn ${!isAvailable ? 'slot-booked' : ''} ${selectedSlot === slot ? 'slot-selected' : ''}`} onClick={() => isAvailable && setSelectedSlot(slot)} disabled={!isAvailable}>
                          <span className="slot-time">{slot}</span>
                          <span className="slot-status">{isAvailable ? '\u2713 Available' : '\u2717 Booked'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Reason for Rescheduling (Optional)</label>
                  <textarea className="reason-input" placeholder="Tell us why you're rescheduling..." value={rescheduledReason} onChange={(e) => setRescheduledReason(e.target.value)} maxLength="500" rows="3" />
                  <span className="char-count">{rescheduledReason.length}/500</span>
                </div>
                <button className="update-booking-btn" onClick={handleUpdateBooking} disabled={!selectedDate || !selectedSlot}>
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
"""

new_content = before + new_return
with open(od_path, 'w', encoding='utf-8') as f:
    f.write(new_content)
print(f'OrderDetail.jsx written OK, lines: {new_content.count(chr(10))}')

# ─────────────────────────────────────────────────────────────
# 2. Rewrite BottomNav.jsx  (add logo + useEffect for sidebar)
# ─────────────────────────────────────────────────────────────
bn_path = r'E:\Car wash\MainApp\src\components\BottomNav.jsx'
bn_content = """import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BottomNav.css';

const BottomNav = ({ active }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = (e) => {
      if (e.matches) document.body.classList.add('has-sidebar');
      else document.body.classList.remove('has-sidebar');
    };
    apply(mq);
    mq.addEventListener('change', apply);
    return () => {
      mq.removeEventListener('change', apply);
      document.body.classList.remove('has-sidebar');
    };
  }, []);

  return (
    <nav className="bottom-nav">
      <div className="nav-logo">
        <span className="nav-logo-icon">&#128663;</span>
        <div className="nav-logo-text">
          <span className="nav-logo-title">ASP</span>
          <span className="nav-logo-sub">car care</span>
        </div>
      </div>
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="nav-icon">&#127968;</span>
        <span className="nav-label">Home</span>
      </button>
      <button
        className={`nav-item ${active === 'orders' ? 'active' : ''}`}
        onClick={() => navigate('/orders')}
      >
        <span className="nav-icon">&#128203;</span>
        <span className="nav-label">Orders</span>
      </button>
      <button
        className={`nav-item ${active === 'membership' ? 'active' : ''}`}
        onClick={() => navigate('/my-subscriptions')}
      >
        <span className="nav-icon">&#128179;</span>
        <span className="nav-label">Subscriptions</span>
      </button>
      <button
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <span className="nav-icon">&#128100;</span>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
"""
with open(bn_path, 'w', encoding='utf-8') as f:
    f.write(bn_content)
print(f'BottomNav.jsx written OK, lines: {bn_content.count(chr(10))}')

# ─────────────────────────────────────────────────────────────
# 3. Rewrite BottomNav.css  (keep mobile + add desktop sidebar)
# ─────────────────────────────────────────────────────────────
bn_css_path = r'E:\Car wash\MainApp\src\styles\BottomNav.css'
bn_css = """/* ── Mobile bottom nav (default) ── */
.bottom-nav {
  position: fixed;
  bottom: max(0px, var(--safe-area-bottom, 0px));
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: var(--app-max-width, 480px);
  background-color: #1a237e;
  border-radius: 10px 10px 0 0;
  padding: 12px 16px calc(12px + var(--safe-area-bottom, 0px));
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.2);
  z-index: 1000;
}

.nav-logo {
  display: none;
}

.nav-item {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.nav-item:hover {
  transform: translateY(-2px);
}

.nav-item.active {
  background-color: #FFD700;
}

.nav-icon {
  font-size: 20px;
}

.nav-item.active .nav-icon {
  filter: brightness(0.8);
}

.nav-label {
  font-size: 11px;
  color: white;
  font-weight: 500;
}

.nav-item.active .nav-label {
  color: #1a237e;
}

/* ── Mobile small ── */
@media (max-width: 480px) {
  .bottom-nav {
    padding: 10px 12px calc(10px + var(--safe-area-bottom, 0px));
  }
  .nav-item { padding: 5px 8px; gap: 3px; }
  .nav-icon  { font-size: 18px; }
  .nav-label { font-size: 10px; }
}

/* ── Desktop sidebar ── */
@media (min-width: 768px) {
  .bottom-nav {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    right: auto;
    width: 220px;
    height: 100vh;
    max-width: 220px;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 0 0 24px 0;
    border-radius: 0;
    transform: none;
    box-shadow: 2px 0 20px rgba(0, 0, 0, 0.18);
    gap: 4px;
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 28px 20px 20px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 16px;
    flex-shrink: 0;
  }

  .nav-logo-icon {
    font-size: 30px;
    line-height: 1;
  }

  .nav-logo-text {
    display: flex;
    flex-direction: column;
    gap: 1px;
  }

  .nav-logo-title {
    font-size: 22px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
    letter-spacing: 1px;
  }

  .nav-logo-sub {
    font-size: 10px;
    color: rgba(255, 255, 255, 0.65);
    letter-spacing: 2.5px;
    text-transform: uppercase;
  }

  .nav-item {
    flex-direction: row;
    justify-content: flex-start;
    padding: 13px 20px;
    border-radius: 0 28px 28px 0;
    margin-right: 16px;
    gap: 14px;
    transform: none !important;
  }

  .nav-item:hover {
    background: rgba(255, 255, 255, 0.09);
  }

  .nav-item.active {
    background-color: #FFD700;
  }

  .nav-icon  { font-size: 22px; }
  .nav-label { font-size: 14px; font-weight: 600; }

  .nav-item.active .nav-label { color: #1a237e; font-weight: 700; }
  .nav-item.active .nav-icon  { filter: none; }
}
"""
with open(bn_css_path, 'w', encoding='utf-8') as f:
    f.write(bn_css)
print(f'BottomNav.css written OK, lines: {bn_css.count(chr(10))}')

# ─────────────────────────────────────────────────────────────
# 4. Patch global.css  (add has-sidebar body padding)
# ─────────────────────────────────────────────────────────────
global_css_path = r'E:\Car wash\MainApp\src\styles\global.css'
with open(global_css_path, encoding='utf-8') as f:
    gcss = f.read()

sidebar_rule = """
/* ── Desktop sidebar offset ── */
@media (min-width: 768px) {
  body.has-sidebar {
    padding-left: 220px;
  }
}
"""

if 'has-sidebar' not in gcss:
    with open(global_css_path, 'a', encoding='utf-8') as f:
        f.write(sidebar_rule)
    print('global.css patched with has-sidebar rule')
else:
    print('global.css already has has-sidebar rule')

# ─────────────────────────────────────────────────────────────
# 5. Patch OrderDetail.css  (add desktop overrides)
# ─────────────────────────────────────────────────────────────
od_css_path = r'E:\Car wash\MainApp\src\styles\OrderDetail.css'
with open(od_css_path, encoding='utf-8') as f:
    od_css = f.read()

desktop_overrides = """
/* =========================================
   DESKTOP OVERRIDES (>= 768px)
   ========================================= */
@media (min-width: 768px) {
  .od-page {
    max-width: 860px;
    margin: 0 auto;
    padding: 24px 32px 60px;
    background: #fff;
    min-height: 100vh;
  }

  .od-top-bar {
    padding: 0 0 20px 0;
    background: transparent;
  }

  .od-order-number { font-size: 22px; }

  /* Info cards become one unified card with vertical divider */
  .od-info-cards {
    flex-direction: row;
    padding: 0;
    background: #fff;
    border: 1.5px solid #e8e8f0;
    border-radius: 14px;
    padding: 16px 20px;
    gap: 0;
    align-items: center;
    margin-bottom: 20px;
  }

  .od-info-card {
    border: none;
    border-radius: 0;
    background: transparent;
    padding: 0;
    flex: 1;
  }

  .od-info-vdivider {
    width: 1px;
    height: 48px;
    background: #e0e0e8;
    flex-shrink: 0;
    margin: 0 20px;
    display: block;
  }

  /* Car image taller */
  .od-image-wrapper { margin: 0 0 20px; border-radius: 16px; }
  .od-service-image { height: 260px; }

  /* Detail rows become single card with horizontal layout */
  .od-detail-rows {
    flex-direction: row;
    margin: 0 0 20px;
  }

  .od-detail-row {
    flex: 1;
    border-bottom: none;
    border-right: 1px solid #f0eff8;
    padding: 16px 20px;
  }

  .od-detail-row:last-child { border-right: none; }

  /* Subscription redeemed */
  .od-sub-redeemed-card { margin: 0 0 20px; }

  /* Price breakdown */
  .od-price-breakdown { margin: 0 0 20px; padding: 20px 24px; }
  .od-price-label  { font-size: 15px; }
  .od-price-value  { font-size: 15px; }
  .od-total-label  { font-size: 16px; }
  .od-total-value  { font-size: 16px; }

  /* Action buttons */
  .od-actions-row { margin: 0 0 20px; gap: 16px; }
  .od-reschedule-btn, .od-cancel-btn { font-size: 16px; padding: 16px 0; }

  /* Status badge */
  .od-status-badge { margin: 0 0 20px; }

  /* Modals center on desktop */
  .modal-overlay { align-items: center; padding: 24px; }
  .cancel-popup, .reschedule-popup {
    border-radius: 20px;
    max-width: 520px;
    max-height: 80vh;
  }
}
"""

if 'DESKTOP OVERRIDES' not in od_css:
    with open(od_css_path, 'a', encoding='utf-8') as f:
        f.write(desktop_overrides)
    print('OrderDetail.css patched with desktop overrides')
else:
    print('OrderDetail.css already has desktop overrides')

print('All files updated.')
