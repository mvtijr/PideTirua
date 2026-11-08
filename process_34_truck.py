from PIL import Image, ImageFilter
import os
import shutil

src_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\logistics_hero_truck_sunset_1794098982203.jpg"
img = Image.open(src_path)

# 1. Upscale to 4K UHD: 3840 x 2143 (exact 16:9 ratio)
target_w = 3840
target_h = int(target_w * (img.height / img.width))
print(f"Upscaling 3/4 truck background to {target_w} x {target_h}...")

img_2k = img.resize((2048, int(2048 * (img.height / img.width))), Image.Resampling.LANCZOS)
img_2k = img_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=100, threshold=2))
img_4k = img_2k.resize((target_w, target_h), Image.Resampling.LANCZOS)
img_4k = img_4k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=85, threshold=2))

out_webp = "transportes-fb/assets/hero-bg-truck-34-4k.webp"
out_jpg = "transportes-fb/assets/hero-bg-truck-34-4k.jpg"

img_4k.save(out_webp, "WEBP", quality=95, method=6)
img_4k.save(out_jpg, "JPEG", quality=96, subsampling=0)

shutil.copyfile(out_webp, "public/transportes-fb/assets/hero-bg-truck-34-4k.webp")
shutil.copyfile(out_jpg, "public/transportes-fb/assets/hero-bg-truck-34-4k.jpg")

print(f"Saved 4K 3/4 truck background to assets and public!")

# 2. Test composite with 3D logo
logo = Image.open("transportes-fb/assets/logo-fb-3d-hd.png")
comp = img_4k.copy()
logo_w = 1750
logo_h = int(logo_w * (logo.height / logo.width))
logo_resized = logo.resize((logo_w, logo_h), Image.Resampling.LANCZOS)

# Position: left area with breathing room
pos_x = 130
pos_y = (target_h - logo_h) // 2 - 80

comp.paste(logo_resized, (pos_x, pos_y), logo_resized)

preview_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_hero_34_composite.png"
comp_small = comp.resize((1280, int(1280 * (target_h / target_w))), Image.Resampling.LANCZOS)
comp_small.save(preview_path)
print("Saved preview to:", preview_path)
