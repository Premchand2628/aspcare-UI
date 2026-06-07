import sys
sys.stdout.reconfigure(encoding='utf-8')

# ─────────────────────────────────────────────────────────────
# 1. Rewrite BottomNav.jsx  (add logo + useEffect for sidebar)
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
print(f'BottomNav.jsx written OK')

# ─────────────────────────────────────────────────────────────
# 2. Rewrite BottomNav.css  (mobile + desktop sidebar)
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
print(f'BottomNav.css written OK')

# ─────────────────────────────────────────────────────────────
# 3. Patch global.css  (add has-sidebar body padding)
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
# 4. Patch OrderDetail.css  (add desktop overrides)
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
    padding: 28px 36px 60px;
    background: #fff;
    min-height: 100vh;
  }

  .od-top-bar {
    padding: 0 0 20px 0;
    background: transparent;
  }

  .od-order-number { font-size: 22px; }

  /* Info cards: one unified white card with vertical divider */
  .od-info-cards {
    flex-direction: row;
    padding: 16px 20px;
    background: #fff;
    border: 1.5px solid #e8e8f0;
    border-radius: 14px;
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
    height: 50px;
    background: #e0e0e8;
    flex-shrink: 0;
    margin: 0 20px;
    display: block;
  }

  /* Car image taller */
  .od-image-wrapper { margin: 0 0 20px; border-radius: 16px; }
  .od-service-image { height: 260px; }

  /* Detail rows: side-by-side in one card */
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

print('Done.')
