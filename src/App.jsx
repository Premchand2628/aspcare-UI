import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import SelectCenter from './pages/SelectCenter';
import Booking from './pages/Booking';
import Review from './pages/Review';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import TermsConditions from './pages/TermsConditions';
import MembershipPlans from './pages/MembershipPlans';
import MembershipDetail from './pages/MembershipDetail';
import Profile from './pages/Profile';
import ReferralDetails from './pages/ReferralDetails';
import RewardsCalculation from './pages/RewardsCalculation';
import Offers from './pages/Offers';
import OfferDetail from './pages/OfferDetail';
import Chatbot from './pages/Chatbot';
import MySubscriptions from './pages/MySubscriptions';
import AboutUs from './pages/AboutUs';
import RefundPolicy from './pages/RefundPolicy';
import PrivacyPolicy from './pages/PrivacyPolicy';
import PaymentMethods from './pages/PaymentMethods';
import { hasValidAuthSession } from './utils/auth';

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!hasValidAuthSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/select-center" element={<SelectCenter />} />
          <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/membership-plans" element={<ProtectedRoute><MembershipPlans /></ProtectedRoute>} />
          <Route path="/membership-detail" element={<ProtectedRoute><MembershipDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/referral-details" element={<ProtectedRoute><ReferralDetails /></ProtectedRoute>} />
          <Route path="/rewards-calculation" element={<ProtectedRoute><RewardsCalculation /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><Offers /></ProtectedRoute>} />
          <Route path="/offer-detail" element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
          <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
          <Route path="/my-subscriptions" element={<ProtectedRoute><MySubscriptions /></ProtectedRoute>} />
          <Route path="/memberships/deal-price-bookings" element={<ProtectedRoute><MySubscriptions /></ProtectedRoute>} />
          <Route path="/paymentmethods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
          <Route path="/aspcare/About us" element={<AboutUs />} />
          <Route path="/aspcare/refundpolicy" element={<RefundPolicy />} />
          <Route path="/aspcare/privacypolicy" element={<PrivacyPolicy />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
