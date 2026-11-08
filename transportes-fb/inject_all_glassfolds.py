import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Update Section 4: CLAVES DEL ÉXITO & SERVICIOS INTEGRALES (#claves)
# Add relative and canvas
claves_old = '<section id="claves" class="w-full bg-fb-charcoal text-white py-12 lg:py-16 border-t border-b border-fb-gold/20">'
claves_new = '''<section id="claves" class="relative w-full bg-fb-charcoal text-white py-14 lg:py-20 border-t border-b border-fb-gold/30 overflow-hidden">
    <!-- WebGL GlassFold Shader Background: Opción 3 (Claves y Servicios) -->
    <canvas id="canvas-glass-claves" class="absolute inset-0 w-full h-full pointer-events-none opacity-60 z-0"></canvas>
    <div class="absolute inset-0 bg-gradient-to-r from-fb-charcoalDark/85 via-fb-charcoalDark/50 to-fb-charcoalDark/85 pointer-events-none z-0"></div>'''

html = html.replace(claves_old, claves_new)
# Ensure content in #claves is z-10 relative
html = html.replace('<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">', '<div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">', 1)

# 2. Update Section 9: COTIZACIÓN RÁPIDA (#cotizacion)
# Add relative and canvas
cotizacion_old = '<section id="cotizacion" class="w-full bg-fb-smoke py-14 lg:py-20 border-t border-slate-200">'
cotizacion_new = '''<section id="cotizacion" class="relative w-full bg-[#071324] py-16 lg:py-24 border-t border-fb-gold/30 overflow-hidden">
    <!-- WebGL GlassFold Shader Background: Opción 2 (Fondo Cotización B2B) -->
    <canvas id="canvas-glass-cotizacion" class="absolute inset-0 w-full h-full pointer-events-none opacity-70 z-0"></canvas>
    <div class="absolute inset-0 bg-gradient-to-b from-[#071D3A]/60 via-transparent to-[#071D3A]/80 pointer-events-none z-0"></div>'''

html = html.replace(cotizacion_old, cotizacion_new)
# Change text color of title in cotizacion for contrast over dark WebGL
html = html.replace('<h2 class="font-heading font-black text-3xl sm:text-4xl text-fb-navy tracking-tight mt-1">', '<h2 class="font-heading font-black text-3xl sm:text-4xl text-white tracking-tight mt-1">')
html = html.replace('<p class="text-slate-600 text-xs sm:text-sm mt-2">', '<p class="text-slate-300 text-xs sm:text-sm mt-2">')

# 3. Update Tracking Box (#tracking-box) - Opción 1
tracking_old = '<div id="tracking-box" class="mt-8 bg-fb-navy text-white p-6 rounded shadow-lg border border-fb-gold/30 flex flex-col md:flex-row items-center justify-between gap-4">'
tracking_new = '''<div id="tracking-box" class="relative mt-8 bg-fb-navyDark text-white p-6 sm:p-8 rounded-lg shadow-2xl border-2 border-fb-gold/50 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
        <!-- WebGL GlassFold Shader Background: Opción 1 (Rastreo y Telemetría Satelital) -->
        <canvas id="canvas-glass-tracking" class="absolute inset-0 w-full h-full pointer-events-none opacity-85 z-0"></canvas>
        <div class="absolute inset-0 bg-gradient-to-r from-fb-navyDark/90 via-fb-navyDark/60 to-fb-navyDark/90 pointer-events-none z-0"></div>
        <div class="relative z-10 flex items-center gap-4">'''

html = html.replace(tracking_old, tracking_new)
# Close relative z-10 for the left part of tracking box and wrap right part
html = html.replace('<form onsubmit="event.preventDefault(); simulateTracking();" class="flex w-full md:w-auto gap-2">', '</div>\n        <div class="relative z-10 w-full md:w-auto">\n        <form onsubmit="event.preventDefault(); simulateTracking();" class="flex w-full md:w-auto gap-2">')
html = html.replace('</form>\n      </div>', '</form>\n        </div>\n      </div>')

# 4. Inject the GlassFold WebGL Shader Implementation in Vanilla JS
glassfold_script = """
  <!-- WebGL GlassFold Shader Engine (Three Colors, Zero Dependencies) -->
  <script>
    (function() {
      const VERTEX_SHADER = `
        attribute vec2 position;
        varying vec2 vUv;
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `;

      const FRAGMENT_SHADER = `
        precision highp float;
        uniform float u_time;
        uniform vec3 u_color1;
        uniform vec3 u_color2;
        uniform vec3 u_color3;
        uniform float u_scale;
        uniform float u_noise;
        uniform vec2 u_resolution;
        varying vec2 vUv;

        float grain(vec2 st) {
          return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
        }

        vec2 centered(vec2 uv) {
          vec2 p = uv - 0.5;
          p.x *= u_resolution.x / max(u_resolution.y, 1.0);
          return p;
        }

        mat2 rot(float a) {
          float s = sin(a);
          float c = cos(a);
          return mat2(c, -s, s, c);
        }

        vec3 shade(vec2 uv, float time) {
          vec2 q = rot(0.6) * centered(uv) * 2.0 * u_scale;
          float t = time * 0.6;
          float pixel = 2.0 * u_scale / max(u_resolution.y, 1.0);

          vec3 color = mix(u_color2, u_color2 * 0.45, clamp(length(centered(uv)) * 1.3, 0.0, 1.0));

          for (int i = 0; i < 6; i++) {
            float fi = float(i);
            float bend = mod(fi, 2.0) * 2.0 - 1.0;

            float crease = (fi - 2.5) * 0.4
                         + 0.26 * sin(q.x * (1.05 + 0.12 * fi) + fi * 1.9 + t * (0.25 + 0.05 * fi))
                         + 0.1 * bend * q.x * q.x;
            float s = q.y - crease;
            float pane = smoothstep(-pixel, pixel, s);
            float back = max(s, 0.0);

            float body = exp(-back * 1.7);
            float fresnel = exp(-back * 8.0);
            float rim = exp(-back * 80.0);
            float inner = exp(-pow((back - 0.045) / 0.014, 2.0));
            float bloom = exp(-abs(s) * 20.0);

            vec3 tint = mix(u_color1, u_color3, clamp(fresnel * 0.6 + 0.08 + 0.14 * sin(fi * 2.1 + q.x * 0.8 + t * 0.2), 0.0, 1.0));
            vec3 light = tint * pane * (body * 0.42 + fresnel * 0.4)
                       + u_color3 * (pane * (rim * 0.6 + inner * 0.12) + bloom * 0.1);

            color += light * (1.0 - color);
          }

          return clamp(color, 0.0, 1.0);
        }

        void main() {
          vec3 color = shade(vUv, u_time);
          if (u_noise > 0.001) {
            float g = grain(vUv * 200.0 + u_time * 0.1);
            color *= 1.0 - u_noise * 0.4 + u_noise * g * 0.4;
          }
          gl_FragColor = vec4(color, 1.0);
        }
      `;

      function hexToVec3(hex) {
        const h = hex.replace("#", "");
        const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
        const n = parseInt(full, 16);
        return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
      }

      function compileShader(gl, type, source) {
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        return s;
      }

      function initGlassFoldCanvas(canvasId, config) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
        if (!gl) return;

        const program = gl.createProgram();
        gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
        gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
        gl.linkProgram(program);
        gl.useProgram(program);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
          gl.STATIC_DRAW
        );
        const position = gl.getAttribLocation(program, "position");
        gl.enableVertexAttribArray(position);
        gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

        const u = {
          time: gl.getUniformLocation(program, "u_time"),
          color1: gl.getUniformLocation(program, "u_color1"),
          color2: gl.getUniformLocation(program, "u_color2"),
          color3: gl.getUniformLocation(program, "u_color3"),
          scale: gl.getUniformLocation(program, "u_scale"),
          noise: gl.getUniformLocation(program, "u_noise"),
          resolution: gl.getUniformLocation(program, "u_resolution"),
        };

        const resize = () => {
          const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
          const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
          const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
          if (canvas.width !== width || canvas.height !== height) {
            canvas.width = width;
            canvas.height = height;
          }
          gl.viewport(0, 0, width, height);
        };

        let elapsed = 0;
        let last = null;
        let isVisible = false;

        const draw = (now) => {
          if (!isVisible) return;
          if (last !== null) elapsed += Math.min((now - last) / 1000, 0.1) * config.speed;
          last = now;

          resize();
          gl.uniform1f(u.time, elapsed);
          gl.uniform3fv(u.color1, hexToVec3(config.color1));
          gl.uniform3fv(u.color2, hexToVec3(config.color2));
          gl.uniform3fv(u.color3, hexToVec3(config.color3));
          gl.uniform1f(u.scale, config.scale);
          gl.uniform1f(u.noise, config.noise);
          gl.uniform2f(u.resolution, canvas.width, canvas.height);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          requestAnimationFrame(draw);
        };

        // Pause animation when not in viewport to save 100% GPU / battery
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              if (!isVisible) {
                isVisible = true;
                last = performance.now();
                requestAnimationFrame(draw);
              }
            } else {
              isVisible = false;
            }
          });
        }, { threshold: 0.1 });

        observer.observe(canvas);
      }

      // Initialize all 3 implementations with official brand palette
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
      });
    })();
  </script>
</body>
"""

html = html.replace('</body>', glassfold_script)

with open('transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

with open('public/transportes-fb/index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("GlassFold WebGL Shader successfully implemented across all 3 options!")
