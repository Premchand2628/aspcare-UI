import sys
sys.stdout.reconfigure(encoding='utf-8')

# ─── RewardsCalculation.jsx ─────────────────────────────────
jsx = r"""import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import '../styles/RewardsCalculation.css';

/* ── Tier tabs ── */
const TIERS = [
  { id: '200d-300d',  label: '200d \u2013 300d',  image: '/images/car-scent.png',          name: 'Car Scent'     },
  { id: '300d-500d',  label: '300d \u2013 500d',  image: '/images/car-keychain.png',        name: 'Car Keychain'  },
  { id: '500d-1000d', label: '500d \u2013 1000d', image: '/images/car-seat.png',            name: 'Car Seat Cover'},
];

/* ── Status meta ── */
const STATUS_META = {
  completed:   { color: '#22c55e', bg: '#dcfce7', icon: '\u2714' },
  cancelled:   { color: '#ef4444', bg: '#fee2e2', icon: '\u2718' },
  pending:     { color: '#f59e0b', bg: '#fef3c7', icon: '\u23f3' },
  in_servicing:{ color: '#f59e0b', bg: '#fef3c7', icon: '\u23f3' },
};

const dropsMap = {
  'Foam-water': 50,   'Basic-water': 30,    'Premium-water': 300,
  'Foam-no-thanks': 40,'Basic-no-thanks': 20,'Premium-no-thanks': 200,
  'Foam-self-drive': 70,'Basic-self-drive': 40,'Premium-self-drive': 350,
};

const RewardsCalculation = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalDrops, setTotalDrops] = useState(0);
  const [activeTier, setActiveTier] = useState('500d-1000d');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) { setLoading(false); return; }
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetch('/bookings/me', { method: 'GET', headers });
      if (response.ok) {
        const data = await response.json();
        const processed = data.map(o => ({ ...o, drops: calculateDrops(o) }));
        setOrders(processed);
        setTotalDrops(processed.reduce((s, o) => s + o.drops, 0));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const calculateDrops = (order) => {
    const base = getBaseDrops(order);
    return (order.status || '').toLowerCase() === 'cancelled' ? 0 : base;
  };

  const getBaseDrops = (order) => {
    const wash = String(order.washType || order.serviceType || '').trim().toUpperCase();
    const water = String(order.waterOption || 'no-thanks').trim().toLowerCase();
    let wk = water;
    if (['yes','true','water'].includes(wk)) wk = 'water';
    if (['no','false','no-thanks'].includes(wk)) wk = 'no-thanks';
    if (['self-drive','selfdrive'].includes(wk)) wk = 'self-drive';
    let washKey = 'Foam';
    if (wash.includes('BASIC')) washKey = 'Basic';
    else if (wash.includes('PREMIUM')) washKey = 'Premium';
    return dropsMap[`${washKey}-${wk}`] || 20;
  };

  const formatDate = (ds) => {
    if (!ds) return 'N/A';
    const d = new Date(ds);
    return isNaN(d) ? ds : d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }).toUpperCase().replace(/ /g, '-');
  };

  const getOrderCode = (o) => (o.bookingCode ? String(o.bookingCode).trim() : `#${o.id}`);

  const statusMeta = (status) => STATUS_META[(status || '').toLowerCase()] || STATUS_META.pending;

  const activeTierData = TIERS.find(t => t.id === activeTier) || TIERS[2];

  return (
    <div className="rc-page">

      {/* ── Balance hero ── */}
      <div className="rc-hero">
        <p className="rc-hero-label">Current Balance</p>
        <div className="rc-hero-balance">
          <span className="rc-drop-icon">
            <svg viewBox="0 0 40 54" fill="none">
              <defs>
                <linearGradient id="dropG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fc3f7"/>
                  <stop offset="50%" stopColor="#1a73e8"/>
                  <stop offset="100%" stopColor="#0d47a1"/>
                </linearGradient>
              </defs>
              <path d="M20 2 C20 2 2 26 2 36 a18 18 0 0 0 36 0 C38 26 20 2 20 2z" fill="url(#dropG)"/>
              <ellipse cx="14" cy="28" rx="5" ry="8" fill="rgba(255,255,255,0.22)" transform="rotate(-20 14 28)"/>
            </svg>
          </span>
          <span className="rc-balance-num">{totalDrops}</span>
          <span className="rc-balance-d">D</span>
        </div>
        <p className="rc-hero-sub">Keep earning drops and redeem exciting rewards!</p>
      </div>

      {/* ── Tier tabs + product card ── */}
      <div className="rc-redeem-section">
        <div className="rc-tier-tabs">
          {TIERS.map(t => (
            <button
              key={t.id}
              className={`rc-tier-tab${activeTier === t.id ? ' active' : ''}`}
              onClick={() => setActiveTier(t.id)}
            >{t.label}</button>
          ))}
        </div>

        <div className="rc-products-row">
          {TIERS.map(t => (
            <div key={t.id} className={`rc-product-card${activeTier === t.id ? ' active' : ''}`}>
              <div className="rc-product-img-wrap">
                <img src={t.image} alt={t.name} onError={e => e.target.style.opacity = 0} />
              </div>
              <button className="rc-redeem-btn">
                Redeem
                <span className="rc-redeem-chevron">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Get more drops banner ── */}
      <div className="rc-promo-card">
        <div className="rc-promo-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3b4fce" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
        <div className="rc-promo-text">
          <p className="rc-promo-title">Get more drops</p>
          <p className="rc-promo-sub">Book a service and earn more drops!</p>
        </div>
        <button className="rc-promo-btn" onClick={() => navigate('/select-center')}>
          Request a booking
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
        </button>
      </div>

      {/* ── Drops you earned ── */}
      <div className="rc-history-section">
        <div className="rc-history-header">
          <span className="rc-history-title">Drops you earned</span>
          <button className="rc-view-all" onClick={() => navigate('/orders')}>
            View all
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="rc-loading">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="rc-empty">
            <div className="rc-empty-icon">
              <svg viewBox="0 0 40 54" fill="none"><path d="M20 2 C20 2 2 26 2 36 a18 18 0 0 0 36 0 C38 26 20 2 20 2z" fill="#e5e7eb"/></svg>
            </div>
            <p>No drops earned yet. Book a service to start!</p>
          </div>
        ) : (
          <div className="rc-history-list">
            {orders.slice(0, 10).map((order, idx) => {
              const meta = statusMeta(order.status);
              const drops = order.drops;
              const status = (order.status || 'pending');
              const statusLabel = status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
              const isCancelled = status.toLowerCase() === 'cancelled';
              return (
                <div key={order.id || idx} className="rc-history-item">
                  <div className="rc-history-item-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <div className="rc-history-item-main">
                    <p className="rc-history-code">{getOrderCode(order)}</p>
                    <p className="rc-history-date">Date : {formatDate(order.bookingDate)}</p>
                  </div>
                  <div className="rc-history-status" style={{ color: meta.color }}>
                    <span className="rc-status-icon-wrap" style={{ color: meta.color }}>
                      {status.toLowerCase() === 'completed' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>
                      )}
                      {status.toLowerCase() === 'cancelled' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                      )}
                      {(status.toLowerCase() === 'pending' || status.toLowerCase() === 'in_servicing') && (
                        <svg viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      )}
                    </span>
                    {statusLabel}
                  </div>
                  <div className={`rc-drops-badge${isCancelled ? ' cancelled' : drops > 0 ? ' earned' : ' pending'}`}
                       style={{ background: meta.bg, color: meta.color }}>
                    +{drops}d
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav active="profile" />
    </div>
  );
};

export default RewardsCalculation;
"""

