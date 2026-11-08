def apply_34_truck_bg(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Replace generated background with truck-34 background
    html = html.replace('assets/hero-bg-generated-4k.webp', 'assets/hero-bg-truck-34-4k.webp')
    html = html.replace('assets/hero-bg-generated-4k.jpg', 'assets/hero-bg-truck-34-4k.jpg')
    html = html.replace('assets/hero-bg-ruta.webp', 'assets/hero-bg-truck-34-4k.webp')
    html = html.replace('assets/hero-bg-ruta.jpg', 'assets/hero-bg-truck-34-4k.jpg')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated 3/4 truck bg in", path)

apply_34_truck_bg('transportes-fb/index.html')
apply_34_truck_bg('public/transportes-fb/index.html')
