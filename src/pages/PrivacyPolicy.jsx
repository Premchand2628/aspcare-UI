import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PolicyPages.css';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <header className="policy-top">
        <button className="policy-back" onClick={() => navigate(-1)}>←</button>
        <div className="policy-title-wrap">
          <span className="policy-brand">ASPcare</span>
          <span className="policy-title">Privacy Policy</span>
        </div>
      </header>

      <main className="policy-container">
        <h1>Privacy Policy</h1>
        <p className="policy-subtitle">Last updated: December 2025</p>

        <p>
          ASPcare knows that you care how information about you is used and shared. As part of its
          commitment to customer service, ASPcare strives to make you feel safe and comfortable doing
          business with us.
        </p>
        <p>
          Here are the guidelines ASPcare follows to keep your personal information private.
          ASPcare reserves the right to modify this Privacy Policy at any time in our sole
          discretion without notice.
        </p>

        <h2>Information Collection</h2>
        <p>ASPcare may collect certain personally identifiable information, including but not limited to:</p>
        <ul>
          <li>Name</li>
          <li>Address</li>
          <li>Telephone number</li>
          <li>Email address</li>
          <li>Payment information such as credit card and billing address</li>
        </ul>
        <p>
          ASPcare will not be held responsible for any illegal use of customer data done by individual
          corporate identities of franchise owners.
        </p>
        <p>
          ASPcare is not responsible for any claims made by customers in case of any failure to provide
          service by franchisees. ASPcare shall not be liable for any refund or adjustments for transactions
          done by franchisees with their clients.
        </p>
        <p>
          Our website may use third-party products and services to gather anonymous traffic statistics using
          cookies and web beacons. Cookies help websites recognize returning visitors.
        </p>
        <p>
          ASPcare and its service providers may also use pixels or transparent GIF files for website management
          and user tracking.
        </p>
        <p>
          ASPcare may transmit non-personally identifiable information about visitors to reputable third-party
          servers for targeted banner advertisements.
        </p>

        <h2>Information Use</h2>
        <p>ASPcare may share personal information with third parties who provide:</p>
        <ul>
          <li>Gift Card or Merchandise Credit redemption</li>
          <li>Marketing services (email, SMS, database cleaning)</li>
          <li>Customer experience improvements</li>
          <li>Warranty management</li>
        </ul>
        <p>
          ASPcare is not in the business of selling customer information. We do not sell, rent,
          or trade personal information with third parties.
        </p>
        <p>
          ASPcare may also use aggregated, non-personally identifiable data such as demographics
          or statistical information.
        </p>

        <h2>Links to Other Websites</h2>
        <p>
          Although ASPcare may link its website to other sites, ASPcare is not responsible for and does not
          control security or privacy practices on external websites.
        </p>

        <h2>Updates to This Privacy Policy</h2>
        <p>
          ASPcare may modify this policy from time to time. Any material updates will be posted on this page
          along with the updated modification date.
        </p>

        <h2>How to Contact Us</h2>
        <p>
          If you have questions about this privacy statement or your interaction with this site, contact us at:
          <br />
          support@aspcare.com
        </p>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
