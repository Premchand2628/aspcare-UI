
import re

f = open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', encoding='utf-8')
jsx = f.read()
f.close()

print('File lines:', jsx.count('\n'))

# Step 1: Add washDisplayName helper - insert right before "const Home" or first component function
# Find a stable insertion point: after the last top-level const helper function before the component
# Look for normalizeWashType or normalizeCarType
insert_after = None
for pattern in ['const normalizeWashType', 'const normalizeServiceType', 'const normalizeCarType']:
    idx = jsx.find(pattern)
    if idx != -1:
        # find the end of this function (closing };)
        end = jsx.find('\n};\n', idx)
        if end != -1:
            insert_after = end + 4  # after ';\n'
            print(f'Will insert after {pattern} at char {insert_after}')
            print('Context:', repr(jsx[insert_after-10:insert_after+60]))
            break

if insert_after is None:
    print('ERROR: could not find insertion point')
    exit(1)

helper = (
    '\n// Display-only name mapping — backend values unchanged\n'
    'const washDisplayName = (t) => {\n'
    "  if (t === 'Basic') return 'Standard';\n"
    "  if (t === 'Foam') return 'Deluxe';\n"
    '  return t;\n'
    '};\n'
)

# Check not already inserted
if 'washDisplayName' not in jsx:
    jsx = jsx[:insert_after] + helper + jsx[insert_after:]
    print('Helper inserted')
else:
    print('Helper already present')

# Step 2: Replace all display-only {type} spots
# a) wash-plan-name: {type} Wash
old_a = 'className="wash-plan-name">{type} Wash</span>'
new_a = 'className="wash-plan-name">{washDisplayName(type)} Wash</span>'
count_a = jsx.count(old_a)
jsx = jsx.replace(old_a, new_a)
print(f'wash-plan-name: replaced {count_a}')

# b) wash-btn children: >\n                  {type}\n                </button>
# and >\n                      {type}\n                    </button>
# Use regex to catch all indentation variants inside wash-btn buttons
def replace_type_in_wash_btn(text):
    # Match: wash-btn button that renders bare {type}
    # Pattern: inside className="wash-btn..." onClick=... > whitespace {type} whitespace </button>
    pattern = r'(className=\{`wash-btn[^`]*`\}[^>]*>\s*)\{type\}(\s*</button>)'
    result, n = re.subn(pattern, r'\1{washDisplayName(type)}\2', text)
    print(f'wash-btn bare {{type}}: replaced {n}')
    return result

jsx = replace_type_in_wash_btn(jsx)

# c) subscription lock summary display
old_c = '{washType || normalizeWashType(selectedSubscription?.washType)}'
new_c = '{washDisplayName(washType || normalizeWashType(selectedSubscription?.washType))}'
count_c = jsx.count(old_c)
jsx = jsx.replace(old_c, new_c)
print(f'subscription lock: replaced {count_c}')

f2 = open(r'E:\Car wash\MainApp\src\pages\Booking.jsx', 'w', encoding='utf-8')
f2.write(jsx)
f2.close()
print('Done. Final lines:', jsx.count('\n'))
