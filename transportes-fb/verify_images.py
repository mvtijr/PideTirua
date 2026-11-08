import os
import re

with open('transportes-fb/stitch.html', 'r', encoding='utf-8') as f:
    content = f.read()

img_srcs = re.findall(r'src=["\']([^"\']+)["\']', content)
print('Total image sources in stitch.html:', len(img_srcs))
for src in img_srcs:
    print('Image src:', src)
    if not src.startswith('http'):
        path = os.path.join('transportes-fb', src.replace('/', os.sep))
        exists = os.path.exists(path)
        print('  -> Local file exists?', exists, path)
