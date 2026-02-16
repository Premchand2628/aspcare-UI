import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';

function Login() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/login/send-otp', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber
        })
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setError('');
      } else {
        setError(data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('OTP Send Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Handle login logic
    console.log('Logging in with:', email, password);
    navigate('/');
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError('');

      // Send Google token to your backend for verification
      const response = await fetch('/auth/login/google', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          googleToken: credentialResponse.credential
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.data?.token || data.token || data.jwt || '';
        const phone = data.data?.phone || '';
        const firstName = data.data?.firstName || '';

        if (token) {
          localStorage.setItem('authToken', token);
        }
        if (phone) {
          localStorage.setItem('userPhone', phone);
        }
        if (firstName) {
          localStorage.setItem('userFirstName', firstName);
        }

        console.log('Google login successful');
        navigate('/');
      } else {
        setError(data.message || 'Google login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error with Google login. Please try again.');
      console.error('Google Login Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google login failed. Please try again.');
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/verify-otp', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          mobileNumber: mobileNumber,
          otp: otp
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.data || data.token || data.jwt || '';
        if (token) {
          localStorage.setItem('authToken', token);
        }
        localStorage.setItem('userPhone', mobileNumber);
        navigate('/');
      } else {
        setError(data.message || 'OTP verification failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('OTP Verification Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="app-logo">
            <div className="logo-circle">ASP</div>
            <div>
              <h2 className="app-title">Car Care</h2>
              <p className="app-subtitle">Book washes, track visits, manage refunds.</p>
            </div>
          </div>
        </div>

        <h1 className="welcome-title">Welcome back</h1>
        <p className="login-description">
          Login using OTP (Phone) or Email + Password. Signup creates your account using OTP.
        </p>

        {/* Auth Mode Toggle - Only show when in signup mode */}
        {authMode === 'signup' && (
          <div className="auth-mode-toggle">
            <button
              className={`toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={`toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => setAuthMode('signup')}
            >
              Signup
            </button>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <>
            {/* Google Login Button */}
            <div className="google-login-section">
              <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outlined"
                  size="large"
                  width="100%"
                  text="signin"
                />
              </GoogleOAuthProvider>
              <div className="divider">
                <span>OR</span>
              </div>
            </div>

            {/* Login Method Toggle */}
            <div className="login-method-toggle">
              <button
                className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
                onClick={() => setLoginMethod('phone')}
              >
                Phone OTP
              </button>
              <button
                className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
                onClick={() => setLoginMethod('email')}
              >
                Email Login
              </button>
            </div>

            {/* Phone OTP Login */}
            {loginMethod === 'phone' && (
              <div className="form-section">
                <label className="form-label">Mobile number</label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="Enter registered mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  maxLength={10}
                  disabled={otpSent}
                />
                <p className="input-hint">Enter 10 digits (no spaces).</p>

                {otpSent && (
                  <>
                    <label className="form-label">Enter OTP</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter 6-digit OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      maxLength={6}
                    />
                  </>
                )}

                {error && <p className="error-message">{error}</p>}

                <button 
                  className="primary-btn" 
                  onClick={handleSendOTP}
                  disabled={loading || otpSent}
                >
                  {loading ? 'Sending...' : otpSent ? 'OTP Sent ✓' : 'Send OTP'}
                </button>

                {otpSent && (
                  <button 
                    className="primary-btn secondary-btn" 
                    onClick={handleVerifyOTP}
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                )}

                <p className="bottom-link">
                  New here? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('signup'); }}>Create an account</a>
                </p>
              </div>
            )}

            {/* Email Login */}
            {loginMethod === 'email' && (
              <div className="form-section">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <label className="form-label">Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="show-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>

                <a href="#" className="forgot-password-link">Forgot password?</a>

                <button className="primary-btn" onClick={handleLogin}>
                  Login
                </button>

                <p className="bottom-link">
                  New here? <a href="#" onClick={(e) => { e.preventDefault(); setAuthMode('signup'); }}>Create an account</a>
                </p>
              </div>
            )}
          </>
        )}

        {/* Signup Form */}
        {authMode === 'signup' && (
          <div className="form-section">
            <label className="form-label">First name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <label className="form-label">Last name</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <label className="form-label">Age</label>
            <input
              type="number"
              className="form-input"
              placeholder="Age"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />

            <label className="form-label">Mobile number</label>
            <input
              type="tel"
              className="form-input"
              placeholder="Phone number to receive OTP"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              maxLength={10}
            />

            <label className="form-label">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="show-password-btn"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="input-hint">Minimum 6 characters.</p>

            <button className="primary-btn" onClick={handleSendOTP}>
              Send OTP
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
