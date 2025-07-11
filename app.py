from flask import Flask, render_template, send_from_directory, request, Response
from flask_socketio import SocketIO, emit
import os
import json
from threading import Lock
import qrcode
import io
import base64

# Configurar Flask para servir la carpeta 'assets' como estática
app = Flask(__name__, static_url_path='', static_folder='assets')
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

MEMORIA_PATH = 'memoria_estado.json'
memoria_lock = Lock()

def cargar_memoria():
    if not os.path.exists(MEMORIA_PATH):
        memoria = {
            "modo": "biblia",
            "biblia": {
                "version": "es-rv60.json",
                "libro": None,
                "capitulo": None,
                "versiculo": None
            },
            "himnario": {
                "numero": None,
                "titulo": None,
                "estrofa": None
            }
        }
        guardar_memoria(memoria)
        return memoria
    with memoria_lock:
        with open(MEMORIA_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)

def guardar_memoria(memoria):
    with memoria_lock:
        with open(MEMORIA_PATH, 'w', encoding='utf-8') as f:
            json.dump(memoria, f, ensure_ascii=False, indent=2)

memoria_estado = cargar_memoria()

# Restaurar la ruta personalizada para assets
@app.route('/assets/<path:filename>')
def assets(filename):
    print(f"[DEPURACIÓN] Solicitando asset: {filename}")
    return send_from_directory('assets', filename)

@app.route('/css/<path:filename>')
def css(filename):
    print(f"[DEPURACIÓN] Solicitando CSS: {filename}")
    return send_from_directory('src/css', filename)

@app.route('/src/js/<path:filename>')
def js(filename):
    print(f"[DEPURACIÓN] Solicitando JS: {filename}")
    return send_from_directory('src/js', filename)

@app.route('/src/assets/<path:filename>')
def src_assets(filename):
    print(f"[DEPURACIÓN] Solicitando src/assets: {filename}")
    return send_from_directory('src/assets', filename)

@app.route('/')
def control():
    return send_from_directory('src', 'index.html')

@app.route('/proyector')
def proyector():
    return send_from_directory('.', 'src/proyector.html')

@app.route('/proyector.html')
def proyector_html_redirect():
    return '', 301, {'Location': '/proyector'}

@app.route('/test_socketio.html')
def test_socketio():
    return send_from_directory('.', 'test_socketio.html')

@app.route('/diagnostico.html')
def diagnostico():
    return send_from_directory('.', 'diagnostico.html')

@app.route('/test_simple.html')
def test_simple():
    return send_from_directory('.', 'test_simple.html')

@app.route('/test_audio.html')
def test_audio():
    return send_from_directory('.', 'test_audio.html')

@app.route('/diagnostico_himnario.html')
def diagnostico_himnario():
    return send_from_directory('.', 'diagnostico_himnario.html')

@app.route('/test_fadeout.html')
def test_fadeout():
    return send_from_directory('.', 'test_fadeout.html')

@app.route('/test_audio_auto.html')
def test_audio_auto():
    return send_from_directory('.', 'test_audio_auto.html')

proyector_abierto = False  # Estado global del proyector

# Eventos de SocketIO
@socketio.on('connect')
def handle_connect():
    print(f'✅ Cliente conectado: {request.sid}')
    # Enviar el estado actual del proyector al nuevo cliente
    emit('estadoProyector', {'abierto': proyector_abierto})

@socketio.on('disconnect')
def handle_disconnect():
    print(f'❌ Cliente desconectado: {request.sid}')

@socketio.on('update_text')
def on_update_text(data):
    print(f'📤 Recibido update_text: {data}')
    # Reenviar a todos los clientes del proyector
    emit('update_text', data, broadcast=True, include_self=False)

@socketio.on('change_mode')
def on_change_mode(data):
    print(f'📤 Recibido change_mode: {data}')
    # Reenviar a todos los clientes del proyector
    emit('change_mode', data, broadcast=True, include_self=False)

