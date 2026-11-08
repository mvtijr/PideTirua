from PIL import Image

# Let's crop the truck side from the user's uploaded image to see how it was branded
p_orig = r"C:/Users/Informatico/.gemini/antigravity/brain/2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e/.user_uploaded/media_1794073631943_c32fa392.jpg"
im_orig = Image.open(p_orig)
# Dimensions are 1024 x 434
# The truck side is on the right
crop_truck = im_orig.crop((450, 50, 750, 350))
p_out = r"C:\Users\Informatico\.gemini\antigravity\brain\2c01d92d-05bc-4c46-bf5d-8ab5b90fc13e\ref_truck_branding.png"
crop_truck.save(p_out)
print("Saved reference truck branding to:", p_out)
