from PIL import Image, ImageEnhance

# Load extracted mockup card
ref = Image.open('transportes-fb/assets/hero-reference-extracted.jpg')
w, h = ref.size
print("Extracted size:", w, h)

# In the extracted mockup:
# The header is at y: 0 to 45
# The text is on the left
# The vehicle is on the right
# Let's crop just the scenic background and vehicle if needed or upscale the reference
# Let's upscale to 1920x1113 using high quality LANCZOS
upscaled = ref.resize((1920, int(1920 * (h / w))), Image.Resampling.LANCZOS)
upscaled.save('transportes-fb/assets/hero-reference-hd.jpg', quality=95)
print("Saved hero-reference-hd.jpg at:", upscaled.size)
