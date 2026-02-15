import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/OfferDetail.css';

const OfferDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const offer = location.state?.offer;
  const [waterProvided, setWaterProvided] = useState(false);

  if (!offer) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p>Offer details not found</p>
          <button onClick={() => navigate('/offers')}>Back to Offers</button>
        </div>
      </div>
    );
  }

  const waterRequiredPrices = new Set([669, 349, 2749, 1227]);
  const isWaterRequired = offer.waterRequired === true;

  const handleBookNow = () => {
    if (isWaterRequired && !waterProvided) {
      alert('Please confirm water provision');
      return;
    }
    // Navigate to booking page with offer details
    navigate('/booking', { state: { offer } });
  };

  const handleSkip = () => {
    navigate('/offers');
  };

  const discountPercent = ((offer.originalPrice - offer.discountedPrice) / offer.originalPrice * 100).toFixed(0);

  return (
    <div className="page-container">
      {/* Header */}
      <header className="offer-detail-header">
        <button className="back-btn-absolute" onClick={() => navigate('/offers')}>←</button>
        <h1>Offer Details</h1>
      </header>

      {/* Offer Card Display */}
      <div className="offer-detail-card" style={{ backgroundColor: offer.color }}>
        <div className="offer-detail-icon">{offer.icon}</div>
        
        <div className="car-illustration">
          <img src="/images/car-wash-illustration.png" alt="Car wash" />
        </div>

        <div className="offer-detail-content">
          <h2 className="offer-detail-type">
            {offer.type.includes('+') 
              ? offer.type.split('+').map((type, index) => (
                  <span key={index}>
                    {type}
                    {index < offer.type.split('+').length - 1 && <br />}
                  </span>
                ))
              : offer.type
            } wash
          </h2>

          <p className="offer-title">
            <strong>Additional discount on 3 washes</strong>
            <span className="offer-title-percent"> ({discountPercent}% off)</span>
          </p>

          <div className="offer-detail-pricing">
            <div className="price-row">
              <span className="price-label">3 washes Original Price:</span>
              <span className="price-value strikethrough">₹{offer.originalPrice.toFixed(2)}</span>
            </div>

            <div className="price-row highlight">
              <span className="price-label">Offer Price:</span>
              <div className="price-inline">
                <span className="price-value-big">₹{offer.discountedPrice.toFixed(2)}</span>
                <span className="tax-note-inline">(excl. Tax)</span>
              </div>
            </div>
          </div>

          <p className="terms-note">T&C Apply</p>
        </div>
      </div>

      {/* Water Provision Checkbox - Only for discounted prices */}
      {isWaterRequired && (
        <div className="water-checkbox-section">
          <label className="water-checkbox-label">
            <input
              type="checkbox"
              checked={waterProvided}
              onChange={(e) => setWaterProvided(e.target.checked)}
              className="water-checkbox"
            />
            <span>Please provide water for wash</span>
          </label>
        </div>
      )}

      {/* Action Buttons */}
      <div className="offer-detail-actions">
        <button className="skip-btn" onClick={handleSkip}>
          Skip
        </button>
        <button 
          className="book-now-btn" 
          onClick={handleBookNow}
          disabled={isWaterRequired && !waterProvided}
          style={{ 
            opacity: (isWaterRequired && !waterProvided) ? 0.5 : 1, 
            cursor: (isWaterRequired && !waterProvided) ? 'not-allowed' : 'pointer' 
          }}
        >
          Book Now
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default OfferDetail;
