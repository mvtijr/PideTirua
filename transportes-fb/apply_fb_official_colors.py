# Generator script for Fuentealba Bastida with official brand colors:
# Navy Blue: #071D3A (#0A1E3C)
# Gold / Bronze: #8E7037 (#94753B)
# White: #FFFFFF

html_content = """<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Fuentealba Bastida | Transportes y Logística SpA - Conectamos Destinos, Entregamos Confianza</title>
  <meta name="description" content="Empresa líder en transporte de carga por carretera y logística en Chile. Monitoreo satelital GPS 24/7, flota moderna FTL, LTL y refrigerada. Cotiza en menos de 2 horas.">
  
  <link rel="icon" type="image/jpeg" href="assets/logo-fb.jpg">

  <!-- Google Fonts: Oswald (Headings estilo Trucky) & Roboto (Body) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700;900&family=Montserrat:wght@700;800;900&display=swap" rel="stylesheet">
  
  <!-- Material Symbols & Icons -->
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            fb: {
              navy: '#071D3A',
              navyDark: '#041224',
              navyLight: '#0E284D',
              navyAlt: '#0A1E3C',
              gold: '#8E7037',
              goldText: '#94753B',
              goldLight: '#A88544',
              goldGlow: '#C5A059',
              goldDark: '#755A27',
              charcoal: '#151D28',
              charcoalDark: '#0C131D',
              smoke: '#F8FAFC',
              smokeAlt: '#F1F5F9',
              white: '#FFFFFF'
            }
          },
          fontFamily: {
            heading: ['Oswald', 'Montserrat', 'sans-serif'],
            body: ['Roboto', 'sans-serif']
          }
        }
      }
    }
  </script>

  <style>
    /* Estilos globales y scrollbar con la paleta oficial FB */
    body {
      font-family: 'Roboto', sans-serif;
      background-color: #FFFFFF;
      color: #071D3A;
      overflow-x: hidden;
    }
    h1, h2, h3, h4, h5, .font-heading {
      font-family: 'Oswald', sans-serif;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    html {
      scrollbar-width: thin;
      scrollbar-color: #8E7037 #071D3A;
    }
    ::-webkit-scrollbar {
      width: 12px;
      height: 12px;
      display: block !important;
    }
    ::-webkit-scrollbar-track {
      background: #071D3A;
    }
    ::-webkit-scrollbar-thumb {
      background: #8E7037;
      border-radius: 4px;
      border: 2px solid #071D3A;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: #A88544;
    }
    .hero-bg-trucky {
      background-image: url('assets/hero-full-scene.jpg');
      background-size: cover;
      background-position: center center;
    }
    .banner-fast-safe {
      background-image: url('assets/hero-truck.jpg');
      background-size: cover;
      background-position: center center;
    }
  </style>
</head>
<body class="antialiased selection:bg-fb-gold selection:text-white">

  <!-- ==========================================
       1. HEADER AZUL MARINO OSCURO (#071D3A)
       ========================================== -->
  <header class="w-full bg-fb-navy text-white sticky top-0 z-50 shadow-lg border-b border-fb-gold/40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-20">
        
        <!-- LOGO BRAND (Estilo Trucky con Colores FB) -->
        <a href="#inicio" class="flex items-center gap-3.5 group">
          <div class="w-12 h-12 rounded-full overflow-hidden bg-white p-0.5 shadow-md flex-shrink-0 border-2 border-fb-gold group-hover:scale-105 transition-transform">
            <img src="assets/logo-fb.jpg" alt="Logo Fuentealba Bastida" class="w-full h-full object-cover rounded-full">
          </div>
          <div class="flex flex-col">
            <span class="font-heading font-black text-2xl sm:text-3xl text-white tracking-wider leading-none">
              FUENTEALBA BASTIDA
            </span>
            <span class="text-[10px] tracking-[0.25em] text-fb-goldLight font-bold uppercase mt-1">
              TRANSPORTES Y LOGÍSTICA SpA
            </span>
            <span class="text-[9px] tracking-widest text-slate-300 uppercase hidden sm:block">
              CONECTAMOS DESTINOS, ENTREGAMOS CONFIANZA
            </span>
          </div>
        </a>

        <!-- NAVEGACIÓN DESKTOP -->
        <nav class="hidden lg:flex items-center gap-7 font-heading text-sm font-semibold tracking-wider text-white">
          <a href="#inicio" class="text-fb-goldLight hover:text-white transition-colors py-1">INICIO</a>
          <a href="#compromiso" class="hover:text-fb-goldLight transition-colors py-1">NOSOTROS</a>
          <a href="#servicios" class="hover:text-fb-goldLight transition-colors py-1">SERVICIOS</a>
          <a href="#claves" class="hover:text-fb-goldLight transition-colors py-1">CLAVES</a>
          <a href="#flota-destacada" class="hover:text-fb-goldLight transition-colors py-1">FLOTA</a>
          <a href="#cotizacion" class="hover:text-fb-goldLight transition-colors py-1">COTIZAR</a>
          <a href="#contacto" class="hover:text-fb-goldLight transition-colors py-1">CONTACTO</a>
        </nav>

        <!-- CTA O TELÉFONO RÁPIDO DERECHA -->
        <div class="hidden sm:flex items-center gap-3">
          <a href="tel:+56926108718" class="flex items-center gap-1.5 text-xs font-bold tracking-wider text-fb-goldLight hover:text-white uppercase bg-fb-navyDark px-3.5 py-2 rounded border border-fb-gold/30">
            <span class="material-symbols-outlined text-[16px] text-fb-goldLight">phone</span>
            <span>+569 2610 8718</span>
          </a>
          <a href="#cotizacion" class="px-4 py-2 bg-fb-gold hover:bg-fb-goldLight text-white font-heading text-xs font-bold tracking-wider rounded uppercase shadow-md transition-all">
            COTIZAR
          </a>
        </div>

        <!-- HAMBURGER MÓVIL -->
        <div class="flex items-center gap-2 lg:hidden">
          <button onclick="toggleMobileMenu()" class="p-2 text-white hover:bg-fb-navyLight rounded focus:outline-none" aria-label="Abrir Menú">
            <span class="material-symbols-outlined text-[28px]">menu</span>
          </button>
        </div>

      </div>
    </div>

    <!-- MENÚ MÓVIL DESPLEGABLE -->
    <div id="mobile-menu" class="hidden lg:hidden bg-fb-navyDark border-t border-fb-gold/30 px-6 py-4 space-y-3 font-heading text-sm tracking-wider text-white">
      <a href="#inicio" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">INICIO</a>
      <a href="#compromiso" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">NOSOTROS</a>
      <a href="#servicios" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">SERVICIOS</a>
      <a href="#claves" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">CLAVES</a>
      <a href="#flota-destacada" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">FLOTA</a>
      <a href="#cotizacion" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">COTIZAR ENVÍO</a>
      <a href="#contacto" onclick="toggleMobileMenu()" class="block hover:text-fb-goldLight">CONTACTO</a>
    </div>
  </header>

  <!-- ==========================================
       2. HERO SLIDER SECTION (ESTILO TRUCKY CON PALETA FB)
       ========================================== -->
  <section id="inicio" class="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] hero-bg-trucky flex items-center justify-between px-4 sm:px-8 lg:px-16 overflow-hidden">
    
    <!-- Scrim azul marino oscuro en degradado para máxima legibilidad -->
    <div class="absolute inset-0 bg-gradient-to-r from-transparent via-[#071D3A]/50 to-[#071D3A]/90"></div>

    <!-- Botón Flecha Izquierda Slider (<) en Dorado/Bronce -->
    <button onclick="prevSlide()" class="relative z-20 w-11 h-11 bg-fb-gold hover:bg-fb-goldLight text-white flex items-center justify-center font-bold text-lg shadow-xl transition-colors cursor-pointer rounded-sm" aria-label="Anterior">
      <span class="material-symbols-outlined text-[24px]">chevron_left</span>
    </button>

    <!-- Contenido Hero alineado a la Derecha -->
    <div class="relative z-10 max-w-xl ml-auto text-left py-8 pr-2 sm:pr-8">
      
      <!-- Gran Título Blanco Mayúsculas -->
      <h1 class="font-heading font-black text-4xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.05] mb-4 drop-shadow">
        LA EMPRESA EN QUE PUEDES CONFIAR
      </h1>

      <!-- Párrafo en Tono Dorado Suave (#C5A059) -->
      <p class="text-fb-goldGlow text-xs sm:text-sm lg:text-base leading-relaxed mb-6 font-normal">
        Fuentealba Bastida Transportes y Logística SpA entrega soluciones integrales de carga pesada y distribución terrestre en todo Chile. Conectamos destinos con monitoreo satelital GPS 24/7 y la máxima puntualidad operativa.
      </p>

      <!-- Indicador de Puntos Slider (Punto activo Dorado, blancos inactivos) -->
      <div class="flex items-center gap-2 mb-6">
        <span class="w-3.5 h-3.5 rounded-full bg-fb-gold border-2 border-white"></span>
        <span class="w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-white cursor-pointer"></span>
        <span class="w-3.5 h-3.5 rounded-full bg-white/70 hover:bg-white cursor-pointer"></span>
      </div>

      <!-- Botón de Acción Principal Dorado & Secundario -->
      <div class="flex items-center gap-3">
        <a href="#cotizacion" class="px-7 py-3 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg transition-all rounded-sm">
          SOLICITAR COTIZACIÓN
        </a>
        <a href="#tracking-box" class="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border border-white/40 backdrop-blur-sm transition-all rounded-sm">
          RASTREAR GUÍA
        </a>
      </div>

    </div>

    <!-- Botón Flecha Derecha Slider (>) en Dorado/Bronce -->
    <button onclick="nextSlide()" class="relative z-20 w-11 h-11 bg-fb-gold hover:bg-fb-goldLight text-white flex items-center justify-center font-bold text-lg shadow-xl transition-colors cursor-pointer rounded-sm" aria-label="Siguiente">
      <span class="material-symbols-outlined text-[24px]">chevron_right</span>
    </button>

  </section>

  <!-- ==========================================
       3. BLOQUE DIVIDIDO: NUESTRO COMPROMISO (AZUL MARINO OSCURO #071D3A / CARBÓN)
       ========================================== -->
  <section id="compromiso" class="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
    
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
    </div>

    <!-- Columna Derecha: Fondo Carbón Oscuro con Imagen de Flota (40% ancho) -->
    <div class="lg:col-span-5 bg-fb-charcoalDark p-6 sm:p-10 flex items-center justify-center relative min-h-[300px]">
      <div class="w-full h-full flex items-center justify-center relative group">
        <img src="assets/team-brochure.jpg" alt="Flota y Operaciones Fuentealba Bastida" class="max-h-[320px] w-auto object-cover rounded shadow-2xl group-hover:scale-105 transition-transform duration-500 border border-fb-gold/30">
        <div class="absolute bottom-4 right-4 bg-fb-gold text-white text-[10px] font-heading font-bold uppercase px-3 py-1 shadow">
          FLOTA HOMOLOGADA
        </div>
      </div>
    </div>

  </section>

  <!-- ==========================================
       4. BLOQUE OSCURO: CLAVES DEL ÉXITO & SERVICIOS INTEGRALES
       ========================================== -->
  <section id="claves" class="w-full bg-fb-charcoal text-white py-12 lg:py-16 border-t border-b border-fb-gold/20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
        
        <!-- Columna Izquierda: Claves del Éxito -->
        <div class="lg:col-span-6 flex flex-col items-start justify-between">
          <div>
            <h3 class="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
              CLAVES DE NUESTRO ÉXITO
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldGlow uppercase leading-relaxed mb-4">
              MIENTRAS LA MAYORÍA DE LAS EMPRESAS DE LOGÍSTICA SE ENFOCAN EN UN SOLO SERVICIO, EN FUENTEALBA BASTIDA CUBRIMOS TODAS LAS MODALIDADES DE TU CADENA DE SUMINISTRO.
            </p>
            <p class="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Entendemos que cada industria posee requerimientos únicos. Gestionamos desde traslados de cargas masivas punto a punto hasta fletes de alta precisión con temperatura controlada, respaldados por telemetría GPS continua y reportes de recepción en tiempo real.
            </p>
          </div>
          <a href="#cotizacion" class="px-6 py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow rounded-sm">
            LEER MÁS
          </a>
        </div>

        <!-- Columna Derecha: Servicios Integrales (Lista Estilo Trucky) -->
        <div class="lg:col-span-6 flex flex-col justify-start">
          <h3 class="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
            SERVICIOS INTEGRALES
          </h3>
          <ul class="divide-y divide-white/10 font-heading text-xs sm:text-sm tracking-wider text-white">
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>CARGA COMPLETA (FTL - EXCLUSIVO)</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>CARGA CONSOLIDADA (LTL - POR PALLET)</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>TRANSPORTE REFRIGERADO & CLIMATIZADO (-25°C A +15°C)</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>CARGA SOBREDIMENSIONADA Y MAQUINARIA PESADA</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>ALMACENAJE, CROSS-DOCKING Y ÚLTIMA MILLA</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
            <li class="py-3 flex items-center justify-between hover:text-fb-goldLight transition-colors cursor-pointer">
              <span>FLOTAS DEDICADAS B2B Y ENLACES PORTUARIOS</span>
              <span class="material-symbols-outlined text-[16px] text-fb-gold">chevron_right</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </section>

  <!-- ==========================================
       5. BANNER HORIZONTAL WIDE: MAKING TRANSPORTATION FAST AND SAFE
       ========================================== -->
  <section class="relative w-full h-[380px] sm:h-[440px] banner-fast-safe flex items-center px-4 sm:px-8 lg:px-16 overflow-hidden">
    <!-- Scrim azul marino oscuro a la derecha -->
    <div class="absolute inset-0 bg-gradient-to-r from-black/20 via-[#071D3A]/60 to-[#071D3A]/95"></div>

    <div class="relative z-10 max-w-lg ml-auto text-left py-6 pr-2 sm:pr-6">
      <h2 class="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-tight mb-4">
        HACIENDO EL TRANSPORTE RÁPIDO Y SEGURO
      </h2>
      <p class="text-slate-200 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
        Desde el primer día, operamos bajo principios innegociables de seguridad vial, cumplimiento estricto de ventanas horarias y atención personalizada de personas a personas. Nuestra flota moderna en carretera garantiza que tus compromisos comerciales se cumplan sin contratiempos.
      </p>
      <a href="#cotizacion" class="px-6 py-2.5 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider shadow transition-colors inline-block rounded-sm">
        COTIZAR EN LÍNEA
      </a>
    </div>
  </section>

  <!-- ==========================================
       6. SECCIÓN TRES TARJETAS: QUIÉNES SOMOS, ¿POR QUÉ ELEGIRNOS?, ¿QUÉ HACEMOS?
       ========================================== -->
  <section id="servicios" class="w-full bg-fb-smoke py-14 lg:py-20 text-[#071D3A]">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        
        <!-- Columna 1: QUIÉNES SOMOS -->
        <div class="bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between items-start border-t-4 border-fb-gold rounded-sm">
          <div>
            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              QUIÉNES SOMOS
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">
              CON UNA FLOTA MODERNA QUE VA DESDE CAMIONES 3/4 URBANOS HASTA TRACTOCAMIONES DE ALTO TONELAJE, CUBRIMOS CUALQUIER REQUERIMIENTO DE CARGA.
            </p>
            <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Fuentealba Bastida es un operador logístico chileno con base en la Región Metropolitana y Biobío, enfocado en optimizar los tiempos de flete y resguardar la mercadería de nuestros clientes corporativos en todo el territorio nacional.
            </p>
          </div>
          <a href="#cotizacion" class="px-5 py-2 bg-fb-navy hover:bg-fb-gold text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow rounded-sm">
            LEER MÁS
          </a>
        </div>

        <!-- Columna 2: ¿POR QUÉ ELEGIRNOS? -->
        <div class="bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between items-start border-t-4 border-fb-gold rounded-sm">
          <div>
            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿POR QUÉ ELEGIRNOS?
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">
              CADA CONDUCTOR DE NUESTRO EQUIPO CUENTA CON AÑOS DE EXPERIENCIA EN RUTA, MILES DE KILÓMETROS RECORRIDOS Y CAPACITACIÓN VIAL RIGUROSA.
            </p>
            <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Equipamos nuestras unidades con telemetría satelital en tiempo real, alarmas de apertura y corte de combustible remoto. Además, brindamos contacto directo permanente con el Jefe de Operaciones sin contestadores automáticos.
            </p>
          </div>
          <a href="#cotizacion" class="px-5 py-2 bg-fb-navy hover:bg-fb-gold text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow rounded-sm">
            LEER MÁS
          </a>
        </div>

        <!-- Columna 3: ¿QUÉ HACEMOS? -->
        <div class="bg-white p-6 sm:p-8 shadow-md flex flex-col justify-between items-start border-t-4 border-fb-gold rounded-sm">
          <div>
            <h3 class="font-heading font-black text-2xl text-fb-navy mb-3">
              ¿QUÉ HACEMOS?
            </h3>
            <p class="font-heading font-bold text-xs sm:text-sm text-fb-goldText uppercase leading-snug mb-3">
              ENTENDEMOS EL VALOR CRÍTICO DE CADA DESPACHO: REGISTRAMOS UN 99.4% DE PUNTUALIDAD ON-TIME EN TODAS NUESTRAS RUTAS TRONCALES.
            </p>
            <p class="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
              Conectamos las faenas mineras y puertos del Norte Grande, el eje logístico central de Santiago, Valparaíso y San Antonio, y la macrozona Sur de Biobío, Araucanía y Los Lagos con frecuencias programadas y salidas continuas.
            </p>
          </div>
          <a href="#cotizacion" class="px-5 py-2 bg-fb-navy hover:bg-fb-gold text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors shadow rounded-sm">
            LEER MÁS
          </a>
        </div>

      </div>
    </div>
  </section>

  <!-- ==========================================
       7. SECCIÓN DIVIDIDA: 3 CAJAS CON ÍCONOS DORADOS + FOTO DEL CAMIÓN
       ========================================== -->
  <section id="flota-destacada" class="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
    
    <!-- Columna Izquierda: 3 Items con Iconos en Azul Marino & Dorado (45% ancho) -->
    <div class="lg:col-span-5 bg-fb-navy text-white p-8 sm:p-12 lg:p-14 flex flex-col justify-center gap-6 border-r border-fb-gold/20">
      
      <!-- Item 1: Paquete / Caja -->
      <div class="flex items-center gap-5 group">
        <div class="w-14 h-14 bg-fb-gold flex items-center justify-center text-white shrink-0 shadow rounded-sm">
          <span class="material-symbols-outlined text-[30px]">inventory_2</span>
        </div>
        <div>
          <h4 class="font-heading font-bold text-base sm:text-lg text-white uppercase group-hover:text-fb-goldLight transition-colors">
            SERVICIOS DE CARGA POR CARRETERA
          </h4>
          <p class="text-slate-300 text-xs leading-normal">
            Flota de furgones cerrados, ramplas planas y sider para carga general y pallets.
          </p>
        </div>
      </div>

      <!-- Item 2: Camión -->
      <div class="flex items-center gap-5 group">
        <div class="w-14 h-14 bg-fb-gold flex items-center justify-center text-white shrink-0 shadow rounded-sm">
          <span class="material-symbols-outlined text-[30px]">local_shipping</span>
        </div>
        <div>
          <h4 class="font-heading font-bold text-base sm:text-lg text-white uppercase group-hover:text-fb-goldLight transition-colors">
            TRANSPORTE ESPECIAL Y REFRIGERADO
          </h4>
          <p class="text-slate-300 text-xs leading-normal">
            Control estricto de temperatura Thermo King y camas bajas para maquinaria pesada.
          </p>
        </div>
      </div>

      <!-- Item 3: Chat / Soporte -->
      <div class="flex items-center gap-5 group">
        <div class="w-14 h-14 bg-fb-gold flex items-center justify-center text-white shrink-0 shadow rounded-sm">
          <span class="material-symbols-outlined text-[30px]">chat</span>
        </div>
        <div>
          <h4 class="font-heading font-bold text-base sm:text-lg text-white uppercase group-hover:text-fb-goldLight transition-colors">
            GESTIÓN LOGÍSTICA Y MONITOREO 24/7
          </h4>
          <p class="text-slate-300 text-xs leading-normal">
            Telemetría satelital activa y ejecutivos asignados para asistencia ininterrumpida.
          </p>
        </div>
      </div>

    </div>

    <!-- Columna Derecha: Foto del Camión Real en Faena (55% ancho) -->
    <div class="lg:col-span-7 bg-fb-charcoalDark relative min-h-[320px] overflow-hidden">
      <img src="assets/hero-truck.jpg" alt="Camión Fuentealba Bastida en Ruta" class="w-full h-full object-cover object-center">
      <div class="absolute inset-0 bg-gradient-to-r from-fb-navy/80 via-transparent to-transparent"></div>
    </div>

  </section>

  <!-- ==========================================
       8. SECCIÓN MAPA + BLOQUE AZUL MARINO OSCURO DE CONTACTO
       ========================================== -->
  <section id="contacto" class="w-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden border-t border-fb-gold/30">
    
    <!-- Columna Izquierda: Mapa de Operaciones y Cobertura (65% ancho) -->
    <div class="lg:col-span-8 bg-[#E2E8F0] relative min-h-[360px] flex flex-col justify-between p-6 sm:p-8">
      
      <!-- Simulación de Mapa Gráfico con Pin y Rutas -->
      <div class="w-full h-full rounded bg-slate-200 border border-slate-300 relative overflow-hidden flex flex-col justify-between p-6">
        
        <!-- Fondo de Mapa Ilustrado con Cuadrícula -->
        <div class="absolute inset-0 opacity-20 bg-[radial-gradient(#071D3A_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <!-- Header del Mapa -->
        <div class="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-white/95 backdrop-blur-sm p-3 rounded shadow-sm border border-slate-300">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-fb-navy text-[24px]">location_on</span>
            <span class="font-heading font-bold text-sm text-fb-navy">BASES OPERATIVAS: SANTIAGO & REGIÓN DEL BIOBÍO</span>
          </div>
          <span class="text-xs font-heading font-bold text-fb-gold bg-amber-50 px-2 py-0.5 rounded border border-fb-gold/30 uppercase">
            COBERTURA NACIONAL
          </span>
        </div>

        <!-- Pin Central de Santiago con Colores FB -->
        <div class="relative z-10 my-auto text-center py-6">
          <div class="inline-flex flex-col items-center">
            <div class="w-11 h-11 bg-fb-navy border-2 border-fb-gold rounded-full flex items-center justify-center text-fb-goldLight shadow-xl animate-bounce">
              <span class="material-symbols-outlined text-[24px]">local_shipping</span>
            </div>
            <div class="bg-fb-navy text-white px-3 py-1 rounded text-xs font-heading font-bold mt-1 shadow border border-fb-gold/30">
              HUB CENTRAL SANTIAGO - CHILE
            </div>
          </div>
        </div>

        <!-- Resumen de Rutas Troncales -->
        <div class="relative z-10 grid grid-cols-3 gap-2 bg-white/95 backdrop-blur-sm p-3 rounded shadow-sm text-[11px] font-heading font-semibold text-slate-800 border border-slate-300">
          <div><strong class="text-fb-goldText">NORTE:</strong> Antofagasta, Calama, Copiapó</div>
          <div><strong class="text-fb-goldText">CENTRO:</strong> Valparaíso, San Antonio, Rancagua</div>
          <div><strong class="text-fb-goldText">SUR:</strong> Concepción, Temuco, Puerto Montt</div>
        </div>

      </div>

    </div>

    <!-- Columna Derecha: Tarjeta Azul Marino CONTACTS (35% ancho - Paleta Oficial) -->
    <div class="lg:col-span-4 bg-fb-navy text-white p-8 sm:p-10 flex flex-col justify-between border-l border-fb-gold/30">
      <div>
        <div class="inline-flex items-center gap-2 mb-2">
          <span class="w-6 h-1 bg-fb-gold"></span>
          <span class="text-fb-goldLight font-heading text-xs uppercase tracking-widest font-bold">Canales Oficiales</span>
        </div>
        <h3 class="font-heading font-black text-2xl sm:text-3xl text-white mb-4">
          CONTACTO
        </h3>
        
        <div class="space-y-3 text-xs sm:text-sm font-normal mb-6">
          <p class="font-heading font-bold text-fb-goldLight tracking-wider">
            BASE CENTRAL: SANTIAGO & BIOBÍO, CHILE
          </p>
          <p class="text-slate-200">
            Atención comercial de Lunes a Sábado de 08:00 a 20:00 hrs. Central de emergencias en carretera disponible las 24 horas del día.
          </p>
          <div class="pt-2 flex items-center gap-2 font-bold text-white">
            <span class="material-symbols-outlined text-[18px] text-fb-gold">phone</span>
            <a href="tel:+56926108718" class="hover:text-fb-goldLight transition-colors">+569 2610 8718</a>
          </div>
          <div class="flex items-center gap-2 text-slate-200">
            <span class="material-symbols-outlined text-[18px] text-fb-gold">mail</span>
            <a href="mailto:fbtransportespa@gmail.com" class="hover:text-fb-goldLight transition-colors">fbtransportespa@gmail.com</a>
          </div>
        </div>
      </div>

      <!-- Redes Sociales Cuadradas con Acento Dorado -->
      <div class="flex items-center gap-2 pt-4 border-t border-white/10">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-fb-navyDark hover:bg-fb-gold text-white flex items-center justify-center rounded shadow transition-colors border border-fb-gold/30" title="Instagram">
          <span class="material-symbols-outlined text-[20px]">photo_camera</span>
        </a>
        <a href="https://wa.me/56926108718" target="_blank" rel="noopener noreferrer" class="w-10 h-10 bg-fb-navyDark hover:bg-emerald-600 text-white flex items-center justify-center rounded shadow transition-colors border border-fb-gold/30" title="WhatsApp">
          <span class="material-symbols-outlined text-[20px]">chat</span>
        </a>
        <a href="mailto:fbtransportespa@gmail.com" class="w-10 h-10 bg-fb-navyDark hover:bg-fb-gold text-white flex items-center justify-center rounded shadow transition-colors border border-fb-gold/30" title="Correo">
          <span class="material-symbols-outlined text-[20px]">mail</span>
        </a>
      </div>

    </div>

  </section>

  <!-- ==========================================
       9. FORMULARIO DE COTIZACIÓN RÁPIDA (LEAD GEN B2B) & TRACKING
       ========================================== -->
  <section id="cotizacion" class="w-full bg-fb-smoke py-14 lg:py-20 border-t border-slate-200">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      
      <div class="text-center max-w-2xl mx-auto mb-10">
        <span class="font-heading font-bold text-xs uppercase tracking-widest text-fb-goldText">Cotización Inmediata B2B</span>
        <h2 class="font-heading font-black text-3xl sm:text-4xl text-fb-navy tracking-tight mt-1">
          SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
        </h2>
        <p class="text-slate-600 text-xs sm:text-sm mt-2">
          Completa los datos de tu carga y recibe una propuesta formal ajustada al cubicaje, ruta y requerimientos específicos de tu empresa.
        </p>
      </div>

      <div class="bg-white p-6 sm:p-10 shadow-lg border-t-4 border-fb-navy rounded-sm">
        <form id="quote-form" onsubmit="event.preventDefault(); submitQuote();" class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Nombre Completo / Razón Social *</label>
              <input type="text" id="contact-name" required placeholder="Ej: Distribuidora Central SpA" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">RUT Empresa (Opcional)</label>
              <input type="text" id="contact-rut" placeholder="Ej: 76.890.123-K" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Correo Electrónico Corporativo *</label>
              <input type="email" id="contact-email" required placeholder="contacto@empresa.cl" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Teléfono / WhatsApp *</label>
              <input type="tel" id="contact-phone" required placeholder="+56 9 2610 8718" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Ciudad / Comuna de Origen *</label>
              <input type="text" id="origin-city" required placeholder="Ej: Santiago (CD Pudahuel)" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Ciudad / Comuna de Destino *</label>
              <input type="text" id="destination-city" required placeholder="Ej: Concepción / Faena Minera" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Tipo de Servicio *</label>
              <select id="service-type" required class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
                <option value="FTL">Carga Completa (FTL - Camión Exclusivo)</option>
                <option value="LTL">Carga Consolidada (LTL - Por Pallet)</option>
                <option value="Refrigerada">Transporte Refrigerado / Cadena de Frío</option>
                <option value="Sobredimensionada">Carga Sobredimensionada y Maquinaria</option>
                <option value="Distribucion">Almacenaje y Distribución 3PL</option>
                <option value="Express">Servicio Dedicado Express</option>
              </select>
            </div>
            <div>
              <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Peso o Volumen Estimado *</label>
              <input type="text" id="cargo-specs" required placeholder="Ej: 8 Pallets / 5.000 kg / 25 m³" class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block font-heading font-bold text-xs uppercase text-fb-navy mb-1">Requerimientos Especiales (Ventana horaria, rampa, escolta)</label>
            <textarea id="special-requirements" rows="3" placeholder="Indica si requieres grúa horquilla, entrega con cita en retail o seguros ampliados..." class="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 text-sm focus:border-fb-gold focus:bg-white focus:outline-none"></textarea>
          </div>

          <button type="submit" class="w-full py-4 bg-fb-navy hover:bg-fb-gold text-white font-heading font-bold text-sm sm:text-base uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 rounded-sm">
            <span class="material-symbols-outlined text-[20px] text-fb-goldLight">send</span>
            <span>RECIBIR PRESUPUESTO EN MENOS DE 2 HORAS</span>
          </button>

          <!-- Banner de éxito dinámico -->
          <div id="quote-success" class="hidden p-4 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-bold text-sm">
          </div>
        </form>
      </div>

      <!-- WIDGET RASTREO SATELITAL RÁPIDO EN AZUL MARINO -->
      <div id="tracking-box" class="mt-8 bg-fb-navy text-white p-6 rounded shadow-lg border border-fb-gold/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-fb-gold text-[32px]">satellite_alt</span>
          <div>
            <h4 class="font-heading font-bold text-base uppercase text-white">RASTREAR ORDEN DE TRANSPORTE (OT)</h4>
            <p class="text-slate-300 text-xs">Monitoreo satelital GPS en tiempo real de tu carga en ruta</p>
          </div>
        </div>
        <form onsubmit="event.preventDefault(); simulateTracking();" class="flex w-full md:w-auto gap-2">
          <input type="text" id="tracking-code" value="FB-2025-9842" placeholder="Ej: FB-2025-9842" class="px-3 py-2 bg-fb-navyDark border border-fb-gold/40 text-white text-xs font-mono uppercase focus:outline-none focus:border-fb-gold">
          <button type="submit" class="px-5 py-2 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-bold text-xs uppercase tracking-wider transition-colors whitespace-nowrap rounded-sm">
            CONSULTAR
          </button>
        </form>
      </div>

      <div id="tracking-result" class="hidden mt-4 p-4 rounded bg-fb-navyDark text-white border border-fb-gold/30 text-xs">
      </div>

    </div>
  </section>

  <!-- ==========================================
       10. FOOTER BOTTOM BAR EN AZUL MARINO OSCURO (#041224)
       ========================================== -->
  <footer class="w-full bg-fb-navyDark text-slate-400 py-6 border-t border-fb-gold/20 font-heading text-xs tracking-wider">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
      <div>
        © 2026 FUENTEALBA BASTIDA TRANSPORTES Y LOGÍSTICA SpA. TODOS LOS DERECHOS RESERVADOS.
      </div>
      <div class="flex items-center gap-5 text-slate-300">
        <a href="#inicio" class="hover:text-fb-goldLight">INICIO</a>
        <a href="#servicios" class="hover:text-fb-goldLight">SERVICIOS</a>
        <a href="#contacto" class="hover:text-fb-goldLight">CONTACTO</a>
        <a href="#cotizacion" class="hover:text-fb-goldLight">COTIZAR</a>
      </div>
    </div>
  </footer>

  <!-- BOTÓN FLOTANTE WHATSAPP -->
  <a href="https://wa.me/56926108718?text=Hola%2C%20necesito%20cotizar%20un%20servicio%20de%20transporte%20de%20carga%20con%20Fuentealba%20Bastida" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-2xl transition-all duration-300 hover:scale-110" title="Contactar a Central WhatsApp">
    <span class="material-symbols-outlined text-[30px]">chat</span>
    <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fb-gold border-2 border-white flex items-center justify-center text-[9px] font-black text-white">1</span>
  </a>

  <!-- SCRIPTS Y LÓGICA DE INTERACCIÓN -->
  <script>
    function toggleMobileMenu() {
      const m = document.getElementById('mobile-menu');
      if (m) m.classList.toggle('hidden');
    }

    function prevSlide() {
      const hero = document.getElementById('inicio');
      hero.style.opacity = '0.85';
      setTimeout(() => { hero.style.opacity = '1'; }, 200);
    }

    function nextSlide() {
      prevSlide();
    }

    function simulateTracking() {
      const codeInput = document.getElementById('tracking-code');
      const code = (codeInput && codeInput.value.trim()) || 'FB-2025-9842';
      const resultBox = document.getElementById('tracking-result');
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="flex items-center justify-between border-b border-white/10 pb-2">
            <span class="font-heading text-sm text-fb-goldGlow font-bold uppercase flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[16px] animate-pulse">local_shipping</span> Guía ${code} • En Tránsito Seguro
            </span>
            <span class="text-slate-300 font-heading text-xs">ETA Estimado: Hoy 18:30 hrs</span>
          </div>
          <p class="font-bold text-white text-sm pt-2">Ruta 5 Sur - KM 240 (Región del Maule)</p>
          <div class="w-full bg-fb-navy h-2 rounded overflow-hidden mt-1.5 border border-fb-gold/20">
            <div class="bg-fb-gold h-full w-3/4 rounded transition-all duration-1000"></div>
          </div>
          <div class="flex justify-between text-slate-400 text-xs pt-1.5 font-heading">
            <span>Santiago CD (Salida 08:30)</span>
            <span>Concepción CD (Destino 18:30)</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-white/10 text-slate-300 text-xs">
            <span>Conductor Asignado: <strong class="text-white">M. Bastida (A5 Certificado)</strong></span>
            <span>Temp. Frío: <strong class="text-fb-goldLight">-18.2°C (Estable)</strong></span>
          </div>
        `;
        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function submitQuote() {
      const name = document.getElementById('contact-name').value;
      const rut = document.getElementById('contact-rut').value || 'No informado';
      const email = document.getElementById('contact-email').value;
      const phone = document.getElementById('contact-phone').value;
      const origin = document.getElementById('origin-city').value;
      const dest = document.getElementById('destination-city').value;
      const service = document.getElementById('service-type').value;
      const cargo = document.getElementById('cargo-specs').value;
      const reqs = document.getElementById('special-requirements').value || 'Sin notas';

      const waText = encodeURIComponent(
        `*SOLICITUD DE COTIZACIÓN - FUENTEALBA BASTIDA*\\n\\n` +
        `👤 *Contacto:* ${name}\\n` +
        `🏢 *RUT:* ${rut}\\n` +
        `📧 *Correo:* ${email}\\n` +
        `📞 *Teléfono:* ${phone}\\n` +
        `📍 *Ruta:* ${origin} ➔ ${dest}\\n` +
        `📦 *Servicio:* ${service}\\n` +
        `⚖️ *Carga:* ${cargo}\\n` +
        `📝 *Detalles:* ${reqs}`
      );

      const waLink = `https://wa.me/56926108718?text=${waText}`;

      const successBox = document.getElementById('quote-success');
      if (successBox) {
        successBox.innerHTML = `
          <div class="flex flex-col gap-2">
            <div class="text-emerald-700 font-heading font-bold text-base">
              ¡SOLICITUD RECIBIDA CON ÉXITO!
            </div>
            <p class="text-xs text-slate-600 font-normal">Un coordinador comercial te contactará en menos de 2 horas hábiles.</p>
            <div class="pt-2">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-heading font-bold text-xs uppercase tracking-wider rounded shadow transition-all">
                <span class="material-symbols-outlined text-[16px]">chat</span>
                <span>Acelerar Atención vía WhatsApp Directo</span>
              </a>
            </div>
          </div>
        `;
        successBox.classList.remove('hidden');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  </script>
</body>
</html>
"""

with open('transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

with open('public/transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html_content)

print("Updated transportes-fb/index.html and public/transportes-fb/index.html with official company colors!")
