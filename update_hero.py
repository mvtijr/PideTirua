import re

hero_replacement = """  <!-- ==========================================
       2. HERO OFICIAL (SISTEMA DE 2 CAPAS: FONDO CINEMÁTICO + LOGO 3D EN CAPA FRONTAL)
       Fondo: Ruta y camión en movimiento al atardecer sin texto (formato 21:9).
       Primer plano: Logotipo oficial 3D en alta definición con transparencia pura.
       ========================================== -->
  <section id="inicio" class="relative w-full aspect-[21/9] min-h-[460px] sm:min-h-[520px] md:min-h-[580px] lg:min-h-0 max-h-[860px] flex items-center justify-between overflow-hidden bg-fb-navyDark group">
    
    <!-- CAPA 1: Fondo Cinemático de la Ruta y el Camión al Atardecer (Sin Texto) -->
    <div class="absolute inset-0 z-0">
      <img src="assets/hero-oficial-bg.jpg" 
           alt="Fotografía cinematográfica de la ruta y camión de carga al atardecer en formato 21:9 para Fuentealba Bastida SpA" 
           class="w-full h-full object-cover object-center select-none pointer-events-none">
      
      <!-- Sutil gradiente para máxima legibilidad sin opacar el camión ni el fondo -->
      <div class="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#071D3A]/80 via-[#071D3A]/20 to-transparent pointer-events-none"></div>
    </div>

    <!-- H1 accesible para SEO -->
    <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>

    <!-- Botón Flecha Izquierda Slider (<) -->
    <button onclick="prevSlide()" class="relative z-30 ml-2 sm:ml-4 w-9 h-9 sm:w-11 sm:h-11 bg-fb-gold/90 hover:bg-fb-gold text-white flex items-center justify-center font-bold text-lg shadow-2xl transition-all cursor-pointer rounded-sm backdrop-blur-sm shrink-0 border border-white/20" aria-label="Anterior">
      <span class="material-symbols-outlined text-[20px] sm:text-[24px]">chevron_left</span>
    </button>

    <!-- CAPA 2: Contenedor Frontal Flotante con Logo 3D en Alta Calidad y Gran Definición -->
    <div class="relative z-20 max-w-xl md:max-w-2xl mr-auto pl-4 sm:pl-10 lg:pl-16 py-6 flex flex-col items-start justify-center">
      
      <!-- Insignia Superior: Flota Propia & Monitoreo 24/7 -->
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-fb-navy/85 border border-fb-gold/40 rounded-sm shadow-xl backdrop-blur-md mb-3">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-fb-goldLight font-heading text-[10px] sm:text-xs font-bold uppercase tracking-wider">
          Flota Propia en Ruta • Monitoreo GPS 24/7
        </span>
      </div>

      <!-- LOGO 3D OFICIAL EN ALTA DEFINICIÓN (Capa Frontal con Transparencia Pura) -->
      <div class="mb-3 relative group/logo">
        <img src="assets/logo-fb-3d.png" 
             alt="Fuentealba Bastida - Transportes y Logística SpA (Logotipo 3D Oficial)" 
             class="h-20 sm:h-24 md:h-28 lg:h-36 xl:h-40 w-auto max-w-full object-contain filter drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)] select-none transition-transform duration-500 group-hover/logo:scale-[1.02]">
      </div>

      <!-- Slogan Corporativo Integrado -->
      <div class="inline-flex items-center gap-2 mb-4">
        <span class="w-6 h-0.5 bg-fb-gold inline-block"></span>
        <span class="font-heading font-extrabold text-xs sm:text-sm text-fb-goldLight uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>
      </div>

      <!-- Botones de Acción (CTA) & Indicadores de Slider -->
      <div class="flex flex-wrap items-center gap-3">
        <a href="#cotizacion" class="px-5 sm:px-6 py-2 sm:py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider shadow-xl transition-all rounded-sm border border-fb-goldLight/30 backdrop-blur-sm">
          SOLICITAR COTIZACIÓN
        </a>
        <a href="#tracking-box" class="px-4 sm:px-5 py-2 sm:py-2.5 bg-fb-navy/85 hover:bg-fb-navy text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-md shadow-xl transition-all rounded-sm">
          RASTREAR GUÍA
        </a>
      </div>

    </div>

    <!-- Botón Flecha Derecha Slider (>) -->
    <button onclick="nextSlide()" class="relative z-30 mr-2 sm:mr-4 w-9 h-9 sm:w-11 sm:h-11 bg-fb-gold/90 hover:bg-fb-gold text-white flex items-center justify-center font-bold text-lg shadow-2xl transition-all cursor-pointer rounded-sm backdrop-blur-sm shrink-0 border border-white/20" aria-label="Siguiente">
      <span class="material-symbols-outlined text-[20px] sm:text-[24px]">chevron_right</span>
    </button>

  </section>"""

for target_file in ['transportes-fb/index.html', 'public/transportes-fb/index.html']:
    with open(target_file, 'r', encoding='utf-8') as f:
        html = f.read()
    
    pattern = r'<!-- =+\s+2\. HERO.*?</section>'
    match = re.search(pattern, html, re.DOTALL)
    if match:
        updated = html[:match.start()] + hero_replacement + html[match.end():]
        with open(target_file, 'w', encoding='utf-8') as f:
            f.write(updated)
        print(f"Updated {target_file} successfully to 2-layer hero!")
    else:
        print(f"Pattern not found in {target_file}")
