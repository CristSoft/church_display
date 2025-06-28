#!/usr/bin/env python3
"""
Script para iniciar el servidor web local para Church Display
Permite controlar el proyector desde el celular
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys
import time
import threading

def obtener_ip_local():
    """Obtiene la IP local de la computadora"""
    try:
        # Conectarse a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def abrir_ventanas_pc():
    """Abre las ventanas necesarias en la PC"""
    time.sleep(2)  # Esperar a que el servidor esté listo
    
    # Abrir panel de control
    webbrowser.open(f"http://localhost:{puerto}")
    
    # Esperar un poco y abrir ventana de proyección
    time.sleep(3)
    webbrowser.open(f"http://localhost:{puerto}/proyector.html")

def main():
    global puerto
    puerto = 8080
    
    # Cambiar al directorio del proyecto
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    # Verificar que estamos en el directorio correcto
    if not os.path.exists("index.html"):
        print("❌ Error: No se encontró index.html")
        print("Asegúrate de ejecutar este script desde el directorio del proyecto")
        sys.exit(1)
    
    # Obtener IP local
    ip_local = obtener_ip_local()
    
    print("🚀 Iniciando servidor para Church Display...")
    print(f"📱 Para acceder desde tu celular, ve a: http://{ip_local}:{puerto}")
    print(f"💻 Para acceder desde esta PC, ve a: http://localhost:{puerto}")
    print("🖥️  La ventana de proyección se abrirá automáticamente en la PC")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    print("-" * 50)
    
    try:
        # Crear el servidor
        with socketserver.TCPServer(("", puerto), http.server.SimpleHTTPRequestHandler) as httpd:
            print(f"✅ Servidor iniciado en puerto {puerto}")
            
            # Abrir ventanas en un hilo separado
            threading.Thread(target=abrir_ventanas_pc, daemon=True).start()
            
            # Mantener el servidor corriendo
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido")
    except OSError as e:
        if e.errno == 48:  # Puerto ya en uso
            print(f"❌ Error: El puerto {puerto} ya está en uso")
            print("Intenta con otro puerto o cierra la aplicación que lo esté usando")
        else:
            print(f"❌ Error al iniciar el servidor: {e}")

if __name__ == "__main__":
    main() 