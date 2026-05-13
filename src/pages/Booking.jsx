import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getStoredPhone, toApiServiceType } from '../utils/apiMappers';
import { getValidatedAuthToken, withAuthHeader } from '../utils/auth';
import { readCache, writeCache, CACHE_KEYS } from '../utils/refDataCache';
import '../styles/Booking.css';
import { BookingPageSkeleton, useMountSkeleton, LoadingAnnouncer } from '../components/Skeleton';
import BookingSteps from '../components/BookingSteps';

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
  const prefilledWashType = location.state?.prefilledWashType || '';
  const initialVehicle = selectedSubscription ? normalizeCarType(selectedSubscription.carType) : normalizeCarType(prefilledCarType);
  const initialWashType = selectedSubscription
    ? normalizeWashType(selectedSubscription.washType)
    : (prefilledWashType ? normalizeWashType(prefilledWashType) : '');

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
  const [rate, setRate] = useState({ amount: null, currency: 'INR' });
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [finalPrice, setFinalPrice] = useState(null);
  const [subscriptionValidationLoading, setSubscriptionValidationLoading] = useState(false);
  const [subscriptionValidated, setSubscriptionValidated] = useState(false);
  const [subscriptionValidationError, setSubscriptionValidationError] = useState('');
  const [vehicleSlideIndex, setVehicleSlideIndex] = useState(0);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [dynamicVehicleTypes, setDynamicVehicleTypes] = useState([]);
  const [dynamicWashTypes, setDynamicWashTypes] = useState([]);
  const [allWashPrices, setAllWashPrices] = useState({});
  const [allWashPricesLoading, setAllWashPricesLoading] = useState(false);

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
    isDefault: false,
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
      isDefault: !!addr.defaultAddress,
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
      defaultAddress: !!addressForm.isDefault,
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

  const [defaultTogglePending, setDefaultTogglePending] = useState(false);

  const handleToggleDefaultForSelected = async (makeDefault) => {
    if (!selectedAddressId) return;
    const addr = savedAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    const token = getValidatedAuthToken();
    if (!token) return;
    setDefaultTogglePending(true);
    try {
      const payload = {
        label: addr.label || 'Home',
        fullName: addr.fullName || null,
        phone: addr.phone || null,
        zipcode: addr.zipcode || '',
        area: addr.area || '',
        streetAddress: addr.streetAddress || '',
        city: addr.city || '',
        state: addr.state || '',
        landmark: addr.landmark || null,
        defaultAddress: !!makeDefault,
      };
      const response = await fetch(`${ADDRESS_API_BASE}/${addr.id}`, {
        method: 'PUT',
        headers: withAuthHeader({
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        console.error('Update default failed:', body);
        return;
      }
      await fetchSavedAddresses();
    } catch (err) {
      console.error('Toggle default error:', err);
    } finally {
      setDefaultTogglePending(false);
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

  const formatSlotShort = (slot) => {
    if (!slot) return slot;
    const hour = parseInt(slot.split(':')[0], 10);
    if (isNaN(hour)) return slot;
    if (hour === 0 || hour === 12) return hour === 0 ? '12am' : '12pm';
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  const VEHICLE_META = {
    HATCHBACK: { desc: 'Compact car', img: '/images/hatchback.png' },
    SEDAN:     { desc: 'Standard car', img: '/images/sedan.png' },
    SUV:       { desc: 'Sport Utility Vehicle', img: '/images/suv.png' },
    MPV:       { desc: 'Multi-Purpose Vehicle', img: '/images/suv.png' },
    PICKUP:    { desc: 'Pickup truck', img: '/images/pickup.png' },
    BIKE:      { desc: 'Motorcycle', img: '/images/bike.png' },
  };

  const WASH_FEATURES = {
    Basic:   ['Exterior rinse', 'Wheel clean', 'Window wipe', 'Air freshener'],
    Foam:    ['Foam exterior wash', 'Tyre & wheel clean', 'Interior vacuum', 'Mirror & window clean'],
    Premium: ['Full foam wash', 'Engine bay rinse', 'Interior detail & polish', 'Wax coating'],
  };

  const WASH_ICONS = { Basic: '💧', Foam: '🫧', Premium: '✨' };

  useEffect(() => {
    const fetchVehicleTypes = async () => {
      const cached = readCache(CACHE_KEYS.VEHICLE_TYPES);
      if (cached) { setDynamicVehicleTypes(cached); return; }
      try {
        const res = await fetch('/rates/vehicle-types');
        if (!res.ok) return;
        const data = await res.json();
        const mapped = data.map((v) => ({
          id: v, name: v, desc: VEHICLE_META[v]?.desc || v, img: VEHICLE_META[v]?.img || '/images/hatchback.png'
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

  const resolveRawServiceType = () => {
    const raw = String(
      location.state?.serviceType
      || selectedSubscription?.serviceType
      || selectedCentre?.serviceType
      || selectedCentre?.service_type
      || selectedCentre?.service
      || 'HOME'
    ).trim().toUpperCase().replace(/\s+/g, '_');
    if (raw === 'SERVICE_CENTRE' || raw === 'SERVICE_CENTER' || raw === 'CENTRE' || raw === 'CENTER') return 'SERVICE_CENTRE';
    if (raw === 'SELFDRIVE' || raw === 'SELF_DRIVE') return 'SELF_DRIVE';
    return 'HOME';
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
  const rawServiceType = resolveRawServiceType();
  const isHomeService = rawServiceType === 'HOME';
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
    // Calendar uses inline date cards now; no native picker to auto-open.
  }, [showCalendar]);

  // (Removed: previous "Use saved details?" prompt. Default address is now
  // managed directly inside the saved-addresses modal via a checkbox.)

  // Populate address and map if centre is selected from SelectCenter page
  useEffect(() => {
    if (!selectedCentre) return;
    const centreAddress = selectedCentre.address
      || selectedCentre.centreAddress
      || selectedCentre.fullAddress
      || selectedCentre.area
      || '';
    if (centreAddress && !isHomeService) {
      setSearchAddress(centreAddress);
    }
    setCentreName(selectedCentre.name || selectedCentre.centreName || 'Home');

    const lat = selectedCentre.lat ?? selectedCentre.latitude ?? selectedCentre.centreLat;
    const lng = selectedCentre.lng ?? selectedCentre.longitude ?? selectedCentre.centreLng;
    if (lat && lng) {
      setUserLocation({ latitude: lat, longitude: lng });
      setTimeout(() => {
        updateMapLocation(lat, lng);
      }, 100);
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
        const headers = withAuthHeader({
          Accept: 'application/json'
        });

        // Centre-aware lookup when a centre is selected; falls back to the
        // global rate endpoint when there is no centre context (e.g. @Home
        // bookings without a chosen centre, or initial preview).
        const params = new URLSearchParams({
          vehicleType: selectedVehicle,
          washLevel: washType.toUpperCase()
        });

        const url = (selectedCentreId !== null && selectedCentreId !== undefined && Number(selectedCentreId) > 0)
          ? `/rates/centre/${selectedCentreId}/price?${params.toString()}`
          : `/rates?${params.toString()}`;

        const response = await fetch(url, {
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
  }, [selectedVehicle, washType, isSubscriptionApplied, selectedCentreId]);

  // Pre-fetch prices for all wash types (used by wash-plan cards in service centre flow)
  useEffect(() => {
    if (!selectedVehicle || isSubscriptionApplied) return;
    const washList = dynamicWashTypes.length > 0 ? dynamicWashTypes : ['Basic', 'Foam', 'Premium'];
    setAllWashPricesLoading(true);
    const headers = withAuthHeader({ Accept: 'application/json' });
    Promise.all(
      washList.map(async (wt) => {
        try {
          const params = new URLSearchParams({ vehicleType: selectedVehicle, washLevel: wt.toUpperCase() });
          const url = (selectedCentreId !== null && selectedCentreId !== undefined && Number(selectedCentreId) > 0)
            ? `/rates/centre/${selectedCentreId}/price?${params.toString()}`
            : `/rates?${params.toString()}`;
          const res = await fetch(url, { method: 'GET', headers });
          if (res.ok) { const d = await res.json(); return [wt, d.amount ?? null]; }
          return [wt, null];
        } catch { return [wt, null]; }
      })
    ).then((entries) => {
      setAllWashPrices(Object.fromEntries(entries));
      setAllWashPricesLoading(false);
    });
  }, [selectedVehicle, selectedCentreId, isSubscriptionApplied, dynamicWashTypes.length]);

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

    setFinalPrice(rate.amount);
  }, [rate, isSubscriptionApplied]);

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
    { id: 'HATCHBACK', name: 'HATCHBACK', desc: 'Compact car', img: '/images/hatchback.png' },
    { id: 'SEDAN',     name: 'SEDAN',     desc: 'Standard car', img: '/images/sedan.png' },
    { id: 'SUV',       name: 'SUV',       desc: 'Sport Utility Vehicle', img: '/images/suv.png' },
    { id: 'MPV',       name: 'MPV',       desc: 'Multi-Purpose Vehicle', img: '/images/suv.png' },
    { id: 'PICKUP',    name: 'PICKUP',    desc: 'Pickup truck', img: '/images/pickup.png' },
    { id: 'BIKE',      name: 'BIKE',      desc: 'Motorcycle', img: '/images/bike.png' },
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
    const vehicleRequired = rawServiceType !== 'SERVICE_CENTRE';
    if (!selectedVehicle && !washType) return vehicleRequired ? 'Select wash and car type for price' : 'Select wash type for price';
    if (!selectedVehicle && vehicleRequired) return 'Select car type for price';
    if (!washType) return 'Select wash type for price';
    return formatRate(finalPrice, rate.currency);
  };

  const isPriceHint = (!selectedVehicle && rawServiceType !== 'SERVICE_CENTRE') || !washType;

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

  const showMountSkeleton = useMountSkeleton(200);
  if (showMountSkeleton) {
    return (
      <div className="page-container">
        <LoadingAnnouncer label="Loading booking" />
        <BookingPageSkeleton />
      </div>
    );
  }

  return (
    <div className="page-container">
      <BookingSteps current={2} />
      {/* Back Button Header */}
      <div className="booking-header">
        {isHomeService && !isSubscriptionFlow && (
          <div className="booking-home-banner">
            <p><strong>100% cashback</strong> if your car is damaged</p>
            <p><strong>Sit, book &amp; relax</strong>: we come to your home and wash with full protection</p>
          </div>
        )}
      </div>

      {isSubscriptionFlow && (
        <div className={`subscription-banner ${subscriptionValidated ? 'is-validated' : subscriptionValidationError ? 'is-error' : 'is-loading'}`}>
          <div className="subscription-banner-row">
            <div className="subscription-banner-icon" aria-hidden="true">
              {subscriptionValidationLoading ? '⏳' : subscriptionValidated ? '✓' : subscriptionValidationError ? '!' : '★'}
            </div>
            <div className="subscription-banner-body">
              <div className="subscription-banner-title">Subscription Redemption</div>
              <div className="subscription-banner-meta">
                {[
                  selectedSubscription?.planTypeCode,
                  formatVehicleTypeLabel(selectedSubscription?.carType),
                  normalizeWashType(selectedSubscription?.washType),
                  normalizeServiceType(selectedSubscription?.serviceType) === 'HOME' ? '@Home' : '@Center'
                ].filter(Boolean).join(' • ')}
              </div>
              <div className="subscription-banner-status">
                {subscriptionValidationLoading
                  ? 'Validating subscription plan…'
                  : subscriptionValidated
                    ? `This wash is redeemable at ₹0${Number(selectedSubscription?.leftWashes) ? ` • ${selectedSubscription.leftWashes} wash${Number(selectedSubscription.leftWashes) === 1 ? '' : 'es'} left` : ''}`
                    : subscriptionValidationError || 'Subscription is not validated yet.'}
              </div>
            </div>
            {subscriptionValidated && (
              <div className="subscription-banner-price">
                <span className="subscription-banner-price-strike">{formatRate(rate.amount, rate.currency)}</span>
                <span className="subscription-banner-price-final">₹0</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Section (kept hidden — preserves existing geolocation/marker logic) */}
      <div className="map-section map-hidden" aria-hidden="true">
        <div ref={mapRef} className="map-container"></div>
      </div>

      {/* Select Address Action / Selected Address Card / Selected Centre Card */}
      {/* Booking Details */}
      <div className="booking-details">
        <div className="booking-info-card" onClick={() => setShowCalendar(true)}>
          <div className="booking-schedule">
            <span className="schedule-icon-svg" aria-hidden="true">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
              </svg>
            </span>
            <div className="schedule-text-col">
              <span className="schedule-date-text">
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </span>
              <span
                className={`schedule-time-text${selectedTimeSlot ? '' : ' muted'}`}
                onClick={(e) => { if (selectedDate) { e.stopPropagation(); setShowTimeSlots(true); } }}
              >
                {selectedTimeSlot || (selectedDate ? 'Tap to pick time' : 'Select time slot')}
              </span>
            </div>
          </div>
          <button
            className="points-badge"
            onClick={(e) => { e.stopPropagation(); setShowCalendar(true); }}
            aria-label="Pick date"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
          </button>
        </div>


        {isSubscriptionSelectionLocked && (
          <div className="subscription-lock-summary" role="group" aria-label="Subscription locked details">
            <div className="subscription-lock-summary-row">
              <span className="subscription-lock-summary-label">🔒 Wash type locked by subscription plan</span>
              <span className="subscription-lock-summary-sep">:</span>
              <span className="subscription-lock-summary-value">{washType || normalizeWashType(selectedSubscription?.washType)}</span>
            </div>
          </div>
        )}

        {/* Calendar Modal */}
        {showCalendar && (
          <div className="modal-overlay" onClick={() => setShowCalendar(false)}>
            <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
              <h3>Select Date</h3>
              <div className="date-quick-grid">
                {Array.from({ length: 14 }).map((_, i) => {
                  const d = new Date();
                  d.setHours(0, 0, 0, 0);
                  d.setDate(d.getDate() + i);
                  const iso = formatDateForApi(d);
                  const selectedIso = selectedDate ? formatDateForApi(selectedDate) : '';
                  const isSelected = iso === selectedIso;
                  const isToday = i === 0;
                  const isTomorrow = i === 1;
                  const dow = d.toLocaleDateString(undefined, { weekday: 'short' });
                  const day = d.getDate();
                  const month = d.toLocaleDateString(undefined, { month: 'short' });
                  return (
                    <button
                      key={iso}
                      type="button"
                      className={`date-quick-card ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleDateSelect(d)}
                    >
                      <span className="date-quick-dow">{isToday ? 'Today' : isTomorrow ? 'Tomorrow' : dow}</span>
                      <span className="date-quick-day">{day}</span>
                      <span className="date-quick-month">{month}</span>
                    </button>
                  );
                })}
              </div>
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
                  <span className="selected-date-label">{formatDateWithMonth(selectedDate)}</span>
                  <button type="button" className="edit-date-btn" onClick={handleEditDate}>Change!</button>
                </div>
              )}
              <div className="timeslot-legend">
                <span className="timeslot-legend-note">• Every slot is 1 hour</span>
                <span className="timeslot-legend-item">
                  <span className="timeslot-legend-dot available"></span> Available
                </span>
                <span className="timeslot-legend-item">
                  <span className="timeslot-legend-dot booked"></span> Booked
                </span>
              </div>
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
                      <span className="timeslot-time">{formatSlotShort(slot)}</span>
                    </button>
                  ))}
                </div>
              )}
              <button className="close-modal-btn" onClick={() => setShowTimeSlots(false)}>Close</button>
            </div>
          </div>
        )}

        {/* Vehicle / Wash Plan Selection */}
        {isSubscriptionSelectionLocked ? (
          <div className="subscription-lock-summary" role="group" aria-label="Subscription locked vehicle">
            <div className="subscription-lock-summary-row">
              <span className="subscription-lock-summary-label">🔒 Vehicle type locked by subscription plan</span>
              <span className="subscription-lock-summary-sep">:</span>
              <span className="subscription-lock-summary-value">{formatVehicleTypeLabel(selectedVehicle || selectedSubscription?.carType)}</span>
            </div>
            <div className="subscription-lock-summary-row">
              <span className="subscription-lock-summary-label">🔒 Price locked by subscription plan</span>
              <span className="subscription-lock-summary-sep">:</span>
              <span className="subscription-lock-summary-value subscription-lock-summary-price">{formatRate(0, 'INR')}</span>
            </div>
          </div>
        ) : (selectedCentre || isHomeService) ? (
          /* ── WASH PLAN CARDS — service centre & home flow ── */
          <div className="wash-plan-selector">
            <div className="wash-plan-vehicle-mini-row">
              {vehicleTypes.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className={`wash-plan-vehicle-mini${selectedVehicle === vehicle.id ? ' active' : ''}`}
                  onClick={() => setSelectedVehicle(vehicle.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedVehicle(vehicle.id)}
                >
                  <img src={vehicle.img || '/images/hatchback.png'} alt={vehicle.name} className="wash-plan-vehicle-mini-icon" />
                  <span className="wash-plan-vehicle-mini-name">
                    {vehicle.name.charAt(0) + vehicle.name.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
            {(dynamicWashTypes.length > 0 ? dynamicWashTypes : ['Basic', 'Foam', 'Premium']).map((type) => {
              const price = allWashPrices[type];
              const isSelected = washType === type;
              return (
                <div
                  key={type}
                  className={`wash-plan-card${isSelected ? ' selected' : ''}`}
                  onClick={() => setWashType(type)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setWashType(type)}
                >
                  <div className="wash-plan-card-left">
                    <span className="wash-plan-icon">{WASH_ICONS[type] || '🚿'}</span>
                    <div className="wash-plan-body">
                      <span className="wash-plan-name">{type} Wash</span>
                      <div className="wash-plan-features">
                        {(WASH_FEATURES[type] || []).map((f, fi) => (
                          <span key={fi} className="wash-plan-feature">✓ {f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="wash-plan"
                    checked={isSelected}
                    onChange={() => setWashType(type)}
                    className="wash-plan-radio"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="wash-plan-card-right">
                    {allWashPricesLoading
                      ? <span className="wash-plan-price">...</span>
                      : (price !== null && price !== undefined
                          ? <span className="wash-plan-price">{formatRate(price, 'INR')}</span>
                          : <span className="wash-plan-price-empty">Select car to get price</span>
                        )
                    }
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── ORIGINAL VEHICLE CAROUSEL ── */
          <div className="vehicle-selection">
            <h3>{vehicleSelectionTitle}</h3>
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
                            if (Date.now() < vehicleSwipeSuppressClickUntilRef.current) return;
                            if (!isSubscriptionApplied && !isSubscriptionSelectionLocked) {
                              setSelectedVehicle(selectedVehicle === vehicle.id ? '' : vehicle.id);
                              if (prefillApplied) { setVehicleNumber(''); setPrefillApplied(false); }
                            }
                          }}
                        >
                          <div className="vehicle-icon">
                            <img src={vehicle.img || '/images/hatchback.png'} alt={vehicle.name} className="vehicle-img" />
                            {selectedVehicle === vehicle.id && <div className="check-icon">✓</div>}
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
                    onClick={() => setVehicleSlideIndex(index)}
                    aria-label={`Go to vehicle slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Wash Type row — only for home/no-centre flows or when vehicle not yet chosen in service centre flow */}

        {isSubscriptionFlow && subscriptionValidationError && !subscriptionValidationLoading && (
          <p className="benefits-note benefits-note-error">
            {subscriptionValidationError}
          </p>
        )}

        {/* Select Address — home flow only */}
        {isHomeService && (
          <div
            className={`booking-info-card booking-address-card${selectedSavedAddress ? ' has-address' : ''}`}
            onClick={openAddressList}
          >
            <div className="booking-schedule">
              <span className="schedule-icon-svg" aria-hidden="true">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </span>
              <div className="schedule-text-col">
                <span className="schedule-date-text">
                  {selectedSavedAddress ? formatSavedAddress(selectedSavedAddress) : 'Select address'}
                </span>
                <span className={`schedule-time-text${selectedSavedAddress ? '' : ' muted'}`}>
                  {selectedSavedAddress ? 'Tap to change' : 'Where we come to wash'}
                </span>
              </div>
            </div>
            <button
              className="points-badge"
              onClick={(e) => { e.stopPropagation(); openAddressList(); }}
              aria-label="Select address"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            </button>
          </div>
        )}

        {/* Vehicle Number */}
        <div className="booking-summary-row">
          <div className="vehicle-input-section vehicle-input-full">
            <input
              type="text"
              value={vehicleNumber}
              onChange={(e) => {
                setVehicleNumber(e.target.value.toUpperCase());
                if (vehicleNumberError) setVehicleNumberError('');
              }}
              placeholder="Vehicle number (e.g., TN01AB1234)"
              className="vehicle-number-input"
            />
          </div>
        </div>

        {vehicleNumberError && (
          <p className="vehicle-number-error">{vehicleNumberError}</p>
        )}

        <div className="review-action-row">
          <button
            type="button"
            className="review-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Go back
          </button>
          <button className="review-btn" onClick={() => {
          const hasCentreAddress = !!(selectedCentre && (selectedCentreAddress || selectedCentre.area));
          if (!hasCentreAddress && (!selectedAddressId || !selectedSavedAddress)) {
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
          if (!selectedVehicle && rawServiceType !== 'SERVICE_CENTRE') {
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
            vehicleNumber
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
              waterOption: 'no-thanks',
              rawServiceType,
              subscription: selectedSubscription,
              subscriptionRedeemed: isSubscriptionApplied
            }
          });
        }}>
          Review
        </button>
        </div>
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
                        aria-label="Edit address"
                        title="Edit"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="address-item-delete"
                        onClick={() => handleDeleteAddress(addr.id)}
                        aria-label="Delete address"
                        title="Delete"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {selectedSavedAddress && (
              <label className="address-default-toggle">
                <input
                  type="checkbox"
                  checked={!!selectedSavedAddress.defaultAddress}
                  disabled={defaultTogglePending}
                  onChange={(e) => handleToggleDefaultForSelected(e.target.checked)}
                />
                <span>Save as default address</span>
              </label>
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

              <div className="address-form-row">
                <label className="address-form-checkbox-row">
                  <input
                    type="checkbox"
                    checked={!!addressForm.isDefault}
                    onChange={(e) => handleAddressFormChange('isDefault', e.target.checked)}
                  />
                  <span>Set as default address</span>
                </label>
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
