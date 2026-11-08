import os
from PIL import Image

src = r"C:\Users\Informatico\armstrong_live.png"
if os.path.exists(src):
    img = Image.open(src)
    print("Screenshot loaded! Dimensions:", img.size)
    
    # 1. Hero Crop (Hero 3D logo & slogan)
    # Typically 0 to 650
    crop_hero = img.crop((0, 0, 1440, 650))
    hero_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_armstrong.png"
    crop_hero.save(hero_path)
    print("Saved:", hero_path)

    # 2. Compromiso Crop (NUESTRO COMPROMISO heading + subtitle)
    # Typically 650 to 1250
    crop_comp = img.crop((0, 650, 1440, 1250))
    comp_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_compromiso_armstrong.png"
    crop_comp.save(comp_path)
    print("Saved:", comp_path)

    # 3. Claves de Nuestro Exito & Servicios Integrales
    # Typically 1250 to 1850
    crop_claves = img.crop((0, 1250, 1440, 1850))
    claves_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_claves_armstrong.png"
    crop_claves.save(claves_path)
    print("Saved:", claves_path)

    # 4. Tres tarjetas (Quiénes Somos, Por qué elegirnos, Qué hacemos)
    crop_cards = img.crop((0, 1850, 1440, 2400))
    cards_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_cards_armstrong.png"
    crop_cards.save(cards_path)
    print("Saved:", cards_path)

else:
    print("File not found:", src)
