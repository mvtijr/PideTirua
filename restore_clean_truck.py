from PIL import Image, ImageFilter
import os
import shutil

src_path = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\logistics_hero_truck_sunset_1794098982203.jpg"
img = Image.open(src_path)

# Upscale to clean 4K UHD: 3840 x 2143
target_w = 3840
target_h = int(target_w * (img.height / img.width))
print(f"Upscaling clean 3/4 truck (without logo on truck) to {target_w} x {target_h}...")

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

print("Restored clean 3/4 truck background without logo on the truck!")
