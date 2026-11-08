import os
import re

def update_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Update tailwind.config
    tw_old = """fontFamily: {
            heading: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            display: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            nortune: ['Nortune', 'sans-serif'],
            body: ['Roboto', 'sans-serif']
          }"""
    tw_new = """fontFamily: {
            heading: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            display: ['Nortune', 'Oswald', 'Montserrat', 'sans-serif'],
            nortune: ['Nortune', 'sans-serif'],
            subtitle: ['Armstrong', 'Roboto', 'sans-serif'],
            armstrong: ['Armstrong', 'sans-serif'],
            body: ['Roboto', 'sans-serif']
          }"""
    if tw_old in html:
        html = html.replace(tw_old, tw_new)
        print(f"Updated tailwind config in {path}")
    else:
        print(f"Tailwind config target not found or already updated in {path}")

    # 2. Update @font-face
    ff_old = """    @font-face {
      font-family: 'Nortune';
      src: url('assets/fonts/Nortune-Black.ttf') format('truetype');
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }"""
    ff_new = """    @font-face {
      font-family: 'Nortune';
      src: url('assets/fonts/Nortune-Black.ttf') format('truetype');
      font-weight: 900;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Armstrong';
      src: url('assets/fonts/Armstrong.woff2') format('woff2'),
           url('assets/fonts/Armstrong.woff') format('woff'),
           url('assets/fonts/Armstrong.ttf') format('truetype');
      font-weight: 400 700;
      font-style: normal;
      font-display: swap;
    }

    @font-face {
      font-family: 'Armstrong';
      src: url('assets/fonts/Armstrong Italic.woff2') format('woff2'),
           url('assets/fonts/Armstrong Italic.woff') format('woff'),
           url('assets/fonts/Armstrong Italic.ttf') format('truetype');
      font-weight: 400 700;
      font-style: italic;
      font-display: swap;
    }"""
    if ff_old in html:
        html = html.replace(ff_old, ff_new)
        print(f"Updated @font-face in {path}")
    else:
        print(f"@font-face target not found or already updated in {path}")

    # 3. Update CSS rules for headings and subtitles
    css_old = """    h1, h2, h3, h4, h5, .font-heading {
      font-family: 'Nortune', 'Oswald', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }"""
    css_new = """    h1, h2, h3, h4, h5, .font-heading {
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
      letter-spacing: 0.03em;
    }"""
    if css_old in html:
        html = html.replace(css_old, css_new)
        print(f"Updated CSS subtitle rules in {path}")
    else:
        print(f"CSS heading rule not found or already updated in {path}")

    # 4. Hero Slogan: add font-armstrong hero-slogan class
    slogan_old = """<span class="font-heading font-extrabold text-xs sm:text-sm text-fb-goldLight uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>"""
    slogan_new = """<span class="font-armstrong hero-slogan font-bold text-xs sm:text-sm text-fb-goldLight uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>"""
    if slogan_old in html:
        html = html.replace(slogan_old, slogan_new)
        print(f"Updated hero slogan in {path}")

    # 5. Nuestro Compromiso lead paragraph
    comp_old = """        <h2 class="font-heading font-black text-3xl sm:text-4xl text-white mb-4">
          NUESTRO COMPROMISO
        </h2>
        <p class="font-heading font-bold text-sm sm:text-base text-fb-goldGlow uppercase leading-snug mb-4">"""
    comp_new = """        <h2 class="font-heading font-black text-3xl sm:text-4xl text-white mb-4">
          NUESTRO COMPROMISO
        </h2>
        <p class="font-armstrong font-bold text-xs sm:text-sm text-fb-goldGlow uppercase leading-relaxed mb-4">"""
    if comp_old in html:
        html = html.replace(comp_old, comp_new)
        print(f"Updated compromiso subtitle in {path}")

    # 6. Claves de Nuestro Éxito lead paragraph
    claves_old = """            <h3 class="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
              CLAVES DE NUESTRO ÉXITO
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldGlow uppercase leading-relaxed mb-4">"""
    claves_new = """            <h3 class="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
              CLAVES DE NUESTRO ÉXITO
            </h3>
            <p class="font-armstrong font-bold text-xs sm:text-sm text-fb-goldGlow uppercase leading-relaxed mb-4">"""
    if claves_old in html:
        html = html.replace(claves_old, claves_new)
        print(f"Updated claves subtitle in {path}")

    # 7. Haciendo el transporte rápido y seguro subtitle
    hac_old = """      <h2 class="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide leading-tight mb-4">
        HACIENDO EL TRANSPORTE RÁPIDO Y SEGURO
      </h2>
      <p class="text-slate-200 text-xs sm:text-sm leading-relaxed mb-6 font-normal">"""
    hac_new = """      <h2 class="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-wide leading-tight mb-4">
        HACIENDO EL TRANSPORTE RÁPIDO Y SEGURO
      </h2>
      <p class="font-armstrong text-slate-200 text-xs sm:text-sm leading-relaxed mb-6 font-normal">"""
    if hac_old in html:
        html = html.replace(hac_old, hac_new)
        print(f"Updated banner transporte subtitle in {path}")

    # 8. Tres columnas (Quiénes somos, Por qué elegirnos, Qué hacemos)
    qs_old = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              QUIÉNES SOMOS
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    qs_new = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              QUIÉNES SOMOS
            </h3>
            <p class="font-armstrong font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    if qs_old in html:
        html = html.replace(qs_old, qs_new)
        print(f"Updated quiénes somos subtitle in {path}")

    pq_old = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿POR QUÉ ELEGIRNOS?
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    pq_new = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿POR QUÉ ELEGIRNOS?
            </h3>
            <p class="font-armstrong font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    if pq_old in html:
        html = html.replace(pq_old, pq_new)
        print(f"Updated por qué elegirnos subtitle in {path}")

    qh_old = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿QUÉ HACEMOS?
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    qh_new = """            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿QUÉ HACEMOS?
            </h3>
            <p class="font-armstrong font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">"""
    if qh_old in html:
        html = html.replace(qh_old, qh_new)
        print(f"Updated qué hacemos subtitle in {path}")

    # 9. Cotización / Presupuesto subtitle
    cot_old = """          <h3 class="font-heading font-black text-xl sm:text-2xl text-white mb-1">
            SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
          </h3>
          <p class="text-slate-300 text-xs mb-6">
            Completa los datos de tu carga y recibe una propuesta formal ajustada al cubicaje y trayecto sin costo adicional.
          </p>"""
    cot_new = """          <h3 class="font-heading font-black text-xl sm:text-2xl text-white mb-1">
            SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
          </h3>
          <p class="font-armstrong text-fb-goldLight text-xs mb-6 tracking-wide">
            Completa los datos de tu carga y recibe una propuesta formal ajustada al cubicaje y trayecto sin costo adicional.
          </p>"""
    if cot_old in html:
        html = html.replace(cot_old, cot_new)
        print(f"Updated cotización subtitle in {path}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Saved {path} successfully.")

update_file('transportes-fb/index.html')
update_file('public/transportes-fb/index.html')
