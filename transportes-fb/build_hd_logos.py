import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
import shutil

src_path = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794028530707_5e4e2d15.jpg'
orig_img = Image.open(src_path).convert('RGB')
arr = np.array(orig_img, dtype=np.float32)
H_orig, W_orig, _ = arr.shape

scale = 4.0
W_hd = int(W_orig * scale)
H_hd = int(H_orig * scale)

# 1. Detect background white
is_white = (arr[:, :, 0] > 235) & (arr[:, :, 1] > 235) & (arr[:, :, 2] > 235)
labeled, num_features = ndimage.label(is_white)
outer_label = labeled[0, 0]

road_stripe_mask = np.zeros((H_orig, W_orig), dtype=bool)
for lab in range(1, num_features + 1):
    if lab == outer_label:
        continue
    ys, xs = np.where(labeled == lab)
    if xs.max() < 300 and ys.min() > 220 and ys.max() < 290:
        road_stripe_mask[ys, xs] = True

dist_from_white = np.sqrt(np.sum((255.0 - arr)**2, axis=2))
alpha_orig = np.clip((dist_from_white - 5.0) / 30.0, 0.0, 1.0) * 255.0
alpha_orig[road_stripe_mask] = 255.0

# Zero out the old low-res subtitle area (from x=440 to end, y=290 to 350)
alpha_no_sub = np.copy(alpha_orig)
alpha_no_sub[290:350, 440:1010] = 0.0

# Clean unmultiplied RGB
rgb_clean = np.copy(arr)
for c in range(3):
    a_norm = np.clip(alpha_no_sub / 255.0, 0.001, 1.0)
    unmult = (rgb_clean[:, :, c] - (1.0 - a_norm) * 255.0) / a_norm
    rgb_clean[:, :, c] = np.clip(unmult, 0.0, 255.0)

# Build base without subtitle
rgba_orig_base = np.dstack([rgb_clean, alpha_no_sub]).astype(np.uint8)
pil_orig_base = Image.fromarray(rgba_orig_base, 'RGBA').resize((W_hd, H_hd), Image.Resampling.LANCZOS)

# Build white/gold base without subtitle (for dark hero)
# Detect gold pixels (the road) vs navy pixels (the FB and FUENTEALBA BASTIDA letters)
is_gold = (arr[:, :, 0] > 90) & (arr[:, :, 0] > arr[:, :, 2] + 20)
rgb_hero = np.copy(rgb_clean)
is_navy = (~is_gold) & (~road_stripe_mask) & (alpha_no_sub > 10.0)
rgb_hero[is_navy, 0] = 255.0
rgb_hero[is_navy, 1] = 255.0
rgb_hero[is_navy, 2] = 255.0

rgba_hero_base = np.dstack([rgb_hero, alpha_no_sub]).astype(np.uint8)
pil_hero_base = Image.fromarray(rgba_hero_base, 'RGBA').resize((W_hd, H_hd), Image.Resampling.LANCZOS)

# 2. Render Ultra-HD Vector Typography for 'TRANSPORTES Y LOGÍSTICA'
# Subtitle bounds in original:
# Word 1: 'TRANSPORTES' in [448, 743]
# Word 2: 'Y' in [743, 779]
# Word 3: 'LOGÍSTICA' in [781, 992]
# y baseline around 332 in original -> at 4x: y = 302 * 4 = 1208
font = ImageFont.truetype('transportes-fb/montserrat_bold.ttf', int(29 * scale))

def render_vector_subtitle(canvas, color):
    draw = ImageDraw.Draw(canvas)
    
    def draw_word_fitted(word, x_start, x_end, y_pos):
        bb_list = [font.getbbox(ch) for ch in word]
        widths = [bb[2] - bb[0] for bb in bb_list]
        total_w = sum(widths)
        target_w = x_end - x_start
        if len(word) > 1:
            tracking = (target_w - total_w) / (len(word) - 1)
        else:
            tracking = 0
            x_start = (x_start + x_end - widths[0]) / 2.0
        
        curr_x = x_start
        for i, ch in enumerate(word):
            draw.text((curr_x, y_pos), ch, font=font, fill=color)
            curr_x += widths[i] + tracking

    y_pos = int(302 * scale)
    draw_word_fitted('TRANSPORTES', 448 * scale, 743 * scale, y_pos)
    draw_word_fitted('Y', 746 * scale, 779 * scale, y_pos)
    draw_word_fitted('LOGÍSTICA', 781 * scale, 992 * scale, y_pos)

# Version 1: Original Navy & Gold with Ultra-HD subtitle
# Gold color: #8E7037 -> (142, 112, 55, 255)
canvas_orig = pil_orig_base.copy()
render_vector_subtitle(canvas_orig, (142, 112, 55, 255))

# Version 2: Hero White & Gold with Ultra-HD subtitle
# Hero warm gold: #C5A059 -> (197, 160, 89, 255) or #D4AF37 -> (212, 175, 55, 255)
canvas_hero = pil_hero_base.copy()
render_vector_subtitle(canvas_hero, (205, 168, 92, 255))

# Crop tightly
def get_tight_crop(img):
    arr_alpha = np.array(img)[:, :, 3]
    ys, xs = np.where(arr_alpha > 5)
    margin = 8
    min_y = max(0, ys.min() - margin)
    max_y = min(img.height, ys.max() + margin)
    min_x = max(0, xs.min() - margin)
    max_x = min(img.width, xs.max() + margin)
    return img.crop((min_x, min_y, max_x, max_y))

crop_orig = get_tight_crop(canvas_orig)
crop_hero = get_tight_crop(canvas_hero)

print(f'Cropped Ultra-HD sizes: Orig={crop_orig.size}, Hero={crop_hero.size}')

# Save to transportes-fb/assets/
path_orig = 'transportes-fb/assets/logo-fb-horizontal-transparent.png'
path_hero = 'transportes-fb/assets/logo-fb-hero-white-gold.png'
crop_orig.save(path_orig, format='PNG', optimize=True)
crop_hero.save(path_hero, format='PNG', optimize=True)

# Copy to public/
shutil.copyfile(path_orig, 'public/transportes-fb/assets/logo-fb-horizontal-transparent.png')
shutil.copyfile(path_hero, 'public/transportes-fb/assets/logo-fb-hero-white-gold.png')

# Copy to artifact dir for preview
artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
shutil.copyfile(path_orig, f'{artifact_dir}/logo-fb-horizontal-transparent.png')
shutil.copyfile(path_hero, f'{artifact_dir}/logo-fb-hero-white-gold.png')

print('Successfully generated and deployed Ultra-HD logos!')
