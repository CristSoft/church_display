import json
import re

# Ruta del archivo JSON (ajustada para ejecución desde la raíz)
RUTA_JSON = 'src/assets/himnos/indice_himnos.json'

# Cargar el índice
with open(RUTA_JSON, 'r', encoding='utf-8') as f:
    indice = json.load(f)

# Expresión regular para quitar el prefijo
patron = re.compile(r'^Himno\s*#?\d+\s+', re.IGNORECASE)

# Limpiar los títulos
for himno in indice:
    original = himno['title']
    limpio = patron.sub('', original).strip()
    himno['title'] = limpio

# Guardar el archivo limpio
with open(RUTA_JSON, 'w', encoding='utf-8') as f:
    json.dump(indice, f, ensure_ascii=False, indent=2)

print('¡Títulos limpiados correctamente!') 