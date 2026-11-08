import os

file_path = 'transportes-fb/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    html = f.read()

# Normalize line endings for replacement
crlf = '\r\n' in html
text = html.replace('\r\n', '\n')

# 1. Update #claves (remove canvas, keep clean dark section with z-10)
old_claves = """  <section id="claves" class="relative w-full bg-fb-charcoal text-white py-14 lg:py-20 border-t border-b border-fb-gold/30 overflow-hidden">
    <!-- WebGL GlassFold Shader Background: Opción 3 (Claves y Servicios) -->
    <canvas id="canvas-glass-claves" class="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0"></canvas>
    <div class="absolute inset-0 bg-gradient-to-r from-fb-charcoalDark/85 via-fb-charcoalDark/50 to-fb-charcoalDark/85 pointer-events-none z-0"></div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

new_claves = """  <section id="claves" class="relative w-full bg-fb-charcoal text-white py-14 lg:py-20 border-t border-b border-fb-gold/30 overflow-hidden">
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

if old_claves in text:
    text = text.replace(old_claves, new_claves)
    print("Updated #claves: canvas removed, text preserved in z-10")
else:
    print("WARNING: old_claves not matched")

# 2. Update #servicios (White Section with GlassFold canvas background strictly in z-0, cards in z-10)
old_servicios = """  <!-- ==========================================
       6. SECCIÓN TRES TARJETAS: QUIÉNES SOMOS, ¿POR QUÉ ELEGIRNOS?, ¿QUÉ HACEMOS?
       ========================================== -->
  <section id="servicios" class="w-full bg-fb-smoke py-14 lg:py-20 text-[#071D3A]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

new_servicios = """  <!-- ==========================================
       6. SECCIÓN TRES TARJETAS: QUIÉNES SOMOS, ¿POR QUÉ ELEGIRNOS?, ¿QUÉ HACEMOS?
          (FONDO BLANCO CON SHADER GLASSS-FOLD DETRÁS DEL TEXTO)
       ========================================== -->
  <section id="servicios" class="relative w-full bg-white py-16 lg:py-24 text-[#071D3A] overflow-hidden">
    <!-- WebGL GlassFold Shader: Fondo Animado Exclusivo en Sección Blanca (z-0 y detrás de todo) -->
    <canvas id="canvas-glass-servicios" class="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></canvas>
    
    <!-- Contenedor Superior en z-10: 100% Legibilidad y Contraste -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

if old_servicios in text:
    text = text.replace(old_servicios, new_servicios)
    print("Updated #servicios header: added canvas-glass-servicios at z-0 background")
else:
    print("WARNING: old_servicios not matched")

# Update 3 cards in servicios to ensure relative z-10 and backdrop
old_card = 'class="bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between items-start border-t-4 border-fb-gold rounded-sm"'
new_card = 'class="bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-lg hover:shadow-2xl flex flex-col justify-between items-start border-t-4 border-fb-gold rounded-sm relative z-10 transition-all duration-300 hover:-translate-y-1"'
if old_card in text:
    text = text.replace(old_card, new_card)
    print("Updated cards in #servicios with relative z-10")
else:
    print("WARNING: old_card not matched")

# 3. Update #cotizacion (Make it a clean white/light section with canvas background at z-0, form at z-10)
old_cotizacion_head = """  <section id="cotizacion" class="relative w-full bg-[#071324] py-16 lg:py-24 border-t border-fb-gold/30 overflow-hidden">
    <!-- WebGL GlassFold Shader Background: Opción 2 (Fondo Cotización B2B) -->
    <canvas id="canvas-glass-cotizacion" class="absolute inset-0 w-full h-full pointer-events-none opacity-70 z-0"></canvas>
    <div class="absolute inset-0 bg-gradient-to-b from-[#071D3A]/60 via-transparent to-[#071D3A]/80 pointer-events-none z-0"></div>
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="font-heading font-bold text-xs uppercase tracking-widest text-fb-goldText">Cotización Inmediata B2B</span>
        <h2 class="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight mt-1">
          SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
        </h2>
        <p class="text-slate-300 text-xs sm:text-sm mt-2">
          Completa los datos de tu carga y recibe una propuesta formal ajustada al cubicaje, ruta y requerimientos específicos de tu empresa.
        </p>
      </div>"""

