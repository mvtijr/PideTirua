from PIL import Image
import os

src = r"C:\Users\Informatico\hero_2layer_mobile.png"
if os.path.exists(src):
    img = Image.open(src)
    crop_mobile = img.crop((0, 0, 412, 420))
    p = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_2layer_mobile.png"
    crop_mobile.save(p)
    print("Saved mobile preview:", p)
