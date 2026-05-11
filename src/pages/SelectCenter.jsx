import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { withAuthHeader } from '../utils/auth';
import { readCache, writeCache, CACHE_KEYS } from '../utils/refDataCache';
import '../styles/SelectCenter.css';

const normalizeServiceType = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SELFDRIVE') return 'SELF_DRIVE';
  if (normalized === 'SELF DRIVE') return 'SELF_DRIVE';
  if (normalized === 'HOME') return 'HOME';
  if (normalized === 'SERVICE_CENTRE' || normalized === 'SERVICE_CENTER' || normalized === 'CENTRE' || normalized === 'CENTER') return 'SERVICE_CENTRE';
  if (normalized === 'TEFLON') return 'TEFLON';
  if (normalized === 'ASPCARE' || normalized === 'ASP_CARE' || normalized === 'ASP') return 'ASPCARE';
  return normalized || 'SERVICE_CENTRE';
};

// For HOME service we only show centres within this radius from the user.
const HOME_SERVICE_RADIUS_KM = 10;

// Header copy + image per service type. The header uses a leading '@' to match
// the existing visual style (e.g. '@service-center').
const SERVICE_TYPE_META = {
  SERVICE_CENTRE: { title: '@service-center', banner: '/images/servicecentre.png' },
  HOME:           { title: '@home',           banner: '/images/servicecentre.png' },
  TEFLON:         { title: '@teflon',         banner: '/images/servicecentre.png' },
  ASPCARE:        { title: '@asp-care',       banner: '/images/servicecentre.png' },
  SELF_DRIVE:     { title: '@service-center', banner: '/images/servicecentre.png' },
};

// Map service type -> the centre boolean flag(s) that must be true for the
// centre to be eligible. `center_both=true` means the centre offers both
// SERVICE_CENTRE and HOME, so it's eligible for either.
//
// Backwards-compat: if the centre row has NONE of the new flag fields at all
// (legacy data, backend not yet migrated), assume it offers HOME and
// SERVICE_CENTRE. TEFLON / ASPCARE are kept strict (opt-in only) because
// silently treating every centre as Teflon-capable would be wrong.
const centreOffersServiceType = (centre, type) => {
  if (!centre) return false;
  const homeFlag    = centre.center_home    ?? centre.centerHome;
  const serviceFlag = centre.center_service ?? centre.centerService;
  const bothFlag    = centre.center_both    ?? centre.centerBoth;
  const teflonFlag  = centre.center_teflon  ?? centre.centerTeflon;
  const aspFlag     = centre.center_asp     ?? centre.centerAsp;

  const noFlagsPresent =
    homeFlag === undefined &&
    serviceFlag === undefined &&
    bothFlag === undefined &&
    teflonFlag === undefined &&
    aspFlag === undefined;

  const both = Boolean(bothFlag);
  if (type === 'HOME')           return noFlagsPresent || both || Boolean(homeFlag);
  if (type === 'SERVICE_CENTRE') return noFlagsPresent || both || Boolean(serviceFlag);
  if (type === 'TEFLON')         return Boolean(teflonFlag);
  if (type === 'ASPCARE')        return Boolean(aspFlag);
  return true;
};

const normalizeKeyText = (value) => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');

const formatDateDisplay = (value) => {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  const day = String(parsed.getDate()).padStart(2, '0');
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const month = months[parsed.getMonth()];
  const year = parsed.getFullYear();
  return `${day}-${month}-${year}`;
};

