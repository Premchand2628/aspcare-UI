import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../styles/Login.css';

function Login() {
  const OTP_RESEND_SECONDS = 30;
  // OTP rate-limit bypass was removed (security: leaked a QA short-circuit into the prod bundle).
  // All rate limiting is now enforced server-side only.
  const navigate = useNavigate();
  const location = useLocation();
  const [authMode, setAuthMode] = useState(() => {
    const mode = location.state?.mode;
    return mode === 'signup' ? 'signup' : 'login';
  });
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [showPassword, setShowPassword] = useState(false);
  
  // Form states
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpCooldownSeconds, setOtpCooldownSeconds] = useState(0);
  const [showForgotPasswordPopup, setShowForgotPasswordPopup] = useState(false);
  const [forgotStep, setForgotStep] = useState('email'); // email | otp | reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [showActionDivider, setShowActionDivider] = useState(false);

  // Initialize Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
    };

    // If SDK already loaded, init immediately
    if (window.FB) {
      window.FB.init({
        appId: import.meta.env.VITE_FACEBOOK_APP_ID,
        cookie: true,
        xfbml: false,
        version: 'v19.0',
      });
    }
  }, []);

  useEffect(() => {
    if (otpCooldownSeconds <= 0) return undefined;

    const intervalId = setInterval(() => {
      setOtpCooldownSeconds((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [otpCooldownSeconds]);

  const getRetryAfterSeconds = (response, fallbackSeconds = 600) => {
    const retryAfterHeader = response?.headers?.get('Retry-After');
    const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0) {
      return Math.ceil(retryAfterSeconds);
    }

    return fallbackSeconds;
  };

  const getRetryMessage = (response, fallbackMinutes = 10) => {
    const retryAfterSeconds = getRetryAfterSeconds(response, fallbackMinutes * 60);

    if (retryAfterSeconds > 0) {
      const minutes = Math.ceil(retryAfterSeconds / 60);
      return `Too many requests. Please try again after ${minutes} minute${minutes === 1 ? '' : 's'}.`;
    }

    return `Too many requests. Please try again after ${fallbackMinutes} minutes.`;
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const handleSendOTP = async () => {
    if (!mobileNumber || mobileNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    if (authMode === 'signup') {
      if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
        setError('Please fill all required signup fields');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const otpSendEndpoint = authMode === 'signup' ? '/auth/signup/send-otp' : '/auth/login/send-otp';
      const otpPayload = authMode === 'signup'
        ? {
            firstName: firstName.trim(),
            first_name: firstName.trim(),
            lastName: lastName.trim(),
            last_name: lastName.trim(),
            email: email.trim(),
            mobileNumber: mobileNumber.trim(),
            mobile_number: mobileNumber.trim(),
            phone: mobileNumber.trim(),
            phoneNumber: mobileNumber.trim(),
            password,
            confirmPassword: password,
            confirm_password: password,
          }
        : {
            mobileNumber: mobileNumber.trim(),
          };

      const response = await fetch(otpSendEndpoint, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(otpPayload)
      });

      const data = await response.json();

      if (response.ok) {
        setOtpSent(true);
        setOtp('');
        setOtpCooldownSeconds(OTP_RESEND_SECONDS);
        setError('');
      } else {
        if (response.status === 429) {
          setOtpCooldownSeconds(getRetryAfterSeconds(response, 600));
          setError(getRetryMessage(response, 10));
        } else {
          setError(data.message || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('OTP Send Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPhoneNumber = () => {
    setMobileNumber('');
    setOtp('');
    setOtpSent(false);
    setOtpCooldownSeconds(0);
    setError('');
  };

  const handleResendOtp = async () => {
    if (otpCooldownSeconds > 0 || loading) {
      return;
    }
    await handleSendOTP();
  };

  const handleLogin = async () => {
    if (!email || !email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password || !password.trim()) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/login/email', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const token = data.data?.token || data.token || data.jwt || '';
        const phone = data.data?.phone || '';
        const userEmail = data.data?.email || email.trim();
        const userFirstName = data.data?.firstName || '';

        if (token) {
          localStorage.setItem('authToken', token);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (phone) {
          localStorage.setItem('userPhone', phone);
        }
        if (userEmail) {
          localStorage.setItem('userEmail', userEmail);
        }
        if (userFirstName) {
          localStorage.setItem('userFirstName', userFirstName);
        }

        navigate(location.state?.from?.pathname || '/');
      } else {
        if (response.status === 429) {
          setError(getRetryMessage(response, 5));
        } else {
          setError(data.message || 'Login failed. Please check your credentials.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Email Login Error:', err);
    } finally {
      setLoading(false);
    }
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
        const email = data.data?.email || '';
        const firstName = data.data?.firstName || '';

        if (token) {
          localStorage.setItem('authToken', token);
        }
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        if (email) {
          localStorage.setItem('userEmail', email);
        }
        if (phone) {
          localStorage.setItem('userPhone', phone);
        }
        if (firstName) {
          localStorage.setItem('userFirstName', firstName);
        }

        navigate(location.state?.from?.pathname || '/');
      } else {
        if (response.status === 429) {
          setError(getRetryMessage(response, 5));
        } else {
          setError(data.message || 'Google login failed. Please try again.');
        }
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

  const handleAppleLogin = () => {
    setError('Apple sign-in is coming soon.');
  };

  const handleIdentifierChange = (val) => {
    setError('');
    if (val === '') {
      setMobileNumber('');
      setEmail('');
      return;
    }
    if (/\D/.test(val)) {
      // Contains non-digit → treat as email
      setEmail(val);
      setMobileNumber('');
    } else {
      // All digits → treat as phone
      setMobileNumber(val.slice(0, 10));
      setEmail('');
    }
  };

  const handleFacebookLogin = () => {
    if (!window.FB) {
      setError('Facebook SDK not loaded. Please refresh and try again.');
      return;
    }

    setLoading(true);
    setError('');

    window.FB.login(
      (loginResponse) => {
        if (loginResponse.authResponse) {
          const { accessToken } = loginResponse.authResponse;

          fetch('/auth/login/facebook', {
            method: 'POST',
            mode: 'cors',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ facebookToken: accessToken }),
          })
            .then((res) => res.json().then((data) => ({ ok: res.ok, status: res.status, data })))
            .then(({ ok, status, data }) => {
              if (ok && data.success) {
                const token = data.data?.token || data.token || data.jwt || '';
                const phone = data.data?.phone || '';
                const email = data.data?.email || '';
                const firstName = data.data?.firstName || '';

                if (token) localStorage.setItem('authToken', token);
                if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
                if (email) localStorage.setItem('userEmail', email);
                if (phone) localStorage.setItem('userPhone', phone);
                if (firstName) localStorage.setItem('userFirstName', firstName);

                navigate(location.state?.from?.pathname || '/');
              } else {
                if (status === 429) {
                  setError('Too many requests. Please try again later.');
                } else {
                  setError(data.message || 'Facebook login failed. Please try again.');
                }
              }
            })
            .catch((err) => {
              setError('Network error with Facebook login. Please try again.');
              console.error('Facebook Login Error:', err);
            })
            .finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      },
      { scope: 'email,public_profile' }
    );
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
        const token =
          data.data?.token ||
          data.token ||
          data.jwt ||
          (typeof data.data === 'string' ? data.data : '') ||
          '';
        if (token) {
          localStorage.setItem('authToken', token);
        }
        const refreshToken = data.refreshToken || '';
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }

        if (authMode === 'signup') {
          const signupHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          };

          if (token) {
            signupHeaders.Authorization = `Bearer ${token}`;
          }

          const signupResponse = await fetch('/users/signup', {
            method: 'POST',
            mode: 'cors',
            headers: signupHeaders,
            body: JSON.stringify({
              firstName: firstName.trim(),
              first_name: firstName.trim(),
              lastName: lastName.trim(),
              last_name: lastName.trim(),
              email: email.trim(),
              phone: mobileNumber.trim(),
              mobileNumber: mobileNumber.trim(),
              mobile_number: mobileNumber.trim(),
              password,
              confirmPassword: password,
              confirm_password: password,
            })
          });

          let signupData = {};
          try {
            signupData = await signupResponse.json();
          } catch {
            signupData = {};
          }

          if (!signupResponse.ok && signupResponse.status !== 409) {
            setError(signupData.message || 'OTP verified but signup completion failed. Please try again.');
            return;
          }

          if (email.trim()) {
            localStorage.setItem('userEmail', email.trim());
          }
          if (firstName.trim()) {
            localStorage.setItem('userFirstName', firstName.trim());
          }
        }

        localStorage.setItem('userPhone', mobileNumber);
        navigate(location.state?.from?.pathname || '/');
      } else {
        if (response.status === 429) {
          setError(getRetryMessage(response, 10));
        } else {
          setError(data.message || 'OTP verification failed. Please try again.');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('OTP Verification Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const openForgotPasswordPopup = (event) => {
    event.preventDefault();
    setForgotEmail(email || '');
    setShowForgotPasswordPopup(true);
    setForgotStep('email');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowForgotNewPassword(false);
    setShowForgotConfirmPassword(false);
    setForgotError('');
    setForgotSuccess('');
  };

  const closeForgotPasswordPopup = () => {
    setShowForgotPasswordPopup(false);
    setForgotStep('email');
    setForgotOtp('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
    setShowForgotNewPassword(false);
    setShowForgotConfirmPassword(false);
    setForgotError('');
    setForgotSuccess('');
    setForgotLoading(false);
  };

  const handleForgotSendOtp = async () => {
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotError('Please enter your email');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch('/auth/password/forgot/send-otp', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setForgotStep('otp');
        setForgotSuccess('OTP sent to your email. Verify within 5 minutes.');
      } else {
        if (response.status === 429) {
          setForgotError(getRetryMessage(response, 10));
        } else {
          setForgotError(data.message || 'Failed to send OTP. Please try again.');
        }
      }
    } catch (err) {
      setForgotError('Network error. Please check your connection and try again.');
      console.error('Forgot Password Send OTP Error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerifyOtp = async () => {
    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter a valid 6-digit OTP');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch('/auth/password/forgot/verify-otp', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          otp: forgotOtp.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setForgotStep('reset');
        setForgotSuccess('OTP verified. Please set your new password.');
      } else {
        if (response.status === 429) {
          setForgotError(getRetryMessage(response, 10));
        } else {
          setForgotError(data.message || 'OTP verification failed.');
        }
      }
    } catch (err) {
      setForgotError('Network error. Please check your connection and try again.');
      console.error('Forgot Password Verify OTP Error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotSavePassword = async () => {
    if (!forgotNewPassword || forgotNewPassword.trim().length < 6) {
      setForgotError('Password must be at least 6 characters');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('New password and confirm password do not match');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const response = await fetch('/auth/password/forgot/reset', {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          newPassword: forgotNewPassword,
          confirmPassword: forgotConfirmPassword,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setForgotSuccess('Password updated successfully. Please login with your new password.');
        setPassword('');
        setTimeout(() => {
          closeForgotPasswordPopup();
        }, 900);
      } else {
        setForgotError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setForgotError('Network error. Please check your connection and try again.');
      console.error('Forgot Password Reset Error:', err);
    } finally {
      setForgotLoading(false);
    }
  };

  const hasValidPhoneNumber = mobileNumber.trim().length === 10;
  const hasEmailAndPassword = email.trim().length > 0 && password.trim().length > 0;
  const hasValidOtp = otp.trim().length === 6;

  return (
    <div className="login-container intro-finished">
      <div className="login-card">
        <div className="login-card-content reveal">
        {/* Header */}
        <div className="login-header">
          <div className="asp-hero-brand" aria-label="ASP Car Care">
            <h1 className="asp-hero-text">ASP</h1>
            <p className="asp-hero-sub">car care</p>
          </div>
          <p className="app-subtitle">Book washes, track visits, manage refunds.</p>
        </div>

        {/* Auth Mode Toggle - Only show when in signup mode */}
        {authMode === 'signup' && (
          <div className="auth-mode-toggle">
            <button
              className={`toggle-btn ${authMode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('login');
                setShowLoginOptions(true);
                setShowActionDivider(true);
              }}
            >
              Login
            </button>
            <button
              className={`toggle-btn ${authMode === 'signup' ? 'active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setShowActionDivider(true);
              }}
            >
              Signup
            </button>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <div className="auth-compact">
            {/* Phone OTP entry view (after OTP sent) */}
            {mobileNumber && otpSent ? (
              <>
                <div className="compact-input-row">
                  <input
                    type="tel"
                    inputMode="numeric"
                    className="compact-input"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    maxLength={6}
                    autoFocus
                  />
                  {hasValidOtp && (
                    <button
                      type="button"
                      className="compact-arrow-btn"
                      onClick={handleVerifyOTP}
                      disabled={loading}
                      aria-label="Verify OTP"
                    >
                      {loading ? '…' : '→'}
                    </button>
                  )}
                </div>
                <div className="compact-edit-row">
                  <span className="compact-edit-phone">{mobileNumber}</span>
                  <button type="button" className="compact-edit-btn" onClick={handleEditPhoneNumber}>
                    Edit?
                  </button>
                  {otpCooldownSeconds > 0 ? (
                    <span className="compact-edit-timer">Resend in {formatCountdown(otpCooldownSeconds)}</span>
                  ) : (
                    <button
                      type="button"
                      className="compact-edit-btn"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >
                      Resend
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Unified Email/Phone input */}
                <div className="compact-input-row">
                  <input
                    type="text"
                    inputMode={mobileNumber ? 'numeric' : 'text'}
                    className="compact-input"
                    placeholder="Email/Phone"
                    value={mobileNumber || email}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    autoComplete="username"
                  />
                  {mobileNumber && hasValidPhoneNumber && !otpSent && (
                    <button
                      type="button"
                      className="compact-pill-btn"
                      onClick={handleSendOTP}
                      disabled={loading || otpCooldownSeconds > 0}
                    >
                      {loading ? '…' : 'OTP'}
                    </button>
                  )}
                </div>

                {/* Password input (email mode) */}
                {email && (
                  <div className="compact-input-row">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="compact-input"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && hasEmailAndPassword && !loading) {
                          handleLogin();
                        }
                      }}
                      autoComplete="current-password"
                    />
                    {hasEmailAndPassword && (
                      <button
                        type="button"
                        className="compact-arrow-btn"
                        onClick={handleLogin}
                        disabled={loading}
                        aria-label="Login"
                      >
                        {loading ? '…' : '→'}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Footer link row */}
            <div className="compact-footer-link">
              {email ? (
                <>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthMode('signup');
                    }}
                  >
                    Signup?
                  </a>
                  <a href="#" onClick={openForgotPasswordPopup}>
                    Forgot password?
                  </a>
                </>
              ) : (
                <span>
                  New account?{' '}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setAuthMode('signup');
                    }}
                  >
                    Register
                  </a>
                </span>
              )}
            </div>

            {error && <p className="error-message compact-error">{error}</p>}

            {/* OR divider */}
            <div className="compact-divider">
              <span>or</span>
            </div>

            {/* Social icons row */}
            <div className="compact-social-row">
              <div className="compact-social-google-wrap" aria-label="Sign in with Google">
                <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    type="icon"
                    shape="circle"
                    theme="outline"
                    size="large"
                  />
                </GoogleOAuthProvider>
              </div>
              <button
                type="button"
                className="compact-social-icon compact-social-fb"
                onClick={handleFacebookLogin}
                disabled={loading}
                aria-label="Sign in with Facebook"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                  <path
                    fill="#1877F2"
                    d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.025 4.388 11.022 10.125 11.927v-8.437H7.078v-3.49h3.047V9.414c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.971H15.83c-1.491 0-1.956.93-1.956 1.886v2.263h3.328l-.532 3.49h-2.796v8.437C19.612 23.095 24 18.098 24 12.073"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="compact-social-icon compact-social-apple"
                onClick={handleAppleLogin}
                aria-label="Sign in with Apple"
              >
                <svg viewBox="0 0 384 512" width="20" height="24" aria-hidden="true">
                  <path
                    fill="#000"
                    d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
                  />
                </svg>
              </button>
            </div>
          </div>
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

            <label className="form-label">Mobile number</label>
            <div className={`phone-input-row ${(otpSent || hasValidPhoneNumber) ? 'has-otp-ready' : ''}`}>
              <input
                type="tel"
                inputMode="numeric"
                className="form-input"
                placeholder={otpSent ? 'Enter 6-digit OTP' : 'Phone number to receive OTP'}
                value={otpSent ? otp : mobileNumber}
                onChange={(e) => { const digits = e.target.value.replace(/\D/g, ''); otpSent ? setOtp(digits) : setMobileNumber(digits); }}
                maxLength={otpSent ? 6 : 10}
              />

              {!otpSent && hasValidPhoneNumber && (
                <button
                  className="inline-otp-btn"
                  onClick={handleSendOTP}
                  disabled={loading || otpCooldownSeconds > 0}
                >
                  {loading ? (
                    <span className="btn-loading-content"><span className="btn-loading-car" aria-hidden="true">🚗</span> Sending...</span>
                  ) : 'Send OTP'}
                </button>
              )}

              {otpSent && (
                <button
                  className="inline-verify-btn"
                  onClick={handleVerifyOTP}
                  disabled={loading || !hasValidOtp}
                >
                  {loading ? (
                    <span className="btn-loading-content"><span className="btn-loading-car" aria-hidden="true">🚗</span> Verifying...</span>
                  ) : 'Verify OTP'}
                </button>
              )}
            </div>

            {otpSent && (
              <div className="otp-meta-row">
                <span className="otp-meta-phone">
                  {mobileNumber}{' '}
                  <button type="button" className="otp-edit-btn" onClick={handleEditPhoneNumber}>edit?</button>
                </span>
                {otpCooldownSeconds > 0 ? (
                  <span className="otp-meta-timer">Resend in {formatCountdown(otpCooldownSeconds)}</span>
                ) : (
                  <button type="button" className="otp-resend-btn" onClick={handleResendOtp} disabled={loading}>
                    Resend OTP
                  </button>
                )}
              </div>
            )}

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

            {otpCooldownSeconds > 0 && (
              <span className="otp-countdown">Retry in {formatCountdown(otpCooldownSeconds)}</span>
            )}

            {error && <p className="error-message">{error}</p>}
          </div>
        )}
        </div>
      </div>

      {showForgotPasswordPopup && (
        <div className="forgot-password-overlay" onClick={closeForgotPasswordPopup}>
          <div className="forgot-password-modal" onClick={(event) => event.stopPropagation()}>
            <h3 className="forgot-password-title">Reset Password</h3>

            {forgotStep === 'email' && (
              <>
                <p className="forgot-password-text">Enter your registered email to receive OTP.</p>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="name@example.com"
                  value={forgotEmail}
                  onChange={(event) => setForgotEmail(event.target.value)}
                />
                <button className="primary-btn" onClick={handleForgotSendOtp} disabled={forgotLoading}>
                  {forgotLoading ? (
                    <span className="btn-loading-content"><span className="btn-loading-car" aria-hidden="true">🚗</span> Sending OTP...</span>
                  ) : 'Send OTP'}
                </button>
              </>
            )}

            {forgotStep === 'otp' && (
              <>
                <p className="forgot-password-text">Enter the OTP sent to your email (valid for 5 minutes).</p>
                <label className="form-label">OTP</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  value={forgotOtp}
                  onChange={(event) => setForgotOtp(event.target.value)}
                />
                <button className="primary-btn" onClick={handleForgotVerifyOtp} disabled={forgotLoading}>
                  {forgotLoading ? (
                    <span className="btn-loading-content"><span className="btn-loading-car" aria-hidden="true">🚗</span> Verifying...</span>
                  ) : 'Verify OTP'}
                </button>
              </>
            )}

            {forgotStep === 'reset' && (
              <>
                <p className="forgot-password-text">Set your new password and confirm it.</p>
                <label className="form-label">New password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showForgotNewPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Enter new password"
                    value={forgotNewPassword}
                    onChange={(event) => setForgotNewPassword(event.target.value)}
                  />
                  <button
                    className="show-password-btn"
                    type="button"
                    onClick={() => setShowForgotNewPassword((value) => !value)}
                  >
                    {showForgotNewPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <label className="form-label">Confirm password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showForgotConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    placeholder="Confirm new password"
                    value={forgotConfirmPassword}
                    onChange={(event) => setForgotConfirmPassword(event.target.value)}
                  />
                  <button
                    className="show-password-btn"
                    type="button"
                    onClick={() => setShowForgotConfirmPassword((value) => !value)}
                  >
                    {showForgotConfirmPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <button className="primary-btn" onClick={handleForgotSavePassword} disabled={forgotLoading}>
                  {forgotLoading ? (
                    <span className="btn-loading-content"><span className="btn-loading-car" aria-hidden="true">🚗</span> Saving...</span>
                  ) : 'Save Password'}
                </button>
              </>
            )}

            {forgotError && <p className="error-message">{forgotError}</p>}
            {forgotSuccess && <p className="success-message">{forgotSuccess}</p>}

            <button className="modal-close-btn" onClick={closeForgotPasswordPopup}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
