import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import {
  writeBookingsCache,
  readBookingsCacheEntry,
  readStaleBookingsCache
} from '../utils/bookingsCache';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import {
  readDealPricesCacheEntry,
  readStaleDealPricesCache,
  writeDealPricesCache
} from '../utils/dealPricesCache';
import { fetchWithTimeout } from '../utils/api';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('homeTheme') || 'dark');
  const [firstName, setFirstName] = useState('User');
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [dealCards, setDealCards] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [activeService, setActiveService] = useState('exterior');
  const [showLocPicker, setShowLocPicker] = useState(null);
  const [lastCentreBooking, setLastCentreBooking] = useState(null);
  const [lastHomeBooking, setLastHomeBooking] = useState(null);
  const didFetchRef = useRef(false);
  const DEAL_CAR_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Pickup'];

  const serviceTypes = [
    { key: 'exterior',  label: 'Exterior',  sub: 'Shine & Protect',  image: '/images/Exterior.png'  },
    { key: 'interior',  label: 'Interior',  sub: 'Clean & Fresh',    image: '/images/Interior.png'  },
    { key: 'fullwash',  label: 'Full Wash', sub: 'Inside Out',       image: '/images/Fullwash.png'  },
    { key: 'teflon',    label: 'Teflon',    sub: 'Long Lasting',     image: '/images/Teflon.png'    },
  ];

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchUpcomingBookings();
    fetchUserGreeting();
    fetchDealCards();
  }, []);

  useEffect(() => {
    localStorage.setItem('homeTheme', theme);
  }, [theme]);

  const normalizeCarType = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'hatchback') return 'Hatchback';
    if (v === 'sedan') return 'Sedan';
    if (v === 'suv' || v === 'mpv' || v === 'muv') return 'SUV';
    if (v === 'pickup' || v === 'pick up' || v === 'pick_up') return 'Pickup';
    return '';
  };

  const getDealImageByCarType = (carType) => {
    if (carType === 'SUV') return '/images/suv.png';
    if (carType === 'Pickup') return '/images/pickup.png';
    if (carType === 'Sedan') return '/images/sedan.png';
    return '/images/hatchback.png';
  };

  const renderDealCards = (data) => {
    const mapped = DEAL_CAR_TYPES.map((carType) => {
      const prices = (Array.isArray(data) ? data : [])
        .filter((deal) => normalizeCarType(deal?.dealCarType) === carType)
        .map((deal) => Number(deal?.dealFinalPrice))
        .filter((value) => Number.isFinite(value) && value > 0);
      const lowestPrice = prices.length ? Math.min(...prices) : null;
      return { carType, lowestPrice, image: getDealImageByCarType(carType) };
    }).filter((item) => item.lowestPrice !== null);
    setDealCards(mapped);
  };

  const fetchDealCards = async () => {
    const cached = readDealPricesCacheEntry();
    if (cached?.data) {
      renderDealCards(cached.data);
      setDealsLoading(false);
      if (!cached.isStale) return;
    } else {
      setDealsLoading(true);
    }
    try {
      const headers = withAuthHeader({ 'Content-Type': 'application/json', 'Accept': 'application/json' });
      const response = await fetchWithTimeout('/deal-prices', { method: 'GET', headers }, 8000);
      if (!response.ok) {
        if (!cached?.data) { const stale = readStaleDealPricesCache(); if (stale) renderDealCards(stale); else setDealCards([]); }
        return;
      }
      const data = await response.json();
      writeDealPricesCache(Array.isArray(data) ? data : []);
      renderDealCards(data);
    } catch (error) {
      console.warn('deal-prices fetch failed:', error?.name || error);
      if (!cached?.data) { const stale = readStaleDealPricesCache(); if (stale) renderDealCards(stale); else setDealCards([]); }
    } finally {
      setDealsLoading(false);
    }
  };

  const formatDealPrice = (value) => `\u20b9${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

  const handleBannerClick = () => navigate('/offers');

  const parseBookingDate = (booking) => {
    if (!booking?.bookingDate) return null;
    try { const slot = String(booking.timeSlot || '').split('-')[0] || '00:00'; return new Date(`${booking.bookingDate}T${slot}`); }
    catch { return null; }
  };

  const getNextUpcomingBooking = (data) => {
    if (!Array.isArray(data)) return null;
    const now = Date.now();
    const candidates = data
      .filter((b) => String(b?.status || '').toUpperCase() !== 'CANCELLED')
      .map((b) => ({ ...b, parsedDate: parseBookingDate(b) }))
      .filter((b) => b.parsedDate instanceof Date && !Number.isNaN(b.parsedDate.getTime()) && b.parsedDate.getTime() >= now)
      .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());
    return candidates[0] || data[0] || null;
  };

  const getLastBookingByType = (data, svcType) => {
    if (!Array.isArray(data)) return null;
    return data
      .filter(b => String(b?.serviceType || '').toUpperCase().replace(/\s/g, '_') === svcType && b?.bookingDate)
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0] || null;
  };
  const washLabel = (t) => { const w = String(t||'').trim(); if(w==='Basic') return 'Standard'; if(w==='Foam') return 'Deluxe'; return w||'Wash'; };
  const washToService = (t) => { const w = String(t||'').toLowerCase(); if(w.includes('interior')) return 'interior'; if(w.includes('teflon')) return 'teflon'; if(w.includes('full')) return 'fullwash'; return 'exterior'; };
  const applyBookingsToUi = (data) => {
    setUpcomingBooking(getNextUpcomingBooking(data));
    setLastCentreBooking(getLastBookingByType(data, 'SELF_DRIVE'));
    setLastHomeBooking(getLastBookingByType(data, 'HOME'));
  };

  const fetchUpcomingBookings = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) return;
      const cached = readBookingsCacheEntry();
      if (cached?.data) { applyBookingsToUi(cached.data); if (!cached.isStale) return; }
      const headers = withAuthHeader({ 'Accept': 'application/json' });
      const response = await fetchWithTimeout('/bookings/me', { method: 'GET', headers }, 8000);
      if (!response.ok) { if (!cached?.data) { const stale = readStaleBookingsCache(); if (stale) applyBookingsToUi(stale); } return; }
      const data = await response.json();
      writeBookingsCache(data);
      applyBookingsToUi(data);
    } catch (error) {
      console.warn('bookings fetch failed:', error?.name || error);
      const stale = readStaleBookingsCache();
      if (stale) applyBookingsToUi(stale);
    }
  };

  const fetchUserGreeting = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) return;
      const headers = withAuthHeader({ 'Accept': 'application/json' });
      const res = await fetch('/users/greeting', { method: 'GET', headers });
      if (res.ok) {
        const data = await res.json();
        const name = data?.firstName || localStorage.getItem('userFirstName') || 'User';
        setFirstName(name); localStorage.setItem('userFirstName', name); return;
      }
      const res2 = await fetch('/users/profile', { method: 'GET', headers });
      if (res2.ok) {
        const data2 = await res2.json();
        const name2 = data2?.firstName || localStorage.getItem('userFirstName') || 'User';
        setFirstName(name2); localStorage.setItem('userFirstName', name2);
      }
    } catch (e) { console.error('Error fetching greeting:', e); }
  };

  const rewardStep = useMemo(() => {
    const status = String(upcomingBooking?.status || '').toUpperCase();
    if (!upcomingBooking) return 1;
    if (status === 'CLOSED' || status === 'COMPLETED') return 4;
    if (status === 'IN_SERVICING') return 3;
    if (status === 'CONFIRMED') return 2;
    return 1;
  }, [upcomingBooking]);

  const getMilestoneClass = (step) => {
    if (rewardStep === step) return 'current';
    if (rewardStep > step) return 'done';
    return '';
  };

  const rewardProgress = useMemo(() => {
    if (!upcomingBooking) return 5;
    if (rewardStep >= 4) return 100;
    if (rewardStep === 3) return 75;
    if (rewardStep === 2) return 40;
    return 5;
  }, [rewardStep, upcomingBooking]);

  const placeholderDeals = [
    { carType: 'Deluxe', lowestPrice: 0, image: '/images/hatchback.png' },
    { carType: 'Premium', lowestPrice: 0, image: '/images/sedan.png' },
  ];
  const displayDeals = (dealCards.length > 0 ? dealCards : placeholderDeals).slice(0, 2);

  const handleSelectCenter = (serviceType) => navigate('/select-center', { state: { serviceType } });
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const isLoggedIn = Boolean(getValidatedAuthToken());

  return (
    <div className={`page-container home-page ${theme}`}>

      {/* ═══ DESKTOP TOP NAV ═══ */}
      <nav className="top-nav">
        <div className="top-nav-brand">
          <span className="brand-icon">🚗</span>
          <span className="brand-name">CarWash</span>
        </div>
        <div className="top-nav-links">
          <button className="tnav-link active" onClick={() => navigate('/')}>Home</button>
          <button className="tnav-link" onClick={() => navigate('/booking')}>Bookings</button>
          <button className="tnav-link" onClick={() => navigate('/my-subscriptions')}>Passes</button>
          <button className="tnav-link" onClick={() => navigate('/offers')}>Offers</button>
          <button className="tnav-link" onClick={() => navigate('/profile')}>Profile</button>
        </div>
        <div className="top-nav-right">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className={`toggle-track ${theme}`}><span className="toggle-thumb" /></span>
          </button>
          {isLoggedIn
            ? <button className="nav-avatar" onClick={() => navigate('/profile')}><img src="/images/user-avatar.png" alt="Profile" /></button>
            : <button className="nav-login" onClick={() => navigate('/login')}>Login</button>}
        </div>
      </nav>

      {/* ═══ MOBILE HEADER ═══ */}
      <header className="mob-header">
        <div className="mob-greeting">
          <p className="mob-hello">Hey, {firstName}!</p>
          <p className="mob-sub">Looking for wash today?</p>
        </div>
        <div className="mob-header-right">
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
            <span className={`toggle-track ${theme}`}><span className="toggle-thumb" /></span>
          </button>
          {isLoggedIn
            ? <button className="mob-avatar" onClick={() => navigate('/profile')}><img src="/images/user-avatar.png" alt="Profile" /></button>
            : <button className="mob-login" onClick={() => navigate('/login', { state: { mode: 'login' } })}>Login</button>}
        </div>
      </header>

      {/* ═══ SERVICE PILLS (mobile) ═══ */}
      <section className="service-pills">
        {serviceTypes.map((s) => (
          <button
            key={s.key}
            className={`service-pill${activeService === s.key ? ' active' : ''}`}
            onClick={() => setShowLocPicker(s.key)}
          >
            <span className="pill-img-wrap">
              <img src={s.image} alt={s.label} className="pill-img" />
            </span>
            <span className="pill-label">{s.label}</span>
            <span className="pill-sub">{s.sub}</span>
          </button>
        ))}
      </section>

      {/* ═══ MAIN GRID ═══ */}
      <div className="home-grid">

        {/* SIDEBAR (desktop) */}
        <aside className="service-sidebar">
          {serviceTypes.map((s) => (
            <button
              key={s.key}
              className={`sidebar-item${activeService === s.key ? ' active' : ''}`}
              onClick={() => setShowLocPicker(s.key)}
            >
              <img src={s.image} alt={s.label} className="sidebar-icon" />
              <span>{s.label}</span>
            </button>
          ))}
        </aside>

        {/* MAIN CONTENT */}
        <main className="home-main">

          {/* Desktop: section heading */}
          <h2 className="section-hd">Your Next Wash</h2>

          {/* LOCATION CARDS */}
          <p className="loc-tagline">Your previous washes at</p>
          <div className="location-row">
            <div className="loc-card" onClick={() => handleSelectCenter('SELF_DRIVE')}>
              <div className="loc-card-top">
                <span className="loc-pin">📍</span>
                <div className="loc-info">
                  <p className="loc-type">Centre</p>
                  <p className="loc-val">{lastCentreBooking
                    ? washLabel(lastCentreBooking.washType) + (lastCentreBooking.carType ? ' · ' + lastCentreBooking.carType : '')
                    : 'No recent washes'}</p>
                </div>
              </div>
              {lastCentreBooking
                ? <button className="loc-book-again" onClick={(e) => { e.stopPropagation(); navigate('/booking', { state: { serviceType: 'SELF_DRIVE', service: washToService(lastCentreBooking.washType), prefilledCarType: lastCentreBooking.carType || '', prefilledWashType: lastCentreBooking.washType || '' } }); }}>Book Again</button>
                : <span className="loc-chg">Change</span>}
            </div>
            <div className="loc-card" onClick={() => handleSelectCenter('HOME')}>
              <div className="loc-card-top">
                <span className="loc-pin">🏠</span>
                <div className="loc-info">
                  <p className="loc-type">Home</p>
                  <p className="loc-val">{lastHomeBooking
                    ? washLabel(lastHomeBooking.washType) + (lastHomeBooking.carType ? ' · ' + lastHomeBooking.carType : '')
                    : 'No recent washes'}</p>
                </div>
              </div>
              {lastHomeBooking
                ? <button className="loc-book-again" onClick={(e) => { e.stopPropagation(); navigate('/booking', { state: { serviceType: 'HOME', service: washToService(lastHomeBooking.washType), prefilledCarType: lastHomeBooking.carType || '', prefilledWashType: lastHomeBooking.washType || '' } }); }}>Book Again</button>
                : <span className="loc-chg">Change</span>}
            </div>
          </div>

          {/* REWARD STRIP */}
          <section className="reward-strip">
            <div className="reward-left">
              <p className="rew-steps">3 steps away</p>
              <p className="rew-to">to get reward</p>
              <button
                className={`rew-btn${!upcomingBooking ? ' book-now' : ''}`}
                onClick={() => !upcomingBooking ? navigate('/booking') : navigate('/rewards-calculation')}
              >
                {!upcomingBooking ? 'Book Now' : 'View Progress ›'}
              </button>
            </div>
            <div className="reward-milestones">
              <div className={`ms-item${getMilestoneClass(1) ? ' ' + getMilestoneClass(1) : ''}`}>
                <div className="ms-circle">📋</div>
                <p className="ms-label">Book a Wash</p>
              </div>
              <div className="ms-conn" />
              <div className={`ms-item${getMilestoneClass(2) ? ' ' + getMilestoneClass(2) : ''}`}>
                <div className="ms-circle">🚿</div>
                <p className="ms-label">Get Your Wash</p>
              </div>
              <div className="ms-conn" />
              <div className={`ms-item${getMilestoneClass(3) ? ' ' + getMilestoneClass(3) : ''}`}>
                <div className="ms-circle">🎁</div>
                <p className="ms-label">Earn Reward</p>
              </div>
            </div>
          </section>

          {/* DESKTOP: 3-CARD ROW */}
          <div className="wash-row">
            <div className="upcoming-card">
              <h3 className="upc-title">Upcoming Booking</h3>
              {upcomingBooking ? (
                <>
                  <p className="upc-row">🛁 {upcomingBooking.washType || 'Full Wash'} - {upcomingBooking.membershipType || 'Premium'}</p>
                  <p className="upc-row">📅 {upcomingBooking.bookingDate}{upcomingBooking.timeSlot ? `, ${upcomingBooking.timeSlot}` : ''}</p>
                  <p className="upc-row">📍 {upcomingBooking.address || 'Home: Koramangala'}</p>
                </>
              ) : (
                <p className="upc-empty">No upcoming booking.</p>
              )}
              <div className="upc-btns">
                <button className="upc-btn-outline" onClick={() => navigate('/booking')}>Reschedule</button>
                <button className="upc-btn-fill" onClick={() => navigate('/orders')}>View Details</button>
              </div>
            </div>
            {displayDeals.map((deal, i) => (
              <button key={`dd-${i}`} className={`desk-deal-card${i === 1 ? ' purple' : ''}`} onClick={handleBannerClick}>
                <p className="ddc-type">{i === 0 ? 'Deluxe Wash' : 'Premium Wash'}</p>
                <h4 className="ddc-title">
                  Get 3 {i === 0 ? 'Deluxe' : 'Premium'} Washes
                </h4>
                <p className="ddc-price">{deal.lowestPrice > 0 ? formatDealPrice(deal.lowestPrice) : '—'}</p>
                <img src={deal.image} alt={deal.carType} className="ddc-car" />
                <span className="ddc-btn">Book Now</span>
              </button>
            ))}
          </div>

          {/* DESKTOP: REWARD PROGRESS BAR */}
          <div className="reward-bar-row">
            <span className="rbar-label">3 steps away to get reward</span>
            <div className="rbar-track">
              <div className="rbar-fill" style={{ width: `${rewardProgress}%` }} />
            </div>
            <span className="rbar-pct">{rewardProgress}%</span>
            <span className="rbar-gift">🎁</span>
          </div>

          {/* MOBILE: OFFER CARDS */}
          <div className="mob-offers">
            <div className="mob-offers-hdr">
              <h3 className="mob-offers-title">Special Offers for You</h3>
              <button className="mob-view-all" onClick={handleBannerClick}>View All ›</button>
            </div>
            {displayDeals.map((deal, i) => (
              <button key={`mo-${i}`} className={`mob-offer-card${i === 1 ? ' purple' : ''}`} onClick={handleBannerClick}>
                <div className="moc-copy">
                  <h3 className="moc-title">
                    Get 3 {i === 0 ? 'Deluxe' : 'Premium'} Washes
                  </h3>
                  <p className="moc-price">
                    @ {deal.lowestPrice > 0 ? formatDealPrice(deal.lowestPrice) : '—'}/-
                  </p>
                  <span className="moc-btn">Book Now</span>
                </div>
                <img src={deal.image} alt={deal.carType} className="moc-car" />
              </button>
            ))}
          </div>

          {/* EXPLORE MORE */}
          <button className="explore-btn" onClick={handleBannerClick}>Explore More Offers</button>

          {/* QUICK ACTIONS */}
          <section className="quick-actions">
            <button onClick={() => navigate('/referral-details')}>
              <span className="qa-ico">🎁</span>
              <span className="qa-lbl">Invite &amp; Earn</span>
              <span className="qa-sub">Earn rewards</span>
            </button>
            <button onClick={() => navigate('/my-subscriptions')}>
              <span className="qa-ico">👑</span>
              <span className="qa-lbl">Subscriptions</span>
              <span className="qa-sub">Exclusive plans</span>
            </button>
            <button onClick={() => navigate('/offers')}>
              <span className="qa-ico">🏷️</span>
              <span className="qa-lbl">More Offers</span>
              <span className="qa-sub">Best savings</span>
            </button>
          </section>

          {/* TRUST BADGES (mobile) */}
          <section className="trust-row">
            <div className="trust-item"><span>🛡️</span><p>100% Safe</p></div>
            <div className="trust-item"><span>🌿</span><p>Eco Friendly</p></div>
            <div className="trust-item"><span>⏱️</span><p>On Time</p></div>
            <div className="trust-item"><span>⭐</span><p>Expert Team</p></div>
          </section>

        </main>
      </div>

      {/* LOCATION PICKER OVERLAY */}
      {showLocPicker && (
        <div className="loc-picker-overlay" onClick={() => setShowLocPicker(null)}>
          <div className="loc-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="lps-title">
              Book {serviceTypes.find((s) => s.key === showLocPicker)?.label}
            </p>
            <p className="lps-sub">Where would you like your wash?</p>
            <button
              className="lps-opt"
              onClick={() => {
                setActiveService(showLocPicker);
                setShowLocPicker(null);
                navigate('/select-center', { state: { serviceType: 'SELF_DRIVE', service: showLocPicker } });
              }}
            >
              <span className="lps-icon">&#128205;</span>
              <div>
                <p className="lps-lbl">@ Centre</p>
                <p className="lps-desc">Drive to nearest wash centre</p>
              </div>
            </button>
            <button
              className="lps-opt"
              onClick={() => {
                setActiveService(showLocPicker);
                setShowLocPicker(null);
                navigate('/select-center', { state: { serviceType: 'HOME', service: showLocPicker } });
              }}
            >
              <span className="lps-icon">&#127968;</span>
              <div>
                <p className="lps-lbl">@ Home</p>
                <p className="lps-desc">We come to your doorstep</p>
              </div>
            </button>
          </div>
        </div>
      )}

      <button className="chatbot-bubble" onClick={() => navigate('/chatbot')} title="Chat Support">💬</button>
      <BottomNav active="home" />
    </div>
  );
};

export default Home;
