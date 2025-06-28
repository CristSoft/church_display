# Control Móvil - Church Display (Flask-SocketIO)

## 🚀 Configuración con Flask-SocketIO

### Paso 1: Instalar Dependencias
```bash
# Opción A: Script automático (Windows)
instalar_dependencias.bat

# Opción B: Manual
pip install Flask Flask-SocketIO python-socketio python-engineio

# Opción C: Usando requirements.txt
pip install -r requirements.txt
```

### Paso 2: Iniciar el Servidor Flask
```bash
# Opción A: Servidor Flask (Recomendado)
python app.py

# Opción B: Script automático (alternativo)
python iniciar_servidor.py
```

**¡Automáticamente se abrirán:**
- ✅ Panel de control en la PC: `http://localhost:8080/`
- ✅ Ventana de proyección en la PC: `http://localhost:8080/proyector`

### Paso 3: Configurar la Proyección
1. **En la PC**: La ventana de proyección se abrirá automáticamente
2. **Mover la ventana**: Arrastra la ventana de proyección a la pantalla del proyector
3. **Maximizar**: Haz la ventana de proyección pantalla completa

### Paso 4: Conectar el Celular
1. **Conecta tu celular** a la misma red WiFi
2. **Abre el navegador** en tu celular
3. **Ve a la URL** que aparece en la consola:
   ```
   http://192.168.1.XXX:8080/
   ```

### Paso 5: Usar el Control desde el Celular
- **Buscar himnos**: Escribe el número o título
- **Buscar versículos**: Selecciona versión → libro → capítulo → versículo
- **Navegar**: Usa los botones "Anterior" y "Siguiente"
- **Reproducir audio**: Botón "Play" para himnos

**🎯 Resultado**: Los cambios que hagas en el celular aparecerán **inmediatamente** en la ventana de proyección de la PC.

## 🔧 Ventajas de Flask-SocketIO

### ✅ Comunicación en Tiempo Real
- **SocketIO**: Comunicación bidireccional instantánea
- **Sin recargas**: Los cambios son inmediatos
- **Múltiples dispositivos**: Puedes conectar varios celulares

### ✅ Separación de Responsabilidades
- **Panel de control**: Solo en el celular
- **Ventana de proyección**: Solo en la PC
- **Audio**: Se reproduce en la PC, no en el celular

### ✅ Mejor Rendimiento
- **Menos tráfico**: Solo se envían los cambios necesarios
- **Conexión estable**: Reconexión automática si se pierde la conexión
- **Logs detallados**: Puedes ver qué está pasando en la consola

## 📱 Flujo de Trabajo Optimizado

### Escenario Típico:
1. **PC**: Ejecuta `python app.py`
2. **PC**: Se abren automáticamente panel de control + ventana de proyección
3. **PC**: Mueve la ventana de proyección al proyector
4. **Celular**: Accede a la URL desde tu navegador
5. **Celular**: Controla todo desde tu móvil
6. **Proyector**: Muestra el contenido en tiempo real
7. **Audio**: Se reproduce en la PC, no en el celular

### Ventajas:
- ✅ **Comunicación real**: SocketIO en lugar de BroadcastChannel
- ✅ **Control remoto**: Usa tu celular como control remoto
- ✅ **Tiempo real**: Los cambios son instantáneos
- ✅ **Sin cables**: Todo funciona por WiFi
- ✅ **Audio en PC**: El audio se reproduce donde debe ser

## 🎛️ Controles Disponibles

### ✅ Panel de Control Móvil
- **Switch Biblia/Himnario**: Cambiar entre modos
- **Búsqueda inteligente**: Autocompletado de libros y himnos
- **Navegación rápida**: Grillas de capítulos y versículos
- **Vista previa**: Ver contenido antes de proyectar
- **Configuración**: Ajustar tamaño de fuente
- **Audio**: Reproducir himnos con música (en la PC)

### 🖥️ Ventana de Proyección (PC)
- **Pantalla completa**: Para proyección
- **Fondo de video**: Cambia según el modo
- **Transiciones suaves**: Entre versículos/estrofas
- **Indicadores**: Número de estrofa, referencia bíblica
- **Audio**: Reproducción de himnos

## 🔧 Solución de Problemas

### ❌ No se conecta SocketIO
**Solución:**
1. Verifica que el servidor Flask esté corriendo
2. Comprueba que no haya errores en la consola
3. Asegúrate de que ambos dispositivos usen la misma URL

### ❌ No puedo acceder desde el celular
**Solución:**
1. Verifica que ambos dispositivos estén en la misma WiFi
2. Comprueba que el firewall no bloquee el puerto 8080
3. Intenta con otro puerto modificando `app.py`

### ❌ Los cambios no aparecen en la proyección
**Solución:**
1. Verifica que la ventana de proyección esté abierta
2. Revisa los logs en la consola del servidor
3. Asegúrate de que SocketIO esté conectado

### ❌ El audio no funciona
**Solución:**
1. Asegúrate de que los archivos de audio estén en la carpeta correcta
2. Verifica que el navegador permita reproducción de audio
3. Comprueba que el volumen esté activado en la PC

### ❌ Error al instalar dependencias
**Solución:**
1. Actualiza pip: `python -m pip install --upgrade pip`
2. Instala manualmente: `pip install Flask Flask-SocketIO`
3. Verifica que Python esté en el PATH

## 🌐 Configuración de Red

### Encontrar tu IP:
```bash
# Windows
ipconfig

# Mac/Linux
ifconfig
# o
ip addr
```

### Puertos Alternativos:
Si el puerto 8080 está ocupado, modifica `app.py`:
```python
socketio.run(app, host='0.0.0.0', port=8081, debug=True)
```

### Firewall:
- **Windows**: Permitir Python en el firewall
- **Mac**: Permitir conexiones entrantes
- **Linux**: Verificar iptables/ufw

## 🔒 Seguridad

### Recomendaciones:
- ✅ Solo usar en redes confiables
- ✅ No exponer en Internet
- ✅ Usar solo para eventos de la iglesia
- ❌ No usar en redes públicas

## 📞 Soporte

### Información Útil:
- **Versión**: Church Display v2.0 (Flask-SocketIO)
- **Navegadores**: Chrome, Safari, Firefox, Edge
- **Sistemas**: Windows, Mac, Linux
- **Dispositivos**: iPhone, Android, iPad, tablets

### Logs de Error:
Si algo no funciona, revisa:
1. La consola del navegador (F12)
2. Los mensajes en la terminal del servidor Flask
3. Los logs de SocketIO en la consola

### Archivos Importantes:
- `app.py` - Servidor Flask-SocketIO
- `requirements.txt` - Dependencias
- `js/main.js` - Panel de control
- `js/proyector.js` - Ventana de proyección

---

**¡Ahora tienes control móvil completo con comunicación en tiempo real! 📱✨** 