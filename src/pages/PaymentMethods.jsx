import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import '../styles/PaymentMethods.css';

const PaymentMethods = () => {
  const navigate = useNavigate();
  const [showCardForm, setShowCardForm] = useState(false);
  const [showUpiForm, setShowUpiForm] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');

  const [upiId, setUpiId] = useState('');
  const [cardError, setCardError] = useState('');

  // Detect card type from number
  const detectCardType = (number) => {
    const digits = number.replace(/\D/g, '');
    if (!digits) return null;
    if (/^4/.test(digits)) return 'Visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^6(?:011|5)/.test(digits)) return 'Discover';
    if (/^35(?:2[89]|[3-8])/.test(digits)) return 'JCB';
    return 'Unknown';
  };

  // Luhn algorithm to validate card number
  const isLuhnValid = (number) => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  };

  const cardType = detectCardType(cardNumber);

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpDate = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleCardNumberChange = (e) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpDateChange = (e) => {
    setExpDate(formatExpDate(e.target.value));
  };

  const handleCvvChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(digits);
  };

  const handleNameChange = (e) => {
    setNameOnCard(e.target.value);
  };

  const handleSaveCard = () => {
    setCardError('');
    if (!cardNumber || !expDate || !cvv || !nameOnCard) {
      setCardError('Please fill all card details');
      return;
    }
    if (!isLuhnValid(cardNumber)) {
      setCardError('Invalid card number');
      return;
    }
    if (cardType !== 'Visa' && cardType !== 'Mastercard') {
      setCardError('Only Visa and Mastercard are accepted');
      return;
    }
    // Validate expiry MM/YY
    const parts = expDate.split('/');
    const month = parseInt(parts[0], 10);
    if (parts.length !== 2 || month < 1 || month > 12 || parts[1].length !== 2) {
      setCardError('Invalid expiry date');
      return;
    }
    alert('Card saved successfully!');
    setShowCardForm(false);
    setCardNumber('');
    setExpDate('');
    setCvv('');
    setNameOnCard('');
    setCardError('');
  };

  const handleSaveUpi = () => {
    if (!upiId || !upiId.includes('@')) {
      alert('Please enter a valid UPI ID (e.g. name@upi)');
      return;
    }
    alert('UPI ID saved successfully!');
    setShowUpiForm(false);
    setUpiId('');
  };

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="pm-header">
        <button className="pm-back-btn" onClick={() => navigate(-1)}>←</button>
        <h1>Payment Methods</h1>
        <div className="pm-header-spacer" />
      </div>

      <div className="pm-content">
        {/* Saved Cards Section */}
        <div className="pm-section">
          <div className="pm-section-header">
            <span className="pm-section-icon">💳</span>
            <h2>Saved Cards</h2>
          </div>
          <div className="pm-empty-state">
            <p>No saved cards yet</p>
          </div>
        </div>

        {/* Your UPIs Section */}
        <div className="pm-section">
          <div className="pm-section-header">
            <span className="pm-section-icon">🏦</span>
            <h2>Your UPI's</h2>
          </div>
          <div className="pm-empty-state">
            <p>No UPI IDs added yet</p>
          </div>
        </div>

        {/* Add New Card */}
        <div className="pm-section">
          <button
            className={`pm-add-btn ${showCardForm ? 'pm-add-btn-active' : ''}`}
            onClick={() => { setShowCardForm(!showCardForm); setShowUpiForm(false); }}
          >
            <span className="pm-add-icon">➕</span>
            <span className="pm-add-label">Add new credit card or debit card</span>
            <span className="pm-chevron">{showCardForm ? '▲' : '▼'}</span>
          </button>

          {showCardForm && (
            <div className="pm-form">
              <div className="pm-form-group">
                <label>Card Number</label>
                <div className="pm-card-input-wrap">
                  <input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    inputMode="numeric"
                  />
                  {cardType && cardType !== 'Unknown' && (
                    <span className={`pm-card-badge pm-card-${cardType.toLowerCase()}`}>
                      {cardType}
                    </span>
                  )}
                </div>
              </div>
              <div className="pm-form-row">
                <div className="pm-form-group">
                  <label>Exp Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expDate}
                    onChange={handleExpDateChange}
                    maxLength={5}
                    inputMode="numeric"
                  />
                </div>
                <div className="pm-form-group">
                  <label>CVV</label>
                  <input
                    type="password"
                    placeholder="•••"
                    value={cvv}
                    onChange={handleCvvChange}
                    maxLength={4}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="pm-form-group">
                <label>Name on Card</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={nameOnCard}
                  onChange={handleNameChange}
                />
              </div>
              {cardError && <p className="pm-card-error">{cardError}</p>}
              <button className="pm-save-btn" onClick={handleSaveCard}>
                Save Card
              </button>
            </div>
          )}
        </div>

        {/* Add New UPI */}
        <div className="pm-section">
          <button
            className={`pm-add-btn ${showUpiForm ? 'pm-add-btn-active' : ''}`}
            onClick={() => { setShowUpiForm(!showUpiForm); setShowCardForm(false); }}
          >
            <span className="pm-add-icon">➕</span>
            <span className="pm-add-label">Add new UPI ID</span>
            <span className="pm-chevron">{showUpiForm ? '▲' : '▼'}</span>
          </button>

          {showUpiForm && (
            <div className="pm-form">
              <div className="pm-form-group">
                <label>UPI ID</label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <button className="pm-save-btn" onClick={handleSaveUpi}>
                Save UPI ID
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
};

export default PaymentMethods;
