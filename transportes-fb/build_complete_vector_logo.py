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

# -------------------------------------------------------------
# 1. DETECT ELEMENTS IN ORIGINAL
# -------------------------------------------------------------
# A) Background white
is_white = (arr[:, :, 0] > 235) & (arr[:, :, 1] > 235) & (arr[:, :, 2] > 235)
labeled, num_features = ndimage.label(is_white)
outer_label = labeled[0, 0]

# B) Road geometry in original
# In monogram (x < 420), find gold pixels and road dashed stripes
is_gold_road = (arr[:, :420, 0] > 110) & (arr[:, :420, 1] > 80) & (arr[:, :420, 2] < 95) & (arr[:, :420, 0] > arr[:, :420, 2] + 35)

# Fill holes inside the road to find the white stripes
road_full_mask = np.zeros((H_orig, W_orig), dtype=bool)
road_full_mask[:, :420] = ndimage.binary_fill_holes(is_gold_road)
stripes_mask = np.zeros((H_orig, W_orig), dtype=bool)
stripes_mask[:, :420] = road_full_mask[:, :420] & (~is_gold_road) & is_white[:, :420]

# -------------------------------------------------------------
# 2. VECTOR-QUALITY SDF RECONSTRUCTION OF THE ROAD
# -------------------------------------------------------------
def compute_sdf(mask):
    dist_in = ndimage.distance_transform_edt(mask)
    dist_out = ndimage.distance_transform_edt(~mask)
    return dist_in - dist_out

sdf_road = compute_sdf(road_full_mask)
sdf_stripes = compute_sdf(stripes_mask)

# Zoom with cubic interpolation (order=3) for smooth, continuous vector curves
sdf_road_hd = ndimage.zoom(sdf_road, scale, order=3)
sdf_stripes_hd = ndimage.zoom(sdf_stripes, scale, order=3)

# Smooth antialiased alpha (1.5 px boundary transition)
alpha_road_hd = np.clip(sdf_road_hd / 1.5 + 0.5, 0.0, 1.0)
alpha_stripes_hd = np.clip(sdf_stripes_hd / 1.5 + 0.5, 0.0, 1.0)

# -------------------------------------------------------------
# 3. MONOGRAM FB & FUENTEALBA BASTIDA (EXCLUDING OLD ROAD & SUBTITLE)
# -------------------------------------------------------------
# Mask for navy letters: FB and FUENTEALBA BASTIDA
# Everything that is NOT white, NOT road, and NOT subtitle
dist_from_white = np.sqrt(np.sum((255.0 - arr)**2, axis=2))
alpha_all = np.clip((dist_from_white - 5.0) / 30.0, 0.0, 1.0)

# Mask for navy letters only:
navy_mask_orig = (alpha_all > 0.1) & (~road_full_mask)
# Zero out old subtitle (x > 440, y > 290)
navy_mask_orig[290:350, 440:1010] = False

# Compute SDF for the navy letters to make their edges vector-smooth too!
sdf_navy = compute_sdf(navy_mask_orig)
sdf_navy_hd = ndimage.zoom(sdf_navy, scale, order=3)
alpha_navy_hd = np.clip(sdf_navy_hd / 1.5 + 0.5, 0.0, 1.0)

# -------------------------------------------------------------
# 4. VECTOR SUBTITLE "TRANSPORTES Y LOGÍSTICA"
# -------------------------------------------------------------
font = ImageFont.truetype('transportes-fb/montserrat_bold.ttf', int(29 * scale))

def draw_vector_subtitle(draw, color):
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

# -------------------------------------------------------------
# 5. COMPOSE FULL ULTRA-HD LOGOS
# -------------------------------------------------------------
# Function to compose a complete logo given colors:
def build_composite_logo(navy_color, road_color, subtitle_color):
    # Base RGBA canvas
    canvas = np.zeros((H_hd, W_hd, 4), dtype=np.uint8)
    
    # Layer 1: Navy letters (FB & FUENTEALBA BASTIDA)
    # (or White letters for hero)
    for c in range(3):
        canvas[:, :, c] = navy_color[c]
    canvas[:, :, 3] = (alpha_navy_hd * 255.0).astype(np.uint8)
    
    pil_canvas = Image.fromarray(canvas, 'RGBA')
    
    # Layer 2: Vector-Smooth Road with White Dashed Stripes
    road_layer = np.zeros((H_hd, W_hd, 4), dtype=np.uint8)
    for c in range(3):
        col = road_color[c] * (1.0 - alpha_stripes_hd) + 255.0 * alpha_stripes_hd
        road_layer[:, :, c] = np.clip(col, 0, 255).astype(np.uint8)
    road_layer[:, :, 3] = (alpha_road_hd * 255.0).astype(np.uint8)
    
    pil_road = Image.fromarray(road_layer, 'RGBA')
    pil_canvas = Image.alpha_composite(pil_canvas, pil_road)
    
    # Layer 3: Vector Typography Subtitle "TRANSPORTES Y LOGÍSTICA"
    draw = ImageDraw.Draw(pil_canvas)
    draw_vector_subtitle(draw, subtitle_color)
    
    # Tight crop
    arr_alpha = np.array(pil_canvas)[:, :, 3]
    ys, xs = np.where(arr_alpha > 5)
    margin = 8
    min_y = max(0, ys.min() - margin)
    max_y = min(H_hd, ys.max() + margin)
    min_x = max(0, xs.min() - margin)
    max_x = min(W_hd, xs.max() + margin)
    
    return pil_canvas.crop((min_x, min_y, max_x, max_y))

# A) HERO VERSION (Dark backgrounds):
# Letters in White [255, 255, 255], Road in Warm Gold [205, 168, 92], Subtitle in Warm Gold
hero_logo = build_composite_logo(
    navy_color=[255, 255, 255],
    road_color=[205, 168, 92],
    subtitle_color=(205, 168, 92, 255)
)

# B) ORIGINAL BRANDING VERSION (Light backgrounds):
# Letters in Corporate Navy [7, 29, 58], Road in Gold [142, 112, 55], Subtitle in Gold
orig_logo = build_composite_logo(
    navy_color=[7, 29, 58],
    road_color=[142, 112, 55],
    subtitle_color=(142, 112, 55, 255)
)

print(f'Generated complete Ultra-HD logos! Size: {hero_logo.size}')

# Save to transportes-fb/assets/
path_hero = 'transportes-fb/assets/logo-fb-hero-white-gold.png'
path_orig = 'transportes-fb/assets/logo-fb-horizontal-transparent.png'
hero_logo.save(path_hero, format='PNG', optimize=True)
orig_logo.save(path_orig, format='PNG', optimize=True)

# Copy to public/
shutil.copyfile(path_hero, 'public/transportes-fb/assets/logo-fb-hero-white-gold.png')
shutil.copyfile(path_orig, 'public/transportes-fb/assets/logo-fb-horizontal-transparent.png')

# Copy to artifact directory
artifact_dir = r'C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e'
shutil.copyfile(path_hero, f'{artifact_dir}/logo-fb-hero-white-gold.png')
shutil.copyfile(path_orig, f'{artifact_dir}/logo-fb-horizontal-transparent.png')

print('Successfully deployed Ultra-HD road & typography logos!')
