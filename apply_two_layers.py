def update_hero_two_layers(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    start_tag = '<section id="inicio"'
    end_tag = '</section>'
    start_idx = html.find(start_tag)
    end_idx = html.find(end_tag, start_idx) + len(end_tag)

    if start_idx == -1 or end_idx == -1:
        print(f"Hero section not found in {path}")
        return

    new_hero = """  <!-- ==========================================
       2. HERO SECTION CINEMÁTICO EN 2 CAPAS
          Capa 1 (Fondo): Ruta y camiones al atardecer en formato 21:9
          Capa 2 (Frontal): Logotipo 3D Oficial con transparencia y máxima nitidez
       ========================================== -->
  <section id="inicio" class="relative w-full aspect-[21/9] min-h-[440px] sm:min-h-[500px] md:min-h-[560px] lg:min-h-[620px] max-h-[850px] flex items-center overflow-hidden bg-fb-navyDark group">
    
    <!-- CAPA 1: Fondo Cinemático de la Ruta y Camiones al Atardecer (Sin Texto) -->
    <div class="absolute inset-0 z-0">
      <picture>
        <source srcset="assets/hero-bg-ruta.webp" type="image/webp">
        <img src="assets/hero-bg-ruta.jpg" 
             alt="Camiones de carga de Fuentealba Bastida en autopista al atardecer" 
             class="w-full h-full object-cover object-center select-none pointer-events-none"
             loading="eager"
             fetchpriority="high">
      </picture>
      
      <!-- Sutil gradiente para máxima legibilidad sin opacar los camiones -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/45 via-transparent to-transparent pointer-events-none"></div>
      <div class="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-[#071D3A]/85 via-[#071D3A]/20 to-transparent pointer-events-none"></div>
    </div>

    <!-- H1 accesible para SEO -->
    <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>

    <!-- CAPA 2: Contenedor Frontal con Logo 3D en Alta Definición y Acciones -->
    <div class="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-6 flex flex-col justify-center items-start">
      
      <!-- Insignia Superior: Flota Propia & Monitoreo 24/7 -->
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-fb-navy/85 border border-fb-gold/40 rounded-sm shadow-xl backdrop-blur-md mb-2 sm:mb-3">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-fb-goldLight text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Flota Propia en Ruta • Monitoreo GPS 24/7
        </span>
      </div>

      <!-- LOGO 3D OFICIAL EN ALTA DEFINICIÓN (Capa Frontal con Transparencia Pura) -->
      <div class="mb-2 sm:mb-3 max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[540px] xl:max-w-[580px] transition-transform duration-500 hover:scale-[1.02]">
        <picture>
          <source srcset="assets/logo-fb-3d-hd.webp" type="image/webp">
          <img src="assets/logo-fb-3d-hd.png" 
               alt="Fuentealba Bastida - Transportes y Logística SpA (Logotipo 3D Oficial)" 
               class="w-full h-auto object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.85)] select-none">
        </picture>
      </div>

      <!-- Slogan Corporativo Integrado -->
      <div class="inline-flex items-center gap-2 mb-3 sm:mb-4">
        <span class="w-6 h-0.5 bg-fb-gold inline-block"></span>
        <span class="hero-slogan font-bold text-xs sm:text-sm text-fb-goldLight uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>
      </div>

      <!-- Botones de Acción (CTA) -->
      <div class="flex flex-wrap items-center gap-3">
        <a href="#cotizacion" class="px-5 sm:px-6 py-2 sm:py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-2xl transition-all rounded-sm border border-fb-goldLight/30 backdrop-blur-sm hover:scale-[1.02]">
          SOLICITAR COTIZACIÓN
        </a>
        <a href="#tracking-box" class="px-4 sm:px-5 py-2 sm:py-2.5 bg-fb-navy/85 hover:bg-fb-navy text-white font-bold text-xs sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-md shadow-2xl transition-all rounded-sm hover:border-fb-goldLight">
          RASTREAR GUÍA
        </a>
      </div>

    </div>

  </section>"""

    html = html[:start_idx] + new_hero + html[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated 2-layer hero in {path}")

update_hero_two_layers('transportes-fb/index.html')
update_hero_two_layers('public/transportes-fb/index.html')
