
import sys; sys.stdout.reconfigure(encoding='utf-8')
f = open(r'E:\Car wash\MainApp\src\pages\SelectCenter.jsx', encoding='utf-8')
lines = f.readlines(); f.close()
for i, line in enumerate(lines):
    if 'navigate' in line and 'booking' in line:
        for j in range(max(0,i-3), min(len(lines), i+12)):
            print(j+1, lines[j], end='')
        print('---')
