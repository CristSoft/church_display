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
        // Determinar el modo y aplicar clases CSS correspondientes
        const contenido = document.getElementById('contenido');
        
        if (data.soloReferencia) {
            // Modo solo referencia (versículo)
            contenido.classList.remove('modo-himno');
            contenido.classList.add('modo-versiculo');
            
            textoPrincipal.innerHTML = data.texto;
            referencia.style.display = 'none';
            // Ocultar indicadores de himno
            contadorSeccion.style.display = 'none';
            indicadorEstrofa.style.display = 'none';
            // Quitar clase de versículo bíblico
            textoPrincipal.classList.remove('versiculo-biblia');
        } else {
            if (data.himnoData) {
                // Modo himno
                contenido.classList.remove('modo-versiculo');
                contenido.classList.add('modo-himno');
                
                textoPrincipal.innerHTML = data.texto;
                referencia.textContent = `Himno ${data.himnoData.numero} - ${data.himnoData.titulo}`;
                // Quitar clase de versículo bíblico si es himno
                textoPrincipal.classList.remove('versiculo-biblia');
                referencia.style.display = 'none';
                
                // Manejar indicadores de himno
                mostrarIndicadoresHimno(data.himnoData);
                // Aseguramos que el indicador de versículo se oculte si no corresponde
                if (!data.himnoData.verso) {
                    indicadorEstrofa.style.display = 'none';
                    indicadorEstrofa.classList.remove('visible');
                }
            } else {
                // Modo versículo normal
                contenido.classList.remove('modo-himno');
                contenido.classList.add('modo-versiculo');
                
                textoPrincipal.innerHTML = data.texto;
                referencia.textContent = data.ref;
                // Aplicar clase de versículo bíblico si es modo Biblia
                textoPrincipal.classList.add('versiculo-biblia');
                // Si no hay texto ni referencia, ocultar la barra
                if (!data.texto && !data.ref) {
                    referencia.style.display = 'none';
                } else {
                    referencia.style.display = '';
                }
                
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
        try {
            console.log('[VIDEO] Intentando cambiar video de fondo a:', data.videoSrc);
            console.log('[VIDEO] Estado actual del video:', {
                currentSrc: videoBg.currentSrc,
                readyState: videoBg.readyState,
                networkState: videoBg.networkState,
                paused: videoBg.paused,
                ended: videoBg.ended
            });
            
            // Pausar el video actual antes de cambiar
            if (!videoBg.paused) {
                videoBg.pause();
            }
            
            // Eliminar el <source> actual
            while (videoBg.firstChild) {
                console.log('[VIDEO] Eliminando source anterior:', videoBg.firstChild);
                videoBg.removeChild(videoBg.firstChild);
            }
            
            // Crear un nuevo <source> con el src y tipo adecuado
            const newSource = document.createElement('source');
            newSource.src = data.videoSrc;
            // Detectar tipo MIME por extensión
            if (data.videoSrc.endsWith('.mp4')) {
                newSource.type = 'video/mp4';
            } else if (data.videoSrc.endsWith('.mkv')) {
                newSource.type = 'video/x-matroska';
            } else {
                newSource.type = '';
            }
            console.log('[VIDEO] Nuevo source creado:', newSource);
            videoBg.appendChild(newSource);
            
            // Función para cargar y reproducir el video
            const loadAndPlayVideo = () => {
                console.log('[VIDEO] Llamando a videoBg.load()');
                videoBg.load();
                
                // Esperar a que el video esté listo antes de reproducir
                const playVideo = () => {
                    console.log('[VIDEO] Intentando reproducir video...');
                    console.log('[VIDEO] Estado antes de play:', {
                        readyState: videoBg.readyState,
                        networkState: videoBg.networkState,
                        paused: videoBg.paused
                    });
                    
                    videoBg.play().then(() => {
                        console.log('[VIDEO] ✅ Video reproducido exitosamente');
                    }).catch(e => {
                        console.log('[VIDEO] ❌ No se pudo hacer play automáticamente:', e);
                        // Intentar reproducir después de un delay
                        setTimeout(() => {
                            videoBg.play().catch(e2 => {
                                console.log('[VIDEO] ❌ Segundo intento falló:', e2);
                            });
                        }, 1000);
                    });
                };
                
                // Si el video ya está listo, reproducir inmediatamente
                if (videoBg.readyState >= 2) {
                    playVideo();
                } else {
                    // Esperar a que el video esté listo
                    videoBg.addEventListener('canplay', playVideo, { once: true });
                    videoBg.addEventListener('error', (e) => {
                        console.error('[VIDEO] ❌ Error al cargar video:', e);
                    }, { once: true });
                }
            };
            
            // Ejecutar la carga y reproducción
            loadAndPlayVideo();
            
            setTimeout(() => {
                console.log('[VIDEO] Estado final del video:', {
                    currentSrc: videoBg.currentSrc,
                    readyState: videoBg.readyState,
                    networkState: videoBg.networkState,
                    paused: videoBg.paused,
                    ended: videoBg.ended
                });
            }, 1000);
            
        } catch (err) {
            console.error('[VIDEO] Error al cambiar el video de fondo:', err);
        }
    } else {
        console.warn('[VIDEO] No se recibió data.videoSrc en change_mode');
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

socket.on('detenerAudio', (data) => {
    console.log('📥 Recibido detenerAudio:', data);
    detenerAudioHimno(data.fadeout, data.duracion);
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
        
        // Mostrar indicador de estrofa SOLO si corresponde a himno (puede ser útil para "Coro" o versos)
        if (himnoData.verso === 'coro') {
            indicadorEstrofa.textContent = 'Coro';
            indicadorEstrofa.style.display = '';
            indicadorEstrofa.classList.add('visible');
        } else if (himnoData.verso) {
            indicadorEstrofa.textContent = `Verso ${himnoData.verso}`;
            indicadorEstrofa.style.display = '';
            indicadorEstrofa.classList.add('visible');
        } else {
            // Si no hay verso, ocultar
            indicadorEstrofa.style.display = 'none';
            indicadorEstrofa.classList.remove('visible');
        }
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
                console.error('🔍 Código de error:', audioElement.error ? audioElement.error.code : 'N/A');
                console.error('🔍 Mensaje de error:', audioElement.error ? audioElement.error.message : 'N/A');
                
                // Mostrar mensaje de error más detallado
                let errorMsg = 'Error al reproducir audio';
                if (audioElement.error) {
                    switch(audioElement.error.code) {
                        case 1:
                            errorMsg = 'Error: Archivo de audio no encontrado';
                            break;
                        case 2:
                            errorMsg = 'Error: Red no disponible';
                            break;
                        case 3:
                            errorMsg = 'Error: Formato de audio no soportado';
                            break;
                        case 4:
                            errorMsg = 'Error: Archivo de audio corrupto';
                            break;
                        default:
                            errorMsg = `Error: ${audioElement.error.message}`;
                    }
                }
                textoPrincipal.innerHTML = `${errorMsg}<br><small>${ruta}</small>`;
            });
            
            audioElement.addEventListener('ended', () => {
                console.log('⏹️ Audio terminado');
                // Notificar al panel de control que el audio terminó
                socket.emit('audioTerminado', {
                    himno: himnoActivo ? himnoActivo.numero : 'desconocido'
                });
            });
            
            audioElement.addEventListener('load', () => {
                console.log('📦 Audio cargado completamente');
            });
            
            audioElement.addEventListener('canplaythrough', () => {
                console.log('🎯 Audio puede reproducirse completamente');
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
        
        // Verificar si el archivo existe antes de intentar reproducir
        fetch(ruta, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    console.log('✅ Archivo de audio encontrado, intentando reproducir...');
                    
                    // Función para intentar reproducir el audio
                    const attemptPlay = () => {
                        const playPromise = audioElement.play();
                        
                        if (playPromise !== undefined) {
                            playPromise
                                .then(() => {
                                    console.log('✅ Audio iniciado correctamente');
                                })
                                .catch(error => {
                                    console.error('❌ Error al iniciar audio:', error);
                                    console.error('🔍 Tipo de error:', error.name);
                                    console.error('🔍 Mensaje:', error.message);
                                    
                                    // Si el error es por permisos de audio, intentar habilitarlo
                                    if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
                                        console.log('🔄 Intentando habilitar contexto de audio...');
                                        
                                        // Intentar habilitar el contexto de audio
                                        if (window.enableAudioContext) {
                                            window.enableAudioContext()
                                                .then(() => {
                                                    console.log('✅ Contexto de audio habilitado, reintentando reproducción...');
                                                    // Reintentar reproducción después de un breve delay
                                                    setTimeout(() => {
                                                        attemptPlay();
                                                    }, 100);
                                                })
                                                .catch(enableError => {
                                                    console.error('❌ No se pudo habilitar el contexto de audio:', enableError);
                                                    textoPrincipal.innerHTML = `Error: Permisos de audio denegados.<br><small>Haga clic en la página para habilitar audio.</small><br><small>${ruta}</small>`;
                                                });
                                        } else {
                                            textoPrincipal.innerHTML = `Error: Permisos de audio denegados.<br><small>Haga clic en la página para habilitar audio.</small><br><small>${ruta}</small>`;
                                        }
                                    } else {
                                        // Mostrar mensaje de error específico
                                        let errorMsg = 'No se pudo reproducir el audio';
                                        if (error.name === 'NotAllowedError') {
                                            errorMsg = 'Error: Permisos de audio denegados. Haga clic en la página para habilitar audio.';
                                        } else if (error.name === 'NotSupportedError') {
                                            errorMsg = 'Error: Formato de audio no soportado';
                                        }
                                        
                                        textoPrincipal.innerHTML = `${errorMsg}<br><small>${ruta}</small>`;
                                    }
                                });
                        }
                    };
                    
                    // Intentar reproducir
                    attemptPlay();
                    
                } else {
                    console.error('❌ Archivo de audio no encontrado:', ruta);
                    textoPrincipal.innerHTML = `Error: Archivo de audio no encontrado<br><small>${ruta}</small>`;
                }
            })
            .catch(error => {
                console.error('❌ Error al verificar archivo de audio:', error);
                textoPrincipal.innerHTML = `Error: No se pudo acceder al archivo de audio<br><small>${ruta}</small>`;
            });
        
    } catch (error) {
        console.error('❌ Error en reproducirAudioHimno:', error);
        textoPrincipal.innerHTML = `Error: ${error.message}<br><small>${ruta}</small>`;
    }
}

