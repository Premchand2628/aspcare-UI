
# ── CSS ─────────────────────────────────────────────────────────────────────
fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', encoding='utf-8')
css = fc.read(); fc.close()

# 1. location-row full width
css = css.replace(
    '.location-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }',
    '.location-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }',
    1
)

# 2. rew-btn book-now style
old_btn = (
    '.rew-btn {\n'
    '  margin-top: 10px; background: transparent; border: 1.5px solid var(--btn-bdr);\n'
    '  color: var(--txt); font-size: 12px; font-weight: 700; padding: 7px 14px;\n'
    '  border-radius: 9px; cursor: pointer; white-space: nowrap; transition: border-color 0.2s;\n'
    '  flex-shrink: 0;\n'
    '}'
)
new_btn = (
    '.rew-btn {\n'
    '  margin-top: 10px; background: transparent; border: 1.5px solid var(--btn-bdr);\n'
    '  color: var(--txt); font-size: 12px; font-weight: 700; padding: 7px 14px;\n'
    '  border-radius: 9px; cursor: pointer; white-space: nowrap; transition: border-color 0.2s, background 0.2s, color 0.2s;\n'
    '  flex-shrink: 0;\n'
    '}\n'
    '.rew-btn.book-now { background: #2563eb; border-color: #2563eb; color: #fff; }\n'
    '.home-page.dark .rew-btn.book-now { background: transparent; border-color: #fff; color: #fff; }'
)
if old_btn in css:
    css = css.replace(old_btn, new_btn, 1)
    print('CSS rew-btn: OK')
else:
    print('CSS rew-btn: NOT FOUND')

fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', 'w', encoding='utf-8')
fc.write(css); fc.close()

# ── JSX ─────────────────────────────────────────────────────────────────────
fj = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', encoding='utf-8')
jsx = fj.read(); fj.close()

# 3. rew-btn JSX: conditional Book Now
old_rew = (
    "              <button className=\"rew-btn\" onClick={() => navigate('/rewards-calculation')}>\n"
    "                View Progress \u203a\n"
    "              </button>"
)
new_rew = (
    "              <button\n"
    "                className={`rew-btn${!upcomingBooking ? ' book-now' : ''}`}\n"
    "                onClick={() => !upcomingBooking ? navigate('/booking') : navigate('/rewards-calculation')}\n"
    "              >\n"
    "                {!upcomingBooking ? 'Book Now' : 'View Progress \u203a'}\n"
    "              </button>"
)
if old_rew in jsx:
    jsx = jsx.replace(old_rew, new_rew, 1)
    print('JSX rew-btn: OK')
else:
    print('JSX rew-btn: NOT FOUND')
    idx = jsx.find('rew-btn')
    print('  found at:', idx, repr(jsx[idx:idx+150]))

# 4. mob offer card: always Deluxe/Premium
old_mob = (
    "                    Get 3 {deal.lowestPrice > 0 ? deal.carType : (i === 0 ? 'Deluxe' : 'Premium')} Washes\n"
    "                  </h3>"
)
new_mob = (
    "                    Get 3 {i === 0 ? 'Deluxe' : 'Premium'} Washes\n"
    "                  </h3>"
)
if old_mob in jsx:
    jsx = jsx.replace(old_mob, new_mob, 1)
    print('JSX mob offers: OK')
else:
    print('JSX mob offers: NOT FOUND')

# 5. desk deal card: always Deluxe/Premium
old_dsk = (
    "                  Get 3 {deal.lowestPrice > 0 ? deal.carType : (i === 0 ? 'Deluxe' : 'Premium')} Washes\n"
    "                </h4>"
)
new_dsk = (
    "                  Get 3 {i === 0 ? 'Deluxe' : 'Premium'} Washes\n"
    "                </h4>"
)
if old_dsk in jsx:
    jsx = jsx.replace(old_dsk, new_dsk, 1)
    print('JSX desk deals: OK')
else:
    print('JSX desk deals: NOT FOUND')

fj = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', 'w', encoding='utf-8')
fj.write(jsx); fj.close()
print('Done. JSX lines:', jsx.count('\n'))