const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractCoordinatesFromCentre = (centre) => {
  const directLat = toNumber(centre?.lat ?? centre?.latitude);
  const directLng = toNumber(centre?.lng ?? centre?.longitude ?? centre?.lon);
  if (directLat !== null && directLng !== null) {
    return { lat: directLat, lng: directLng };
  }

  const mapsUrl = String(centre?.maps_url || centre?.mapsUrl || centre?.mapsURL || '').trim();
  if (!mapsUrl) return null;

  const atPattern = mapsUrl.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (atPattern) {
    return {
      lat: Number(atPattern[1]),
      lng: Number(atPattern[2])
    };
  }

  const queryPattern = mapsUrl.match(/[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (queryPattern) {
    return {
      lat: Number(queryPattern[1]),
      lng: Number(queryPattern[2])
    };
  }

  const genericPattern = mapsUrl.match(/(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)/);
  if (genericPattern) {
    return {
      lat: Number(genericPattern[1]),
      lng: Number(genericPattern[2])
    };
  }

  return null;
};

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calculateDistanceKm = (from, to) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const formatDistance = (distanceKm) => {
  if (distanceKm === null || distanceKm === undefined || !Number.isFinite(distanceKm)) {
    return '';
  }
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};

const getCentreMapsUrl = (centre) => {
  const raw = String(centre?.maps_url || centre?.mapsUrl || centre?.mapsURL || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const VEHICLE_META = {
  BIKE:      { icon: '🏍️', label: 'Bike',      color: '#6a1b9a', bg: '#f3e5f5' },
  HATCHBACK: { icon: '🚗', label: 'Hatchback', color: '#1565c0', bg: '#e3f2fd' },
  SEDAN:     { icon: '🚙', label: 'Sedan',     color: '#00695c', bg: '#e0f2f1' },
  SUV:       { icon: '🛻', label: 'SUV',       color: '#e65100', bg: '#fff3e0' },
  MPV:       { icon: '🚐', label: 'MPV',       color: '#4527a0', bg: '#ede7f6' },
  PICKUP:    { icon: '🚚', label: 'Pickup',    color: '#4e342e', bg: '#efebe9' },
  TRUCK:     { icon: '🚛', label: 'Truck',     color: '#37474f', bg: '#eceff1' },
};

const formatBasePrice = (centre) => {
  const raw = centre?.basePrice ?? centre?.base_price;
  if (raw === null || raw === undefined || raw === '') return '';
  const num = Number(raw);
  if (!Number.isFinite(num)) return '';
  return Number.isInteger(num) ? `₹${num}` : `₹${num.toFixed(2)}`;
};

const SelectCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = location.state?.subscription || null;
  const serviceType = normalizeServiceType(location.state?.serviceType || subscription?.serviceType || 'SERVICE_CENTRE');
  const headerMeta = SERVICE_TYPE_META[serviceType] || SERVICE_TYPE_META.SERVICE_CENTRE;
  const isHomeService = serviceType === 'HOME';
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [centres, setCentres] = useState([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [loadingCentres, setLoadingCentres] = useState(false);
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [centreSlotCounts, setCentreSlotCounts] = useState({});
  const [loadingSlotCounts, setLoadingSlotCounts] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [priceModalCentre, setPriceModalCentre] = useState(null);
  const [priceModalRows, setPriceModalRows] = useState([]);
  const [priceModalLoading, setPriceModalLoading] = useState(false);
  const [priceModalError, setPriceModalError] = useState('');
  const centresListRef = useRef(null);

  // Fetch areas on component mount
  useEffect(() => {
    fetchAreas();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        setUserLocation(null);
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 120000
      }
    );
  }, []);

  // Fetch centres when area is selected. Re-fetch when the user's geo arrives
  // for HOME service (so we can apply the 10 km filter once we know where they
  // are).
  useEffect(() => {
    if (selectedArea) {
      fetchCentres(selectedArea);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, selectedDate, userLocation?.lat, userLocation?.lng, serviceType]);

  useEffect(() => {
    if (!selectedArea || loadingCentres) return;
    const timer = setTimeout(() => {
      centresListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(timer);
  }, [selectedArea, loadingCentres, centres.length]);

  const fetchAreas = async () => {
    const cached = readCache(CACHE_KEYS.AREAS);
    if (cached) { setAreas(cached); setLoadingAreas(false); return; }
    try {
      setLoadingAreas(true);
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });
      
      const response = await fetch('/centres/areas', {
        method: 'GET',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        setAreas(data);
        writeCache(CACHE_KEYS.AREAS, data);
      } else {
        console.error('Failed to fetch areas');
      }
    } catch (error) {
      console.error('Error fetching areas:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  // Apply the eligibility rules client-side as a fallback in case the backend
  // returns the un-filtered list (boolean-flag filter for all types, plus 10 km
  // radius for HOME). Once the backend honours `serviceType` + `lat/lng` these
  // become no-ops because the list will already be correct.
  const applyClientSideFilters = (list) => {
    // Only filter by the service-type capability flag. The 10 km HOME radius
    // check is intentionally NOT enforced here: the user has explicitly chosen
    // an area, and the backend already applies a radius filter server-side
    // when lat/lng/radiusKm are passed. Re-applying it client-side hides
    // centres in areas the user manually selected away from their GPS spot.
    return (list || []).filter((c) => centreOffersServiceType(c, serviceType));
  };

  const fetchCentres = async (area) => {
    // Cache key now includes serviceType + (rough) user lat/lng so HOME and
    // SERVICE_CENTRE results don't collide and the radius cache is per-location.
    const geoKey = isHomeService && userLocation
      ? `:${userLocation.lat.toFixed(2)},${userLocation.lng.toFixed(2)}`
      : '';
    const cacheKey = `${CACHE_KEYS.CENTRES}:${serviceType}:${area.toLowerCase()}${geoKey}`;
    const cached = readCache(cacheKey);
    if (cached) {
      const filtered = applyClientSideFilters(cached);
      setCentres(filtered);
      fetchCentreSlotCounts(filtered);
      setLoadingCentres(false);
      return;
    }
    try {
      setLoadingCentres(true);
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });

      const params = new URLSearchParams({ area, serviceType });
      if (isHomeService) {
        params.set('radiusKm', String(HOME_SERVICE_RADIUS_KM));
        if (userLocation) {
          params.set('lat', String(userLocation.lat));
          params.set('lng', String(userLocation.lng));
        }
      }

      const response = await fetch(`/centres/search?${params.toString()}`, {
        method: 'GET',
        headers
      });
      if (response.ok) {
        const data = await response.json();
        const normalizedCentres = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : Array.isArray(data?.data)
              ? data.data
              : [];
        const filtered = applyClientSideFilters(normalizedCentres);
        setCentres(filtered);
        writeCache(cacheKey, normalizedCentres);
        fetchCentreSlotCounts(filtered);
      } else {
        setCentres([]);
        setCentreSlotCounts({});
        console.error('Failed to fetch centres');
      }
    } catch (error) {
      console.error('Error fetching centres:', error);
      setCentres([]);
      setCentreSlotCounts({});
    } finally {
      setLoadingCentres(false);
    }
  };

  // ----- Price details modal -----
  // Calls GET /rates/centre/{centreId} on the carwashrates service. The
  // response is a Map<"VEHICLE|WASH", { centreId, vehicleType, washLevel,
  // amount, currency, source }> — i.e. the full effective price matrix
  // (default rates + per-centre overrides merged).
  const openPriceDetails = async (centre) => {
    setPriceModalCentre(centre);
    setPriceModalRows([]);
    setPriceModalError('');
    setPriceModalLoading(true);

    const centreId = getCentreId(centre);
    if (centreId === null || centreId === undefined) {
      setPriceModalError('Centre id is missing.');
      setPriceModalLoading(false);
      return;
    }

    try {
      const headers = withAuthHeader({ Accept: 'application/json' });
      const response = await fetch(`/rates/centre/${encodeURIComponent(String(centreId))}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        setPriceModalError('Price details are not available right now.');
        return;
      }

      const data = await response.json();
      // data is a Map keyed by "VEHICLE|WASH"; values are CentreRateResponse.
      const values = Array.isArray(data)
        ? data
        : (data && typeof data === 'object' ? Object.values(data) : []);

      const rows = values
        .map((r) => ({
          carType: r.vehicleType || r.carType || r.car_type,
          washType: r.washLevel || r.washType || r.wash_type,
          price: Number(r.amount ?? r.price ?? 0),
          currency: r.currency || 'INR'
        }))
        .filter((r) => r.carType && r.washType && Number.isFinite(r.price) && r.price > 0);

      if (!rows.length) {
        setPriceModalError('No prices configured for this centre.');
        return;
      }
      setPriceModalRows(rows);
    } catch (err) {
      console.error('price details fetch failed', err);
      setPriceModalError('Unable to load prices. Please try again.');
    } finally {
      setPriceModalLoading(false);
    }
  };

  const closePriceDetails = () => {
    setPriceModalCentre(null);
    setPriceModalRows([]);
    setPriceModalError('');
    setPriceModalLoading(false);
  };

  const getCentreId = (centre) => centre?.id ?? centre?.centreId ?? centre?.serviceCentreId ?? null;

  const getCentreName = (centre) => String(centre?.name ?? centre?.centreName ?? '').trim();

  const getCentreAddress = (centre) => String(centre?.address ?? centre?.centreAddress ?? '').trim();

  const getCentreKey = (centre) => {
    const centreId = getCentreId(centre);
    if (centreId !== null && centreId !== undefined) return `id:${centreId}`;
    const normalizedName = normalizeKeyText(getCentreName(centre));
    const normalizedAddress = normalizeKeyText(getCentreAddress(centre));
    return `name:${normalizedName}|addr:${normalizedAddress}`;
  };

  const appendCentreIdentityParams = (params, centre) => {
    const centreId = getCentreId(centre);
    const centreName = getCentreName(centre);
    const centreAddress = getCentreAddress(centre);

    if (centreId !== null && centreId !== undefined) {
      params.set('serviceCentreId', String(centreId));
    }
    if (centreName) {
      params.set('centreName', centreName);
    }
    if (centreAddress) {
      params.set('centreAddress', centreAddress);
    }
  };

  const buildAvailabilityParamStrategies = (centre, date) => {
    const base = { date, serviceType };
    const centreId = getCentreId(centre);
    const centreName = getCentreName(centre);
    const centreAddress = getCentreAddress(centre);
    const strategies = [];

    const full = new URLSearchParams(base);
    appendCentreIdentityParams(full, centre);
    strategies.push(full);

    if (centreId !== null && centreId !== undefined) {
      const idOnly = new URLSearchParams(base);
      idOnly.set('serviceCentreId', String(centreId));
      strategies.push(idOnly);
    }

    if (centreName) {
      const nameOnly = new URLSearchParams(base);
      nameOnly.set('centreName', centreName);
      strategies.push(nameOnly);
    }

    if (centreAddress) {
      const addressOnly = new URLSearchParams(base);
      addressOnly.set('centreAddress', centreAddress);
      strategies.push(addressOnly);
    }

    return strategies;
  };

  const fetchAvailabilityWithFallback = async (headers, centre, date) => {
    const strategies = buildAvailabilityParamStrategies(centre, date);

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
      return Object.values(data || {}).filter(Boolean).length;
    }

    return null;
  };

  const fetchCentreSlotCounts = async (centresList) => {
    if (!Array.isArray(centresList) || centresList.length === 0) {
      setCentreSlotCounts({});
      return;
    }

    setLoadingSlotCounts(true);
    try {
      const headers = withAuthHeader({
        Accept: 'application/json'
      });
      const date = selectedDate;

      const responses = await Promise.all(
        centresList.map(async (centre) => {
          const key = getCentreKey(centre);
          try {
            const availableCount = await fetchAvailabilityWithFallback(headers, centre, date);
            return { key, count: availableCount };
          } catch {
            return { key, count: null };
          }
        })
      );

      const nextCounts = {};
      responses.forEach(({ key, count }) => {
        nextCounts[key] = count;
      });
      setCentreSlotCounts(nextCounts);
    } finally {
      setLoadingSlotCounts(false);
    }
  };

  const handleSelectCentre = (centre) => {
    setSelectedCentre(centre);
    navigate('/booking', {
      state: {
        selectedCentre: centre,
        serviceType,
        subscription,
        source: location.state?.source || null,
        prefilledCarType: location.state?.prefilledCarType || null
      }
    });
  };

  const getCentreDistance = (centre) => {
    if (!userLocation) return null;
    const centreCoords = extractCoordinatesFromCentre(centre);
    if (!centreCoords) return null;
    return calculateDistanceKm(userLocation, centreCoords);
  };

  const renderCentreLocation = (centre) => {
    const distanceText = formatDistance(getCentreDistance(centre));
    const mapsUrl = getCentreMapsUrl(centre);

    const locationContent = (
      <>
        📍 {centre.area}
        {distanceText ? <span className="center-distance"> • {distanceText}</span> : null}
      </>
    );

    if (!mapsUrl) {
      return <p className="center-location">{locationContent}</p>;
    }

    return (
      <p className="center-location">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="center-location-link"
          onClick={(event) => event.stopPropagation()}
        >
          {locationContent}
        </a>
      </p>
    );
  };

  return (
    <div className="page-container">
      <div className="select-center-ux-header">
        <header className="select-center-header">
          <button className="back-btn" onClick={() => navigate(-1)}>←</button>
          <div className="header-copy">
            <h2 className="header-title">{headerMeta.title}</h2>
          </div>
        </header>
      </div>

      <div className="service-centre-hero">
        <div className="area-selection area-selection-overlay">
          <div className="center-filter-row">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="area-dropdown"
              disabled={loadingAreas}
            >
              <option value="">Choose an area...</option>
              {areas.map((area, index) => (
                <option key={index} value={area}>
                  {area}
                </option>
              ))}
            </select>

            <label
              className="center-date-icon-btn"
              htmlFor="center-slot-date"
              aria-label="Select date"
              title={`Selected date: ${formatDateDisplay(selectedDate)}`}
            >
              <span aria-hidden="true">🗓️</span>
              <input
                id="center-slot-date"
                type="date"
                className="center-date-overlay-input"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Select date"
              />
            </label>
          </div>
          <p className="center-filter-note">Check slot availability on preferred date &amp; location</p>
        </div>

        {(loadingCentres || selectedArea) && (
          <div className="centers-overlay-layer" ref={centresListRef}>
            {loadingCentres ? (
              <div className="loading-message loading-message-overlay">
                Loading service centres...
              </div>
            ) : (
              <div className="centers-list centers-list-overlay">
                {centres.length > 0 ? (
                  (() => {
                    const numericPrices = centres
                      .map(c => Number(c?.basePrice ?? c?.base_price))
                      .filter(n => Number.isFinite(n) && n > 0);
                    const minPrice = numericPrices.length ? Math.min(...numericPrices) : null;
                    const lowestCount = minPrice !== null
                      ? numericPrices.filter(n => n === minPrice).length
                      : 0;
                    return centres.map(centre => {
                      const slotCount = centreSlotCounts[getCentreKey(centre)];
                      let slotText;
                      if (loadingSlotCounts && (slotCount === undefined || slotCount === null)) {
                        slotText = 'Checking…';
                      } else if (slotCount === null || slotCount === undefined) {
                        slotText = '-- slots';
                      } else {
                        slotText = `${slotCount} slots`;
                      }
                      const priceText = formatBasePrice(centre);
                      const priceNum = Number(centre?.basePrice ?? centre?.base_price);
                      const isLowest = minPrice !== null
                        && numericPrices.length >= 2
                        && lowestCount === 1
                        && Number.isFinite(priceNum)
                        && priceNum === minPrice;
                      return (
                        <div
                          key={getCentreKey(centre)}
                          className={`center-item${isLowest ? ' is-lowest' : ''}`}
                          onClick={() => handleSelectCentre(centre)}
                        >
                          {isLowest && (
                            <span className="center-lowest-badge">🏆 Lowest price</span>
                          )}
                          <div className="center-card-header">
                            <div className="center-heading">
                              <h3 className="center-name">{centre.name}</h3>
                              {centre.rating && (
                                <span className="center-rating-chip">⭐ {centre.rating}</span>
                              )}
                            </div>
                            <div className="center-availability-pill">
                              <span className="center-availability-slots">{slotText}</span>
                              <span className="center-availability-date">{formatDateDisplay(selectedDate)}</span>
                            </div>
                          </div>
                          {renderCentreLocation(centre)}
                          <p className="center-address">{centre.address}</p>
                          <div className="center-card-footer">
                            {priceText ? (
                              <div className="center-price-block">
                                <span className="center-price-label">Starts at</span>
                                <span className="center-price-chip">{priceText}</span>
                              </div>
                            ) : <span />}
                            <button
                              type="button"
                              className="center-price-details-btn"
                              onClick={(e) => { e.stopPropagation(); openPriceDetails(centre); }}
                            >
                              ₹ Price details
                            </button>
                            <span className="center-select-hint">Select →</span>
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="no-centres-message no-centres-message-overlay">
                    {isHomeService
                      ? `No home-service centres available within ${HOME_SERVICE_RADIUS_KM} km of ${selectedArea}`
                      : `No service centres found in ${selectedArea}`}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Select Button */}
      {selectedCentre && (
        <button
          className="select-center-btn"
          onClick={() => navigate('/booking', {
            state: {
              selectedCentre,
              serviceType,
              subscription,
              source: location.state?.source || null,
              prefilledCarType: location.state?.prefilledCarType || null
            }
          })}
        >
          Continue with {selectedCentre.name}
        </button>
      )}

      {priceModalCentre && (
        <div
          className="price-details-modal-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closePriceDetails}
        >
          <div className="price-details-modal" onClick={(e) => e.stopPropagation()}>
            <header className="price-details-modal-header">
              <div>
                <h3>{priceModalCentre.name}</h3>
                <p className="price-details-modal-subtitle">
                  {isHomeService ? 'Home service prices' : 'Service centre prices'}
                </p>
              </div>
              <button
                type="button"
                className="price-details-modal-close"
                onClick={closePriceDetails}
                aria-label="Close price details"
              >
                ×
              </button>
            </header>

            <div className="price-details-modal-body">
              {priceModalLoading && <p className="price-details-loading">Loading prices…</p>}
              {!priceModalLoading && priceModalError && (
                <p className="price-details-error">{priceModalError}</p>
              )}
              {!priceModalLoading && !priceModalError && priceModalRows.length > 0 && (() => {
                const groups = {};
                const order = [];
                priceModalRows.forEach(row => {
                  const key = String(row.carType || '').trim().toUpperCase();
                  if (!groups[key]) { groups[key] = []; order.push(key); }
                  groups[key].push(row);
                });
                return (
                  <div className="price-vehicle-groups">
                    {order.map(vehicleKey => {
                      const rows = groups[vehicleKey];
                      const meta = VEHICLE_META[vehicleKey] || { icon: '🚗', label: vehicleKey, color: '#5e35b1', bg: '#f0ecfa' };
                      return (
                        <div key={vehicleKey} className="price-vehicle-card">
                          <div className="price-vehicle-header" style={{ background: meta.bg, borderColor: meta.color + '55' }}>
                            <span className="price-vehicle-icon">{meta.icon}</span>
                            <span className="price-vehicle-label" style={{ color: meta.color }}>{meta.label}</span>
                          </div>
                          <div className="price-vehicle-rows">
                            {rows.map((row, i) => {
                              const wk = String(row.washType || '').trim().toUpperCase();
                              const pillClass = wk === 'BASIC' ? 'price-details-wash-basic' : wk === 'FOAM' ? 'price-details-wash-foam' : wk === 'PREMIUM' ? 'price-details-wash-premium' : '';
                              const sym = row.currency === 'INR' ? '₹' : (row.currency || '₹');
                              const handlePriceSelect = () => {
                                closePriceDetails();
                                navigate('/booking', {
                                  state: {
                                    selectedCentre: priceModalCentre,
                                    serviceType,
                                    subscription,
                                    source: location.state?.source || null,
                                    prefilledCarType: row.carType || vehicleKey,
                                    prefilledWashType: row.washType,
                                  }
                                });
                              };
                              return (
                                <div
                                  key={i}
                                  className="price-vehicle-row price-vehicle-row-clickable"
                                  onClick={handlePriceSelect}
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => e.key === 'Enter' && handlePriceSelect()}
                                >
                                  <span className={`price-details-wash-pill ${pillClass}`}>{row.washType}</span>
                                  <div className="price-vehicle-amount">
                                    <span className="price-details-currency">{sym}</span>
                                    <span className="price-details-value">{row.price}</span>
                                    <span className="price-vehicle-select-hint">Book →</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <BottomNav active="none" />
    </div>
  );
};

export default SelectCenter;
