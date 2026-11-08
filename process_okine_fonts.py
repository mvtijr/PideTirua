import os
import shutil
from fontTools.ttLib import TTFont

src_dir = 'made_okine_extracted'
dest_dirs = [
    'transportes-fb/assets/fonts',
    'public/transportes-fb/assets/fonts'
]

weights = {
    'Light': (300, 'MADEOkineSansPERSONALUSE-Light.otf'),
    'Regular': (400, 'MADEOkineSansPERSONALUSE-Regular.otf'),
    'Medium': (500, 'MADEOkineSansPERSONALUSE-Medium.otf'),
    'Bold': (700, 'MADEOkineSansPERSONALUSE-Bold.otf'),
    'Black': (900, 'MADEOkineSansPERSONALUSE-Black.otf')
}

converted_files = []

for name, (weight, filename) in weights.items():
    src_otf = os.path.join(src_dir, filename)
    if not os.path.exists(src_otf):
        print(f"File not found: {src_otf}")
        continue
    
    # Generate woff2
    out_woff2 = f"made_okine_extracted/MADEOkineSans-{name}.woff2"
    f_w2 = TTFont(src_otf)
    f_w2.flavor = 'woff2'
    f_w2.save(out_woff2)

    # Generate woff
    out_woff = f"made_okine_extracted/MADEOkineSans-{name}.woff"
    f_w = TTFont(src_otf)
    f_w.flavor = 'woff'
    f_w.save(out_woff)

    # Clean otf name
    out_otf = f"made_okine_extracted/MADEOkineSans-{name}.otf"
    shutil.copyfile(src_otf, out_otf)

    for target_dir in dest_dirs:
        os.makedirs(target_dir, exist_ok=True)
        shutil.copyfile(out_woff2, os.path.join(target_dir, f"MADEOkineSans-{name}.woff2"))
        shutil.copyfile(out_woff, os.path.join(target_dir, f"MADEOkineSans-{name}.woff"))
        shutil.copyfile(out_otf, os.path.join(target_dir, f"MADEOkineSans-{name}.otf"))

    print(f"Processed MADE Okine Sans {name} (Weight {weight}) -> woff2, woff, otf")

print("All font files successfully converted and distributed!")
