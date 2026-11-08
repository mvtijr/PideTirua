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

bg = Image.open("transportes-fb/assets/hero-bg-truck-34-4k.jpg")
logo = Image.open("transportes-fb/assets/logo-fb-horizontal-transparent.png") # 2425 x 700

offset_x, offset_y = 1900, 450

# Precise perspective quad on the side wall:
# Rear: x=80, Front: x=540
# The top line of the box goes from (25, 210) to (580, 95), slope = (95-210)/(580-25) = -115/555 = -0.207
# The bottom line goes from (25, 1080) to (580, 1180), slope = (1180-1080)/555 = +0.180
# Center line of box at x=80 is y=645; at x=540 is y=637
# Logo placed slightly above center:
dst_tl = (offset_x + 75, offset_y + 440)
dst_tr = (offset_x + 545, offset_y + 342)
dst_br = (offset_x + 545, offset_y + 575)
dst_bl = (offset_x + 75, offset_y + 645)

pa = [dst_tl, dst_tr, dst_br, dst_bl]
w_l, h_l = logo.size
pb = [(0, 0), (w_l, 0), (w_l, h_l), (0, h_l)]

coeffs = find_coeffs(pa, pb)
warped = logo.transform(bg.size, Image.Transform.PERSPECTIVE, coeffs, Image.Resampling.BICUBIC)

# Soften edges slightly for photographic integration
r, g, b, a = warped.split()
a = a.filter(ImageFilter.GaussianBlur(radius=0.6))
# Subtle opacity 94% to blend with paint finish
a = a.point(lambda p: int(p * 0.94))
warped = Image.merge("RGBA", (r, g, b, a))

branded_bg = bg.copy()
branded_bg.paste(warped, (0, 0), warped)

# Save cropped detail to inspect
crop = branded_bg.crop((1900, 450, 3300, 1600))
p_crop = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_truck_branded_v2.png"
crop.save(p_crop)

# Save full 4K background assets
out_webp = "transportes-fb/assets/hero-bg-truck-34-4k.webp"
out_jpg = "transportes-fb/assets/hero-bg-truck-34-4k.jpg"
branded_bg.save(out_webp, "WEBP", quality=95, method=6)
branded_bg.save(out_jpg, "JPEG", quality=96, subsampling=0)

import shutil
shutil.copyfile(out_webp, "public/transportes-fb/assets/hero-bg-truck-34-4k.webp")
shutil.copyfile(out_jpg, "public/transportes-fb/assets/hero-bg-truck-34-4k.jpg")

print("Generated updated 4K branded truck assets!")
