def fine_tune_hero(path):
    with open(path, 'r', encoding='utf-8') as f:
        html = f.read()

    old = 'max-w-[280px] sm:max-w-[380px] md:max-w-[460px] lg:max-w-[540px] xl:max-w-[580px]'
    new = 'max-w-[220px] xs:max-w-[260px] sm:max-w-[360px] md:max-w-[460px] lg:max-w-[540px] xl:max-w-[580px]'
    html = html.replace(old, new)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(html)
    print("Fine tuned", path)

fine_tune_hero('transportes-fb/index.html')
fine_tune_hero('public/transportes-fb/index.html')
