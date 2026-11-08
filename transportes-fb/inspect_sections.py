import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all sections and their background colors / content
section_matches = list(re.finditer(r'<section([^>]*)>([\s\S]*?)</section>', html))
print(f"Total sections found: {len(section_matches)}")

for idx, m in enumerate(section_matches):
    attrs = m.group(1)
    body = m.group(2)
    s_id = "no-id"
    id_m = re.search(r'id=["\']([^"\']+)["\']', attrs)
    if id_m: s_id = id_m.group(1)
    
    has_canvas = '<canvas' in body
    is_white_or_light = any(k in attrs for k in ['bg-white', 'bg-fb-smoke', 'bg-slate', 'bg-gray', '#FFFFFF', '#F'])
    print(f"[{idx+1}] #{s_id} - Canvas: {has_canvas} - Light/White bg: {is_white_or_light}")
    if has_canvas:
        # Check if canvas is before or after content
        canvas_pos = body.find('<canvas')
        text_pos = body.find('<h')
        print(f"    Canvas pos: {canvas_pos}, First heading pos: {text_pos}")
