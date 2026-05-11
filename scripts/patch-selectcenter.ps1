$ErrorActionPreference = 'Stop'
$f = "e:\Car wash\MainApp\src\pages\SelectCenter.jsx"
$c = [System.IO.File]::ReadAllText($f)

function Replace-Or-Fail([ref]$text, $old, $new, $label) {
    if (-not $text.Value.Contains($old)) {
        throw "MISS: $label"
    }
    $text.Value = $text.Value.Replace($old, $new)
    Write-Host "OK: $label"
}

# 1) Expand normalizeServiceType + add HOME_SERVICE_RADIUS_KM + SERVICE_TYPE_META + centreOffersServiceType
$old1 = "const normalizeServiceType = (value) => {`r`n  const normalized = String(value || '').trim().toUpperCase().replace(/\s+/g, '_');`r`n  if (normalized === 'SELFDRIVE') return 'SELF_DRIVE';`r`n  if (normalized === 'SELF DRIVE') return 'SELF_DRIVE';`r`n  if (normalized === 'HOME') return 'HOME';`r`n  return normalized || 'SELF_DRIVE';`r`n};"

$new1 = @"
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

// HOME service is restricted to centres within this radius from the user.
const HOME_SERVICE_RADIUS_KM = 10;

// Header copy per service type.
const SERVICE_TYPE_META = {
  SERVICE_CENTRE: { title: '@service-center' },
  HOME:           { title: '@home' },
  TEFLON:         { title: '@teflon' },
  ASPCARE:        { title: '@asp-care' },
  SELF_DRIVE:     { title: '@service-center' },
};

// Eligibility filter using the new center_home/service/both/teflon/asp boolean
// columns. Backwards-compat: rows that have NONE of these flag fields at all
// (legacy data, backend not yet migrated) are treated as eligible for HOME and
// SERVICE_CENTRE. TEFLON/ASPCARE remain strict (opt-in only).
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
"@.Replace("`n", "`r`n").TrimEnd("`r`n".ToCharArray())

Replace-Or-Fail ([ref]$c) $old1 $new1 "normalizeServiceType + helpers"

# 2) Add price-modal state right after some existing useState. Find a stable anchor.
$old2 = "  const centresListRef = useRef(null);"
$new2 = @"
  const centresListRef = useRef(null);

  // ---- Price details modal state ----
  const [priceModalCentre, setPriceModalCentre] = useState(null);
  const [priceModalRows, setPriceModalRows] = useState([]);
  const [priceModalLoading, setPriceModalLoading] = useState(false);
  const [priceModalError, setPriceModalError] = useState('');
"@.Replace("`n", "`r`n").TrimEnd("`r`n".ToCharArray())

if ($c.Contains($old2)) {
    Replace-Or-Fail ([ref]$c) $old2 $new2 "price modal state"
} else {
    Write-Host "WARN: centresListRef anchor not found, will try alt"
}

# 3) Add headerMeta + isHomeService inside component. Anchor on serviceType declaration.
$old3 = "  const serviceType = normalizeServiceType(location.state?.serviceType"
if ($c.Contains($old3)) {
    # replace the matched line + insert headerMeta after
    $idx = $c.IndexOf($old3)
    $eol = $c.IndexOf("`n", $idx)
    $line = $c.Substring($idx, $eol - $idx + 1)
    $insert = $line + "  const isHomeService = serviceType === 'HOME';`r`n  const headerMeta = SERVICE_TYPE_META[serviceType] || SERVICE_TYPE_META.SERVICE_CENTRE;`r`n"
    if (-not $c.Contains("const headerMeta")) {
        $c = $c.Substring(0, $idx) + $insert + $c.Substring($eol + 1)
        Write-Host "OK: headerMeta + isHomeService"
    }
} else {
    throw "MISS: serviceType anchor"
}

# 4) Update fetchCentres deps + body
$old4 = "  // Fetch centres when area is selected`r`n  useEffect(() => {`r`n    if (selectedArea) {`r`n      fetchCentres(selectedArea);`r`n    }`r`n  }, [selectedArea, selectedDate]);"
$new4 = "  // Fetch centres when area is selected. Also re-fetch when geo arrives so the`r`n  // 10 km HOME radius filter applies once we know the user's location.`r`n  useEffect(() => {`r`n    if (selectedArea) {`r`n      fetchCentres(selectedArea);`r`n    }`r`n    // eslint-disable-next-line react-hooks/exhaustive-deps`r`n  }, [selectedArea, selectedDate, userLocation?.lat, userLocation?.lng, serviceType]);"
Replace-Or-Fail ([ref]$c) $old4 $new4 "fetchCentres useEffect deps"

# 5) Replace the fetchCentres body — read original block from disk dynamically.
$old5Marker = '  const fetchCentres = async (area) => {'
$endMarker  = '  const getCentreId = (centre) =>'
$startIdx = $c.IndexOf($old5Marker)
$endIdx   = $c.IndexOf($endMarker)
if ($startIdx -lt 0 -or $endIdx -lt 0) { throw "MISS: fetchCentres bounds" }
$old5 = $c.Substring($startIdx, $endIdx - $startIdx)

