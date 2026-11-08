import shutil

file_path = 'transportes-fb/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

# 1. Update scrim for optimal 3D lighting
old_scrim = '<div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/95 via-[#071D3A]/60 to-transparent sm:via-[#071D3A]/40 sm:to-transparent"></div>'
new_scrim = '<div class="absolute inset-0 bg-gradient-to-r from-[#071D3A]/85 via-[#071D3A]/45 to-transparent sm:via-[#071D3A]/25 sm:to-transparent"></div>'

if old_scrim in text:
    text = text.replace(old_scrim, new_scrim)
    print("Updated hero scrim for optimal 3D logo illumination")
else:
    print("WARNING: old_scrim not matched")

# 2. Replace Hero logo with the new 3D logo
old_logo_markup = """      <!-- Logotipo Oficial Mimetizado sin Fondo Blanco (Reemplazo del Título) -->
      <div class="mb-4">
        <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>
        <img src="assets/logo-fb-hero-white-gold.png" alt="Fuentealba Bastida - Transportes y Logística SpA" class="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 w-auto max-w-full object-contain filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] select-none">
      </div>"""

new_logo_markup = """      <!-- Logotipo Oficial 3D Mimetizado en Alta Definición (Reemplazo del Título) -->
      <div class="mb-4">
        <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>
        <img src="assets/logo-fb-3d.png" alt="Fuentealba Bastida - Transportes y Logística SpA (Logo 3D Oficial)" class="h-24 sm:h-28 md:h-32 lg:h-36 xl:h-44 w-auto max-w-full object-contain filter drop-shadow-[0_10px_30px_rgba(0,0,0,0.7)] drop-shadow-[0_0_25px_rgba(255,255,255,0.25)] select-none transition-transform duration-500 hover:scale-[1.02]">
      </div>"""

if old_logo_markup in text:
    text = text.replace(old_logo_markup, new_logo_markup)
    print("Successfully replaced Hero logo with 3D Logo HD!")
else:
    print("WARNING: old_logo_markup not matched")

# Restore line endings
final_html = text.replace('\n', '\r\n') if crlf else text

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

shutil.copyfile(file_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
