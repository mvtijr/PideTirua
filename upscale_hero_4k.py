import numpy as np
from PIL import Image, ImageFilter, ImageEnhance

src_path = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794070373575_7815c1c8.jpg"
img = Image.open(src_path)

print(f"Original size: {img.size}")

# Target 4K resolution: 3840 x 2160 (exact 16:9)
target_w, target_h = 3840, 2160

# 1. Step-wise super-sampling with Lanczos to preserve high frequency details
# Step 1: 1024x576 -> 2048x1152
img_2k = img.resize((2048, 1152), Image.Resampling.LANCZOS)
# Subtle unsharp mask at 2K stage to restore edges without haloing
img_2k = img_2k.filter(ImageFilter.UnsharpMask(radius=1.5, percent=110, threshold=2))

# Step 2: 2048x1152 -> 3840x2160 (4K UHD)
img_4k = img_2k.resize((target_w, target_h), Image.Resampling.LANCZOS)
# Final clarity enhancement
img_4k_enhanced = img_4k.filter(ImageFilter.UnsharpMask(radius=1.8, percent=95, threshold=3))

# Contrast & sharpness fine tuning (subtle +3%)
enhancer = ImageEnhance.Sharpness(img_4k_enhanced)
img_final_4k = enhancer.enhance(1.08)

# Save 4K versions
out_jpg = r"transportes-fb/assets/hero-4k.jpg"
out_webp = r"transportes-fb/assets/hero-4k.webp"
out_png = r"transportes-fb/assets/hero-4k.png"

# Save highest quality WebP (lossless-like quality 96) and JPG (quality 98)
img_final_4k.save(out_webp, "WEBP", quality=96, method=6)
img_final_4k.save(out_jpg, "JPEG", quality=96, subsampling=0)

# Also copy to public/
import shutil
shutil.copyfile(out_webp, r"public/transportes-fb/assets/hero-4k.webp")
shutil.copyfile(out_jpg, r"public/transportes-fb/assets/hero-4k.jpg")

print(f"Saved 4K assets!")
import os
print(f"hero-4k.webp size: {os.path.getsize(out_webp) / (1024*1024):.2f} MB")
print(f"hero-4k.jpg size: {os.path.getsize(out_jpg) / (1024*1024):.2f} MB")
