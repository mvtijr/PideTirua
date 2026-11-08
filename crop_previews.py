import os
from PIL import Image

src = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\screenshot_full_armstrong.png"
if os.path.exists(src):
    img = Image.open(src)
    print(f"Full image size: {img.size}")
    
    # Crop Hero (Y: 0 to 650)
    hero_crop = img.crop((0, 0, 1400, 650))
    hero_crop.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_armstrong.png")
    
    # Crop Compromiso (Y: 650 to 1200)
    comp_crop = img.crop((0, 650, 1400, 1200))
    comp_crop.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_compromiso_armstrong.png")
    
    # Crop Claves (Y: 1200 to 1800)
    claves_crop = img.crop((0, 1200, 1400, 1800))
    claves_crop.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_claves_armstrong.png")
    
    # Crop 3 cards (Y: 1800 to 2400)
    cards_crop = img.crop((0, 1800, 1400, 2400))
    cards_crop.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_cards_armstrong.png")
    
    print("Crops saved successfully!")
else:
    print("Screenshot file not found.")
