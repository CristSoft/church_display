// 1. Conectarse al servidor SocketIO
const socket = io();
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');
const contadorSeccion = document.getElementById('contador-seccion');
const indicadorEstrofa = document.getElementById('indicador-estrofa');

// Verificar que los elementos existen
console.log('🔍 Elementos del proyector:', {
    videoBg: !!videoBg,
    textoPrincipal: !!textoPrincipal,
    referencia: !!referencia,
    contadorSeccion: !!contadorSeccion,
    indicadorEstrofa: !!indicadorEstrofa
});

// Elemento de audio para reproducir himnos
let audioElement = null;

// 2. Eventos de conexión
socket.on('connect', () => {
    console.log('✅ Proyector conectado al servidor SocketIO - ID:', socket.id);
    // Enviar relación de aspecto
    enviarRelacionAspecto();
    
    // Solicitar configuración inicial
    console.log('[DEBUG] Solicitando configuración inicial...');
    socket.emit('get_config');
});

socket.on('disconnect', () => {
    console.log('❌ Proyector desconectado del servidor SocketIO');
});

// Agregar logging para todos los eventos recibidos
socket.onAny((eventName, ...args) => {
    console.log('📥 Evento recibido:', eventName, args);
});

// 3. Escuchar mensajes del panel de control
socket.on('update_text', (data) => {
    console.log('📥 Recibido update_text:', data);
    
    // Guardar el último himno data para que la configuración pueda acceder a él
    if (data.himnoData) {
        window.ultimoHimnoData = data.himnoData;
    }
    
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
            // Aplicar clase de versículo bíblico para usar la misma fuente
            textoPrincipal.classList.add('versiculo-biblia');
            
            // Ocultar título del himno en modo bíblico
            const tituloHimnoElement = document.getElementById('titulo-himno-proyector');
            if (tituloHimnoElement) {
                tituloHimnoElement.style.display = 'none';
            }
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
                // Refuerzo: ocultar SIEMPRE antes de mostrar
                contadorSeccion.style.display = 'none';
                contadorSeccion.classList.remove('visible');
                indicadorEstrofa.style.display = 'none';
                indicadorEstrofa.classList.remove('visible');
                // Manejar indicadores de himno (incluye título del himno)
                mostrarIndicadoresHimno(data.himnoData);
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
                
                // Ocultar título del himno en modo versículo
                const tituloHimnoElement = document.getElementById('titulo-himno-proyector');
                if (tituloHimnoElement) {
                    tituloHimnoElement.style.display = 'none';
                }
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
    console.log('🔍 Tipo de data:', typeof data);
    console.log('🔍 Data.config existe:', !!data.config);
    console.log('🔍 Data completa:', JSON.stringify(data));
    
    // Verificar que los elementos existen antes de procesar
    if (!textoPrincipal) {
        console.error('❌ Elemento textoPrincipal no encontrado');
        return;
    }
    if (!referencia) {
        console.error('❌ Elemento referencia no encontrado');
        return;
    }
    
    // --- NUEVO: Unificar acceso a config ---
    const config = data.config || data;
    
    console.log('[DEBUG] Configuración recibida en proyector:', config);
    console.log('[DEBUG] config.fontsize:', config.fontsize);
    console.log('[DEBUG] config.fontsizeHimnario:', config.fontsizeHimnario);
    
    // Guardar configuración globalmente para que mostrarIndicadoresHimno pueda acceder a ella
    window.configActual = {
        showIndicadorVerso: config.showIndicadorVerso || false,
        showNombreHimno: config.showNombreHimno || false,
        showSeccionActualTotal: config.showSeccionActualTotal || false,
        indicadorVersoPct: config.indicadorVersoPct || 2.5,
        nombreHimnoPct: config.nombreHimnoPct || 2.3,
        seccionActualTotalPct: config.seccionActualTotalPct || 2.5
    };
    
    console.log('[DEBUG] Configuración guardada en window.configActual:', window.configActual);
    
    // --- DETECCIÓN DE MODO MÁS EXPLÍCITA ---
    const esModoHimnario = typeof config.showIndicadorVerso !== 'undefined' || 
                          typeof config.showNombreHimno !== 'undefined' || 
                          typeof config.showSeccionActualTotal !== 'undefined';
    
    const esModoBiblia = !esModoHimnario && (config.fontsize || config.soloReferencia !== undefined);
    
    console.log('[DEBUG] Detección de modo:', { esModoHimnario, esModoBiblia, config });
    
    // --- MODO HIMNARIO ---
    if (esModoHimnario) {
        console.log('[DEBUG] Aplicando configuración de modo HIMNARIO');
        console.log('[DEBUG] config.fontsize recibido:', config.fontsize);
        console.log('[DEBUG] config.fontsizeHimnario recibido:', config.fontsizeHimnario);
        console.log('[DEBUG] Elemento textoPrincipal:', textoPrincipal);
        console.log('[DEBUG] FontSize actual antes de aplicar:', textoPrincipal.style.fontSize);
        
        // Tamaño texto principal
        if (config.fontsize) {
            console.log('[DEBUG] Aplicando fontsize al texto principal:', config.fontsize + 'vw');
            textoPrincipal.style.setProperty('--js-font-size', config.fontsize + 'vw');
            textoPrincipal.style.fontSize = config.fontsize + 'vw';
            console.log('[DEBUG] FontSize después de aplicar:', textoPrincipal.style.fontSize);
        } else {
            console.log('[DEBUG] No se recibió fontsize en configuración de himnario');
        }
        
        // Crear elemento de título del himno si no existe
        let tituloHimnoElement = document.getElementById('titulo-himno-proyector');
        if (!tituloHimnoElement) {
            tituloHimnoElement = document.createElement('div');
            tituloHimnoElement.id = 'titulo-himno-proyector';
            tituloHimnoElement.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                font-size: 2.3vw;
                font-weight: bold;
                color: #fff;
                text-shadow: 0 2px 8px #000;
                z-index: 10;
                max-width: 40%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            `;
            document.getElementById('contenido').appendChild(tituloHimnoElement);
        }
        
        // Aplicar tamaños de fuente
        if (config.nombreHimnoPct !== undefined) {
            tituloHimnoElement.style.fontSize = config.nombreHimnoPct + 'vw';
        }
        
        if (config.indicadorVersoPct !== undefined) {
            indicadorEstrofa.style.fontSize = config.indicadorVersoPct + 'vw';
        }
        
        if (config.seccionActualTotalPct !== undefined) {
            contadorSeccion.style.fontSize = config.seccionActualTotalPct + 'vw';
        }
        
        // Aplicar configuración de visibilidad SOLO si hay un himno activo
        if (window.ultimoHimnoData) {
            console.log('[DEBUG] Reaplicando configuración a indicadores existentes');
            mostrarIndicadoresHimno(window.ultimoHimnoData);
        }
        
        return;
    }
    
    // --- FIN MODO HIMNARIO ---
    // --- LÓGICA EXISTENTE PARA MODO BÍBLICO ---
    if (esModoBiblia) {
        console.log('[DEBUG] Aplicando configuración de modo BÍBLICO');
        console.log('[DEBUG] config.fontsize recibido:', config.fontsize);
        console.log('[DEBUG] config.fontsizeBiblia recibido:', config.fontsizeBiblia);
        console.log('[DEBUG] Elemento textoPrincipal:', textoPrincipal);
        console.log('[DEBUG] FontSize actual antes de aplicar:', textoPrincipal.style.fontSize);
        
        if (config.fontsize) {
            const fontSize = config.fontsize;
            console.log('[DEBUG] Aplicando fontsize al texto principal (modo bíblico):', fontSize + 'vw');
            
            // Usar CSS custom properties para mayor compatibilidad
            textoPrincipal.style.setProperty('--js-font-size', fontSize + 'vw');
            textoPrincipal.style.setProperty('--override-font-size', fontSize + 'vw');
            textoPrincipal.classList.add('override-font-size');
            
            const refFontSize = (fontSize * 0.7);
            referencia.style.setProperty('--override-ref-font-size', refFontSize + 'vw');
            referencia.classList.add('override-font-size');
            
            // Aplicar también directamente para compatibilidad
            textoPrincipal.style.fontSize = fontSize + 'vw';
            referencia.style.fontSize = refFontSize + 'vw';
            
            console.log('[DEBUG] FontSize después de aplicar:', textoPrincipal.style.fontSize);
            console.log('[DEBUG] Referencia fontSize después de aplicar:', referencia.style.fontSize);
        } else {
            console.log('[DEBUG] No se recibió fontsize en configuración de biblia');
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
 * @param {Object} himnoData - Datos del himno { esTitulo, numero, titulo, verse, estrofaIndex, totalEstrofas, seccionActual, totalSecciones }
 */
function mostrarIndicadoresHimno(himnoData) {
    console.log('[DEBUG] mostrarIndicadoresHimno - himnoData:', himnoData);
    
    // Obtener la configuración actual
    const configActual = window.configActual || {
        showIndicadorVerso: false,
        showSeccionActualTotal: false,
        showNombreHimno: false
    };
    
    console.log('[DEBUG] Configuración actual:', configActual);
    
    // Manejar título del himno (esquina superior izquierda)
    let tituloHimnoElement = document.getElementById('titulo-himno-proyector');
    if (tituloHimnoElement) {
        if (configActual.showNombreHimno && himnoData && !himnoData.esTitulo) {
            tituloHimnoElement.textContent = `${himnoData.numero} - ${himnoData.titulo}`;
            tituloHimnoElement.style.display = 'block';
            console.log('[DEBUG] Título del himno mostrado (config habilitada)');
        } else {
            tituloHimnoElement.style.display = 'none';
            console.log('[DEBUG] Título del himno oculto (config deshabilitada o es título)');
        }
    }
    
    // Refuerzo: ocultar siempre el indicador en el título o en la sección 0
    if (himnoData.esTitulo || himnoData.estrofaIndex === 0 || himnoData.seccionActual === 0) {
        textoPrincipal.classList.add('titulo-himno');
        // Mostrar el mismo texto que en la lista (con '|')
        const numeroSinCeros = String(parseInt(himnoData.numero, 10));
        textoPrincipal.innerHTML = `${numeroSinCeros} | ${himnoData.titulo}`;
        // Ocultar indicadores SIEMPRE en el título
        contadorSeccion.style.display = 'none';
        contadorSeccion.classList.remove('visible');
        indicadorEstrofa.style.display = 'none';
        indicadorEstrofa.classList.remove('visible');
        return; // Salir de la función para evitar mostrar el indicador
    }
    
    // Es una estrofa - mostrar indicadores solo si estrofaIndex >= 1 Y la configuración lo permite
    textoPrincipal.classList.remove('titulo-himno');
    
    // Mostrar contador de sección SOLO si está habilitado en la configuración
    if (himnoData.seccionActual !== undefined && himnoData.totalSecciones !== undefined) {
        contadorSeccion.textContent = `${himnoData.seccionActual}/${himnoData.totalSecciones}`;
        if (configActual.showSeccionActualTotal) {
            contadorSeccion.style.display = '';
            contadorSeccion.classList.add('visible');
            console.log('[DEBUG] Mostrando contadorSeccion (config habilitada)');
        } else {
            contadorSeccion.style.display = 'none';
            contadorSeccion.classList.remove('visible');
            console.log('[DEBUG] Ocultando contadorSeccion (config deshabilitada)');
        }
    } else {
        contadorSeccion.style.display = 'none';
        contadorSeccion.classList.remove('visible');
    }
    
    // Indicador de estrofa/verse/coro solo si estrofaIndex >= 1 Y la configuración lo permite
    let versoText = '';
    const totalVerses = himnoData.verses ? parseInt(himnoData.verses, 10) : undefined;
    if (himnoData.estrofaIndex >= 1) {
        if (typeof himnoData.verse === 'string' && himnoData.verse.toLowerCase().startsWith('coro')) {
            // Si es "coro" o "coro x"
            let numCoro = 1;
            const match = himnoData.verse.match(/coro\s*(\d+)?/i);
            if (match && match[1]) {
                numCoro = parseInt(match[1], 10);
            }
            versoText = `Coro ${numCoro} de ${totalVerses}`;
        } else if (typeof himnoData.verse !== 'undefined' && totalVerses && himnoData.verse !== null && himnoData.verse !== '') {
            versoText = `Verso ${himnoData.verse} de ${totalVerses}`;
        } else {
            versoText = '';
        }
    }
    
    console.log('[DEBUG] versoText calculado:', versoText);
    console.log('[DEBUG] showIndicadorVerso config:', configActual.showIndicadorVerso);
    
    if (versoText && configActual.showIndicadorVerso) {
        indicadorEstrofa.textContent = versoText;
        indicadorEstrofa.style.display = '';
        indicadorEstrofa.classList.add('visible');
        console.log('[DEBUG] Mostrando indicadorEstrofa (config habilitada):', versoText);
    } else {
        indicadorEstrofa.style.display = 'none';
        indicadorEstrofa.classList.remove('visible');
        console.log('[DEBUG] Ocultando indicadorEstrofa (config deshabilitada o sin texto)');
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

// Función para enviar la relación de aspecto al panel de control
function enviarRelacionAspecto() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    socket.emit('aspect_ratio', { width, height, aspect });
    console.log('📤 Enviando relación de aspecto:', { width, height, aspect });
}

// Función para debugging de configuración
window.debugConfigProyector = function() {
    console.log('[DEBUG] === DEBUG CONFIGURACIÓN PROYECTOR ===');
    console.log('[DEBUG] Configuración actual:', window.configActual);
    console.log('[DEBUG] Último himno data:', window.ultimoHimnoData);
    
    // Verificar elementos del DOM
    const tituloHimnoElement = document.getElementById('titulo-himno-proyector');
    console.log('[DEBUG] Elementos del DOM:', {
        tituloHimnoElement: !!tituloHimnoElement,
        tituloHimnoDisplay: tituloHimnoElement ? tituloHimnoElement.style.display : 'N/A',
        indicadorEstrofa: !!indicadorEstrofa,
        indicadorEstrofaDisplay: indicadorEstrofa ? indicadorEstrofa.style.display : 'N/A',
        contadorSeccion: !!contadorSeccion,
        contadorSeccionDisplay: contadorSeccion ? contadorSeccion.style.display : 'N/A'
    });
    
    return {
        configActual: window.configActual,
        ultimoHimnoData: window.ultimoHimnoData,
        elementos: {
            tituloHimnoElement: !!tituloHimnoElement,
            indicadorEstrofa: !!indicadorEstrofa,
            contadorSeccion: !!contadorSeccion
        }
    };
};

// Función para forzar aplicación de configuración
window.forzarConfigProyector = function() {
    console.log('[DEBUG] === FORZANDO CONFIGURACIÓN PROYECTOR ===');
    
    if (!window.configActual) {
        console.log('[DEBUG] No hay configuración disponible');
        return;
    }
    
    // Aplicar configuración al título del himno
    const tituloHimnoElement = document.getElementById('titulo-himno-proyector');
    if (tituloHimnoElement) {
        if (window.configActual.showNombreHimno && window.ultimoHimnoData) {
            tituloHimnoElement.style.display = 'block';
            tituloHimnoElement.textContent = `${window.ultimoHimnoData.numero} - ${window.ultimoHimnoData.titulo}`;
            console.log('[DEBUG] Título del himno mostrado');
        } else {
            tituloHimnoElement.style.display = 'none';
            console.log('[DEBUG] Título del himno oculto');
        }
    }
    
    // Reaplicar configuración a los indicadores
    if (window.ultimoHimnoData) {
        console.log('[DEBUG] Reaplicando configuración a indicadores');
        mostrarIndicadoresHimno(window.ultimoHimnoData);
    }
    
    return {
        configAplicada: window.configActual,
        himnoActivo: !!window.ultimoHimnoData
    };
};

// Enviar al cargar
window.addEventListener('DOMContentLoaded', enviarRelacionAspecto);
// Enviar al cambiar tamaño
window.addEventListener('resize', enviarRelacionAspecto);

document.addEventListener('click', function() {
    socket.emit('proyectorClick');
});

