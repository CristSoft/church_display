// 1. Conectarse al servidor SocketIO
const socket = io();
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');
const contadorSeccion = document.getElementById('contador-seccion');
const indicadorEstrofa = document.getElementById('indicador-estrofa');

// Elemento de audio para reproducir himnos
let audioElement = null;

// 2. Eventos de conexión
socket.on('connect', () => {
    console.log('✅ Proyector conectado al servidor SocketIO');
});

socket.on('disconnect', () => {
    console.log('❌ Proyector desconectado del servidor SocketIO');
});

// 3. Escuchar mensajes del panel de control
socket.on('update_text', (data) => {
    console.log('📥 Recibido update_text:', data);
    
    // Aplicar transición suave
    textoPrincipal.classList.add('fade-out');
    referencia.classList.add('fade-out');
    contadorSeccion.classList.remove('visible');
    indicadorEstrofa.classList.remove('visible');
    
    setTimeout(() => {
        if (data.soloReferencia) {
            textoPrincipal.innerHTML = data.texto;
            referencia.style.display = 'none';
            // Ocultar indicadores de himno
            contadorSeccion.style.display = 'none';
            indicadorEstrofa.style.display = 'none';
            // Quitar clase de versículo bíblico
            textoPrincipal.classList.remove('versiculo-biblia');
        } else {
            textoPrincipal.innerHTML = data.texto;
            // Cambiar referencia a 'Himno xxx - [Nombre del himno]'
            if (data.himnoData) {
                referencia.textContent = `Himno ${data.himnoData.numero} - ${data.himnoData.titulo}`;
                // Quitar clase de versículo bíblico si es himno
                textoPrincipal.classList.remove('versiculo-biblia');
            } else {
                referencia.textContent = data.ref;
                // Aplicar clase de versículo bíblico si es modo Biblia
                textoPrincipal.classList.add('versiculo-biblia');
            }
            referencia.style.display = '';
            
            // Manejar indicadores de himno
            if (data.himnoData) {
                mostrarIndicadoresHimno(data.himnoData);
            } else {
                // Ocultar indicadores si no es himno
                contadorSeccion.style.display = 'none';
                indicadorEstrofa.style.display = 'none';
            }
        }
        
        // Remover clases de fade-out para mostrar el nuevo texto
        textoPrincipal.classList.remove('fade-out');
        referencia.classList.remove('fade-out');
    }, 150); // La mitad del tiempo de transición CSS (300ms / 2)
});

socket.on('change_mode', (data) => {
    console.log('📥 Recibido change_mode:', data);
    if (data.videoSrc) {
        videoBg.src = data.videoSrc;
    }
});

socket.on('config', (data) => {
    console.log('📥 Recibido config:', data);
    if (data.config) {
        // Cambiar tamaño de fuente según modo
        textoPrincipal.style.fontSize = (data.config.fontsize || 5) + 'vw';
        
        // Solo cambiar tamaño de referencia en modo Biblia (no en himnos)
        if (data.config.soloReferencia !== undefined) {
            // Si es modo Biblia (soloReferencia puede ser true o false)
            if (data.config.soloReferencia !== null) {
                referencia.style.fontSize = ((data.config.fontsize || 5) * 0.7) + 'vw';
            }
            // Si es modo Himno, mantener tamaño original de referencia
        } else {
            // Configuración inicial o cambio de fuente general
            referencia.style.fontSize = ((data.config.fontsize || 5) * 0.7) + 'vw';
        }
    }
});

socket.on('reproducirAudio', (data) => {
    console.log('📥 Recibido reproducirAudio:', data);
    reproducirAudioHimno(data.ruta, data.himno, data.titulo);
});

/**
 * Muestra los indicadores específicos para himnos
 * @param {Object} himnoData - Datos del himno { esTitulo, numero, titulo, verso, estrofaIndex, totalEstrofas, seccionActual, totalSecciones }
 */
function mostrarIndicadoresHimno(himnoData) {
    if (himnoData.esTitulo) {
        // Es el título del himno - mostrar formato especial
        textoPrincipal.classList.add('titulo-himno');
        textoPrincipal.innerHTML = `${himnoData.numero} | ${himnoData.titulo}`;
        
        // Ocultar indicadores
        contadorSeccion.style.display = 'none';
        indicadorEstrofa.style.display = 'none';
    } else {
        // Es una estrofa - mostrar indicadores
        textoPrincipal.classList.remove('titulo-himno');
        
        // Mostrar contador de sección
        if (himnoData.seccionActual !== undefined && himnoData.totalSecciones !== undefined) {
            contadorSeccion.textContent = `${himnoData.seccionActual}/${himnoData.totalSecciones}`;
            contadorSeccion.style.display = '';
            contadorSeccion.classList.add('visible');
        } else {
            contadorSeccion.style.display = 'none';
        }
        
        // Mostrar indicador de estrofa
        if (himnoData.verso === 'coro') {
            indicadorEstrofa.textContent = 'Coro';
        } else {
            indicadorEstrofa.textContent = `Verso ${himnoData.verso}`;
        }
        indicadorEstrofa.style.display = '';
        indicadorEstrofa.classList.add('visible');
    }
}

/**
 * Reproduce el audio de un himno
 * @param {string} ruta - Ruta del archivo de audio
 * @param {string} himno - Número del himno
 * @param {string} titulo - Título del himno
 */
function reproducirAudioHimno(ruta, himno, titulo) {
    try {
        console.log('🎵 Reproduciendo audio:', { ruta, himno, titulo });
        
        // Crear elemento de audio si no existe
        if (!audioElement) {
            audioElement = new Audio();
            audioElement.preload = 'auto';
            
            // Eventos del audio
            audioElement.addEventListener('loadstart', () => {
                console.log('🔄 Cargando audio...');
            });
            
            audioElement.addEventListener('canplay', () => {
                console.log('✅ Audio listo para reproducir');
            });
            
            audioElement.addEventListener('play', () => {
                console.log('▶️ Audio reproduciéndose');
            });
            
            audioElement.addEventListener('error', (e) => {
                console.error('❌ Error al reproducir audio:', e);
                console.error('🔍 Detalles del error:', audioElement.error);
            });
            
            audioElement.addEventListener('ended', () => {
                console.log('⏹️ Audio terminado');
            });
        }
        
        // Detener audio anterior si está reproduciéndose
        if (!audioElement.paused) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
        
        // Configurar y reproducir el nuevo audio
        audioElement.src = ruta;
        audioElement.volume = 1.0;
        
        // Intentar reproducir
        const playPromise = audioElement.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('✅ Audio iniciado correctamente');
                })
                .catch(error => {
                    console.error('❌ Error al iniciar audio:', error);
                    // Mostrar mensaje de error en el proyector
                    textoPrincipal.innerHTML = `Error: No se pudo reproducir el audio<br><small>${ruta}</small>`;
                });
        }
        
    } catch (error) {
        console.error('❌ Error en reproducirAudioHimno:', error);
    }
}