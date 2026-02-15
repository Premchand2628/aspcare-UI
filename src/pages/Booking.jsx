import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Booking.css';

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
  
  // Calendar and time slot states
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date('2026-01-18'));
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('09:00-10:00');
  const [availability, setAvailability] = useState({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleNumberError, setVehicleNumberError] = useState('');
  const [waterOption, setWaterOption] = useState('no-thanks');
  const [rate, setRate] = useState({ amount: null, currency: 'INR' });
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [finalPrice, setFinalPrice] = useState(null);

  // Generate time slots from 7AM to 7PM
  const timeSlots = [
    '07:00-08:00', '08:00-09:00', '09:00-10:00', '10:00-11:00',
    '11:00-12:00', '12:00-13:00', '13:00-14:00', '14:00-15:00',
    '15:00-16:00', '16:00-17:00', '17:00-18:00', '18:00-19:00'
  ];

  const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatDateForApi = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot('');
    setShowCalendar(false);
    setShowTimeSlots(true);
    fetchAvailability(date, selectedCentre?.serviceType || 'HOME');
  };

  const handleTimeSlotSelect = (slot) => {
    setSelectedTimeSlot(slot);
    setShowTimeSlots(false);
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
        setAvailability(data || {});
        return;
      }

      setAvailability({});
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability({});
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
    if (!selectedVehicle || !washType) return;

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
  }, [selectedVehicle, washType]);

  // Recalculate price when water option changes
  useEffect(() => {
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
  }, [waterOption, rate]);

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
    console.log('Selected location:', {
      lat: suggestion.lat,
      lon: suggestion.lon,
      address: suggestion.display_name
    });
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

  const slotsToRender = Object.keys(availability).length
    ? Object.entries(availability)
    : timeSlots.map((slot) => [slot, true]);

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
            <span>Schedule: {formatDate(selectedDate)} {selectedTimeSlot}</span>
          </div>
          <div className="booking-wash-type">
            <span className="wash-icon">🧼</span>
            <span>Wash:</span>
            <select 
              value={washType} 
              onChange={(e) => setWashType(e.target.value)}
              className="wash-dropdown"
            >
              <option>Foam</option>
              <option>Basic</option>
              <option>Premium</option>
            </select>
            <span>Free left: 1</span>
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
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => handleDateSelect(new Date(e.target.value))}
                className="date-input"
                min={new Date().toISOString().split('T')[0]}
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
                onClick={() => setSelectedVehicle(vehicle.id)}
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
            />
            <label htmlFor="no-thanks">No Thanks</label>
          </div>
        </div>

        {/* Price Display and Vehicle Number */}
        <div className="booking-summary-row">
          <div className="price-display">
            <span className="price-label">Price:</span>
            <span className="price-value">
              {rateLoading ? 'Loading...' : formatRate(finalPrice, rate.currency)}
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
              waterOption
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
