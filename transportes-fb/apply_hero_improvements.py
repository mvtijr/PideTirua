import shutil

file_path = 'transportes-fb/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# 1. Update scrim for maximum daylight and contrast
old_scrim = '<div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/85 via-[#071D3A]/45 to-transparent sm:via-[#071D3A]/25 sm:to-transparent"></div>'
new_scrim = '<div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/70 via-[#071D3A]/30 to-transparent sm:via-[#071D3A]/15 sm:to-transparent"></div>'

if old_scrim in text:
    text = text.replace(old_scrim, new_scrim)
    print("Updated hero scrim for optimal contrast and sunrise clarity")
else:
    print("WARNING: old_scrim not matched")

# 2. Add subtle dawn backlight behind 3D logo
old_logo_markup = """      <!-- Logotipo Oficial 3D Mimetizado en Alta Definición (Reemplazo del Título) -->
      <div class="mb-4">
        <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>
        <img src="assets/logo-fb-3d.png" alt="Fuentealba Bastida - Transportes y Logística SpA (Logo 3D Oficial)" class="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 w-auto max-w-full object-contain filter drop-shadow-[0_15px_30px_rgba(0,0,0,0.75)] select-none transition-transform duration-500 hover:scale-[1.02]">
      </div>"""

new_logo_markup = """      <!-- Logotipo Oficial 3D Mimetizado en Alta Definición con Halo de Luz del Amanecer -->
      <div class="mb-4 relative group">
        <!-- Luz del Amanecer Difusa (Backlight que da contraste 100% nítido a las letras azul marino 3D) -->
        <div class="absolute -inset-4 sm:-inset-6 bg-gradient-to-r from-white/35 via-amber-100/25 to-transparent rounded-2xl blur-xl pointer-events-none -z-10"></div>
        
        <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>
        <img src="assets/logo-fb-3d.png" alt="Fuentealba Bastida - Transportes y Logística SpA (Logo 3D Oficial)" class="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 w-auto max-w-full object-contain filter drop-shadow-[0_12px_25px_rgba(0,0,0,0.65)] select-none transition-transform duration-500 group-hover:scale-[1.02]">
      </div>"""

if old_logo_markup in text:
    text = text.replace(old_logo_markup, new_logo_markup)
    print("Updated 3D logo container with dawn backlight")
else:
    print("WARNING: old_logo_markup not matched")

final_html = text.replace('\n', '\r\n') if crlf else text
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

shutil.copyfile(file_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
