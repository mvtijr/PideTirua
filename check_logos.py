from PIL import Image

for name in ['logo-fb-horizontal-transparent.png', 'logo-fb-hero-white-gold.png', 'logo-fb.jpg']:
    p = f"transportes-fb/assets/{name}"
    im = Image.open(p)
    print(name, im.size, im.mode)
    im.resize((400, int(400 * im.height / im.width))).save(f"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/preview_{name}")
