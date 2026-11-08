with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re
matches = re.findall(r'(prevSlide|nextSlide)[\s\S]{0,300}', text)
for m in matches:
    print(m)