new_cotizacion_head = """  <section id="cotizacion" class="relative w-full bg-[#F8F9FA] py-16 lg:py-24 border-t border-slate-200 overflow-hidden">
    <!-- WebGL GlassFold Shader: Fondo Animado Exclusivo en Sección Blanca (z-0 y detrás de todo) -->
    <canvas id="canvas-glass-cotizacion" class="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-20" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></canvas>
    
    <!-- Contenedor Superior en z-10: 100% Legibilidad y Contraste -->
    <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="font-heading font-bold text-xs uppercase tracking-widest text-fb-goldText">Cotización Inmediata B2B</span>
        <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#071D3A] tracking-tight mt-1">
          SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
        </h2>
        <p class="text-slate-600 text-xs sm:text-sm mt-2 font-normal">
          Completa los datos de tu carga y recibe una propuesta formal ajustada al cubicaje, ruta y requerimientos específicos de tu empresa.
        </p>
      </div>"""

if old_cotizacion_head in text:
    text = text.replace(old_cotizacion_head, new_cotizacion_head)
    print("Updated #cotizacion section header with clean white bg and z-0 canvas")
else:
    print("WARNING: old_cotizacion_head not matched")

# Update form wrapper in #cotizacion
old_form_wrap = '<div class="bg-white p-6 sm:p-10 shadow-lg border-t-4 border-fb-navy rounded-sm">'
new_form_wrap = '<div class="bg-white p-6 sm:p-10 shadow-xl border-t-4 border-fb-gold rounded-sm relative z-10">'
if old_form_wrap in text:
    text = text.replace(old_form_wrap, new_form_wrap)
    print("Updated form wrapper with relative z-10 and gold accent border")
else:
    print("WARNING: old_form_wrap not matched")

# 4. Update tracking box: remove canvas inside tracking box, keep it clean and crisp at relative z-10
old_tracking = """      <!-- WIDGET RASTREO SATELITAL RÁPIDO EN AZUL MARINO -->
      <div id="tracking-box" class="relative mt-8 bg-fb-navyDark text-white p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-fb-gold/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <!-- WebGL GlassFold Shader Background: Opción 1 (Rastreo y Telemetría Satelital) -->
        <canvas id="canvas-glass-tracking" class="absolute inset-0 w-full h-full pointer-events-none opacity-85 z-0"></canvas>
        <div class="absolute inset-0 bg-gradient-to-r from-fb-navyDark/90 via-fb-navyDark/60 to-fb-navyDark/90 pointer-events-none z-0"></div>
        <div class="relative z-10 flex items-center gap-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-fb-gold text-[32px]">satellite_alt</span>
          <div>
            <h4 class="font-heading font-bold text-base uppercase text-white">RASTREAR ORDEN DE TRANSPORTE (OT)</h4>
            <p class="text-slate-300 text-xs">Monitoreo satelital GPS en tiempo real de tu carga en ruta</p>
          </div>
        </div>
        </div>
        <div class="relative z-10 w-full md:w-auto">
        <form onsubmit="event.preventDefault(); simulateTracking();" class="flex w-full md:w-auto gap-2">
          <input type="text" id="tracking-code" value="FB-2025-9842" placeholder="Ej: FB-2025-9842" class="px-3 py-2 bg-fb-navyDark border border-fb-gold/40 text-white text-xs font-mono uppercase focus:outline-none focus:border-fb-gold">
          <button type="submit" class="px-5 py-2 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm">
            CONSULTAR
          </button>
        </form>
        </div>
      </div>"""

