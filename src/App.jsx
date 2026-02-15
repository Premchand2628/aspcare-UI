import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Services from './pages/Services';
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

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/select-center" element={<SelectCenter />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/review" element={<Review />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/order-detail/:id" element={<OrderDetail />} />
          <Route path="/terms" element={<TermsConditions />} />
          <Route path="/membership-plans" element={<MembershipPlans />} />
          <Route path="/membership-detail" element={<MembershipDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/referral-details" element={<ReferralDetails />} />
          <Route path="/rewards-calculation" element={<RewardsCalculation />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/offer-detail" element={<OfferDetail />} />
          <Route path="/chatbot" element={<Chatbot />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
