from flask import Flask, render_template, send_from_directory, request
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Configurar rutas para archivos estáticos
@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory('assets', filename)

@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory('css', filename)

@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory('js', filename)

@app.route('/')
def control():
    return send_from_directory('.', 'index.html')

@app.route('/proyector')
def proyector():
    return send_from_directory('.', 'proyector.html')

@app.route('/proyector.html')
def proyector_html():
    return send_from_directory('.', 'proyector.html')

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

# Eventos de SocketIO
@socketio.on('connect')
def handle_connect():
    print(f'✅ Cliente conectado: {request.sid}')

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

if __name__ == '__main__':
    print("🚀 Iniciando servidor Flask-SocketIO para Church Display...")
    print("📱 Panel de control: http://localhost:8080/")
    print("🖥️  Ventana de proyección: http://localhost:8080/proyector")
    print("🧪 Test SocketIO: http://localhost:8080/test_socketio.html")
    print("🔍 Diagnóstico: http://localhost:8080/diagnostico.html")
    print("🧪 Test Simple: http://localhost:8080/test_simple.html")
    print("🎵 Test Audio: http://localhost:8080/test_audio.html")
    print("🔍 Diagnóstico Himnario: http://localhost:8080/diagnostico_himnario.html")
    print("⏹️  Presiona Ctrl+C para detener el servidor")
    print("-" * 50)
    
    socketio.run(app, host='0.0.0.0', port=8080, debug=True) 