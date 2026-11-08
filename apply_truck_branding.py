import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def find_coeffs(pa, pb):
    matrix = []
    for p1, p2 in zip(pa, pb):
        matrix.append([p1[0], p1[1], 1, 0, 0, 0, -p2[0]*p1[0], -p2[0]*p1[1]])
        matrix.append([0, 0, 0, p1[0], p1[1], 1, -p2[1]*p1[0], -p2[1]*p1[1]])
    A = np.matrix(matrix, dtype=float)
    B = np.array(pb).reshape(8)
    res = np.dot(np.linalg.inv(A.T * A) * A.T, B)
    return np.array(res).reshape(8)

# Load 4K background: 3840 x 2143
bg = Image.open("transportes-fb/assets/hero-bg-truck-34-4k.jpg")
logo = Image.open("transportes-fb/assets/logo-fb-horizontal-transparent.png") # 2425 x 700

# Remember truck_box_crop was cropped at (1900, 450)
offset_x, offset_y = 1900, 450

# Coordinates in truck_box_crop:
# Top-Left: around x=100, y=365
# Top-Right: around x=540, y=260
# Bottom-Right: around x=540, y=680
# Bottom-Left: around x=100, y=750

# In full 4K background coordinates:
dst_tl = (offset_x + 100, offset_y + 365) # (2000, 815)
dst_tr = (offset_x + 540, offset_y + 260) # (2440, 710)
dst_br = (offset_x + 540, offset_y + 680) # (2440, 1130)
dst_bl = (offset_x + 100, offset_y + 750) # (2000, 1200)

pa = [dst_tl, dst_tr, dst_br, dst_bl]
w_l, h_l = logo.size
pb = [(0, 0), (w_l, 0), (w_l, h_l), (0, h_l)]

coeffs = find_coeffs(pa, pb)

# Warp logo to full background size
warped_logo = logo.transform(bg.size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)

# Let's adjust opacity and blending:
# In real life, vinyl lettering on truck body has slight specular/ambient integration
# Sligthly soften alpha edges
alpha = warped_logo.split()[3]
alpha = alpha.filter(ImageFilter.GaussianBlur(radius=0.7))
warped_logo.putalpha(alpha)

# Paste warped logo onto bg
branded_bg = bg.copy()
branded_bg.paste(warped_logo, (0, 0), warped_logo)

# Let's crop the truck in the branded_bg to inspect the branding up close!
crop_branded_truck = branded_bg.crop((1900, 450, 3300, 1600))
p_out = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_truck_branded_close.png"
crop_branded_truck.save(p_out)
print("Saved branded truck crop!")

# Also let's save full composite with 3D logo on the left
logo_3d = Image.open("transportes-fb/assets/logo-fb-3d-hd.png")
full_comp = branded_bg.copy()
logo_w = 1750
logo_h = int(logo_w * (logo_3d.height / logo_3d.width))
logo_3d_resized = logo_3d.resize((logo_w, logo_h), Image.Resampling.LANCZOS)
pos_x = 130
pos_y = (bg.height - logo_h) // 2 - 80
full_comp.paste(logo_3d_resized, (pos_x, pos_y), logo_3d_resized)

p_full = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_full_hero_34_branded.png"
full_comp.resize((1280, int(1280 * bg.height / bg.width)), Image.Resampling.LANCZOS).save(p_full)
print("Saved full hero branded preview!")
