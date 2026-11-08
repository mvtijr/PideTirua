from PIL import Image
import os

src = r"C:\Users\Informatico\hero_1080p_live.png"
if os.path.exists(src):
    img = Image.open(src)
    crop_1080 = img.crop((0, 0, 1920, 1080))
    crop_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_1080p_live.png"
    crop_1080.save(crop_path)
    print("Saved 1080p crop!")