with open(r'E:\Car wash\MainApp\src\pages\RewardsCalculation.jsx', 'w', encoding='utf-8') as f:
    f.write(jsx)
print('RewardsCalculation.jsx written OK')

# ─── RewardsCalculation.css ─────────────────────────────────
css = """/* ============================================================
   REWARDS CALCULATION PAGE
   ============================================================ */

.rc-page {
  min-height: 100vh;
  background: #f4f6fb;
  padding-bottom: 80px;
  max-width: 480px;
  margin: 0 auto;
  font-family: inherit;
}

/* ── Hero ── */
.rc-hero {
  background: linear-gradient(135deg, #1a237e 0%, #3949ab 60%, #283593 100%);
  border-radius: 0 0 28px 28px;
  padding: 36px 24px 32px;
  text-align: center;
  color: #fff;
  position: relative;
  overflow: hidden;
}

/* subtle arc decoration */
.rc-hero::after {
  content: '';
  position: absolute;
  bottom: -40px; left: -40px; right: -40px;
  height: 80px;
  border-radius: 50%;
  background: rgba(255,255,255,0.04);
  pointer-events: none;
}

.rc-hero-label {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.5px;
  margin: 0 0 12px;
}

.rc-hero-balance {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 14px;
}

.rc-drop-icon svg {
  width: 48px;
  height: 64px;
  filter: drop-shadow(0 4px 12px rgba(79,195,247,0.5));
}

.rc-balance-num {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  color: #fff;
  letter-spacing: -2px;
}

.rc-balance-d {
  font-size: 40px;
  font-weight: 800;
  color: rgba(255,255,255,0.85);
  align-self: flex-end;
  padding-bottom: 6px;
}

.rc-hero-sub {
  font-size: 13px;
  color: rgba(255,255,255,0.65);
  margin: 0;
}

/* ── Redeem section ── */
.rc-redeem-section {
  background: #fff;
  border-radius: 20px;
  margin: 16px 14px;
  padding: 18px 16px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* Tier tabs */
.rc-tier-tabs {
  display: flex;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
  margin-bottom: 16px;
}

.rc-tier-tab {
  flex: 1;
  padding: 10px 4px;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  background: #fff;
  border: none;
  cursor: pointer;
  border-right: 1px solid #e5e7eb;
  transition: background 0.2s, color 0.2s;
  white-space: nowrap;
}

.rc-tier-tab:last-child { border-right: none; }
.rc-tier-tab.active {
  background: #1a237e;
  color: #fff;
}

/* Products row */
.rc-products-row {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.rc-products-row::-webkit-scrollbar { display: none; }

.rc-product-card {
  flex: 0 0 calc(33.33% - 8px);
  min-width: 100px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  opacity: 0.55;
  transition: opacity 0.2s, transform 0.2s;
}

.rc-product-card.active {
  opacity: 1;
  transform: scale(1.03);
}

.rc-product-img-wrap {
  border-radius: 12px;
  overflow: hidden;
  border: 2.5px solid #ef4444;
  aspect-ratio: 4/3;
  background: #f0f0f0;
}

.rc-product-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.rc-redeem-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 700;
  color: #1a1f36;
  cursor: pointer;
  border-radius: 8px;
}

.rc-redeem-chevron {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e8eaf6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rc-redeem-chevron svg {
  width: 14px;
  height: 14px;
  color: #1a237e;
}

/* ── Promo banner ── */
.rc-promo-card {
  background: #fff;
  border-radius: 20px;
  margin: 0 14px 14px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.rc-promo-icon {
  width: 48px;
  height: 48px;
  min-width: 48px;
  border-radius: 14px;
  background: #eef0fb;
  display: flex;
  align-items: center;
  justify-content: center;
}

.rc-promo-icon svg {
  width: 24px;
  height: 24px;
}

.rc-promo-text { flex: 1; min-width: 0; }

.rc-promo-title {
  font-size: 14px;
  font-weight: 700;
  color: #1a1f36;
  margin: 0 0 2px;
}

.rc-promo-sub {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.rc-promo-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1a237e;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 10px 14px;
  border-radius: 24px;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.rc-promo-btn svg {
  width: 14px;
  height: 14px;
}

/* ── History ── */
.rc-history-section {
  background: #fff;
  border-radius: 20px;
  margin: 0 14px;
  padding: 18px 16px 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.rc-history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.rc-history-title {
  font-size: 16px;
  font-weight: 700;
  color: #1a1f36;
}

.rc-view-all {
  display: flex;
  align-items: center;
  gap: 2px;
  color: #3b4fce;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
}

.rc-view-all svg {
  width: 15px;
  height: 15px;
}

.rc-history-list { display: flex; flex-direction: column; }

.rc-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
}

.rc-history-item:last-child { border-bottom: none; }

.rc-history-item-icon {
  width: 44px;
  height: 44px;
  min-width: 44px;
  border-radius: 50%;
  background: #1a237e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.rc-history-item-icon svg {
  width: 20px;
  height: 20px;
}

.rc-history-item-main { flex: 1; min-width: 0; }

.rc-history-code {
  font-size: 14px;
  font-weight: 700;
  color: #1a1f36;
  margin: 0 0 2px;
}

.rc-history-date {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.rc-history-status {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.rc-status-icon-wrap svg {
  width: 18px;
  height: 18px;
}

.rc-drops-badge {
  min-width: 52px;
  text-align: center;
  padding: 6px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.rc-loading {
  text-align: center;
  padding: 30px;
  color: #888;
  font-size: 14px;
}

.rc-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 32px 16px;
  color: #888;
  font-size: 14px;
  text-align: center;
}

.rc-empty-icon svg { width: 48px; height: 64px; }

/* ── Desktop ── */
@media (min-width: 768px) {
  .rc-page { max-width: 860px; padding: 0 32px 80px; }
  .rc-hero { border-radius: 20px; margin-top: 20px; }
  .rc-balance-num { font-size: 80px; }
  .rc-drop-icon svg { width: 60px; height: 80px; }
}
"""

with open(r'E:\Car wash\MainApp\src\styles\RewardsCalculation.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('RewardsCalculation.css written OK')
print('Done.')
