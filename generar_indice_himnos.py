#!/usr/bin/env python3
"""
Script para generar automáticamente el índice de himnos
basándose en los archivos JSON disponibles en assets/himnos/letra/
"""

import os
import json
import re
from pathlib import Path

def extraer_info_himno(nombre_archivo):
    """Extrae número y título del nombre del archivo"""
    # Patrón: "001 - Cantad alegres al Señor.json"
    match = re.match(r'^(\d+)\s*-\s*(.+)\.json$', nombre_archivo)
    if match:
        numero = match.group(1).zfill(3)  # Rellenar con ceros a la izquierda
        titulo = match.group(2).strip()
        return numero, titulo
    return None, None

def leer_titulo_desde_json(ruta_archivo):
    """Lee el título desde el archivo JSON"""
    try:
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data.get('title', '')
    except Exception as e:
        print(f"Error al leer {ruta_archivo}: {e}")
        return None

def generar_indice_himnos():
    """Genera el índice de himnos basándose en los archivos disponibles"""
    
    # Ruta a los archivos de himnos
    ruta_himnos = Path("assets/himnos/letra")
    
    if not ruta_himnos.exists():
        print(f"Error: No se encontró el directorio {ruta_himnos}")
        return
    
    himnos = []
    
    # Obtener todos los archivos JSON
    archivos_json = list(ruta_himnos.glob("*.json"))
    archivos_json.sort()  # Ordenar alfabéticamente
    
    print(f"Encontrados {len(archivos_json)} archivos de himnos")
    
    for archivo in archivos_json:
        nombre_archivo = archivo.name
        
        # Extraer información del nombre del archivo
        numero, titulo = extraer_info_himno(nombre_archivo)
        
        if numero and titulo:
            # Intentar leer el título desde el JSON para verificar
            titulo_json = leer_titulo_desde_json(archivo)
            
            # Usar el título del JSON si está disponible, sino usar el del nombre del archivo
            titulo_final = titulo_json if titulo_json else titulo
            
            himno = {
                "number": numero,
                "title": titulo_final,
                "file": nombre_archivo
            }
            
            himnos.append(himno)
            print(f"  {numero}: {titulo_final}")
        else:
            print(f"  ⚠️  No se pudo procesar: {nombre_archivo}")
    
    # Ordenar por número
    himnos.sort(key=lambda x: int(x["number"]))
    
    # Generar el código JavaScript
    codigo_js = """/**
 * Obtiene el índice de himnos disponibles.
 * @returns {Promise<Array<{number: string, title: string, file: string}>>}
 */
export async function getHymnIndex() {
  try {
    // Índice generado automáticamente
    const himnos = [
"""
    
    for himno in himnos:
        codigo_js += f'      {{ number: "{himno["number"]}", title: "{himno["title"]}", file: "{himno["file"]}" }},\n'
    
    codigo_js += """    ];
    
    console.log(`Índice de himnos cargado: ${himnos.length} himnos`);
    return himnos;
  } catch (err) {
    console.error('Error al obtener el índice de himnos:', err);
    return [];
  }
}
"""
    
    # Guardar el código en un archivo temporal
    with open("indice_himnos_generado.js", "w", encoding="utf-8") as f:
        f.write(codigo_js)
    
    print(f"\n✅ Índice generado con {len(himnos)} himnos")
    print("📁 Archivo generado: indice_himnos_generado.js")
    print("\nPara usar este índice:")
    print("1. Copia el contenido de indice_himnos_generado.js")
    print("2. Reemplaza la función getHymnIndex() en js/dataManager.js")
    
    # También generar un JSON para referencia
    with open("indice_himnos.json", "w", encoding="utf-8") as f:
        json.dump(himnos, f, indent=2, ensure_ascii=False)
    
    print("📁 Archivo JSON generado: indice_himnos.json")

if __name__ == "__main__":
    generar_indice_himnos() 