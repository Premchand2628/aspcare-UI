
import sys; sys.stdout.reconfigure(encoding='utf-8')

# ── Fix 1: Booking.jsx — extend wash-plan condition to include SELF_DRIVE ──
f = open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', encoding='utf-8')
jsx = f.read(); f.close()

idx = jsx.find("(selectedCentre || isHomeService) ? (")
if idx >= 0:
    jsx = jsx[:idx] + "(selectedCentre || isHomeService || rawServiceType === 'SELF_DRIVE') ? (" + jsx[idx + len("(selectedCentre || isHomeService) ? ("):]
    print('Booking condition: OK')
else:
    print('Booking condition: NOT FOUND')

f = open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', 'w', encoding='utf-8')
f.write(jsx); f.close()

# ── Fix 2: Home.jsx — add prefill fields to Book Again navigate calls ──
f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', encoding='utf-8')
jsx2 = f.read(); f.close()

old_c = "navigate('/booking', { state: { serviceType: 'SELF_DRIVE', service: washToService(lastCentreBooking.washType) } })"
new_c = "navigate('/booking', { state: { serviceType: 'SELF_DRIVE', service: washToService(lastCentreBooking.washType), prefilledCarType: lastCentreBooking.carType || '', prefilledWashType: lastCentreBooking.washType || '' } })"
if old_c in jsx2:
    jsx2 = jsx2.replace(old_c, new_c, 1)
    print('Centre Book Again: OK')
else:
    print('Centre Book Again: NOT FOUND')

old_h = "navigate('/booking', { state: { serviceType: 'HOME', service: washToService(lastHomeBooking.washType) } })"
new_h = "navigate('/booking', { state: { serviceType: 'HOME', service: washToService(lastHomeBooking.washType), prefilledCarType: lastHomeBooking.carType || '', prefilledWashType: lastHomeBooking.washType || '' } })"
if old_h in jsx2:
    jsx2 = jsx2.replace(old_h, new_h, 1)
    print('Home Book Again: OK')
else:
    print('Home Book Again: NOT FOUND')

f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', 'w', encoding='utf-8')
f.write(jsx2); f.close()
print('Done')

# Discard rest of old file content below this line
raise SystemExit(0)

jsx_path = r'E:\Car wash\MainApp\src\pages\Home.jsx'

with open(jsx_path, encoding='utf-8') as f:
    jsx = f.read()

results = []

# 1. Add showLocPicker state (skip if already added)
old1 = "  const [activeService, setActiveService] = useState('exterior');\n  const [showLocPicker, setShowLocPicker] = useState(null);"
if old1 in jsx:
    results.append("state: already done")
else:
    old1b = "  const [activeService, setActiveService] = useState('exterior');"
    new1b = "  const [activeService, setActiveService] = useState('exterior');\n  const [showLocPicker, setShowLocPicker] = useState(null);"
    if old1b in jsx:
        jsx = jsx.replace(old1b, new1b, 1)
        results.append("state: OK")
    else:
        results.append("state: NOT FOUND")

# 2. Pill onClick (skip if already done)
if "setShowLocPicker(s.key)" in jsx:
    results.append("pill+sidebar: already done")
else:
    old2 = "            onClick={() => setActiveService(s.key)}\n          >\n            <span className=\"pill-img-wrap\">"
    new2 = "            onClick={() => setShowLocPicker(s.key)}\n          >\n            <span className=\"pill-img-wrap\">"
    if old2 in jsx:
        jsx = jsx.replace(old2, new2, 1)
        results.append("pill: OK")
    else:
        results.append("pill: NOT FOUND — " + repr(jsx[jsx.find('pill-img-wrap')-120:jsx.find('pill-img-wrap')+10]))

    old3 = "              onClick={() => setActiveService(s.key)}\n            >\n              <img src={s.image}"
    new3 = "              onClick={() => setShowLocPicker(s.key)}\n            >\n              <img src={s.image}"
    if old3 in jsx:
        jsx = jsx.replace(old3, new3, 1)
        results.append("sidebar: OK")
    else:
        results.append("sidebar: NOT FOUND")

# 3. Add overlay before chatbot bubble (skip if already there)
if 'loc-picker-overlay' in jsx:
    results.append("overlay: already done")
else:
    anchor = "      <button className=\"chatbot-bubble\""
    overlay = """      {/* LOCATION PICKER OVERLAY */}
      {showLocPicker && (
        <div className="loc-picker-overlay" onClick={() => setShowLocPicker(null)}>
          <div className="loc-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="lps-title">
              Book {serviceTypes.find((s) => s.key === showLocPicker)?.label}
            </p>
            <p className="lps-sub">Where would you like your wash?</p>
            <button
              className="lps-opt"
              onClick={() => {
                setActiveService(showLocPicker);
                setShowLocPicker(null);
                navigate('/select-center', { state: { serviceType: 'SELF_DRIVE', service: showLocPicker } });
              }}
            >
              <span className="lps-icon">&#128205;</span>
              <div>
                <p className="lps-lbl">@ Centre</p>
                <p className="lps-desc">Drive to nearest wash centre</p>
              </div>
            </button>
            <button
              className="lps-opt"
              onClick={() => {
                setActiveService(showLocPicker);
                setShowLocPicker(null);
                navigate('/select-center', { state: { serviceType: 'HOME', service: showLocPicker } });
              }}
            >
              <span className="lps-icon">&#127968;</span>
              <div>
                <p className="lps-lbl">@ Home</p>
                <p className="lps-desc">We come to your doorstep</p>
              </div>
            </button>
          </div>
        </div>
      )}

"""
    if anchor in jsx:
        jsx = jsx.replace(anchor, overlay + anchor, 1)
        results.append("overlay: OK")
    else:
        results.append("overlay: NOT FOUND — " + repr(jsx[jsx.find('chatbot')-30:jsx.find('chatbot')+60]))

print('\n'.join(results))
with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(jsx)
print("Total lines:", jsx.count('\n'))
