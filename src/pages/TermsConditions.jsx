import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/TermsConditions.css';

const TermsConditions = () => {
  const navigate = useNavigate();
  const [accepted, setAccepted] = useState(false);

  const handleSubmit = () => {
    if (accepted) {
      navigate('/membership-detail');
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <header className="terms-header">
        <button className="back-btn-inline" onClick={() => navigate(-1)}>←</button>
        <div className="avatar">
          <img src="/images/user-avatar.png" alt="User" />
        </div>
        <h1 className="service-title-main">Self drive</h1>
      </header>

      {/* Thank You Message */}
      <div className="thank-you-section">
        <h2>Thanks For Choosing Us, $User</h2>
      </div>

      {/* Order Details */}
      <div className="order-summary">
        <div className="summary-row">
          <span>Order#:</span>
          <span>9010340125</span>
        </div>
        <div className="summary-row">
          <span>HOME000025</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-row">
          <span>Start Dt &Time (Expected)</span>
          <span>10-JAN-2025<br />11:00-12:00PM</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-row">
          <span>Start Dt &Time (Actual)</span>
          <span>10-JAN-2025<br />11:00-12:00PM</span>
        </div>
        <div className="summary-divider"></div>
        <div className="summary-row">
          <span>Closing Dt & Time (Actual)</span>
          <span>10-JAN-2025<br />11:00-12:00PM</span>
        </div>
      </div>

      {/* Terms Checkbox */}
      <div className="terms-checkbox">
        <input 
          type="checkbox" 
          id="terms"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <label htmlFor="terms">
          <span className="check-icon">✓</span>
          Accepting the Terms & condition
        </label>
      </div>

      {/* Terms Content */}
      <div className="terms-content">
        <textarea 
          readOnly
          value="Terms and conditions content goes here..."
          className="terms-textarea"
        />
      </div>

      {/* Action Buttons */}
      <div className="terms-actions">
        <button className="submit-btn" onClick={handleSubmit}>
          scroll to submit
        </button>
        <button className="report-btn">Report</button>
      </div>
    </div>
  );
};

export default TermsConditions;
