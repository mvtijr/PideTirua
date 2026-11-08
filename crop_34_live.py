from PIL import Image
import os

src = r"C:\Users\Informatico\hero_34_live.png"
if os.path.exists(src):
    img = Image.open(src)
    crop = img.crop((0, 0, 1440, 850))
    p = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_34_live.png"
    crop.save(p)
    print("Saved live preview:", p)
