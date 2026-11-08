from PIL import Image, ImageEnhance, ImageFilter
import numpy as np

# Load scenic background and truck
bg = Image.open('transportes-fb/assets/scenic-highway.jpg').convert('RGBA')
truck = Image.open('transportes-fb/assets/hero-truck.jpg').convert('RGBA')

# Dimensions
bg_w, bg_h = bg.size
print(f"BG size: {bg_w}x{bg_h}")
print(f"Truck size: {truck.size}")

# The user's reference image shows:
# 1. Dark, misty, atmospheric road
# 2. Left side has trees, mountains, asphalt road, and plenty of space for text
# 3. Right side has the vehicle traveling on the road towards the viewer

# Let's crop just the truck from hero-truck (0 to ~540)
truck_w, truck_h = truck.size
truck_only = truck.crop((0, 0, int(truck_w * 0.54), truck_h))

# Scale truck to fit nicely on the right half of the scenic highway
target_h = int(bg_h * 0.65)
aspect = truck_only.width / truck_only.height
target_w = int(target_h * aspect)
truck_resized = truck_only.resize((target_w, target_h), Image.Resampling.LANCZOS)

# Create a gradient mask for the truck's edges to blend seamlessly into the highway
mask = Image.new('L', (target_w, target_h), 255)
# Soften left edge
for x in range(int(target_w * 0.15)):
    alpha = int(255 * (x / (target_w * 0.15)))
    for y in range(target_h):
        mask.putpixel((x, y), min(mask.getpixel((x, y)), alpha))

# Darken the scenic background slightly with a cool slate-blue tint to match the reference image
overlay = Image.new('RGBA', bg.size, (15, 23, 42, 140)) # dark slate tint
bg_toned = Image.alpha_composite(bg, overlay)

# Add a strong dark scrim gradient on the left half so text has 100% perfect readability
left_gradient = Image.new('RGBA', bg.size, (0, 0, 0, 0))
for x in range(int(bg_w * 0.7)):
    alpha = int(200 * (1 - (x / (bg_w * 0.7))))
    for y in range(bg_h):
        left_gradient.putpixel((x, y), (13, 20, 30, alpha))

bg_final = Image.alpha_composite(bg_toned, left_gradient)

# Position truck on the right side of the highway
truck_x = bg_w - target_w - int(bg_w * 0.04)
truck_y = bg_h - target_h - int(bg_h * 0.08)

# Paste truck with mask
truck_resized_rgba = truck_resized.copy()
truck_resized_rgba.putalpha(mask)

bg_final.paste(truck_resized_rgba, (truck_x, truck_y), truck_resized_rgba)

# Save high-res composite
bg_final.convert('RGB').save('transportes-fb/assets/hero-prosandoval-style.jpg', quality=92)
print("Saved transportes-fb/assets/hero-prosandoval-style.jpg successfully!")
