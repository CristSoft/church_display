import os
import re

def renombrar_himnos():
    # Ruta de la carpeta con los archivos de himnos
    carpeta_himnos = "assets/himnos/letra"
    
    # Verificar que la carpeta existe
    if not os.path.exists(carpeta_himnos):
        print(f"Error: La carpeta {carpeta_himnos} no existe.")
        return
    
    # Obtener todos los archivos en la carpeta
    archivos = os.listdir(carpeta_himnos)
    
    # Filtrar solo archivos JSON
    archivos_json = [f for f in archivos if f.endswith('.json')]
    
    # Contador de archivos renombrados
    renombrados = 0
    
    for archivo in archivos_json:
        # Patrón para extraer el número y el título
        # Formato actual: "1 - Himno #1 Cantad alegres al Señor.json"
        patron = r'^(\d+)\s*-\s*Himno\s*#\d+\s*(.+?)\.json$'
        
        match = re.match(patron, archivo)
        if match:
            numero = int(match.group(1))
            titulo = match.group(2).strip()
            
            # Formatear el número con ceros a la izquierda (3 dígitos)
            numero_formateado = f"{numero:03d}"
            
            # Crear el nuevo nombre
            nuevo_nombre = f"{numero_formateado} - {titulo}.json"
            
            # Ruta completa del archivo actual y nuevo
            ruta_actual = os.path.join(carpeta_himnos, archivo)
            ruta_nueva = os.path.join(carpeta_himnos, nuevo_nombre)
            
            try:
                # Renombrar el archivo
                os.rename(ruta_actual, ruta_nueva)
                print(f"Renombrado: {archivo} -> {nuevo_nombre}")
                renombrados += 1
            except Exception as e:
                print(f"Error al renombrar {archivo}: {e}")
        else:
            print(f"Archivo no coincide con el patrón esperado: {archivo}")
    
    print(f"\nProceso completado. {renombrados} archivos renombrados.")

if __name__ == "__main__":
    print("Iniciando proceso de renombrado de archivos de himnos...")
    renombrar_himnos() 