$new5 = @'
  // Apply eligibility rules client-side as a fallback (boolean-flag filter for
  // all types, plus 10 km radius for HOME). Becomes a no-op once the backend
  // honours serviceType + lat/lng.
  const applyClientSideFilters = (list) => {
    let filtered = (list || []).filter((c) => centreOffersServiceType(c, serviceType));
    if (isHomeService && userLocation) {
      filtered = filtered.filter((c) => {
        const coords = extractCoordinatesFromCentre(c);
        // Don't drop centres with no parseable coords; only exclude when we
        // have coords AND they're outside the radius.
        if (!coords) return true;
        return calculateDistanceKm(userLocation, coords) <= HOME_SERVICE_RADIUS_KM;
      });
    }
    return filtered;
  };

  const fetchCentres = async (area) => {
    // Cache key includes serviceType + (rough) user lat/lng so HOME and
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

  // ---- Price details modal ----
  const openPriceDetails = async (centre) => {
    setPriceModalCentre(centre);
    setPriceModalRows([]);
    setPriceModalError('');
    setPriceModalLoading(true);

    const rateCode = centre.centre_code || centre.centreCode || centre.rate_center_code || centre.rateCenterCode;
    const centreId = getCentreId(centre);
    const serviceMode = isHomeService ? 'HOME' : 'SERVICE_CENTRE';

    try {
      const headers = withAuthHeader({ Accept: 'application/json' });
      const params = new URLSearchParams({ serviceMode });
      if (rateCode) params.set('rateCenterCode', rateCode);
      if (centreId !== null && centreId !== undefined) params.set('centreId', String(centreId));

      const response = await fetch(`/rates/centre?${params.toString()}`, {
        method: 'GET',
        headers
      });
      if (!response.ok) {
        setPriceModalError('Price details are not available right now.');
        return;
      }
      const data = await response.json();
      const rows = (Array.isArray(data) ? data : data?.rates || [])
        .map((r) => ({
          carType: r.carType || r.car_type || r.vehicleType,
          washType: r.washType || r.wash_type || r.washLevel,
          price: Number(r.price ?? r.amount ?? 0),
          currency: r.currency || 'INR'
        }))
        .filter((r) => r.carType && r.washType && Number.isFinite(r.price));
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
'@.Replace("`n", "`r`n").TrimEnd("`r`n".ToCharArray())

Replace-Or-Fail ([ref]$c) $old5 ($new5 + "`r`n`r`n") "fetchCentres body + price modal helpers"

# 6) Replace hardcoded h2 title
$old6 = '<h2 className="header-title">@service-center</h2>'
$new6 = '<h2 className="header-title">{headerMeta.title}</h2>'
Replace-Or-Fail ([ref]$c) $old6 $new6 "h2 dynamic title"

# 7) Add Price details button into card footer (right before center-select-hint span)
$old7 = '<span className="center-select-hint">Select â†’</span>'
$new7 = "<button`r`n                                type=`"button`"`r`n                                className=`"center-price-details-btn`"`r`n                                onClick={(e) => { e.stopPropagation(); openPriceDetails(centre); }}`r`n                              >`r`n                                ₹ Price details`r`n                              </button>`r`n                              <span className=`"center-select-hint`">Select →</span>"
if ($c.Contains($old7)) {
    Replace-Or-Fail ([ref]$c) $old7 $new7 "Price details button"
} else {
    # alternate without arrow encoding
    $alt = '<span className="center-select-hint">Select'
    if ($c.Contains($alt)) {
        Write-Host "WARN: arrow-encoded variant of select-hint exists; trying alt"
        $altOld = $c.Substring($c.IndexOf($alt), 60)
        Write-Host "got: [$altOld]"
    } else {
        throw "MISS: select-hint span"
    }
}

# 8) Add price modal JSX + closing — insert right before the BottomNav at the end. Find pattern.
$modalJsx = @'

      {priceModalCentre && (
        <div className="price-details-modal-overlay" onClick={closePriceDetails}>
          <div className="price-details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="price-details-modal-header">
              <div>
                <h3>{priceModalCentre.name || priceModalCentre.centreName || 'Centre prices'}</h3>
                <p className="price-details-modal-subtitle">
                  {isHomeService ? 'HOME service' : 'Service centre'} prices
                </p>
              </div>
              <button className="price-details-modal-close" onClick={closePriceDetails} aria-label="Close">×</button>
            </div>
            <div className="price-details-modal-body">
              {priceModalLoading && <p className="price-details-loading">Loading prices…</p>}
              {priceModalError && <p className="price-details-error">{priceModalError}</p>}
              {!priceModalLoading && !priceModalError && priceModalRows.length > 0 && (
                <table className="price-details-table">
                  <thead>
                    <tr><th>Car</th><th>Wash</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    {priceModalRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.carType}</td>
                        <td>{r.washType}</td>
                        <td>₹ {Math.round(r.price).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
'@.Replace("`n", "`r`n")

# Insert before <BottomNav  (find first occurrence)
$bnIdx = $c.IndexOf("<BottomNav")
if ($bnIdx -lt 0) { throw "MISS: <BottomNav anchor" }
# find line start
$lineStart = $c.LastIndexOf("`n", $bnIdx) + 1
$c = $c.Substring(0, $lineStart) + $modalJsx + $c.Substring($lineStart)
Write-Host "OK: price modal JSX inserted before BottomNav"

[System.IO.File]::WriteAllText($f, $c)
Write-Host "DONE writing SelectCenter.jsx"
