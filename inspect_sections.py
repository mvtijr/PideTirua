import re

with open('transportes-fb/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

hero_idx = text.find('id="inicio"')
print("--- HERO ---")
print(text[hero_idx:hero_idx+1200])

print("\n--- NUESTRO COMPROMISO ---")
comp_idx = text.find('NUESTRO COMPROMISO')
print(text[comp_idx-100:comp_idx+600])

print("\n--- CLAVES DE NUESTRO ÉXITO ---")
claves_idx = text.find('CLAVES DE NUESTRO')
print(text[claves_idx-100:claves_idx+600])

print("\n--- SERVICIOS INTEGRALES ---")
serv_idx = text.find('SERVICIOS INTEGRALES')
print(text[serv_idx-100:serv_idx+600])

print("\n--- HACIENDO EL TRANSPORTE ---")
hac_idx = text.find('HACIENDO EL TRANSPORTE')
print(text[hac_idx-100:hac_idx+600])

print("\n--- TRES COLUMNAS QUIÉNES SOMOS ---")
qs_idx = text.find('QUIÉNES SOMOS')
print(text[qs_idx-100:qs_idx+800])
