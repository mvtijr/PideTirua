from PIL import Image
import numpy as np

p1 = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073622101_71b894f7.png"
im1 = Image.open(p1)
arr = np.array(im1)

# Check corner pixels
print("Top-left pixel [0,0]:", arr[0, 0])
print("Bottom-right pixel [-1,-1]:", arr[-1, -1])

# Check alpha distribution
alpha = arr[:, :, 3]
print("Transparent pixels count:", np.sum(alpha == 0))
print("Opaque pixels count:", np.sum(alpha > 200))
print("Semi-transparent pixels count:", np.sum((alpha > 0) & (alpha <= 200)))

# Let's save a test composite of Image 1 over Image 2
p2 = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073631943_c32fa392.jpg"
im2 = Image.open(p2)

# If we upscale both for ultra-high quality:
# Background 21:9: 3840 x 1628 (or 2560 x 1085)
# Let's see how they composite together!
print("Background size:", im2.size)
