def polish_subtitles(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    # 1. Cotización
    old_cot = """        <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#071D3A] tracking-wide mt-1">
          SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
        </h2>
        <p class="text-slate-600 text-xs sm:text-sm mt-2 font-normal">"""
    new_cot = """        <h2 class="font-heading font-black text-3xl sm:text-4xl text-[#071D3A] tracking-wide mt-1">
          SOLICITA TU PRESUPUESTO EN MENOS DE 2 HORAS
        </h2>
        <p class="font-armstrong text-slate-600 text-xs sm:text-sm mt-2 font-normal">"""
    if old_cot in html:
        html = html.replace(old_cot, new_cot)
        print(f"Polished cotización subtitle in {path}")

    # 2. Contacto Base Central
    old_con = """          <p class="font-heading font-bold text-fb-goldLight tracking-wider">
            BASE CENTRAL: SANTIAGO & BIOBÍO, CHILE
          </p>"""
    new_con = """          <p class="font-armstrong font-bold text-fb-goldLight tracking-wider">
            BASE CENTRAL: SANTIAGO & BIOBÍO, CHILE
          </p>"""
    if old_con in html:
        html = html.replace(old_con, new_con)
        print(f"Polished contacto base central in {path}")

    # 3. 3 feature cards under Quiénes somos
    cards = [
        ("SERVICIOS DE CARGA POR CARRETERA", "Flota de furgones cerrados, ramplas planas y sider para carga general y pallets."),
        ("TRANSPORTE ESPECIAL Y REFRIGERADO", "Control estricto de temperatura Thermo King y camas bajas para maquinaria pesada."),
        ("GESTIÓN LOGÍSTICA Y MONITOREO 24/7", "Telemetría satelital activa y ejecutivos asignados para asistencia ininterrumpida.")
    ]
    for title, desc in cards:
        old_card = f"""          <p class="text-slate-300 text-xs leading-normal">
            {desc}
          </p>"""
        new_card = f"""          <p class="font-armstrong text-slate-300 text-xs leading-normal">
            {desc}
          </p>"""
        if old_card in html:
            html = html.replace(old_card, new_card)
            print(f"Polished card '{title}' in {path}")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)

polish_subtitles('transportes-fb/index.html')
polish_subtitles('public/transportes-fb/index.html')
print("Completed polishing.")
