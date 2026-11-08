import re

with open('transportes-fb/stitch.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add smooth scroll to html
html = html.replace('<html class="dark" lang="es">', '<html class="dark scroll-smooth" lang="es">')

# Add section IDs if missing
# 1. Hero
html = html.replace('<!-- 1. HERO SECTION (IMPACTO INICIAL B2B) -->\n<section class="relative', '<!-- 1. HERO SECTION (IMPACTO INICIAL B2B) -->\n<section id="inicio" class="relative')

# 2. Stats
html = html.replace('<!-- 2. BARRA DE ESTADÍSTICAS Y AUTORIDAD (MÉTRICAS CLAVE) -->\n<section class="w-full mb-space-xl">', '<!-- 2. BARRA DE ESTADÍSTICAS Y AUTORIDAD (MÉTRICAS CLAVE) -->\n<section id="estadisticas" class="w-full mb-space-xl">')

# 3. Servicios
html = html.replace('<!-- 3. SERVICIOS LOGÍSTICOS ESPECIALIZADOS -->\n<section class="w-full mb-space-xl', '<!-- 3. SERVICIOS LOGÍSTICOS ESPECIALIZADOS -->\n<section id="servicios" class="w-full mb-space-xl')

# 4. Flota
html = html.replace('<!-- 4. NUESTRA FLOTA Y PROTOCOLOS DE SEGURIDAD -->\n<section class="w-full mb-space-xl', '<!-- 4. NUESTRA FLOTA Y PROTOCOLOS DE SEGURIDAD -->\n<section id="flota-y-tecnologia" class="w-full mb-space-xl')

# 5. Cobertura
html = html.replace('<!-- 5. MAPA DE COBERTURA Y RUTAS ESTRATÉGICAS -->\n<section class="w-full mb-space-xl', '<!-- 5. MAPA DE COBERTURA Y RUTAS ESTRATÉGICAS -->\n<section id="cobertura" class="w-full mb-space-xl')

# Fix nav links hrefs
html = html.replace('data-path="inicio" href="#"', 'href="#inicio"')
html = html.replace('data-path="servicios" href="#"', 'href="#servicios"')
html = html.replace('data-path="flota-y-tecnologia" href="#"', 'href="#flota-y-tecnologia"')
html = html.replace('data-path="cobertura" href="#"', 'href="#cobertura"')
html = html.replace('data-path="cotizar" href="#"', 'href="#cotizacion"')
html = html.replace('data-path="portal-tracking" href="#"', 'href="#tracking-form"')

# Enhanced simulateTracking and submitQuote scripts
enhanced_script = """
    function simulateTracking() {
      const codeInput = document.getElementById('tracking-code');
      const code = (codeInput && codeInput.value.trim()) || 'FB-2025-9842';
      const resultBox = document.getElementById('tracking-result');
      if (resultBox) {
        resultBox.innerHTML = `
          <div class="flex items-center justify-between border-b border-surface-container-highest pb-2">
            <span class="font-label-sm text-label-sm text-primary font-bold uppercase flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] animate-pulse">local_shipping</span> Guía ${code} • En Tránsito Seguro
            </span>
            <span class="text-on-surface-variant font-label-sm text-label-sm font-semibold">ETA: Hoy 18:30 hrs</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface font-semibold pt-1">Ruta 5 Sur - KM 240 (Región del Maule)</p>
          <div class="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden mt-1">
            <div class="bg-primary h-full w-3/4 rounded-full transition-all duration-1000"></div>
          </div>
          <div class="flex justify-between font-label-sm text-label-sm text-tertiary pt-1">
            <span>Santiago CD (Salida 08:30)</span>
            <span>Concepción CD (Destino 18:30)</span>
          </div>
          <div class="flex items-center justify-between pt-2 border-t border-surface-container-highest/60 text-on-surface-variant text-[11px]">
            <span>Conductor: <strong class="text-on-surface">M. Bastida (A5)</strong></span>
            <span>Temp. Frío: <strong class="text-primary">-18.2°C (Estable)</strong></span>
          </div>
        `;
        resultBox.classList.remove('hidden');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    function submitQuote() {
      const name = document.getElementById('contact-name').value;
      const company = document.getElementById('company-name').value;
      const email = document.getElementById('contact-email').value;
      const phone = document.getElementById('contact-phone').value;
      const origin = document.getElementById('origin-city').value;
      const dest = document.getElementById('destination-city').value;
      const service = document.getElementById('service-type').value;
      const cargo = document.getElementById('cargo-specs').value;
      const reqs = document.getElementById('special-requirements').value || 'Sin notas adicionales';

      const waText = encodeURIComponent(
        `*SOLICITUD DE COTIZACIÓN - FUENTEALBA BASTIDA*\\n\\n` +
        `👤 *Contacto:* ${name}\\n` +
        `🏢 *Empresa:* ${company}\\n` +
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
          <div class="flex flex-col gap-2 p-2">
            <div class="flex items-center justify-center gap-1 text-primary font-bold text-sm">
              <span class="material-symbols-outlined text-[20px]">check_circle</span>
              <span>¡Solicitud recibida con éxito!</span>
            </div>
            <p class="text-on-surface text-xs">Un coordinador comercial te contactará en menos de 2 horas hábiles.</p>
            <div class="pt-2">
              <a href="${waLink}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs shadow-md transition-all">
                <span class="material-symbols-outlined text-[16px]">chat</span>
                <span>Acelerar atención vía WhatsApp Directo</span>
              </a>
            </div>
          </div>
        `;
        successBox.classList.remove('hidden');
        successBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
"""

html = re.sub(r'function simulateTracking\(\) \{[\s\S]*?function submitQuote\(\) \{[\s\S]*?\}[\s\S]*?\}', enhanced_script.strip(), html)

# Add floating WhatsApp button right before </body>
floating_wa = """
<!-- Floating WhatsApp Button -->
<a href="https://wa.me/56926108718?text=Hola%2C%20necesito%20cotizar%20un%20servicio%20de%20transporte%20de%20carga%20con%20Fuentealba%20Bastida" target="_blank" rel="noopener noreferrer" class="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_10px_25px_rgba(16,185,129,0.5)] transition-all duration-300 hover:scale-110" title="Contactar a Central WhatsApp">
  <span class="material-symbols-outlined text-[30px]">chat</span>
  <span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-surface flex items-center justify-center text-[9px] font-black text-on-primary">1</span>
</a>
</body>
"""

html = html.replace('</body>', floating_wa)

with open('transportes-fb/stitch.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/transportes-fb/stitch.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Enhanced transportes-fb/stitch.html saved successfully!")
