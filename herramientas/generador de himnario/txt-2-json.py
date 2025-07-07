import json
import re
import os

def dividir_texto_por_caracteres(lineas_originales, max_chars):
    """
    Toma una lista de líneas de texto y las agrupa en secciones
    sin exceder un número máximo de caracteres por sección.
    """
    if not lineas_originales:
        return []

    secciones_finales = []
    seccion_actual = []
    caracteres_actuales = 0

    for linea in lineas_originales:
        longitud_linea = len(linea)
        
        # Si la sección está vacía, siempre añadimos la primera línea.
        if not seccion_actual:
            seccion_actual.append(linea)
            caracteres_actuales += longitud_linea
        # Si añadir la nueva línea excede el límite, cerramos la sección actual.
        elif caracteres_actuales + longitud_linea > max_chars:
            secciones_finales.append(seccion_actual)
            # Y empezamos una nueva sección con la línea actual.
            seccion_actual = [linea]
            caracteres_actuales = longitud_linea
        # Si cabe, la añadimos a la sección actual.
        else:
            seccion_actual.append(linea)
            caracteres_actuales += longitud_linea
            
    # No olvidar añadir la última sección que quedó abierta.
    if seccion_actual:
        secciones_finales.append(seccion_actual)
        
    return secciones_finales

def convertir_himno_txt_to_json(archivo_entrada, archivo_salida, max_chars_por_seccion=60):
    """
    Convierte un único archivo TXT de un himno, agrupando por caracteres.
    """
    try:
        with open(archivo_entrada, 'r', encoding='utf-8') as f:
            lineas = f.readlines()
    except FileNotFoundError:
        print(f"Error: El archivo de entrada '{archivo_entrada}' no fue encontrado.")
        return

    lineas = [linea.strip() for linea in lineas if linea.strip()]
    if not lineas:
        print(f"Aviso: El archivo '{archivo_entrada}' está vacío. Omitiendo.")
        return

    titulo = lineas.pop(0)
    estrofas, coro_lines = {}, []
    parte_actual = None

    for linea in lineas:
        if re.match(r'^\d+$', linea):
            parte_actual = linea
            estrofas[parte_actual] = []
        elif linea.lower().startswith('coro'):
            parte_actual = "coro"
        elif parte_actual:
            if parte_actual == "coro": coro_lines.append(linea)
            else: estrofas[parte_actual].append(linea)

    datos_json = {"title": titulo, "sections": {}}
    contador_seccion = 1
    
    for numero_estrofa in sorted(estrofas.keys(), key=int):
        # Procesar estrofa
        secciones_estrofa = dividir_texto_por_caracteres(estrofas[numero_estrofa], max_chars_por_seccion)
        for texto_seccion in secciones_estrofa:
            datos_json["sections"][str(contador_seccion)] = {"verse": numero_estrofa, "text": texto_seccion}
            contador_seccion += 1

        # Procesar coro si existe
        if coro_lines:
            secciones_coro = dividir_texto_por_caracteres(coro_lines, max_chars_por_seccion)
            for texto_seccion in secciones_coro:
                datos_json["sections"][str(contador_seccion)] = {"verse": "coro", "text": texto_seccion}
                contador_seccion += 1

    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(datos_json, f, indent=2, ensure_ascii=False)

def procesar_carpeta(carpeta_entrada, carpeta_salida, max_chars_por_seccion=60):
    """Función principal que procesa todos los archivos .txt de una carpeta."""
    if not os.path.isdir(carpeta_entrada):
        print(f"Error: La carpeta de entrada '{carpeta_entrada}' no existe.")
        return

    os.makedirs(carpeta_salida, exist_ok=True)
    archivos_txt = [f for f in os.listdir(carpeta_entrada) if f.lower().endswith('.txt')]

    if not archivos_txt:
        print(f"No se encontraron archivos .txt en la carpeta '{carpeta_entrada}'.")
        return

    print(f"Iniciando conversión de {len(archivos_txt)} himnos...")
    
    for nombre_archivo in archivos_txt:
        ruta_entrada = os.path.join(carpeta_entrada, nombre_archivo)
        nombre_base = os.path.splitext(nombre_archivo)[0]
        ruta_salida = os.path.join(carpeta_salida, f"{nombre_base}.json")
        
        print(f"  - Convirtiendo: '{nombre_archivo}' -> '{nombre_base}.json'")
        convertir_himno_txt_to_json(ruta_entrada, ruta_salida, max_chars_por_seccion)
    
    print("\n--- Proceso completado ---")
    print(f"Todos los archivos han sido guardados en la carpeta '{carpeta_salida}'.")

# --- INSTRUCCIONES DE USO ---
if __name__ == "__main__":
    carpeta_entrada = "himnario-txt"
    carpeta_salida = "himnario-json"
    
    # ¡AJUSTA ESTE VALOR!
    # Límite de caracteres por sección. Un valor entre 55-65 funciona bien
    # para agrupar líneas cortas de a dos, y dejar las largas solas.
    max_caracteres = 60

    procesar_carpeta(carpeta_entrada, carpeta_salida, max_caracteres)