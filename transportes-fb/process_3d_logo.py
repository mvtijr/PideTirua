import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import shutil

src_path = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794030047525_eef9172c.jpg'
img = Image.open(src_path).convert('RGB')
arr = np.array(img, dtype=np.float32)
H, W, _ = arr.shape

# 1. Background identification
is_white = (arr[:, :, 0] > 248) & (arr[:, :, 1] > 248) & (arr[:, :, 2] > 248)
labeled, num_features = ndimage.label(is_white)
outer_label = labeled[0, 0]

# Preserve white lane stripes on the 3D road
road_stripe_mask = np.zeros((H, W), dtype=bool)
for lab in range(1, num_features + 1):
    if lab == outer_label:
        continue
    ys, xs = np.where(labeled == lab)
    if xs.max() < 300 and ys.min() > 280 and ys.max() < 425:
        road_stripe_mask[ys, xs] = True

# 2. Precise Alpha Extraction
# For 3D elements and soft cast shadows:
lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
dist_from_white = np.sqrt(np.sum((255.0 - arr)**2, axis=2))

alpha = np.clip((255.0 - lum) / 225.0, 0.0, 1.0)
is_solid = dist_from_white > 30.0
alpha[is_solid] = np.clip((dist_from_white[is_solid] - 25.0) / 25.0 + 0.6, 0.0, 1.0)
alpha[road_stripe_mask] = 1.0
alpha[dist_from_white < 5.0] = 0.0

# 3. Clean RGB unmultiplying from white
rgb_clean = np.copy(arr)
a_norm = np.clip(alpha, 0.001, 1.0)
for c in range(3):
    unmult = (rgb_clean[:, :, c] - (1.0 - a_norm) * 255.0) / a_norm
    rgb_clean[:, :, c] = np.clip(unmult, 0.0, 255.0)

rgba = np.dstack([rgb_clean, (alpha * 255.0).astype(np.uint8)]).astype(np.uint8)
pil_3d = Image.fromarray(rgba, 'RGBA')

# Crop to content box
bbox = pil_3d.getbbox()
margin = 6
crop_box = (
    max(0, bbox[0] - margin),
    max(0, bbox[1] - margin),
    min(W, bbox[2] + margin),
    min(H, bbox[3] + margin)
)
cropped = pil_3d.crop(crop_box)

# 4. High-Fidelity 2.5X Upscaling with Lanczos + Unsharp Mask
target_w = int(cropped.width * 2.5)
target_h = int(cropped.height * 2.5)
pil_up = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Subtle unsharp mask to accentuate 3D bevels and specular glints
r, g, b, a = pil_up.split()
rgb = Image.merge('RGB', (r, g, b))
rgb_sharp = rgb.filter(ImageFilter.UnsharpMask(radius=1.2, percent=135, threshold=1))
sr, sg, sb = rgb_sharp.split()
logo_3d_hd = Image.merge('RGBA', (sr, sg, sb, a))

print(f'3D Logo HD rendered! Final size: {logo_3d_hd.size}')

# Save to assets
path_dest = 'transportes-fb/assets/logo-fb-3d.png'
path_pub = 'public/transportes-fb/assets/logo-fb-3d.png'
artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
path_art = f'{artifact_dir}/logo-fb-3d.png'

logo_3d_hd.save(path_dest, format='PNG', optimize=True)
shutil.copyfile(path_dest, path_pub)
shutil.copyfile(path_dest, path_art)

# Also copy raw uploaded image to artifact directory for comparison
shutil.copyfile(src_path, f'{artifact_dir}/logo-fb-3d-original.jpg')

print('Successfully deployed logo-fb-3d.png to assets and artifact directory!')
