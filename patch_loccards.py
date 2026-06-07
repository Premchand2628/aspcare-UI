
fj = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', encoding='utf-8')
jsx = fj.read(); fj.close()

old = (
    '          {/* LOCATION CARDS */}\n'
    '          <div className="location-row">\n'
)
new = (
    '          {/* LOCATION CARDS */}\n'
    '          <p className="loc-tagline">Your previous washes at</p>\n'
    '          <div className="location-row">\n'
)
if old in jsx:
    jsx = jsx.replace(old, new, 1)
    print('tagline: OK')
else:
    print('tagline: NOT FOUND')

fj = open(r'E:\Car wash\MainApp\src\pages\Home.jsx', 'w', encoding='utf-8')
fj.write(jsx); fj.close()

# CSS
fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', encoding='utf-8')
css = fc.read(); fc.close()

old_css = (
    '.location-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 100%; }\n'
    '.loc-card {\n'
    '  display: flex; align-items: center; gap: 10px;\n'
    '  background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px;\n'
    '  padding: 14px 12px; cursor: pointer; text-align: left; transition: border-color 0.2s;\n'
    '}\n'
    '.loc-card:hover { border-color: var(--accent-lt); }\n'
    '.loc-pin  { font-size: 18px; flex-shrink: 0; }\n'
    '.loc-info { flex: 1; min-width: 0; }\n'
    '.loc-type {\n'
    '  margin: 0; font-size: 11px; color: var(--txt-dim);\n'
    '  font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;\n'
    '}\n'
    '.loc-val  {\n'
    '  margin: 3px 0 0; font-size: 13px; font-weight: 700; color: var(--txt);\n'
    '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n'
    '}\n'
    '.loc-chg  { margin-left: auto; flex-shrink: 0; font-size: 12px; font-weight: 700; color: var(--accent-lt); }'
)
new_css = (
    '.loc-tagline { margin: 0 0 6px; font-size: 12px; color: var(--txt-sub); font-weight: 600; }\n'
    '.location-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }\n'
    '.loc-card {\n'
    '  display: flex; flex-direction: column; align-items: flex-start; gap: 2px;\n'
    '  background: var(--bg-card); border: 1.5px solid var(--border); border-radius: 14px;\n'
    '  padding: 10px 10px 8px; cursor: pointer; text-align: left; transition: border-color 0.2s;\n'
    '  overflow: hidden; min-width: 0;\n'
    '}\n'
    '.loc-card:hover { border-color: var(--accent-lt); }\n'
    '.loc-card-top { display: flex; align-items: center; gap: 6px; width: 100%; }\n'
    '.loc-pin  { font-size: 16px; flex-shrink: 0; }\n'
    '.loc-info { min-width: 0; flex: 1; }\n'
    '.loc-type {\n'
    '  margin: 0; font-size: 10px; color: var(--txt-dim);\n'
    '  font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;\n'
    '}\n'
    '.loc-val  {\n'
    '  margin: 1px 0 0; font-size: 12px; font-weight: 700; color: var(--txt);\n'
    '  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%;\n'
    '}\n'
    '.loc-chg  { font-size: 11px; font-weight: 700; color: var(--accent-lt); margin-top: 4px; padding-left: 22px; }'
)

if old_css in css:
    css = css.replace(old_css, new_css, 1)
    print('CSS loc: OK')
else:
    print('CSS loc: NOT FOUND')

fc = open(r'E:\Car wash\MainApp\src\styles\Home.css', 'w', encoding='utf-8')
fc.write(css); fc.close()
print('Done')
