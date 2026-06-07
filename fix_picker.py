
jsx_path = r'E:\Car wash\MainApp\src\pages\Home.jsx'

with open(jsx_path, encoding='utf-8') as f:
    jsx = f.read()

results = []

# 1. Add showLocPicker state
old1 = "  const [activeService, setActiveService] = useState('exterior');"
new1 = "  const [activeService, setActiveService] = useState('exterior');\n  const [showLocPicker, setShowLocPicker] = useState(null);"
if old1 in jsx:
    jsx = jsx.replace(old1, new1, 1)
    results.append("state: OK")
else:
    results.append("state: NOT FOUND")

# 2. Change pill onClick — only replace the one inside service-pills section
old2 = "            onClick={() => setActiveService(s.key)}\n          >\n            <span className=\"pill-img-wrap\">"
new2 = "            onClick={() => setShowLocPicker(s.key)}\n          >\n            <span className=\"pill-img-wrap\">"
if old2 in jsx:
    jsx = jsx.replace(old2, new2, 1)
    results.append("pill: OK")
else:
    results.append("pill: NOT FOUND")

# 3. Change sidebar onClick
old3 = "              onClick={() => setActiveService(s.key)}\n            >\n              <img src={s.image}"
new3 = "              onClick={() => setShowLocPicker(s.key)}\n            >\n              <img src={s.image}"
if old3 in jsx:
    jsx = jsx.replace(old3, new3, 1)
    results.append("sidebar: OK")
else:
    results.append("sidebar: NOT FOUND")

# 4. Add overlay before chatbot bubble
old4 = "      <button className=\"chatbot-bubble\" onClick={() => navigate('/chatbot')}"
new4 = """      {/* LOCATION PICKER OVERLAY */}
      {showLocPicker && (
        <div className="loc-picker-overlay" onClick={() => setShowLocPicker(null)}>
          <div className="loc-picker-sheet" onClick={(e) => e.stopPropagation()}>
            <p className="lps-title">Book {serviceTypes.find((s) => s.key === showLocPicker)?.label}</p>
            <p className="lps-sub">Where would you like your wash?</p>
            <button
              className="lps-opt"
              onClick={() => {
                setActiveService(showLocPicker);
                setShowLocPicker(null);
                navigate('/select-center', { state: { serviceType: 'SELF_DRIVE', service: showLocPicker } });
              }}
            >
              <span className="lps-icon">📍</span>
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
              <span className="lps-icon">🏠</span>
              <div>
                <p className="lps-lbl">@ Home</p>
                <p className="lps-desc">We come to your doorstep</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* CHATBOT */}
      <button className="chatbot-bubble\""""
if old4 in jsx:
    jsx = jsx.replace(old4, new4, 1)
    results.append("overlay: OK")
else:
    results.append("overlay: NOT FOUND")

print('\n'.join(results))
with open(jsx_path, 'w', encoding='utf-8') as f:
    f.write(jsx)
print("Lines:", jsx.count('\n'))
