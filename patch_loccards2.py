
f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', encoding='utf-8')
jsx = f.read(); f.close()

old = (
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('SELF_DRIVE')}>\n"
    "              <span className=\"loc-pin\">\U0001f4cd</span>\n"
    "              <div className=\"loc-info\">\n"
    "                <p className=\"loc-type\">Centre</p>\n"
    "                <p className=\"loc-val\">HSR Layout, Bengaluru</p>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('HOME')}>\n"
    "              <span className=\"loc-pin\">\U0001f3e0</span>\n"
    "              <div className=\"loc-info\">\n"
    "                <p className=\"loc-type\">Home</p>\n"
    "                <p className=\"loc-val\">Koramangala, Bengaluru</p>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
)
new = (
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('SELF_DRIVE')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">\U0001f4cd</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Centre</p>\n"
    "                  <p className=\"loc-val\">HSR Layout, Bengaluru</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
    "            <button className=\"loc-card\" onClick={() => handleSelectCenter('HOME')}>\n"
    "              <div className=\"loc-card-top\">\n"
    "                <span className=\"loc-pin\">\U0001f3e0</span>\n"
    "                <div className=\"loc-info\">\n"
    "                  <p className=\"loc-type\">Home</p>\n"
    "                  <p className=\"loc-val\">Koramangala, Bengaluru</p>\n"
    "                </div>\n"
    "              </div>\n"
    "              <span className=\"loc-chg\">Change</span>\n"
    "            </button>\n"
)

if old in jsx:
    jsx = jsx.replace(old, new, 1)
    print('cards: OK')
else:
    print('cards: NOT FOUND')
    # debug — show what's around SELF_DRIVE
    idx = jsx.find("handleSelectCenter('SELF_DRIVE')")
    print(repr(jsx[idx-20:idx+300]))

f = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', 'w', encoding='utf-8')
f.write(jsx); f.close()
print('Done')
