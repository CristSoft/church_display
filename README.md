# Church Display - Sistema de Proyección para Iglesia

Sistema completo para mostrar textos bíblicos e himnos en proyección durante servicios religiosos.

## Características

- **Modo Biblia**: Búsqueda y visualización de versículos bíblicos
- **Modo Himnario**: Búsqueda y visualización de letras de himnos
- **Reproducción de audio**: Para himnos con música
- **Ventana de proyección**: Ventana separada para mostrar contenido
- **Navegación**: Controles para navegar entre versículos/estrofas

## Correcciones Realizadas

### Problemas Solucionados:

1. **Input de búsqueda de himnos oculto**
   - ✅ Corregido: El input ahora se muestra correctamente en modo himnario
   - ✅ Mejorado: Estilos CSS para mejor visibilidad

2. **Autocompletado de libros de la Biblia**
   - ✅ Corregido: Las sugerencias ahora aparecen al escribir
   - ✅ Mejorado: Posicionamiento correcto de las sugerencias
   - ✅ Agregado: Event listeners para mostrar/ocultar sugerencias

3. **Carga de texto bíblico**
   - ✅ Corregido: Parsing mejorado para diferentes estructuras XML
   - ✅ Mejorado: Manejo de errores y validación de datos
   - ✅ Agregado: Logs de depuración para diagnóstico

4. **Estructura de himnos**
   - ✅ Corregido: Parsing de archivos JSON con estructura "sections"
   - ✅ Mejorado: Conversión automática a formato de estrofas
   - ✅ Agregado: Extracción correcta de números de himnos

## Uso

### Modo Biblia:
1. Selecciona una versión de la Biblia del dropdown
2. Escribe el nombre del libro en el campo de búsqueda
3. Selecciona el libro de las sugerencias que aparecen
4. Haz clic en el número del capítulo deseado
5. Haz clic en el número del versículo para mostrarlo en proyección

### Modo Himnario:
1. Escribe el número o título del himno en el campo de búsqueda
2. Selecciona el himno de la lista que aparece
3. Haz clic en una estrofa para mostrarla en proyección
4. Usa el botón "Play" para reproducir el audio del himno

### Navegación:
- Botones "Anterior" y "Siguiente" para navegar entre versículos/estrofas
- Botón "Abrir Ventana de Proyección" para abrir la ventana de proyección

## Archivos Principales

- `index.html` - Interfaz principal de control
- `proyector.html` - Ventana de proyección
- `js/main.js` - Lógica principal de la aplicación
- `js/dataManager.js` - Manejo de datos (Biblia e himnos)
- `css/style.css` - Estilos de la interfaz

## Estructura de Datos

### Biblias:
- Formato: XML
- Ubicación: `assets/biblias/`
- Archivo de configuración: `assets/biblias/biblias-disponibles.json`

### Himnos:
- Formato: JSON
- Ubicación: `assets/himnos/letra/`
- Audio: `assets/himnos/musica/cantado/` y `assets/himnos/musica/instrumental/`

## Testing

Para verificar que todo funciona correctamente, abre `test.html` en el navegador y ejecuta las pruebas de carga de datos.

## Notas Técnicas

- La aplicación usa módulos ES6 para organización del código
- BroadcastChannel para comunicación entre ventanas
- Parsing robusto de XML para diferentes formatos de Biblia
- Conversión automática de estructuras JSON de himnos
- Interfaz responsive con tema oscuro

## Requisitos

- Navegador moderno con soporte para ES6 modules
- Servidor web local para desarrollo (debido a CORS)
- Archivos de audio en formato MP3 para himnos

## Control Remoto desde Celular

### Opción 1: Acceso Web Local (Recomendado)

Para controlar el proyector desde tu celular:

1. **Configurar servidor web local:**
   ```bash
   # Usando Python (si tienes Python instalado)
   python -m http.server 8080
   
   # O usando Node.js (si tienes Node.js instalado)
   npx http-server -p 8080
   ```

2. **Encontrar la IP de tu computadora:**
   - En Windows: `ipconfig` en CMD
   - En Mac/Linux: `ifconfig` o `ip addr` en terminal
   - Busca la IP local (ej: 192.168.1.100)

3. **Acceder desde el celular:**
   - Conecta tu celular a la misma red WiFi
   - Abre el navegador en tu celular
   - Ve a: `http://[IP-DE-TU-PC]:8080`
   - Ejemplo: `http://192.168.1.100:8080`

4. **Usar el panel de control:**
   - El panel de control funcionará igual que en la PC
   - Puedes buscar himnos, versículos bíblicos y controlar la proyección
   - La ventana de proyección seguirá abierta en la PC

### Opción 2: Aplicación Móvil Personalizada

Para una experiencia más optimizada, podrías crear una aplicación móvil que se conecte al sistema:

1. **API REST simple** - Crear endpoints para:
   - Buscar himnos
   - Buscar versículos bíblicos
   - Enviar contenido al proyector
   - Controlar navegación

2. **Aplicación móvil** - Usando:
   - React Native
   - Flutter
   - PWA (Progressive Web App)

### Opción 3: Control por Bluetooth/WiFi Direct

Para control sin red WiFi:
- Usar WebRTC para conexión directa
- Implementar servidor WebSocket
- Crear app móvil con conexión directa

## Configuración de Red

### Requisitos:
- PC y celular en la misma red WiFi
- Firewall configurado para permitir conexiones al puerto
- Navegador moderno en el celular

### Solución de Problemas:
- Si no funciona, verifica que ambos dispositivos estén en la misma red
- Asegúrate de que el firewall no bloquee las conexiones
- Prueba con diferentes puertos si el 8080 está ocupado

## Seguridad

- Solo usar en redes confiables
- Considerar agregar autenticación básica
- Limitar acceso solo a dispositivos autorizados 