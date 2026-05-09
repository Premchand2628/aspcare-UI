import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import BottomNav from '../components/BottomNav';
import { withAuthHeader } from '../utils/auth';
import { readCache, writeCache, CACHE_KEYS } from '../utils/refDataCache';
import '../styles/SelectCenter.css';
import { CentresListSkeleton, LoadingAnnouncer } from '../components/Skeleton';

const normalizeServiceType = (value) => {
  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');
  if (normalized === 'SELFDRIVE') return 'SELF_DRIVE';
  if (normalized === 'SELF DRIVE') return 'SELF_DRIVE';
  if (normalized === 'HOME') return 'HOME';
  return normalized || 'SELF_DRIVE';
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

const formatBasePrice = (centre) => {
  const raw = centre?.basePrice ?? centre?.base_price;
  if (raw === null || raw === undefined || raw === '') return '';
  const num = Number(raw);
  if (!Number.isFinite(num)) return '';
  // Display whole numbers without decimals, otherwise keep 2 decimals.
  return Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
};

const getCentreMapsUrl = (centre) => {
  const raw = String(centre?.maps_url || centre?.mapsUrl || centre?.mapsURL || '').trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
};

const SelectCenter = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const subscription = location.state?.subscription || null;
  const serviceType = normalizeServiceType(location.state?.serviceType || subscription?.serviceType || 'SELF_DRIVE');
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

  // Fetch centres when area is selected
  useEffect(() => {
    if (selectedArea) {
      fetchCentres(selectedArea);
    }
  }, [selectedArea, selectedDate]);

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

  const fetchCentres = async (area) => {
    const cacheKey = CACHE_KEYS.CENTRES + ':' + area.toLowerCase();
    const cached = readCache(cacheKey);
    if (cached) {
      setCentres(cached);
      fetchCentreSlotCounts(cached);
      setLoadingCentres(false);
      return;
    }
    try {
      setLoadingCentres(true);
      const headers = withAuthHeader({
        'Accept': 'application/json'
      });
      
      const response = await fetch(`/centres/search?area=${encodeURIComponent(area)}`, {
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
        setCentres(normalizedCentres);
        writeCache(cacheKey, normalizedCentres);
        fetchCentreSlotCounts(normalizedCentres);
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
            <h2 className="header-title">@service-center</h2>
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
                <LoadingAnnouncer label="Loading service centres" />
                <CentresListSkeleton count={3} />
              </div>
            ) : (
              <div className="centers-list centers-list-overlay">
                {centres.length > 0 ? (
                  (() => {
                    // Find the lowest base price across the visible centres so we can tag it.
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
                      // Only show the "Lowest" badge when there is a meaningful comparison
                      // (more than one centre, exactly one minimum, and at least 2 priced centres).
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
                            <span className="center-lowest-badge">★ Lowest price</span>
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
                            <span className="center-select-hint">Select →</span>
                          </div>
                        </div>
                      );
                    });
                  })()
                ) : (
                  <div className="no-centres-message no-centres-message-overlay">
                    No service centres found in {selectedArea}
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

      <BottomNav active="none" />
    </div>
  );
};

export default SelectCenter;
