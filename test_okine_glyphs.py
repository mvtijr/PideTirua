import os
from PIL import Image, ImageDraw, ImageFont

font_path = os.path.join('made_okine_extracted', 'MADEOkineSansPERSONALUSE-Regular.otf')
bold_path = os.path.join('made_okine_extracted', 'MADEOkineSansPERSONALUSE-Bold.otf')
med_path = os.path.join('made_okine_extracted', 'MADEOkineSansPERSONALUSE-Medium.otf')

# Test glyphs
test_text = "Transportes y Logística SpA: Flota moderna, puntualidad 99.4%, camión, gestión, Biobío, ¿cotización? ¡Listo!"
img = Image.new('RGB', (1000, 200), color=(7, 29, 58)) # Navy background
draw = ImageDraw.Draw(img)

f_reg = ImageFont.truetype(font_path, 24)
f_med = ImageFont.truetype(med_path, 24)
f_bold = ImageFont.truetype(bold_path, 28)

draw.text((30, 25), "MADE OKINE SANS BOLD:", font=f_bold, fill=(197, 160, 89))
draw.text((30, 75), test_text, font=f_med, fill=(255, 255, 255))
draw.text((30, 125), "Regular: Atención comercial de Lunes a Sábado. Monitoreo satelital 24/7.", font=f_reg, fill=(200, 210, 225))

preview_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_okine_render.png"
img.save(preview_path)
print("Saved preview to:", preview_path)
