# Script to inspect current index.html content so we extract all texts, phones, emails, and data
with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

print("Length of current page:", len(text))
# Check key data points
for item in ['+569 2610 8718', 'fbtransportespa@gmail.com', 'Fuentealba Bastida', 'FTL', 'LTL', 'Refrigerada']:
    print(f"'{item}' present?", item in text)
