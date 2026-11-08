from PIL import Image

p1 = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073622101_71b894f7.png"
p2 = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073631943_c32fa392.jpg"

im1 = Image.open(p1)
im2 = Image.open(p2)

print("Image 1 (Logo):")
print("  Dimensions:", im1.size)
print("  Format:", im1.format)
print("  Mode:", im1.mode)
if im1.mode == 'RGBA':
    alpha = im1.split()[3]
    print("  Alpha extrems (min, max):", alpha.getextrema())

print("\nImage 2 (Background):")
print("  Dimensions:", im2.size)
print("  Format:", im2.format)
print("  Mode:", im2.mode)
