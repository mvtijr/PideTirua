from PIL import Image, ImageFilter
import os
import shutil

# Paths
bg_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\hero_cargo_truck_highway_sunset_1794078877888.jpg"
logo_path = r"transportes-fb/assets/logo-fb-3d-hd.png"

bg = Image.open(bg_path)
logo = Image.open(logo_path)

# 1. Upscale background to 4K UHD (3840 x 2144, 16:9)
target_w = 3840
target_h = int(target_w * (bg.height / bg.width))
print(f"Upscaling generated background to {target_w} x {target_h}...")

bg_2k = bg.resize((2048, int(2048 * (bg.height / bg.width))), Image.Resampling.LANCZOS)
bg_2k = bg_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))
bg_4k = bg_2k.resize((target_w, target_h), Image.Resampling.LANCZOS)
bg_4k = bg_4k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=80, threshold=2))

# Save 4K generated background
out_gen_webp = r"transportes-fb/assets/hero-bg-generated-4k.webp"
out_gen_jpg = r"transportes-fb/assets/hero-bg-generated-4k.jpg"
bg_4k.save(out_gen_webp, "WEBP", quality=95, method=6)
bg_4k.save(out_gen_jpg, "JPEG", quality=96, subsampling=0)
shutil.copyfile(out_gen_webp, r"public/transportes-fb/assets/hero-bg-generated-4k.webp")
shutil.copyfile(out_gen_jpg, r"public/transportes-fb/assets/hero-bg-generated-4k.jpg")

# 2. Composite with 3D logo on the left
comp = bg_4k.copy()
logo_w = 1750
logo_h = int(logo_w * (logo.height / logo.width))
logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

# Position: left area with breathing room
pos_x = 140
pos_y = (target_h - logo_h) // 2 - 80

comp.paste(logo_resized, (pos_x, pos_y), logo_resized)

# Save preview
comp_preview = comp.resize((1280, int(1280 * (target_h / target_w))), Image.Resampling.LANCZOS)
preview_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\preview_hero_generated_composite.png"
comp_preview.save(preview_path)
print("Saved preview to:", preview_path)