new_tracking = """      <!-- WIDGET RASTREO SATELITAL RÁPIDO EN AZUL MARINO (EN CAPA z-10) -->
      <div id="tracking-box" class="relative z-10 mt-8 bg-fb-navy text-white p-6 sm:p-8 rounded-lg shadow-xl border-2 border-fb-gold/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-fb-gold text-[32px]">satellite_alt</span>
            <div>
              <h4 class="font-heading font-bold text-base uppercase text-white">RASTREAR ORDEN DE TRANSPORTE (OT)</h4>
              <p class="text-slate-300 text-xs">Monitoreo satelital GPS en tiempo real de tu carga en ruta</p>
            </div>
          </div>
        </div>
        <div class="w-full md:w-auto">
          <form onsubmit="event.preventDefault(); simulateTracking();" class="flex w-full md:w-auto gap-2">
            <input type="text" id="tracking-code" value="FB-2025-9842" placeholder="Ej: FB-2025-9842" class="px-3 py-2 bg-fb-navyDark border border-fb-gold/40 text-white text-xs font-mono uppercase focus:outline-none focus:border-fb-gold">
            <button type="submit" class="px-5 py-2 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm">
              CONSULTAR
            </button>
          </form>
        </div>
      </div>"""

if old_tracking in text:
    text = text.replace(old_tracking, new_tracking)
    print("Updated tracking box: canvas removed, clean relative z-10")
else:
    print("WARNING: old_tracking not matched")

# 5. Update JS initialization at the bottom
old_js = """      // Initialize all 3 implementations with official brand palette
      document.addEventListener('DOMContentLoaded', () => {
        // Opción 1: Tracking & Telemetría Satelital (Destellos dorados vivos con azul marino)
        initGlassFoldCanvas('canvas-glass-tracking', {
          color1: '#0E284D', // Azul marino medio
          color2: '#041224', // Azul noche oscuro
          color3: '#C5A059', // Destellos dorados en los bordes
          speed: 0.35,
          scale: 1.4,
          noise: 0.08
        });

        // Opción 2: Fondo del Cotizador B2B (Elegante y sutil para alta conversión)
        initGlassFoldCanvas('canvas-glass-cotizacion', {
          color1: '#071D3A', // Azul marino corporativo
          color2: '#030C18', // Fondo oscuro profundo
          color3: '#8E7037', // Acento bronce/dorado corporativo
          speed: 0.20,
          scale: 1.0,
          noise: 0.06
        });

        // Opción 3: Bloque Claves del Éxito & Servicios Integrales (Reflejos de cristal)
        initGlassFoldCanvas('canvas-glass-claves', {
          color1: '#122542', // Azul marino industrial
          color2: '#0A121D', // Carbón azulado
          color3: '#94753B', // Filo dorado ocre
          speed: 0.25,
          scale: 1.2,
          noise: 0.07
        });
      });"""

new_js = """      // Inicialización WebGL GlassFold EXCLUSIVAMENTE en el fondo de las secciones de color blanco
      document.addEventListener('DOMContentLoaded', () => {
        // Apartado Blanco 1: Sección de Servicios / Quiénes Somos / Por Qué Elegirnos / Qué Hacemos
        initGlassFoldCanvas('canvas-glass-servicios', {
          color1: '#071D3A', // Azul marino corporativo
          color2: '#0E284D', // Azul marino intermedio
          color3: '#C5A059', // Reflejos dorados en las aristas de cristal
          speed: 0.20,
          scale: 1.1,
          noise: 0.04
        });

        // Apartado Blanco 2: Sección de Cotización Rápida B2B
        initGlassFoldCanvas('canvas-glass-cotizacion', {
          color1: '#071D3A', // Azul marino corporativo
          color2: '#0A1E3C', // Azul marino noche
          color3: '#8E7037', // Acento bronce / dorado oficial
          speed: 0.18,
          scale: 1.0,
          noise: 0.04
        });
      });"""

if old_js in text:
    text = text.replace(old_js, new_js)
    print("Updated JS initialization: only canvas-glass-servicios and canvas-glass-cotizacion")
else:
    print("WARNING: old_js not matched")

# Restore line endings
final_html = text.replace('\n', '\r\n') if crlf else text

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

# Also copy to public/transportes-fb/index.html
import shutil
shutil.copyfile(file_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
