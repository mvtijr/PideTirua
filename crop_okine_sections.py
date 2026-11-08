import os
from PIL import Image

src = r"C:\Users\Informatico\okine_full_live.png"
if os.path.exists(src):
    img = Image.open(src)
    print("Dimensions:", img.size)

    # 1. Compromiso (NUESTRO COMPROMISO heading in Nortune, body in MADE Okine Sans)
    crop_comp = img.crop((0, 750, 1440, 1350))
    p1 = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_compromiso_okine.png"
    crop_comp.save(p1)
    print("Saved:", p1)

    # 2. Claves de nuestro exito & Servicios integrales
    crop_claves = img.crop((0, 1350, 1440, 1950))
    p2 = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_claves_okine.png"
    crop_claves.save(p2)
    print("Saved:", p2)

    # 3. 3 Cards (Quiénes somos, Por qué elegirnos, Qué hacemos)
    crop_cards = img.crop((0, 1950, 1440, 2550))
    p3 = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_cards_okine.png"
    crop_cards.save(p3)
    print("Saved:", p3)

    # 4. Cotización
    crop_cot = img.crop((0, 2550, 1440, 3150))
    p4 = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_cotizacion_okine.png"
    crop_cot.save(p4)
    print("Saved:", p4)
