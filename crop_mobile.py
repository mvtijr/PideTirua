from PIL import Image
import os

src = r"C:\Users\Informatico\hero_mobile_live.png"
if os.path.exists(src):
    img = Image.open(src)
    crop_mobile = img.crop((0, 0, 412, 550))
    crop_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_mobile_live.png"
    crop_mobile.save(crop_path)
    print("Saved mobile crop!")
