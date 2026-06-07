import sys
sys.stdout.reconfigure(encoding='utf-8')

# ── 1. BookNowModal.jsx ──────────────────────────────────────
modal_jsx = r"""import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BookNowModal.css';

const WASH_TYPES = [
  { id: 'INTERIOR', label: 'Interior',  grad: ['#4facfe','#00c9f5'], emoji: '\u{1F6AA}' },
  { id: 'EXTERIOR', label: 'Exterior',  grad: ['#43e97b','#0ba360'], emoji: '\u2728'    },
  { id: 'FULL_WASH',label: 'Full Wash', grad: ['#667eea','#764ba2'], emoji: '\u{1F4A7}' },
  { id: 'TEFLON',   label: 'Teflon',    grad: ['#f093fb','#c471ed'], emoji: '\u{1F6E1}' },
];

const SERVICE_TYPES = [
  { id: 'HOME',   label: 'Home',   grad: ['#4facfe','#00c9f5'], emoji: '\u{1F3E0}' },
  { id: 'CENTRE', label: 'Centre', grad: ['#43e97b','#0ba360'], emoji: '\u{1F3EB}' },
];

const BookNowModal = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedWash, setSelectedWash] = useState(null);
  const [poppingId, setPoppingId] = useState(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setEntered(false);
    setTimeout(onClose, 280);
  };

  const handleWashClick = (w) => {
    if (poppingId) return;
    setPoppingId(w.id);
    setTimeout(() => {
      setSelectedWash(w);
      setPoppingId(null);
      setStep(2);
    }, 420);
  };

  const handleServiceClick = (s) => {
    if (poppingId) return;
    setPoppingId(s.id);
    setTimeout(() => {
      onClose();
      navigate('/booking', {
        state: { prefilledWashType: selectedWash.id, serviceType: s.id }
      });
    }, 420);
  };

  return (
    <div className={`bnm-overlay${entered ? ' bnm-in' : ''}`}
         onClick={(e) => e.target === e.currentTarget && handleClose()}>

      <button className="bnm-close-btn" onClick={handleClose} aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      {step === 1 ? (
        <div className="bnm-scene">
          <p className="bnm-heading">Choose a service</p>
          <div className="bnm-grid bnm-grid-2x2">
            {WASH_TYPES.map((w, i) => (
              <button
                key={w.id}
                className={`bnm-bubble${poppingId === w.id ? ' bnm-pop' : ''}`}
                style={{
                  '--c1': w.grad[0], '--c2': w.grad[1],
                  '--enter-delay': `${i * 90}ms`,
                }}
                onClick={() => handleWashClick(w)}
              >
                <span className="bnm-emit" />
                <span className="bnm-shine" />
                <span className="bnm-shine2" />
                <span className="bnm-emoji">{w.emoji}</span>
                <span className="bnm-label">{w.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="bnm-scene">
          <p className="bnm-sub">{selectedWash?.label}</p>
          <p className="bnm-heading">Where?</p>
          <div className="bnm-grid bnm-grid-1x2">
            {SERVICE_TYPES.map((s, i) => (
              <button
                key={s.id}
                className={`bnm-bubble bnm-bubble-lg${poppingId === s.id ? ' bnm-pop' : ''}`}
                style={{
                  '--c1': s.grad[0], '--c2': s.grad[1],
                  '--enter-delay': `${i * 110}ms`,
                }}
                onClick={() => handleServiceClick(s)}
              >
                <span className="bnm-emit" />
                <span className="bnm-shine" />
                <span className="bnm-shine2" />
                <span className="bnm-emoji">{s.emoji}</span>
                <span className="bnm-label">{s.label}</span>
              </button>
            ))}
          </div>
          <button className="bnm-back-btn" onClick={() => setStep(1)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default BookNowModal;
"""

with open(r'E:\Car wash\MainApp\src\components\BookNowModal.jsx', 'w', encoding='utf-8') as f:
    f.write(modal_jsx)
print('BookNowModal.jsx written OK')

