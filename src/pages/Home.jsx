import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { writeBookingsCache, writeActiveMembershipCache } from '../utils/bookingsCache';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readDealPricesCache, writeDealPricesCache } from '../utils/dealPricesCache';
import '../styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOffersBanner, setShowOffersBanner] = useState(() => {
    // Show banner only if not closed in this session
    return !sessionStorage.getItem('offersBannerClosed');
  });
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(() => {
    return !sessionStorage.getItem('upgradeBannerClosed');
  });
  const [upgradeableBooking, setUpgradeableBooking] = useState(null);
  const [greeting, setGreeting] = useState('Good Morning');
  const [firstName, setFirstName] = useState('User');
  const [hasBookings, setHasBookings] = useState(true);
  const [dealCards, setDealCards] = useState([]);
  const [dealsLoading, setDealsLoading] = useState(true);
  const [dealCarouselIndex, setDealCarouselIndex] = useState(0);
  const [isDealCarouselPaused, setIsDealCarouselPaused] = useState(false);
  const [washCarouselIndex, setWashCarouselIndex] = useState(0);
  const [washSlides, setWashSlides] = useState([]);
  const [servicePopupCar, setServicePopupCar] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const touchStartXRef = useRef(null);
  const washTouchStartXRef = useRef(null);
  const didFetchRef = useRef(false);
  const hasActiveMembership = Boolean(membership);
  const DEAL_CAR_TYPES = ['Hatchback', 'Sedan', 'SUV', 'Pickup'];

  const SERVICE_CONFIG = {
    centre: { className: 'center', image: '/images/suv.png', path: '/select-center' },
    home: { className: 'home', image: '/images/sedan.png', path: '/booking' },
    teflon: { className: 'teflon', image: '/images/pickup.png', path: '/booking' },
    aspcare: { className: 'aspcare', image: '/images/hatchback.png', path: '/booking' },
  };

  useEffect(() => {
    if (didFetchRef.current) return;
    didFetchRef.current = true;
    fetchActiveMembership();
    fetchUpcomingBookings();
    fetchUserGreeting();
    fetchDealCards();
    fetchServices();
  }, []);

  useEffect(() => {
    if (dealCards.length <= 2 || isDealCarouselPaused) return;
    const maxDealIndex = Math.max(dealCards.length - 2, 0);
    const intervalId = setInterval(() => {
      setDealCarouselIndex((prev) => (prev >= maxDealIndex ? 0 : prev + 1));
    }, 3500);

    return () => clearInterval(intervalId);
  }, [dealCards, isDealCarouselPaused]);

  const normalizeCarType = (value) => {
    const v = String(value || '').trim().toLowerCase();
    if (v === 'hatchback') return 'Hatchback';
    if (v === 'sedan') return 'Sedan';
    if (v === 'suv' || v === 'mpv' || v === 'muv') return 'SUV';
    if (v === 'pickup' || v === 'pick up' || v === 'pick_up') return 'Pickup';
    return '';
  };

  const getDealImageByCarType = (carType) => {
    if (carType === 'Hatchback' || carType === 'Sedan') return '/images/hatchback.png';
    if (carType === 'SUV') return '/images/suv.png';
    if (carType === 'Pickup') return '/images/pickup.png';
    return '/images/hatchback.png';
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/services');
      if (!response.ok) return;
      const data = await response.json();
      const slides = data.map((s) => {
        const config = SERVICE_CONFIG[s.serviceType] || {};
        return {
          id: s.serviceType,
          className: config.className || s.serviceType,
          offer: `${Math.round(s.discountPercentage)}% Off`,
          label: s.displayName,
          icon: s.icon || '',
          cta: 'view details →',
          image: config.image || '/images/hatchback.png',
          onClick: () => navigate(config.path || '/booking'),
        };
      });
      setWashSlides(slides);
    } catch {
      // keep washSlides empty on error
    }
  };

  const fetchDealCards = async () => {
    setDealsLoading(true);
    try {
      const cachedDeals = readDealPricesCache();
      const sourceDeals = Array.isArray(cachedDeals) ? cachedDeals : null;

      let data = sourceDeals;

      if (!data) {
        const response = await fetch('/deal-prices', {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
          setDealCards([]);
          return;
        }

        data = await response.json();
        writeDealPricesCache(Array.isArray(data) ? data : []);
      }

      const mapped = DEAL_CAR_TYPES.map((carType) => {
        const prices = (Array.isArray(data) ? data : [])
          .filter((deal) => normalizeCarType(deal?.dealCarType) === carType)
          .map((deal) => Number(deal?.dealFinalPrice))
          .filter((value) => Number.isFinite(value) && value > 0);

        const lowestPrice = prices.length ? Math.min(...prices) : null;

        return {
          carType,
          lowestPrice,
          className: carType.toLowerCase(),
          image: getDealImageByCarType(carType)
        };
      }).filter((item) => item.lowestPrice !== null);

      setDealCards(mapped);
      setDealCarouselIndex(0);
    } catch (error) {
      console.error('Error fetching deal cards:', error);
      setDealCards([]);
    } finally {
      setDealsLoading(false);
    }
  };

  const formatDealPrice = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}/-`;

  const moveDealCarousel = (direction) => {
    const maxDealIndex = Math.max(dealCards.length - 2, 0);
    if (maxDealIndex === 0) return;
    setDealCarouselIndex((prev) => {
      if (direction === 'next') return Math.min(prev + 1, maxDealIndex);
      return Math.max(prev - 1, 0);
    });
  };

  const handleDealTouchStart = (event) => {
    touchStartXRef.current = event.touches?.[0]?.clientX ?? null;
    setIsDealCarouselPaused(true);
  };

  const handleDealTouchEnd = (event) => {
    const touchEndX = event.changedTouches?.[0]?.clientX ?? null;
    const touchStartX = touchStartXRef.current;

    if (touchStartX !== null && touchEndX !== null) {
      const deltaX = touchStartX - touchEndX;
      const threshold = 40;

      if (deltaX > threshold) {
        moveDealCarousel('next');
      } else if (deltaX < -threshold) {
        moveDealCarousel('prev');
      }
    }

    touchStartXRef.current = null;
    setIsDealCarouselPaused(false);
  };

  const dealDotCount = Math.max(dealCards.length - 1, 1);

  const moveWashCarousel = (direction) => {
    const maxWashIndex = Math.max(washSlides.length - 2, 0);
    if (maxWashIndex === 0) return;
    setWashCarouselIndex((prev) => {
      if (direction === 'next') return Math.min(prev + 1, maxWashIndex);
      return Math.max(prev - 1, 0);
    });
  };

  const handleWashTouchStart = (event) => {
    washTouchStartXRef.current = event.touches?.[0]?.clientX ?? null;
  };

  const handleWashTouchEnd = (event) => {
    const touchEndX = event.changedTouches?.[0]?.clientX ?? null;
    const touchStartX = washTouchStartXRef.current;

    if (touchStartX !== null && touchEndX !== null) {
      const deltaX = touchStartX - touchEndX;
      const threshold = 40;

      if (deltaX > threshold) {
        moveWashCarousel('next');
      } else if (deltaX < -threshold) {
        moveWashCarousel('prev');
      }
    }

    washTouchStartXRef.current = null;
  };

  const washDotCount = Math.max(washSlides.length - 1, 1);

  const fetchActiveMembership = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        setLoading(false);
        return;
      }
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });

      const response = await fetch('/memberships/active/me', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setMembership(data);
        writeActiveMembershipCache(data);
      } else {
        setMembership(null);
      }
    } catch (error) {
      console.error('Error fetching membership:', error);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseBanner = () => {
    setShowOffersBanner(false);
    sessionStorage.setItem('offersBannerClosed', 'true');
  };

  const handleCloseUpgradeBanner = () => {
    setShowUpgradeBanner(false);
    sessionStorage.setItem('upgradeBannerClosed', 'true');
  };

  const handleBannerClick = () => {
    navigate('/offers');
  };

  const handleUpgradeBannerClick = () => {
    navigate('/orders');
  };

  const fetchUpcomingBookings = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) return;
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });

      const response = await fetch('/bookings/me', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }

      const data = await response.json();
      writeBookingsCache(data);
      
      // Track if user has any bookings
      setHasBookings(data && data.length > 0);
      
      // Find any upcoming (future, non-cancelled) booking for upgrade banner
      const now = new Date();
      const upgradeable = data.find(order => {
        if (!order.bookingDate || !order.timeSlot) return false;
        
        try {
          const bookingDateTime = new Date(`${order.bookingDate}T${order.timeSlot.split('-')[0]}`);
          const isFuture = bookingDateTime > now;
          const isCancelled = String(order.status || '').toLowerCase() === 'cancelled';
          
          return isFuture && !isCancelled;
        } catch {
          return false;
        }
      });

      setUpgradeableBooking(upgradeable || null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setHasBookings(false);
    }
  };

  const getUpgradeOptions = (washType) => {
    const normalizedType = String(washType || '').toLowerCase();
    if (normalizedType === 'basic') {
      return 'Foam or Premium';
    } else if (normalizedType === 'foam') {
      return 'Premium';
    }
    return '';
  };

  const fetchUserGreeting = async () => {
    try {
      const authToken = getValidatedAuthToken();
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });
      if (!authToken) {
        return;
      }

      const response = await fetch('/users/greeting', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const resolvedGreeting = data?.greeting || 'Good Morning';
        const resolvedFirstName = data?.firstName || localStorage.getItem('userFirstName') || 'User';
        setGreeting(resolvedGreeting);
        setFirstName(resolvedFirstName);
        localStorage.setItem('userFirstName', resolvedFirstName);
        return;
      }

      const profileResponse = await fetch('/users/profile', {
        method: 'GET',
        headers
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        const nowHour = new Date().getHours();
        const fallbackGreeting = nowHour < 12 ? 'Good Morning' : nowHour < 17 ? 'Good Afternoon' : 'Good Evening';
        const resolvedFirstName = profileData?.firstName || localStorage.getItem('userFirstName') || 'User';

        setGreeting(fallbackGreeting);
        setFirstName(resolvedFirstName);
        localStorage.setItem('userFirstName', resolvedFirstName);
      }
    } catch (error) {
      console.error('Error fetching greeting:', error);
    }
  };

  const handleInviteFriends = async () => {
    setCouponLoading(true);
    try {
      const phone = localStorage.getItem('userPhone');
      if (!phone) {
        setShowLoginPopup(true);
        setCouponLoading(false);
        return;
      }

      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch('/coupons/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          createdByPhone: phone,
          discountType: 'FLAT',
          discountValue: 20,
          maxUses: 5,
          validDays: 30,
          minOrderAmount: 100
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate coupon');
      }

      const data = await response.json();
      setCouponCode(data.couponCode);
      
      // Share via WhatsApp
      const text = encodeURIComponent(
        `Hey! 👋 I'm using ASP Car Care 🚗💦\n\n` +
        `Use my coupon code *${data.couponCode}* to get ₹20 discount 🎉\n` +
        `Book here: https://carwash.com\n` +
        `(Apply coupon at checkout)`
      );
      
      const whatsappUrl = `https://wa.me/?text=${text}`;
      if (whatsappUrl.startsWith('https://wa.me/')) {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      alert('Failed to generate coupon. Please try again.');
    } finally {
      setCouponLoading(false);
    }
  };

  const isLoggedIn = Boolean(getValidatedAuthToken());

  return (
    <div className="page-container home-page">
      <p className="home-greeting">Hello, {firstName}</p>
      <header className="home-top-row">
        <h1>Looking for <span>wash</span> today?</h1>
        {isLoggedIn ? (
          <button className="top-profile-btn" onClick={() => navigate('/profile')}>
            <img src="/images/user-avatar.png" alt="Profile" />
          </button>
        ) : (
          <div className="top-auth-buttons">
            <button className="top-login-btn" onClick={() => navigate('/login', { state: { mode: 'login' } })}>Login</button>
            <button className="top-signup-btn" onClick={() => navigate('/login', { state: { mode: 'signup' } })}>Signup</button>
          </div>
        )}
      </header>

      <div className="vehicle-strip">
        <button className="vehicle-chip" onClick={() => setServicePopupCar('SUV')}><img src="/images/suv.png" alt="SUV" /><span>SUV&amp;MPV</span></button>
        <button className="vehicle-chip" onClick={() => setServicePopupCar('Pickup')}><img src="/images/pickup.png" alt="Pickup" /><span>Pickup</span></button>
        <button className="vehicle-chip" onClick={() => setServicePopupCar('Hatchback')}><img src="/images/hatchback.png" alt="Hatchback" /><span>Hatchback</span></button>
        <button className="vehicle-chip" onClick={() => setServicePopupCar('Bike')}><img src="/images/bike.png" alt="Bike" /><span>Bike</span></button>
      </div>

      {servicePopupCar && (
        <div className="modal-overlay" onClick={() => setServicePopupCar(null)}>
          <div className="service-popup" onClick={(e) => e.stopPropagation()}>
            <div
              className="service-popup-card service-popup-centre"
              onClick={() => {
                setServicePopupCar(null);
                navigate('/select-center', { state: { serviceType: 'SELF_DRIVE', prefilledCarType: servicePopupCar } });
              }}
            >
              <img className="service-popup-car-img" src="/images/suv.png" alt="Centre" />
              <div className="service-popup-card-info">
                <span className="service-popup-label">@Centre 🏢</span>
                <span className="service-popup-desc">Check nearby centre and slots to book your wash</span>
              </div>
            </div>
            <div
              className="service-popup-card service-popup-home"
              onClick={() => {
                setServicePopupCar(null);
                navigate('/booking', { state: { serviceType: 'HOME', prefilledCarType: servicePopupCar } });
              }}
            >
              <img className="service-popup-car-img" src="/images/sedan.png" alt="Home" />
              <div className="service-popup-card-info">
                <span className="service-popup-label">@Home 🏠</span>
                <span className="service-popup-desc"><strong>100% cashback</strong> if your car is damaged</span>
                <span className="service-popup-desc"><strong>Sit, book &amp; relax</strong>: we come to your home and wash with full protection</span>
              </div>
            </div>
            <button className="service-popup-close" onClick={() => setServicePopupCar(null)}>Cancel</button>
          </div>
        </div>
      )}

      {upgradeableBooking ? (
        <div className="claim-strip upgrade-strip" onClick={handleUpgradeBannerClick}>
          <span className="claim-strip-text">🚀 You have an upcoming booking, let's go for upgrade! 🚀</span>
          <img
            src="/images/Congratulations-Gifs-Transparent-Image.gif"
            alt="Upgrade"
            className="claim-strip-gif"
          />
        </div>
      ) : !hasBookings && (
        <div className="claim-strip">
          <span className="claim-strip-text">🔥 Claim your ₹20 off by your first booking 🔥</span>
          <img
            src="/images/Congratulations-Gifs-Transparent-Image.gif"
            alt="Congratulations"
            className="claim-strip-gif"
          />
        </div>
      )}

      <section className="home-section">
        <h2 className="section-title">Wash Services <span>→</span></h2>
        <div
          className="wash-grid"
          onTouchStart={handleWashTouchStart}
          onTouchEnd={handleWashTouchEnd}
          onTouchCancel={() => {
            washTouchStartXRef.current = null;
          }}
        >
          <div
            className="wash-track"
            style={{ transform: `translateX(calc(-${washCarouselIndex} * (50% + 5px)))` }}
          >
            {washSlides.map((slide) => (
              <button key={slide.id} className={`wash-card ${slide.className}`} onClick={slide.onClick}>
                <p className="wash-offer-island">
                  <span className="offer-prefix">upto</span>
                  <span><span className="value-highlight">{slide.offer.replace(' Off', '')}</span> Off</span>
                </p>
                <div className="wash-label">{slide.label} <span className="wash-label-icon">{slide.icon}</span></div>
                <div className="wash-cta">{slide.cta}</div>
                <img src={slide.image} alt={`${slide.label} wash`} />
              </button>
            ))}
          </div>
        </div>
        {washDotCount > 1 && (
          <div className="wash-carousel-dots" aria-label="Wash services carousel position">
            {Array.from({ length: washDotCount }).map((_, index) => (
              <button
                key={`wash-dot-${index}`}
                type="button"
                className={`wash-carousel-dot ${index === washCarouselIndex ? 'active' : ''}`}
                aria-label={`Go to wash slide ${index + 1}`}
                onClick={() => setWashCarouselIndex(index)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="home-section">
        <h2 className="section-title">Perks <span>→</span></h2>
        <div className="perk-grid">
          <button className="perk-card" onClick={() => isLoggedIn ? navigate('/referral-details') : setShowLoginPopup(true)}>
            <div className="perk-icon">👥➕</div>
            <p>Invite referrals</p>
          </button>
          <button className="perk-card" onClick={() => navigate('/my-subscriptions')}>
            <img src="/images/membership-icon.png" alt="Subscriptions" />
            <p>Subscriptions</p>
          </button>
          <button className="perk-card" onClick={handleBannerClick}>
            <img src="/images/orders.png" alt="Deals" />
            <p>Subscribe & save</p>
          </button>
        </div>
      </section>

      <section className="home-section">
        <h2 className="section-title">More Deals <span>→</span></h2>
        <div
          className="deal-grid"
          onMouseEnter={() => setIsDealCarouselPaused(true)}
          onMouseLeave={() => setIsDealCarouselPaused(false)}
          onTouchStart={handleDealTouchStart}
          onTouchEnd={handleDealTouchEnd}
          onTouchCancel={() => {
            touchStartXRef.current = null;
            setIsDealCarouselPaused(false);
          }}
        >
          {dealsLoading && (
            <button className="deal-card hatchback" onClick={handleBannerClick}>
              <p className="deal-price-island"><span className="price-prefix">just</span> <span className="price-highlight">...</span></p>
              <div className="deal-text-block">
                <h3>
                  3 washes for
                  <span className="deal-vehicle">Loading</span>
                </h3>
              </div>
              <img src="/images/hatchback.png" alt="Loading deal" />
            </button>
          )}

          {!dealsLoading && (
            <div
              className="deal-track"
              style={{ transform: `translateX(calc(-${dealCarouselIndex} * (50% + 5px)))` }}
            >
              {dealCards.map((deal) => (
                <button key={deal.carType} className={`deal-card ${deal.className}`} onClick={handleBannerClick}>
                  <p className="deal-price-island"><span className="price-prefix">just</span> <span className="price-highlight">{formatDealPrice(deal.lowestPrice)}</span></p>
                  <div className="deal-text-block">
                    <h3>
                      3 washes for
                      <span className="deal-vehicle">{deal.carType}</span>
                    </h3>
                  </div>
                  <img src={deal.image} alt={`${deal.carType} deal`} />
                </button>
              ))}
            </div>
          )}
        </div>
        {!dealsLoading && dealDotCount > 1 && (
          <div className="deal-carousel-dots" aria-label="Deal carousel position">
            {Array.from({ length: dealDotCount }).map((_, index) => (
              <button
                key={`deal-dot-${index}`}
                type="button"
                className={`deal-carousel-dot ${index === dealCarouselIndex ? 'active' : ''}`}
                aria-label={`Go to deal slide ${index + 1}`}
                onClick={() => setDealCarouselIndex(index)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="invite-strip">
        <img
          src="/images/Congratulations-Gifs-Transparent-Image.gif"
          alt=""
          className="invite-strip-gif"
        />
        <div className="invite-strip-content">
          <div className="invite-strip-title">🏆 Get Flat ₹20 Off</div>
          <button className="invite-strip-btn" onClick={handleInviteFriends} disabled={couponLoading}>
          <span className="whatsapp-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32" role="img" focusable="false">
              <path
                d="M16 3C9.373 3 4 8.373 4 15c0 2.39.7 4.61 1.9 6.49L4 29l7.75-2.02C13.6 27.64 14.78 28 16 28c6.627 0 12-5.373 12-12S22.627 3 16 3zm0 22.1c-1.04 0-2.05-.18-3-.52l-.22-.08-4.6 1.2 1.23-4.47-.15-.23A9.96 9.96 0 0 1 6.9 15C6.9 10.09 11.09 5.9 16 5.9S25.1 10.09 25.1 15 20.91 24.1 16 24.1zm5.62-6.78c-.3-.15-1.78-.88-2.06-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.08-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.8-1.68-2.1-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.48-.5-.67-.5h-.57c-.2 0-.52.08-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.17 4.56.72.31 1.29.5 1.73.64.73.23 1.4.2 1.93.12.59-.09 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35z"
                fill="currentColor"
              />
            </svg>
          </span>
          {couponLoading ? 'Loading...' : 'Invite Friends'}
          </button>
          {couponCode && <p className="coupon-code-display">Code: {couponCode}</p>}
        </div>
      </div>

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="modal-overlay" onClick={() => setShowLoginPopup(false)}>
          <div className="home-login-popup" onClick={(e) => e.stopPropagation()}>
            <div className="home-login-popup-icon">🔐</div>
            <h3 className="home-login-popup-title">Please Login / Signup</h3>
            <p className="home-login-popup-desc">to invite friends and earn rewards</p>
            <div className="home-login-popup-actions">
              <button className="home-login-popup-btn login" onClick={() => { setShowLoginPopup(false); navigate('/login', { state: { mode: 'login', from: { pathname: '/' } } }); }}>Login</button>
              <button className="home-login-popup-btn signup" onClick={() => { setShowLoginPopup(false); navigate('/login', { state: { mode: 'signup', from: { pathname: '/' } } }); }}>Signup</button>
            </div>
            <button className="home-login-popup-close" onClick={() => setShowLoginPopup(false)}>Maybe later</button>
          </div>
        </div>
      )}

      {/* Floating Chatbot Bubble */}
      <button 
        className="chatbot-bubble"
        onClick={() => navigate('/chatbot')}
        title="Open Chat Support"
      >
        💬
      </button>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Home;
