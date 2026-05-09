import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { clearAuthSession, getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readSubscriptionsCache, writeSubscriptionsCache } from '../utils/subscriptionsCache';
import '../styles/MySubscriptions.css';
import { SubscriptionsListSkeleton, useDelayedFlag, LoadingAnnouncer } from '../components/Skeleton';

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

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

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
  const showLoadingSkeleton = useDelayedFlag(loading, 150);
  const [error, setError] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError('');

        const authToken = getValidatedAuthToken();
        if (!authToken) {
          setNotLoggedIn(true);
          return;
        }

        const userPhone = localStorage.getItem('userPhone');
        if (!userPhone || userPhone === 'null' || userPhone.trim() === '') {
          setItems([]);
          return;
        }

        const headers = withAuthHeader({
          Accept: 'application/json'
        });

        const cached = readSubscriptionsCache();
        if (cached) {
          setItems(cached);
          setLoading(false);
          return;
        }

        const response = await fetch('/memberships/deal-price-bookings/me', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearAuthSession();
            setError('Session expired. Please login again.');
            setTimeout(() => navigate('/login'), 600);
            return;
          }

          if (response.status === 403) {
            setError('Access denied for current session. Please login again.');
            return;
          }

          const message = await response.text();
          throw new Error(message || 'Failed to fetch subscriptions');
        }

        const data = await response.json();
        const nextItems = Array.isArray(data) ? data : [];
        writeSubscriptionsCache(nextItems);
        setItems(nextItems);
        setExpandedRowId(null);
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

      {loading && (
        <>
          <LoadingAnnouncer label="Loading subscriptions" />
          {showLoadingSkeleton && <SubscriptionsListSkeleton count={2} />}
        </>
      )}
      {!loading && notLoggedIn && (
        <div className="subscriptions-login-prompt">
          <div className="subscriptions-login-icon">�</div>
          <h2 className="subscriptions-login-title">Please login to view your subscriptions</h2>
          <p className="subscriptions-login-desc">Sign in or sign up to view and manage your plans</p>
          <button className="subscriptions-login-btn" onClick={() => navigate('/login', { state: { from: { pathname: '/my-subscriptions' } } })}>Login / Signup</button>
        </div>
      )}
      {!loading && error && !notLoggedIn && <p className="subscriptions-error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="subscriptions-empty">
          <p>No subscriptions found yet.</p>
          <button onClick={() => navigate('/offers')}>Explore Offers</button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="subscriptions-list">
          <p className="subscriptions-tap-hint">Tap to view the details</p>
          {items.map((item) => {
            const leftWashes = Number(item.leftWashes ?? 0);
            const isBookDisabled = leftWashes <= 0;
            const isHome = normalizeServiceType(item.serviceType) === 'HOME';
            const needsWater = String(item.waterProvided || '').toUpperCase() === 'Y';
            const tagline = isHome ? (needsWater ? 'Sit, Book, Relax' : 'Sit, Book & Relax') : 'Book and get it done';
            const locationLabel = isHome ? '@Home' : '@Center';

            return (
            <div
              key={item.id}
              className={`subscription-card ${expandedRowId === item.id ? 'subscription-card-active' : ''}`}
              onClick={() => toggleRow(item.id)}
            >
              <div className="subscription-compact-row">
                <p className="subscription-tagline">{tagline}</p>
                <p className="subscription-left-text">
                  <span className="left-label">Left:</span> <span className={`left-count ${leftWashes >= 3 ? 'washes-green' : leftWashes === 2 ? 'washes-orange' : 'washes-red'}`}>{leftWashes}</span>
                </p>
              </div>

              <div className="subscription-desc-row">
                <p className="subscription-description">
                  Book your <strong className="highlight-car-type">{item.carType || 'N/A'}</strong> {item.washType || 'N/A'} wash <strong className="highlight-service-type">{locationLabel}</strong>
                </p>
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
                    Book
                  </button>
              </div>

              {isHome && needsWater && (
                <p className="subscription-water-note">Please provide water to the washer</p>
              )}

              {expandedRowId === item.id && (
                <div className="subscription-details-block">
                  <div className="detail-row">
                    <span className="detail-label">Plan code</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{item.planTypeCode || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Start date</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Exp date</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{formatDate(item.expiryDate)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Actual Amount</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{formatCurrency(item.originalAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Discount</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{Number(item.discountPercentApplied || 0)}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amount paid</span>
                    <span className="detail-sep">:</span>
                    <span className="detail-value">{formatCurrency(item.payableAmount)}</span>
                  </div>
                </div>
              )}
            </div>
            );
          })}
        </div>
      )}

      <BottomNav active="membership" />
    </div>
  );
}

export default MySubscriptions;
