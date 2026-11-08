import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
from scipy import ndimage
import shutil

# Load pristine 3D render on clean white
src_path = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794030047525_eef9172c.jpg'
orig = Image.open(src_path).convert('RGB')
arr = np.array(orig, dtype=np.float32)
H, W, _ = arr.shape

# 1. Identify road stripes inside the gold road (must be 100% opaque white)
is_gold = (arr[:, :, 0] > 95) & (arr[:, :, 0] > arr[:, :, 2] + 20) & (arr[:, :, 1] > 70)
road_region = np.zeros((H, W), dtype=bool)
road_region[280:430, 15:280] = True
road_stripes = road_region & (arr[:, :, 0] > 190) & (arr[:, :, 1] > 190) & (arr[:, :, 2] > 190)

# 2. Mathematical Alpha Extraction from White Background
# In an image rendered on pure white (255, 255, 255):
# Observed C = alpha * True_C + (1 - alpha) * 255
# Therefore: 255 - Observed_C = alpha * (255 - True_C)
# For the darkest channel (which gives maximum distance from 255):
# alpha is proportional to (255 - min(R, G, B))
diff_from_white = 255.0 - np.min(arr, axis=2)
dist_euclidean = np.sqrt(np.sum((255.0 - arr)**2, axis=2))

# Background wall threshold (pure white wall has dist < 8)
# Content has dist > 15
alpha = np.zeros((H, W), dtype=np.float32)

# Solid content (dist > 40)
solid_mask = dist_euclidean > 35.0
alpha[solid_mask] = 1.0

# Edge transition (dist between 8 and 35)
edge_mask = (dist_euclidean >= 8.0) & (~solid_mask)
alpha[edge_mask] = np.clip((dist_euclidean[edge_mask] - 8.0) / 27.0, 0.0, 1.0)

# Preserve road stripes with 100% solid opacity
alpha[road_stripes] = 1.0

# Clean unmultiply: remove white matte from edge pixels
rgb_unmult = np.copy(arr)
for c in range(3):
    a = np.clip(alpha, 0.02, 1.0)
    unmult = (rgb_unmult[:, :, c] - (1.0 - a) * 255.0) / a
    rgb_unmult[:, :, c] = np.clip(unmult, 0.0, 255.0)

rgba = np.dstack([rgb_unmult, (alpha * 255.0).astype(np.uint8)]).astype(np.uint8)
pil_3d = Image.fromarray(rgba, 'RGBA')

# Crop to tight bounding box with 6px margin
bbox = pil_3d.getbbox()
margin = 6
crop_box = (
    max(0, bbox[0] - margin),
    max(0, bbox[1] - margin),
    min(W, bbox[2] + margin),
    min(H, bbox[3] + margin)
)
cropped = pil_3d.crop(crop_box)

# 3. High-Definition 2.5X Upscaling with Lanczos + Edge Sharpening
target_w = int(cropped.width * 2.5)
target_h = int(cropped.height * 2.5)
pil_hd = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Enhance contrast and micro-sharpness for 3D bevels
r, g, b, a = pil_hd.split()
rgb = Image.merge('RGB', (r, g, b))

# Apply subtle UnsharpMask to crispen 3D bevels and text edges without eroding
sharp_rgb = rgb.filter(ImageFilter.UnsharpMask(radius=1.2, percent=135, threshold=1))

# Enhance color vibrancy slightly (1.08) so metallic gold and navy pop
enhancer = ImageEnhance.Color(sharp_rgb)
vibrant_rgb = enhancer.enhance(1.08)

sr, sg, sb = vibrant_rgb.split()
final_logo = Image.merge('RGBA', (sr, sg, sb, a))

# Save to assets
path_dest = 'transportes-fb/assets/logo-fb-3d.png'
path_pub = 'public/transportes-fb/assets/logo-fb-3d.png'
artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
path_art = f'{artifact_dir}/logo-fb-3d.png'

final_logo.save(path_dest, format='PNG', optimize=True)
shutil.copyfile(path_dest, path_pub)
shutil.copyfile(path_dest, path_art)

print(f'Pristine 3D logo generated with zero erosion! Size: {final_logo.size}')
