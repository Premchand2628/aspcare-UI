import re, sys
sys.stdout.reconfigure(encoding='utf-8')

# Fix Review.jsx pill text - remove garbled bytes before @Home/@Service Centre/@Centre
with open('src/pages/Review.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the garbled pill line with clean version
content = re.sub(
    r'\{rawServiceType === [\'"]HOME[\'"]\s*\?[^:]+@Home[^:]+:\s*\(rawServiceType === [\'"]SERVICE_CENTRE[\'"]\s*\?[^:]+@Service Centre[^:]+:[^)]+@Centre[^)]+\)\}',
    "{rawServiceType === 'HOME' ? '@Home' : (rawServiceType === 'SERVICE_CENTRE' ? '@Service Centre' : '@Centre')}",
    content
)

with open('src/pages/Review.jsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Review.jsx pill fixed')

# Fix Review.css booking-label font-weight 700 -> 500
with open('src/styles/Review.css', 'r', encoding='utf-8') as f:
    css = f.read()

# Find and replace font-weight in .booking-label block only
css = re.sub(
    r'(\.booking-label \{[^}]*?)font-weight:\s*700',
    r'\1font-weight: 500',
    css
)

with open('src/styles/Review.css', 'w', encoding='utf-8') as f:
    f.write(css)
print('Review.css label weight 500 done')
print('Done.')
