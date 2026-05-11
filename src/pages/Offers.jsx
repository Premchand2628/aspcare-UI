import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import PaymentMethodModal from '../components/PaymentMethodModal';
import { getStoredPhone, toApiServiceType, toApiWaterProvidedFlag, toUiServiceType } from '../utils/apiMappers';
import { clearAuthSession, getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readDealPricesCache, writeDealPricesCache } from '../utils/dealPricesCache';
import { clearSubscriptionsCache } from '../utils/subscriptionsCache';
import '../styles/Offers.css';

const Offers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedCarType = location.state?.preselectedCarType;
  const [offers, setOffers] = useState([]);
  const [selectedCarType, setSelectedCarType] = useState(() => {
    if (!preselectedCarType) return null;
    const v = String(preselectedCarType).trim().toLowerCase();
    if (v === 'hatchback') return 'Hatchback';
    if (v === 'sedan') return 'Sedan';
    if (v === 'suv') return 'SUV';
    if (v === 'mpv' || v === 'muv') return 'MPV';
    if (v === 'pickup' || v === 'pick up') return 'Pickup';
    return preselectedCarType;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDealForPay, setSelectedDealForPay] = useState(null);
  const [showWaterPopup, setShowWaterPopup] = useState(false);
  const [waterConsentChecked, setWaterConsentChecked] = useState(false);
  const [priceSort, setPriceSort] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState(null);
  const [dealTermsAccepted, setDealTermsAccepted] = useState(false);

  // Phone linking modal state (for OAuth users without phone)
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneStep, setPhoneStep] = useState('enter'); // 'enter' | 'confirm' | 'otp' | 'done'
  const [phoneIsNew, setPhoneIsNew] = useState(false);
  const [phoneExistingEmail, setPhoneExistingEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [pendingDeal, setPendingDeal] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentDeal, setPaymentDeal] = useState(null);

  const CAR_TYPES = ['Hatchback', 'Sedan', 'SUV', 'MPV', 'Pickup'];

  const normalize = (value) => String(value || '').trim().toLowerCase();

  const normalizeCarType = (value) => {
    const v = normalize(value);
    if (v === 'hatchback') return 'Hatchback';
    if (v === 'sedan') return 'Sedan';
    if (v === 'suv') return 'SUV';
    if (v === 'mpv' || v === 'muv') return 'MPV';
    if (v === 'pickup' || v === 'pick up') return 'Pickup';
    return value;
  };

  const normalizeServiceType = (value) => {
    return toUiServiceType(value);
  };

  const normalizeWashType = (value) => {
    const v = normalize(value);
    if (v === 'foam') return 'Foam';
    if (v === 'basic') return 'Basic';
    if (v === 'premium') return 'Premium';
    return 'Basic+Foam+Premium';
  };

  const formatWashTitle = (value) => {
    const wash = normalizeWashType(value);
    if (wash === 'Basic+Foam+Premium') return 'Basic + Foam + Premium';
    return wash;
  };

  // Fetch deals from backend
  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    setDealTermsAccepted(false);
  }, [selectedDealId, selectedCarType]);

  const fetchDeals = async () => {
    try {
      const cachedDeals = readDealPricesCache();
      let data = Array.isArray(cachedDeals) ? cachedDeals : null;

      if (!data) {
        const headers = withAuthHeader({
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        });

        const response = await fetch('/deal-prices', {
          method: 'GET',
          headers: headers
        });

        if (!response.ok) {
          setError('Failed to fetch deals');
          setOffers([]);
          return;
        }

        data = await response.json();
        writeDealPricesCache(Array.isArray(data) ? data : []);
      }

      if (Array.isArray(data)) {
        const transformedOffers = data.map((deal) => ({
          id: deal.id,
          serviceType: normalizeServiceType(deal.dealServiceType),
          washType: normalizeWashType(deal.dealWashType),
          carType: normalizeCarType(deal.dealCarType),
          waterProviding: String(deal.dealWaterProviding || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
          originalPrice: parseFloat(deal.dealActualPrice),
          discountedPrice: parseFloat(deal.dealFinalPrice),
          totalWashes: Number(deal.dealTotalWashes || 3),
        }));
        setOffers(transformedOffers);
        setError('');
      } else {
        setError('Failed to fetch deals');
        setOffers([]);
      }
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError('Network error. Please check your connection.');
      setOffers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatRupees = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;

  const getStartingPrice = (carType) => {
    const carDeals = offers.filter((deal) => normalizeCarType(deal.carType) === carType);
    const preferred = carDeals.find((deal) =>
      deal.serviceType === 'Home' && deal.washType === 'Basic' && deal.waterProviding === 'N'
    );

    if (preferred) return preferred.discountedPrice;
    if (carDeals.length === 0) return 0;
    return Math.min(...carDeals.map((deal) => Number(deal.discountedPrice || 0)));
  };

  const getTopDiscountForCarType = (carType) => {
    const carDeals = offers.filter((deal) => normalizeCarType(deal.carType) === carType);
    if (carDeals.length === 0) return 0;

    return carDeals.reduce((maxDiscount, deal) => {
      const discount = getDiscountPercent(deal.originalPrice, deal.discountedPrice);
      return Math.max(maxDiscount, discount);
    }, 0);
  };

  const getWashOrder = (washType) => {
    if (washType === 'Foam') return 1;
    if (washType === 'Basic') return 2;
    if (washType === 'Premium') return 3;
    return 4;
  };

  const getServiceOrder = (serviceType) => (serviceType === 'Home' ? 1 : 2);

  const getWaterOrder = (waterProviding) => (waterProviding === 'N' ? 1 : 2);

  const COMBINATIONS = [
    { serviceType: 'Home', washType: 'Foam', waterProviding: 'N' },
    { serviceType: 'Home', washType: 'Basic', waterProviding: 'N' },
    { serviceType: 'Home', washType: 'Premium', waterProviding: 'N' },
    { serviceType: 'Home', washType: 'Foam', waterProviding: 'Y' },
    { serviceType: 'Home', washType: 'Basic', waterProviding: 'Y' },
    { serviceType: 'Home', washType: 'Premium', waterProviding: 'Y' },
    { serviceType: 'Self Drive', washType: 'Foam', waterProviding: 'N' },
    { serviceType: 'Self Drive', washType: 'Basic', waterProviding: 'N' },
    { serviceType: 'Self Drive', washType: 'Premium', waterProviding: 'N' },
    { serviceType: 'Home', washType: 'Basic+Foam+Premium', waterProviding: 'N' },
    { serviceType: 'Home', washType: 'Basic+Foam+Premium', waterProviding: 'Y' },
    { serviceType: 'Self Drive', washType: 'Basic+Foam+Premium', waterProviding: 'N' }
  ];

  const palette = ['#f4cb18', '#31bbe1', '#ef8068', '#f4cb18'];

  const getDiscountPercent = (actual, final) => {
    const actualPrice = Number(actual || 0);
    const finalPrice = Number(final || 0);
    if (actualPrice <= 0) return 0;
    return Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  };

  const formatMoney = (value) => Number(value || 0).toFixed(2);

  const getDealImageByCarType = (carType) => {
    const normalized = normalizeCarType(carType);
    if (normalized === 'Hatchback' || normalized === 'Sedan') return '/images/hatchback.png';
    if (normalized === 'SUV' || normalized === 'MPV') return '/images/suv.png';
    if (normalized === 'Pickup') return '/images/pickup.png';
    return '/images/hatchback.png';
  };

  const rawDeals = offers
    .filter((deal) => normalizeCarType(deal.carType) === selectedCarType)
    .sort((a, b) => {
      const byWash = getWashOrder(a.washType) - getWashOrder(b.washType);
      if (byWash !== 0) return byWash;

      const byService = getServiceOrder(a.serviceType) - getServiceOrder(b.serviceType);
      if (byService !== 0) return byService;

      return getWaterOrder(a.waterProviding) - getWaterOrder(b.waterProviding);
    });

  const detailedDeals = selectedCarType
    ? COMBINATIONS.map((combo, index) => {
        const matched = rawDeals.find(
          (deal) => deal.serviceType === combo.serviceType
            && deal.washType === combo.washType
            && deal.waterProviding === combo.waterProviding
        );

        return {
          id: matched?.id || `placeholder-${selectedCarType}-${index}`,
          serviceType: combo.serviceType,
          washType: combo.washType,
          waterProviding: combo.waterProviding,
          originalPrice: matched?.originalPrice ?? 0,
          discountedPrice: matched?.discountedPrice ?? 0,
          available: Boolean(matched)
        };
      })
    : [];

  const sortedDetailedDeals = (() => {
    const list = [...detailedDeals];

    if (!priceSort) {
      return list;
    }

    return list.sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      if (priceSort === 'high-low') {
        return Number(b.discountedPrice || 0) - Number(a.discountedPrice || 0);
      }

      return Number(a.discountedPrice || 0) - Number(b.discountedPrice || 0);
    });
  })();

  const dealsToDisplay = selectedDealId
    ? sortedDetailedDeals.filter((deal) => deal.id === selectedDealId)
    : sortedDetailedDeals;

  const selectedDeal = selectedDealId
    ? sortedDetailedDeals.find((deal) => deal.id === selectedDealId)
    : null;

  const saveDealBooking = async (deal) => {
    const authToken = getValidatedAuthToken();

    if (!authToken) {
      clearAuthSession();
      throw new Error('SESSION_EXPIRED');
    }

    const headers = withAuthHeader({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    const payload = {
      phone: getStoredPhone(),
      carType: selectedCarType,
      serviceType: toApiServiceType(deal.serviceType),
      paymentStatus: 'SUCCESS',
      refundAmount: 0,
      refundStatus: 'NOT_INITIATED',
      discountPercentApplied: getDiscountPercent(deal.originalPrice, deal.discountedPrice),
      originalAmount: Number(formatMoney(deal.originalPrice)),
      payableAmount: Number(formatMoney(deal.discountedPrice)),
      washType: deal.washType,
      waterProvided: toApiWaterProvidedFlag(deal.waterProviding),
      totalWashes: Number(deal.totalWashes || 3)
    };

    const response = await fetch('/memberships/deal-price-bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      clearAuthSession();
      throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to save deal booking');
    }
  };

  const proceedToPay = (deal) => {
    setPaymentDeal(deal);
    setShowPaymentModal(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setShowPaymentModal(false);
    const deal = paymentDeal;
    setPaymentDeal(null);
    saveDealBooking(deal)
      .then(() => {
        clearSubscriptionsCache();
        navigate('/terms', {
          state: {
            offerDeal: deal,
            source: 'offers',
            paymentMethod: method
          }
        });
      })
      .catch((err) => {
        console.error('Deal booking save failed:', err);
        if (err.message === 'SESSION_EXPIRED') {
          alert('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        alert('Unable to process payment right now. Please try again.');
      });
  };

  const handlePayNow = (deal) => {
    // Check if user has a phone number (OAuth users may not)
    const phone = getStoredPhone();
    if (!phone) {
      setPendingDeal(deal);
      setPhoneInput('');
      setPhoneError('');
      setOtpInput('');
      setOtpError('');
      setPhoneStep('enter');
      setPhoneIsNew(false);
      setShowPhoneModal(true);
      return;
    }

    if (deal.waterProviding === 'Y') {
      setSelectedDealForPay(deal);
      setWaterConsentChecked(false);
      setShowWaterPopup(true);
      return;
    }
    proceedToPay(deal);
  };

  // Phone modal: check if phone exists
  const handlePhoneCheck = async () => {
    setPhoneError('');
    const trimmed = phoneInput.trim();
    if (!trimmed || !/^\d{10}$/.test(trimmed)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneBusy(true);
    try {
      const res = await fetch('/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed })
      });
      const data = await res.json();
      setPhoneIsNew(!data.exists);
      setPhoneExistingEmail(data.email || '');
      setPhoneStep('confirm');
    } catch {
      setPhoneError('Unable to verify phone. Please try again.');
    } finally {
      setPhoneBusy(false);
    }
  };

  // Phone modal: send OTP
  const handleSendOtp = async () => {
    setOtpError('');
    setPhoneBusy(true);
    try {
      const res = await fetch('/auth/send-otp-generic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phoneInput.trim() })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send OTP');
      }
      setPhoneStep('otp');
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP');
    } finally {
      setPhoneBusy(false);
    }
  };

  // Phone modal: verify OTP and save phone
  const handleVerifyOtp = async () => {
    setOtpError('');
    const trimmedOtp = otpInput.trim();
    if (!trimmedOtp) {
      setOtpError('Please enter the OTP');
      return;
    }
    setPhoneBusy(true);
    try {
      // Verify OTP
      const verifyRes = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phoneInput.trim(), otp: trimmedOtp })
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.message || 'OTP verification failed');
      }

      // Save phone to user profile
      const email = localStorage.getItem('userEmail');
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const updateRes = await fetch('/users/update-phone', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, phone: phoneInput.trim() })
      });

      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save phone number');
      }

      const updateData = await updateRes.json().catch(() => null);
      if (updateData?.token) {
        localStorage.setItem('authToken', updateData.token);
      }
      localStorage.setItem('userPhone', phoneInput.trim());

      // Close modal and proceed to pay
      setShowPhoneModal(false);
      if (pendingDeal) {
        if (pendingDeal.waterProviding === 'Y') {
          setSelectedDealForPay(pendingDeal);
          setWaterConsentChecked(false);
          setShowWaterPopup(true);
        } else {
          proceedToPay(pendingDeal);
        }
        setPendingDeal(null);
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setPhoneBusy(false);
    }
  };

  const handleProceedAfterWaterConsent = () => {
    if (!waterConsentChecked || !selectedDealForPay) return;
    setShowWaterPopup(false);
    proceedToPay(selectedDealForPay);
  };

  return (
    <div className="page-container offers-page">
      {/* Header */}
      <header className="offers-header">
        <button
          className="back-btn"
          onClick={() => {
            if (selectedCarType) {
              setSelectedCarType(null);
              setPriceSort('');
              setShowSortMenu(false);
              return;
            }
            navigate(-1);
          }}
        >
          ←
        </button>
        <h1>{selectedCarType ? `${selectedCarType} Deals` : 'Deals & Offers'}</h1>
        {selectedCarType ? (
          <div className="header-sort-wrap">
            <button
              type="button"
              className="header-sort-icon"
              onClick={() => setShowSortMenu((prev) => !prev)}
              aria-label="Sort deals"
            >
              ⇅
            </button>
            {showSortMenu && (
              <div className="header-sort-menu">
                <button
                  type="button"
                  className={`header-sort-item ${priceSort === 'low-high' ? 'active' : ''}`}
                  onClick={() => {
                    setPriceSort('low-high');
                    setShowSortMenu(false);
                  }}
                >
                  Price: Low to High
                </button>
                <button
                  type="button"
                  className={`header-sort-item ${priceSort === 'high-low' ? 'active' : ''}`}
                  onClick={() => {
                    setPriceSort('high-low');
                    setShowSortMenu(false);
                  }}
                >
                  Price: High to Low
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="header-spacer"></div>
        )}
      </header>

      {/* Loading State */}
      {loading && <p className="loading-message">Loading offers...</p>}

      {/* Error State */}
      {error && <p className="error-message">{error}</p>}

      {!loading && !error && !selectedCarType && (
        <div className="offers-top-panel">
          <div className="offers-strip-line" />
          <div className="offers-subtitle">Get Additional percentage with 3 washes</div>
          <div className="offers-strip-line" />
          <div className="offer-category-list">
            {CAR_TYPES.map((carType) => (
              <button
                key={carType}
                type="button"
                className="offer-category-card"
                onClick={() => {
                  setSelectedCarType(carType);
                  setPriceSort('');
                  setShowSortMenu(false);
                  setSelectedDealId(null);
                }}
              >
                <div className="offer-category-cap">
                  <div className="offer-category-title">{carType}</div>
                </div>
                <div className="offer-category-body">
                  <div className="offer-category-extra">
                    Get upto <span className="offer-category-extra-pill">{getTopDiscountForCarType(carType)}%</span> off
                  </div>
                  <div className="offer-category-note">increase your drops to get additional gifts</div>
                  <div className="offer-category-cta">Tap to explore</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && selectedCarType && (
        <div className="deals-view">
          <div className="deals-grid">
            {dealsToDisplay.map((deal, index) => (
              <div
                key={deal.id}
                className={`deal-detail-card ${!deal.available ? 'missing' : ''} ${selectedDealId === deal.id ? 'selected' : ''}`}
                onClick={() => {
                  if (!deal.available) return;
                  setSelectedDealId(deal.id);
                }}
              >
                <img className="deal-car-image" src={getDealImageByCarType(selectedCarType)} alt="" />
                <div className="deal-card-content">
                  <div className="deal-card-left">
                    <h3 className="deal-card-title">
                      {deal.totalWashes || 3} {formatWashTitle(deal.washType)} washes
                    </h3>
                    <p className="deal-card-subtitle">
                      @{deal.serviceType} for {selectedCarType}
                    </p>
                    {deal.waterProviding === 'Y' && (
                      <p className="deal-water-note">💧 Water to be provided by you</p>
                    )}
                  </div>
                  <div className="deal-card-right">
                    <div className="deal-discount-badge">
                      {getDiscountPercent(deal.originalPrice, deal.discountedPrice)}% OFF
                    </div>
                    <div className="deal-card-pricing">
                      <span className="deal-original-price">₹{Math.round(deal.originalPrice)}</span>
                      <span className="deal-final-price">₹{Math.round(deal.discountedPrice)}/-</span>
                    </div>
                  </div>
                </div>
                {selectedDealId === deal.id && deal.available && (
                  <label className="deal-terms-check">
                    <input
                      type="checkbox"
                      checked={dealTermsAccepted}
                      onChange={(e) => setDealTermsAccepted(e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>I accept all Terms and conditions</span>
                  </label>
                )}
              </div>
            ))}
          </div>

          {selectedDeal && selectedDeal.available && (
            <div className="deals-action-row">
              <button
                type="button"
                className="deal-pay-btn deal-pay-btn-standalone"
                onClick={() => handlePayNow(selectedDeal)}
                disabled={!dealTermsAccepted}
              >
                Pay now
              </button>
            </div>
          )}

          <div className="deals-action-row deals-back-row">
            <button
              type="button"
              className="back-to-categories"
              onClick={() => {
                if (selectedDealId) {
                  setSelectedDealId(null);
                  return;
                }
                setSelectedCarType(null);
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      )}

      {showWaterPopup && (
        <div className="modal-overlay" onClick={() => setShowWaterPopup(false)}>
          <div className="water-consent-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="water-back-btn"
              onClick={() => setShowWaterPopup(false)}
            >
              ← Back
            </button>
            <h3>Before payment</h3>
            <p>This offer requires customer-provided water.</p>
            <label className="water-consent-check">
              <input
                type="checkbox"
                checked={waterConsentChecked}
                onChange={(e) => setWaterConsentChecked(e.target.checked)}
              />
              <span>Provide water to washer for service</span>
            </label>
            <button
              type="button"
              className="water-proceed-btn"
              onClick={handleProceedAfterWaterConsent}
              disabled={!waterConsentChecked}
            >
              Proceed to pay
            </button>
          </div>
        </div>
      )}

      {/* Phone Linking Modal for OAuth users */}
      {showPhoneModal && (
        <div className="modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="phone-link-modal" onClick={(e) => e.stopPropagation()}>
            <button className="phone-link-close" onClick={() => setShowPhoneModal(false)}>✕</button>

            {phoneStep === 'enter' && (
              <>
                <div className="phone-link-icon">📱</div>
                <h3 className="phone-link-title">Link Your Phone Number</h3>
                <p className="phone-link-desc">Enter your phone number to continue with payment</p>
                <input
                  type="tel"
                  className="phone-link-input"
                  placeholder="Enter 10-digit phone number"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
                  maxLength="10"
                  disabled={phoneBusy}
                />
                {phoneError && <p className="phone-link-error">{phoneError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handlePhoneCheck}
                  disabled={phoneBusy || phoneInput.trim().length !== 10}
                >
                  {phoneBusy ? 'Checking...' : 'Continue'}
                </button>
              </>
            )}

            {phoneStep === 'confirm' && (
              <>
                <div className="phone-link-icon">{phoneIsNew ? '🎉' : '👋'}</div>
                <h3 className="phone-link-title">
                  {phoneIsNew ? 'New User!' : 'Welcome Back!'}
                </h3>
                <p className="phone-link-desc">
                  {phoneIsNew
                    ? 'Get a signup bonus of ₹20 off on your first booking!'
                    : `${phoneInput} is already registered with ${phoneExistingEmail}. Do you wish to continue?`
                  }
                </p>
                {otpError && <p className="phone-link-error">{otpError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handleSendOtp}
                  disabled={phoneBusy}
                >
                  {phoneBusy ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <button
                  className="phone-link-btn-secondary"
                  onClick={() => { setPhoneStep('enter'); setPhoneInput(''); }}
                >
                  Change Number
                </button>
              </>
            )}

            {phoneStep === 'otp' && (
              <>
                <div className="phone-link-icon">🔐</div>
                <h3 className="phone-link-title">Verify OTP</h3>
                <p className="phone-link-desc">Enter the OTP sent to {phoneInput}</p>
                <input
                  type="tel"
                  className="phone-link-input"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  maxLength="6"
                  disabled={phoneBusy}
                />
                {otpError && <p className="phone-link-error">{otpError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handleVerifyOtp}
                  disabled={phoneBusy || !otpInput.trim()}
                >
                  {phoneBusy ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button
                  className="phone-link-btn-secondary"
                  onClick={handleSendOtp}
                  disabled={phoneBusy}
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="home" />

      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => { setShowPaymentModal(false); setPaymentDeal(null); }}
        onSelect={handlePaymentMethodSelect}
        amount={paymentDeal?.discountedPrice}
      />
    </div>
  );
};

export default Offers;
