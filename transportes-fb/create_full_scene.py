from PIL import Image, ImageDraw, ImageFilter
import numpy as np

# Load scenic background and the FB truck
scenic = Image.open('transportes-fb/assets/scenic-highway.jpg').convert('RGBA')
truck = Image.open('transportes-fb/assets/hero-truck.jpg').convert('RGBA')

# Target standard 16:9 canvas (1920 x 1080)
canvas_w, canvas_h = 1920, 1080

# Crop/scale scenic to exact 1920x1080
scenic_resized = scenic.resize((canvas_w, canvas_h), Image.Resampling.LANCZOS)

# Darken slightly with a cool blue/slate mountain tint (matching ProSandoval reference)
# Reference image has a distinct cool misty slate-blue mood
tint = Image.new('RGBA', (canvas_w, canvas_h), (25, 42, 60, 110))
scenic_toned = Image.alpha_composite(scenic_resized, tint)

# Soft gradient on the left half for text legibility (left x: 0 to 950)
left_scrim = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
for x in range(1100):
    factor = 1.0 - (x / 1100.0)
    # smooth cosine falloff
    alpha = int(195 * (factor ** 1.3))
    for y in range(canvas_h):
        left_scrim.putpixel((x, y), (14, 22, 34, alpha))

canvas = Image.alpha_composite(scenic_toned, left_scrim)

# Now prepare the Fuentealba Bastida truck
# In hero-truck.jpg:
# w: 1024, h: 439
# Truck cabin and box are between x: 10 and x: 550, y: 50 to 430
truck_w, truck_h = truck.size
truck_crop = truck.crop((5, 30, int(truck_w * 0.54), truck_h - 10))

# Resize truck so it occupies the right lane of the road with full height and wheels visible
target_truck_h = int(canvas_h * 0.62) # 670 px
ratio = truck_crop.width / truck_crop.height
target_truck_w = int(target_truck_h * ratio)

truck_scaled = truck_crop.resize((target_truck_w, target_truck_h), Image.Resampling.LANCZOS)

# Create feathered mask for truck to blend seamlessly into the road and background
mask = Image.new('L', (target_truck_w, target_truck_h), 255)
# Feather left side of the truck
feather_w = int(target_truck_w * 0.18)
for x in range(feather_w):
    a = int(255 * (x / feather_w))
    for y in range(target_truck_h):
        mask.putpixel((x, y), a)

# Feather top edge slightly if needed
feather_h = int(target_truck_h * 0.08)
for y in range(feather_h):
    a = int(255 * (y / feather_h))
    for x in range(target_truck_w):
        current_a = mask.getpixel((x, y))
        mask.putpixel((x, y), min(current_a, a))

truck_scaled_rgba = truck_scaled.copy()
truck_scaled_rgba.putalpha(mask)

# Position truck on the right: fully visible, wheels grounded on the road
# In 1080h, road surface is at the bottom, so truck bottom should be around y = 1010
pos_x = canvas_w - target_truck_w - 60
pos_y = canvas_h - target_truck_h - 40

# Add a realistic soft contact shadow under the truck tires
shadow_layer = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
draw = ImageDraw.Draw(shadow_layer)
draw.ellipse([pos_x + 40, pos_y + target_truck_h - 40, pos_x + target_truck_w - 20, pos_y + target_truck_h + 30], fill=(5, 10, 18, 180))
shadow_blurred = shadow_layer.filter(ImageFilter.GaussianBlur(18))

canvas = Image.alpha_composite(canvas, shadow_blurred)
canvas.paste(truck_scaled_rgba, (pos_x, pos_y), truck_scaled_rgba)

# Also let's add the top bar hairline divider shadow
top_tint = Image.new('RGBA', (canvas_w, canvas_h), (0, 0, 0, 0))
for y in range(110):
    a = int(120 * (1.0 - (y / 110.0)))
    for x in range(canvas_w):
        top_tint.putpixel((x, y), (10, 16, 26, a))

canvas = Image.alpha_composite(canvas, top_tint)

# Save result in high quality
output_path = 'transportes-fb/assets/hero-full-scene.jpg'
canvas.convert('RGB').save(output_path, quality=94)
print(f"Created {output_path} (1920x1080) with full truck and complete road scene!")
