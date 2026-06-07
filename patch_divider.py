import sys
sys.stdout.reconfigure(encoding='utf-8')

filepath = r'E:\Car wash\MainApp\src\pages\OrderDetail.jsx'
with open(filepath, encoding='utf-8') as f:
    content = f.read()

# Add vertical divider between the two info cards
old = '          </div>\n        </div>\n        <div className="od-info-card">'
new = '          </div>\n        </div>\n        <div className="od-info-vdivider"></div>\n        <div className="od-info-card">'

if old in content:
    content = content.replace(old, new, 1)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Divider added OK')
else:
    # Check what's there
    idx = content.find('SERVICE TYPE')
    print('NOT FOUND')
    print(repr(content[idx:idx+300]))
