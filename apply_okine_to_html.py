def apply_okine(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update tailwind.config
    tw_old = """fontFamily: {
            heading: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            display: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            nortune: ['Nortune', 'sans-serif'],
            subtitle: ['Armstrong', 'Roboto', 'sans-serif'],
            armstrong: ['Armstrong', 'sans-serif'],
            body: ['Roboto', 'sans-serif']
          }"""
    
    tw_new = """fontFamily: {
            heading: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            display: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            nortune: ['Nortune', 'sans-serif'],
            okine: ['"MADE Okine Sans"', 'sans-serif'],
            body: ['"MADE Okine Sans"', 'sans-serif'],
            sans: ['"MADE Okine Sans"', 'sans-serif']
          }"""
    
    if tw_old in html:
        html = html.replace(tw_old, tw_new)
        print(f"Updated tailwind.config in {path}")
    else:
        print(f"Tailwind config pattern not matched in {path}")

    # 2. Update @font-face declarations
    # Keep Nortune, add all weights of MADE Okine Sans
    ff_section = """    /* Tipografía para Títulos: Nortune */
    @font-face {
      font-family: 'Nortune';
      src: url('assets/fonts/Nortune-Black.ttf') format('truetype');
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }

    /* Tipografía Oficial para Demás Textos: MADE Okine Sans (MadeType) */
    @font-face {
      font-family: 'MADE Okine Sans';
      src: url('assets/fonts/MADEOkineSans-Light.woff2') format('woff2'),
           url('assets/fonts/MADEOkineSans-Light.woff') format('woff'),
           url('assets/fonts/MADEOkineSans-Light.otf') format('opentype');
      font-weight: 300;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'MADE Okine Sans';
      src: url('assets/fonts/MADEOkineSans-Regular.woff2') format('woff2'),
           url('assets/fonts/MADEOkineSans-Regular.woff') format('woff'),
           url('assets/fonts/MADEOkineSans-Regular.otf') format('opentype');
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'MADE Okine Sans';
      src: url('assets/fonts/MADEOkineSans-Medium.woff2') format('woff2'),
           url('assets/fonts/MADEOkineSans-Medium.woff') format('woff'),
           url('assets/fonts/MADEOkineSans-Medium.otf') format('opentype');
      font-weight: 500;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'MADE Okine Sans';
      src: url('assets/fonts/MADEOkineSans-Bold.woff2') format('woff2'),
           url('assets/fonts/MADEOkineSans-Bold.woff') format('woff'),
           url('assets/fonts/MADEOkineSans-Bold.otf') format('opentype');
      font-weight: 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'MADE Okine Sans';
      src: url('assets/fonts/MADEOkineSans-Black.woff2') format('woff2'),
           url('assets/fonts/MADEOkineSans-Black.woff') format('woff'),
           url('assets/fonts/MADEOkineSans-Black.otf') format('opentype');
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }"""

    # Replace from @font-face { font-family: 'Nortune' down to body {
    start_ff = html.find("@font-face {")
    end_ff = html.find("/* Estilos globales y scrollbar", start_ff)
    if start_ff != -1 and end_ff != -1:
        html = html[:start_ff] + ff_section + "\n\n    " + html[end_ff:]
        print(f"Updated @font-face rules in {path}")
    else:
        print(f"Could not locate font-face block in {path}")

    # 3. Update CSS rules:
    # Set MADE Okine Sans for all elements, and Nortune exclusively for titles
    css_old = """    body {
      font-family: 'Roboto', sans-serif;
      background-color: #FFFFFF;
      color: #071D3A;
      overflow-x: hidden;
    }
    h1, h2, h3, h4, h5, .font-heading {
      font-family: 'Nortune', 'Oswald', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    /* Subtítulos y textos bajo títulos con la tipografía Armstrong */
    .font-subtitle, .font-armstrong,
    .section-subtitle,
    h1 + p, h2 + p, h3 + p, h4 + p,
    h1 + div > p, h2 + div > p, h3 + div > p,
    .hero-slogan {
      font-family: 'Armstrong', 'Roboto', sans-serif !important;
      letter-spacing: 0.05em; line-height: 1.5;
    }"""

    css_new = """    /* Estilos globales: Todos los textos usan MADE Okine Sans por defecto */
    *, body, p, span, a, button, input, select, textarea, label, li, td, th {
      font-family: 'MADE Okine Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      background-color: #FFFFFF;
      color: #071D3A;
      overflow-x: hidden;
    }

    /* Exclusivamente los títulos usan Nortune */
    h1, h2, h3, h4, h5,
    h1 *, h2 *, h3 *, h4 *, h5 *,
    .font-nortune {
      font-family: 'Nortune', 'Oswald', sans-serif !important;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }"""

    if css_old in html:
        html = html.replace(css_old, css_new)
        print(f"Updated CSS typography hierarchy in {path}")
    else:
        print(f"CSS rules block not matched exactly in {path}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Saved {path}")

apply_okine('transportes-fb/index.html')
apply_okine('public/transportes-fb/index.html')
