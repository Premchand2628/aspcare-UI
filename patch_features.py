
# Step 1: Forward `service` through SelectCenter -> Booking in all 3 navigate calls
sc_path = r'E:\Car wash\MainApp\src\pages\SelectCenter.jsx'
f = open(sc_path, encoding='utf-8'); jsx = f.read(); f.close()

changes = [
    (
        "      state: {\n        selectedCentre: centre,\n        serviceType,\n        subscription,\n        source: location.state?.source || null,\n        prefilledCarType: location.state?.prefilledCarType || null\n      }",
        "      state: {\n        selectedCentre: centre,\n        serviceType,\n        subscription,\n        source: location.state?.source || null,\n        prefilledCarType: location.state?.prefilledCarType || null,\n        service: location.state?.service || null\n      }"
    ),
    (
        "              state: {\n              selectedCentre,\n              serviceType,\n              subscription,\n              source: location.state?.source || null,\n              prefilledCarType: location.state?.prefilledCarType || null\n            }",
        "              state: {\n              selectedCentre,\n              serviceType,\n              subscription,\n              source: location.state?.source || null,\n              prefilledCarType: location.state?.prefilledCarType || null,\n              service: location.state?.service || null\n            }"
    ),
    (
        "                                    state: {\n                                      selectedCentre: priceModalCentre,\n                                      serviceType,\n                                      subscription,\n                                      source: location.state?.source || null,\n                                      prefilledCarType: row.carType || vehicleKey,\n                                      prefilledWashType: row.washType,\n                                    }",
        "                                    state: {\n                                      selectedCentre: priceModalCentre,\n                                      serviceType,\n                                      subscription,\n                                      source: location.state?.source || null,\n                                      prefilledCarType: row.carType || vehicleKey,\n                                      prefilledWashType: row.washType,\n                                      service: location.state?.service || null,\n                                    }"
    ),
]

for old, new in changes:
    if old in jsx:
        jsx = jsx.replace(old, new, 1)
        print('SC navigate: OK')
    else:
        print('SC navigate: NOT FOUND')
        # try to find similar
        idx = jsx.find('selectedCentre: centre,')
        if idx != -1:
            print('  context:', repr(jsx[idx-20:idx+200]))

f = open(sc_path, 'w', encoding='utf-8'); f.write(jsx); f.close()

# Step 2: Patch Booking.jsx
bk_path = r'E:\Car wash\MainApp\src\pages\Booking.jsx'
f = open(bk_path, encoding='utf-8'); jsx = f.read(); f.close()

# 2a: Read selected service from location.state
old_prefill = "  const prefilledWashType = location.state?.prefilledWashType || '';"
new_prefill  = "  const prefilledWashType = location.state?.prefilledWashType || '';\n  const selectedService = location.state?.service || 'exterior';"
if old_prefill in jsx:
    jsx = jsx.replace(old_prefill, new_prefill, 1)
    print('Booking selectedService state: OK')
else:
    print('Booking selectedService state: NOT FOUND')

# 2b: Replace WASH_FEATURES with 2-level map
old_features = """  const WASH_FEATURES = {
    Basic:   ['Exterior rinse', 'Wheel clean', 'Window wipe', 'Air freshener'],
    Foam:    ['Foam exterior wash', 'Tyre & wheel clean', 'Interior vacuum', 'Mirror & window clean'],
    Premium: ['Full foam wash', 'Engine bay rinse', 'Interior detail & polish', 'Wax coating'],
  };"""

new_features = """  const WASH_FEATURES = {
    Basic: {
      exterior: ['Pressure wash', 'Rinse with Hand'],
      interior: ['Hand cleaning'],
      fullwash: ['Wash with hands', 'Rinse with Hand', 'Hand cleaning'],
      teflon:   ['Teflon'],
    },
    Foam: {
      exterior: ['Pressure wash', 'Foam wash', 'Mats'],
      interior: ['Steam wash', 'Mats'],
      fullwash: ['Pressure wash', 'Foam wash', 'Mats cleaning', 'Interior clean with Hands'],
      teflon:   ['Teflon', 'Air check', 'Free Air Freshner'],
    },
    Premium: {
      exterior: ['Pressure wash', 'Foam wash', 'Mats', 'Air check', 'One time fresher', 'Free Air fresher'],
      interior: ['Steam wash', 'Mats', 'Air check', 'One time fresher', 'Free Air fresher'],
      fullwash: ['Pressure wash', 'Foam wash', 'Steam wash', 'Mats', 'Air check', 'One time fresher', 'Free Air fresher'],
      teflon:   ['Teflon', 'Air check', 'Air freshner', 'Interior basic clean'],
    },
  };"""

if old_features in jsx:
    jsx = jsx.replace(old_features, new_features, 1)
    print('Booking WASH_FEATURES: OK')
else:
    print('Booking WASH_FEATURES: NOT FOUND')

# 2c: Update features lookup in render (was: WASH_FEATURES[type] || [])
old_lookup = "{(WASH_FEATURES[type] || []).map((f, fi) => ("
new_lookup  = "{(WASH_FEATURES[type]?.[selectedService] || []).map((f, fi) => ("
count = jsx.count(old_lookup)
jsx = jsx.replace(old_lookup, new_lookup)
print(f'Booking features render: replaced {count}')

f = open(bk_path, 'w', encoding='utf-8'); f.write(jsx); f.close()
print('Done. Booking lines:', jsx.count('\n'))
