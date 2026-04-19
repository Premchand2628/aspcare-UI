import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PaymentMethodModal.css';

const PAYMENT_METHODS = [
  {
    id: 'phonepe',
    label: 'PhonePe',
    icon: '📱',
    color: '#5f259f'
  },
  {
    id: 'gpay',
    label: 'GPay',
    icon: '💳',
    color: '#4285F4'
  }
];

function PaymentMethodModal({ open, onClose, onSelect, amount }) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('');
  const [showCardForm, setShowCardForm] = useState(false);
  const [showUpiForm, setShowUpiForm] = useState(false);

  const [cardNumber, setCardNumber] = useState('');
  const [expDate, setExpDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  const [cardError, setCardError] = useState('');
  const [upiId, setUpiId] = useState('');

  const detectCardType = (number) => {
    const digits = number.replace(/\D/g, '');
    if (!digits) return null;
    if (/^4/.test(digits)) return 'Visa';
    if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'Mastercard';
    return 'Unknown';
  };

  const isLuhnValid = (number) => {
    const digits = number.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  };

  const cardType = detectCardType(cardNumber);

  const formatCardNum = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExp = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const handleSaveCard = () => {
    setCardError('');
    if (!cardNumber || !expDate || !cvv || !nameOnCard) { setCardError('Please fill all card details'); return; }
    if (!isLuhnValid(cardNumber)) { setCardError('Invalid card number'); return; }
    if (cardType !== 'Visa' && cardType !== 'Mastercard') { setCardError('Only Visa and Mastercard are accepted'); return; }
    const parts = expDate.split('/');
    const month = parseInt(parts[0], 10);
    if (parts.length !== 2 || month < 1 || month > 12 || parts[1].length !== 2) { setCardError('Invalid expiry date'); return; }
    setSelected('card');
    setShowCardForm(false);
  };

  const handleSaveUpi = () => {
    if (!upiId || !upiId.includes('@')) { return; }
    setSelected('upi');
    setShowUpiForm(false);
  };

  if (!open) return null;

  const handleProceed = () => {
    if (!selected) return;
    onSelect(selected);
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <button className="payment-modal-back" onClick={onClose}>←</button>
          <h3>Select Payment Method</h3>
          <div className="payment-modal-spacer" />
        </div>

        {amount != null && (
          <p className="payment-modal-amount">
            Amount: <strong>₹{Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</strong>
          </p>
        )}

        <div className="payment-methods-list">
          {PAYMENT_METHODS.map((method) => (
            <div
              key={method.id}
              className={`payment-method-option ${selected === method.id ? 'payment-method-selected' : ''}`}
              onClick={() => { setSelected(method.id); setShowCardForm(false); setShowUpiForm(false); }}
            >
              <span className="payment-method-icon" style={{ background: method.color }}>
                {method.icon}
              </span>
              <span className="payment-method-label">{method.label}</span>
              <span className={`payment-method-radio ${selected === method.id ? 'checked' : ''}`} />
            </div>
          ))}

          {/* Add new Credit/Debit Card */}
          <div className={`payment-method-option pm-expandable ${showCardForm || selected === 'card' ? 'payment-method-selected' : ''}`}>
            <div className="pm-expand-header" onClick={() => { setShowCardForm(!showCardForm); setShowUpiForm(false); setSelected(''); }}>
              <span className="payment-method-icon" style={{ background: '#1a1a2e' }}>💳</span>
              <span className="payment-method-label">Add new Credit/Debit Card</span>
              <span className="pm-modal-chevron">{showCardForm ? '▲' : '▼'}</span>
            </div>
            {showCardForm && (
              <div className="pm-inline-form">
                <div className="pm-inline-group">
                  <label>Card Number</label>
                  <div className="pm-inline-card-wrap">
                    <input type="text" placeholder="1234 5678 9012 3456" value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNum(e.target.value))} maxLength={19} inputMode="numeric" />
                    {cardType && cardType !== 'Unknown' && (
                      <span className={`pm-inline-badge pm-badge-${cardType.toLowerCase()}`}>{cardType}</span>
                    )}
                  </div>
                </div>
                <div className="pm-inline-row">
                  <div className="pm-inline-group">
                    <label>Exp Date</label>
                    <input type="text" placeholder="MM/YY" value={expDate}
                      onChange={(e) => setExpDate(formatExp(e.target.value))} maxLength={5} inputMode="numeric" />
                  </div>
                  <div className="pm-inline-group">
                    <label>CVV</label>
                    <input type="password" placeholder="•••" value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} inputMode="numeric" />
                  </div>
                </div>
                <div className="pm-inline-group">
                  <label>Name on Card</label>
                  <input type="text" placeholder="John Doe" value={nameOnCard}
                    onChange={(e) => setNameOnCard(e.target.value)} />
                </div>
                {cardError && <p className="pm-inline-error">{cardError}</p>}
                <button className="pm-inline-save" onClick={handleSaveCard}>Save Card</button>
              </div>
            )}
          </div>

          {/* Add new UPI ID */}
          <div className={`payment-method-option pm-expandable ${showUpiForm || selected === 'upi' ? 'payment-method-selected' : ''}`}>
            <div className="pm-expand-header" onClick={() => { setShowUpiForm(!showUpiForm); setShowCardForm(false); setSelected(''); }}>
              <span className="payment-method-icon" style={{ background: '#0b6623' }}>🏦</span>
              <span className="payment-method-label">Add new UPI ID</span>
              <span className="pm-modal-chevron">{showUpiForm ? '▲' : '▼'}</span>
            </div>
            {showUpiForm && (
              <div className="pm-inline-form">
                <div className="pm-inline-group">
                  <label>UPI ID</label>
                  <input type="text" placeholder="yourname@upi" value={upiId}
                    onChange={(e) => setUpiId(e.target.value)} />
                </div>
                <button className="pm-inline-save" onClick={handleSaveUpi}>Save UPI ID</button>
              </div>
            )}
          </div>
        </div>

        <button
          className="payment-proceed-btn"
          disabled={!selected}
          onClick={handleProceed}
        >
          Proceed to Pay
        </button>

        <button
          className="payment-new-methods-btn"
          onClick={() => { onClose(); navigate('/paymentmethods'); }}
        >
          Manage Payment Methods
        </button>
      </div>
    </div>
  );
}

export default PaymentMethodModal;