@socketio.on('config')
def on_config(data):
    print(f'📤 Recibido config: {data}')
    # Reenviar a todos los clientes del proyector
    emit('config', data, broadcast=True, include_self=False)

@socketio.on('reproducirAudio')
def on_reproducir_audio(data):
    print(f'📤 Recibido reproducirAudio: {data}')
    # Reenviar a todos los clientes del proyector
    emit('reproducirAudio', data, broadcast=True, include_self=False)

@socketio.on('detenerAudio')
def on_detener_audio(data):
    print(f'📤 Recibido detenerAudio: {data}')
    # Reenviar a todos los clientes del proyector
    emit('detenerAudio', data, broadcast=True, include_self=False)

@socketio.on('audioTerminado')
def on_audio_terminado(data):
    print(f'📤 Recibido audioTerminado: {data}')
    # Reenviar a todos los clientes del panel de control
    emit('audioTerminado', data, broadcast=True, include_self=False)

# --- NUEVO: Reenviar proyectorClick a todos los clientes ---
@socketio.on('proyectorClick')
def on_proyector_click():
    print(f'📤 Recibido proyectorClick (reenviando a todos los clientes)')
    emit('proyectorClick', broadcast=True, include_self=False)

# --- NUEVO: Reenviar proyectorAbierto y proyectorCerrado a todos los clientes ---
@socketio.on('proyectorAbierto')
def on_proyector_abierto():
    global proyector_abierto
    proyector_abierto = True
    print(f'📤 Recibido proyectorAbierto (reenviando a todos los clientes)')
    emit('proyectorAbierto', broadcast=True)  # include_self=True por defecto

@socketio.on('proyectorCerrado')
def on_proyector_cerrado():
    global proyector_abierto
    proyector_abierto = False
    print(f'📤 Recibido proyectorCerrado (reenviando a todos los clientes)')
    emit('proyectorCerrado', broadcast=True)  # include_self=True por defecto

# --- NUEVO: API para memoria del sistema ---
@socketio.on('get_memoria')
def on_get_memoria():
    emit('memoria_estado', memoria_estado)

@socketio.on('set_memoria')
def on_set_memoria(data):
    global memoria_estado
    client_id = data.get('clientId')
    print(f'📥 Actualizando memoria del sistema: {data}')
    # Actualizar solo los campos recibidos (excepto clientId)
    for k, v in data.items():
        if k in ('clientId',):
            continue
        if k in memoria_estado and isinstance(v, dict):
            memoria_estado[k].update(v)
        else:
            if k != 'clientId':
                memoria_estado[k] = v
    guardar_memoria(memoria_estado)
    emit('memoria_actualizada', {'memoria': memoria_estado, 'clientId': client_id}, broadcast=True)

@socketio.on('configuracion_actualizada')
def on_configuracion_actualizada(data):
    print(f'📤 Recibido configuracion_actualizada: {data}')
    # Reenviar a todos los clientes excepto al que lo envió
    emit('configuracion_actualizada', data, broadcast=True, include_self=False)

# --- NUEVO: Endpoints para config.json ---
@app.route('/config.json', methods=['GET'])
def get_config():
    """Obtiene la configuración desde config.json"""
    try:
        if os.path.exists('config.json'):
            with open('config.json', 'r', encoding='utf-8') as f:
                config = json.load(f)
                print(f'📋 Configuración cargada: {config}')
                return json.dumps(config, ensure_ascii=False, indent=2)
        else:
            # Crear configuración por defecto
            config_default = {
                "fontsizeBiblia": 5,
                "fontsizeHimnario": 5,
                "soloReferencia": False,
                "autoFullscreen": True
            }
            print(f'📋 Configuración por defecto creada: {config_default}')
            return json.dumps(config_default, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f'❌ Error al cargar config.json: {e}')
        return json.dumps({"error": str(e)}), 500

