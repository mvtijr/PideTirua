with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

tw_idx = text.find('fontFamily:')
print(text[tw_idx-50:tw_idx+400])

style_idx = text.find('<style>')
print(text[style_idx:style_idx+1200])
