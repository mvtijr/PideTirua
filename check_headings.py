import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Check all h1-h5
headings = re.findall(r'<h[1-5][^>]*>[\s\S]*?<\/h[1-5]>', html)
print(f"Total headings (h1-h5): {len(headings)}")
for i, h in enumerate(headings):
    clean = re.sub(r'<[^>]+>', '', h).strip()
    clean = re.sub(r'\s+', ' ', clean)
    print(f" {i+1}. {clean}")
