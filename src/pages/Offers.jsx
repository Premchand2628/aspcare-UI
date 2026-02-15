import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/Offers.css';

const Offers = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Color mapping for wash types
  const colorMap = {
    'Basic': '#4ECDC4',
    'Foam': '#FFD84D',
    'Premium': '#FF7A59',
    'Basic+Foam+Premium': '#9B59B6'
  };

  // Icon mapping for wash types
  const iconMap = {
    'Basic': '🚿',
    'Foam': '🧽',
    'Premium': '⭐',
    'Basic+Foam+Premium': '🎁'
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
        // Transform API data to match offer structure
        const transformedOffers = data.map((deal, index) => ({
          id: deal.id,
          title: 'Additional discount on 3 washes',
          type: deal.dealWashType,
          originalPrice: parseFloat(deal.dealActualPrice),
          discountedPrice: parseFloat(deal.dealFinalPrice),
          color: colorMap[deal.dealWashType] || '#FFD84D',
          icon: iconMap[deal.dealWashType] || '🧽',
          serviceType: deal.dealServiceType,
          waterRequired: deal.dealWaterProviding === 'Y'
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

  const calculateDiscount = (original, discounted) => {
    const discount = ((original - discounted) / original * 100).toFixed(0);
    return `Flat ${discount}% off`;
  };

  // Filter offers based on search query
  const filteredOffers = offers.filter(offer => 
    offer.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="page-container">
      {/* Header */}
      <header className="offers-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← 
        </button>
        <h1>Deals & Offers</h1>
        <div className="header-spacer"></div>
      </header>

      {/* Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search for Foam, Basic, Premium..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="clear-search" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      {/* Loading State */}
      {loading && <p className="loading-message">Loading offers...</p>}

      {/* Error State */}
      {error && <p className="error-message">{error}</p>}

      {/* No Offers */}
      {!loading && !error && offers.length === 0 && (
        <p className="no-offers-message">No offers available</p>
      )}

      {/* Offers Grid */}
      {!loading && !error && offers.length > 0 && (
        <div className="offers-grid">
          {filteredOffers.map((offer) => (
            <div 
              key={offer.id} 
              className="offer-card"
              style={{ backgroundColor: offer.color }}
              onClick={() => navigate('/offer-detail', { state: { offer } })}
            >
              <div className="offer-icon">{offer.icon}</div>
              <div className="car-illustration">
                <img src="/images/car-wash-illustration.png" alt="Car wash" />
              </div>
              <h3 className="offer-type">
                {offer.type.includes('+') 
                  ? offer.type.split('+').map((type, index) => (
                      <span key={index}>
                        {type}
                        {index < offer.type.split('+').length - 1 && <br />}
                      </span>
                    ))
                  : offer.type
                } wash
              </h3>
              <p className="offer-discount">{calculateDiscount(offer.originalPrice, offer.discountedPrice)}</p>
              <p className="offer-original">
                3 washes <span className="strikethrough">@Rs{offer.originalPrice.toFixed(2)}</span>
              </p>
              <p className="offer-price">
                Rs{offer.discountedPrice.toFixed(2)}
              </p>
              <p className="tax-note">(excl., Tax)</p>
              <p className="offer-terms">T&C Apply</p>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
};

export default Offers;
