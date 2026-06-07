import React, { useState, useEffect } from 'react';
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
