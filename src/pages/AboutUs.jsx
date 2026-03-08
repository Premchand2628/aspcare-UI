import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PolicyPages.css';

const AboutUs = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <header className="policy-top">
        <button className="policy-back" onClick={() => navigate(-1)}>←</button>
        <div className="policy-title-wrap">
          <span className="policy-brand">ASPcare</span>
          <span className="policy-title">About us</span>
        </div>
      </header>

      <main className="policy-container">
        <h1>About us</h1>
        <p className="policy-subtitle">ASPcare | Car Wash & Care Services</p>

        <p>
          ASPcare is focused on making car care simple, reliable, and customer-friendly.
          We provide scheduled car wash services with transparent pricing, membership benefits,
          and easy booking.
        </p>

        <h2>What we do</h2>
        <ul>
          <li>At-home and self-drive wash options</li>
          <li>Basic, foam, and premium wash packages</li>
          <li>Membership plans with discounts and benefits</li>
          <li>Support-driven booking management and upgrades</li>
        </ul>

        <h2>Our approach</h2>
        <p>
          We focus on quality service delivery, clear communication, and quick support.
          Our goal is to deliver a consistent experience from booking to completion.
        </p>

        <h2>Contact</h2>
        <p>
          Email: support@aspcare.com
          <br />
          Phone: +91 90103 40125
          <br />
          Location: Kondapur, Hyderabad
        </p>
      </main>
    </div>
  );
};

export default AboutUs;
