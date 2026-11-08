from PIL import Image

img = Image.open("transportes-fb/assets/hero-4k.webp")
# Crop center logo area
# Dimensions are 3840 x 2160
# Center logo is around X: 1000 to 2800, Y: 600 to 1800
crop_logo = img.crop((1100, 700, 2700, 1700))
crop_logo.save(r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\test_4k_logo_crop.png")
print("Saved 4K logo crop!")
