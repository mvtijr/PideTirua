import os

files_to_fix = [
    'transportes-fb/index.html',
    'transportes-fb/stitch.html',
    'public/transportes-fb/index.html',
    'public/transportes-fb/stitch.html',
    'transportes-fb/stitch-local.html'
]

scrollbar_css = """
/* Barra de desplazamiento visible y moderna para mouse */
html {
  scrollbar-width: thin;
  scrollbar-color: #f7bd43 #0d141e;
}
::-webkit-scrollbar {
  width: 12px;
  height: 12px;
  display: block !important;
}
::-webkit-scrollbar-track {
  background: #0d141e;
}
::-webkit-scrollbar-thumb {
  background: #334766;
  border-radius: 6px;
  border: 2px solid #0d141e;
}
::-webkit-scrollbar-thumb:hover {
  background: #f7bd43;
}
"""

for file_path in files_to_fix:
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Replace hidden scrollbar
        content = content.replace('::-webkit-scrollbar{display:none;}', scrollbar_css)
        content = content.replace('body{overscroll-behavior:none;}', 'body{overscroll-behavior:auto;}')
        
        # Ensure html and body don't have overflow-hidden
        content = content.replace('overflow-hidden', 'overflow-x-hidden') # only if on body/html

        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed scrollbar in {file_path}")

print("All files updated successfully!")
