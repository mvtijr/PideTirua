import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import shutil

src_path = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794030047525_eef9172c.jpg'
img = Image.open(src_path).convert('RGB')
arr = np.array(img, dtype=np.float32)
H, W, _ = arr.shape

dist = np.sqrt(np.sum((255.0 - arr)**2, axis=2))

# 1. Road stripes inside road (must remain 100% opaque white)
road_region = np.zeros((H, W), dtype=bool)
road_region[300:430, 15:280] = True
is_road_stripes = road_region & (arr[:, :, 0] > 190) & (arr[:, :, 1] > 190) & (arr[:, :, 2] > 190)

# 2. 3D Elements detection
is_gold = (arr[:, :, 0] > 90) & (arr[:, :, 0] > arr[:, :, 2] + 20) & (arr[:, :, 1] > 70)
is_navy = (arr[:, :, 2] > 30) & (arr[:, :, 0] < 120) & (arr[:, :, 1] < 140)

# Core 3D objects mask (excluding all background wall and floor shadow)
core_mask = (is_navy | is_gold | is_road_stripes) & (dist > 30.0)

# Clean up mask: fill holes in letters, keep valid components
core_filled = ndimage.binary_fill_holes(core_mask)
labeled, num = ndimage.label(core_filled)
obj_mask = np.zeros((H, W), dtype=bool)
for i in range(1, num + 1):
    if np.sum(labeled == i) > 50:
        obj_mask |= (labeled == i)

# 1-pixel dilation for antialiased sub-pixel transition
obj_mask_dil = ndimage.binary_dilation(obj_mask, iterations=1)

# Alpha channel: strictly 0 outside the 3D objects!
alpha = np.zeros((H, W), dtype=np.float32)
alpha[obj_mask] = 1.0

boundary = obj_mask_dil & (~obj_mask)
alpha[boundary] = np.clip((dist[boundary] - 15.0) / 45.0, 0.0, 1.0)
alpha[is_road_stripes] = 1.0

# 3. Clean unmultiplying from white so edge pixels have 0% white halo
rgb_clean = np.copy(arr)
for c in range(3):
    a = np.clip(alpha, 0.01, 1.0)
    unmult = (rgb_clean[:, :, c] - (1.0 - a) * 255.0) / a
    rgb_clean[:, :, c] = np.clip(unmult, 0.0, 255.0)

rgba = np.dstack([rgb_clean, (alpha * 255.0).astype(np.uint8)]).astype(np.uint8)
pil_cutout = Image.fromarray(rgba, 'RGBA')

# Crop tight
bbox = pil_cutout.getbbox()
margin = 4
cropped = pil_cutout.crop((
    max(0, bbox[0] - margin),
    max(0, bbox[1] - margin),
    min(W, bbox[2] + margin),
    min(H, bbox[3] + margin)
))

# 4. Upscale 2.5X using Lanczos + subtle UnsharpMask for 4K Retina sharpness
target_w = int(cropped.width * 2.5)
target_h = int(cropped.height * 2.5)
pil_up = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)

r, g, b, a = pil_up.split()
rgb = Image.merge('RGB', (r, g, b))
rgb_sharp = rgb.filter(ImageFilter.UnsharpMask(radius=1.2, percent=130, threshold=1))
sr, sg, sb = rgb_sharp.split()
final_logo_3d = Image.merge('RGBA', (sr, sg, sb, a))

# Save to assets
path_dest = 'transportes-fb/assets/logo-fb-3d.png'
path_pub = 'public/transportes-fb/assets/logo-fb-3d.png'
artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
path_art = f'{artifact_dir}/logo-fb-3d.png'

final_logo_3d.save(path_dest, format='PNG', optimize=True)
shutil.copyfile(path_dest, path_pub)
shutil.copyfile(path_dest, path_art)

print(f'Successfully created pure cutout 3D logo with ZERO white background! Size: {final_logo_3d.size}')

# 5. Update index.html to remove the white CSS glow
index_path = 'transportes-fb/index.html'
with open(index_path, 'r', encoding='utf-8') as f:
    html = f.read()

crlf = '\r\n' in html
html = html.replace('\r\n', '\n')

old_img_tag = 'class="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 w-auto max-w-full object-contain filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)] drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] select-none transition-transform duration-500 hover:scale-[1.02]"'
new_img_tag = 'class="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 w-auto max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.75)] select-none transition-transform duration-500 hover:scale-[1.02]"'

if old_img_tag in html:
    html = html.replace(old_img_tag, new_img_tag)
    print("Updated index.html: removed white glow, kept realistic dark depth shadow")
else:
    print("WARNING: old_img_tag not matched in index.html")

final_html = html.replace('\n', '\r\n') if crlf else html
with open(index_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

shutil.copyfile(index_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
