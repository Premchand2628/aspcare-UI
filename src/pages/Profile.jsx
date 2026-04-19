import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { clearAuthSession, getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { resetTransactionId } from '../utils/transactionTracking';
import '../styles/Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const [showPolicyPopup, setShowPolicyPopup] = useState(false);
  const [totalDrops, setTotalDrops] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState(() => {
    return localStorage.getItem('userFirstName') || 'User';
  });
  const [profileData, setProfileData] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerifiedFor, setEmailOtpVerifiedFor] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtpInfo, setEmailOtpInfo] = useState('');
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    carNumber: '',
    carAddressDefaultFlag: false
  });

  const isLoggedIn = Boolean(getValidatedAuthToken());

  // Drops calculation mapping
  const dropsMap = {
    'Foam-water': 50,
    'Basic-water': 30,
    'Premium-water': 300,
    'Foam-no-thanks': 40,
    'Basic-no-thanks': 20,
    'Premium-no-thanks': 200,
    'Foam-self-drive': 70,
    'Basic-self-drive': 40,
    'Premium-self-drive': 350
  };

  useEffect(() => {
    fetchAndCalculateDrops();
    fetchUserProfile();
  }, []);

  const mapProfileData = (data) => {
    const resolvedFirstName = data?.firstName || data?.first_name || '';
    const resolvedLastName = data?.lastName || data?.last_name || '';
    const resolvedEmail = data?.email || '';
    const resolvedPhone = data?.phone || data?.mobileNumber || data?.mobile_number || '';
    const resolvedAddress = data?.address || '';
    const resolvedCarNumber = data?.carNumber || data?.car_number || '';
    const resolvedDefaultFlag = String(
      data?.carAddressDefaultFlag || data?.car_address_default_flag || 'N'
    ).toUpperCase() === 'Y';

    return {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: resolvedEmail,
      password: '',
      phone: resolvedPhone,
      address: resolvedAddress,
      carNumber: resolvedCarNumber,
      carAddressDefaultFlag: resolvedDefaultFlag
    };
  };

  const fetchUserProfile = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) return;

      const headers = withAuthHeader({
        Accept: 'application/json'
      });

      const response = await fetch('/users/profile', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        // Fallback: populate from localStorage for OAuth users
        const fallback = {
          firstName: localStorage.getItem('userFirstName') || '',
          lastName: localStorage.getItem('userLastName') || '',
          email: localStorage.getItem('userEmail') || '',
          password: '',
          phone: localStorage.getItem('userPhone') || '',
          address: '',
          carNumber: '',
          carAddressDefaultFlag: false
        };
        setProfileForm(fallback);
        return;
      }

      const data = await response.json();
      const mappedProfile = mapProfileData(data || {});
      setProfileData(data || {});
      setProfileForm(mappedProfile);

      if (mappedProfile.firstName) {
        setFirstName(mappedProfile.firstName);
        localStorage.setItem('userFirstName', mappedProfile.firstName);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const openEditProfile = () => {
    setProfileError('');
    setProfileSuccess('');
    setEmailOtp('');
    setEmailOtpSent(false);
    setEmailOtpVerifiedFor('');
    setEmailOtpInfo('');
    const source = profileData || {};
    setProfileForm(mapProfileData(source));
    setShowEditProfile(true);
  };

  const closeEditProfile = () => {
    setShowEditProfile(false);
    setProfileError('');
    setProfileSuccess('');
    setEmailOtp('');
    setEmailOtpSent(false);
    setEmailOtpVerifiedFor('');
    setEmailOtpInfo('');
  };

  const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

  const isEmailChangedInForm = () => {
    const currentEmail = normalizeEmail(profileData?.email || profileData?.mailId || profileData?.mail_id);
    const nextEmail = normalizeEmail(profileForm.email);
    return !!nextEmail && nextEmail !== currentEmail;
  };

  const isUpdatedEmailVerified = () => {
    const nextEmail = normalizeEmail(profileForm.email);
    return !!nextEmail && isEmailChangedInForm() && emailOtpVerifiedFor === nextEmail;
  };

  const sendUpdatedEmailOtp = async () => {
    const nextEmail = normalizeEmail(profileForm.email);
    if (!nextEmail) {
      setProfileError('Please enter updated mail id before requesting OTP.');
      return false;
    }

    setSendingEmailOtp(true);
    setProfileError('');
    setProfileSuccess('');
    setEmailOtpInfo('');

    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        clearAuthSession();
        navigate('/login');
        return false;
      }

      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const response = await fetch('/users/profile/email/send-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: nextEmail })
      });

      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        clearAuthSession();
        navigate('/login');
        return false;
      }
      if (!response.ok) {
        setProfileError(body?.message || 'Unable to send OTP for updated email.');
        return false;
      }

      setEmailOtpSent(true);
      setEmailOtpVerifiedFor('');
      setEmailOtp('');
      setEmailOtpInfo(body?.message || 'OTP sent to updated email.');
      return true;
    } catch (error) {
      console.error('Error sending profile email OTP:', error);
      setProfileError('Unable to send OTP for updated email. Please try again.');
      return false;
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const verifyUpdatedEmailOtp = async () => {
    const nextEmail = normalizeEmail(profileForm.email);
    const otpValue = String(emailOtp || '').trim();

    if (!nextEmail) {
      setProfileError('Please enter updated mail id.');
      return false;
    }
    if (!otpValue) {
      setProfileError('Please enter OTP sent to updated email.');
      return false;
    }

    setVerifyingEmailOtp(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        clearAuthSession();
        navigate('/login');
        return false;
      }

      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const response = await fetch('/users/profile/email/verify-otp', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: nextEmail, otp: otpValue })
      });

      const body = await response.json().catch(() => ({}));
      if (response.status === 401 || response.status === 403) {
        clearAuthSession();
        navigate('/login');
        return false;
      }
      if (!response.ok) {
        setProfileError(body?.message || 'Invalid OTP. Please try again.');
        return false;
      }

      setEmailOtpVerifiedFor(nextEmail);
      setEmailOtpInfo('Updated email verified successfully.');
      setProfileSuccess('Email verified. You can now save profile.');
      return true;
    } catch (error) {
      console.error('Error verifying profile email OTP:', error);
      setProfileError('Unable to verify OTP. Please try again.');
      return false;
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  const handleProfileInputChange = (field, value) => {
    if (field === 'email') {
      const nextEmail = normalizeEmail(value);
      if (emailOtpVerifiedFor && nextEmail !== emailOtpVerifiedFor) {
        setEmailOtpVerifiedFor('');
      }
      setEmailOtpSent(false);
      setEmailOtp('');
      setEmailOtpInfo('');
    }
    setProfileForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    const resolvedFirstName = profileForm.firstName.trim();
    const resolvedLastName = profileForm.lastName.trim();
    const resolvedEmail = normalizeEmail(profileForm.email);
    const resolvedAddress = profileForm.address.trim();
    const resolvedCarNumber = profileForm.carNumber.trim();

    if (!resolvedFirstName || !resolvedLastName || !resolvedEmail) {
      setProfileError('First name, last name and mail id are required.');
      return;
    }

    const emailChanged = isEmailChangedInForm();
    if (emailChanged && emailOtpVerifiedFor !== resolvedEmail) {
      if (!emailOtpSent) {
        await sendUpdatedEmailOtp();
        setProfileError('Please verify OTP sent to updated email, then click Save again.');
      } else {
        setProfileError('Please verify OTP for updated email before saving profile.');
      }
      return;
    }

    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        clearAuthSession();
        navigate('/login');
        return;
      }

      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const defaultFlag = profileForm.carAddressDefaultFlag ? 'Y' : 'N';
      const payload = {
        firstName: resolvedFirstName,
        first_name: resolvedFirstName,
        lastName: resolvedLastName,
        last_name: resolvedLastName,
        email: resolvedEmail,
        address: resolvedAddress,
        carNumber: resolvedCarNumber,
        car_number: resolvedCarNumber,
        carAddressDefaultFlag: defaultFlag,
        car_address_default_flag: defaultFlag,
        phone: profileForm.phone
      };

      const passwordValue = profileForm.password.trim();
      if (passwordValue) {
        payload.password = passwordValue;
        payload.confirmPassword = passwordValue;
        payload.confirm_password = passwordValue;
      }

      const updateResponse = await fetch('/users/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      if (!updateResponse) {
        setProfileError('Profile update endpoint not available. Please check backend API route.');
        return;
      }

      if (updateResponse.status === 401 || updateResponse.status === 403) {
        clearAuthSession();
        navigate('/login');
        return;
      }

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.json().catch(() => null);
        setProfileError(errorBody?.message || 'Failed to save profile details.');
        return;
      }

      setFirstName(resolvedFirstName);
      localStorage.setItem('userFirstName', resolvedFirstName);

      const nextProfileData = {
        ...profileData,
        ...payload
      };
      setProfileData(nextProfileData);
      setProfileForm((prev) => ({
        ...prev,
        password: ''
      }));
      setProfileSuccess('Profile details saved successfully.');

      setTimeout(() => {
        setShowEditProfile(false);
      }, 700);
    } catch (error) {
      console.error('Error saving profile:', error);
      setProfileError('Unable to save profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchAndCalculateDrops = async () => {
    try {
      const authToken = getValidatedAuthToken();
      if (!authToken) {
        setLoading(false);
        return;
      }
      
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch('/bookings/me', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        const total = data.reduce((sum, order) => sum + calculateDrops(order), 0);
        setTotalDrops(total);
      }
    } catch (error) {
      console.error('Error fetching drops:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDrops = (order) => {
    // If order is cancelled, return negative drops
    if (order.status && order.status.toLowerCase() === 'cancelled') {
      const baseDrops = getBaseDrops(order);
      return -baseDrops;
    }
    return getBaseDrops(order);
  };

  const getBaseDrops = (order) => {
    const washType = order.washType || order.serviceType || order.carWashType || order.packageType || '';
    const waterOption = order.waterOption || order.water || 'no-thanks';
    
    // Normalize wash type to match keys
    const normalizedWash = String(washType).trim().toUpperCase();
    const normalizedWater = String(waterOption).trim().toLowerCase();
    
    // Normalize water option
    let waterKey = normalizedWater;
    if (waterKey === 'yes' || waterKey === 'true' || waterKey === 'water') waterKey = 'water';
    if (waterKey === 'no' || waterKey === 'false' || waterKey === 'no-thanks') waterKey = 'no-thanks';
    if (waterKey === 'self-drive' || waterKey === 'selfdrive') waterKey = 'self-drive';

    // Normalize wash type
    let washKey = 'Foam'; // default
    if (normalizedWash.includes('FOAM')) washKey = 'Foam';
    else if (normalizedWash.includes('BASIC')) washKey = 'Basic';
    else if (normalizedWash.includes('PREMIUM')) washKey = 'Premium';

    const key = `${washKey}-${waterKey}`;
    return dropsMap[key] || 0;
  };

  const handleLogout = () => {
    // Clear all session data
    clearAuthSession();
    resetTransactionId();
    localStorage.removeItem('phoneNumber');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    // Navigate to login page
    navigate('/login');
  };

  const accountMenu = [
    { id: 1, icon: '➕', label: 'My Subscriptions', path: '/my-subscriptions' },
    { id: 2, icon: '💳', label: 'Payment Methods', path: '/paymentmethods' },
    { id: 3, icon: '🎁', label: 'Referrals', path: '/referral-details' }
  ];

  const generalMenu = [
    { id: 1, icon: '🎧', label: 'Help Center', path: '/chatbot' },
    { id: 2, icon: '🛡️', label: 'Privacy Policy & Terms of Service', action: 'policy-popup' },
    { id: 3, icon: '🚪', label: 'Logout', action: 'logout' }
  ];

  const handleGeneralMenuClick = (item) => {
    if (item.action === 'logout') {
      handleLogout();
      return;
    }
    if (item.action === 'policy-popup') {
      setShowPolicyPopup(true);
      return;
    }
    navigate(item.path || '#');
  };

  const saveBlockedByEmailOtp = isEmailChangedInForm() && !isUpdatedEmailVerified();
  const saveBlockedMessage = 'Verify updated email via OTP to enable Save';

  if (!isLoggedIn) {
    return (
      <div className="page-container">
        <div className="profile-login-prompt" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👤</div>
          <h2 style={{ margin: '0 0 8px', color: '#1b1f33' }}>Please login to view your details</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Sign in or sign up to manage your profile</p>
          <button
            onClick={() => navigate('/login', { state: { from: { pathname: '/profile' } } })}
            style={{ background: 'linear-gradient(135deg, #4361ee, #7209b7)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 40px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}
          >Login / Signup</button>
        </div>
        <BottomNav active="profile" />
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* User Info Card */}
      <div className="user-card">
        <div className="user-name">
          <h2>{firstName}</h2>
          <button className="edit-btn" onClick={openEditProfile}>Edit ✏️</button>
        </div>
        <div 
          className="drops-earned"
          onClick={() => navigate('/rewards-calculation')}
          style={{ cursor: 'pointer' }}
        >
          <span className="drops-icon">💧</span>
          <span className="drops-label">Drops Earned</span>
          <span className="drops-count">{loading ? 'Loading...' : totalDrops}</span>
        </div>
      </div>

      {/* Rewards Section */}
      <div className="rewards-section">
        <h3>Rewards & Orders</h3>
        <div className="rewards-icons">
          <div className="reward-icon" onClick={() => navigate('/rewards-calculation')} style={{ cursor: 'pointer' }}>
            <img src="/images/trophy.png" alt="Trophy" />
          </div>
          <div className="reward-icon" onClick={() => navigate('/orders')} style={{ cursor: 'pointer' }}>
            <img src="/images/orders.png" alt="Orders" />
          </div>
        </div>
      </div>

      {/* Account Section */}
      <div className="menu-section">
        <h3>Account</h3>
        {accountMenu.map(item => (
          <div 
            key={item.id} 
            className="menu-item"
            onClick={() => navigate(item.path)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-arrow">→</span>
          </div>
        ))}
      </div>

      {/* General Section */}
      <div className="menu-section">
        <h3>General</h3>
        {generalMenu.map(item => (
          <div 
            key={item.id} 
            className="menu-item"
            onClick={() => handleGeneralMenuClick(item)}
          >
            <span className="menu-icon">{item.icon}</span>
            <span className="menu-label">{item.label}</span>
            <span className="menu-arrow">→</span>
          </div>
        ))}
      </div>

      {showPolicyPopup && (
        <div className="policy-overlay" onClick={() => setShowPolicyPopup(false)}>
          <div className="policy-popup" onClick={(e) => e.stopPropagation()}>
            <div className="policy-popup-head">
              <h3>Policies</h3>
              <button
                type="button"
                className="policy-close-btn"
                onClick={() => setShowPolicyPopup(false)}
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              className="policy-popup-btn"
              onClick={() => {
                setShowPolicyPopup(false);
                navigate('/aspcare/About us');
              }}
            >
              About us
            </button>
            <button
              type="button"
              className="policy-popup-btn"
              onClick={() => {
                setShowPolicyPopup(false);
                navigate('/aspcare/refundpolicy');
              }}
            >
              Refund policy
            </button>
            <button
              type="button"
              className="policy-popup-btn"
              onClick={() => {
                setShowPolicyPopup(false);
                navigate('/aspcare/privacypolicy');
              }}
            >
              Privacy policy
            </button>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="profile-edit-overlay" onClick={closeEditProfile}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-edit-avatar-wrap">
              <img src="/images/user-avatar.png" alt="User" className="profile-edit-avatar" />
            </div>

            <div className="profile-edit-form">
              <label className="profile-edit-row">
                <span>First name:</span>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => handleProfileInputChange('firstName', e.target.value)}
                />
              </label>

              <label className="profile-edit-row">
                <span>Last name:</span>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => handleProfileInputChange('lastName', e.target.value)}
                />
              </label>

              <label className="profile-edit-row">
                <span className="profile-email-label">
                  Mail Id:
                  {isUpdatedEmailVerified() && <em className="profile-email-verified-badge">Verified</em>}
                </span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleProfileInputChange('email', e.target.value)}
                />
              </label>

              {isEmailChangedInForm() && (
                <div className="profile-email-otp-box">
                  <div className="profile-email-otp-row">
                    <input
                      type="text"
                      value={emailOtp}
                      onChange={(e) => setEmailOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="profile-email-otp-input"
                    />
                    <button
                      type="button"
                      className="profile-email-otp-btn"
                      onClick={sendUpdatedEmailOtp}
                      disabled={sendingEmailOtp}
                    >
                      {sendingEmailOtp ? 'Sending...' : 'Send OTP'}
                    </button>
                    <button
                      type="button"
                      className="profile-email-otp-btn verify"
                      onClick={verifyUpdatedEmailOtp}
                      disabled={verifyingEmailOtp || !emailOtpSent}
                    >
                      {verifyingEmailOtp ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </div>
                  {emailOtpInfo && <p className="profile-email-otp-info">{emailOtpInfo}</p>}
                </div>
              )}

              <label className="profile-edit-row">
                <span>Password:</span>
                <input
                  type="password"
                  value={profileForm.password}
                  onChange={(e) => handleProfileInputChange('password', e.target.value)}
                  placeholder="Leave blank to keep existing"
                />
              </label>

              <label className="profile-edit-row">
                <span>Phone:</span>
                <input
                  type="text"
                  value={profileForm.phone}
                  readOnly
                />
              </label>

              <label className="profile-edit-row">
                <span>Address:</span>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => handleProfileInputChange('address', e.target.value)}
                />
              </label>

              <label className="profile-edit-row">
                <span>Car Number:</span>
                <input
                  type="text"
                  value={profileForm.carNumber}
                  onChange={(e) => handleProfileInputChange('carNumber', e.target.value)}
                />
              </label>

              <label className="profile-default-check">
                <input
                  type="checkbox"
                  checked={profileForm.carAddressDefaultFlag}
                  onChange={(e) => handleProfileInputChange('carAddressDefaultFlag', e.target.checked)}
                />
                <span>Save car & Address details as default</span>
              </label>

              {profileError && <p className="profile-edit-error">{profileError}</p>}
              {profileSuccess && <p className="profile-edit-success">{profileSuccess}</p>}
              {saveBlockedByEmailOtp && <p className="profile-edit-hint">{saveBlockedMessage}</p>}

              <div className="profile-edit-actions">
                <button type="button" className="profile-cancel-btn" onClick={closeEditProfile}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="profile-save-btn"
                  onClick={handleSaveProfile}
                  disabled={savingProfile || saveBlockedByEmailOtp}
                  title={saveBlockedByEmailOtp ? saveBlockedMessage : ''}
                >
                  {savingProfile ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav active="profile" />
    </div>
  );
};

export default Profile;