/**
 * Detiene el audio de un himno con fadeout opcional
 * @param {boolean} fadeout - Si debe hacer fadeout antes de detener
 * @param {number} duracion - Duración del fadeout en milisegundos
 */
function detenerAudioHimno(fadeout = true, duracion = 2000) {
    try {
        console.log('⏹️ Deteniendo audio:', { fadeout, duracion });
        
        if (!audioElement) {
            console.log('ℹ️ No hay audio reproduciéndose');
            return;
        }
        
        if (audioElement.paused) {
            console.log('ℹ️ Audio ya está pausado');
            return;
        }
        
        if (fadeout) {
            // Hacer fadeout gradual
            console.log('🔉 Iniciando fadeout...');
            
            const volumenInicial = audioElement.volume;
            const pasos = 20; // Número de pasos para el fadeout
            const volumenPorPaso = volumenInicial / pasos;
            const intervalo = duracion / pasos;
            
            let pasoActual = 0;
            
            const fadeoutInterval = setInterval(() => {
                pasoActual++;
                const nuevoVolumen = Math.max(0, volumenInicial - (volumenPorPaso * pasoActual));
                
                audioElement.volume = nuevoVolumen;
                console.log(`🔉 Fadeout paso ${pasoActual}/${pasos}, volumen: ${nuevoVolumen.toFixed(2)}`);
                
                if (pasoActual >= pasos || nuevoVolumen <= 0) {
                    clearInterval(fadeoutInterval);
                    
                    // Detener completamente el audio
                    audioElement.pause();
                    audioElement.currentTime = 0;
                    audioElement.volume = 1.0; // Restaurar volumen para futuras reproducciones
                    
                    console.log('⏹️ Audio detenido completamente después del fadeout');
                    
                    // Notificar al panel de control que el audio terminó
                    socket.emit('audioTerminado', {
                        himno: 'detenido_por_usuario'
                    });
                }
            }, intervalo);
            
        } else {
            // Detener inmediatamente
            audioElement.pause();
            audioElement.currentTime = 0;
            console.log('⏹️ Audio detenido inmediatamente');
            
            // Notificar al panel de control que el audio terminó
            socket.emit('audioTerminado', {
                himno: 'detenido_por_usuario'
            });
        }
        
    } catch (error) {
        console.error('❌ Error en detenerAudioHimno:', error);
    }
}