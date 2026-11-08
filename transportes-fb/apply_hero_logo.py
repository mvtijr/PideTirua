import shutil

file_path = 'transportes-fb/index.html'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

crlf = '\r\n' in text
text = text.replace('\r\n', '\n')

old_hero_content = """      <!-- Gran Título Blanco Mayúsculas -->
      <h1 class="font-heading font-black text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-white tracking-tight leading-[1.05] mb-3 sm:mb-4 drop-shadow-md">
        LA EMPRESA EN QUE PUEDES CONFIAR
      </h1>"""

new_hero_content = """      <!-- Logotipo Oficial Mimetizado sin Fondo Blanco (Reemplazo del Título) -->
      <div class="mb-4">
        <h1 class="sr-only">Fuentealba Bastida - Transportes y Logística SpA | La Empresa en que Puedes Confiar</h1>
        <img src="assets/logo-fb-hero-white-gold.png" alt="Fuentealba Bastida - Transportes y Logística SpA" class="h-20 sm:h-24 md:h-28 lg:h-32 xl:h-36 w-auto max-w-full object-contain filter drop-shadow-[0_4px_20px_rgba(0,0,0,0.65)] select-none">
      </div>

      <!-- Slogan Corporativo Integrado -->
      <div class="inline-flex items-center gap-2 mb-3">
        <span class="w-6 h-0.5 bg-fb-gold inline-block"></span>
        <span class="font-heading font-extrabold text-xs sm:text-sm text-fb-goldLight uppercase tracking-wider drop-shadow">
          LA EMPRESA EN QUE PUEDES CONFIAR
        </span>
      </div>"""

if old_hero_content in text:
    text = text.replace(old_hero_content, new_hero_content)
    print("Successfully replaced Hero title with mimetized transparent logo!")
else:
    print("WARNING: old_hero_content not found")

# Restore line endings
final_html = text.replace('\n', '\r\n') if crlf else text

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(final_html)

shutil.copyfile(file_path, 'public/transportes-fb/index.html')
print("Successfully synced to public/transportes-fb/index.html")
