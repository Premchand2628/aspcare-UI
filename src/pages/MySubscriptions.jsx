import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/MySubscriptions.css';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatDateTime = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const normalizeWater = (value) => (String(value || '').toUpperCase() === 'Y' ? 'Yes' : 'No');

const normalizeServiceType = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SELFDRIVE') return 'SELF_DRIVE';
  if (normalized === 'SELF DRIVE') return 'SELF_DRIVE';
  if (normalized === 'HOME') return 'HOME';
  return normalized || 'SELF_DRIVE';
};

function MySubscriptions() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId(id);
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError('');

        const authTokenRaw = (
          localStorage.getItem('authToken') ||
          localStorage.getItem('token') ||
          localStorage.getItem('jwt') ||
          ''
        ).trim();

        const isLikelyJwt = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(authTokenRaw);
        const authToken = isLikelyJwt ? authTokenRaw : '';

        if (authToken) {
          localStorage.setItem('authToken', authToken);
        } else {
          localStorage.removeItem('authToken');
        }

        const headers = {
          Accept: 'application/json'
        };

        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch('/memberships/deal-price-bookings/me', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('authToken');
            setError('Session expired. Please login again.');
            setTimeout(() => navigate('/login'), 600);
            return;
          }

          if (response.status === 403) {
            const phone = (localStorage.getItem('userPhone') || '').trim();
            if (phone) {
              const fallback = await fetch(`/memberships/deal-price-bookings/by-phone?phone=${encodeURIComponent(phone)}`, {
                method: 'GET',
                headers: {
                  Accept: 'application/json'
                }
              });

              if (fallback.ok) {
                const fallbackData = await fallback.json();
                const nextItems = Array.isArray(fallbackData) ? fallbackData : [];
                setItems(nextItems);
                setExpandedRowId(nextItems.length > 0 ? nextItems[0].id : null);
                return;
              }
            }

            setError('Access denied for current session. Please login again.');
            return;
          }

          const message = await response.text();
          throw new Error(message || 'Failed to fetch subscriptions');
        }

        const data = await response.json();
        const nextItems = Array.isArray(data) ? data : [];
        setItems(nextItems);
        setExpandedRowId(nextItems.length > 0 ? nextItems[0].id : null);
      } catch (err) {
        console.error('MySubscriptions fetch error:', err);
        setError('Unable to load subscriptions right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  return (
    <div className="page-container my-subscriptions-page">
      <header className="subscriptions-header">
        <button className="subscriptions-back-btn" onClick={() => navigate('/profile')}>←</button>
        <h1>My Subscriptions</h1>
        <div className="subscriptions-header-spacer" />
      </header>
      <div className="subscriptions-strip-line" />

      {loading && <p className="subscriptions-state">Loading subscriptions...</p>}
      {!loading && error && <p className="subscriptions-error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="subscriptions-empty">
          <p>No subscriptions found yet.</p>
          <button onClick={() => navigate('/offers')}>Explore Offers</button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="subscriptions-list">
          {items.map((item) => {
            const leftWashes = Number(item.leftWashes ?? 0);
            const isBookDisabled = leftWashes <= 0;

            return (
            <div
              key={item.id}
              className={`subscription-card ${expandedRowId === item.id ? 'subscription-card-active' : ''}`}
              onClick={() => toggleRow(item.id)}
            >
              <div className="subscription-compact-row">
                <h3 className="subscription-title">
                  <span className="title-car-type">{item.carType || 'N/A'}</span>
                  <span className="title-separator"> • </span>
                  <span className="title-service-type">{item.serviceType || 'N/A'}</span>
                  <span className="title-separator"> • </span>
                  <span className="title-wash-type">{item.washType || 'N/A'}</span>
                </h3>
                <button
                  className="subscription-book-btn"
                  disabled={isBookDisabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isBookDisabled) {
                      return;
                    }
                    const normalizedServiceType = normalizeServiceType(item.serviceType);
                    const destination = normalizedServiceType === 'HOME' ? '/booking' : '/select-center';
                    navigate(destination, {
                      state: {
                        serviceType: normalizedServiceType,
                        subscription: item,
                        source: 'my-subscriptions'
                      }
                    });
                  }}
                >
                  Book now
                </button>
              </div>

              <div className="subscription-expand-row">
                <p className="subscription-left-text">
                  <span className="left-count">{leftWashes}</span> washes left
                </p>
              </div>

              {expandedRowId === item.id && (
                <>
                  <div className="subscription-top-row">
                    <span className={`status-pill ${String(item.paymentStatus || '').toUpperCase() === 'SUCCESS' ? 'success' : 'pending'}`}>
                      {item.paymentStatus || 'N/A'}
                    </span>
                  </div>

                  <p className="subscription-meta">Water Provided: {normalizeWater(item.waterProvided)}</p>
                  <p className="subscription-meta">Plan Code: {item.planTypeCode || 'N/A'}</p>
                  <p className="subscription-meta">Transaction: {item.transactionId || 'N/A'}</p>
                  <p className="subscription-meta">Date: {formatDateTime(item.createdAt)}</p>

                  <div className="subscription-usage">
                    <div>
                      <span>Total Washes</span>
                      <strong>{Number(item.totalWashes ?? 0)}</strong>
                    </div>
                    <div>
                      <span>Used</span>
                      <strong>{Number(item.usedWashes ?? 0)}</strong>
                    </div>
                    <div>
                      <span>Left</span>
                      <strong>{leftWashes}</strong>
                    </div>
                  </div>

                  <div className="subscription-pricing">
                    <div>
                      <span>Original</span>
                      <strong>{formatCurrency(item.originalAmount)}</strong>
                    </div>
                    <div>
                      <span>Payable</span>
                      <strong>{formatCurrency(item.payableAmount)}</strong>
                    </div>
                    <div>
                      <span>Discount</span>
                      <strong>{Number(item.discountPercentApplied || 0)}%</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
            );
          })}
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
}

export default MySubscriptions;
