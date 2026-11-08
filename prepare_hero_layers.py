from PIL import Image, ImageFilter, ImageEnhance
import os
import shutil

# Paths
p_logo = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073622101_71b894f7.png"
p_bg = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073631943_c32fa392.jpg"

img_logo = Image.open(p_logo)
img_bg = Image.open(p_bg)

# 1. Background processing: Native ratio is 1024 / 434 (~ 2.359:1, 21:9)
# Upscale to 4K Ultra-wide: 3840 x 1628
bg_4k_w, bg_4k_h = 3840, int(3840 * (434 / 1024))
print(f"Upscaling background to {bg_4k_w} x {bg_4k_h}...")

# 2-step upscale with Lanczos
bg_2k = img_bg.resize((2048, int(2048 * (434/1024))), Image.Resampling.LANCZOS)
bg_2k = bg_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))
bg_4k = bg_2k.resize((bg_4k_w, bg_4k_h), Image.Resampling.LANCZOS)
bg_4k = bg_4k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=90, threshold=2))

out_bg_webp = "transportes-fb/assets/hero-bg-ruta.webp"
out_bg_jpg = "transportes-fb/assets/hero-bg-ruta.jpg"
bg_4k.save(out_bg_webp, "WEBP", quality=95, method=6)
bg_4k.save(out_bg_jpg, "JPEG", quality=96, subsampling=0)

# 2. Logo processing: Native is 1024 x 682
# Upscale to 2048 x 1364 with crisp alpha channel
logo_2x_w, logo_2x_h = 2048, 1364
print(f"Upscaling transparent logo to {logo_2x_w} x {logo_2x_h}...")
logo_2x = img_logo.resize((logo_2x_w, logo_2x_h), Image.Resampling.LANCZOS)
# Subtle unsharp mask to boost crisp metallic edges
logo_sharp = logo_2x.filter(ImageFilter.UnsharpMask(radius=1.2, percent=110, threshold=2))

out_logo_webp = "transportes-fb/assets/logo-fb-3d-hd.webp"
out_logo_png = "transportes-fb/assets/logo-fb-3d-hd.png"
logo_sharp.save(out_logo_webp, "WEBP", lossless=True)
logo_sharp.save(out_logo_png, "PNG")

# Distribute to public/
for f in [out_bg_webp, out_bg_jpg, out_logo_webp, out_logo_png]:
    shutil.copyfile(f, os.path.join("public", f))

print("Assets saved and copied to public successfully!")

# Let's create a test composition in PIL to visualize the hero
comp = bg_4k.copy()
# Logo scaled to fit comfortably on the left side of the hero (width ~ 1600px)
target_logo_w = 1700
target_logo_h = int(target_logo_w * (682 / 1024))
logo_fit = logo_sharp.resize((target_logo_w, target_logo_h), Image.Resampling.LANCZOS)

# Position: X: 150, Y: centered vertically
pos_x = 120
pos_y = (bg_4k_h - target_logo_h) // 2 - 40

# Add drop shadow to logo for realistic grounding
comp.paste(logo_fit, (pos_x, pos_y), logo_fit)
comp_small = comp.resize((1280, int(1280 * (bg_4k_h / bg_4k_w))), Image.Resampling.LANCZOS)
preview_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_hero_two_layers.png"
comp_small.save(preview_path)
print("Saved preview to:", preview_path)
