import sys
sys.stdout.reconfigure(encoding='utf-8')

# ── 1. BottomNav.jsx ─────────────────────────────────────────
bn_jsx = r"""import React, { useEffect } from 'react';
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

      {/* ── Desktop only: logo ── */}
      <div className="nav-logo">
        <span className="nav-logo-icon">&#128663;</span>
        <div className="nav-logo-text">
          <span className="nav-logo-title">ASP</span>
          <span className="nav-logo-sub">car care</span>
        </div>
      </div>

      {/* Home */}
      <button
        className={`nav-item ${active === 'home' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <span className="nav-label">Home</span>
      </button>

      {/* Bookings */}
      <button
        className={`nav-item ${active === 'orders' ? 'active' : ''}`}
        onClick={() => navigate('/orders')}
      >
        <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span className="nav-label">Bookings</span>
      </button>

      {/* Book Now — center FAB */}
      <button
        className="nav-item nav-book-now"
        onClick={() => navigate('/booking')}
      >
        <div className="nav-fab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </div>
        <span className="nav-label">Book Now</span>
      </button>

      {/* Passes / Subscriptions */}
      <button
        className={`nav-item ${active === 'membership' ? 'active' : ''}`}
        onClick={() => navigate('/my-subscriptions')}
      >
        <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <span className="nav-label">Passes</span>
      </button>

      {/* Profile */}
      <button
        className={`nav-item ${active === 'profile' ? 'active' : ''}`}
        onClick={() => navigate('/profile')}
      >
        <svg className="nav-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="nav-label">Profile</span>
      </button>

    </nav>
  );
};

export default BottomNav;
"""

with open(r'E:\Car wash\MainApp\src\components\BottomNav.jsx', 'w', encoding='utf-8') as f:
    f.write(bn_jsx)
print('BottomNav.jsx written OK')

# ── 2. BottomNav.css ─────────────────────────────────────────
bn_css = """/* ===========================================
   BOTTOM NAV — mobile default
   =========================================== */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: #0f1624;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 4px;
  z-index: 1000;
  box-shadow: 0 -1px 0 rgba(255,255,255,0.06);
}

/* Desktop logo — hidden on mobile */
.nav-logo { display: none; }

/* ── Generic nav item ── */
.nav-item {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 10px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
  position: relative;
}

.nav-svg {
  width: 22px;
  height: 22px;
  color: #6b7280;
  transition: color 0.15s;
  flex-shrink: 0;
}

.nav-label {
  font-size: 10px;
  color: #6b7280;
  font-weight: 500;
  white-space: nowrap;
  transition: color 0.15s;
}

/* ── Active state ── */
.nav-item.active .nav-svg  { color: #3b82f6; }
.nav-item.active .nav-label { color: #3b82f6; font-weight: 600; }

/* ── Center FAB (Book Now) ── */
.nav-book-now {
  flex: 1;
  position: relative;
}

.nav-fab {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2px;
  margin-top: -24px;   /* lifts it above the bar */
  box-shadow: 0 4px 18px rgba(59,130,246,0.55);
  transition: transform 0.15s, box-shadow 0.15s;
}

.nav-fab svg {
  width: 24px;
  height: 24px;
  color: #fff;
}

.nav-book-now:hover .nav-fab {
  transform: scale(1.07);
  box-shadow: 0 6px 22px rgba(59,130,246,0.7);
}

.nav-book-now .nav-label { color: #9ca3af; font-size: 10px; }

/* =========================================
   DESKTOP — left sidebar (>= 768px)
   ========================================= */
@media (min-width: 768px) {
  .bottom-nav {
    position: fixed;
    left: 0;
    top: 0;
    right: auto;
    bottom: 0;
    width: 220px;
    height: 100vh;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    padding: 0 0 24px;
    gap: 2px;
    box-shadow: 2px 0 16px rgba(0,0,0,0.3);
  }

  .nav-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 28px 20px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    margin-bottom: 12px;
    flex-shrink: 0;
  }

  .nav-logo-icon { font-size: 28px; }

  .nav-logo-text { display: flex; flex-direction: column; gap: 1px; }
  .nav-logo-title { font-size: 20px; font-weight: 800; color: #fff; line-height: 1; letter-spacing: 1px; }
  .nav-logo-sub   { font-size: 9px; color: rgba(255,255,255,0.5); letter-spacing: 2.5px; text-transform: uppercase; }

  .nav-item {
    flex-direction: row;
    justify-content: flex-start;
    padding: 13px 20px;
    border-radius: 0 28px 28px 0;
    margin-right: 16px;
    gap: 14px;
    flex: 0 0 auto;
  }

  .nav-item:hover { background: rgba(255,255,255,0.07); }
  .nav-item.active { background: rgba(59,130,246,0.18); }
  .nav-item.active .nav-svg  { color: #3b82f6; }
  .nav-item.active .nav-label { color: #3b82f6; font-size: 14px; font-weight: 700; }

  .nav-svg   { width: 20px; height: 20px; }
  .nav-label { font-size: 14px; font-weight: 500; color: #9ca3af; }

  /* FAB becomes a normal row item on desktop */
  .nav-book-now { flex: 0 0 auto; }

  .nav-fab {
    width: 36px;
    height: 36px;
    margin-top: 0;
    flex-shrink: 0;
  }

  .nav-fab svg { width: 18px; height: 18px; }

  .nav-book-now .nav-label { font-size: 14px; font-weight: 600; color: #3b82f6; }
}
"""

with open(r'E:\Car wash\MainApp\src\styles\BottomNav.css', 'w', encoding='utf-8') as f:
    f.write(bn_css)
print('BottomNav.css written OK')
print('Done.')
