from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit
import os

# Configurar Flask para servir la carpeta 'assets' como estática
app = Flask(__name__, static_url_path='', static_folder='assets')
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

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