@app.route('/config.json', methods=['POST'])
def save_config():
    """Guarda la configuración en config.json"""
    try:
        config = request.get_json()
        if config is None:
            return json.dumps({"error": "No se recibió JSON válido"}), 400
        
        print(f'💾 Guardando configuración: {config}')
        
        with open('config.json', 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
        
        print(f'✅ Configuración guardada exitosamente')
        return json.dumps({"success": True, "message": "Configuración guardada"})
    except Exception as e:
        print(f'❌ Error al guardar config.json: {e}')
        return json.dumps({"error": str(e)}), 500

@app.route('/get_ip')
def get_ip():
    """Obtiene la IP local del servidor"""
    try:
        import socket
        import subprocess
        import platform
        
        # En Windows, usar ipconfig para obtener la IP de Wi-Fi específicamente
        if platform.system() == "Windows":
            try:
                result = subprocess.run(['ipconfig'], capture_output=True, text=True, shell=True)
                lines = result.stdout.split('\n')
                wifi_ip = None
                current_adapter = None
                
                for line in lines:
                    line = line.strip()
                    
                    # Detectar adaptadores de red
                    if 'Wi-Fi' in line or 'Wireless' in line or 'WLAN' in line:
                        current_adapter = 'wifi'
                    elif 'Ethernet' in line or 'Local Area Connection' in line:
                        current_adapter = 'ethernet'
                    elif 'Loopback' in line:
                        current_adapter = None
                    
                    # Buscar IPs en el adaptador Wi-Fi
                    if current_adapter == 'wifi' and 'IPv4' in line:
                        # Extraer la IP de la línea
                        if ':' in line:
                            ip_part = line.split(':')[-1].strip()
                            # Verificar que sea una IP válida
                            if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                if not ip_part.startswith('169.254.'):  # Excluir IPs de link-local
                                    wifi_ip = ip_part
                                    print(f'🌐 IP Wi-Fi detectada: {wifi_ip}')
                                    return json.dumps({"ip": wifi_ip})
                
                # Si no se encontró IP de Wi-Fi, buscar cualquier IP local
                for line in lines:
                    if 'IPv4' in line and ('192.168.' in line or '10.' in line or '172.' in line):
                        if ':' in line:
                            ip_part = line.split(':')[-1].strip()
                            if ip_part and not ip_part.startswith('169.254.'):
                                print(f'🌐 IP local detectada (fallback): {ip_part}')
                                return json.dumps({"ip": ip_part})
                                
            except Exception as e:
                print(f'❌ Error al ejecutar ipconfig: {e}')
        
        # En Linux/macOS, usar ifconfig o ip para obtener la IP de Wi-Fi
        elif platform.system() in ["Linux", "Darwin"]:
            try:
                # Intentar con 'ip' command primero (más moderno)
                result = subprocess.run(['ip', 'addr', 'show'], capture_output=True, text=True)
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    current_interface = None
                    
                    for line in lines:
                        line = line.strip()
                        
                        # Detectar interfaces Wi-Fi
                        if 'wlan' in line or 'wifi' in line or 'wireless' in line:
                            current_interface = 'wifi'
                        elif 'eth' in line or 'en' in line:
                            current_interface = 'ethernet'
                        
                        # Buscar IPs en interfaces Wi-Fi
                        if current_interface == 'wifi' and 'inet ' in line:
                            ip_part = line.split('inet ')[1].split('/')[0].strip()
                            if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                if not ip_part.startswith('169.254.'):
                                    print(f'🌐 IP Wi-Fi detectada (Linux/macOS): {ip_part}')
                                    return json.dumps({"ip": ip_part})
                
                # Fallback a ifconfig
                result = subprocess.run(['ifconfig'], capture_output=True, text=True)
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    current_interface = None
                    
                    for line in lines:
                        line = line.strip()
                        
                        # Detectar interfaces Wi-Fi
                        if 'wlan' in line or 'wifi' in line or 'wireless' in line:
                            current_interface = 'wifi'
                        elif 'eth' in line or 'en' in line:
                            current_interface = 'ethernet'
                        
                        # Buscar IPs en interfaces Wi-Fi
                        if current_interface == 'wifi' and 'inet ' in line:
                            ip_part = line.split('inet ')[1].split(' ')[0].strip()
                            if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                if not ip_part.startswith('169.254.'):
                                    print(f'🌐 IP Wi-Fi detectada (ifconfig): {ip_part}')
                                    return json.dumps({"ip": ip_part})
                                    
            except Exception as e:
                print(f'❌ Error al ejecutar comandos de red en Linux/macOS: {e}')
        
        # Fallback: usar socket
        hostname = socket.gethostname()
        local_ip = socket.gethostbyname(hostname)
        
        # Verificar que no sea localhost
        if local_ip != '127.0.0.1':
            print(f'🌐 IP local detectada (socket): {local_ip}')
            return json.dumps({"ip": local_ip})
        
        # Si es localhost, intentar obtener todas las IPs
        try:
            # Obtener todas las IPs del sistema
            ips = []
            for info in socket.getaddrinfo(hostname, None):
                ip = info[4][0]
                if ip != '127.0.0.1' and not ip.startswith('169.254.'):
                    ips.append(ip)
            
            if ips:
                # Usar la primera IP válida
                print(f'🌐 IP local detectada (getaddrinfo): {ips[0]}')
                return json.dumps({"ip": ips[0]})
        except Exception as e:
            print(f'❌ Error al obtener IPs adicionales: {e}')
        
        # Último fallback: usar la IP del cliente
        client_ip = request.remote_addr
        if client_ip != '127.0.0.1':
            print(f'🌐 Usando IP del cliente: {client_ip}')
            return json.dumps({"ip": client_ip})
        
        # Si todo falla, mostrar un mensaje genérico
        print('❌ No se pudo detectar la IP local')
        return json.dumps({"ip": "IP_LOCAL"})
        
    except Exception as e:
        print(f'❌ Error al obtener IP local: {e}')
        return json.dumps({"ip": "IP_LOCAL"})

@app.route('/qr_ip')
def qr_ip():
    """Genera un código QR con la IP local del servidor"""
    try:
        # Obtener la IP usando la misma lógica que get_ip
        import socket
        import subprocess
        import platform
        
        ip_address = None
        
        # En Windows, usar ipconfig para obtener la IP de Wi-Fi específicamente
        if platform.system() == "Windows":
            try:
                result = subprocess.run(['ipconfig'], capture_output=True, text=True, shell=True)
                lines = result.stdout.split('\n')
                wifi_ip = None
                current_adapter = None
                
                for line in lines:
                    line = line.strip()
                    
                    # Detectar adaptadores de red
                    if 'Wi-Fi' in line or 'Wireless' in line or 'WLAN' in line:
                        current_adapter = 'wifi'
                    elif 'Ethernet' in line or 'Local Area Connection' in line:
                        current_adapter = 'ethernet'
                    elif 'Loopback' in line:
                        current_adapter = None
                    
                    # Buscar IPs en el adaptador Wi-Fi
                    if current_adapter == 'wifi' and 'IPv4' in line:
                        # Extraer la IP de la línea
                        if ':' in line:
                            ip_part = line.split(':')[-1].strip()
                            # Verificar que sea una IP válida
                            if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                if not ip_part.startswith('169.254.'):  # Excluir IPs de link-local
                                    wifi_ip = ip_part
                                    ip_address = wifi_ip
                                    break
                
                # Si no se encontró IP de Wi-Fi, buscar cualquier IP local
                if not ip_address:
                    for line in lines:
                        if 'IPv4' in line and ('192.168.' in line or '10.' in line or '172.' in line):
                            if ':' in line:
                                ip_part = line.split(':')[-1].strip()
                                if ip_part and not ip_part.startswith('169.254.'):
                                    ip_address = ip_part
                                    break
                                    
            except Exception as e:
                print(f'❌ Error al ejecutar ipconfig: {e}')
        
        # En Linux/macOS, usar ifconfig o ip para obtener la IP de Wi-Fi
        elif platform.system() in ["Linux", "Darwin"]:
            try:
                # Intentar con 'ip' command primero (más moderno)
                result = subprocess.run(['ip', 'addr', 'show'], capture_output=True, text=True)
                if result.returncode == 0:
                    lines = result.stdout.split('\n')
                    current_interface = None
                    
                    for line in lines:
                        line = line.strip()
                        
                        # Detectar interfaces Wi-Fi
                        if 'wlan' in line or 'wifi' in line or 'wireless' in line:
                            current_interface = 'wifi'
                        elif 'eth' in line or 'en' in line:
                            current_interface = 'ethernet'
                        
                        # Buscar IPs en interfaces Wi-Fi
                        if current_interface == 'wifi' and 'inet ' in line:
                            ip_part = line.split('inet ')[1].split('/')[0].strip()
                            if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                if not ip_part.startswith('169.254.'):
                                    ip_address = ip_part
                                    break
                
                # Fallback a ifconfig
                if not ip_address:
                    result = subprocess.run(['ifconfig'], capture_output=True, text=True)
                    if result.returncode == 0:
                        lines = result.stdout.split('\n')
                        current_interface = None
                        
                        for line in lines:
                            line = line.strip()
                            
                            # Detectar interfaces Wi-Fi
                            if 'wlan' in line or 'wifi' in line or 'wireless' in line:
                                current_interface = 'wifi'
                            elif 'eth' in line or 'en' in line:
                                current_interface = 'ethernet'
                            
                            # Buscar IPs en interfaces Wi-Fi
                            if current_interface == 'wifi' and 'inet ' in line:
                                ip_part = line.split('inet ')[1].split(' ')[0].strip()
                                if ip_part and ('192.168.' in ip_part or '10.' in ip_part or '172.' in ip_part):
                                    if not ip_part.startswith('169.254.'):
                                        ip_address = ip_part
                                        break
                                        
            except Exception as e:
                print(f'❌ Error al ejecutar comandos de red en Linux/macOS: {e}')
        
        # Fallback: usar socket
        if not ip_address:
            hostname = socket.gethostname()
            local_ip = socket.gethostbyname(hostname)
            
            # Verificar que no sea localhost
            if local_ip != '127.0.0.1':
                ip_address = local_ip
        
        # Si todo falla, usar la IP del cliente
        if not ip_address:
            client_ip = request.remote_addr
            if client_ip != '127.0.0.1':
                ip_address = client_ip
        
        # Si no se pudo obtener IP, devolver error
        if not ip_address:
            return json.dumps({"error": "No se pudo detectar la IP local"}), 500
        
        # Crear la URL completa
        url = f"http://{ip_address}:8080"
        
        # Generar el código QR
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(url)
        qr.make(fit=True)
        
        # Crear la imagen
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convertir a base64
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_str = base64.b64encode(img_buffer.getvalue()).decode()
        
        return json.dumps({
            "qr": img_str,
            "url": url,
            "ip": ip_address
        })
        
    except Exception as e:
        print(f'❌ Error al generar código QR: {e}')
        return json.dumps({"error": str(e)}), 500

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask-SocketIO para Church Display...")
    print("📱 Panel de control: http://localhost:8080/")
    print("🖥️  Ventana de proyección: http://localhost:8080/proyector")
    print("🧪 Test SocketIO: http://localhost:8080/test_socketio.html")
    print("🔍 Diagnóstico: http://localhost:8080/diagnostico.html")
    print("🧪 Test Simple: http://localhost:8080/test_simple.html")
    print("🎵 Test Audio: http://localhost:8080/test_audio.html")
    print("🔍 Diagnóstico Himnario: http://localhost:8080/diagnostico_himnario.html")
    print("🎞 Test Fadeout: http://localhost:8080/test_fadeout.html")
    print("🔊 Test Audio Automático: http://localhost:8080/test_audio_auto.html")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    print("-" * 50)
    
    socketio.run(app, host='0.0.0.0', port=8080, debug=True) 