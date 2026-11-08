with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = list(re.finditer(r'<h[1-5][^>]*>[^<]*CONTACTO[^<]*<\/h[1-5]>', text, re.I))
for m in matches:
    print("Found heading:", m.group(0))
    print("Context:", text[m.start()-50:m.end()+350])
