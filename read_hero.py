with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('id="inicio"')
end = text.find('</section>', start)
print(text[start-20:end+10])
