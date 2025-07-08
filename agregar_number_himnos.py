#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para agregar etiqueta "number" a archivos JSON de himnos
Extrae el número del nombre del archivo y lo agrega como campo "number" justo después de "title"
"""

import os
import json
import re
from pathlib import Path
from collections import OrderedDict

def extraer_numero_archivo(nombre_archivo):
    match = re.match(r'^(\d+)', nombre_archivo)
    if match:
        return match.group(1)
    return None

def formatear_numero(numero):
    return numero.zfill(3)

def procesar_archivo_himno(ruta_archivo):
    try:
        numero_archivo = extraer_numero_archivo(ruta_archivo.name)
        if not numero_archivo:
            print(f"⚠️  {ruta_archivo.name}: No se pudo extraer número del nombre")
            return False
        with open(ruta_archivo, 'r', encoding='utf-8') as f:
            data = json.load(f, object_pairs_hook=OrderedDict)
        numero_formateado = formatear_numero(numero_archivo)
        # Si ya está bien, solo reordenar si hace falta
        if 'number' in data and data['number'] == numero_formateado:
            # Si ya está después de title, no hacer nada
            keys = list(data.keys())
            if keys.index('number') == keys.index('title') + 1:
                print(f"ℹ️  {ruta_archivo.name}: Ya tiene number correcto y en orden")
                return False
        # Crear nuevo OrderedDict con el orden deseado
        nuevo = OrderedDict()
        for k, v in data.items():
            nuevo[k] = v
            if k == 'title':
                nuevo['number'] = numero_formateado
        # Si number no estaba y no se agregó, agregarlo igual
        if 'number' not in nuevo:
            nuevo['number'] = numero_formateado
        with open(ruta_archivo, 'w', encoding='utf-8') as f:
            json.dump(nuevo, f, ensure_ascii=False, indent=2)
        print(f"✅ {ruta_archivo.name}: Number agregado/actualizado y reordenado")
        return True
    except json.JSONDecodeError as e:
        print(f"❌ {ruta_archivo.name}: Error al parsear JSON - {e}")
        return False
    except Exception as e:
        print(f"❌ {ruta_archivo.name}: Error inesperado - {e}")
        return False

def main():
    carpeta_himnos = Path("src/assets/himnos/letra")
    if not carpeta_himnos.exists():
        print(f"❌ La carpeta {carpeta_himnos} no existe")
        return
    print("🎵 Iniciando agregado de etiqueta 'number' a himnos (debajo de title)...")
    print(f"📁 Carpeta: {carpeta_himnos.absolute()}")
    print("-" * 60)
    archivos_procesados = 0
    archivos_modificados = 0
    archivos_con_error = 0
    for archivo in carpeta_himnos.glob("*.json"):
        archivos_procesados += 1
        if procesar_archivo_himno(archivo):
            archivos_modificados += 1
        else:
            archivos_con_error += 1
    print("-" * 60)
    print("📊 RESUMEN:")
    print(f"   Archivos procesados: {archivos_procesados}")
    print(f"   Archivos modificados: {archivos_modificados}")
    print(f"   Archivos sin cambios: {archivos_procesados - archivos_modificados - archivos_con_error}")
    print(f"   Archivos con error: {archivos_con_error}")
    if archivos_modificados > 0:
        print(f"\n✅ ¡Proceso completado! {archivos_modificados} archivos fueron modificados.")
    else:
        print(f"\nℹ️  No se encontraron archivos que necesiten modificación.")

if __name__ == "__main__":
    main() 