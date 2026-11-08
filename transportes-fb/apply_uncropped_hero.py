import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace Header and Hero with the complete, uncropped 16:9 widescreen composition
perfect_hero_and_header = """
<!-- ==========================================
     HEADER ELEGANTE FLOTANTE (ESTILO PROSANDOVAL)
     ========================================== -->
<header class="absolute top-0 left-0 right-0 z-40 bg-[#0d141e]/40 backdrop-blur-sm border-b border-white/20 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16 sm:h-20">
      
      <!-- Logo y Nombre de Empresa (Izquierda) -->
      <a href="#inicio" class="flex items-center gap-3 group">
        <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden border border-white/30 bg-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
          <img src="assets/logo-fb.jpg" alt="Logo FB Fuentealba Bastida" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col">
          <span class="font-extrabold text-white text-sm sm:text-base tracking-wider uppercase leading-none font-['Manrope',sans-serif]">
            FUENTEALBA BASTIDA
          </span>
          <span class="text-[9px] sm:text-[10px] tracking-[0.2em] text-[#f7bd43] uppercase font-semibold mt-1">
            TRANSPORTES Y LOGÍSTICA
          </span>
        </div>
      </a>

      <!-- Enlaces Centrales Limpios y Espaciados -->
      <nav class="hidden lg:flex items-center gap-7 text-xs font-semibold tracking-widest text-slate-100 uppercase font-['Work_Sans',sans-serif]">
        <a href="#inicio" class="text-[#f7bd43] hover:text-white transition-colors">INICIO</a>
        <a href="#cobertura" class="hover:text-[#f7bd43] transition-colors">RUTAS</a>
        <a href="#servicios" class="hover:text-[#f7bd43] transition-colors">SERVICIOS</a>
        <a href="#flota-y-tecnologia" class="hover:text-[#f7bd43] transition-colors">FLOTA</a>
        <a href="#cobertura" class="hover:text-[#f7bd43] transition-colors">COBERTURA</a>
        <a href="#cotizacion" class="hover:text-[#f7bd43] transition-colors">CONTACTO</a>
      </nav>

      <!-- Botón Outlined a la Derecha (Estilo Exacto ProSandoval) -->
      <div class="hidden sm:flex items-center gap-3">
        <a href="#cotizacion" class="px-5 py-2 rounded-md border border-white/50 hover:border-white text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-200">
          COTIZAR
        </a>
      </div>

      <!-- Menú Móvil Hamburger -->
      <div class="flex items-center gap-2 lg:hidden">
        <a href="#cotizacion" class="px-3 py-1.5 rounded border border-white/40 text-white text-[11px] font-bold uppercase sm:hidden">
          COTIZAR
        </a>
        <button onclick="toggleMobileMenu()" class="p-2 rounded-lg text-white hover:bg-white/10" aria-label="Abrir menú">
          <span class="material-symbols-outlined text-[24px]">menu</span>
        </button>
      </div>

    </div>
  </div>

  <!-- Mobile Dropdown Menu -->
  <div id="mobile-menu" class="hidden lg:hidden bg-[#0d141e]/95 border-t border-white/15 px-6 py-4 space-y-3">
    <a href="#inicio" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">INICIO</a>
    <a href="#cobertura" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">RUTAS</a>
    <a href="#servicios" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">SERVICIOS</a>
    <a href="#flota-y-tecnologia" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">FLOTA Y TECNOLOGÍA</a>
    <a href="#cobertura" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">COBERTURA</a>
    <a href="#cotizacion" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">CONTACTO Y COTIZACIÓN</a>
  </div>
</header>

<!-- ==========================================
     HERO SECTION CINEMÁTICO COMPLETO (16:9 WIDESCREEN)
     ========================================== -->
<section id="inicio" class="relative w-full overflow-hidden bg-[#0d141e] min-h-[580px] lg:min-h-[660px] xl:min-h-[720px] max-h-[860px] flex items-center">
  
  <!-- Imagen de Fondo Completa (1920x1080) sin cortes -->
  <div class="absolute inset-0 z-0">
    <img src="assets/hero-full-scene.jpg" alt="Servicio express de transporte de carga - Fuentealba Bastida" class="w-full h-full object-cover object-bottom sm:object-center select-none pointer-events-none">
  </div>

  <!-- Contenido Flotante Izquierdo (Estilo Exacto de la Referencia) -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pt-20 sm:pt-24 pb-12 sm:pb-16 flex items-center">
    <div class="max-w-xl flex flex-col items-start text-left">
      
      <!-- 5 Estrellas Naranjas (Idéntico a la Referencia) -->
      <div class="flex items-center gap-1 text-[#ea580c] sm:text-[#f97316] mb-3">
        <span class="material-symbols-outlined text-[19px] sm:text-[21px] fill-current">star</span>
        <span class="material-symbols-outlined text-[19px] sm:text-[21px] fill-current">star</span>
        <span class="material-symbols-outlined text-[19px] sm:text-[21px] fill-current">star</span>
        <span class="material-symbols-outlined text-[19px] sm:text-[21px] fill-current">star</span>
        <span class="material-symbols-outlined text-[19px] sm:text-[21px] fill-current">star</span>
      </div>

      <!-- Título H1 con tipografía exacta y estilo de frase -->
      <h1 class="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.08] mb-4 font-['Manrope',sans-serif]">
        Servicio express<br>
        de transporte
      </h1>

      <!-- Párrafo descriptivo fiel a la referencia e información corporativa -->
      <p class="text-slate-100 text-xs sm:text-sm md:text-base max-w-md font-normal leading-relaxed mb-6 opacity-95 font-['Work_Sans',sans-serif] text-balance">
        Te brindamos una completa seguridad y comodidad en el traslado hacia tu lugar favorito de nuestro país. Conoce nuestras frecuencias diarias.
      </p>

      <!-- Botón Azul Sólido 'VER RUTAS' (Estilo Exacto ProSandoval) -->
      <div class="flex items-center gap-3">
        <a href="#cobertura" class="px-7 py-3 rounded-md bg-[#2583c7] hover:bg-[#1d6fa8] text-white font-bold text-xs sm:text-sm tracking-widest uppercase shadow-md hover:shadow-lg transition-all">
          VER RUTAS
        </a>
        <a href="#cotizacion" class="px-5 py-3 rounded-md bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm tracking-wider uppercase border border-white/30 backdrop-blur-sm transition-all hidden sm:inline-flex">
          COTIZAR ENVÍO
        </a>
      </div>

      <!-- Mini Acceso Rápido de Tracking -->
      <div class="mt-6 pt-3 border-t border-white/20 flex items-center gap-2 text-xs text-slate-300">
        <span class="material-symbols-outlined text-[#f7bd43] text-[18px]">satellite_alt</span>
        <span>Rastreo satelital:</span>
        <a href="#tracking-form" class="font-mono text-[#f7bd43] font-bold hover:underline">OT FB-2025-9842</a>
      </div>

    </div>
  </div>

  <!-- Borde inferior sutil de carretera -->
  <div class="absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-[#0d141e]/80 to-transparent pointer-events-none"></div>
</section>
"""

# Replace in html
pattern = re.compile(r'<header[\s\S]*?</section>', re.MULTILINE)
html = pattern.sub(perfect_hero_and_header.strip(), html, count=1)

with open('transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated transportes-fb/index.html with full scene hero!")
