import urllib.request
import zipfile
import os

url = 'https://dl.dafont.com/dl/?f=made_okine_sans'
zip_dest = 'made_okine_sans.zip'
extract_dest = 'made_okine_extracted'

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req) as resp, open(zip_dest, 'wb') as out_f:
    out_f.write(resp.read())

print(f"Downloaded {os.path.getsize(zip_dest)} bytes.")

os.makedirs(extract_dest, exist_ok=True)
with zipfile.ZipFile(zip_dest, 'r') as zf:
    zf.extractall(extract_dest)
    print("Files in zip:")
    for name in zf.namelist():
        print(" -", name)
