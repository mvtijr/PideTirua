def tweak_hero_mobile(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    old = 'class="relative w-full aspect-[16/9] min-h-[480px] sm:min-h-[560px] md:min-h-[640px] lg:min-h-[720px] max-h-[88vh] flex flex-col justify-between overflow-hidden bg-fb-navyDark group"'
    new = 'class="relative w-full aspect-[16/9] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] max-h-[88vh] flex flex-col justify-between overflow-hidden bg-fb-navyDark group"'
    html = html.replace(old, new)

    # In mobile top badge: hide on very small mobile if it crowds the sky
    old_top = '<div class="relative z-20 w-full px-4 sm:px-8 lg:px-12 pt-4 sm:pt-6 flex items-center justify-between">'
    new_top = '<div class="relative z-20 w-full px-3 sm:px-8 lg:px-12 pt-2 sm:pt-6 flex items-center justify-between">'
    html = html.replace(old_top, new_top)

    # In bottom bar: compact on mobile
    old_bot = '<div class="relative z-20 w-full px-4 sm:px-8 lg:px-12 pb-5 sm:pb-7 flex flex-wrap items-center justify-between gap-3">'
    new_bot = '<div class="relative z-20 w-full px-3 sm:px-8 lg:px-12 pb-2.5 sm:pb-7 flex flex-wrap items-center justify-between gap-2 sm:gap-3">'
    html = html.replace(old_bot, new_bot)

    # Buttons: compact text on mobile
    old_btn = 'class="px-5 sm:px-7 py-2.5 sm:py-3 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl transition-all rounded-sm border border-fb-goldLight/40 backdrop-blur-sm hover:scale-[1.02]"'
    new_btn = 'class="px-3.5 sm:px-7 py-1.5 sm:py-3 bg-fb-gold hover:bg-fb-goldLight text-white font-heading font-black text-[11px] sm:text-sm uppercase tracking-wider shadow-2xl transition-all rounded-sm border border-fb-goldLight/40 backdrop-blur-sm hover:scale-[1.02]"'
    html = html.replace(old_btn, new_btn)

    old_btn2 = 'class="px-5 sm:px-6 py-2.5 sm:py-3 bg-fb-navy/90 hover:bg-fb-navy text-white font-heading font-bold text-xs sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-md shadow-2xl transition-all rounded-sm hover:border-fb-goldLight"'
    new_btn2 = 'class="px-3.5 sm:px-6 py-1.5 sm:py-3 bg-fb-navy/90 hover:bg-fb-navy text-white font-heading font-bold text-[11px] sm:text-sm uppercase tracking-wider border border-fb-gold/50 backdrop-blur-md shadow-2xl transition-all rounded-sm hover:border-fb-goldLight"'
    html = html.replace(old_btn2, new_btn2)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Updated", path)

tweak_hero_mobile('transportes-fb/index.html')
tweak_hero_mobile('public/transportes-fb/index.html')
