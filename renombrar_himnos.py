import os
import re

# Carpetas a procesar
carpetas = [
    'assets/himnos/musica/cantado',
    'assets/himnos/musica/instrumental'
]

# Expresión regular para extraer el número al principio
regex_numero = re.compile(r'^(\d{1,3})')

def renombrar_archivos_mp3(carpeta):
    for nombre in os.listdir(carpeta):
        if nombre.lower().endswith('.mp3'):
            match = regex_numero.match(nombre)
            if match:
                numero = match.group(1).zfill(3)
                nuevo_nombre = f'{numero}.mp3'
                origen = os.path.join(carpeta, nombre)
                destino = os.path.join(carpeta, nuevo_nombre)
                # Evitar sobreescribir si ya existe
                if origen != destino and not os.path.exists(destino):
                    print(f'Renombrando: {origen} -> {destino}')
                    os.rename(origen, destino)
                elif origen != destino:
                    print(f'No se puede renombrar {origen} porque {destino} ya existe')

if __name__ == '__main__':
    for carpeta in carpetas:
        renombrar_archivos_mp3(carpeta) 