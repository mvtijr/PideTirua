from PIL import Image

bg = Image.open("transportes-fb/assets/hero-bg-truck-34-4k.jpg") # 3840 x 2143
print("BG size:", bg.size)

# Crop around the truck box:
# Truck is on the right side: X ~ 1900 to 3500, Y ~ 450 to 1800
crop_box = bg.crop((1900, 450, 3300, 1600))
crop_box.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\truck_box_crop.png")
print("Saved truck box crop!")
