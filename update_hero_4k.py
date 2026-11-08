import os

def update_hero(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find the entire hero section
    start_tag = '<section id="inicio"'
    end_tag = '</section>'
    start_idx = html.find(start_tag)
    end_idx = html.find(end_tag, start_idx) + len(end_tag)

    if start_idx == -1 or end_idx == -1:
        print(f"Hero section not found in {path}")
        return

    new_hero = """  <!-- ==========================================
       2. HERO SECTION CINEMÁTICO 4K ULTRA-HD
          Logotipo 3D Oficial integrado en escena de carretera al atardecer
       ========================================== -->
  <section id="inicio" class="relative w-full aspect-[16/9] min-h-[480px] sm:min-h-[560px] md:min-h-[640px] lg:min-h-[720px] max-h-[88vh] flex flex-col justify-between overflow-hidden bg-fb-navyDark group">
    
    <!-- Imagen Principal 4K Ultra-HD con soporte WebP de alta fidelidad -->
    <div class="absolute inset-0 z-0">
      <picture>
        <source srcset="assets/hero-4k.webp" type="image/webp">
        <img src="assets/hero-4k.jpg" 
             alt="Fuentealba Bastida - Transportes y Logística SpA | Escena Hero 4K Oficial con Logotipo 3D y Flota en Carretera" 
             class="w-full h-full object-cover object-center select-none"
             loading="eager"
             fetchpriority="high">
      </picture>
      
      <!-- Sutil gradiente inferior para fundido armónico con la sección siguiente -->
      <div class="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#071D3A]/85 via-[#071D3A]/25 to-transparent pointer-events-none"></div>
    </div>

    <!-- H1 accesible para SEO -->
    <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>

    <!-- Barra Superior Sutil (Espaciador / Badge Flotante) -->
    <div class="relative z-20 w-full px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 flex items-center justify-between">
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-fb-navy/80 border border-fb-gold/40 rounded-sm shadow-xl backdrop-blur-md">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-fb-goldLight font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Flota Propia en Ruta • Monitoreo GPS 24/7
        </span>
      </div>

      <!-- Slogan Corporativo en Armstrong -->
      <div class="hidden md:inline-flex items-center gap-2 px-3 py-1 bg-[#071D3A]/70 border border-white/10 rounded-sm backdrop-blur-sm">
        <span class="w-3 h-0.5 bg-fb-gold inline-block"></span>
        <span class="font-armstrong hero-slogan font-bold text-xs text-white uppercase tracking-wider drop-shadow-md">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>
      </div>
    </div>

    <!-- Barra Inferior de Acciones Rápidas (CTA) Integrada al Pie del Hero -->
    <div class="relative z-20 w-full px-4 sm:px-8 lg:px-12 pb-5 sm:pb-7 flex flex-wrap items-center justify-between gap-3">
      <!-- Botones de Acción Principales -->
      <div class="flex flex-wrap items-center gap-3">
        <a href="#cotizacion" class="px-5 sm:px-7 py-2.5 sm:py-3 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl transition-all rounded-sm border border-fb-goldLight/40 backdrop-blur-sm hover:scale-[1.02]">
          SOLICITAR COTIZACIÓN
        </a>
        <a href="#tracking-box" class="px-5 sm:px-6 py-2.5 sm:py-3 bg-fb-navy/90 hover:bg-fb-navy text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-md shadow-2xl transition-all rounded-sm hover:border-fb-goldLight">
          RASTREAR GUÍA
        </a>
      </div>

      <!-- Indicador de Cobertura Nacional -->
      <div class="hidden sm:flex items-center gap-3 text-white/90 text-xs font-heading font-bold uppercase tracking-wider drop-shadow-md">
        <span class="inline-block w-2 h-2 rounded-full bg-fb-gold"></span>
        <span>Arica a Punta Arenas • Salidas Diarias</span>
      </div>
    </div>

  </section>"""

    html = html[:start_idx] + new_hero + html[end_idx:]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"Updated hero in {path}")

update_hero('transportes-fb/index.html')
update_hero('public/transportes-fb/index.html')