# ── 2. BookNowModal.css ──────────────────────────────────────
modal_css = """/* ============================================================
   BOOK NOW MODAL — Water bubble selector
   ============================================================ */

/* Overlay */
.bnm-overlay {
  position: fixed;
  inset: 0;
  z-index: 9000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(8, 10, 22, 0.78);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  opacity: 0;
  transition: opacity 0.28s ease;
}

.bnm-overlay.bnm-in { opacity: 1; }

/* Close button */
.bnm-close-btn {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9001;
  transition: background 0.15s;
}
.bnm-close-btn:hover { background: rgba(255,255,255,0.22); }
.bnm-close-btn svg { width: 18px; height: 18px; }

/* Scene container */
.bnm-scene {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

/* Title text */
.bnm-heading {
  color: #fff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.3px;
  margin-bottom: 28px;
  text-align: center;
}

.bnm-sub {
  color: rgba(255,255,255,0.55);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 4px;
}

/* Grids */
.bnm-grid { display: flex; gap: 28px; }
.bnm-grid-2x2 { flex-wrap: wrap; max-width: 280px; justify-content: center; }
.bnm-grid-1x2  { flex-wrap: nowrap; }

/* ── THE BUBBLE ── */
.bnm-bubble {
  position: relative;
  width: 118px;
  height: 118px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  overflow: visible;

  /* Main gradient fill */
  background: radial-gradient(circle at 60% 62%, var(--c2) 0%, var(--c1) 55%, color-mix(in srgb, var(--c1) 60%, #fff) 100%);

  /* Bubble border — thin bright ring */
  box-shadow:
    0 0 0 2px rgba(255,255,255,0.25),
    0 12px 40px rgba(0,0,0,0.35),
    inset 0 -6px 18px rgba(0,0,0,0.18);

  /* Entrance animation */
  animation:
    bnm-enter 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) var(--enter-delay, 0ms) both,
    bnm-float 4s ease-in-out var(--enter-delay, 0ms) infinite alternate;

  transition: transform 0.18s, box-shadow 0.18s;
}

.bnm-bubble:hover {
  transform: scale(1.06);
  box-shadow:
    0 0 0 3px rgba(255,255,255,0.4),
    0 18px 50px rgba(0,0,0,0.4),
    inset 0 -6px 18px rgba(0,0,0,0.18);
}

/* Large variant for step 2 */
.bnm-bubble-lg {
  width: 144px;
  height: 144px;
  gap: 9px;
}

/* Ripple emission ring */
.bnm-emit {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid var(--c1);
  opacity: 0;
  pointer-events: none;
  animation: bnm-ripple 3.2s ease-out var(--enter-delay, 0ms) infinite;
}

/* Primary shine (top-left white glare) */
.bnm-shine {
  position: absolute;
  top: 14%;
  left: 18%;
  width: 38%;
  height: 26%;
  background: radial-gradient(ellipse at center, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0) 100%);
  border-radius: 50%;
  transform: rotate(-35deg);
  pointer-events: none;
}

/* Secondary shine (bottom-right small reflection) */
.bnm-shine2 {
  position: absolute;
  bottom: 17%;
  right: 19%;
  width: 18%;
  height: 12%;
  background: rgba(255,255,255,0.45);
  border-radius: 50%;
  filter: blur(2px);
  pointer-events: none;
}

/* Emoji + label */
.bnm-emoji {
  font-size: 30px;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
  position: relative;
}

.bnm-bubble-lg .bnm-emoji { font-size: 38px; }

.bnm-label {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.35);
  position: relative;
}

.bnm-bubble-lg .bnm-label { font-size: 14px; }

/* Pop animation */
.bnm-pop {
  animation: bnm-pop 0.42s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards !important;
  pointer-events: none;
}

/* Back button */
.bnm-back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 32px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: rgba(255,255,255,0.75);
  font-size: 13px;
  font-weight: 600;
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.bnm-back-btn:hover { background: rgba(255,255,255,0.18); color: #fff; }
.bnm-back-btn svg { width: 15px; height: 15px; }

/* ── Keyframes ── */

@keyframes bnm-enter {
  0%   { opacity: 0; transform: scale(0) rotate(-10deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
}

@keyframes bnm-float {
  0%   { transform: translateY(0px) scale(1); }
  50%  { transform: translateY(-10px) scale(1.015); }
  100% { transform: translateY(2px) scale(0.99); }
}

@keyframes bnm-ripple {
  0%   { transform: scale(1); opacity: 0.55; }
  80%  { transform: scale(1.55); opacity: 0; }
  100% { transform: scale(1.55); opacity: 0; }
}

@keyframes bnm-pop {
  0%   { transform: scale(1);   opacity: 1; }
  35%  { transform: scale(1.38); opacity: 0.85; }
  65%  { transform: scale(1.8);  opacity: 0.35; filter: blur(2px); }
  100% { transform: scale(2.4);  opacity: 0;    filter: blur(6px); }
}

/* ── Responsive ── */
@media (max-width: 380px) {
  .bnm-bubble { width: 100px; height: 100px; }
  .bnm-bubble-lg { width: 118px; height: 118px; }
  .bnm-grid { gap: 18px; }
  .bnm-grid-2x2 { max-width: 240px; }
  .bnm-emoji { font-size: 26px; }
  .bnm-bubble-lg .bnm-emoji { font-size: 30px; }
}

@media (min-width: 768px) {
  .bnm-bubble { width: 140px; height: 140px; gap: 9px; }
  .bnm-bubble-lg { width: 168px; height: 168px; }
  .bnm-grid { gap: 36px; }
  .bnm-grid-2x2 { max-width: 360px; }
  .bnm-emoji { font-size: 36px; }
  .bnm-bubble-lg .bnm-emoji { font-size: 44px; }
  .bnm-heading { font-size: 26px; }
  .bnm-close-btn { top: 28px; right: 28px; width: 44px; height: 44px; }
}
"""

with open(r'E:\Car wash\MainApp\src\styles\BookNowModal.css', 'w', encoding='utf-8') as f:
    f.write(modal_css)
print('BookNowModal.css written OK')

# ── 3. Update BottomNav.jsx — add modal state ─────────────────
bn_jsx = r"""import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BookNowModal from './BookNowModal';
import '../styles/BottomNav.css';

const BottomNav = ({ active }) => {
  const navigate = useNavigate();
  const [showBookNow, setShowBookNow] = useState(false);

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
    <>
      {showBookNow && <BookNowModal onClose={() => setShowBookNow(false)} />}

      <nav className="bottom-nav">

        {/* Desktop only: logo */}
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
          onClick={() => setShowBookNow(true)}
        >
          <div className="nav-fab">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </div>
          <span className="nav-label">Book Now</span>
        </button>

        {/* Passes */}
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
    </>
  );
};

export default BottomNav;
"""

with open(r'E:\Car wash\MainApp\src\components\BottomNav.jsx', 'w', encoding='utf-8') as f:
    f.write(bn_jsx)
print('BottomNav.jsx updated OK')
print('All done.')
