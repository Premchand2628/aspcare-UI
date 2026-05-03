import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { hasValidAuthSession } from './utils/auth';

// Route-level code splitting. Each page becomes its own chunk; initial JS
// payload is the router + auth util + this file, not every page in the app.
const Login             = lazy(() => import('./pages/Login'));
const Home              = lazy(() => import('./pages/Home'));
const SelectCenter      = lazy(() => import('./pages/SelectCenter'));
const Booking           = lazy(() => import('./pages/Booking'));
const Review            = lazy(() => import('./pages/Review'));
const Orders            = lazy(() => import('./pages/Orders'));
const OrderDetail       = lazy(() => import('./pages/OrderDetail'));
const TermsConditions   = lazy(() => import('./pages/TermsConditions'));
const MembershipPlans   = lazy(() => import('./pages/MembershipPlans'));
const MembershipDetail  = lazy(() => import('./pages/MembershipDetail'));
const Profile           = lazy(() => import('./pages/Profile'));
const ReferralDetails   = lazy(() => import('./pages/ReferralDetails'));
const RewardsCalculation = lazy(() => import('./pages/RewardsCalculation'));
const Offers            = lazy(() => import('./pages/Offers'));
const OfferDetail       = lazy(() => import('./pages/OfferDetail'));
const Chatbot           = lazy(() => import('./pages/Chatbot'));
const MySubscriptions   = lazy(() => import('./pages/MySubscriptions'));
const AboutUs           = lazy(() => import('./pages/AboutUs'));
const RefundPolicy      = lazy(() => import('./pages/RefundPolicy'));
const PrivacyPolicy     = lazy(() => import('./pages/PrivacyPolicy'));
const PaymentMethods    = lazy(() => import('./pages/PaymentMethods'));

function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!hasValidAuthSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

const RouteFallback = () => (
  <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ fontSize: '14px', color: '#888' }}>Loading…</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Home />} />
              <Route path="/select-center" element={<SelectCenter />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/review" element={<Review />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order-detail/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/membership-plans" element={<ProtectedRoute><MembershipPlans /></ProtectedRoute>} />
              <Route path="/membership-detail" element={<ProtectedRoute><MembershipDetail /></ProtectedRoute>} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/referral-details" element={<ProtectedRoute><ReferralDetails /></ProtectedRoute>} />
              <Route path="/rewards-calculation" element={<ProtectedRoute><RewardsCalculation /></ProtectedRoute>} />
              <Route path="/offers" element={<Offers />} />
              <Route path="/offer-detail" element={<OfferDetail />} />
              <Route path="/chatbot" element={<ProtectedRoute><Chatbot /></ProtectedRoute>} />
              <Route path="/my-subscriptions" element={<MySubscriptions />} />
              <Route path="/memberships/deal-price-bookings" element={<ProtectedRoute><MySubscriptions /></ProtectedRoute>} />
              <Route path="/paymentmethods" element={<ProtectedRoute><PaymentMethods /></ProtectedRoute>} />
              <Route path="/aspcare/About us" element={<AboutUs />} />
              <Route path="/aspcare/refundpolicy" element={<RefundPolicy />} />
              <Route path="/aspcare/privacypolicy" element={<PrivacyPolicy />} />
            </Routes>
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
