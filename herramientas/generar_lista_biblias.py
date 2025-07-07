#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para generar automáticamente la lista de biblias disponibles
Escanea la carpeta assets/biblias y genera el archivo biblias-disponibles.json
"""

import os
import json
import glob

def generar_lista_biblias():
    """Genera la lista de biblias disponibles en assets/biblias"""
    
    # Ruta de la carpeta de biblias
    carpeta_biblias = "assets/biblias"
    
    # Verificar que la carpeta existe
    if not os.path.exists(carpeta_biblias):
        print(f"Error: La carpeta {carpeta_biblias} no existe")
        return
    
    # Buscar todos los archivos XML
    archivos_xml = glob.glob(os.path.join(carpeta_biblias, "*.xml"))
    
    if not archivos_xml:
        print(f"No se encontraron archivos XML en {carpeta_biblias}")
        return
    
    # Obtener solo los nombres de archivo (sin la ruta)
    nombres_archivos = [os.path.basename(archivo) for archivo in archivos_xml]
    
    # Diccionario de descripciones conocidas
    descripciones = {
        "es-DHH.xml": "Dios Habla Hoy",
        "es-NTV.xml": "Nueva Traducción Viviente", 
        "es-rv2015.xml": "Reina Valera 2015",
        "es-rv2020.xml": "Reina Valera 2020",
        "es-rv60.xml": "Reina Valera 1960",
        "rv2020_apocalipsis.xml": "Reina Valera 2020 - Apocalipsis",
        "rv2020_genesis_mateo.xml": "Reina Valera 2020 - Génesis y Mateo"
    }
    
    # Crear el objeto de datos
    datos = {
        "biblias": sorted(nombres_archivos),
        "descripciones": {}
    }
    
    # Agregar descripciones para archivos conocidos
    for archivo in nombres_archivos:
        if archivo in descripciones:
            datos["descripciones"][archivo] = descripciones[archivo]
        else:
            # Para archivos no conocidos, usar el nombre sin extensión
            datos["descripciones"][archivo] = archivo.replace('.xml', '')
    
    # Ruta del archivo de salida
    archivo_salida = os.path.join(carpeta_biblias, "biblias-disponibles.json")
    
    # Escribir el archivo JSON
    try:
        with open(archivo_salida, 'w', encoding='utf-8') as f:
            json.dump(datos, f, indent=2, ensure_ascii=False)
        
        print(f"Archivo generado exitosamente: {archivo_salida}")
        print(f"Biblias encontradas: {len(nombres_archivos)}")
        print("Lista de biblias:")
        for archivo in sorted(nombres_archivos):
            desc = datos["descripciones"][archivo]
            print(f"  - {archivo} -> {desc}")
            
    except Exception as e:
        print(f"Error al escribir el archivo: {e}")

if __name__ == "__main__":
    generar_lista_biblias() 