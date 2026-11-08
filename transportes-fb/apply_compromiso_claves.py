import os
import shutil

file_path = 'transportes-fb/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# 1. Update #compromiso: add canvas-glass-compromiso in background (z-0), wrap text in relative z-10
old_compromiso = """  <section id="compromiso" class="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
    
    <!-- Columna Izquierda: Fondo Azul Marino Oscuro #071D3A (60% ancho) -->
    <div class="lg:col-span-7 bg-fb-navy text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-start border-r border-fb-gold/20">
      <div class="inline-flex items-center gap-2 mb-2">
        <span class="w-8 h-1 bg-fb-gold"></span>
        <span class="text-fb-goldLight font-heading text-xs uppercase tracking-widest font-bold">Valores Corporativos</span>
      </div>
      <h2 class="font-heading font-black text-3xl sm:text-4xl text-white mb-4">
        NUESTRO COMPROMISO
      </h2>
      <p class="font-heading font-bold text-sm sm:text-base text-fb-goldGlow uppercase leading-snug mb-4">
        LA SEGURIDAD Y LA PUNTUALIDAD SON EL MOTOR QUE IMPULSA TODO LO QUE HACEMOS EN FUENTEALBA BASTIDA. "CUIDAR TU CARGA COMO SI FUERA NUESTRA" ES UN VALOR INNEGOCIABLE DE NUESTRO EQUIPO OPERATIVO.
      </p>
      <p class="text-slate-200 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
        Fuentealba Bastida SpA está comprometida a brindar un transporte terrestre transparente, seguro y de alta fidelidad. Operamos con una flota propia moderna, conductores profesionales certificados con control de fatiga y pólizas de seguro de carga integrales para proteger cada envío desde el origen hasta su destino final.
      </p>
      <a href="#cotizacion" class="px-6 py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider shadow transition-colors rounded-sm">
        LEER MÁS
      </a>
    </div>"""

new_compromiso = """  <section id="compromiso" class="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
    
    <!-- Columna Izquierda: Fondo Azul Marino Oscuro #071D3A con WebGL GlassFold en Fondo (z-0) -->
    <div class="lg:col-span-7 relative bg-fb-navy text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-center items-start border-r border-fb-gold/20 overflow-hidden">
      <!-- WebGL GlassFold Shader: Fondo Animado Estrictamente en Capa z-0 -->
      <canvas id="canvas-glass-compromiso" class="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-40" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></canvas>
      
      <!-- Contenedor Frontal en z-10: 100% Nítido y Legible -->
      <div class="relative z-10 w-full">
        <div class="inline-flex items-center gap-2 mb-2">
          <span class="w-8 h-1 bg-fb-gold"></span>
          <span class="text-fb-goldLight font-heading text-xs uppercase tracking-widest font-bold">Valores Corporativos</span>
        </div>
        <h2 class="font-heading font-black text-3xl sm:text-4xl text-white mb-4">
          NUESTRO COMPROMISO
        </h2>
        <p class="font-heading font-bold text-sm sm:text-base text-fb-goldGlow uppercase leading-snug mb-4">
          LA SEGURIDAD Y LA PUNTUALIDAD SON EL MOTOR QUE IMPULSA TODO LO QUE HACEMOS EN FUENTEALBA BASTIDA. "CUIDAR TU CARGA COMO SI FUERA NUESTRA" ES UN VALOR INNEGOCIABLE DE NUESTRO EQUIPO OPERATIVO.
        </p>
        <p class="text-slate-200 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
          Fuentealba Bastida SpA está comprometida a brindar un transporte terrestre transparente, seguro y de alta fidelidad. Operamos con una flota propia moderna, conductores profesionales certificados con control de fatiga y pólizas de seguro de carga integrales para proteger cada envío desde el origen hasta su destino final.
        </p>
        <a href="#cotizacion" class="px-6 py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider shadow transition-colors rounded-sm inline-block">
          LEER MÁS
        </a>
      </div>
    </div>"""

if old_compromiso in text:
    text = text.replace(old_compromiso, new_compromiso)
    print("Updated #compromiso with canvas-glass-compromiso at z-0 and text at z-10")
else:
    print("WARNING: old_compromiso not matched")

# 2. Update #claves: add canvas-glass-claves at z-0, keep text strictly at relative z-10
old_claves = """  <section id="claves" class="relative w-full bg-fb-charcoal text-white py-14 lg:py-20 border-t border-b border-fb-gold/30 overflow-hidden">
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

new_claves = """  <section id="claves" class="relative w-full bg-fb-charcoal text-white py-14 lg:py-20 border-t border-b border-fb-gold/30 overflow-hidden">
    <!-- WebGL GlassFold Shader: Fondo Animado Estrictamente en Capa z-0 -->
    <canvas id="canvas-glass-claves" class="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-35" style="position: absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></canvas>
    
    <!-- Contenedor Frontal en z-10: 100% Nítido y Legible -->
    <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">"""

if old_claves in text:
    text = text.replace(old_claves, new_claves)
    print("Updated #claves with canvas-glass-claves at z-0 and text at z-10")
else:
    print("WARNING: old_claves not matched")

# 3. Update JavaScript initialization to initialize all 4 sections
old_js = """      // Inicialización WebGL GlassFold EXCLUSIVAMENTE en el fondo de las secciones de color blanco
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

new_js = """      // Inicialización WebGL GlassFold como fondo en las secciones solicitadas (estrictamente en capa z-0 detrás de los textos)
      document.addEventListener('DOMContentLoaded', () => {
        // 1. Apartado: Nuestro Compromiso (Azul marino con reflejos oro)
        initGlassFoldCanvas('canvas-glass-compromiso', {
          color1: '#0E284D', // Azul marino medio
          color2: '#071D3A', // Azul marino corporativo
          color3: '#C5A059', // Reflejos dorados en los pliegues
          speed: 0.22,
          scale: 1.2,
          noise: 0.04
        });

        // 2. Apartado: Claves de Nuestro Éxito & Servicios Integrales (Carbón con aristas oro)
        initGlassFoldCanvas('canvas-glass-claves', {
          color1: '#122542', // Azul marino carbón
          color2: '#1F2937', // Fondo carbón oficial
          color3: '#C5A059', // Aristas doradas luminosas
          speed: 0.20,
          scale: 1.2,
          noise: 0.04
        });

        // 3. Apartado Blanco: Sección de Servicios (Quiénes Somos / Por Qué Elegirnos / Qué Hacemos)
        initGlassFoldCanvas('canvas-glass-servicios', {
          color1: '#071D3A', // Azul marino corporativo
          color2: '#0E284D', // Azul marino intermedio
          color3: '#C5A059', // Reflejos dorados en las aristas de cristal
          speed: 0.20,
          scale: 1.1,
          noise: 0.04
        });

        // 4. Apartado Blanco: Sección de Cotización Rápida B2B
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
    print("Updated JS initialization: initialized 4 canvases")
else:
    print("WARNING: old_js not matched")

# Restore line endings
final_html = text.replace('\n', '\r\n') if crlf else text

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

shutil.copyfile(file_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
