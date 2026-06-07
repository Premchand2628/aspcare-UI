import sys
sys.stdout.reconfigure(encoding='utf-8')

# ── Read file ────────────────────────────────────────────────
f = open(r'E:\Car wash\MainApp\src\pages\OrderDetail.jsx', encoding='utf-8')
src = f.read(); f.close()

# ── Replace the JSX return block only (keep all logic above it) ──
OLD_RETURN = """  return (
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
      <BottomNav active="orders" />"""

NEW_RETURN = """  return (
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

      {/* ── Service Type & Phone info cards ── */}
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
            <span className="od-detail-val">
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

      {/* ── Invoice download (completed orders) ── */}
      {String(order?.status || '').toLowerCase() === 'completed' && (
        <div className="od-invoice-section">
          <button className="od-download-btn" onClick={handleDownloadInvoice} disabled={downloadingInvoice}>
            {downloadingInvoice ? 'Downloading...' : '\U0001F4C4 Download Invoice'}
          </button>
          {invoiceNumber && <p className="od-invoice-number">Invoice #: {invoiceNumber}</p>}
        </div>
      )}

      {/* ── Bottom Navigation ── */}
      <BottomNav active="orders" />"""

if OLD_RETURN in src:
    src = src.replace(OLD_RETURN, NEW_RETURN, 1)
    print('JSX return: OK')
else:
    print('JSX return: NOT FOUND - checking partial...')
    # check first 100 chars
    print(repr(src[src.find('return ('):src.find('return (')+200]))

with open(r'E:\Car wash\MainApp\src\pages\OrderDetail.jsx', 'w', encoding='utf-8') as f:
    f.write(src)

print('JSX done')
