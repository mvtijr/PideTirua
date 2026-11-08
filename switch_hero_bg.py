def switch_to_gen_4k(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace hero-bg-ruta with hero-bg-generated-4k
    html = html.replace('assets/hero-bg-ruta.webp', 'assets/hero-bg-generated-4k.webp')
    html = html.replace('assets/hero-bg-ruta.jpg', 'assets/hero-bg-generated-4k.jpg')

    # Also update aspect ratio to match the 16:9 native aspect of the 4K render
    html = html.replace('aspect-[21/9] min-h-[440px]', 'aspect-[16/9] min-h-[460px]')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated", path)

switch_to_gen_4k('transportes-fb/index.html')
switch_to_gen_4k('public/transportes-fb/index.html')
