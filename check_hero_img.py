from PIL import Image

path = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794070373575_7815c1c8.jpg"
img = Image.open(path)
print("Dimensions:", img.size)
print("Format:", img.format)
print("Mode:", img.mode)
