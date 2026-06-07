import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import PaymentMethodModal from '../components/PaymentMethodModal';
import { getStoredPhone, toApiServiceType, toApiTimeSlot, toApiWaterProvidedBoolean, toApiWaterProvidedFlag, toUiServiceType } from '../utils/apiMappers';
import { clearAuthSession, getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readDealPricesCache, writeDealPricesCache } from '../utils/dealPricesCache';
import { readSubscriptionsCache, writeSubscriptionsCache, clearSubscriptionsCache } from '../utils/subscriptionsCache';
import '../styles/Review.css';
import BookingSteps from '../components/BookingSteps';

const Review = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [promoCodeApplied, setPromoCodeApplied] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeMessage, setPromoCodeMessage] = useState('');
  const [promoCodeLoading, setPromoCodeLoading] = useState(false);
  const [membershipDiscount, setMembershipDiscount] = useState(0);
  const [membershipDiscountPercent, setMembershipDiscountPercent] = useState(0);
  const [signupBonus, setSignupBonus] = useState(0);
  const [hasExistingBookings, setHasExistingBookings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [phoneStep, setPhoneStep] = useState('enter'); // 'enter' | 'confirm' | 'otp'
  const [phoneIsNew, setPhoneIsNew] = useState(false);
  const [phoneExistingEmail, setPhoneExistingEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  const [bookingSubmitLoading, setBookingSubmitLoading] = useState(false);
  const [bookingSubmitError, setBookingSubmitError] = useState('');
  const [bookingSubmitSuccess, setBookingSubmitSuccess] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSaveDefaultChoice, setShowSaveDefaultChoice] = useState(false);
  const [saveDefaultChoice, setSaveDefaultChoice] = useState('no');
  const [subscriptionSaving, setSubscriptionSaving] = useState(0);
  const [showSubscriptionBanner, setShowSubscriptionBanner] = useState(false);
  const [matchedDealForPopup, setMatchedDealForPopup] = useState(null);
  const [showDealPopup, setShowDealPopup] = useState(false);
  const [dealTermsAccepted, setDealTermsAccepted] = useState(false);
  const [dealPaymentLoading, setDealPaymentLoading] = useState(false);
  const [showDealPaymentModal, setShowDealPaymentModal] = useState(false);
  const [existingSubscription, setExistingSubscription] = useState(null);
  const [useExistingSub, setUseExistingSub] = useState(null); // null = not chosen, 'yes', 'no'
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  // Get data from booking page
  const bookingData = location.state || {
    address: 'KIMS Hospital, Old Bombay Highway, Ward 104 K',
    washType: 'Foam',
    selectedDate: new Date('2026-01-18'),
    selectedTimeSlot: '09:00-10:00',
    vehicleType: 'HATCHBACK',
    vehicleNumber: 'TN01AB1234',
    subTotal: 399,
    currency: 'INR',
    waterOption: 'no-thanks'
  };
  const isSubscriptionRedeemed = Boolean(bookingData.subscriptionRedeemed) || useExistingSub === 'yes';
  const resolvedServiceType = toApiServiceType(bookingData.serviceType || (bookingData.centreName && bookingData.centreName !== 'Home' ? 'SELF_DRIVE' : 'HOME'));
  const rawServiceType = (() => {
    const raw = String(bookingData.rawServiceType || bookingData.serviceType || '').trim().toUpperCase().replace(/\s+/g, '_');
    if (raw === 'SERVICE_CENTRE' || raw === 'SERVICE_CENTER' || raw === 'CENTRE' || raw === 'CENTER') return 'SERVICE_CENTRE';
    if (raw === 'SELFDRIVE' || raw === 'SELF_DRIVE') return 'SELF_DRIVE';
    if (bookingData.serviceCentreId || (bookingData.centreName && String(bookingData.centreName).trim() && String(bookingData.centreName).trim().toLowerCase() !== 'home')) return 'SERVICE_CENTRE';
    return resolvedServiceType;
  })();
  const isHomeService = rawServiceType === 'HOME';

  // Format date for display
  const formatDateForDisplay = (date) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const day = dateObj.toLocaleDateString('en-IN', { day: '2-digit' });
    const month = dateObj.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase();
    const year = dateObj.getFullYear();
    const time = bookingData.selectedTimeSlot;
    const [startTime] = time.split('-');
    const [hours, minutes] = startTime.split(':');
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    const displayHours = parseInt(hours) % 12 || 12;
    return `${day}-${month}-${year}, ${displayHours}:${minutes}${ampm}`;
  };

  const formatDateForApi = (value) => {
    const dateObj = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(dateObj.getTime())) return '';
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check for existing bookings with phone number
  useEffect(() => {
    const checkExistingBookings = async () => {
      try {
        setLoading(true);

        const authToken = getValidatedAuthToken();
        if (!authToken) {
          setHasExistingBookings(false);
          setSignupBonus(20);
          setLoading(false);
          return;
        }

        const phoneNumber = localStorage.getItem('userPhone');
        
        if (!phoneNumber) {
          // If no phone number, show modal to ask for it
          setShowPhoneModal(true);
          return;
        }

        // Check if user has any existing bookings
        const headers = withAuthHeader({ Accept: 'application/json' });
        const response = await fetch('/bookings/me', {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          // If bookings array has length > 0, user has existing bookings
          const existingBookings = Array.isArray(data) ? data.length > 0 : false;
          setHasExistingBookings(existingBookings);
          
          if (!existingBookings) {
            setSignupBonus(20);
          } else {
            // User has existing bookings, no signup bonus
            setSignupBonus(0);
          }
        } else {
          // If API fails, assume new user
          setHasExistingBookings(false);
          setSignupBonus(20);
        }
      } catch (error) {
        console.error('Error checking existing bookings:', error);
        // Default to new user on error
        setHasExistingBookings(false);
        setSignupBonus(20);
      } finally {
        setLoading(false);
      }
    };

    checkExistingBookings();
  }, []);

  // Phone modal: check if phone exists
  const handlePhoneCheck = async () => {
    setPhoneError('');
    const trimmed = phoneInput.trim();
    if (!trimmed || !/^\d{10}$/.test(trimmed)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return;
    }
    setPhoneLoading(true);
    try {
      const res = await fetch('/auth/check-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: trimmed })
      });
      const data = await res.json();
      setPhoneIsNew(!data.exists);
      setPhoneExistingEmail(data.email || '');
      setPhoneStep('confirm');
    } catch {
      setPhoneError('Unable to verify phone. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Phone modal: send OTP
  const handleSendOtp = async () => {
    setOtpError('');
    setPhoneLoading(true);
    try {
      const res = await fetch('/auth/send-otp-generic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phoneInput.trim() })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to send OTP');
      }
      setPhoneStep('otp');
    } catch (err) {
      setOtpError(err.message || 'Failed to send OTP');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Phone modal: verify OTP and save phone
  const handleVerifyOtp = async () => {
    setOtpError('');
    const trimmedOtp = otpInput.trim();
    if (!trimmedOtp) {
      setOtpError('Please enter the OTP');
      return;
    }
    setPhoneLoading(true);
    try {
      const verifyRes = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: phoneInput.trim(), otp: trimmedOtp })
      });
      if (!verifyRes.ok) {
        const data = await verifyRes.json().catch(() => ({}));
        throw new Error(data.message || 'OTP verification failed');
      }

      // Save phone to user profile
      const email = localStorage.getItem('userEmail');
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        Accept: 'application/json'
      });

      const updateRes = await fetch('/users/update-phone', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email, phone: phoneInput.trim() })
      });

      if (!updateRes.ok) {
        const data = await updateRes.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save phone number');
      }

      const updateData = await updateRes.json().catch(() => null);
      if (updateData?.token) {
        localStorage.setItem('authToken', updateData.token);
      }
      localStorage.setItem('userPhone', phoneInput.trim());

      setShowPhoneModal(false);
      setPhoneInput('');

      if (phoneIsNew) {
        setShowCelebration(true);
        setTimeout(() => {
          setShowCelebration(false);
          window.location.reload();
        }, 3000);
      } else {
        window.location.reload();
      }
    } catch (err) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setPhoneLoading(false);
    }
  };

  // Fetch active membership and calculate discount
  useEffect(() => {
    const fetchActiveMembership = async () => {
      try {
        const phone = localStorage.getItem('userPhone');
        if (!phone) {
          setMembershipDiscount(0);
          setMembershipDiscountPercent(0);
          return;
        }

        const authToken = getValidatedAuthToken();
        const headers = withAuthHeader({
          Accept: 'application/json'
        });
        if (!authToken) {
          setMembershipDiscount(0);
          setMembershipDiscountPercent(0);
          return;
        }

        const response = await fetch('/memberships/active/me', {
          method: 'GET',
          headers
        });

        if (response.ok) {
          const data = await response.json();
          const percent = Number(data.discountPercent || 0);
          const subTotal = Number(bookingData.subTotal || 0);
          const discountAmount = Math.max(0, (subTotal * percent) / 100);
          setMembershipDiscountPercent(percent);
          setMembershipDiscount(discountAmount);
        } else {
          setMembershipDiscount(0);
          setMembershipDiscountPercent(0);
        }
      } catch (error) {
        console.error('Error fetching membership:', error);
        setMembershipDiscount(0);
        setMembershipDiscountPercent(0);
      }
    };

    fetchActiveMembership();
  }, [bookingData.subTotal]);

  // Check if user can save by subscribing (deal price vs one-time price)
  useEffect(() => {
    if (isSubscriptionRedeemed) return;

    const checkSubscriptionSavings = async () => {
      try {
        const carType = (bookingData.vehicleType || '').toUpperCase();
        const washType = (bookingData.washType || '').toLowerCase();
        const serviceType = resolvedServiceType;

        // Read deal prices from cache, fallback to API
        let deals = readDealPricesCache();
        if (!Array.isArray(deals) || deals.length === 0) {
          const res = await fetch('/deal-prices', {
            method: 'GET',
            headers: { Accept: 'application/json' },
          });
          if (!res.ok) return;
          const data = await res.json();
          if (!Array.isArray(data) || data.length === 0) return;
          writeDealPricesCache(data);
          deals = data;
        }

        // Find matching deal
        const matchingDeal = deals.find((deal) => {
          const dealCar = (deal.dealCarType || '').toUpperCase();
          const dealWash = (deal.dealWashType || '').toLowerCase();
          const dealService = toApiServiceType(deal.dealServiceType || '');
          return dealCar === carType && dealWash === washType && dealService === serviceType;
        });

        if (!matchingDeal) return;

        const dealPrice = parseFloat(matchingDeal.dealFinalPrice || 0);
        const totalWashes = Number(matchingDeal.dealTotalWashes || 3);
        const oneTimeTotal = (bookingData.subTotal || 0) * totalWashes;
        const savingAmount = Math.round(oneTimeTotal - dealPrice);

        if (savingAmount > 0) {
          // Check if user already has subscription for this combo
          const authToken = getValidatedAuthToken();
          if (authToken) {
            let subs = readSubscriptionsCache();
            if (!subs) {
              const headers = withAuthHeader({ Accept: 'application/json' });
              const subRes = await fetch('/memberships/deal-price-bookings/me', { method: 'GET', headers });
              if (subRes.ok) {
                subs = await subRes.json();
                if (Array.isArray(subs)) writeSubscriptionsCache(subs);
              }
            }
            if (subs) {
              const matchingSub = Array.isArray(subs) && subs.find((s) => {
                const sCar = (s.carType || '').toUpperCase();
                const sWash = (s.washType || '').toLowerCase();
                const sService = toApiServiceType(s.serviceType || '');
                const leftWashes = Number(s.leftWashes ?? 0);
                return sCar === carType && sWash === washType && sService === serviceType && leftWashes > 0;
              });
              if (matchingSub) {
                setExistingSubscription(matchingSub);
                return;
              }
            }
          }

          setSubscriptionSaving(savingAmount);
          setShowSubscriptionBanner(true);
          setMatchedDealForPopup({
            id: matchingDeal.id,
            serviceType: toUiServiceType(matchingDeal.dealServiceType),
            washType: matchingDeal.dealWashType,
            carType: matchingDeal.dealCarType,
            waterProviding: String(matchingDeal.dealWaterProviding || 'N').toUpperCase() === 'Y' ? 'Y' : 'N',
            originalPrice: parseFloat(matchingDeal.dealActualPrice),
            discountedPrice: parseFloat(matchingDeal.dealFinalPrice),
            totalWashes: Number(matchingDeal.dealTotalWashes || 3),
          });
        }
      } catch (err) {
        console.error('Subscription savings check error:', err);
      }
    };

    checkSubscriptionSavings();
  }, [bookingData.vehicleType, bookingData.washType, resolvedServiceType, isSubscriptionRedeemed]);

  // Handle promo code validation
  const handleApplyPromoCode = async () => {
    if (isSubscriptionRedeemed) {
      return;
    }

    if (!promoCodeInput.trim()) {
      setPromoCodeMessage('Please enter a promo code');
      return;
    }

    setPromoCodeLoading(true);
    setPromoCodeMessage('');

    try {
      const phone = localStorage.getItem('userPhone');
      const headers = withAuthHeader({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      });

      const response = await fetch('/coupons/validate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          couponCode: promoCodeInput.trim().toUpperCase(),
          userPhone: phone,
          orderAmount: bookingData.subTotal
        })
      });

      const data = await response.json();

      if (data.valid) {
        setPromoDiscount(Number(data.discountAmount) || 0);
        setPromoCodeApplied(true);
        setPromoCodeMessage('âœ“ Coupon applied successfully!');
      } else {
        setPromoCodeMessage(data.message || 'Invalid promo code');
        setPromoCodeApplied(false);
        setPromoDiscount(0);
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeMessage('Failed to validate promo code');
      setPromoCodeApplied(false);
    } finally {
      setPromoCodeLoading(false);
    }
  };

  // Handle promo code removal
  const handleRemovePromoCode = () => {
    setPromoCodeInput('');
    setPromoDiscount(0);
    setPromoCodeApplied(false);
    setPromoCodeMessage('');
  };

  useEffect(() => {
    if (!isSubscriptionRedeemed) return;
    setPromoCodeInput('');
    setPromoDiscount(0);
    setPromoCodeApplied(false);
    setPromoCodeMessage('');
  }, [isSubscriptionRedeemed]);

  useEffect(() => {
    if (!isHomeService) {
      setShowSaveDefaultChoice(false);
      setSaveDefaultChoice('no');
      return;
    }

    let cancelled = false;

    const normalizeDefaultFlag = (value) => {
      const flag = String(value ?? '').trim().toUpperCase();
      return flag === 'Y' || flag === 'YES' || flag === 'TRUE' || flag === '1';
    };

    const fetchProfileDefaultFlag = async () => {
      try {
        const headers = withAuthHeader({
          Accept: 'application/json'
        });

        const response = await fetch('/users/profile', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          if (!cancelled) {
            setShowSaveDefaultChoice(false);
          }
          return;
        }

        const data = await response.json();
        const payload = data && typeof data === 'object' && data.data && typeof data.data === 'object'
          ? data.data
          : data;

        const rawFlag = payload?.carAddressDefaultFlag
          ?? payload?.car_address_default_flag
          ?? payload?.car__address_default_flag
          ?? 'N';

        if (!cancelled) {
          const isDefaultSaved = normalizeDefaultFlag(rawFlag);
          setShowSaveDefaultChoice(!isDefaultSaved);
          setSaveDefaultChoice('no');
        }
      } catch (error) {
        console.error('Error fetching profile default flag:', error);
        if (!cancelled) {
          setShowSaveDefaultChoice(false);
        }
      }
    };

    fetchProfileDefaultFlag();

    return () => {
      cancelled = true;
    };
  }, [isHomeService]);

  // Calculate grand total
  const effectivePromoDiscount = isSubscriptionRedeemed ? 0 : promoDiscount;
  const grandTotal = (bookingData.subTotal || 0) - membershipDiscount - signupBonus - effectivePromoDiscount;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: bookingData.currency || 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate savings
  const savings = (bookingData.subTotal || 0) - Math.max(0, grandTotal);

  const saveBookingToBackend = async () => {
    const headers = withAuthHeader({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    const fallbackServiceType = bookingData.centreName && bookingData.centreName !== 'Home'
      ? 'SELF_DRIVE'
      : 'HOME';
    const resolvedServiceCentreId = bookingData.serviceCentreId ?? bookingData.selectedCentre?.id ?? bookingData.selectedCentre?.serviceCentreId ?? null;

    const payload = {
      phone: getStoredPhone(),
      carType: bookingData.vehicleType,
      serviceType: toApiServiceType(bookingData.serviceType || fallbackServiceType),
      washType: bookingData.washType,
      date: formatDateForApi(bookingData.selectedDate),
      timeslot: toApiTimeSlot(bookingData.selectedTimeSlot),
      serviceCentreId: resolvedServiceCentreId,
      centreName: bookingData.centreName || 'Home',
      address: bookingData.address,
      carNumber: bookingData.vehicleNumber,
      waterProvided: useExistingSub === 'yes' && existingSubscription
        ? toApiWaterProvidedBoolean(existingSubscription.waterProvided)
        : bookingData.subscription?.waterProvided
          ? toApiWaterProvidedBoolean(bookingData.subscription.waterProvided)
          : bookingData.waterOption === 'give-water',
      baseAmount: Number(Math.max(0, bookingData.subTotal || 0)),
      subscriptionRedeemed: isSubscriptionRedeemed,
      planTypeCode: useExistingSub === 'yes' && existingSubscription
        ? existingSubscription.planTypeCode || null
        : bookingData.subscription?.planTypeCode || null
    };

    const response = await fetch('/bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    let parsedBody = null;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      const message = parsedBody?.message || 'Failed to save booking';
      throw new Error(message);
    }

    const bookingId = parsedBody?.token || parsedBody?.bookingId || parsedBody?.id || null;
    const bookingCode = parsedBody?.bookingCode || null;
    return {
      bookingId,
      bookingCode,
      response: parsedBody
    };
  };

  const saveDefaultBookingPreference = async () => {
    if (!isHomeService || !showSaveDefaultChoice || saveDefaultChoice !== 'yes') {
      return;
    }

    const headers = withAuthHeader({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    const response = await fetch('/users/profile/default-booking', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        address: bookingData.address,
        carNumber: bookingData.vehicleNumber,
        saveAsDefault: true
      })
    });

    let parsedBody = null;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = null;
    }

    if (!response.ok) {
      throw new Error(parsedBody?.message || 'Failed to save default address and car number');
    }
  };

  // Deal subscription payment from popup
  const formatMoney = (value) => Number(value || 0).toFixed(2);

  const getDiscountPercent = (actual, final) => {
    const actualPrice = Number(actual || 0);
    const finalPrice = Number(final || 0);
    if (actualPrice <= 0) return 0;
    return Math.round(((actualPrice - finalPrice) / actualPrice) * 100);
  };

  const saveDealBooking = async (deal) => {
    const authToken = getValidatedAuthToken();
    if (!authToken) {
      clearAuthSession();
      throw new Error('SESSION_EXPIRED');
    }

    const headers = withAuthHeader({
      'Content-Type': 'application/json',
      Accept: 'application/json'
    });

    const payload = {
      phone: getStoredPhone(),
      carType: deal.carType,
      serviceType: toApiServiceType(deal.serviceType),
      paymentStatus: 'SUCCESS',
      refundAmount: 0,
      refundStatus: 'NOT_INITIATED',
      discountPercentApplied: getDiscountPercent(deal.originalPrice, deal.discountedPrice),
      originalAmount: Number(formatMoney(deal.originalPrice)),
      payableAmount: Number(formatMoney(deal.discountedPrice)),
      washType: deal.washType,
      waterProvided: toApiWaterProvidedFlag(deal.waterProviding),
      totalWashes: Number(deal.totalWashes || 3)
    };

    const response = await fetch('/memberships/deal-price-bookings', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.status === 401 || response.status === 403) {
      clearAuthSession();
      throw new Error('SESSION_EXPIRED');
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Failed to save deal booking');
    }
  };

  const handleDealPayNow = () => {
    if (!matchedDealForPopup || !dealTermsAccepted) return;
    if (!getValidatedAuthToken()) {
      setShowLoginPopup(true);
      return;
    }
    setShowDealPaymentModal(true);
  };

  const handleDealPaymentMethodSelect = (method) => {
    setShowDealPaymentModal(false);
    setDealPaymentLoading(true);
    saveDealBooking(matchedDealForPopup)
      .then(() => {
        clearSubscriptionsCache();
        setShowDealPopup(false);
        setDealPaymentLoading(false);
        navigate('/terms', {
          state: {
            offerDeal: matchedDealForPopup,
            source: 'offers',
            paymentMethod: method
          }
        });
      })
      .catch((err) => {
        setDealPaymentLoading(false);
        console.error('Deal booking save failed:', err);
        if (err.message === 'SESSION_EXPIRED') {
          alert('Session expired. Please login again.');
          navigate('/login');
          return;
        }
        alert('Unable to process payment right now. Please try again.');
      });
  };

  const handleContinue = async () => {
    setBookingSubmitError('');
    setBookingSubmitSuccess('');

    if (!getValidatedAuthToken()) {
      setShowLoginPopup(true);
      return;
    }

    if (!isSubscriptionRedeemed) {
      setShowPaymentModal(true);
      return;
    }

    setBookingSubmitLoading(true);
    try {
      await saveDefaultBookingPreference();
      const result = await saveBookingToBackend();
      const successMessage = result.bookingCode
        ? `Booking saved successfully. Keycode: ${result.bookingCode}`
        : result.bookingId
          ? `Booking saved successfully. Booking ID: ${result.bookingId}`
          : 'Booking saved successfully.';
      setBookingSubmitSuccess(successMessage);

      setTimeout(() => {
        navigate('/terms', {
          state: {
            ...bookingData,
            bookingSaved: true,
            bookingId: result.bookingId || null,
            bookingCode: result.bookingCode || null
          }
        });
      }, 1200);
    } catch (error) {
      console.error('Booking save failed:', error);
      setBookingSubmitSuccess('');
      setBookingSubmitError(error.message || 'Unable to save booking right now. Please try again.');
    } finally {
      setBookingSubmitLoading(false);
    }
  };

  const handlePaymentMethodSelect = async (method) => {
    setShowPaymentModal(false);
    setBookingSubmitLoading(true);
    try {
      await saveDefaultBookingPreference();
      navigate('/terms', {
        state: {
          ...bookingData,
          paymentMethod: method,
          defaultPreferenceSaved: isHomeService && showSaveDefaultChoice && saveDefaultChoice === 'yes'
        }
      });
    } catch (error) {
      console.error('Booking save failed:', error);
      setBookingSubmitError(error.message || 'Unable to save booking right now. Please try again.');
    } finally {
      setBookingSubmitLoading(false);
    }
  };

  const getVehicleIcon = (vehicleType) => {
    const v = String(vehicleType || '').toUpperCase().replace(/_/g, '');
    if (v === 'BIKE') return '\u{1F3CD}\uFE0F';
    if (v === 'PICKUP' || v === 'PICKUPTRUCK') return '\u{1F6FB}';
    if (v === 'SUV' || v === 'MPV') return '\u{1F699}';
    return '\u{1F697}';
  };


  return (
    <div className="page-container review-page">
      {/* Phone Modal for Google OAuth Users */}
      {/* Celebration Banner */}
      {showCelebration && (
        <div className="celebration-overlay">
          <div className="celebration-banner">
            <span className="celebration-emoji">ðŸŽ‰</span>
            <h2 className="celebration-title">Welcome aboard!</h2>
            <p className="celebration-text">You got <strong>â‚¹20 Signup Bonus!</strong></p>
            <span className="celebration-emoji">ðŸŽŠ</span>
          </div>
        </div>
      )}

      {showPhoneModal && (
        <div className="phone-modal-overlay">
          <div className="phone-link-modal">
            <button className="phone-link-close" onClick={() => setShowPhoneModal(false)}>âœ•</button>

            {phoneStep === 'enter' && (
              <>
                <div className="phone-link-icon">ðŸ“±</div>
                <h3 className="phone-link-title">Link Your Phone Number</h3>
                <p className="phone-link-desc">Link your number to access membership details & booking history</p>
                <div className="modal-or-divider"><span>or</span></div>
                <p className="phone-link-desc phone-link-desc-green">sign up with a new number to get<br/><strong className="highlight-bonus">â‚¹20 off!</strong></p>
                <input
                  type="tel"
                  className="phone-link-input"
                  placeholder="Enter 10-digit phone number"
                  value={phoneInput}
                  onChange={(e) => { setPhoneInput(e.target.value.replace(/\D/g, '')); setPhoneError(''); }}
                  maxLength="10"
                  disabled={phoneLoading}
                />
                {phoneError && <p className="phone-link-error">{phoneError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handlePhoneCheck}
                  disabled={phoneLoading || phoneInput.trim().length !== 10}
                >
                  {phoneLoading ? 'Checking...' : 'Continue'}
                </button>
              </>
            )}

            {phoneStep === 'confirm' && (
              <>
                <div className="phone-link-icon">{phoneIsNew ? 'ðŸŽ‰' : 'ðŸ‘‹'}</div>
                <h3 className="phone-link-title">
                  {phoneIsNew ? 'New User!' : 'Welcome Back!'}
                </h3>
                <p className="phone-link-desc">
                  {phoneIsNew
                    ? 'Get a signup bonus of â‚¹20 off on your first booking!'
                    : `${phoneInput} is already registered with ${phoneExistingEmail}. Do you wish to continue?`
                  }
                </p>
                {otpError && <p className="phone-link-error">{otpError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handleSendOtp}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
                <button
                  className="phone-link-btn-secondary"
                  onClick={() => { setPhoneStep('enter'); setPhoneInput(''); }}
                >
                  Change Number
                </button>
              </>
            )}

            {phoneStep === 'otp' && (
              <>
                <div className="phone-link-icon">ðŸ”</div>
                <h3 className="phone-link-title">Verify OTP</h3>
                <p className="phone-link-desc">Enter the OTP sent to {phoneInput}</p>
                <input
                  type="tel"
                  className="phone-link-input"
                  placeholder="Enter OTP"
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, '')); setOtpError(''); }}
                  maxLength="6"
                  disabled={phoneLoading}
                />
                {otpError && <p className="phone-link-error">{otpError}</p>}
                <button
                  className="phone-link-btn"
                  onClick={handleVerifyOtp}
                  disabled={phoneLoading || !otpInput.trim()}
                >
                  {phoneLoading ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button
                  className="phone-link-btn-secondary"
                  onClick={handleSendOtp}
                  disabled={phoneLoading}
                >
                  Resend OTP
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <BookingSteps current={3} />

      <div className="review-desktop-grid">
        <div className="review-left-col">
        {/* Booking Details */}
        <div className="booking-info">
        <div className="booking-info-header">
          <span className="booking-info-title">Booking Summary</span>
          <span className={`booking-mode-pill ${rawServiceType === 'HOME' ? 'home' : (rawServiceType === 'SERVICE_CENTRE' ? 'service-centre' : 'centre')}`}>
            {rawServiceType === 'HOME' ? '@Home' : (rawServiceType === 'SERVICE_CENTRE' ? '@Service Centre' : '@Centre')}
          </span>
        </div>
        <div className="booking-row">
          <span className="booking-icon">🧴</span>
          <span className="booking-label">Wash Type</span>
          <span className="booking-sep">:</span>
          <span className="booking-value">{bookingData.washType}</span>
        </div>
        {bookingData.vehicleType && (
        <div className="booking-row">
          <span className="booking-icon">{getVehicleIcon(bookingData.vehicleType)}</span>
          <span className="booking-label">Vehicle</span>
          <span className="booking-sep">:</span>
          <span className="booking-value">{bookingData.vehicleType}</span>
        </div>
        )}
        <div className="booking-row">
          <span className="booking-icon">🔢</span>
          <span className="booking-label">Vehicle No.</span>
          <span className="booking-sep">:</span>
          <span className="booking-value">{bookingData.vehicleNumber}</span>
        </div>
        <div className="booking-row booking-row-multiline">
          <span className="booking-icon">📍</span>
          <span className="booking-label">Address</span>
          <span className="booking-sep">:</span>
          <span className="booking-value">{bookingData.address}</span>
        </div>
        <div className="booking-row">
          <span className="booking-icon">📅</span>
          <span className="booking-label">Date</span>
          <span className="booking-sep">:</span>
          <span className="booking-value booking-value-accent">{formatDateForDisplay(bookingData.selectedDate)}</span>
        </div>
      </div>

      {showSaveDefaultChoice && (
        <div className="save-default-card">
          <p className="save-default-title">Save this address and car number as default?</p>
          <div className="save-default-options">
            <label className="save-default-option">
              <input
                type="radio"
                name="save-default"
                value="yes"
                checked={saveDefaultChoice === 'yes'}
                onChange={() => setSaveDefaultChoice('yes')}
                disabled={bookingSubmitLoading}
              />
              <span>Yes</span>
            </label>
            <label className="save-default-option">
              <input
                type="radio"
                name="save-default"
                value="no"
                checked={saveDefaultChoice === 'no'}
                onChange={() => setSaveDefaultChoice('no')}
                disabled={bookingSubmitLoading}
              />
              <span>No</span>
            </label>
          </div>
        </div>
      )}

      {/* Promo Code Section */}
      <div className="promo-section">
        {isSubscriptionRedeemed ? (
          <p className="promo-message success subscription-redeemed-banner">
            Subscription Redeemed
          </p>
        ) : (
          <>
            <div className="promo-code-input-wrapper">
              <input
                type="text"
                value={promoCodeInput}
                onChange={(e) => {
                  setPromoCodeInput(e.target.value);
                  setPromoCodeMessage('');
                }}
                placeholder="Enter referral code (e.g., ASP-XXXXX)"
                className="promo-code-input"
                disabled={promoCodeApplied}
              />
              {!promoCodeApplied ? (
                <button
                  className="apply-btn-small"
                  onClick={handleApplyPromoCode}
                  disabled={promoCodeLoading}
                >
                  {promoCodeLoading ? 'Validating...' : 'Apply'}
                </button>
              ) : (
                <button
                  className="remove-btn-small"
                  onClick={handleRemovePromoCode}
                >
                  Remove
                </button>
              )}
            </div>
            {promoCodeMessage && (
              <p className={`promo-message ${promoCodeApplied ? 'success' : 'error'}`}>
                {promoCodeMessage}
              </p>
            )}
          </>
        )}
      </div>

      {/* Existing Subscription Prompt */}
      {existingSubscription && !bookingData.subscriptionRedeemed && (
        <div className="existing-sub-prompt">
          <p className="existing-sub-title">
            ðŸŽŸï¸ You have a subscription for this combination ({existingSubscription.leftWashes} wash{Number(existingSubscription.leftWashes) !== 1 ? 'es' : ''} left)
          </p>
          <p className="existing-sub-question">Would you like to use your subscription?</p>
          <div className="existing-sub-options">
            <label className={`existing-sub-radio ${useExistingSub === 'yes' ? 'active' : ''}`}>
              <input
                type="radio"
                name="useSubscription"
                value="yes"
                checked={useExistingSub === 'yes'}
                onChange={() => setUseExistingSub('yes')}
              />
              <span>Yes, use subscription</span>
            </label>
            <label className={`existing-sub-radio ${useExistingSub === 'no' ? 'active' : ''}`}>
              <input
                type="radio"
                name="useSubscription"
                value="no"
                checked={useExistingSub === 'no'}
                onChange={() => setUseExistingSub('no')}
              />
              <span>No, pay one-time</span>
            </label>
          </div>
        </div>
      )}

      {/* Price Breakdown */}
      {!isSubscriptionRedeemed && (
      <div className="price-breakdown">
        <div className="price-row">
          <span>Sub total(price + Tax)</span>
          <span>{formatCurrency(bookingData.subTotal)}</span>
        </div>
        <div className="price-row discount-row">
          <span>
            Membership discount
            {membershipDiscount > 0 ? ` (${membershipDiscountPercent}%)` : ''}
          </span>
          <span>
            {membershipDiscount > 0
              ? `-${formatCurrency(membershipDiscount)}`
              : 'N/A'}
          </span>
        </div>
        {!hasExistingBookings && signupBonus > 0 && (
          <div className="price-row discount-row">
            <span>Signup Bonus</span>
            <span>-{formatCurrency(signupBonus)}</span>
          </div>
        )}
        {!isSubscriptionRedeemed && promoCodeApplied && effectivePromoDiscount > 0 && (
          <div className="price-row discount-row">
            <span>{promoCodeInput} Applied!</span>
            <span>-{formatCurrency(effectivePromoDiscount)}</span>
          </div>
        )}
        <div className="price-divider"></div>
        <div className="price-row total">
          <span><strong>Grand Total</strong></span>
          <span><strong>{formatCurrency(Math.max(0, grandTotal))}</strong></span>
        </div>
      </div>
      )}

      {/* Savings Message */}
      {!isSubscriptionRedeemed && savings > 0 && (
        <div className="savings-message">
          <span>ðŸŽ‰ Hurrahh! You are saving {formatCurrency(savings)}</span>
        </div>
      )}

      {/* Subscription Savings Banner */}
      {showSubscriptionBanner && subscriptionSaving > 0 && (
        <div className="subscription-savings-banner">
          <span className="subscription-savings-text">
            You can save up to <strong>{formatCurrency(subscriptionSaving)}/-</strong> by subscribing this wash
          </span>
          <button
            className="subscribe-now-btn"
            onClick={() => {
              setDealTermsAccepted(false);
              setShowDealPopup(true);
            }}
          >
            Subscribe Now
          </button>
        </div>
      )}

      {/* Deal Subscription Popup */}
      {showDealPopup && matchedDealForPopup && (
        <div className="deal-popup-overlay" onClick={() => setShowDealPopup(false)}>
          <div className="deal-popup-card" onClick={(e) => e.stopPropagation()}>
            <button className="deal-popup-close" onClick={() => setShowDealPopup(false)}>âœ•</button>
            <div className="deal-popup-header">
              <span className="deal-popup-badge">
                {getDiscountPercent(matchedDealForPopup.originalPrice, matchedDealForPopup.discountedPrice)}% OFF
              </span>
              <h3 className="deal-popup-title">
                {matchedDealForPopup.totalWashes} {matchedDealForPopup.washType} washes
              </h3>
              <p className="deal-popup-subtitle">
                @{matchedDealForPopup.serviceType} for {matchedDealForPopup.carType}
              </p>
            </div>
            <div className="deal-popup-pricing">
              <span className="deal-popup-original">â‚¹{Math.round(matchedDealForPopup.originalPrice)}</span>
              <span className="deal-popup-final">â‚¹{Math.round(matchedDealForPopup.discountedPrice)}/-</span>
            </div>
            <p className="deal-popup-saving">
              You save <strong>{formatCurrency(subscriptionSaving)}/-</strong> compared to {matchedDealForPopup.totalWashes} one-time bookings
            </p>
            <label className="deal-popup-terms">
              <input
                type="checkbox"
                checked={dealTermsAccepted}
                onChange={(e) => setDealTermsAccepted(e.target.checked)}
              />
              <span>I accept all Terms and conditions</span>
            </label>
            <div className="deal-popup-actions">
              <button
                className="deal-popup-pay-btn"
                onClick={handleDealPayNow}
                disabled={!dealTermsAccepted || dealPaymentLoading}
              >
                {dealPaymentLoading ? 'Processing...' : 'Pay Now'}
              </button>
              <button
                className="deal-popup-explore-btn"
                onClick={() => {
                  setShowDealPopup(false);
                  navigate('/offers', { state: { preselectedCarType: bookingData.vehicleType } });
                }}
              >
                Explore More Offers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      <button className="continue-btn" onClick={handleContinue} disabled={bookingSubmitLoading}>
        {bookingSubmitLoading
          ? 'Booking...'
          : isSubscriptionRedeemed
            ? 'Continue to book'
            : 'Continue to pay'}
      </button>

      {bookingSubmitError && (
        <p className="promo-message error">{bookingSubmitError}</p>
      )}

      {bookingSubmitSuccess && (
        <p className="promo-message success">{bookingSubmitSuccess}</p>
      )}
        </div>{/* /review-left-col */}

        {/* Desktop right column — payment panel */}
        <div className="review-right-col">
          <div className="review-payment-panel">
            <PaymentMethodModal
              inline
              open={true}
              onClose={() => {}}
              onSelect={handlePaymentMethodSelect}
              amount={Math.max(0, grandTotal)}
            />
          </div>
        </div>
      </div>{/* /review-desktop-grid */}

      {/* Bottom Navigation */}
      <BottomNav active="home" />

      <PaymentMethodModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSelect={handlePaymentMethodSelect}
        amount={Math.max(0, grandTotal)}
      />

      <PaymentMethodModal
        open={showDealPaymentModal}
        onClose={() => setShowDealPaymentModal(false)}
        onSelect={handleDealPaymentMethodSelect}
        amount={matchedDealForPopup ? Math.round(matchedDealForPopup.discountedPrice) : 0}
      />

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="modal-overlay" onClick={() => setShowLoginPopup(false)}>
          <div className="review-login-popup" onClick={(e) => e.stopPropagation()}>
            <div className="review-login-popup-icon">ðŸ”</div>
            <h3 className="review-login-popup-title">Please Login / Signup</h3>
            <p className="review-login-popup-desc">to continue with your booking</p>
            <div className="review-login-popup-actions">
              <button className="review-login-popup-btn login" onClick={() => { setShowLoginPopup(false); navigate('/login', { state: { mode: 'login', from: { pathname: '/review' } } }); }}>Login</button>
              <button className="review-login-popup-btn signup" onClick={() => { setShowLoginPopup(false); navigate('/login', { state: { mode: 'signup', from: { pathname: '/review' } } }); }}>Signup</button>
            </div>
            <button className="review-login-popup-close" onClick={() => setShowLoginPopup(false)}>Maybe later</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Review;
