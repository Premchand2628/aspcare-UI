f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', encoding='utf-8')
jsx = f.read(); f.close()

# ── 1. Add state vars ──────────────────────────────────────────────────────
old_state = "  const [showLocPicker, setShowLocPicker] = useState(null);\n"
new_state = (
    "  const [showLocPicker, setShowLocPicker] = useState(null);\n"
    "  const [lastCentreBooking, setLastCentreBooking] = useState(null);\n"
    "  const [lastHomeBooking, setLastHomeBooking] = useState(null);\n"
)
if old_state in jsx:
    jsx = jsx.replace(old_state, new_state, 1)
    print('state: OK')
else:
    print('state: NOT FOUND')

# ── 2. Expand applyBookingsToUi ────────────────────────────────────────────
old_apply = "  const applyBookingsToUi = (data) => setUpcomingBooking(getNextUpcomingBooking(data));\n"
new_apply = (
    "  const getLastBookingByType = (data, svcType) => {\n"
    "    if (!Array.isArray(data)) return null;\n"
    "    return data\n"
    "      .filter(b => String(b?.serviceType || '').toUpperCase().replace(/\\s/g, '_') === svcType && b?.bookingDate)\n"
    "      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))[0] || null;\n"
    "  };\n"
    "  const washLabel = (t) => { const w = String(t||'').trim(); if(w==='Basic') return 'Standard'; if(w==='Foam') return 'Deluxe'; return w||'Wash'; };\n"
    "  const washToService = (t) => { const w = String(t||'').toLowerCase(); if(w.includes('interior')) return 'interior'; if(w.includes('teflon')) return 'teflon'; if(w.includes('full')) return 'fullwash'; return 'exterior'; };\n"
    "  const applyBookingsToUi = (data) => {\n"
    "    setUpcomingBooking(getNextUpcomingBooking(data));\n"
    "    setLastCentreBooking(getLastBookingByType(data, 'SELF_DRIVE'));\n"
    "    setLastHomeBooking(getLastBookingByType(data, 'HOME'));\n"
    "  };\n"
)
if old_apply in jsx:
    jsx = jsx.replace(old_apply, new_apply, 1)
    print('applyBookingsToUi: OK')
else:
    print('applyBookingsToUi: NOT FOUND')

# ── 3. Replace location cards JSX ─────────────────────────────────────────
pin   = '\U0001f4cd'  # 📍
house = '\U0001f3e0'  # 🏠
dot   = ' \u00b7 '   # ·

old_cards = (
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('SELF_DRIVE')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">" + pin + "</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Centre</p>\n"
    "                  <p className=\"loc-val\">HSR Layout, Bengaluru</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('HOME')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">" + house + "</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Home</p>\n"
    "                  <p className=\"loc-val\">Koramangala, Bengaluru</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
)

new_cards = (
    "            <div className=\"loc-card\" onClick={() => handleSelectCenter('SELF_DRIVE')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">" + pin + "</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Centre</p>\n"
    "                  <p className=\"loc-val\">{lastCentreBooking\n"
    "                    ? washLabel(lastCentreBooking.washType) + (lastCentreBooking.carType ? '" + dot + "' + lastCentreBooking.carType : '')\n"
    "                    : 'No recent washes'}</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              {lastCentreBooking\n"
    "                ? <button className=\"loc-book-again\" onClick={(e) => { e.stopPropagation(); navigate('/booking', { state: { serviceType: 'SELF_DRIVE', service: washToService(lastCentreBooking.washType) } }); }}>Book Again</button>\n"
    "                : <span className=\"loc-chg\">Change</span>}\n"
    "            </div>\n"
    "            <div className=\"loc-card\" onClick={() => handleSelectCenter('HOME')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">" + house + "</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Home</p>\n"
    "                  <p className=\"loc-val\">{lastHomeBooking\n"
    "                    ? washLabel(lastHomeBooking.washType) + (lastHomeBooking.carType ? '" + dot + "' + lastHomeBooking.carType : '')\n"
    "                    : 'No recent washes'}</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              {lastHomeBooking\n"
    "                ? <button className=\"loc-book-again\" onClick={(e) => { e.stopPropagation(); navigate('/booking', { state: { serviceType: 'HOME', service: washToService(lastHomeBooking.washType) } }); }}>Book Again</button>\n"
    "                : <span className=\"loc-chg\">Change</span>}\n"
    "            </div>\n"
)

if old_cards in jsx:
    jsx = jsx.replace(old_cards, new_cards, 1)
    print('cards JSX: OK')
else:
    print('cards JSX: NOT FOUND')
    idx = jsx.find("handleSelectCenter('SELF_DRIVE')")
    print(repr(jsx[idx-20:idx+400]))

f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', 'w', encoding='utf-8')
f.write(jsx); f.close()
print('JSX done. Lines:', jsx.count('\n'))

# ── 4. CSS: add .loc-book-again ────────────────────────────────────────────
fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', encoding='utf-8')
css = fc.read(); fc.close()

old_chg = ".loc-chg  { font-size: 11px; font-weight: 700; color: var(--accent-lt); margin-top: 4px; padding-left: 22px; }"
new_chg = (
    ".loc-chg  { font-size: 11px; font-weight: 700; color: var(--accent-lt); margin-top: 4px; padding-left: 22px; }\n"
    ".loc-book-again {\n"
    "  margin-top: 6px; margin-left: 22px; padding: 4px 12px;\n"
    "  border-radius: 8px; background: var(--accent-lt); color: #fff;\n"
    "  border: none; font-size: 11px; font-weight: 700; cursor: pointer;\n"
    "  transition: opacity 0.15s;\n"
    "}\n"
    ".loc-book-again:hover { opacity: 0.85; }\n"
    ".home-page.light .loc-book-again { background: #2563eb; }"
)

if old_chg in css:
    css = css.replace(old_chg, new_chg, 1)
    print('CSS book-again: OK')
else:
    print('CSS book-again: NOT FOUND')
    idx = css.find('loc-chg')
    print(repr(css[idx:idx+200]))

fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', 'w', encoding='utf-8')
fc.write(css); fc.close()
print('CSS done')
