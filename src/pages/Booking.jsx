import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredPhone, toApiServiceType, toApiWaterProvidedBoolean } from '../utils/apiMappers';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readCache, writeCache, CACHE_KEYS } from '../utils/refDataCache';
import '../styles/Booking.css';

const normalizeText = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');

const normalizeCarType = (value) => {
  const normalized = normalizeText(value);
  if (normalized === 'PICK_UP') return 'PICKUP';
  return normalized;
};

const normalizeWashType = (value) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'FOAM') return 'Foam';
  if (normalized === 'BASIC') return 'Basic';
  if (normalized === 'PREMIUM') return 'Premium';
  return 'Foam';
};

const normalizeServiceType = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SELFDRIVE') return 'SELF_DRIVE';
  if (normalized === 'SELF DRIVE') return 'SELF_DRIVE';
  if (normalized === 'HOME') return 'HOME';
  return normalized || 'SELF_DRIVE';
};

const formatVehicleTypeLabel = (value) => String(value || '')
  .trim()
  .replace(/_/g, ' ')
  .toLowerCase()
  .replace(/\b\w/g, (char) => char.toUpperCase());


const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedSubscription = location.state?.subscription || null;
  const prefilledCarType = location.state?.prefilledCarType || '';
  const initialVehicle = selectedSubscription ? normalizeCarType(selectedSubscription.carType) : normalizeCarType(prefilledCarType);
  const initialWashType = selectedSubscription ? normalizeWashType(selectedSubscription.washType) : '';

  // Restore saved booking state if returning from /review (no location.state)
  const savedBooking = (!location.state && sessionStorage.getItem('bookingFormState'))
    ? JSON.parse(sessionStorage.getItem('bookingFormState'))
    : null;

  const [selectedVehicle, setSelectedVehicle] = useState(savedBooking?.selectedVehicle || initialVehicle);
  const [washType, setWashType] = useState(savedBooking?.washType || initialWashType);
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState(savedBooking?.searchAddress || 'KIMS Hospital, Old Bombay Highway, Ward 104 K');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(savedBooking?.selectedCentre || location.state?.selectedCentre || null);
  const [centreName, setCentreName] = useState(savedBooking?.centreName || 'Home');
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const dateInputRef = React.useRef(null);
  const vehicleSwipeStartXRef = React.useRef(null);
  const vehicleSwipeStartYRef = React.useRef(null);
  const vehicleSwipeSuppressClickUntilRef = React.useRef(0);
  
  // Calendar and time slot states
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(savedBooking?.selectedDate ? new Date(savedBooking.selectedDate) : null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(savedBooking?.selectedTimeSlot || '');
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState(savedBooking?.vehicleNumber || '');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [waterOption, setWaterOption] = useState(savedBooking?.waterOption || 'no-thanks');
  const [rate, setRate] = useState({ amount: null, currency: 'INR' });
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [finalPrice, setFinalPrice] = useState(null);
  const [subscriptionValidationLoading, setSubscriptionValidationLoading] = useState(false);
  const [subscriptionValidated, setSubscriptionValidated] = useState(false);
  const [subscriptionValidationError, setSubscriptionValidationError] = useState('');
  const [showWaterTermsInfo, setShowWaterTermsInfo] = useState(false);
  const [showWaterTermsConfirm, setShowWaterTermsConfirm] = useState(false);
  const [waterTermsChecked, setWaterTermsChecked] = useState(false);
  const [vehicleSlideIndex, setVehicleSlideIndex] = useState(0);
  const [showDefaultPrefillPrompt, setShowDefaultPrefillPrompt] = useState(false);
  const [applyingDefaultPrefill, setApplyingDefaultPrefill] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [dynamicVehicleTypes, setDynamicVehicleTypes] = useState([]);
  const [dynamicWashTypes, setDynamicWashTypes] = useState([]);

  // Saved addresses (persisted via /users/addresses backend endpoints)
  const ADDRESS_API_BASE = '/users/addresses';
  const emptyAddressForm = {
    label: 'Home',
    fullName: '',
    phone: '',
    zipcode: '',
    streetAddress: '',
    area: '',
    city: '',
    state: '',
    landmark: '',
  };
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showAddressList, setShowAddressList] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyAddressForm);
  const [addressFormError, setAddressFormError] = useState('');
  const [addressFormSaving, setAddressFormSaving] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const fetchSavedAddresses = React.useCallback(async () => {
    const token = getValidatedAuthToken();
    if (!token) return;
    setAddressesLoading(true);
    try {
      const response = await fetch(ADDRESS_API_BASE, {
        method: 'GET',
        headers: withAuthHeader({ Accept: 'application/json' }),
      });
      if (!response.ok) {
        setAddressesLoading(false);
        return;
      }
      const body = await response.json();
      const list = Array.isArray(body?.data) ? body.data : [];
      setSavedAddresses(list);
      const def = list.find((a) => a.defaultAddress);
      if (def && !selectedAddressId) {
        setSelectedAddressId(def.id);
      }
    } catch (err) {
      console.error('Fetch addresses error:', err);
    } finally {
      setAddressesLoading(false);
    }
  }, [selectedAddressId]);

  useEffect(() => {
    fetchSavedAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatSavedAddress = (addr) => {
    if (!addr) return '';
    const parts = [
      addr.streetAddress,
      addr.area,
      addr.city,
      addr.state,
      addr.zipcode,
    ].filter((part) => part && String(part).trim().length > 0);
    return parts.join(', ');
  };

  const openAddressList = () => {
    setShowAddressList(true);
    fetchSavedAddresses();
  };

  const closeAddressList = () => {
    setShowAddressList(false);
  };

  const handleChooseAddress = (addr) => {
    setSelectedAddressId(addr.id);
    setSearchAddress(formatSavedAddress(addr));
    setCentreName(addr.label || 'Home');
    setShowAddressList(false);
  };

  const openNewAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm(emptyAddressForm);
    setAddressFormError('');
    setShowAddressForm(true);
  };

  const openEditAddressForm = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label || 'Home',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      zipcode: addr.zipcode || '',
      streetAddress: addr.streetAddress || '',
      area: addr.area || '',
      city: addr.city || '',
      state: addr.state || '',
      landmark: addr.landmark || '',
    });
    setAddressFormError('');
    setShowAddressForm(true);
  };

  const closeAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressFormError('');
  };

  const handleAddressFormChange = (field, value) => {
    setAddressForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async () => {
    const required = ['zipcode', 'streetAddress', 'area', 'city', 'state'];
    const missing = required.find((key) => !String(addressForm[key] || '').trim());
    if (missing) {
      setAddressFormError('Please fill all required fields');
      return;
    }
    if (!/^\d{6}$/.test(String(addressForm.zipcode).trim())) {
      setAddressFormError('Please enter a valid 6-digit zipcode');
      return;
    }
    const phoneTrimmed = String(addressForm.phone || '').trim();
    if (phoneTrimmed && !/^\d{10}$/.test(phoneTrimmed)) {
      setAddressFormError('Please enter a valid 10-digit phone number');
      return;
    }

    const token = getValidatedAuthToken();
    if (!token) {
      setAddressFormError('Please log in to save addresses');
      return;
    }

    const payload = {
      label: addressForm.label || 'Home',
      fullName: addressForm.fullName?.trim() || null,
      phone: phoneTrimmed || null,
      zipcode: addressForm.zipcode.trim(),
      area: addressForm.area.trim(),
      streetAddress: addressForm.streetAddress.trim(),
      city: addressForm.city.trim(),
      state: addressForm.state.trim(),
      landmark: addressForm.landmark?.trim() || null,
    };

    setAddressFormSaving(true);
    try {
      const url = editingAddressId
        ? `${ADDRESS_API_BASE}/${editingAddressId}`
        : ADDRESS_API_BASE;
      const method = editingAddressId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: withAuthHeader({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok || body?.success === false) {
        setAddressFormError(body?.message || 'Failed to save address');
        return;
      }

      const saved = body?.data;
      await fetchSavedAddresses();
      if (saved) {
        handleChooseAddress(saved);
      }
      closeAddressForm();
    } catch (err) {
      console.error('Save address error:', err);
      setAddressFormError('Network error. Please try again.');
    } finally {
      setAddressFormSaving(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    const token = getValidatedAuthToken();
    if (!token) return;
    try {
      const response = await fetch(`${ADDRESS_API_BASE}/${id}`, {
        method: 'DELETE',
        headers: withAuthHeader({ Accept: 'application/json' }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('Delete address failed:', body);
        return;
      }
      if (selectedAddressId === id) {
        setSelectedAddressId(null);
      }
      await fetchSavedAddresses();
    } catch (err) {
      console.error('Delete address error:', err);
    }
  };

  const selectedSavedAddress = savedAddresses.find((a) => a.id === selectedAddressId) || null;

  const isSubscriptionFlow = Boolean(selectedSubscription);
  const isSubscriptionApplied = isSubscriptionFlow && subscriptionValidated;
  const isFromMySubscriptions = location.state?.source === 'my-subscriptions';
  const isSubscriptionSelectionLocked = isFromMySubscriptions && isSubscriptionFlow;

  // Generate time slots from 7AM to 7PM
  const timeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
    '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
    '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

  const VEHICLE_META = {
    HATCHBACK: { desc: 'Compact car', icon: '🚗' },
    SEDAN: { desc: 'Standard car', icon: '🚗' },
    SUV: { desc: 'Sport Utility Vehicle', icon: '🚙' },
    MPV: { desc: 'Multi-Purpose Vehicle', icon: '🚙' },
    PICKUP: { desc: 'Pickup truck', icon: '🛻' },
    BIKE: { desc: 'Motorcycle', icon: '🏍️' },
  };

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      const cached = readCache(CACHE_KEYS.VEHICLE_TYPES);
      if (cached) { setDynamicVehicleTypes(cached); return; }
      try {
        const res = await fetch('/rates/vehicle-types');
        if (!res.ok) return;
        const data = await res.json();
        const mapped = data.map((v) => ({
          id: v, name: v, desc: VEHICLE_META[v]?.desc || v, icon: VEHICLE_META[v]?.icon || '🚗'
        }));
        setDynamicVehicleTypes(mapped);
        writeCache(CACHE_KEYS.VEHICLE_TYPES, mapped);
      } catch { /* keep empty */ }
    };
    const fetchWashTypes = async () => {
      const cached = readCache(CACHE_KEYS.WASH_LEVELS);
      if (cached) { setDynamicWashTypes(cached); return; }
      try {
        const res = await fetch('/rates/wash-levels');
        if (!res.ok) return;
        const data = await res.json();
        const mapped = data.map((w) => w.charAt(0) + w.slice(1).toLowerCase());
        setDynamicWashTypes(mapped);
        writeCache(CACHE_KEYS.WASH_LEVELS, mapped);
      } catch { /* keep empty */ }
    };
    fetchVehicleTypes();
    fetchWashTypes();
  }, []);

  const formatDate = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateWithMonth = (date) => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const resolveServiceType = () => {
    const raw = location.state?.serviceType
      || selectedSubscription?.serviceType
      || selectedCentre?.serviceType
      || selectedCentre?.service_type
      || selectedCentre?.service
      || 'HOME';
    return toApiServiceType(raw);
  };

  const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const resolvedServiceType = resolveServiceType();
  const isHomeService = resolvedServiceType === 'HOME';
  const selectedCentreId = selectedCentre?.id ?? selectedCentre?.centreId ?? selectedCentre?.serviceCentreId ?? null;
  const selectedCentreAddress = String(selectedCentre?.address ?? selectedCentre?.centreAddress ?? '').trim();

  const buildAvailabilityParamStrategies = (dateParam, serviceType) => {
    const base = { date: dateParam, serviceType };
    const strategies = [new URLSearchParams(base)];

    if (!isHomeService) {
      const full = new URLSearchParams(base);
      if (selectedCentreId !== null && selectedCentreId !== undefined) {
        full.set('serviceCentreId', String(selectedCentreId));
      }
      if (centreName && centreName !== 'Home') {
        full.set('centreName', centreName);
      }
      if (selectedCentreAddress) {
        full.set('centreAddress', selectedCentreAddress);
      }
      strategies.unshift(full);

      if (selectedCentreId !== null && selectedCentreId !== undefined) {
        const idOnly = new URLSearchParams(base);
        idOnly.set('serviceCentreId', String(selectedCentreId));
        strategies.push(idOnly);
      }

      if (centreName && centreName !== 'Home') {
        const nameOnly = new URLSearchParams(base);
        nameOnly.set('centreName', centreName);
        strategies.push(nameOnly);
      }
    }

    return strategies;
  };

  const fetchAvailabilityWithFallback = async (headers, dateParam, serviceType) => {
    const strategies = buildAvailabilityParamStrategies(dateParam, serviceType);

    for (let index = 0; index < strategies.length; index += 1) {
      const params = strategies[index];
      const response = await fetch(`/bookings/availability?${params.toString()}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const shouldTryFallback = response.status === 403 && index < strategies.length - 1;
        if (shouldTryFallback) {
          continue;
        }
        return null;
      }

      const data = await response.json();
      return normalizeAvailability(data);
    }

    return null;
  };

  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    setSelectedTimeSlot('');
    setShowCalendar(false);
    setShowTimeSlots(true);
    fetchAvailability(date, resolveServiceType());
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setShowTimeSlots(false);
  };

  const normalizeAvailability = (data) => {
    const base = Object.fromEntries(timeSlots.map((slot) => [slot, true]));

    if (!data) return base;

    if (Array.isArray(data)) {
      if (data.length === 0) return base;

      if (typeof data[0] === 'string') {
        data.forEach((slot) => {
          if (slot in base) base[slot] = false;
        });
        return base;
      }

      if (typeof data[0] === 'object' && data[0] !== null) {
        data.forEach((item) => {
          const slot = item.timeSlot || item.slot || item.time || item.startTime;
          if (!slot || !(slot in base)) return;
          if (typeof item.available === 'boolean') {
            base[slot] = item.available;
          } else if (typeof item.isAvailable === 'boolean') {
            base[slot] = item.isAvailable;
          } else if (typeof item.booked === 'boolean') {
            base[slot] = !item.booked;
          } else {
            base[slot] = false;
          }
        });
        return base;
      }

      return base;
    }

    if (typeof data === 'object') {
      if (Array.isArray(data.bookedSlots)) {
        data.bookedSlots.forEach((slot) => {
          if (slot in base) base[slot] = false;
        });
        return base;
      }

      if (Array.isArray(data.availableSlots)) {
        const allFalse = Object.fromEntries(timeSlots.map((slot) => [slot, false]));
        data.availableSlots.forEach((slot) => {
          if (slot in allFalse) allFalse[slot] = true;
        });
        return allFalse;
      }

      // Backend returns { "08:00-09:00": true, ... } — use its slots directly
      const keys = Object.keys(data);
      if (keys.length) {
        const result = new Map();
        keys.forEach((slot) => {
          result.set(slot, Boolean(data[slot]));
        });
        return Object.fromEntries(result);
      }
    }

    return base;
  };

  const handleEditDate = () => {
    setShowTimeSlots(false);
    setShowCalendar(true);
  };

  const normalizeDefaultFlag = (rawFlag) => {
    const normalized = String(rawFlag ?? '').trim().toUpperCase();
    return normalized === 'Y' || normalized === 'YES' || normalized === 'TRUE' || normalized === '1';
  };

  const getProfilePayload = (responseBody) => {
    if (!responseBody || typeof responseBody !== 'object') return {};
    return responseBody.data && typeof responseBody.data === 'object'
      ? responseBody.data
      : responseBody;
  };

  const fetchUserProfileDefaults = async () => {
    const headers = withAuthHeader({
      Accept: 'application/json'
    });

    let payload = null;

    try {
      const response = await fetch('/users/profile', {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        payload = getProfilePayload(data);
      }
    } catch {
      // Profile fetch failed
    }

    if (!payload) return null;

    const defaultFlagRaw = payload?.carAddressDefaultFlag
      ?? payload?.car_address_default_flag
      ?? payload?.car__address_default_flag
      ?? payload?.defaultFlag
      ?? payload?.carAddressDefaultFlagYn
      ?? 'N';

    return {
      hasDefaultAddress: normalizeDefaultFlag(defaultFlagRaw),
      address: String(payload?.address ?? payload?.carAddress ?? payload?.userAddress ?? '').trim(),
      carNumber: String(payload?.carNumber ?? payload?.car_number ?? payload?.carNo ?? payload?.vehicleNumber ?? '').trim()
    };
  };

  const applyDefaultAddressAndCarNumber = async () => {
    setApplyingDefaultPrefill(true);
    try {
      const profileDefaults = await fetchUserProfileDefaults();
      if (!profileDefaults) {
        setShowDefaultPrefillPrompt(false);
        return;
      }

      if (profileDefaults.address) {
        setSearchAddress(profileDefaults.address);
      }

      if (profileDefaults.carNumber) {
        setVehicleNumber(profileDefaults.carNumber.toUpperCase());
        setPrefillApplied(true);
      }

      setShowDefaultPrefillPrompt(false);
    } catch (error) {
      console.error('Error applying default booking details:', error);
      setShowDefaultPrefillPrompt(false);
    } finally {
      setApplyingDefaultPrefill(false);
    }
  };

  const fetchAvailability = async (date, serviceType) => {
    setLoadingSlots(true);
    try {
      const headers = withAuthHeader({
        Accept: 'application/json'
      });

      const dateParam = formatDateForApi(date);
      const availabilityData = await fetchAvailabilityWithFallback(headers, dateParam, serviceType);
      if (availabilityData) {
        setAvailability(availabilityData);
        return;
      }

      setAvailability(null);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    // Request location only for @Home flow and when no centre is pre-selected
    if (isHomeService && !selectedCentre) {
      requestLocationPermission();
    }
  }, [isHomeService, selectedCentre]);

  useEffect(() => {
    if (!isHomeService) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [isHomeService]);

  useEffect(() => {
    if (!showCalendar) return;
    const timer = setTimeout(() => {
      if (dateInputRef.current?.showPicker) {
        dateInputRef.current.showPicker();
      }
      dateInputRef.current?.focus?.();
    }, 0);
    return () => clearTimeout(timer);
  }, [showCalendar]);

  useEffect(() => {
    let isCancelled = false;

    const checkDefaultPrefillFlag = async () => {
      try {
        const profileDefaults = await fetchUserProfileDefaults();
        if (isCancelled) return;

        if (!profileDefaults) {
          setShowDefaultPrefillPrompt(false);
          return;
        }

        if (isHomeService && profileDefaults.hasDefaultAddress) {
          setShowDefaultPrefillPrompt(true);
          return;
        }

        setShowDefaultPrefillPrompt(false);
      } catch (error) {
        console.error('Error checking default prefill flag:', error);
        setShowDefaultPrefillPrompt(false);
      }
    };

    checkDefaultPrefillFlag();

    return () => {
      isCancelled = true;
    };
  }, [isHomeService]);

  // Populate address and map if centre is selected from SelectCenter page
  useEffect(() => {
    if (selectedCentre && selectedCentre.address) {
      setSearchAddress(selectedCentre.address);
      setCentreName(selectedCentre.name || 'Home');
      
      // Update map with centre location if coordinates are available
      if (selectedCentre.lat && selectedCentre.lng) {
        setUserLocation({ latitude: selectedCentre.lat, longitude: selectedCentre.lng });
        // Small delay to ensure map is initialized
        setTimeout(() => {
          updateMapLocation(selectedCentre.lat, selectedCentre.lng);
        }, 100);
      }
    }
  }, [selectedCentre, selectedCentre?.lat, selectedCentre?.lng]);

  useEffect(() => {
    if (!selectedSubscription) return;

    const normalizedCarType = normalizeCarType(selectedSubscription.carType);
    const normalizedWashType = normalizeWashType(selectedSubscription.washType);

    if (normalizedCarType) {
      setSelectedVehicle(normalizedCarType);
    }
    setWashType(normalizedWashType);
    setWaterOption(toApiWaterProvidedBoolean(selectedSubscription.waterProvided) ? 'give-water' : 'no-thanks');
  }, [selectedSubscription]);

  useEffect(() => {
    if (!selectedSubscription) return;

    const validateSubscription = async () => {
      setSubscriptionValidationLoading(true);
      setSubscriptionValidationError('');
      setSubscriptionValidated(false);

      try {
        const planCode = String(selectedSubscription.planTypeCode || '').trim();
        const phone = getStoredPhone();

        if (!planCode || !phone) {
          setSubscriptionValidationError('Missing phone number or plan code for subscription redemption.');
          return;
        }

        const headers = withAuthHeader({
          Accept: 'application/json'
        });

        const response = await fetch('/memberships/deal-price-bookings/me', {
          method: 'GET',
          headers
        });

        if (!response.ok) {
          setSubscriptionValidationError('Unable to validate subscription right now.');
          return;
        }

        const data = await response.json();
        const entries = Array.isArray(data) ? data : [];

        const matched = entries.find((item) => {
          const samePlanCode = String(item.planTypeCode || '').trim().toUpperCase() === planCode.toUpperCase();
          const sameCarType = normalizeCarType(item.carType) === normalizeCarType(selectedSubscription.carType);
          const sameWashType = normalizeWashType(item.washType) === normalizeWashType(selectedSubscription.washType);
          const sameServiceType = normalizeServiceType(item.serviceType) === normalizeServiceType(selectedSubscription.serviceType);
          const hasWashesLeft = Number(item.leftWashes || 0) > 0;
          return samePlanCode && sameCarType && sameWashType && sameServiceType && hasWashesLeft;
        });

        if (!matched) {
          setSubscriptionValidationError('Subscription validation failed for this plan and phone number.');
          return;
        }

        setSubscriptionValidated(true);
      } catch (error) {
        console.error('Subscription validation error:', error);
        setSubscriptionValidationError('Unable to validate subscription right now.');
      } finally {
        setSubscriptionValidationLoading(false);
      }
    };

    validateSubscription();
  }, [selectedSubscription]);

  useEffect(() => {
    if (!selectedVehicle || !washType) return;

    if (isSubscriptionApplied) {
      setRate({ amount: 0, currency: 'INR' });
      setFinalPrice(0);
      setRateLoading(false);
      setRateError('');
      return;
    }

    const controller = new AbortController();

    const fetchRate = async () => {
      setRateLoading(true);
      setRateError('');

      try {
        const params = new URLSearchParams({
          vehicleType: selectedVehicle,
          washLevel: washType.toUpperCase()
        });

        const headers = withAuthHeader({
          Accept: 'application/json'
        });

        const response = await fetch(`/rates?${params.toString()}`, {
          method: 'GET',
          headers,
          signal: controller.signal
        });

        if (!response.ok) {
          if (response.status === 404) {
            setRate({ amount: null, currency: 'INR' });
            setRateError('Rate not found');
            return;
          }
          setRateError('Failed to fetch rate');
          return;
        }

        const data = await response.json();
        setRate({
          amount: data.amount,
          currency: data.currency || 'INR'
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setRateError('Failed to fetch rate');
        }
      } finally {
        setRateLoading(false);
      }
    };

    fetchRate();

    return () => controller.abort();
  }, [selectedVehicle, washType, isSubscriptionApplied]);

  // Recalculate price when water option changes
  useEffect(() => {
    if (isSubscriptionApplied) {
      setFinalPrice(0);
      return;
    }

    if (rate.amount === null || rate.amount === undefined) {
      setFinalPrice(null);
      return;
    }

    if (waterOption === 'give-water') {
      // Apply $100 discount
      const discountedPrice = Math.max(0, rate.amount - 100);
      setFinalPrice(discountedPrice);
    } else {
      // No discount
      setFinalPrice(rate.amount);
    }
  }, [waterOption, rate, isSubscriptionApplied]);

  useEffect(() => {
    // Initialize map when component mounts
    if (mapRef.current && !mapInstanceRef.current) {
      // Use centre coordinates if available, otherwise use default
      const initialLat = selectedCentre?.lat || 17.385;
      const initialLng = selectedCentre?.lng || 78.486;
      const map = window.L.map(mapRef.current).setView([initialLat, initialLng], 13);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      mapInstanceRef.current = map;
      
      // Add initial marker
      markerRef.current = window.L.marker([initialLat, initialLng]).addTo(map);

      // Add click event listener to map
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        
        // Update marker position
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = window.L.marker([lat, lng]).addTo(map);
        }
        
        // Update user location
        setUserLocation({ latitude: lat, longitude: lng });
        
        // Reverse geocode to get address
        reverseGeocode(lat, lng);
      });
    }

    return () => {
      // Cleanup map on unmount
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const updateMapLocation = (lat, lng) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
      
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = window.L.marker([lat, lng]).addTo(mapInstanceRef.current);
      }
    }
  };

  const requestLocationPermission = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ latitude: lat, longitude: lng });
          setLocationPermission('granted');
          
          // Reverse geocode to get address from coordinates using Nominatim
          reverseGeocode(lat, lng);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationPermission('denied');
          alert('Please allow location access for better service');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
      setLocationPermission('unsupported');
    }
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CarWashApp/1.0'
          }
        }
      );
      const data = await response.json();
      if (data.display_name) {
        setSearchAddress(data.display_name);
        updateMapLocation(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }
  };

  const handleAddressChange = async (e) => {
    if (!isHomeService) return;

    const address = e.target.value;
    setSearchAddress(address);
    
    // Fetch address suggestions from Nominatim
    if (address.length > 2) {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&addressdetails=1&limit=5`,
          {
            headers: {
              'User-Agent': 'CarWashApp/1.0'
            }
          }
        );
        const data = await response.json();
        setSuggestions(data);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (!isHomeService) return;

    setSearchAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setUserLocation({ latitude: lat, longitude: lng });
    updateMapLocation(lat, lng);
  };

  const vehicleTypes = dynamicVehicleTypes.length > 0 ? dynamicVehicleTypes : [
    { id: 'HATCHBACK', name: 'HATCHBACK', desc: 'Compact car', icon: '🚗' },
    { id: 'SEDAN', name: 'SEDAN', desc: 'Standard car', icon: '🚗' },
    { id: 'SUV', name: 'SUV', desc: 'Sport Utility Vehicle', icon: '🚙' },
    { id: 'MPV', name: 'MPV', desc: 'Multi-Purpose Vehicle', icon: '🚙' },
    { id: 'PICKUP', name: 'PICKUP', desc: 'Pickup truck', icon: '🛻' },
    { id: 'BIKE', name: 'BIKE', desc: 'Motorcycle', icon: '🏍️' }
  ];

  const VEHICLES_PER_SLIDE = 3;
  const vehiclePages = [];
  for (let index = 0; index < vehicleTypes.length; index += VEHICLES_PER_SLIDE) {
    vehiclePages.push(vehicleTypes.slice(index, index + VEHICLES_PER_SLIDE));
  }

  const vehicleSelectionTitle = selectedVehicle
    ? `selected car type: ${formatVehicleTypeLabel(selectedVehicle)}`
    : 'select your car type:';

  useEffect(() => {
    const idx = vehicleTypes.findIndex((vehicle) => vehicle.id === selectedVehicle);
    if (idx >= 0) {
      setVehicleSlideIndex(Math.floor(idx / VEHICLES_PER_SLIDE));
    }
  }, [selectedVehicle]);

  useEffect(() => {
    if (!isHomeService) {
      setWaterOption('no-thanks');
      setShowWaterTermsInfo(false);
      setShowWaterTermsConfirm(false);
      setWaterTermsChecked(false);
    }
  }, [isHomeService]);

  const formatRate = (amount, currency) => {
    if (amount === null || amount === undefined) return 'N/A';
    try {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency || 'INR',
        maximumFractionDigits: 2
      }).format(Number(amount));
    } catch {
      return `${currency || 'INR'} ${amount}`;
    }
  };

  const getPriceDisplayValue = () => {
    if (isSubscriptionFlow) return formatRate(0, 'INR');
    if (rateLoading || subscriptionValidationLoading) return 'Loading...';
    if (!selectedVehicle && !washType) return 'Select wash and car type for price';
    if (!selectedVehicle) return 'Select car type for price';
    if (!washType) return 'Select wash type for price';
    return formatRate(finalPrice, rate.currency);
  };

  const isPriceHint = !selectedVehicle || !washType;

  const slotsToRender = availability
    ? Object.entries(availability)
    : timeSlots.map((slot) => [slot, false]);

  const handleVehicleSwipeStart = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch) return;
    vehicleSwipeStartXRef.current = touch.clientX;
    vehicleSwipeStartYRef.current = touch.clientY;
  };

  const handleVehicleSwipeEnd = (event) => {
    const touch = event.changedTouches?.[0];
    if (!touch || vehicleSwipeStartXRef.current === null || vehicleSwipeStartYRef.current === null) {
      return;
    }

    const deltaX = touch.clientX - vehicleSwipeStartXRef.current;
    const deltaY = touch.clientY - vehicleSwipeStartYRef.current;
    const swipeThreshold = 40;

    vehicleSwipeStartXRef.current = null;
    vehicleSwipeStartYRef.current = null;

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    vehicleSwipeSuppressClickUntilRef.current = Date.now() + 180;

    if (deltaX < 0) {
      setVehicleSlideIndex((prev) => Math.min(prev + 1, vehiclePages.length - 1));
      return;
    }

    setVehicleSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleVehicleMouseDown = (event) => {
    if (event.button !== 0) return;
    vehicleSwipeStartXRef.current = event.clientX;
    vehicleSwipeStartYRef.current = event.clientY;
  };

  const handleVehicleMouseUp = (event) => {
    if (vehicleSwipeStartXRef.current === null || vehicleSwipeStartYRef.current === null) {
      return;
    }

    const deltaX = event.clientX - vehicleSwipeStartXRef.current;
    const deltaY = event.clientY - vehicleSwipeStartYRef.current;
    const swipeThreshold = 35;

    vehicleSwipeStartXRef.current = null;
    vehicleSwipeStartYRef.current = null;

    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) < Math.abs(deltaY)) {
      return;
    }

    vehicleSwipeSuppressClickUntilRef.current = Date.now() + 220;

    if (deltaX < 0) {
      setVehicleSlideIndex((prev) => Math.min(prev + 1, vehiclePages.length - 1));
      return;
    }

    setVehicleSlideIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleVehicleMouseLeave = () => {
    vehicleSwipeStartXRef.current = null;
    vehicleSwipeStartYRef.current = null;
  };

  const waterTermsText = 'User has to provide near by tap for water and electricty board for service.';

  const handleWaterOptionSelect = (value) => {
    if (isSubscriptionApplied) return;
    if (value === 'give-water') {
      setShowWaterTermsConfirm(true);
      setWaterTermsChecked(false);
      return;
    }
    setWaterOption('no-thanks');
  };

  const handleAcceptWaterTerms = () => {
    if (!waterTermsChecked) return;
    setWaterOption('give-water');
    setShowWaterTermsConfirm(false);
  };

  const handleCancelWaterTerms = () => {
    setShowWaterTermsConfirm(false);
    setWaterTermsChecked(false);
    setWaterOption('no-thanks');
  };

  return (
    <div className="page-container">
      {/* Back Button Header */}
      <div className="booking-header">
        <button className="back-btn-absolute" onClick={() => navigate(-1)}>←</button>
        {isHomeService && (
          <div className="booking-home-banner">
            <p><strong>100% cashback</strong> if your car is damaged</p>
            <p><strong>Sit, book &amp; relax</strong>: we come to your home and wash with full protection</p>
          </div>
        )}
      </div>

      {/* Map Section (kept hidden — preserves existing geolocation/marker logic) */}
      <div className="map-section map-hidden" aria-hidden="true">
        <div ref={mapRef} className="map-container"></div>
      </div>

      {/* Select Address Action / Selected Address Card */}
      <div className="select-address-row">
        <button
          type="button"
          className={`select-address-btn ${selectedSavedAddress ? 'has-selection' : ''}`}
          onClick={openAddressList}
        >
          {selectedSavedAddress ? (
            <span className="select-address-content">
              <span className="select-address-label">{selectedSavedAddress.label || 'Address'}</span>
              <span className="select-address-text">{formatSavedAddress(selectedSavedAddress)}</span>
              <span className="select-address-change">Change</span>
            </span>
          ) : (
            <span className="select-address-content">
              <span className="select-address-text">Select Address</span>
            </span>
          )}
        </button>
      </div>

      {/* Booking Details */}
      <div className="booking-details">
        <div className="booking-info-card">
          <div className="booking-schedule">
            <span className="schedule-icon">📅</span>
            <span>
              Schedule: {selectedDate && selectedTimeSlot
                ? `${formatDate(selectedDate)} ${selectedTimeSlot}`
                : 'Select date and time'}
            </span>
          </div>
          <button className="points-badge" onClick={() => setShowCalendar(true)}>📅</button>
        </div>

        <div className="booking-wash-type-standalone">
          <span className="wash-label-text">{washType ? 'selected wash type:' : 'select your wash type:'}</span>
          <div className="wash-btn-group">
            {(dynamicWashTypes.length > 0 ? dynamicWashTypes : ['Foam', 'Basic', 'Premium']).map((type) => (
              <button
                key={type}
                className={`wash-btn ${washType === type ? 'wash-btn-selected' : ''}`}
                onClick={() => !(isSubscriptionApplied || isSubscriptionSelectionLocked) && setWashType(washType === type ? '' : type)}
                disabled={isSubscriptionApplied || isSubscriptionSelectionLocked}
              >
                {type}
              </button>
            ))}
          </div>
          {isSubscriptionSelectionLocked && (
            <p className="subscription-lock-note">Locked by subscription plan</p>
          )}
        </div>

        {/* Calendar Modal */}
        {showCalendar && (
          <div className="modal-overlay" onClick={() => setShowCalendar(false)}>
            <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Select Date</h3>
              <input 
                type="date" 
                value={selectedDate ? formatDateForApi(selectedDate) : ''}
                onChange={(e) => handleDateSelect(parseLocalDate(e.target.value))}
                className="date-input"
                min={new Date().toISOString().split('T')[0]}
                ref={dateInputRef}
              />
              <button className="close-modal-btn" onClick={() => setShowCalendar(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Time Slots Modal */}
        {showTimeSlots && (
          <div className="modal-overlay" onClick={() => setShowTimeSlots(false)}>
            <div className="timeslot-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Select Time Slot</h3>
              {selectedDate && (
                <div className="selected-date-row">
                  <span className="selected-date-label">Selected date: {formatDateWithMonth(selectedDate)}</span>
                  <button type="button" className="edit-date-btn" onClick={handleEditDate}>Edit date?</button>
                </div>
              )}
              {loadingSlots ? (
                <p className="timeslots-loading">Loading available slots...</p>
              ) : (
                <div className="timeslots-grid">
                  {slotsToRender.map(([slot, isAvailable]) => (
                    <button
                      key={slot}
                      className={`timeslot-btn ${selectedTimeSlot === slot ? 'active' : ''} ${!isAvailable ? 'booked' : ''}`}
                      onClick={() => isAvailable && handleTimeSlotSelect(slot)}
                      disabled={!isAvailable}
                    >
                      <span className="timeslot-time">{slot}</span>
                      <span className="timeslot-status">
                        {isAvailable ? '✓ Available' : '✗ Booked'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button className="close-modal-btn" onClick={() => setShowTimeSlots(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Vehicle Type Selection */}
        <div className="vehicle-selection">
          <h3>{vehicleSelectionTitle}</h3>
          {isSubscriptionSelectionLocked && (
            <p className="subscription-lock-note">Locked by subscription plan</p>
          )}
          <div className="vehicle-types">
            <div className="vehicle-train-window">
              <div
                className="vehicle-train-touch-area"
                onTouchStart={handleVehicleSwipeStart}
                onTouchEnd={handleVehicleSwipeEnd}
                onMouseDown={handleVehicleMouseDown}
                onMouseUp={handleVehicleMouseUp}
                onMouseLeave={handleVehicleMouseLeave}
              >
              <div
                className="vehicle-train-track"
                style={{ transform: `translateX(-${vehicleSlideIndex * 100}%)` }}
              >
                {vehiclePages.map((page, pageIndex) => (
                  <div className="vehicle-train-page" key={`vehicle-page-${pageIndex}`}>
                    {page.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className={`vehicle-type-card ${selectedVehicle === vehicle.id ? 'selected' : ''}`}
                        onClick={() => {
                          if (Date.now() < vehicleSwipeSuppressClickUntilRef.current) {
                            return;
                          }
                          if (!isSubscriptionApplied && !isSubscriptionSelectionLocked) {
                            setSelectedVehicle(selectedVehicle === vehicle.id ? '' : vehicle.id);
                            if (prefillApplied) {
                              setVehicleNumber('');
                              setPrefillApplied(false);
                            }
                          }
                        }}
                      >
                        <div className="vehicle-icon">
                          {vehicle.icon}
                          {selectedVehicle === vehicle.id && (
                            <div className="check-icon">✓</div>
                          )}
                        </div>
                        <h4>{vehicle.name}</h4>
                        <p>{vehicle.desc}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              </div>
            </div>
            <div className="vehicle-train-dots" aria-label="Vehicle slide indicator">
              {vehiclePages.map((_, index) => (
                <button
                  key={`vehicle-dot-${index}`}
                  type="button"
                  className={`vehicle-train-dot ${vehicleSlideIndex === index ? 'active' : ''}`}
                  onClick={() => {
                    setVehicleSlideIndex(index);
                  }}
                  aria-label={`Go to vehicle slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Water Discount Option + Wash Type combined row on desktop */}
        <div className="water-wash-row">
          {isHomeService && !isSubscriptionApplied && (
            <div className="water-option-section">
              <div className="water-option">
                <input
                  type="radio"
                  id="give-water"
                  name="water"
                  value="give-water"
                  checked={waterOption === 'give-water'}
                  onChange={(e) => handleWaterOptionSelect(e.target.value)}
                  disabled={isSubscriptionApplied}
                />
                <label htmlFor="give-water">Get flat $100 by giving water</label>
                <button
                  type="button"
                  className="water-help-btn"
                  aria-label="View water offer terms and conditions"
                  onClick={() => setShowWaterTermsInfo(true)}
                >
                  ?
                </button>
              </div>
              <div className="water-option">
                <input
                  type="radio"
                  id="no-thanks"
                  name="water"
                  value="no-thanks"
                  checked={waterOption === 'no-thanks'}
                  onChange={(e) => handleWaterOptionSelect(e.target.value)}
                  disabled={isSubscriptionApplied}
                />
                <label htmlFor="no-thanks">No Thanks</label>
              </div>
            </div>
          )}
          <div className="booking-wash-type-standalone booking-wash-type-in-row">
            <span className="wash-label-text">{washType ? 'selected wash type:' : 'select your wash type:'}</span>
            <div className="wash-btn-group">
              {(dynamicWashTypes.length > 0 ? dynamicWashTypes : ['Foam', 'Basic', 'Premium']).map((type) => (
                <button
                  key={type}
                  className={`wash-btn ${washType === type ? 'wash-btn-selected' : ''}`}
                  onClick={() => !(isSubscriptionApplied || isSubscriptionSelectionLocked) && setWashType(washType === type ? '' : type)}
                  disabled={isSubscriptionApplied || isSubscriptionSelectionLocked}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isHomeService && showWaterTermsInfo && (
          <div className="modal-overlay water-terms-overlay sunrise-overlay" onClick={() => setShowWaterTermsInfo(false)}>
            <div className="water-terms-modal water-terms-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Terms & Conditions</h3>
              <p>{waterTermsText}</p>
              <button className="close-modal-btn" onClick={() => setShowWaterTermsInfo(false)}>Close</button>
            </div>
          </div>
        )}

        {isHomeService && showDefaultPrefillPrompt && (
          <div className="modal-overlay default-prefill-overlay" onClick={() => !applyingDefaultPrefill && setShowDefaultPrefillPrompt(false)}>
            <div className="default-prefill-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Use saved details?</h3>
              <p>Your profile has default car and address settings. Do you want to use them for this booking?</p>
              <div className="default-prefill-actions">
                <button
                  type="button"
                  className="default-prefill-no-btn"
                  onClick={() => setShowDefaultPrefillPrompt(false)}
                  disabled={applyingDefaultPrefill}
                >
                  No
                </button>
                <button
                  type="button"
                  className="default-prefill-yes-btn"
                  onClick={applyDefaultAddressAndCarNumber}
                  disabled={applyingDefaultPrefill}
                >
                  {applyingDefaultPrefill ? 'Applying...' : 'Yes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {isHomeService && showWaterTermsConfirm && (
          <div className="modal-overlay water-terms-overlay sunrise-overlay" onClick={handleCancelWaterTerms}>
            <div className="water-terms-modal water-terms-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Accept Terms & Conditions</h3>
              <p>{waterTermsText}</p>
              <label className="terms-checkbox-row">
                <input
                  type="checkbox"
                  checked={waterTermsChecked}
                  onChange={(e) => setWaterTermsChecked(e.target.checked)}
                />
                <span>I agree to the above terms.</span>
              </label>
              <div className="terms-modal-actions">
                <button type="button" className="terms-cancel-btn" onClick={handleCancelWaterTerms}>Cancel</button>
                <button type="button" className="terms-accept-btn" onClick={handleAcceptWaterTerms} disabled={!waterTermsChecked}>Accept</button>
              </div>
            </div>
          </div>
        )}

        {isSubscriptionFlow && (
          <p className="benefits-note">
            {subscriptionValidationLoading
              ? 'Validating subscription plan...'
              : subscriptionValidated
                ? 'Subscription validated. This wash is redeemable at ₹0.'
                : subscriptionValidationError || 'Subscription is not validated yet.'}
          </p>
        )}

        {/* Price Display and Vehicle Number */}
        <div className="booking-summary-row">
          <div className="price-display">
            <span className="price-label">Price:</span>
            <span className={`price-value ${isPriceHint ? 'hint' : ''}`}>
              {getPriceDisplayValue()}
            </span>
          </div>

          {/* Vehicle Number Input */}
          <div className="vehicle-input-section">
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value.toUpperCase());
                if (vehicleNumberError) setVehicleNumberError('');
              }}
              placeholder="(e.g., TN01AB1234)"
              className="vehicle-number-input"
              required
            />
          </div>
        </div>

        {vehicleNumberError && (
          <p className="vehicle-number-error">{vehicleNumberError}</p>
        )}

        <button className="review-btn" onClick={() => {
          if (!selectedAddressId || !selectedSavedAddress) {
            setVehicleNumberError('Please select an address');
            openAddressList();
            return;
          }
          if (!selectedDate) {
            setVehicleNumberError('Please select a date');
            return;
          }
          if (isSubscriptionFlow && !subscriptionValidated) {
            setVehicleNumberError(subscriptionValidationError || 'Subscription validation is required before booking.');
            return;
          }
          if (!selectedTimeSlot) {
            setVehicleNumberError('Please select a time slot');
            return;
          }
          if (!selectedVehicle) {
            setVehicleNumberError('Please choose your vehicle type');
            return;
          }
          if (!washType) {
            setVehicleNumberError('Please select a wash type');
            return;
          }
          if (!vehicleNumber.trim()) {
            setVehicleNumberError('Vehicle number is required');
            return;
          }          if (vehicleNumber.trim().length < 7) {
            setVehicleNumberError('Vehicle number must be at least 7 characters');
            return;
          }          // Save form state so it can be restored when returning from /review
          sessionStorage.setItem('bookingFormState', JSON.stringify({
            selectedVehicle,
            washType,
            searchAddress,
            selectedCentre,
            centreName,
            selectedDate: selectedDate ? selectedDate.toISOString() : null,
            selectedTimeSlot,
            vehicleNumber,
            waterOption
          }));
          navigate('/review', {
            state: {
              centreName,
              serviceCentreId: selectedCentreId,
              serviceType: resolvedServiceType,
              address: searchAddress,
              washType,
              selectedDate,
              selectedTimeSlot,
              vehicleType: selectedVehicle,
              vehicleNumber,
              subTotal: finalPrice,
              currency: rate.currency,
              waterOption,
              subscription: selectedSubscription,
              subscriptionRedeemed: isSubscriptionApplied
            }
          });
        }}>
          Review
        </button>
        <p className="benefits-note">*We will add all membership benefits in review page</p>
      </div>

      {/* Saved Addresses Modal */}
      {showAddressList && (
        <div className="modal-overlay" onClick={closeAddressList}>
          <div className="address-list-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>Saved Addresses</h3>
              <button type="button" className="address-modal-close" onClick={closeAddressList} aria-label="Close">×</button>
            </div>

            {addressesLoading ? (
              <div className="address-empty-state">
                <p>Loading saved addresses…</p>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="address-empty-state">
                <p>You don't have any saved addresses yet.</p>
              </div>
            ) : (
              <ul className="address-list">
                {savedAddresses.map((addr) => (
                  <li
                    key={addr.id}
                    className={`address-item ${selectedAddressId === addr.id ? 'selected' : ''}`}
                  >
                    <button
                      type="button"
                      className="address-item-main"
                      onClick={() => handleChooseAddress(addr)}
                    >
                      <span className="address-item-label">{addr.label || 'Home'}</span>
                      <span className="address-item-name">{addr.fullName}</span>
                      <span className="address-item-text">{formatSavedAddress(addr)}</span>
                      {addr.landmark && (
                        <span className="address-item-landmark">Landmark: {addr.landmark}</span>
                      )}
                      {addr.phone && (
                        <span className="address-item-phone">📞 {addr.phone}</span>
                      )}
                    </button>
                    <div className="address-item-actions">
                      <button
                        type="button"
                        className="address-item-edit"
                        onClick={() => openEditAddressForm(addr)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="address-item-delete"
                        onClick={() => handleDeleteAddress(addr.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className="add-new-address-btn"
              onClick={openNewAddressForm}
            >
              + Add new address
            </button>
          </div>
        </div>
      )}

      {/* Address Form Modal */}
      {showAddressForm && (
        <div className="modal-overlay" onClick={closeAddressForm}>
          <div className="address-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="address-modal-header">
              <h3>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
              <button type="button" className="address-modal-close" onClick={closeAddressForm} aria-label="Close">×</button>
            </div>

            <div className="address-form-grid">
              <div className="address-form-row">
                <label className="address-form-label">Save as</label>
                <div className="address-label-options">
                  {['Home', 'Work', 'Other'].map((opt) => (
                    <button
                      type="button"
                      key={opt}
                      className={`address-label-chip ${addressForm.label === opt ? 'active' : ''}`}
                      onClick={() => handleAddressFormChange('label', opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Zipcode *</label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="address-form-input"
                  value={addressForm.zipcode}
                  maxLength={6}
                  onChange={(e) => handleAddressFormChange('zipcode', e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit zipcode"
                />
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Area / Locality *</label>
                <input
                  type="text"
                  className="address-form-input"
                  value={addressForm.area}
                  onChange={(e) => handleAddressFormChange('area', e.target.value)}
                  placeholder="Area, sector, village"
                />
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Street address *</label>
                <input
                  type="text"
                  className="address-form-input"
                  value={addressForm.streetAddress}
                  onChange={(e) => handleAddressFormChange('streetAddress', e.target.value)}
                  placeholder="House no., building, street"
                />
              </div>

              <div className="address-form-row two-col">
                <div>
                  <label className="address-form-label">City *</label>
                  <input
                    type="text"
                    className="address-form-input"
                    value={addressForm.city}
                    onChange={(e) => handleAddressFormChange('city', e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="address-form-label">State *</label>
                  <input
                    type="text"
                    className="address-form-input"
                    value={addressForm.state}
                    onChange={(e) => handleAddressFormChange('state', e.target.value)}
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Landmark (optional)</label>
                <input
                  type="text"
                  className="address-form-input"
                  value={addressForm.landmark}
                  onChange={(e) => handleAddressFormChange('landmark', e.target.value)}
                  placeholder="Nearby landmark"
                />
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Full name (optional)</label>
                <input
                  type="text"
                  className="address-form-input"
                  value={addressForm.fullName}
                  onChange={(e) => handleAddressFormChange('fullName', e.target.value)}
                  placeholder="Enter full name"
                />
              </div>

              <div className="address-form-row">
                <label className="address-form-label">Phone number (optional)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className="address-form-input"
                  value={addressForm.phone}
                  maxLength={10}
                  onChange={(e) => handleAddressFormChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                />
              </div>

              {addressFormError && (
                <p className="address-form-error">{addressFormError}</p>
              )}

              <div className="address-form-actions">
                <button type="button" className="address-form-cancel" onClick={closeAddressForm} disabled={addressFormSaving}>
                  Cancel
                </button>
                <button type="button" className="address-form-save" onClick={handleSaveAddress} disabled={addressFormSaving}>
                  {addressFormSaving ? 'Saving…' : (editingAddressId ? 'Update Address' : 'Save Address')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;
