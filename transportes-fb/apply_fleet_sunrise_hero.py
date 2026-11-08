import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace the hero background class and the hero section HTML
new_hero_section = """
  <!-- ==========================================
       2. HERO SLIDER SECTION (IMAGEN COMPLETA DE FLOTA AL AMANECER)
       ========================================== -->
  <section id="inicio" class="relative w-full aspect-[1024/434] min-h-[520px] sm:min-h-[580px] lg:min-h-0 lg:max-h-[820px] flex items-center justify-between px-3 sm:px-6 lg:px-12 overflow-hidden bg-fb-navyDark">
    
    <!-- Imagen de Fondo Completa (Sin Recortes) -->
    <div class="absolute inset-0 z-0">
      <img src="assets/hero-fleet-sunrise-hd.jpg" alt="Flota Fuentealba Bastida en Autopista al Amanecer" class="w-full h-full object-cover object-right sm:object-cover lg:object-fill select-none pointer-events-none">
      
      <!-- Degradado suave en la izquierda para lectura sin tapar los camiones de la derecha -->
      <div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/95 via-[#071D3A]/60 to-transparent sm:via-[#071D3A]/40 sm:to-transparent"></div>
    </div>

    <!-- Botón Flecha Izquierda Slider (<) -->
    <button onclick="prevSlide()" class="relative z-20 w-10 h-10 sm:w-11 sm:h-11 bg-fb-gold hover:bg-fb-goldLight text-white flex items-center justify-center font-bold text-lg shadow-xl transition-colors cursor-pointer rounded-sm shrink-0" aria-label="Anterior">
      <span class="material-symbols-outlined text-[22px] sm:text-[24px]">chevron_left</span>
    </button>

    <!-- Contenido Hero alineado a la Izquierda (Sobre la carretera abierta y el sol) -->
    <div class="relative z-10 max-w-xl mr-auto text-left py-6 sm:py-8 pl-2 sm:pl-6">
      
      <!-- Badge de Identidad -->
      <div class="inline-flex items-center gap-2 px-3 py-1 bg-fb-navy/80 border border-fb-gold/40 rounded-sm mb-3 backdrop-blur-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span class="text-fb-goldLight font-heading text-[11px] font-bold uppercase tracking-wider">
          Flota Propia en Ruta • Monitoreo GPS 24/7
        </span>
      </div>

      <!-- Gran Título Blanco Mayúsculas -->
      <h1 class="font-heading font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white tracking-tight leading-[1.05] mb-3 sm:mb-4 drop-shadow-md">
        LA EMPRESA EN QUE PUEDES CONFIAR
      </h1>

      <!-- Párrafo en Tono Dorado Suave (#C5A059) -->
      <p class="text-fb-goldGlow text-xs sm:text-sm lg:text-base leading-relaxed mb-4 sm:mb-6 font-normal drop-shadow max-w-lg">
        Fuentealba Bastida Transportes y Logística SpA entrega soluciones integrales de carga pesada y distribución terrestre en todo Chile. Conectamos destinos con tecnología satelital y la máxima puntualidad operativa.
      </p>

      <!-- Indicador de Puntos Slider (Punto activo Dorado, blancos inactivos) -->
      <div class="flex items-center gap-2 mb-4 sm:mb-6">
        <span class="w-3.5 h-3.5 rounded-full bg-fb-gold border-2 border-white"></span>
        <span class="w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-white cursor-pointer"></span>
        <span class="w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-white cursor-pointer"></span>
      </div>

      <!-- Botón de Acción Principal Dorado & Secundario -->
      <div class="flex flex-wrap items-center gap-3">
        <a href="#cotizacion" class="px-6 sm:px-7 py-2.5 sm:py-3 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all rounded-sm">
          SOLICITAR COTIZACIÓN
        </a>
        <a href="#tracking-box" class="px-5 py-2.5 sm:py-3 bg-fb-navy/80 hover:bg-fb-navy text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-sm transition-all rounded-sm">
          RASTREAR GUÍA
        </a>
      </div>

    </div>

    <!-- Botón Flecha Derecha Slider (>) -->
    <button onclick="nextSlide()" class="relative z-20 w-10 h-10 sm:w-11 sm:h-11 bg-fb-gold hover:bg-fb-goldLight text-white flex items-center justify-center font-bold text-lg shadow-xl transition-colors cursor-pointer rounded-sm shrink-0" aria-label="Siguiente">
      <span class="material-symbols-outlined text-[22px] sm:text-[24px]">chevron_right</span>
    </button>

  </section>
"""

# Replace section 2 in html
hero_pattern = re.compile(r'<!-- ==========================================\s*2\. HERO SLIDER SECTION[\s\S]*?</section>', re.MULTILINE)
match = hero_pattern.search(html)
if match:
    html = html[:match.start()] + new_hero_section.strip() + html[match.end():]
    print("Hero section updated successfully with new fleet sunrise image!")
else:
    print("Could not match hero section directly, trying alternative replacement...")
    # fallback
    html = re.sub(r'<section id="inicio"[\s\S]*?</section>', new_hero_section.strip(), html, count=1)

with open('transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated both transportes-fb/index.html and public/transportes-fb/index.html successfully!")
