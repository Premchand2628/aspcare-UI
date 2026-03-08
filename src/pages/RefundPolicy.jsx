import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/PolicyPages.css';

const RefundPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-page">
      <header className="policy-top">
        <button className="policy-back" onClick={() => navigate(-1)}>←</button>
        <div className="policy-title-wrap">
          <span className="policy-brand">ASP Car Care</span>
          <span className="policy-title">Refund Policy</span>
        </div>
      </header>

      <main className="policy-container">
        <h1>Refund Policy</h1>
        <p className="policy-subtitle">Effective Date: 15-Dec-2025</p>

        <p>
          We aim to provide a smooth booking and service experience. This policy explains when you may be
          eligible for a refund, how refunds are calculated, and how to request one.
        </p>

        <h2>1) Overview</h2>
        <p>
          Refunds depend on service type, cancellation time, and whether the service has started.
          Platform/transaction fees (if any) may be non-refundable if charged by payment providers.
        </p>

        <h2>2) Eligibility for Refunds</h2>
        <h3>A) Full Refund (100%)</h3>
        <ul>
          <li>Service not delivered due to ASP Care cancellation.</li>
          <li>Payment deducted but booking not confirmed due to technical issue.</li>
          <li>Duplicate payment for the same booking.</li>
        </ul>

        <h3>B) Partial Refund</h3>
        <ul>
          <li>Cancellation close to slot time.</li>
          <li>Service started but could not be completed due to customer-side reasons.</li>
        </ul>

        <h3>C) No Refund</h3>
        <ul>
          <li>No-show or access not provided at scheduled time.</li>
          <li>Cancellation after service has started (except verified quality issues).</li>
          <li>Incorrect address/vehicle unavailable/unsafe conditions.</li>
        </ul>

        <h2>3) Cancellation Window</h2>
        <table className="policy-table">
          <thead>
            <tr>
              <th>When you cancel</th>
              <th>Refund amount</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>≥ 24 hours before slot</td>
              <td>100%</td>
              <td>Full refund (except non-refundable gateway fees if applicable)</td>
            </tr>
            <tr>
              <td>6–24 hours before slot</td>
              <td>75%</td>
              <td>Operations planning cost may apply</td>
            </tr>
            <tr>
              <td>1–6 hours before slot</td>
              <td>50%</td>
              <td>Late cancellation</td>
            </tr>
            <tr>
              <td>&lt; 1 hour before slot</td>
              <td>0%</td>
              <td>No refund</td>
            </tr>
          </tbody>
        </table>

        <h2>4) Service Quality Issues</h2>
        <ul>
          <li>Report within 24 hours of completion.</li>
          <li>We may offer re-service, partial refund, or full refund for verified severe issues.</li>
        </ul>

        <h2>5) Refund Method & Timeline</h2>
        <ul>
          <li>Refunds go to the original payment method whenever possible.</li>
          <li>Processing initiated in 1–3 business days.</li>
          <li>Bank settlement usually 5–10 business days.</li>
        </ul>

        <h2>6) How to Request a Refund</h2>
        <ul>
          <li>In app: My Bookings → Booking Details → Help/Support → Raise Ticket</li>
          <li>Chat Support: Support → Chat with Agent</li>
          <li>Email: support@aspcare.com</li>
        </ul>
      </main>
    </div>
  );
};

export default RefundPolicy;
