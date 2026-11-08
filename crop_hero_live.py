import os
from PIL import Image

src = r"C:\Users\Informatico\hero_4k_live.png"
if os.path.exists(src):
    img = Image.open(src)
    print("Dimensions:", img.size)
    crop_hero = img.crop((0, 0, 1440, 920))
    crop_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_4k_live.png"
    crop_hero.save(crop_path)
    print("Saved crop:", crop_path)
