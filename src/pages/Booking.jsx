import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Booking.css';

const normalizeText = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, '_');

const normalizeServiceType = (value) => {
  const normalized = normalizeText(value);
  if (normalized === 'SELFDRIVE' || normalized === 'SELF_DRIVE') return 'SELF_DRIVE';
  if (normalized === 'HOME') return 'HOME';
  return normalized || 'HOME';
};

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

const normalizeWaterProvided = (value) => (String(value || '').trim().toUpperCase() === 'Y' ? 'Y' : 'N');

const getStoredPhone = () => {
  const possibleKeys = ['phone', 'userPhone', 'mobileNumber', 'mobile', 'contact'];
  for (const key of possibleKeys) {
    const value = localStorage.getItem(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return '';
};

const Booking = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedVehicle, setSelectedVehicle] = useState('HATCHBACK');
  const [washType, setWashType] = useState('Foam');
  const [locationPermission, setLocationPermission] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [searchAddress, setSearchAddress] = useState('KIMS Hospital, Old Bombay Highway, Ward 104 K');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(location.state?.selectedCentre || null);
  const [centreName, setCentreName] = useState('Home');
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markerRef = React.useRef(null);
  const dateInputRef = React.useRef(null);
  
  // Calendar and time slot states
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [availability, setAvailability] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [waterOption, setWaterOption] = useState('no-thanks');
  const [rate, setRate] = useState({ amount: null, currency: 'INR' });
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [finalPrice, setFinalPrice] = useState(null);
  const [subscriptionValidationLoading, setSubscriptionValidationLoading] = useState(false);
  const [subscriptionValidated, setSubscriptionValidated] = useState(false);
  const [subscriptionValidationError, setSubscriptionValidationError] = useState('');

  const selectedSubscription = location.state?.subscription || null;
  const isSubscriptionFlow = Boolean(selectedSubscription);
  const isSubscriptionApplied = isSubscriptionFlow && subscriptionValidated;

  // Generate time slots from 7AM to 7PM
  const timeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
    '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
    '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

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
    return normalizeServiceType(raw);
  };

  const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const resolvedServiceType = resolveServiceType();

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

      const keys = Object.keys(data);
      if (keys.length) {
        keys.forEach((slot) => {
          if (slot in base) base[slot] = Boolean(data[slot]);
        });
        return base;
      }
    }

    return base;
  };

  const handleEditDate = () => {
    setShowTimeSlots(false);
    setShowCalendar(true);
  };

  const fetchAvailability = async (date, serviceType) => {
    setLoadingSlots(true);
    try {
      const authToken = localStorage.getItem('authToken');
      const headers = {
        Accept: 'application/json'
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const dateParam = formatDateForApi(date);
      const response = await fetch(`/bookings/availability?date=${dateParam}&serviceType=${serviceType}`, {
        method: 'GET',
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setAvailability(normalizeAvailability(data));
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
    // Only request location permission if no centre is pre-selected
    if (!selectedCentre) {
      requestLocationPermission();
    }
  }, []);

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
    setWaterOption(normalizeWaterProvided(selectedSubscription.waterProvided) === 'Y' ? 'give-water' : 'no-thanks');
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

        const authToken = localStorage.getItem('authToken');
        const headers = {
          Accept: 'application/json'
        };
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

        const response = await fetch(`/memberships/deal-price-bookings/by-phone?phone=${encodeURIComponent(phone)}`, {
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

        const authToken = localStorage.getItem('authToken');
        const headers = {
          Accept: 'application/json'
        };
        if (authToken) {
          headers.Authorization = `Bearer ${authToken}`;
        }

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
    setSearchAddress(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setUserLocation({ latitude: lat, longitude: lng });
    updateMapLocation(lat, lng);
  };

  const vehicleTypes = [
    { id: 'HATCHBACK', name: 'HATCHBACK', desc: 'Compact car', icon: '🚗' },
    { id: 'SEDAN', name: 'SEDAN', desc: 'Standard car', icon: '🚗' },
    { id: 'SUV', name: 'SUV', desc: 'Sport Utility Vehicle', icon: '🚙' },
    { id: 'MPV', name: 'MPV', desc: 'Multi-Purpose Vehicle', icon: '🚙' },
    { id: 'PICKUP', name: 'PICKUP', desc: 'Pickup truck', icon: '🛻' },
    { id: 'BIKE', name: 'BIKE', desc: 'Motorcycle', icon: '🏍️' }
  ];

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

  const slotsToRender = availability
    ? Object.entries(availability)
    : timeSlots.map((slot) => [slot, false]);

  return (
    <div className="page-container">
      {/* Back Button & Address Search Header */}
      <div className="booking-header">
        <button className="back-btn-absolute" onClick={() => navigate(-1)}>←</button>
        <div className="header-address-search">
          <span className="map-location-icon">📍</span>
          <input 
            type="text"
            value={searchAddress} 
            onChange={handleAddressChange}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="header-address-input"
            placeholder="Enter your location..."
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="header-suggestions-dropdown">
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className="header-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-icon">📍</span>
                  <span className="suggestion-text">{suggestion.display_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Map Section */}
      <div className="map-section">
        <div ref={mapRef} className="map-container"></div>
      </div>

      {/* Booking Details */}
      <div className="booking-details">
        <div className="booking-info-card">
          <div className="booking-centre">
            <span className="centre-icon">🏢</span>
            <span className="centre-name">{centreName}</span>
          </div>
          <div className="booking-schedule">
            <span className="schedule-icon">📅</span>
            <span>
              Schedule: {selectedDate && selectedTimeSlot
                ? `${formatDate(selectedDate)} ${selectedTimeSlot}`
                : 'Select date and time'}
            </span>
          </div>
          <div className="booking-wash-type">
            <span className="wash-icon">🧼</span>
            <span>Wash:</span>
            <select 
              value={washType} 
              onChange={(e) => setWashType(e.target.value)}
              className="wash-dropdown"
              disabled={isSubscriptionApplied}
            >
              <option>Foam</option>
              <option>Basic</option>
              <option>Premium</option>
            </select>
          </div>
          <button className="points-badge" onClick={() => setShowCalendar(true)}>📅</button>
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
                onClick={() => dateInputRef.current?.showPicker?.()}
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
          <h3>Please choose your vehicle type</h3>
          <div className="vehicle-types">
            {vehicleTypes.map(vehicle => (
              <div 
                key={vehicle.id}
                className={`vehicle-type-card ${selectedVehicle === vehicle.id ? 'selected' : ''}`}
                onClick={() => {
                  if (!isSubscriptionApplied) {
                    setSelectedVehicle(vehicle.id);
                  }
                }}
              >
                {selectedVehicle === vehicle.id && (
                  <div className="check-icon">✓</div>
                )}
                <div className="vehicle-icon">{vehicle.icon}</div>
                <h4>{vehicle.name}</h4>
                <p>{vehicle.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Water Discount Option */}
        <div className="water-option-section">
          <div className="water-option">
            <input
              type="radio"
              id="give-water"
              name="water"
              value="give-water"
              checked={waterOption === 'give-water'}
              onChange={(e) => setWaterOption(e.target.value)}
              disabled={isSubscriptionApplied}
            />
            <label htmlFor="give-water">Get flat $100 by giving water</label>
          </div>
          <div className="water-option">
            <input
              type="radio"
              id="no-thanks"
              name="water"
              value="no-thanks"
              checked={waterOption === 'no-thanks'}
              onChange={(e) => setWaterOption(e.target.value)}
              disabled={isSubscriptionApplied}
            />
            <label htmlFor="no-thanks">No Thanks</label>
          </div>
        </div>

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
            <span className="price-value">
              {(rateLoading || subscriptionValidationLoading) ? 'Loading...' : formatRate(finalPrice, rate.currency)}
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
          if (!vehicleNumber.trim()) {
            setVehicleNumberError('Vehicle number is required');
            return;
          }          if (vehicleNumber.trim().length < 7) {
            setVehicleNumberError('Vehicle number must be at least 7 characters');
            return;
          }          navigate('/review', {
            state: {
              centreName,
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
    </div>
  );
};

export default Booking;
