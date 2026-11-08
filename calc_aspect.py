from PIL import Image

img = Image.open("transportes-fb/assets/hero-4k.webp") # 3840 x 2160
# If viewport is 412 width:
# Case A: aspect ratio 16/9 -> height = 232
# Case B: height = 320 -> target crop in 3840x2160 is width: 3840, height: 3840 * (320/412) = 2980 (taller than image)
# If height is taller than 16:9, object-cover crops the left and right!
# To not crop the left and right on mobile, the aspect ratio must be 16/9, OR on mobile we can let the hero be aspect-[16/9] w-full!
print("Aspect ratio 16:9:", 3840/2160)
