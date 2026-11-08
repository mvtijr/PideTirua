with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find all headings with their following paragraphs
pattern = re.compile(r'(<h[1-5][^>]*>[\s\S]*?<\/h[1-5]>\s*(?:<div[^>]*>\s*<\/div>\s*)*(?:<p[^>]*>[\s\S]*?<\/p>)+)', re.IGNORECASE)
matches = pattern.findall(text)
print(f"Total heading + p groups found: {len(matches)}")
for idx, m in enumerate(matches):
    print(f"\n=== MATCH {idx+1} ===")
    print(m[:400])
