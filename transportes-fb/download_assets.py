import re
import urllib.request
import os

with open('transportes-fb/stitch-source.html', 'r', encoding='utf-8') as f:
    html = f.read()

urls = re.findall(r'https?://[^\s"\'<>]+', html)
unique_urls = sorted(list(set(urls)))

print(f"Total unique URLs: {len(unique_urls)}")
os.makedirs('transportes-fb/assets/stitch', exist_ok=True)

img_map = {}
idx = 1
for u in unique_urls:
    if 'lh3.googleusercontent.com' in u or 'images.unsplash.com' in u:
        ext = '.jpg'
        if 'png' in u: ext = '.png'
        filename = f"stitch-img-{idx}{ext}"
        filepath = os.path.join('transportes-fb/assets/stitch', filename)
        print(f"Downloading [{idx}]: {u[:80]}... -> {filename}")
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as resp, open(filepath, 'wb') as out:
                out.write(resp.read())
            img_map[u] = f"assets/stitch/{filename}"
            idx += 1
        except Exception as e:
            print(f"Error downloading {u}: {e}")

print(f"Successfully downloaded {len(img_map)} assets!")

# Replace URLs with local downloaded assets in stitch-source.html or combined index.html
new_html = html
for remote, local in img_map.items():
    new_html = new_html.replace(remote, local)

# Also check if local official assets can replace placeholders:
# Official logo: assets/logo-fb.jpg
# Official truck: assets/hero-truck.jpg
# Official team: assets/team-brochure.jpg
# Official qr: assets/instagram-qr.jpg

with open('transportes-fb/stitch-local.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Saved updated HTML to transportes-fb/stitch-local.html")
