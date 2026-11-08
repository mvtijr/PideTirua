import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# New ProSandoval-style Header and Hero
new_header_and_hero = """
<!-- ==========================================
     HEADER ELEGANTE FLOTANTE (ESTILO PROSANDOVAL)
     ========================================== -->
<header class="fixed top-0 left-0 right-0 z-50 bg-[#0d141e]/85 backdrop-blur-md border-b border-white/15 transition-all duration-300">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-20">
      
      <!-- Logo y Nombre de Empresa (Izquierda) -->
      <a href="#inicio" class="flex items-center gap-3 group">
        <div class="w-10 h-10 rounded-full overflow-hidden border border-white/30 bg-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
          <img src="assets/logo-fb.jpg" alt="Logo FB Fuentealba Bastida" class="w-full h-full object-cover">
        </div>
        <div class="flex flex-col">
          <span class="font-bold text-white text-base tracking-wider uppercase leading-none font-['Manrope',sans-serif]">
            FUENTEALBA BASTIDA
          </span>
          <span class="text-[10px] tracking-[0.2em] text-[#f7bd43] uppercase font-semibold mt-1">
            TRANSPORTES Y LOGÍSTICA
          </span>
        </div>
      </a>

      <!-- Enlaces Centrales Limpios y Espaciados -->
      <nav class="hidden lg:flex items-center gap-8 text-xs font-semibold tracking-widest text-slate-200 uppercase font-['Work_Sans',sans-serif]">
        <a href="#inicio" class="text-[#f7bd43] hover:text-white transition-colors">INICIO</a>
        <a href="#cobertura" class="hover:text-[#f7bd43] transition-colors">RUTAS</a>
        <a href="#servicios" class="hover:text-[#f7bd43] transition-colors">SERVICIOS</a>
        <a href="#flota-y-tecnologia" class="hover:text-[#f7bd43] transition-colors">FLOTA</a>
        <a href="#cobertura" class="hover:text-[#f7bd43] transition-colors">COBERTURA</a>
        <a href="#cotizacion" class="hover:text-[#f7bd43] transition-colors">CONTACTO</a>
      </nav>

      <!-- Botón Outlined a la Derecha (Estilo ProSandoval) -->
      <div class="hidden sm:flex items-center gap-3">
        <a href="#cotizacion" class="px-5 py-2 rounded-lg border border-white/40 hover:border-white text-white hover:bg-white/10 text-xs font-bold uppercase tracking-wider transition-all duration-200">
          COTIZAR ENVÍO
        </a>
      </div>

      <!-- Menú Móvil Hamburger -->
      <div class="flex items-center gap-2 lg:hidden">
        <a href="#cotizacion" class="px-3 py-1.5 rounded border border-white/40 text-white text-[11px] font-bold uppercase sm:hidden">
          COTIZAR
        </a>
        <button onclick="toggleMobileMenu()" class="p-2 rounded-lg text-white hover:bg-white/10" aria-label="Abrir menú">
          <span class="material-symbols-outlined text-[26px]">menu</span>
        </button>
      </div>

    </div>
  </div>

  <!-- Mobile Dropdown Menu -->
  <div id="mobile-menu" class="hidden lg:hidden bg-[#0d141e]/98 border-t border-white/10 px-6 py-4 space-y-3">
    <a href="#inicio" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">INICIO</a>
    <a href="#cobertura" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">RUTAS</a>
    <a href="#servicios" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">SERVICIOS</a>
    <a href="#flota-y-tecnologia" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">FLOTA Y TECNOLOGÍA</a>
    <a href="#cobertura" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">COBERTURA</a>
    <a href="#cotizacion" onclick="toggleMobileMenu()" class="block text-xs uppercase tracking-widest text-slate-200 hover:text-[#f7bd43]">CONTACTO Y COTIZACIÓN</a>
  </div>
</header>

<!-- ==========================================
     HERO SECTION CINEMÁTICO (ESTILO EXACTO PROSANDOVAL)
     ========================================== -->
<section id="inicio" class="relative min-h-[92vh] flex items-center justify-center overflow-hidden bg-[#0d141e] pt-20">
  
  <!-- Imagen de Fondo Escénica de Alta Definición con Camión en Ruta -->
  <div class="absolute inset-0 z-0">
    <img src="assets/hero-prosandoval-style.jpg" alt="Camión Fuentealba Bastida en Autopista Escénica" class="w-full h-full object-cover object-center scale-100">
    
    <!-- Scrim Gradiente Oscuro en la Izquierda para Máxima Legibilidad -->
    <div class="absolute inset-0 bg-gradient-to-r from-[#0d141e]/95 via-[#0d141e]/75 to-transparent sm:via-[#0d141e]/60 sm:to-transparent"></div>
    <div class="absolute inset-0 bg-gradient-to-t from-[#0d141e] via-transparent to-transparent"></div>
  </div>

  <!-- Contenedor Principal Hero -->
  <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32 w-full">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
      
      <!-- Columna Izquierda: Información Estilo ProSandoval -->
      <div class="lg:col-span-7 flex flex-col items-start gap-4 text-left">
        
        <!-- 5 Estrellas Naranjas / Doradas (Idéntico a la Referencia) -->
        <div class="flex items-center gap-1.5 text-[#F59E0B]">
          <span class="material-symbols-outlined text-[20px] fill-current">star</span>
          <span class="material-symbols-outlined text-[20px] fill-current">star</span>
          <span class="material-symbols-outlined text-[20px] fill-current">star</span>
          <span class="material-symbols-outlined text-[20px] fill-current">star</span>
          <span class="material-symbols-outlined text-[20px] fill-current">star</span>
          <span class="ml-2 text-xs font-semibold text-slate-300 tracking-wider uppercase hidden sm:inline-block">
            • Calidad & Puntualidad Garantizada
          </span>
        </div>

        <!-- Título H1 Limpio y Contundente -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-['Manrope',sans-serif]">
          Servicio express<br>
          <span class="text-white">de transporte</span>
        </h1>

        <!-- Párrafo Descriptivo Fiel a la Referencia e Información de la Empresa -->
        <p class="text-slate-200 text-sm sm:text-base lg:text-lg max-w-xl font-normal leading-relaxed text-balance opacity-90 font-['Work_Sans',sans-serif]">
          Te brindamos una completa seguridad, puntualidad y tecnología satelital en el traslado hacia tu destino favorito de nuestro país. Conoce nuestras frecuencias diarias.
        </p>

        <!-- Botones de Acción Estilo ProSandoval -->
        <div class="flex flex-wrap items-center gap-4 pt-2">
          <!-- Botón Azul Sólido 'VER RUTAS' (Exacto a la imagen) -->
          <a href="#cobertura" class="px-8 py-3.5 rounded-lg bg-[#2b7cbd] hover:bg-[#1e6ca8] text-white font-bold text-xs sm:text-sm tracking-widest uppercase shadow-lg shadow-[#2b7cbd]/30 hover:scale-[1.02] transition-all">
            VER RUTAS
          </a>

          <!-- Botón Secundario Transparente 'COTIZAR ENVÍO' -->
          <a href="#cotizacion" class="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm tracking-wider uppercase border border-white/25 backdrop-blur-sm transition-all">
            SOLICITAR COTIZACIÓN
          </a>
        </div>

        <!-- Mini Widget de Rastreo Satelital Integrado en el Hero -->
        <div class="mt-4 pt-4 border-t border-white/15 w-full max-w-lg">
          <form onsubmit="event.preventDefault(); simulateTracking();" class="flex flex-col sm:flex-row gap-2">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-slate-400 text-[18px]">search</span>
              <input type="text" id="tracking-code" value="FB-2025-9842" placeholder="Número de Guía / OT (ej: FB-2025-9842)" class="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d141e]/80 border border-white/20 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-[#f7bd43] transition-colors">
            </div>
            <button type="submit" class="px-4 py-2 bg-[#f7bd43] hover:bg-[#e5aa45] text-[#0d141e] font-bold text-xs uppercase tracking-wider rounded-lg transition-colors whitespace-nowrap">
              Rastrear Carga
            </button>
          </form>

          <!-- Resultado Dinámico de Rastreo -->
          <div id="tracking-result" class="hidden mt-3 p-3 rounded-lg bg-[#0d141e]/90 border border-white/20 text-xs">
          </div>
        </div>

      </div>

      <!-- Columna Derecha: Espacio para destacar el camión y credenciales -->
      <div class="lg:col-span-5 hidden lg:flex flex-col items-end justify-center text-right space-y-4">
        <div class="bg-[#0d141e]/70 backdrop-blur-md px-4 py-3 rounded-xl border border-white/15 shadow-2xl space-y-1">
          <div class="flex items-center justify-end gap-2 text-[#f7bd43] text-xs font-bold uppercase tracking-wider">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Monitoreo GPS 24/7 Activo
          </div>
          <div class="text-white text-sm font-semibold">Flota Propia Homologada en Ruta</div>
          <div class="text-slate-300 text-xs">Conectamos Santiago, Concepción y todo Chile</div>
        </div>
      </div>

    </div>
  </div>

  <!-- Sutil línea de cierre de sección -->
  <div class="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0d141e] to-transparent pointer-events-none"></div>
</section>
"""

# Replace old <header> and <section id="inicio">...</section>
# First locate old header
header_and_hero_pattern = re.compile(r'<header[\s\S]*?</section>', re.MULTILINE)

match = header_and_hero_pattern.search(html)
if match:
    print(f"Matched header and hero: length {len(match.group(0))}")
    html = html[:match.start()] + new_header_and_hero.strip() + html[match.end():]
    print("Successfully replaced with new ProSandoval-style Header and Hero!")
else:
    print("Could not match header and hero with regex, trying alternate pattern...")

# Add toggleMobileMenu function if not present
if 'function toggleMobileMenu()' not in html:
    toggle_script = """
    function toggleMobileMenu() {
      const menu = document.getElementById('mobile-menu');
      if (menu) {
        menu.classList.toggle('hidden');
      }
    }
    """
    html = html.replace('</script>', toggle_script + '\n</script>')

with open('transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Updated both transportes-fb/index.html and public/transportes-fb/index.html successfully!")
