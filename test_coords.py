from PIL import Image, ImageDraw

crop = Image.open(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\truck_box_crop.png")
w, h = crop.size
print("Crop size:", w, h)

# Let's test coordinates for the branding area on the side wall:
# In crop coordinates:
# Top-Left corner of side panel: around x=20, y=210
# Top-Right corner of side panel: around x=580, y=95
# Bottom-Right corner of side panel: around x=580, y=1180
# Bottom-Left corner of side panel: around x=20, y=1080

# For the logo, we want it nicely centered in the upper-middle of this panel:
# e.g., left: x=60 to 100, right: x=520, top: y=300, bottom: y=800
# Let's draw test markers on a copy to verify exact visual perspective:
test_img = crop.copy()
draw = ImageDraw.Draw(test_img)

# Logo polygon estimate:
p_tl = (90, 380)
p_tr = (530, 290)
p_br = (530, 800)
p_bl = (90, 850)

draw.line([p_tl, p_tr, p_br, p_bl, p_tl], fill=(255, 0, 0), width=3)
test_img.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_truck_perspective_polygon.png")
print("Saved polygon test image!")
