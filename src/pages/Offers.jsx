import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Offers.css';

const Offers = () => {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [selectedCarType, setSelectedCarType] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDealForPay, setSelectedDealForPay] = useState(null);
  const [showWaterPopup, setShowWaterPopup] = useState(false);
  const [waterConsentChecked, setWaterConsentChecked] = useState(false);
  const [priceSort, setPriceSort] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);

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
    const v = normalize(value).replace('_', ' ');
    if (v === 'self drive') return 'Self Drive';
    return 'Home';
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

  const fetchDeals = async () => {
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch('/api/deal-prices', {
        method: 'GET',
        headers: headers
      });

      if (response.ok) {
        const data = await response.json();
        const transformedOffers = data.map((deal) => ({
          id: deal.id,
          serviceType: normalizeServiceType(deal.dealServiceType),
          washType: normalizeWashType(deal.dealWashType),
          carType: normalizeCarType(deal.dealCarType),
          waterProviding: String(deal.dealWaterProviding || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
          originalPrice: parseFloat(deal.dealActualPrice),
          discountedPrice: parseFloat(deal.dealFinalPrice),
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

  const getStoredPhone = () => {
    const possibleKeys = ['phone', 'userPhone', 'mobileNumber', 'mobile', 'contact'];
    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);
      if (value && value.trim()) {
        return value.trim();
      }
    }
    return null;
  };

  const saveDealBooking = async (deal) => {
    const authToken = localStorage.getItem('authToken');
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const payload = {
      phone: getStoredPhone(),
      carType: selectedCarType,
      serviceType: deal.serviceType,
      paymentStatus: 'SUCCESS',
      refundAmount: 0,
      refundStatus: 'NOT_INITIATED',
      discountPercentApplied: getDiscountPercent(deal.originalPrice, deal.discountedPrice),
      originalAmount: Number(formatMoney(deal.originalPrice)),
      payableAmount: Number(formatMoney(deal.discountedPrice)),
      washType: deal.washType,
      waterProvided: deal.waterProviding
    };

    const response = await fetch('/memberships/deal-price-bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to save deal booking');
    }
  };

  const proceedToPay = (deal) => {
    saveDealBooking(deal)
      .then(() => {
        navigate('/terms', {
          state: {
            offerDeal: deal,
            source: 'offers'
          }
        });
      })
      .catch((err) => {
        console.error('Deal booking save failed:', err);
        alert('Unable to process payment right now. Please try again.');
      });
  };

  const handlePayNow = (deal) => {
    if (deal.waterProviding === 'Y') {
      setSelectedDealForPay(deal);
      setWaterConsentChecked(false);
      setShowWaterPopup(true);
      return;
    }
    proceedToPay(deal);
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
            {sortedDetailedDeals.map((deal, index) => (
              <div
                key={deal.id}
                className={`deal-detail-card ${!deal.available ? 'missing' : ''}`}
                style={{ backgroundColor: palette[index % palette.length] }}
              >
                <div className="deal-top-row">
                  <span className="deal-service">{deal.serviceType}</span>
                  <span className="deal-wash">{formatWashTitle(deal.washType)}</span>
                </div>
                <div className="deal-mid-row">
                  <p className="deal-washes">3 washes</p>
                  <p className="deal-main-price">Rs{formatMoney(deal.originalPrice)}</p>
                </div>
                <p className="deal-discount">Flat {getDiscountPercent(deal.originalPrice, deal.discountedPrice)}% off</p>
                <p className="deal-sub-price">
                  @Rs{formatMoney(deal.discountedPrice)} <span className="deal-tax-inline">(incl. tax)</span>
                </p>
                <div className="deal-footer-row">
                  <button type="button" className="deal-pay-btn" onClick={() => handlePayNow(deal)}>Pay now</button>
                  <p className="deal-tc">T&C Apply</p>
                </div>
              </div>
            ))}
          </div>

          <button type="button" className="back-to-categories" onClick={() => setSelectedCarType(null)}>
            ← Back to 5 boxes
          </button>
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

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Offers;
