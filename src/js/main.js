// Función para detectar el modo actual (debe estar al inicio)
function esModoBiblia() {
  return window.modoActual === 'biblia';
}

console.log('🚀 main.js iniciando...');

// Variables globales
let proyectorWindow = null;
let proyectorPendienteClick = false;
let socket = null; // Esta será global
let bibliaActual = null;
let indiceHimnos = [];
let capituloActivo = null;
let versiculoActivoIndex = -1;
let estrofaActivaIndex = -1;
let libroActivo = null;
let himnoActivo = null;
// Índices de selección para navegación con teclado
let libroSugeridoIndex = -1;
let himnoSugeridoIndex = -1;
// Variables para pantalla completa
let modoPantallaCompleta = false;
let autoFullscreenLandscape = true; // Habilitado por defecto

// --- NUEVO: Variable global para configuración ---
let config = {
  fontsizeBiblia: 5,
  fontsizeHimnario: 5,
  soloReferencia: false,
  autoFullscreen: true
};

// Referencias a elementos del DOM
let elementos = {};

// --- NUEVO: Referencias para la UI mejorada ---
let topBarTitulo = null;
let btnCambiarVista = null;
let vistaPreviaContainer = null;
let vistaPrevia = null;
let vistaProyector = null;
let zonaRetroceder = null;
let zonaAvanzar = null;
let proyectorPreviewContent = null;
let vistaActual = 'lista'; // 'lista' o 'proyector'

// Variable global para saber si está sonando el himno
let himnoSonando = false;
let fadeOutTimeout = null;
// Modo de audio: 'cantado', 'instrumental', 'soloLetra'
let audioMode = 'cantado';

let miniProyectorVideo = null;
let miniProyectorAspect = 16/9; // Valor por defecto
let miniProyectorContainer = null;

console.log('📦 Variables globales inicializadas');

/**
 * Obtiene el valor de una variable CSS
 */
function getCSSVariable(variableName) {
  return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
}

/**
 * Inicializa SocketIO
 */
function inicializarSocketIO() {
  console.log('🔌 Iniciando SocketIO...');
  console.log('🔍 SocketIO disponible:', typeof io !== 'undefined' ? 'Sí' : 'No');
  
  try {
    // Conectar a SocketIO
    console.log('📡 Creando conexión SocketIO...');
    socket = io();
    // Hacer socket global
    window.socket = socket;
    
    console.log('📡 SocketIO creado:', socket);
    console.log('🌐 Socket global asignado:', window.socket);
    
    // Eventos de conexión
    socket.on('connect', () => {
      console.log('✅ Conectado al servidor SocketIO - ID:', socket.id);
      console.log('🌐 URL del servidor:', window.location.hostname + ':' + window.location.port);
      
      // Configurar listeners de memoria cuando se conecte
      setTimeout(() => {
        configurarListenersMemoria();
      }, 500);
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Desconectado del servidor SocketIO');
    });
    
    socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión SocketIO:', error);
      console.error('🔍 Detalles del error:', {
        message: error.message,
        description: error.description,
        context: error.context
      });
    });
    
    // Agregar más eventos para debugging
    socket.on('error', (error) => {
      console.error('❌ Error general de SocketIO:', error);
    });
    
    // Evento para cuando el audio termina naturalmente
    socket.on('audioTerminado', (data) => {
      console.log('📥 Audio terminado naturalmente:', data);
      himnoSonando = false;
      actualizarBotonPlayHimno();
    });
    
    // Evento para recibir cambios de configuración de otros dispositivos
    socket.on('configuracion_actualizada', async (data) => {
      console.log('📥 Configuración actualizada desde otro dispositivo:', data);
      
      // Ignorar si el cambio es propio
      if (data.clientId === CLIENT_ID) {
        console.log('🔄 Ignorando cambio propio');
        return;
      }
      
      // Actualizar configuración local según el tipo
      switch (data.tipo) {
        case 'fontsizeBiblia':
          config.fontsizeBiblia = data.valor;
          // Actualizar controles del panel principal
          const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
          const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
          if (sliderFontsizeBiblia && fontsizeValueBiblia) {
            sliderFontsizeBiblia.value = data.valor;
            fontsizeValueBiblia.textContent = data.valor + 'vw';
          }
          // Actualizar controles del mini proyector
          const miniSliderFontsizeBiblia = document.getElementById('miniSliderFontsizeBiblia');
          const miniFontsizeValueBiblia = document.getElementById('miniFontsizeValueBiblia');
          if (miniSliderFontsizeBiblia && miniFontsizeValueBiblia) {
            const porcentaje = vwAPorcentaje(data.valor);
            miniSliderFontsizeBiblia.value = porcentaje;
            miniFontsizeValueBiblia.textContent = porcentaje + '%';
          }
          break;
          
        case 'soloReferencia':
          config.soloReferencia = data.valor;
          // Actualizar controles del panel principal
          const switchSoloReferencia = document.getElementById('switchSoloReferencia');
          if (switchSoloReferencia) {
            switchSoloReferencia.checked = data.valor;
          }
          // Actualizar controles del mini proyector
          const miniSwitchSoloReferencia = document.getElementById('miniSwitchSoloReferencia');
          if (miniSwitchSoloReferencia) {
            miniSwitchSoloReferencia.checked = data.valor;
          }
          break;
          
        case 'fontsizeHimnario':
          config.fontsizeHimnario = data.valor;
          // Actualizar controles del mini proyector de himnario
          const miniSliderFontsizeHimnario = document.getElementById('miniSliderFontsizeHimnario');
          const miniFontsizeValueHimnario = document.getElementById('miniFontsizeValueHimnario');
          if (miniSliderFontsizeHimnario && miniFontsizeValueHimnario) {
            const porcentaje = vwAPorcentaje(data.valor);
            miniSliderFontsizeHimnario.value = porcentaje;
            miniFontsizeValueHimnario.textContent = porcentaje + '%';
          }
          break;
        // --- NUEVO: Sincronizar controles de himnario ---
        case 'showIndicadorVerso':
          config.showIndicadorVerso = data.valor;
          const checkIndicador = document.getElementById('miniCheckIndicadorVerso');
          if (checkIndicador) {
            checkIndicador.checked = !!data.valor;
            // Actualizar estado visual del accordion
            const cardIndicador = document.getElementById('cardIndicadorVerso');
            const contentIndicador = document.getElementById('contentIndicadorVerso');
            if (cardIndicador && contentIndicador) {
              if (data.valor) {
                cardIndicador.classList.remove('disabled');
              } else {
                cardIndicador.classList.add('disabled');
                contentIndicador.style.display = 'none';
              }
            }
          }
          break;
        case 'indicadorVersoPct':
          config.indicadorVersoPct = data.valor;
          const sliderIndicador = document.getElementById('miniSliderIndicadorVerso');
          const valueIndicador = document.getElementById('miniIndicadorVersoValue');
          if (sliderIndicador && valueIndicador) {
            // Convertir de vw a porcentaje para el slider
            const porcentaje = vwAPorcentaje(data.valor);
            sliderIndicador.value = porcentaje;
            valueIndicador.textContent = porcentaje + '%';
          }
          break;
        case 'showNombreHimno':
          config.showNombreHimno = data.valor;
          const checkNombre = document.getElementById('miniCheckNombreHimno');
          if (checkNombre) {
            checkNombre.checked = !!data.valor;
            // Actualizar estado visual del accordion
            const cardNombre = document.getElementById('cardNombreHimno');
            const contentNombre = document.getElementById('contentNombreHimno');
            if (cardNombre && contentNombre) {
              if (data.valor) {
                cardNombre.classList.remove('disabled');
              } else {
                cardNombre.classList.add('disabled');
                contentNombre.style.display = 'none';
              }
            }
          }
          break;
        case 'nombreHimnoPct':
          config.nombreHimnoPct = data.valor;
          const sliderNombre = document.getElementById('miniSliderNombreHimno');
          const valueNombre = document.getElementById('miniNombreHimnoValue');
          if (sliderNombre && valueNombre) {
            // Convertir de vw a porcentaje para el slider
            const porcentaje = vwAPorcentaje(data.valor);
            sliderNombre.value = porcentaje;
            valueNombre.textContent = porcentaje + '%';
          }
          break;
        case 'showSeccionActualTotal':
          config.showSeccionActualTotal = data.valor;
          const checkSeccion = document.getElementById('miniCheckSeccionActualTotal');
          if (checkSeccion) {
            checkSeccion.checked = !!data.valor;
            // Actualizar estado visual del accordion
            const cardSeccion = document.getElementById('cardSeccionActualTotal');
            const contentSeccion = document.getElementById('contentSeccionActualTotal');
            if (cardSeccion && contentSeccion) {
              if (data.valor) {
                cardSeccion.classList.remove('disabled');
              } else {
                cardSeccion.classList.add('disabled');
                contentSeccion.style.display = 'none';
              }
            }
          }
          break;
        case 'seccionActualTotalPct':
          config.seccionActualTotalPct = data.valor;
          const sliderSeccion = document.getElementById('miniSliderSeccionActualTotal');
          const valueSeccion = document.getElementById('miniSeccionActualTotalValue');
          if (sliderSeccion && valueSeccion) {
            // Convertir de vw a porcentaje para el slider
            const porcentaje = vwAPorcentaje(data.valor);
            sliderSeccion.value = porcentaje;
            valueSeccion.textContent = porcentaje + '%';
          }
          break;
      }
      
      // Guardar configuración
      await guardarConfiguracionCompleta(config);
      
      // Actualizar vista del proyector
      actualizarVistaProyector();
      
      // Enviar configuración al proyector según el modo
      const esBiblia = esModoBiblia();
      if (esBiblia) {
        enviarMensajeProyector('config', {
          fontsize: config.fontsizeBiblia || 5,
          soloReferencia: config.soloReferencia || false
        });
      } else {
        enviarMensajeProyector('config', {
          fontsize: config.fontsizeHimnario || 5,
          showIndicadorVerso: config.showIndicadorVerso || false,
          indicadorVersoPct: config.indicadorVersoPct || 2.5,
          showNombreHimno: config.showNombreHimno || false,
          nombreHimnoPct: config.nombreHimnoPct || 2.3,
          showSeccionActualTotal: config.showSeccionActualTotal || false,
          seccionActualTotalPct: config.seccionActualTotalPct || 2.5
        });
      }
      
      // Actualizar mini proyector si está disponible
      if (typeof window.actualizarMiniProyector === 'function') {
        await window.actualizarMiniProyector();
      }
      
      console.log('✅ Configuración sincronizada desde otro dispositivo');
    });
    
    // Evento para cuando el proyector recibe un click
    socket.on('proyectorClick', () => {
      console.log('Evento proyectorClick recibido en el panel de control');
      proyectorPendienteClick = false;
      const boton = document.getElementById('abrirProyector');
      if (boton) {
        boton.style.display = 'none';
        boton.style.pointerEvents = '';
        boton.style.cursor = '';
      }
    });

    // Handler de proyectorAbierto
    socket.on('proyectorAbierto', () => {
      proyectorPendienteClick = true;
      const boton = document.getElementById('abrirProyector');
      if (boton) {
        boton.classList.add('proyector-abierto');
        boton.classList.remove('proyector-normal');
        boton.style.display = '';
        boton.textContent = 'No olvides hacer click en el proyector';
        boton.style.pointerEvents = 'none';
        boton.style.cursor = 'not-allowed';
      }
      actualizarVisibilidadBotonProyector();
    });
    // Handler de proyectorCerrado
    socket.on('proyectorCerrado', () => {
      proyectorPendienteClick = false;
      const boton = document.getElementById('abrirProyector');
      if (boton) {
        boton.classList.remove('proyector-abierto');
        boton.classList.add('proyector-normal');
        boton.style.display = '';
        boton.textContent = 'Abrir Ventana de Proyección';
        boton.style.pointerEvents = '';
        boton.style.cursor = '';
      }
      actualizarVisibilidadBotonProyector();
    });

    // Estado inicial del proyector
    socket.on('estadoProyector', (data) => {
      const boton = document.getElementById('abrirProyector');
      if (data && typeof data.abierto !== 'undefined' && boton) {
        if (data.abierto) {
          proyectorPendienteClick = true;
          boton.classList.add('proyector-abierto');
          boton.classList.remove('proyector-normal');
          boton.style.display = '';
          boton.textContent = 'No olvides hacer click en el proyector';
          boton.style.pointerEvents = 'none';
          boton.style.cursor = 'not-allowed';
        } else {
          proyectorPendienteClick = false;
          boton.classList.remove('proyector-abierto');
          boton.classList.add('proyector-normal');
          boton.style.display = '';
          boton.textContent = 'Abrir Ventana de Proyección';
          boton.style.pointerEvents = '';
          boton.style.cursor = '';
        }
        actualizarVisibilidadBotonProyector();
      }
    });

    console.log('🔌 SocketIO inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar SocketIO:', error);
  }
}

/**
 * Envía mensaje al proyector
 */
function enviarMensajeProyector(tipo, data) {
  console.log('📤 Intentando enviar mensaje:', { tipo, data });
  console.log('🔌 Estado del socket:', {
    existe: !!socket,
    conectado: socket ? socket.connected : false,
    id: socket ? socket.id : 'N/A'
  });
  
  if (!socket) {
    console.error('❌ SocketIO no inicializado');
    return false;
  }
  
  if (!socket.connected) {
    console.error('❌ SocketIO no conectado');
    return false;
  }
  
  try {
    socket.emit(tipo, data);
    console.log(`✅ Mensaje enviado exitosamente: ${tipo}`, data);
    return true;
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    return false;
  }
}

/**
 * Envía un versículo al proyector
 */
async function enviarVersiculoAlProyector(versiculoIndex) {
  if (!bibliaActual || !libroActivo || capituloActivo === null || versiculoIndex < 0) {
    console.warn('⚠️ No hay versículo válido para enviar');
    return;
  }

  const versiculo = bibliaActual[libroActivo][capituloActivo][versiculoIndex];
  const referencia = `${libroActivo} ${capituloActivo + 1}:${versiculo.verse}`;
  
  // Obtener configuración actualizada
  const config = await obtenerConfiguracion();
  if (config.soloReferencia) {
    enviarMensajeProyector('update_text', {
      texto: referencia,
      ref: '',
      soloReferencia: true
    });
  } else {
    enviarMensajeProyector('update_text', {
      texto: versiculo.text,
      ref: referencia,
      soloReferencia: false
    });
  }
}

/**
 * Envía una estrofa al proyector
 */
function enviarEstrofaAlProyector(estrofaIndex) {
  if (!himnoActivo || estrofaIndex < 0) {
    console.warn('⚠️ No hay estrofa válida para enviar');
    return;
  }

  const estrofa = himnoActivo.estrofas[estrofaIndex];
  const esTitulo = estrofaIndex === 0;
  const tituloLimpio = himnoActivo.titulo;
  const numeroSinCeros = String(parseInt(himnoActivo.numero, 10));
  const totalVerses = himnoActivo.verses ? parseInt(himnoActivo.verses, 10) : undefined;

  if (esTitulo) {
    enviarMensajeProyector('update_text', {
      texto: `${numeroSinCeros} - ${tituloLimpio}`,
      ref: `${numeroSinCeros} - ${tituloLimpio}`,
      himnoData: {
        esTitulo: true,
        numero: numeroSinCeros,
        titulo: tituloLimpio,
        totalEstrofas: himnoActivo.estrofas.length,
        verses: totalVerses
      }
    });
  } else {
    // Solo enviar la letra de la estrofa, sin ningún indicador de verso
    const textoEstrofa = estrofa.texto;
    const ref = `${numeroSinCeros} - ${tituloLimpio}`;
    // Determinar el valor correcto de 'verse'
    const verseValue = estrofa.verse;
    enviarMensajeProyector('update_text', {
      texto: textoEstrofa,
      ref: ref,
      himnoData: {
        esTitulo: false,
        numero: numeroSinCeros,
        titulo: tituloLimpio,
        verse: verseValue,
        estrofaIndex: estrofaIndex,
        totalEstrofas: himnoActivo.estrofas.length,
        seccionActual: estrofaIndex,
        totalSecciones: himnoActivo.estrofas.length - 1,
        verses: totalVerses
      }
    });
  }
  console.log('📤 Estrofa enviada al proyector:', {
    index: estrofaIndex,
    esTitulo: esTitulo,
    texto: esTitulo ? `${numeroSinCeros} - ${tituloLimpio}` : estrofa.texto,
    verse: esTitulo ? 'Título' : estrofa.verse
  });
}

/**
 * Inicializa la aplicación
 */
async function inicializar() {
  console.log('🚀 Función inicializar() ejecutándose...');
  
  // Inicializar SocketIO primero
  console.log('🔌 Llamando a inicializarSocketIO()...');
  inicializarSocketIO();
  
  console.log('📋 Obteniendo referencias a elementos del DOM...');
  // Obtener referencias a elementos del DOM
  elementos = {
    abrirProyector: document.getElementById('abrirProyector'),
    controlInicio: document.getElementById('controlInicio'),
    controlBiblia: document.getElementById('controlBiblia'),
    controlHimnario: document.getElementById('controlHimnario'),
    versionBiblia: document.getElementById('versionBiblia'),
    buscarLibroInput: document.getElementById('buscarLibroInput'),
    clearBuscarLibro: document.getElementById('clearBuscarLibro'),
    sugerenciasLibros: document.getElementById('sugerenciasLibros'),
    grillaCapitulos: document.getElementById('grillaCapitulos'),
    grillaVersiculos: document.getElementById('grillaVersiculos'),
    buscarHimnoInput: document.getElementById('buscarHimnoInput'),
    clearBuscarHimno: document.getElementById('clearBuscarHimno'),
    listaHimnos: document.getElementById('listaHimnos'),
    vistaPrevia: document.getElementById('vistaPrevia'),
    anterior: document.getElementById('anterior'),
    siguiente: document.getElementById('siguiente'),
    reproductorAudio: document.getElementById('reproductorAudio'),
    btnCantado: document.getElementById('btnCantado'),
    btnInstrumental: document.getElementById('btnInstrumental'),
    btnSoloLetra: document.getElementById('btnSoloLetra')
  };

  // --- NUEVO: Referencias para la UI mejorada ---
  topBarTitulo = document.getElementById('topBarTitulo');
  btnCambiarVista = document.getElementById('btnCambiarVista');
  vistaPreviaContainer = document.getElementById('vistaPreviaContainer');
  vistaPrevia = document.getElementById('vistaPrevia');
  vistaProyector = document.getElementById('vistaProyector');
  zonaRetroceder = document.getElementById('zonaRetroceder');
  zonaAvanzar = document.getElementById('zonaAvanzar');
  proyectorPreviewContent = document.getElementById('proyectorPreviewContent');
  vistaActual = 'proyector';

  miniProyectorVideo = document.getElementById('miniProyectorVideo');
  miniProyectorContainer = document.getElementById('vistaProyector');

  // Escuchar relación de aspecto del proyector real
  if (window.socket) {
    window.socket.on('aspect_ratio', (data) => {
      if (data && data.aspect) {
        miniProyectorAspect = data.aspect;
        ajustarRelacionAspectoMiniProyector();
      }
    });
  }

  // Estado inicial: modo proyector visible
  if (vistaPrevia) vistaPrevia.style.display = 'none';
  if (vistaProyector) vistaProyector.style.display = 'flex';
  actualizarTopBarTitulo();

  // Botón para alternar vista
  if (btnCambiarVista) {
    btnCambiarVista.addEventListener('click', () => {
      alternarVistaPrevisualizacion();
    });
    // Configurar estado inicial del botón para modo proyector
    const icono = btnCambiarVista.querySelector('i');
    const texto = btnCambiarVista.querySelector('span');
    if (icono) {
      icono.className = 'fa-solid fa-list';
    }
    if (texto) {
      texto.textContent = 'Lista';
    }
  }
  // Zonas de navegación en modo proyector
  if (zonaRetroceder) {
    zonaRetroceder.addEventListener('click', () => navegar(-1));
  }
  if (zonaAvanzar) {
    zonaAvanzar.addEventListener('click', () => navegar(1));
  }

  // Botón de pantalla completa
  const btnFullscreenMini = document.getElementById('btnFullscreenMini');
  if (btnFullscreenMini) {
    btnFullscreenMini.addEventListener('click', alternarPantallaCompleta);
  }

  // Detección de orientación para auto-fullscreen
  window.addEventListener('orientationchange', manejarCambioOrientacion);
  window.addEventListener('resize', manejarCambioOrientacion);

  console.log('✅ Referencias a elementos obtenidas');

  // --- Configuración Panel ---
  const configModal = document.getElementById('configModal');
  const cerrarConfig = document.getElementById('cerrarConfig');
  const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
  const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
  const switchSoloReferencia = document.getElementById('switchSoloReferencia');

  const switchAutoFullscreen = document.getElementById('switchAutoFullscreen');
  const opcionAutoFullscreen = document.getElementById('opcionAutoFullscreen');
  const sliderFontBibliaContainer = document.getElementById('sliderFontBibliaContainer');

  // Cargar configuración guardada
  let config = await obtenerConfiguracion();
  // --- NUEVO: Asignar a la variable global config ---
  window.config = config;
  console.log('📋 Configuración cargada para modo Biblia (global):', config);
  
  // Convertir el valor vw guardado a porcentaje para el slider
  const porcentajeInicial = vwAPorcentaje(config.fontsizeBiblia || 5);
  sliderFontsizeBiblia.value = config.fontsizeBiblia || 5;
  fontsizeValueBiblia.textContent = (config.fontsizeBiblia || 5) + 'vw';
  switchSoloReferencia.checked = !!config.soloReferencia;

  switchAutoFullscreen.checked = config.autoFullscreen !== false; // true por defecto
  autoFullscreenLandscape = config.autoFullscreen !== false;

  // Mostrar/ocultar sliders según modo
  function actualizarOpcionesModo() {
    const esBiblia = esModoBiblia();
    sliderFontBibliaContainer.style.display = esBiblia ? '' : 'none';
    opcionSoloReferencia.style.display = esBiblia ? '' : 'none';
  }
  
  // Hacer la función global para poder llamarla desde otras funciones
  window.actualizarOpcionesModo = actualizarOpcionesModo;
  
  actualizarOpcionesModo();

  // Cerrar modal
  cerrarConfig.addEventListener('click', () => {
    configModal.style.display = 'none';
  });
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) configModal.style.display = 'none';
  });

  // Slider de fuente Biblia
  sliderFontsizeBiblia.addEventListener('input', async () => {
    fontsizeValueBiblia.textContent = sliderFontsizeBiblia.value + 'vw';
    config.fontsizeBiblia = parseFloat(sliderFontsizeBiblia.value);
    console.log('🔧 Configuración actualizada (slider biblia):', config.fontsizeBiblia);
    await guardarYEnviarConfigBiblia('fontsizeBiblia', config.fontsizeBiblia);
    // Sincronizar con mini proyector
    if (typeof window.actualizarMiniProyector === 'function') {
      await window.actualizarMiniProyector();
    }
    console.log('🔄 Llamando a actualizarVistaProyector...');
    actualizarVistaProyector();
    
    // Emitir evento de socket para sincronizar con otros dispositivos
    if (window.socket) {
      console.log('📤 Emitiendo configuracion_actualizada:', {
        tipo: 'fontsizeBiblia',
        valor: config.fontsizeBiblia,
        clientId: CLIENT_ID
      });
      window.socket.emit('configuracion_actualizada', {
        tipo: 'fontsizeBiblia',
        valor: config.fontsizeBiblia,
        clientId: CLIENT_ID
      });
      console.log('✅ Evento configuracion_actualizada emitido exitosamente');
    } else {
      console.error('❌ Socket no disponible para emitir configuracion_actualizada');
    }
  });

  // Switch solo referencia
  switchSoloReferencia.addEventListener('change', async () => {
    config.soloReferencia = switchSoloReferencia.checked;
    console.log('🔧 Configuración actualizada (solo referencia):', config.soloReferencia);
    await guardarYEnviarConfigBiblia('soloReferencia', config.soloReferencia);
    // Sincronizar con mini proyector
    if (typeof window.actualizarMiniProyector === 'function') {
      await window.actualizarMiniProyector();
    }
    console.log('🔄 Llamando a actualizarVistaProyector...');
    actualizarVistaProyector();
    
    // Emitir evento de socket para sincronizar con otros dispositivos
    if (window.socket) {
      console.log('📤 Emitiendo configuracion_actualizada:', {
        tipo: 'soloReferencia',
        valor: config.soloReferencia,
        clientId: CLIENT_ID
      });
      window.socket.emit('configuracion_actualizada', {
        tipo: 'soloReferencia',
        valor: config.soloReferencia,
        clientId: CLIENT_ID
      });
      console.log('✅ Evento configuracion_actualizada emitido exitosamente');
    } else {
      console.error('❌ Socket no disponible para emitir configuracion_actualizada');
    }
  });


  
  // Switch auto fullscreen
  switchAutoFullscreen.addEventListener('change', () => {
    config.autoFullscreen = switchAutoFullscreen.checked;
    autoFullscreenLandscape = switchAutoFullscreen.checked;
    if (!autoFullscreenLandscape) {
      document.body.classList.remove('auto-fullscreen-landscape');
    } else {
      manejarCambioOrientacion();
    }
  });
  


  // Enviar config inicial al abrir proyector
  if (proyectorWindow && !proyectorWindow.closed) {
    const esBiblia = esModoBiblia();
    if (esBiblia) {
      enviarMensajeProyector('config', {
        fontsize: config.fontsizeBiblia || 5,
        soloReferencia: config.soloReferencia || false
      });
    } else {
      enviarMensajeProyector('config', {
        fontsize: config.fontsizeHimnario || 5,
        showIndicadorVerso: config.showIndicadorVerso || false,
        indicadorVersoPct: config.indicadorVersoPct || 2.5,
        showNombreHimno: config.showNombreHimno || false,
        nombreHimnoPct: config.nombreHimnoPct || 2.3,
        showSeccionActualTotal: config.showSeccionActualTotal || false,
        seccionActualTotalPct: config.seccionActualTotalPct || 2.5
      });
    }
  }
  // Enviar config cada vez que se abre el proyector
  const originalAbrirProyector = abrirProyector;
  window.abrirProyector = function() {
    originalAbrirProyector();
    setTimeout(() => {
      const esBiblia = esModoBiblia();
      if (esBiblia) {
        enviarMensajeProyector('config', {
          fontsize: config.fontsizeBiblia || 5,
          soloReferencia: config.soloReferencia || false
        });
      } else {
        enviarMensajeProyector('config', {
          fontsize: config.fontsizeHimnario || 5,
          showIndicadorVerso: config.showIndicadorVerso || false,
          indicadorVersoPct: config.indicadorVersoPct || 2.5,
          showNombreHimno: config.showNombreHimno || false,
          nombreHimnoPct: config.nombreHimnoPct || 2.3,
          showSeccionActualTotal: config.showSeccionActualTotal || false,
          seccionActualTotalPct: config.seccionActualTotalPct || 2.5
        });
      }
    }, 500);
  };

  // Configurar eventos
  configurarEventos();
  
  // Configurar controles del mini proyector
  await configurarControlesMiniProyector();
  // Inicializar accordions del himnario
  inicializarAccordionsHimnario();

  // Cargar datos iniciales
  await cargarDatosIniciales();
  
  // Establecer modo inicial
  await cambiarModo();

  // Inicializar modo de audio
  inicializarAudioMode();
  
  // Lógica de accordions para capítulos y versículos
  inicializarAccordionsBiblia();
  
  console.log('✅ Función inicializar() completada exitosamente');
  console.log('🔌 Estado final del socket:', {
    existe: typeof window.socket !== 'undefined',
    socket: window.socket,
    conectado: window.socket ? window.socket.connected : 'N/A'
  });
  
  // --- NUEVO: Llamada explícita para actualizar la vista inicial ---
  console.log('🔄 Llamada inicial a actualizarVistaProyector...');
  actualizarVistaProyector();
}

/**
 * Convierte porcentaje a vw
 * @param {number} porcentaje - Valor de 1 a 100
 * @returns {number} - Valor en vw de 1.5 a 8
 */
function porcentajeAVw(porcentaje) {
  const minVw = 1.5;
  const maxVw = 8;
  const rangoVw = maxVw - minVw;
  return minVw + (rangoVw * (porcentaje - 1) / 99);
}

/**
 * Convierte vw a porcentaje
 * @param {number} vw - Valor en vw de 1.5 a 8
 * @returns {number} - Valor de 1 a 100
 */
function vwAPorcentaje(vw) {
  const minVw = 1.5;
  const maxVw = 8;
  const rangoVw = maxVw - minVw;
  return Math.round(1 + (99 * (vw - minVw) / rangoVw));
}

/**
 * Configura los controles del mini proyector
 */
async function configurarControlesMiniProyector() {
  const miniSliderFontsizeBiblia = document.getElementById('miniSliderFontsizeBiblia');
  const miniFontsizeValueBiblia = document.getElementById('miniFontsizeValueBiblia');
  const miniSwitchSoloReferencia = document.getElementById('miniSwitchSoloReferencia');
  const miniProyectorControls = document.getElementById('miniProyectorControls');
  
  // Referencias a los controles del panel principal
  const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
  const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
  const switchSoloReferencia = document.getElementById('switchSoloReferencia');
  
  // --- NUEVO: Usar la variable config global en lugar de una local ---
  console.log('🔧 Configuración inicial para controles mini proyector:', config);
  
  // Convertir el valor vw guardado a porcentaje para el slider
  const porcentajeInicial = vwAPorcentaje(config.fontsizeBiblia || 5);
  
  // Inicializar valores
  miniSliderFontsizeBiblia.value = porcentajeInicial;
  miniFontsizeValueBiblia.textContent = porcentajeInicial + '%';
  miniSwitchSoloReferencia.checked = !!config.soloReferencia;
  
  // Event listeners
  miniSliderFontsizeBiblia.addEventListener('input', async () => {
    const porcentaje = parseInt(miniSliderFontsizeBiblia.value);
    const vw = porcentajeAVw(porcentaje);
    
    miniFontsizeValueBiblia.textContent = porcentaje + '%';
    config.fontsizeBiblia = vw;
    console.log('🔧 Configuración actualizada desde mini proyector (slider):', {
      porcentaje: porcentaje,
      vw: vw,
      configLocal: config.fontsizeBiblia
    });
    
    // Sincronizar con controles del panel principal
    if (sliderFontsizeBiblia) {
      sliderFontsizeBiblia.value = vw;
      fontsizeValueBiblia.textContent = vw + 'vw';
    }
    
    // Usar la nueva función específica para Biblia
    await guardarYEnviarConfigBiblia('fontsizeBiblia', vw);
  });
  
  miniSwitchSoloReferencia.addEventListener('change', async () => {
    config.soloReferencia = miniSwitchSoloReferencia.checked;
    console.log('🔧 Configuración actualizada desde mini proyector (switch):', {
      soloReferencia: config.soloReferencia,
      configLocal: config.soloReferencia
    });
    
    // Sincronizar con controles del panel principal
    if (switchSoloReferencia) {
      switchSoloReferencia.checked = config.soloReferencia;
    }
    
    // Usar la nueva función específica para Biblia
    await guardarYEnviarConfigBiblia('soloReferencia', config.soloReferencia);
  });
  
  // Hacer el switch clickeable
  const switchContainer = miniSwitchSoloReferencia.parentElement;
  switchContainer.addEventListener('click', (e) => {
    // Evitar doble trigger si se hace clic directamente en el input
    if (e.target === miniSwitchSoloReferencia) return;
    
    console.log('🔘 Switch clickeado, estado anterior:', miniSwitchSoloReferencia.checked);
    
    // Toggle del switch
    miniSwitchSoloReferencia.checked = !miniSwitchSoloReferencia.checked;
    
    console.log('🔘 Switch clickeado, estado nuevo:', miniSwitchSoloReferencia.checked);
    
    // Trigger del evento change
    const event = new Event('change', { bubbles: true });
    miniSwitchSoloReferencia.dispatchEvent(event);
  });
  
  // --- CONFIGURACIÓN DE CONTROLES DEL HIMNARIO EN MINI PROYECTOR ---
  const miniSliderFontsizeHimnario = document.getElementById('miniSliderFontsizeHimnario');
  const miniFontsizeValueHimnario = document.getElementById('miniFontsizeValueHimnario');
  const miniCheckIndicadorVerso = document.getElementById('miniCheckIndicadorVerso');
  const miniSliderIndicadorVerso = document.getElementById('miniSliderIndicadorVerso');
  const miniIndicadorVersoValue = document.getElementById('miniIndicadorVersoValue');
  const miniCheckNombreHimno = document.getElementById('miniCheckNombreHimno');
  const miniSliderNombreHimno = document.getElementById('miniSliderNombreHimno');
  const miniNombreHimnoValue = document.getElementById('miniNombreHimnoValue');
  const miniCheckSeccionActualTotal = document.getElementById('miniCheckSeccionActualTotal');
  const miniSliderSeccionActualTotal = document.getElementById('miniSliderSeccionActualTotal');
  const miniSeccionActualTotalValue = document.getElementById('miniSeccionActualTotalValue');
  
  // Event listener para el slider de tamaño de texto principal del himnario
  if (miniSliderFontsizeHimnario && miniFontsizeValueHimnario) {
    miniSliderFontsizeHimnario.addEventListener('input', async () => {
      const porcentaje = parseInt(miniSliderFontsizeHimnario.value);
      const vw = porcentajeAVw(porcentaje);
      
      miniFontsizeValueHimnario.textContent = porcentaje + '%';
      config.fontsizeHimnario = vw;
      console.log('🔧 Configuración actualizada desde mini proyector (slider himnario):', {
        porcentaje: porcentaje,
        vw: vw,
        configLocal: config.fontsizeHimnario
      });
      
      // Guardar y enviar configuración
      await guardarYEnviarConfigHimnario('fontsizeHimnario', vw);
    });
  }
  
  // Event listeners para checkboxes del himnario
  if (miniCheckIndicadorVerso) {
    miniCheckIndicadorVerso.addEventListener('change', async () => {
      config.showIndicadorVerso = miniCheckIndicadorVerso.checked;
      await guardarYEnviarConfigHimnario('showIndicadorVerso', miniCheckIndicadorVerso.checked);
    });
  }
  
  if (miniCheckNombreHimno) {
    miniCheckNombreHimno.addEventListener('change', async () => {
      config.showNombreHimno = miniCheckNombreHimno.checked;
      await guardarYEnviarConfigHimnario('showNombreHimno', miniCheckNombreHimno.checked);
    });
  }
  
  if (miniCheckSeccionActualTotal) {
    miniCheckSeccionActualTotal.addEventListener('change', async () => {
      config.showSeccionActualTotal = miniCheckSeccionActualTotal.checked;
      await guardarYEnviarConfigHimnario('showSeccionActualTotal', miniCheckSeccionActualTotal.checked);
    });
  }
  
  // Event listeners para sliders de porcentaje del himnario
  if (miniSliderIndicadorVerso && miniIndicadorVersoValue) {
    miniSliderIndicadorVerso.addEventListener('input', async () => {
      const pctValue = parseInt(miniSliderIndicadorVerso.value);
      const vwValue = porcentajeAVw(pctValue);
      
      miniIndicadorVersoValue.textContent = pctValue + '%';
      config.indicadorVersoPct = vwValue;
      await guardarYEnviarConfigHimnario('indicadorVersoPct', vwValue);
    });
  }
  
  if (miniSliderNombreHimno && miniNombreHimnoValue) {
    miniSliderNombreHimno.addEventListener('input', async () => {
      const pctValue = parseInt(miniSliderNombreHimno.value);
      const vwValue = porcentajeAVw(pctValue);
      
      miniNombreHimnoValue.textContent = pctValue + '%';
      config.nombreHimnoPct = vwValue;
      await guardarYEnviarConfigHimnario('nombreHimnoPct', vwValue);
    });
  }
  
  if (miniSliderSeccionActualTotal && miniSeccionActualTotalValue) {
    miniSliderSeccionActualTotal.addEventListener('input', async () => {
      const pctValue = parseInt(miniSliderSeccionActualTotal.value);
      const vwValue = porcentajeAVw(pctValue);
      
      miniSeccionActualTotalValue.textContent = pctValue + '%';
      config.seccionActualTotalPct = vwValue;
      await guardarYEnviarConfigHimnario('seccionActualTotalPct', vwValue);
    });
  }
  
  // Mostrar controles solo en modo biblia y vista proyector
  function actualizarVisibilidadControles() {
    const esBiblia = esModoBiblia();
    const esVistaProyector = vistaActual === 'proyector';
    const miniProyectorControls = document.getElementById('miniProyectorControls');
    const controlesBiblia = document.getElementById('miniProyectorControlesBiblia');
    const controlesHimnario = document.getElementById('miniProyectorControlesHimnario');

    if (esBiblia && esVistaProyector) {
      if (controlesBiblia) controlesBiblia.style.display = '';
      if (controlesHimnario) controlesHimnario.style.display = 'none';
      if (miniProyectorControls) miniProyectorControls.classList.add('visible');
    } else if (!esBiblia && esVistaProyector) {
      if (controlesBiblia) controlesBiblia.style.display = 'none';
      if (controlesHimnario) controlesHimnario.style.display = '';
      if (miniProyectorControls) miniProyectorControls.classList.add('visible');
    } else {
      if (controlesBiblia) controlesBiblia.style.display = 'none';
      if (controlesHimnario) controlesHimnario.style.display = 'none';
      if (miniProyectorControls) miniProyectorControls.classList.remove('visible');
    }
  }
  
  // Hacer la función global para poder llamarla desde otras funciones
  window.actualizarVisibilidadControles = actualizarVisibilidadControles;
  
  // Función para actualizar mini proyector en tiempo real
  async function actualizarMiniProyector() {
    const esBiblia = esModoBiblia();
    
    if (esBiblia) {
      // Configuración para modo Biblia
    const porcentaje = vwAPorcentaje(config.fontsizeBiblia || 5);
    
    if (miniSliderFontsizeBiblia) {
      miniSliderFontsizeBiblia.value = porcentaje;
      miniFontsizeValueBiblia.textContent = porcentaje + '%';
    }
    
    if (miniSwitchSoloReferencia) {
      miniSwitchSoloReferencia.checked = !!config.soloReferencia;
      }
    } else {
      // Configuración para modo Himnario
      const porcentaje = vwAPorcentaje(config.fontsizeHimnario || 5);
      
      // Actualizar slider de tamaño de texto principal del himnario
      const miniSliderFontsizeHimnario = document.getElementById('miniSliderFontsizeHimnario');
      const miniFontsizeValueHimnario = document.getElementById('miniFontsizeValueHimnario');
      
      if (miniSliderFontsizeHimnario && miniFontsizeValueHimnario) {
        miniSliderFontsizeHimnario.value = porcentaje;
        miniFontsizeValueHimnario.textContent = porcentaje + '%';
      }
      
      // Actualizar otros controles del himnario si existen
      const miniCheckIndicadorVerso = document.getElementById('miniCheckIndicadorVerso');
      const miniCheckNombreHimno = document.getElementById('miniCheckNombreHimno');
      const miniCheckSeccionActualTotal = document.getElementById('miniCheckSeccionActualTotal');
      
      if (miniCheckIndicadorVerso) {
        miniCheckIndicadorVerso.checked = !!config.showIndicadorVerso;
      }
      
      if (miniCheckNombreHimno) {
        miniCheckNombreHimno.checked = !!config.showNombreHimno;
      }
      
      if (miniCheckSeccionActualTotal) {
        miniCheckSeccionActualTotal.checked = !!config.showSeccionActualTotal;
      }
      
      // Actualizar sliders de porcentaje
      const miniSliderIndicadorVerso = document.getElementById('miniSliderIndicadorVerso');
      const miniIndicadorVersoValue = document.getElementById('miniIndicadorVersoValue');
      if (miniSliderIndicadorVerso && miniIndicadorVersoValue) {
        const pctIndicador = vwAPorcentaje(config.indicadorVersoPct || 2.5);
        miniSliderIndicadorVerso.value = pctIndicador;
        miniIndicadorVersoValue.textContent = pctIndicador + '%';
      }
      
      const miniSliderNombreHimno = document.getElementById('miniSliderNombreHimno');
      const miniNombreHimnoValue = document.getElementById('miniNombreHimnoValue');
      if (miniSliderNombreHimno && miniNombreHimnoValue) {
        const pctNombre = vwAPorcentaje(config.nombreHimnoPct || 2.3);
        miniSliderNombreHimno.value = pctNombre;
        miniNombreHimnoValue.textContent = pctNombre + '%';
      }
      
      const miniSliderSeccionActualTotal = document.getElementById('miniSliderSeccionActualTotal');
      const miniSeccionActualTotalValue = document.getElementById('miniSeccionActualTotalValue');
      if (miniSliderSeccionActualTotal && miniSeccionActualTotalValue) {
        const pctSeccion = vwAPorcentaje(config.seccionActualTotalPct || 2.5);
        miniSliderSeccionActualTotal.value = pctSeccion;
        miniSeccionActualTotalValue.textContent = pctSeccion + '%';
      }
    }
  }
  
  // Hacer la función global
  window.actualizarMiniProyector = actualizarMiniProyector;
  
  // Actualizar visibilidad inicial
  actualizarVisibilidadControles();
}

/**
 * Configura todos los event listeners
 */
function configurarEventos() {
  // Botón abrir proyector
  elementos.abrirProyector.addEventListener('click', abrirProyector);

  // Eventos modo Biblia
  elementos.versionBiblia.addEventListener('change', cambiarVersionBiblia);
  elementos.buscarLibroInput.addEventListener('keyup', function(e) {
    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
    filtrarLibros();
  });
  elementos.sugerenciasLibros.addEventListener('click', seleccionarLibro);
  // Navegación con teclado en sugerencias de libros
  elementos.buscarLibroInput.addEventListener('keydown', manejarTeclasSugerenciasLibros);
  elementos.grillaCapitulos.addEventListener('click', seleccionarCapitulo);
  elementos.grillaVersiculos.addEventListener('click', seleccionarVersiculo);

  // Eventos modo Himnario
  elementos.buscarHimnoInput.addEventListener('keyup', function(e) {
    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
    filtrarHimnos();
  });
  elementos.listaHimnos.addEventListener('click', seleccionarHimno);
  // Navegación con teclado en lista de himnos
  elementos.buscarHimnoInput.addEventListener('keydown', manejarTeclasListaHimnos);

  // Navegación
  elementos.anterior.addEventListener('click', () => navegar(-1));
  elementos.siguiente.addEventListener('click', () => navegar(1));

  // Botón de play del himno
  const playHimnoFooter = document.getElementById('playHimnoFooter');
  if (playHimnoFooter) {
    playHimnoFooter.addEventListener('click', reproducirHimno);
  }

  // Delegación de eventos para cards dinámicas
  elementos.vistaPrevia.addEventListener('click', manejarClicCard);
  
  // Ocultar sugerencias cuando se hace clic fuera
  document.addEventListener('click', (event) => {
    if (!elementos.buscarLibroInput.contains(event.target) && !elementos.sugerenciasLibros.contains(event.target)) {
      elementos.sugerenciasLibros.style.display = 'none';
    }
  });

  // En configurarEventos, agregar este event listener:
  elementos.buscarLibroInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      // Si ya hay libro, capítulo y versículo válidos, lanzar al proyector
      const texto = elementos.buscarLibroInput.value.toLowerCase().trim();
      // Expresión regular para extraer: libro, capítulo y versículo
      const regex = /^(\d+\s)?([\wáéíóúüñ]+)(?:[\s,:\.]+(\d+))?(?:[\s,:\.]+(\d+))?$/i;
      const match = texto.match(regex);
      let nombreLibro = texto;
      let cap = null;
      let vers = null;
      if (match) {
        nombreLibro = (match[1] ? match[1] : '') + match[2];
        nombreLibro = nombreLibro.trim();
        cap = match[3] ? parseInt(match[3], 10) : null;
        vers = match[4] ? parseInt(match[4], 10) : null;
      }
      const libros = Object.keys(bibliaActual);
      const libro = libros.find(l => l.toLowerCase() === nombreLibro);
      if (libro && cap && vers && bibliaActual[libro] && bibliaActual[libro][cap - 1] && bibliaActual[libro][cap - 1][vers - 1]) {
        libroActivo = libro;
        capituloActivo = cap - 1;
        versiculoActivoIndex = vers - 1;
        renderizarGrillaCapitulos(libro);
        // Resaltar capítulo
        elementos.grillaCapitulos.querySelectorAll('button').forEach((btn, idx) => {
          btn.classList.toggle('selected', idx === capituloActivo);
        });
        cargarCapitulo(libro, capituloActivo);
        renderizarGrillaVersiculos();
        // Resaltar versículo
        elementos.grillaVersiculos.querySelectorAll('button').forEach((btn, idx) => {
          btn.classList.toggle('selected', idx === versiculoActivoIndex);
        });
        resaltarCard(versiculoActivoIndex);
        actualizarReferenciaBibliaEnVistaPrevia();
        enviarVersiculoAlProyector(versiculoActivoIndex);
        // Ocultar grillas (accordion)
        mostrarGrillasBiblia(false);
        e.preventDefault();
      }
    }
  });
}

/**
 * Carga los datos iniciales de la aplicación
 */
async function cargarDatosIniciales() {
  console.log('📚 Iniciando carga de datos iniciales...');
  try {
    // Cargar versiones de Biblia
    console.log('📖 Cargando versiones de Biblia...');
    console.log('🔍 getBibleVersions disponible:', typeof getBibleVersions !== 'undefined' ? 'Sí' : 'No');
    
    const versiones = await getBibleVersions();
    console.log('✅ Versiones de Biblia cargadas:', versiones);
    
    elementos.versionBiblia.innerHTML = '<option value="">Selecciona una versión</option>';
    let rv60Index = -1;
    versiones.forEach((version, idx) => {
      const option = document.createElement('option');
      option.value = version.file;
      option.textContent = version.description;
      elementos.versionBiblia.appendChild(option);
      if (version.file === 'es-rv60.json') rv60Index = idx + 1; // +1 por el option vacío
    });
    // Seleccionar por defecto Reina Valera 1960 si existe
    if (rv60Index > 0) {
      elementos.versionBiblia.selectedIndex = rv60Index;
      await cambiarVersionBiblia();
    }
    
    // Cargar índice de himnos desde JSON
    console.log('🎵 Cargando índice de himnos desde JSON...');
    const resp = await fetch('/src/assets/himnos/indice_himnos.json');
    if (!resp.ok) {
      throw new Error(`Error al cargar índice de himnos: ${resp.status} ${resp.statusText}`);
    }
    indiceHimnos = await resp.json();
    console.log('✅ Índice de himnos cargado:', indiceHimnos ? indiceHimnos.length + ' himnos' : 'No disponible');
    
    // Verificar que el índice se cargó correctamente
    if (!indiceHimnos || !Array.isArray(indiceHimnos) || indiceHimnos.length === 0) {
      throw new Error('El índice de himnos está vacío o no es válido');
    }
    
    // Hacer el índice disponible globalmente
    window.indiceHimnos = indiceHimnos;
    console.log('🌐 Índice de himnos disponible globalmente');
    
    console.log('✅ Datos iniciales cargados exitosamente');
  } catch (error) {
    console.error('❌ Error al cargar datos iniciales:', error);
    console.error('🔍 Detalles del error:', {
      message: error.message,
      stack: error.stack
    });
  }
}

/**
 * Detecta si el dispositivo es móvil
 */
function esDispositivoMovil() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
         window.innerWidth <= 768;
}

/**
 * Abre la ventana de proyección
 */
function abrirProyector() {
  const esMovil = esDispositivoMovil();
  
  if (esMovil) {
    // Si es móvil, abrir automáticamente en nueva pestaña
    const nuevaPestana = window.open('proyector.html', '_blank');
    
    // Mostrar instrucciones en la página actual
    mostrarInstruccionesMovil();
    
    // Cambiar el texto del botón SOLO por socket
    actualizarVisibilidadBotonProyector();
    // Emitir evento para sincronizar con otros paneles
    if (window.socket) {
      window.socket.emit('proyectorAbierto');
    }
  } else {
    // Si es PC, comportamiento normal
    if (proyectorWindow && !proyectorWindow.closed) {
      proyectorWindow.focus();
    } else {
      proyectorWindow = window.open('proyector.html', 'proyector', 'width=800,height=600');
      proyectorPendienteClick = true;
      // NO cambiar el botón aquí, solo emitir el evento
      if (window.socket) {
        window.socket.emit('proyectorAbierto');
      }
      // Monitorea si la ventana se cierra manualmente
      const checkInterval = setInterval(() => {
        if (!proyectorWindow || proyectorWindow.closed) {
          clearInterval(checkInterval);
          proyectorWindow = null;
          proyectorPendienteClick = false;
          // Restaura el botón SOLO por socket
          if (window.socket) {
            window.socket.emit('proyectorCerrado');
          }
        }
      }, 1000);
    }
  }
}

/**
 * Muestra instrucciones para dispositivos móviles
 */
function mostrarInstruccionesMovil() {
  // Crear o actualizar el elemento de instrucciones
  let instrucciones = document.getElementById('instrucciones-movil');
  if (!instrucciones) {
    instrucciones = document.createElement('div');
    instrucciones.id = 'instrucciones-movil';
    instrucciones.style.cssText = `
      background: #17a2b8;
      color: white;
      padding: 1em;
      margin: 1em 0;
      border-radius: 8px;
      text-align: center;
      font-size: 14px;
    `;
    
    // Insertar después del botón
    const boton = document.getElementById('abrirProyector');
    if (boton && boton.parentNode) {
      boton.parentNode.insertBefore(instrucciones, boton.nextSibling);
    }
  }
  
  instrucciones.innerHTML = `
    <strong>📱 Control Móvil Activo</strong><br>
    ✅ Ventana de proyección abierta en la PC<br>
    🎯 Ahora puedes controlar desde tu celular<br>
    <small>La proyección aparecerá en la nueva pestaña de la PC</small>
  `;
  
  // Ocultar después de 5 segundos
  setTimeout(() => {
    if (instrucciones) {
      instrucciones.style.display = 'none';
    }
  }, 5000);
}

/**
 * Cambia entre modo Biblia e Himnario
 */
async function cambiarModo() {
  const esBiblia = esModoBiblia();
  // Limpiar todo ANTES de cambiar el modo
  limpiarVistaPrevia();
  limpiarProyector();
  limpiarCamposBusqueda();
  if (esBiblia) {
    elementos.controlBiblia.style.display = 'block';
    elementos.controlHimnario.style.display = 'none';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/verso-bg.mp4' });
    ocultarPlayFooter();
    actualizarBotonPlayMiniProyector();
    // Cargar configuración desde config.json para modo Biblia
    const config = await obtenerConfiguracion();
    // --- NUEVO: Asignar a la variable global config ---
    window.config = config;
    console.log('📋 Configuración cargada para modo Biblia (global):', config);
    // Actualizar controles del panel principal
    const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
    const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
    const switchSoloReferencia = document.getElementById('switchSoloReferencia');
    if (sliderFontsizeBiblia) {
      sliderFontsizeBiblia.value = config.fontsizeBiblia || 5;
      fontsizeValueBiblia.textContent = (config.fontsizeBiblia || 5) + 'vw';
    }
    if (switchSoloReferencia) {
      switchSoloReferencia.checked = !!config.soloReferencia;
    }
  } else {
    elementos.controlBiblia.style.display = 'none';
    elementos.controlHimnario.style.display = 'block';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/himno-bg.mp4' });
    // --- NUEVO: Cargar configuración desde config.json para modo Himnario ---
    const config = await obtenerConfiguracion();
    window.config = config;
    console.log('📋 Configuración cargada para modo Himnario (global):', config);
    // Actualizar controles del panel principal de himnario
    // Tamaño texto principal
    const sliderFontsize = document.getElementById('miniSliderFontsizeHimnario');
    const valueFontsize = document.getElementById('miniFontsizeValueHimnario');
    if (sliderFontsize && valueFontsize) {
      const pct = vwAPorcentaje(config.fontsizeHimnario || 5);
      sliderFontsize.value = pct;
      valueFontsize.textContent = pct + '%';
    }
    // Indicador de verso
    const sliderIndicador = document.getElementById('miniSliderIndicadorVerso');
    const valueIndicador = document.getElementById('miniIndicadorVersoValue');
    const checkIndicador = document.getElementById('miniCheckIndicadorVerso');
    if (sliderIndicador && valueIndicador) {
      const pct = vwAPorcentaje(config.indicadorVersoPct || 2.5);
      sliderIndicador.value = pct;
      valueIndicador.textContent = pct + '%';
    }
    if (checkIndicador) {
      checkIndicador.checked = !!config.showIndicadorVerso;
    }
    // Nombre del himno
    const sliderNombre = document.getElementById('miniSliderNombreHimno');
    const valueNombre = document.getElementById('miniNombreHimnoValue');
    const checkNombre = document.getElementById('miniCheckNombreHimno');
    if (sliderNombre && valueNombre) {
      const pct = vwAPorcentaje(config.nombreHimnoPct || 2.3);
      sliderNombre.value = pct;
      valueNombre.textContent = pct + '%';
    }
    if (checkNombre) {
      checkNombre.checked = !!config.showNombreHimno;
    }
    // Sección actual/total
    const sliderSeccion = document.getElementById('miniSliderSeccionActualTotal');
    const valueSeccion = document.getElementById('miniSeccionActualTotalValue');
    const checkSeccion = document.getElementById('miniCheckSeccionActualTotal');
    if (sliderSeccion && valueSeccion) {
      const pct = vwAPorcentaje(config.seccionActualTotalPct || 2.5);
      sliderSeccion.value = pct;
      valueSeccion.textContent = pct + '%';
    }
    if (checkSeccion) {
      checkSeccion.checked = !!config.showSeccionActualTotal;
    }
  }
  // Actualizar opciones del panel de configuración según el modo
  if (typeof window.actualizarOpcionesModo === 'function') {
    window.actualizarOpcionesModo();
  }
  // Enviar configuración actualizada según el modo
  const config = await obtenerConfiguracion();
  if (esBiblia) {
    enviarMensajeProyector('config', {
      fontsize: config.fontsizeBiblia || 5,
      soloReferencia: config.soloReferencia || false
    });
  } else {
    enviarMensajeProyector('config', {
      fontsize: config.fontsizeHimnario || 5,
      showIndicadorVerso: config.showIndicadorVerso || false,
      indicadorVersoPct: config.indicadorVersoPct || 2.5,
      showNombreHimno: config.showNombreHimno || false,
      nombreHimnoPct: config.nombreHimnoPct || 2.3,
      showSeccionActualTotal: config.showSeccionActualTotal || false,
      seccionActualTotalPct: config.seccionActualTotalPct || 2.5
    });
  }
  // Si es modo biblia y hay un versículo activo, reenviarlo con la nueva configuración
  if (esBiblia && bibliaActual && libroActivo && capituloActivo !== null && versiculoActivoIndex >= 0) {
    console.log('🔄 Reenviando versículo con nueva configuración al cambiar modo...');
    setTimeout(async () => {
      await enviarVersiculoAlProyector(versiculoActivoIndex);
    }, 100);
  }
  // Actualizar mini proyector si está disponible
  if (typeof window.actualizarMiniProyector === 'function') {
    await window.actualizarMiniProyector();
  }
  actualizarTopBarTitulo();
  actualizarVistaProyector();
  console.log('✅ Modo cambiado exitosamente');
}

/**
 * Función global para cambiar modo desde el foot navbar
 * Esta función se puede llamar desde index.html
 */
async function cambiarModoGlobal(modo, propagar = true) {
  console.log('🔄 Cambiando modo global a:', modo);
  window.modoActual = modo;
  // --- Actualizar visualmente los botones del navbar ---
  const navInicio = document.getElementById('navInicio');
  const navHimnario = document.getElementById('navHimnario');
  const navBiblia = document.getElementById('navBiblia');
  if (navInicio && navHimnario && navBiblia) {
    navInicio.classList.remove('active');
    navHimnario.classList.remove('active');
    navBiblia.classList.remove('active');
    if (modo === 'inicio') {
      navInicio.classList.add('active');
    } else if (modo === 'himnario') {
      navHimnario.classList.add('active');
    } else if (modo === 'biblia') {
      navBiblia.classList.add('active');
    }
  }
  // NO limpiar la selección del modo anterior
  if (modo === 'inicio') {
    elementos.controlInicio.style.display = 'block';
    elementos.controlHimnario.style.display = 'none';
    elementos.controlBiblia.style.display = 'none';
    // Cargar configuración para modo Inicio
    const config = await obtenerConfiguracion();
    const backgroundImage = config.background || 'fondo-completo-A.png';
    enviarMensajeProyector('change_mode', { 
      imageSrc: `/src/assets/bkg/${backgroundImage}`,
      mode: 'inicio'
    });
    console.log('🏠 Modo Inicio activado - Imagen:', backgroundImage);
    document.body.classList.add('modo-inicio');
    document.body.classList.remove('modo-himnario', 'modo-biblia');
    ocultarPlayFooter();
    // Cargar lista de imágenes de fondo
    cargarImagenesFondo();
  } else if (modo === 'himnario') {
    elementos.controlHimnario.style.display = 'block';
    elementos.controlBiblia.style.display = 'none';
    elementos.controlInicio.style.display = 'none';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/himno-bg.mp4' });
    console.log('🎵 Modo Himnario activado - Video: /src/assets/videos/himno-bg.mp4');
    document.body.classList.add('modo-himnario');
    document.body.classList.remove('modo-biblia', 'modo-inicio');
    
    // Verificar si tenemos memoria y restaurar el estado
    if (window.memoriaUltima && window.memoriaUltima.himnario) {
      console.log('🔄 Restaurando estado del himnario desde memoria:', window.memoriaUltima.himnario);
      // Verificar que el índice esté cargado
      if (!indiceHimnos || indiceHimnos.length === 0) {
        console.log('⏳ Esperando a que se cargue el índice de himnos...');
        // Esperar un poco más para que se cargue el índice
        setTimeout(async () => {
          await seleccionarEstadoHimnario(window.memoriaUltima.himnario);
        }, 500);
      } else {
        await seleccionarEstadoHimnario(window.memoriaUltima.himnario);
      }
    } else {
      console.log('⚠️ No hay memoria del himnario disponible, solicitando al servidor...');
      // Si no hay memoria local, solicitar al servidor
      solicitarMemoriaServidor();
    }
  } else if (modo === 'biblia') {
    elementos.controlBiblia.style.display = 'block';
    elementos.controlHimnario.style.display = 'none';
    elementos.controlInicio.style.display = 'none';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/verso-bg.mp4' });
    ocultarPlayFooter();
    console.log('📖 Modo Biblia activado - Video: /src/assets/videos/verso-bg.mp4');
    document.body.classList.add('modo-biblia');
    document.body.classList.remove('modo-himnario', 'modo-inicio');
    
    // Cargar configuración desde config.json para modo Biblia
    const config = await obtenerConfiguracion();
    console.log('📋 Configuración cargada para modo Biblia (global):', config);
    
    // Actualizar controles del panel principal
    const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
    const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
    const switchSoloReferencia = document.getElementById('switchSoloReferencia');
    
    if (sliderFontsizeBiblia) {
      sliderFontsizeBiblia.value = config.fontsizeBiblia || 5;
      fontsizeValueBiblia.textContent = (config.fontsizeBiblia || 5) + 'vw';
    }
    
    if (switchSoloReferencia) {
      switchSoloReferencia.checked = !!config.soloReferencia;
    }
    
    if (window.memoriaUltima && window.memoriaUltima.biblia) {
      seleccionarEstadoBiblia(window.memoriaUltima.biblia);
    }
  }
  if (typeof window.actualizarOpcionesModo === 'function') {
    window.actualizarOpcionesModo();
  }
  const config = await obtenerConfiguracion();
  if (modo === 'biblia') {
    enviarMensajeProyector('config', {
      fontsize: config.fontsizeBiblia || 5,
      soloReferencia: config.soloReferencia || false
    });
  } else {
    enviarMensajeProyector('config', {
      fontsize: config.fontsizeHimnario || 5,
      showIndicadorVerso: config.showIndicadorVerso || false,
      indicadorVersoPct: config.indicadorVersoPct || 2.5,
      showNombreHimno: config.showNombreHimno || false,
      nombreHimnoPct: config.nombreHimnoPct || 2.3,
      showSeccionActualTotal: config.showSeccionActualTotal || false,
      seccionActualTotalPct: config.seccionActualTotalPct || 2.5
    });
  }
  
  // Si es modo biblia y hay un versículo activo, reenviarlo con la nueva configuración
  if (modo === 'biblia' && bibliaActual && libroActivo && capituloActivo !== null && versiculoActivoIndex >= 0) {
    console.log('🔄 Reenviando versículo con nueva configuración al cambiar modo global...');
    setTimeout(async () => {
      await enviarVersiculoAlProyector(versiculoActivoIndex);
    }, 100);
  }
  
  // Actualizar mini proyector si está disponible
  if (typeof window.actualizarMiniProyector === 'function') {
    await window.actualizarMiniProyector();
  }
  
  actualizarTopBarTitulo();
  actualizarVistaProyector();
  actualizarBotonPlayMiniProyector();
  if (typeof window.actualizarVisibilidadControles === 'function') {
    window.actualizarVisibilidadControles();
  }
  console.log('✅ Cambio de modo completado');
  if (propagar) {
    // Enviar el estado actual completo al cambiar de modo
    const estadoActual = { modo };
    
    // Usar la memoria local más reciente si está disponible, en lugar del estado actual del dispositivo
    if (modo === 'himnario') {
      if (window.memoriaUltima && window.memoriaUltima.himnario) {
        // Usar la memoria local del himnario si está disponible
        estadoActual.himnario = window.memoriaUltima.himnario;
        console.log('📤 Usando memoria local del himnario al cambiar modo:', estadoActual.himnario);
      } else if (himnoActivo) {
        // Fallback al estado actual del dispositivo
        estadoActual.himnario = {
          numero: himnoActivo.numero,
          titulo: himnoActivo.titulo,
          estrofa: estrofaActivaIndex >= 0 ? estrofaActivaIndex : 0
        };
        console.log('📤 Usando estado actual del dispositivo (himnario):', estadoActual.himnario);
      }
    } else if (modo === 'biblia') {
      if (window.memoriaUltima && window.memoriaUltima.biblia) {
        // Usar la memoria local de la biblia si está disponible
        estadoActual.biblia = window.memoriaUltima.biblia;
        console.log('📤 Usando memoria local de la biblia al cambiar modo:', estadoActual.biblia);
      } else if (bibliaActual && libroActivo) {
        // Fallback al estado actual del dispositivo
        estadoActual.biblia = {
          libro: libroActivo,
          capitulo: capituloActivo !== null ? capituloActivo : null,
          versiculo: versiculoActivoIndex >= 0 ? versiculoActivoIndex : null
        };
        console.log('📤 Usando estado actual del dispositivo (biblia):', estadoActual.biblia);
      }
    }
    
    console.log('📤 Enviando estado al cambiar modo:', estadoActual);
    actualizarMemoriaServidor(estadoActual);
  }
}

/**
 * Cambia la versión de la Biblia
 */
async function cambiarVersionBiblia() {
  const version = elementos.versionBiblia.value;
  if (!version) return;

  try {
    console.log('Cargando versión de Biblia:', version);
    bibliaActual = await parseBible(version);
    if (bibliaActual) {
      console.log('Biblia cargada exitosamente. Libros disponibles:', Object.keys(bibliaActual));
      limpiarGrillas();
      mostrarSugerenciasLibros();
    } else {
      console.error('No se pudo cargar la Biblia');
    }
  } catch (error) {
    console.error('Error al cargar la Biblia:', error);
  }
}

/**
 * Filtra libros según el texto ingresado
 */
function filtrarLibros() {
  if (!bibliaActual) return;
  const textoInput = elementos.buscarLibroInput.value;
  const texto = normalizarTexto(textoInput.toLowerCase().trim());
  if (texto.length === 0) {
    elementos.sugerenciasLibros.style.display = 'none';
    libroSugeridoIndex = -1;
    return;
  }

  // Expresión regular para extraer: libro, capítulo y versículo
  const regex = /^(\d+\s)?([\wáéíóúüñ]+)(?:[\s,:\.]+(\d+))?(?:[\s,:\.]+(\d+))?$/i;
  const match = textoInput.match(regex);
  let nombreLibro = texto;
  let cap = null;
  let vers = null;
  if (match) {
    nombreLibro = normalizarTexto(((match[1] ? match[1] : '') + match[2]).trim());
    cap = match[3] ? parseInt(match[3], 10) : null;
    vers = match[4] ? parseInt(match[4], 10) : null;
  }

  // Buscar libros que coincidan con el nombre (normalizado)
  const libros = Object.keys(bibliaActual);
  const filtrados = libros.filter(libro => 
    normalizarTexto(libro).includes(nombreLibro)
  );
  libroSugeridoIndex = filtrados.length > 0 ? 0 : -1;

  // --- NUEVO: Si el usuario ya escribió un libro válido seguido de un espacio, nunca mostrar sugerencias ---
  // Ejemplo: "Juan "
  const partes = textoInput.split(/\s+/);
  let nombreLibroInput = partes[0];
  if (partes.length > 1 && partes[0].length > 0) {
    // Si el primer "palabra" es un libro válido y hay un espacio después
    const libroValido = libros.find(l => normalizarTexto(l) === normalizarTexto(nombreLibroInput));
    if (libroValido && textoInput.match(/^\s*\S+\s/)) {
      elementos.sugerenciasLibros.style.display = 'none';
    } else {
      mostrarSugerenciasLibros(filtrados);
    }
  } else {
    // Lógica original para el caso sin espacio
    const terminaConEspacio = /^(\d+\s)?[\wáéíóúüñ]+\s$/i.test(textoInput);
    if (terminaConEspacio) {
      elementos.sugerenciasLibros.style.display = 'none';
    } else {
      mostrarSugerenciasLibros(filtrados);
    }
  }

  // Selección automática de libro/capítulo/versículo en tiempo real
  const libro = libros.find(l => normalizarTexto(l) === nombreLibro);
  if (libro) {
    if (libroActivo !== libro) {
      libroActivo = libro;
      renderizarGrillaCapitulos(libro);
    }
    if (cap && bibliaActual[libro] && bibliaActual[libro][cap - 1]) {
      capituloActivo = cap - 1;
      // Resaltar capítulo
      elementos.grillaCapitulos.querySelectorAll('button').forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === capituloActivo);
      });
      cargarCapitulo(libro, capituloActivo);
      renderizarGrillaVersiculos();
      if (vers && bibliaActual[libro][cap - 1][vers - 1]) {
        versiculoActivoIndex = vers - 1;
        elementos.grillaVersiculos.querySelectorAll('button').forEach((btn, idx) => {
          btn.classList.toggle('selected', idx === versiculoActivoIndex);
        });
        resaltarCard(versiculoActivoIndex);
      } else {
        versiculoActivoIndex = -1;
        elementos.grillaVersiculos.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      }
    } else {
      capituloActivo = null;
      elementos.grillaCapitulos.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
      elementos.grillaVersiculos.innerHTML = '';
    }
  } else {
    capituloActivo = null;
    elementos.grillaCapitulos.querySelectorAll('button').forEach(btn => btn.classList.remove('selected'));
    elementos.grillaVersiculos.innerHTML = '';
  }
}

/**
 * Muestra sugerencias de libros
 */
function mostrarSugerenciasLibros(libros = null) {
  elementos.sugerenciasLibros.innerHTML = '';
  if (!bibliaActual) return;
  const librosAMostrar = libros || Object.keys(bibliaActual).slice(0, 10);
  librosAMostrar.forEach((libro, idx) => {
    const div = document.createElement('div');
    div.textContent = libro;
    div.dataset.libro = libro;
    if (idx === libroSugeridoIndex) div.classList.add('selected');
    elementos.sugerenciasLibros.appendChild(div);
  });
  if (librosAMostrar.length > 0) {
    elementos.sugerenciasLibros.style.display = 'block';
    // Posicionar las sugerencias debajo del input
    const inputRect = elementos.buscarLibroInput.getBoundingClientRect();
    elementos.sugerenciasLibros.style.top = (inputRect.bottom + 5) + 'px';
    elementos.sugerenciasLibros.style.left = inputRect.left + 'px';
    // Asegurar resaltado visual correcto después de renderizar
    const sugerencias = Array.from(elementos.sugerenciasLibros.querySelectorAll('div'));
    sugerencias.forEach((div, idx) => {
      if (idx === libroSugeridoIndex) {
        div.classList.add('selected');
      } else {
        div.classList.remove('selected');
      }
    });
  } else {
    elementos.sugerenciasLibros.style.display = 'none';
  }
}

/**
 * Selecciona un libro
 */
function seleccionarLibro(event) {
  let target = event.target;
  // Permitir selección por teclado
  if (event.type === 'keydown' && event.selectedDiv) {
    target = event.selectedDiv;
  }
  if (target && target.dataset.libro) {
    const libro = target.dataset.libro;
    libroActivo = libro;
    elementos.buscarLibroInput.value = libro;
    elementos.sugerenciasLibros.style.display = 'none';
    renderizarGrillaCapitulos(libro);
    libroSugeridoIndex = -1;
    // Actualizar memoria
    const nuevoEstadoBiblia = { libro: libro, capitulo: null, versiculo: null };
    
    // Actualizar memoria local inmediatamente
    if (!window.memoriaUltima) {
      window.memoriaUltima = {};
    }
    window.memoriaUltima.biblia = nuevoEstadoBiblia;
    window.memoriaUltima.modo = 'biblia';
    
    console.log('💾 Memoria local actualizada (libro):', window.memoriaUltima);
    
    actualizarMemoriaServidor({
      modo: 'biblia',
      biblia: nuevoEstadoBiblia
    });
  }
}

/**
 * Renderiza la grilla de capítulos
 */
function renderizarGrillaCapitulos(libro) {
  elementos.grillaCapitulos.innerHTML = '';
  const capítulos = bibliaActual[libro];
  
  capítulos.forEach((capitulo, index) => {
    const button = document.createElement('button');
    button.textContent = index + 1;
    button.dataset.capitulo = index;
    elementos.grillaCapitulos.appendChild(button);
  });
  mostrarGrillasBiblia(true); // Expandir accordions al cambiar de libro
}

/**
 * Selecciona un capítulo
 */
function seleccionarCapitulo(event) {
  if (event.target.dataset.capitulo) {
    const capituloIndex = parseInt(event.target.dataset.capitulo);
    capituloActivo = capituloIndex;
    elementos.grillaCapitulos.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    cargarCapitulo(libroActivo, capituloIndex);
    renderizarGrillaVersiculos();
    mostrarGrillasBiblia(true);
    // Actualizar memoria
    const nuevoEstadoBiblia = { libro: libroActivo, capitulo: capituloIndex, versiculo: null };
    
    // Actualizar memoria local inmediatamente
    if (!window.memoriaUltima) {
      window.memoriaUltima = {};
    }
    window.memoriaUltima.biblia = nuevoEstadoBiblia;
    window.memoriaUltima.modo = 'biblia';
    
    console.log('💾 Memoria local actualizada (capítulo):', window.memoriaUltima);
    
    actualizarMemoriaServidor({
      modo: 'biblia',
      biblia: nuevoEstadoBiblia
    });
  }
}

/**
 * Carga un capítulo en la vista previa
 */
function cargarCapitulo(libro, capituloIndex) {
  elementos.vistaPrevia.innerHTML = '';
  // Crear el div de referencia vacío (se llenará con la función)
  const referenciaDiv = document.createElement('div');
  referenciaDiv.className = 'referencia-biblia';
  elementos.vistaPrevia.appendChild(referenciaDiv);

  const capítulo = bibliaActual[libro][capituloIndex];
  capítulo.forEach((versiculo, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.versiculo = index;
    card.innerHTML = `<strong>${versiculo.verse}</strong> ${versiculo.text}`;
    elementos.vistaPrevia.appendChild(card);
  });
  actualizarReferenciaBibliaEnVistaPrevia();
  actualizarVistaProyector();
}

/**
 * Renderiza la grilla de versículos
 */
function renderizarGrillaVersiculos() {
  elementos.grillaVersiculos.innerHTML = '';
  const capítulo = bibliaActual[libroActivo][capituloActivo];
  
  capítulo.forEach((versiculo, index) => {
    const button = document.createElement('button');
    button.textContent = versiculo.verse;
    button.dataset.versiculo = index;
    elementos.grillaVersiculos.appendChild(button);
  });
}

/**
 * Selecciona un versículo
 */
async function seleccionarVersiculo(event) {
  if (event.target.dataset.versiculo) {
    const versiculoIndex = parseInt(event.target.dataset.versiculo);
    versiculoActivoIndex = versiculoIndex;
    elementos.grillaVersiculos.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    resaltarCard(versiculoIndex);
    actualizarReferenciaBibliaEnVistaPrevia();
    await enviarVersiculoAlProyector(versiculoIndex);
    actualizarVistaProyector();
    mostrarGrillasBiblia(false);
    // Actualizar memoria
    const nuevoEstadoBiblia = { libro: libroActivo, capitulo: capituloActivo, versiculo: versiculoIndex };
    
    // Actualizar memoria local inmediatamente
    if (!window.memoriaUltima) {
      window.memoriaUltima = {};
    }
    window.memoriaUltima.biblia = nuevoEstadoBiblia;
    window.memoriaUltima.modo = 'biblia';
    
    console.log('💾 Memoria local actualizada (versículo):', window.memoriaUltima);
    
    actualizarMemoriaServidor({
      modo: 'biblia',
      biblia: nuevoEstadoBiblia
    });
  }
}

/**
 * Filtra himnos según el texto ingresado
 */
function filtrarHimnos() {
  const texto = elementos.buscarHimnoInput.value;
  const textoNormalizado = normalizarTexto(texto.toLowerCase());
  if (!textoNormalizado) {
    elementos.listaHimnos.innerHTML = '';
    elementos.listaHimnos.style.display = 'none';
    return;
  }
  // Buscar en número, título y archivo, todos normalizados
  const resultados = indiceHimnos.filter(himno => {
    const numero = normalizarTexto((himno.number || ''));
    const titulo = normalizarTexto((himno.title || ''));
    const file = normalizarTexto((himno.file || ''));
    return numero.includes(textoNormalizado) || titulo.includes(textoNormalizado) || file.includes(textoNormalizado);
  });
  himnoSugeridoIndex = -1; // Reiniciar selección al filtrar
  mostrarListaHimnos(resultados);
}

/**
 * Muestra la lista de himnos filtrados
 */
function mostrarListaHimnos(himnos) {
  elementos.listaHimnos.innerHTML = '';
  // Mostrar solo los primeros 20 resultados
  himnos.slice(0, 20).forEach((himno, idx) => {
    const div = document.createElement('div');
    div.textContent = `${himno.number} - ${himno.title}`;
    div.dataset.himno = himno.file;
    if (idx === himnoSugeridoIndex) div.classList.add('selected');
    elementos.listaHimnos.appendChild(div);
  });
  if (himnos.length > 0) {
    elementos.listaHimnos.style.display = 'block';
  } else {
    elementos.listaHimnos.style.display = 'none';
  }
}

/**
 * Selecciona un himno
 */
async function seleccionarHimno(event) {
  let target = event.target;
  // Permitir selección por teclado
  if (event.type === 'keydown' && event.selectedDiv) {
    target = event.selectedDiv;
  }
  if (target && target.dataset.himno) {
    const himnoFile = target.dataset.himno;
    try {
      himnoActivo = await parseHymn(himnoFile);
      if (himnoActivo) {
        const tituloLimpio = himnoActivo.titulo;
        elementos.buscarHimnoInput.value = `${himnoActivo.numero} - ${tituloLimpio}`;
        elementos.listaHimnos.style.display = 'none';
        himnoSugeridoIndex = -1;
        cargarHimnoEnVistaPrevia();
        enviarEstrofaAlProyector(0);
        
        // Crear el nuevo estado del himnario
        const nuevoEstadoHimnario = { 
          numero: himnoActivo.numero, 
          titulo: tituloLimpio, 
          estrofa: 0 
        };
        
        // Actualizar memoria local inmediatamente
        if (!window.memoriaUltima) {
          window.memoriaUltima = {};
        }
        window.memoriaUltima.himnario = nuevoEstadoHimnario;
        window.memoriaUltima.modo = 'himnario';
        
        console.log('💾 Memoria local actualizada inmediatamente:', window.memoriaUltima);
        
        // Actualizar memoria en el servidor
        actualizarMemoriaServidor({
          modo: 'himnario',
          himnario: nuevoEstadoHimnario
        });
      }
    } catch (error) {
      console.error('Error al cargar himno:', error);
    }
  }
}

/**
 * Carga un himno en la vista previa
 */
function cargarHimnoEnVistaPrevia() {
  if (!himnoActivo) return;
  elementos.vistaPrevia.innerHTML = '';
  const tituloLimpio = himnoActivo.titulo;
  // Debug: Log para verificar el título
  console.log('🔍 Debug título (cargarHimnoEnVistaPrevia):', {
    tituloLimpio: tituloLimpio,
    numero: himnoActivo.numero
  });
  himnoActivo.estrofas.forEach((estrofa, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.estrofa = index;
    if (index === 0) {
      card.innerHTML = `<strong>${himnoActivo.numero} | ${tituloLimpio}</strong>`;
    } else {
      const versoText = estrofa.verse === 'coro' ? 'Coro' : `Verso ${estrofa.verse}`;
      card.innerHTML = `<strong>${versoText}</strong><br>${estrofa.texto}`;
    }
    elementos.vistaPrevia.appendChild(card);
  });
  estrofaActivaIndex = 0;
  resaltarCard(0);
  actualizarBotonPlayHimno();
  actualizarVistaProyector();
}

/**
 * Maneja el clic en una card de estrofa/versículo
 */
async function manejarClicCard(event) {
  const card = event.target.closest('.card'); // Corrección
  if (!card) return; // Añadir esta guarda
  const esBiblia = esModoBiblia();
  // Determinar el índice según el modo
  if (esBiblia) {
    const versiculoIndex = parseInt(card.dataset.versiculo);
    versiculoActivoIndex = versiculoIndex;
    resaltarCard(versiculoIndex);
    actualizarReferenciaBibliaEnVistaPrevia();
    await enviarVersiculoAlProyector(versiculoIndex);
    actualizarVistaProyector();
    // Actualizar memoria
    const nuevoEstadoBiblia = { libro: libroActivo, capitulo: capituloActivo, versiculo: versiculoIndex };
    
    // Actualizar memoria local inmediatamente
    if (!window.memoriaUltima) {
      window.memoriaUltima = {};
    }
    window.memoriaUltima.biblia = nuevoEstadoBiblia;
    window.memoriaUltima.modo = 'biblia';
    
    console.log('💾 Memoria local actualizada (versículo desde card):', window.memoriaUltima);
    
    actualizarMemoriaServidor({
      modo: 'biblia',
      biblia: nuevoEstadoBiblia
    });
  } else {
    const estrofaIndex = parseInt(card.dataset.estrofa);
    estrofaActivaIndex = estrofaIndex;
    resaltarCard(estrofaIndex);
    enviarEstrofaAlProyector(estrofaIndex);
    actualizarVistaProyector();
    // Actualizar memoria
    if (himnoActivo) {
      const nuevoEstadoHimnario = { 
        numero: himnoActivo.numero, 
        titulo: himnoActivo.titulo, 
        estrofa: estrofaIndex 
      };
      
      // Actualizar memoria local inmediatamente
      if (!window.memoriaUltima) {
        window.memoriaUltima = {};
      }
      window.memoriaUltima.himnario = nuevoEstadoHimnario;
      window.memoriaUltima.modo = 'himnario';
      
      console.log('💾 Memoria local actualizada (estrofa):', window.memoriaUltima);
      
      actualizarMemoriaServidor({
        modo: 'himnario',
        himnario: nuevoEstadoHimnario
      });
    }
  }
}

/**
 * Actualiza el botón de play del himno
 */
function actualizarBotonPlayHimno() {
  const playHimnoFooter = document.getElementById('playHimnoFooter');
  if (!himnoActivo || esModoBiblia()) {
    if (playHimnoFooter) playHimnoFooter.style.display = 'none';
    actualizarBotonPlayMiniProyector();
    return;
  }
  // Solo mostrar si NO es modo Biblia
  if (playHimnoFooter) {
    playHimnoFooter.style.display = 'block';
    // Actualizar el estado del botón según si está sonando o no
    const icono = playHimnoFooter.querySelector('i');
    if (himnoSonando) {
      icono.className = 'fa-solid fa-stop';
      playHimnoFooter.classList.add('playing');
    } else {
      icono.className = 'fa-solid fa-play';
      playHimnoFooter.classList.remove('playing');
    }
  }
  actualizarBotonPlayMiniProyector();
}

/**
 * Construye la ruta del archivo de audio
 */
function construirRutaAudio(numeroFormateado, titulo) {
  const tituloNormalizado = titulo.toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  
  return `/src/assets/himnos/musica/${audioMode}/${numeroFormateado}.mp3`;
}

/**
 * Reproduce o detiene un himno
 */
async function reproducirHimno() {
  if (!himnoActivo) return;
  
  if (himnoSonando) {
    // Si está sonando, detener con fadeout
    console.log('⏹️ Deteniendo himno con fadeout...');
    
    // Enviar comando de detención al proyector (PC)
    enviarMensajeProyector('detenerAudio', {
      fadeout: true,
      duracion: 2000 // 2 segundos de fadeout
    });
    
    himnoSonando = false;
    
    // Cambiar el estado del botón
    const playHimnoFooter = document.getElementById('playHimnoFooter');
    if (playHimnoFooter) {
      const icono = playHimnoFooter.querySelector('i');
      icono.className = 'fa-solid fa-play';
      playHimnoFooter.classList.remove('playing');
    }
    
    console.log('✅ Comando de detención enviado al proyector');
    
  } else {
    // Si no está sonando, reproducir
    const numeroFormateado = himnoActivo.numero.padStart(3, '0');
    const rutaAudio = construirRutaAudio(numeroFormateado, himnoActivo.titulo);
    
    try {
      console.log('🎵 Reproduciendo himno:', {
        numero: himnoActivo.numero,
        titulo: himnoActivo.titulo,
        ruta: rutaAudio
      });
      
      // Enviar comando de reproducción al proyector (PC)
      enviarMensajeProyector('reproducirAudio', {
        ruta: rutaAudio,
        himno: himnoActivo.numero,
        titulo: himnoActivo.titulo
      });
      
      // NO reproducir en el panel de control (celular)
      // El audio solo debe reproducirse en la PC
      
      himnoSonando = true;
      
      // Cambiar el estado del botón
      const playHimnoFooter = document.getElementById('playHimnoFooter');
      if (playHimnoFooter) {
        const icono = playHimnoFooter.querySelector('i');
        icono.className = 'fa-solid fa-stop';
        playHimnoFooter.classList.add('playing');
      }
      
      console.log('✅ Comando de reproducción enviado al proyector');
      
    } catch (error) {
      console.error('❌ Error al reproducir himno:', error);
    }
  }
  actualizarBotonPlayMiniProyector();
}

/**
 * Navega entre estrofas/versículos
 */
function navegar(direccion) {
  if (esModoBiblia()) {
    if (!bibliaActual || !libroActivo || capituloActivo === null || versiculoActivoIndex < 0) return;
    const capítulo = bibliaActual[libroActivo][capituloActivo];
    const totalVersiculos = capítulo.length;
    versiculoActivoIndex += direccion;
    if (versiculoActivoIndex < 0) {
      versiculoActivoIndex = totalVersiculos - 1;
    } else if (versiculoActivoIndex >= totalVersiculos) {
      versiculoActivoIndex = 0;
    }
    resaltarCard(versiculoActivoIndex);
    actualizarReferenciaBibliaEnVistaPrevia();
    enviarVersiculoAlProyector(versiculoActivoIndex);
    // Actualizar memoria
    actualizarMemoriaServidor({
      modo: 'biblia',
      biblia: { libro: libroActivo, capitulo: capituloActivo, versiculo: versiculoActivoIndex }
    });
  } else {
    if (!himnoActivo || estrofaActivaIndex < 0) return;
    const totalEstrofas = himnoActivo.estrofas.length;
    estrofaActivaIndex += direccion;
    if (estrofaActivaIndex < 0) {
      estrofaActivaIndex = totalEstrofas - 1;
    } else if (estrofaActivaIndex >= totalEstrofas) {
      estrofaActivaIndex = 0;
    }
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.classList.toggle('selected', index === estrofaActivaIndex);
    });
    enviarEstrofaAlProyector(estrofaActivaIndex);
    // Actualizar memoria
    actualizarMemoriaServidor({
      modo: 'himnario',
      himnario: { numero: himnoActivo.numero, titulo: himnoActivo.titulo, estrofa: estrofaActivaIndex }
    });
  }
  actualizarVistaProyector();
}

/**
 * Resalta un versículo en la vista previa
 */
function resaltarCard(versiculoIndex) {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    if (index === versiculoIndex) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
  // --- NUEVO: Resaltar también el botón de versículo en la grilla ---
  if (esModoBiblia()) {
    const botonesVersiculos = elementos.grillaVersiculos.querySelectorAll('button');
    botonesVersiculos.forEach((btn, idx) => {
      btn.classList.toggle('selected', idx === versiculoIndex);
    });
    // Resaltar capítulo si corresponde
    if (capituloActivo !== null) {
      const botonesCapitulos = elementos.grillaCapitulos.querySelectorAll('button');
      botonesCapitulos.forEach((btn, idx) => {
        btn.classList.toggle('selected', idx === capituloActivo);
      });
    }
  }
}

/**
 * Limpia la vista previa
 */
function limpiarVistaPrevia() {
  console.log('🧹 Limpiando vista previa...');
  elementos.vistaPrevia.innerHTML = '';
  versiculoActivoIndex = -1;
  estrofaActivaIndex = -1;
  himnoActivo = null;
  libroActivo = null;
  capituloActivo = null;
  ocultarPlayFooter();
  actualizarVistaProyector();
}

/**
 * Limpia las grillas de capítulos y versículos
 */
function limpiarGrillas() {
  console.log('🧹 Limpiando grillas...');
  elementos.grillaCapitulos.innerHTML = '';
  elementos.grillaVersiculos.innerHTML = '';
  capituloActivo = null;
  versiculoActivoIndex = -1;
}

/**
 * Oculta el footer de reproducción del himno
 */
function ocultarPlayFooter(forceHide = false) {
  const playHimnoFooter = document.getElementById('playHimnoFooter');
  if (playHimnoFooter) {
    playHimnoFooter.style.display = forceHide ? 'none' : 'none';
  }
}

/**
 * Limpia el texto del proyector
 */
function limpiarProyector() {
  console.log('🧹 Limpiando proyector...');
  enviarMensajeProyector('update_text', {
    texto: '',
    ref: '',
    soloReferencia: false
  });
}

/**
 * Limpia los campos de búsqueda
 */
function limpiarCamposBusqueda() {
  console.log('🧹 Limpiando campos de búsqueda...');
  if (elementos.buscarLibroInput) {
    elementos.buscarLibroInput.value = '';
  }
  if (elementos.buscarHimnoInput) {
    elementos.buscarHimnoInput.value = '';
  }
  if (elementos.sugerenciasLibros) {
    elementos.sugerenciasLibros.style.display = 'none';
  }
  if (elementos.listaHimnos) {
    elementos.listaHimnos.style.display = 'none';
  }
}

/**
 * Normaliza el texto para comparaciones
 */
function normalizarTexto(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Inicializa el modo de audio
 */
function inicializarAudioMode() {
  // Implementa la inicialización del modo de audio
}

/**
 * Maneja teclas de navegación en sugerencias de libros
 */
function manejarTeclasSugerenciasLibros(event) {
  if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    const sugerencias = document.querySelectorAll('#sugerenciasLibros div');
    let index = Array.from(sugerencias).findIndex(div => div.classList.contains('selected'));
    
    if (event.key === "ArrowUp") {
      index = (index - 1 + sugerencias.length) % sugerencias.length;
    } else if (event.key === "ArrowDown") {
      index = (index + 1) % sugerencias.length;
    } else if (event.key === "Enter") {
      const selectedDiv = sugerencias[index];
      if (selectedDiv) {
        // Nuevo: poner el texto del sugerido en el input
        elementos.buscarLibroInput.value = selectedDiv.textContent;
        seleccionarLibro({ type: 'click', selectedDiv });
        // También ocultar sugerencias
        elementos.sugerenciasLibros.style.display = 'none';
        // Evitar el submit del formulario si lo hubiera
        event.preventDefault();
        return;
      }
    }
    
    sugerencias.forEach((div, idx) => {
      div.classList.toggle('selected', idx === index);
    });
  }
}

/**
 * Maneja teclas de navegación en lista de himnos
 */
function manejarTeclasListaHimnos(event) {
  if (["ArrowUp", "ArrowDown", "Enter"].includes(event.key)) {
    const himnos = document.querySelectorAll('#listaHimnos div');
    let index = Array.from(himnos).findIndex(div => div.classList.contains('selected'));
    
    if (event.key === "ArrowUp") {
      index = (index - 1 + himnos.length) % himnos.length;
    } else if (event.key === "ArrowDown") {
      index = (index + 1) % himnos.length;
    } else if (event.key === "Enter") {
      const selectedDiv = himnos[index];
      if (selectedDiv) {
        // Nuevo: poner el texto del sugerido en el input
        elementos.buscarHimnoInput.value = selectedDiv.textContent;
        seleccionarHimno({ type: 'click', target: selectedDiv });
        // También ocultar lista
        elementos.listaHimnos.style.display = 'none';
        event.preventDefault();
        return;
      }
    }
    
    himnos.forEach((div, idx) => {
      div.classList.toggle('selected', idx === index);
    });
  }
}

/**
 * Alterna entre la vista lista y la vista tipo proyector
 */
function alternarVistaPrevisualizacion() {
  const botonera = document.getElementById('botoneraNavegacion');
  const playMini = document.getElementById('playHimnoMiniProyector');
  if (vistaActual === 'lista') {
    vistaActual = 'proyector';
    if (vistaPrevia) vistaPrevia.style.display = 'none';
    if (vistaProyector) vistaProyector.style.display = 'flex';
    if (botonera) botonera.style.display = 'none';
    // Mostrar botón play/stop solo si es himnario
    if (playMini) playMini.style.display = (!esModoBiblia() ? 'block' : 'none');
    actualizarVistaProyector();
    if (btnCambiarVista) {
      const icono = btnCambiarVista.querySelector('i');
      const texto = btnCambiarVista.querySelector('span');
      if (icono) {
        icono.className = 'fa-solid fa-list';
      }
      if (texto) {
        texto.textContent = 'Lista';
      }
    }
  } else {
    vistaActual = 'lista';
    if (vistaPrevia) vistaPrevia.style.display = 'block';
    if (vistaProyector) vistaProyector.style.display = 'none';
    if (botonera) botonera.style.display = 'flex';
    if (playMini) playMini.style.display = 'none';
    if (btnCambiarVista) {
      const icono = btnCambiarVista.querySelector('i');
      const texto = btnCambiarVista.querySelector('span');
      if (icono) {
        icono.className = 'fa-solid fa-expand';
      }
      if (texto) {
        texto.textContent = 'Proyector';
      }
    }
  }
  actualizarTopBarTitulo();
  actualizarBotonPlayMiniProyector();
  if (typeof window.actualizarVisibilidadControles === 'function') {
    window.actualizarVisibilidadControles();
  }
  if (esModoBiblia()) ocultarPlayFooter();
  // Refuerzo: actualizar el botón de play del himno
  actualizarBotonPlayHimno();
}

/**
 * Actualiza el contenido de la vista tipo proyector
 */
// Variable para debounce de actualizarVistaProyector
let actualizarVistaProyectorTimeout = null;

function actualizarVistaProyector() {
  console.log('🔄 actualizarVistaProyector ejecutada');
  console.log('🔍 Configuración actual:', config);
  console.log('🔍 fontsizeHimnario:', config.fontsizeHimnario);
  
  if (!proyectorPreviewContent) {
    console.error('❌ proyectorPreviewContent no encontrado');
    return;
  }
  let texto = '';
  let referencia = '';
  let isBiblia = esModoBiblia();
  let isInicio = window.modoActual === 'inicio';
  const miniProyectorTituloHimno = document.getElementById('miniProyectorTituloHimno');
  const miniProyectorContador = document.getElementById('miniProyectorContador');
  const miniProyectorContainer = document.getElementById('vistaProyector');
  if (miniProyectorContainer) {
    miniProyectorContainer.classList.remove('modo-biblia', 'modo-himno', 'modo-inicio');
    if (isInicio) {
      miniProyectorContainer.classList.add('modo-inicio');
    } else if (isBiblia) {
      miniProyectorContainer.classList.add('modo-biblia');
    } else {
      miniProyectorContainer.classList.add('modo-himno');
    }
  }
  if (miniProyectorTituloHimno) miniProyectorTituloHimno.style.display = 'none';
  if (miniProyectorContador) miniProyectorContador.style.display = 'none';

  // --- NUEVO: Usar la variable config global ---
  let fontsizeBiblia = config.fontsizeBiblia || 5;
  let soloReferencia = config.soloReferencia || false;
  let fontsizeHimnario = config.fontsizeHimnario || 5;
  let showIndicadorVerso = config.showIndicadorVerso;
  let indicadorVersoPct = config.indicadorVersoPct;
  let showNombreHimno = config.showNombreHimno;
  let nombreHimnoPct = config.nombreHimnoPct;
  let showSeccionActualTotal = config.showSeccionActualTotal;
  let seccionActualTotalPct = config.seccionActualTotalPct;
  console.log('🔧 Configuración para mini proyector:', { fontsizeBiblia, soloReferencia, isBiblia, fontsizeHimnario, showIndicadorVerso, indicadorVersoPct, showNombreHimno, nombreHimnoPct, showSeccionActualTotal, seccionActualTotalPct });
  console.log('🔧 Variable config global:', config);

  // --- NUEVO: Manejo del modo Inicio ---
  if (isInicio) {
    // Ocultar video de fondo en mini proyector
    if (miniProyectorVideo) {
      miniProyectorVideo.style.display = 'none';
    }
    
    // Crear o actualizar imagen de fondo en mini proyector
    let miniImagenBg = document.getElementById('mini-imagen-bg');
    if (!miniImagenBg) {
      miniImagenBg = document.createElement('div');
      miniImagenBg.id = 'mini-imagen-bg';
      miniImagenBg.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        z-index: 0;
      `;
      miniProyectorContainer.appendChild(miniImagenBg);
    }
    
    // Aplicar imagen de fondo actual
    const backgroundImage = config.background || 'fondo-completo-A.png';
    miniImagenBg.style.backgroundImage = `url('/src/assets/bkg/${backgroundImage}')`;
    miniImagenBg.style.display = 'block';
    
    // Limpiar contenido de texto
    proyectorPreviewContent.innerHTML = '';
    proyectorPreviewContent.style.display = 'none';
    
    // Ocultar elementos de referencia
    const refDiv = document.getElementById('miniProyectorReferencia');
    if (refDiv) refDiv.style.display = 'none';
    
    console.log('🏠 Modo Inicio configurado en mini proyector con imagen:', backgroundImage);
    return;
  }

  if (isBiblia) {
    // Mostrar video de fondo
    if (miniProyectorVideo) {
      miniProyectorVideo.style.display = 'block';
      if (miniProyectorVideo.src.indexOf('verso-bg.mp4') === -1) {
        miniProyectorVideo.src = '/src/assets/videos/verso-bg.mp4';
      }
    }
    
    // Ocultar imagen de fondo si existe
    const miniImagenBg = document.getElementById('mini-imagen-bg');
    if (miniImagenBg) {
      miniImagenBg.style.display = 'none';
    }
    
    // Mostrar contenido de texto
    proyectorPreviewContent.style.display = 'block';
    
    if (bibliaActual && libroActivo && capituloActivo !== null && versiculoActivoIndex >= 0) {
      const versiculo = bibliaActual[libroActivo][capituloActivo][versiculoActivoIndex];
      referencia = `${libroActivo} ${capituloActivo + 1}:${versiculo.verse}`;
      texto = versiculo.text;
    } else {
      referencia = '';
      texto = '<span style="color:#ffd700;">Selecciona un versículo</span>';
    }
    // --- NUEVO: Mostrar referencia en el div externo ---
    const refDiv = document.getElementById('miniProyectorReferencia');
    if (refDiv) {
      refDiv.style.display = referencia ? '' : 'none';
      refDiv.textContent = referencia;
    }
    // --- NUEVO: Aplicar tamaño de fuente y soloReferencia usando CSS custom properties ---
    // Detectar si estamos en el mini proyector del panel de control
    let esMiniProyectorPanel = false;
    if (miniProyectorContainer && miniProyectorContainer.contains(proyectorPreviewContent)) {
      esMiniProyectorPanel = true;
    }
    if (esMiniProyectorPanel) {
      // Calcular el tamaño de fuente en píxeles relativo al ancho del mini proyector
      const ancho = miniProyectorContainer.offsetWidth;
      const fontSizePx = ancho * (fontsizeBiblia / 100);
      proyectorPreviewContent.style.fontSize = `${fontSizePx}px`;
    } else {
      proyectorPreviewContent.style.fontSize = `${fontsizeBiblia}vw`;
    }
    console.log('🔤 Aplicando tamaño de fuente al mini proyector:', esMiniProyectorPanel ? `${proyectorPreviewContent.style.fontSize} (px)` : `${fontsizeBiblia}vw`);
    if (soloReferencia) {
      proyectorPreviewContent.innerHTML = `<span class=\"texto-dinamico\" style=\"color:#fff;\">${referencia}</span>`;
    } else {
      proyectorPreviewContent.innerHTML = `<span class=\"texto-dinamico\">${texto}</span>`;
    }
    return;
  } else {
    // Mostrar video de fondo
    if (miniProyectorVideo) {
      miniProyectorVideo.style.display = 'block';
      if (miniProyectorVideo.src.indexOf('himno-bg.mp4') === -1) {
        miniProyectorVideo.src = '/src/assets/videos/himno-bg.mp4';
      }
    }
    
    // Ocultar imagen de fondo si existe
    const miniImagenBg = document.getElementById('mini-imagen-bg');
    if (miniImagenBg) {
      miniImagenBg.style.display = 'none';
    }
    
    // Mostrar contenido de texto
    proyectorPreviewContent.style.display = 'block';
    
    // Ocultar referencia externa en modo himnario
    const refDiv = document.getElementById('miniProyectorReferencia');
    if (refDiv) refDiv.style.display = 'none';
    if (himnoActivo && estrofaActivaIndex >= 0) {
      const estrofa = himnoActivo.estrofas[estrofaActivaIndex];
      const totalVerses = himnoActivo.verses ? parseInt(himnoActivo.verses, 10) : undefined;
      if (estrofaActivaIndex === 0) {
        if (miniProyectorTituloHimno) {
          const numeroSinCeros = String(parseInt(himnoActivo.numero, 10));
          miniProyectorTituloHimno.textContent = `${numeroSinCeros} - ${himnoActivo.titulo}`;
          miniProyectorTituloHimno.style.display = showNombreHimno ? 'block' : 'none';
          miniProyectorTituloHimno.style.fontSize = (nombreHimnoPct || 2.3) + 'vw';
        }
        const numeroSinCeros = String(parseInt(himnoActivo.numero, 10));
        texto = `${numeroSinCeros} | ${himnoActivo.titulo}`;
      } else {
        if (miniProyectorTituloHimno) {
          const numeroSinCeros = String(parseInt(himnoActivo.numero, 10));
          miniProyectorTituloHimno.textContent = `${numeroSinCeros} - ${himnoActivo.titulo}`;
          miniProyectorTituloHimno.style.display = showNombreHimno ? 'block' : 'none';
          miniProyectorTituloHimno.style.fontSize = (nombreHimnoPct || 2.3) + 'vw';
        }
        if (miniProyectorContador) {
          miniProyectorContador.textContent = `${estrofaActivaIndex}/${himnoActivo.estrofas.length - 1}`;
          miniProyectorContador.style.display = showSeccionActualTotal ? 'block' : 'none';
          miniProyectorContador.style.fontSize = (seccionActualTotalPct || 2.5) + 'vw';
        }
        let versoText = '';
        if (typeof estrofa.verse !== 'undefined' && totalVerses) {
          versoText = estrofa.verse === 'coro' ? 'Coro' : `Verso ${estrofa.verse} de ${totalVerses}`;
        } else {
          versoText = estrofa.verse === 'coro' ? 'Coro' : `Verso ${estrofa.verse}`;
        }
        texto = estrofa.texto.replace(/\n/g, '<br>');
        proyectorPreviewContent.innerHTML = `
          <div class="indicador-estrofa" style="${showIndicadorVerso ? '' : 'display:none;'} font-size:${(indicadorVersoPct || 2.5)}vw;font-weight:bold;color:#fff;text-shadow:0 2px 8px #000;margin-bottom:1em;">${versoText}</div>
          <span>${texto}</span>
        `;
        return;
      }
    } else {
      texto = '<span style="color:#ffd700;">Selecciona un himno</span>';
    }
    
    // --- NUEVO: Aplicar tamaño de fuente del himnario al mini proyector ---
    // Detectar si estamos en el mini proyector del panel de control
    let esMiniProyectorPanel = false;
    if (miniProyectorContainer && miniProyectorContainer.contains(proyectorPreviewContent)) {
      esMiniProyectorPanel = true;
    }
    console.log('🔍 Debug mini proyector himnario:', {
      esMiniProyectorPanel,
      miniProyectorContainer: !!miniProyectorContainer,
      proyectorPreviewContent: !!proyectorPreviewContent,
      fontsizeHimnario,
      ancho: miniProyectorContainer ? miniProyectorContainer.offsetWidth : 'N/A'
    });
    
    if (esMiniProyectorPanel) {
      // Calcular el tamaño de fuente en píxeles relativo al ancho del mini proyector
      const ancho = miniProyectorContainer.offsetWidth;
      const fontSizePx = ancho * (fontsizeHimnario / 100);
      proyectorPreviewContent.style.fontSize = `${fontSizePx}px`;
      console.log('🔤 Aplicando tamaño de fuente del himnario al mini proyector (px):', `${fontSizePx}px`);
    } else {
      proyectorPreviewContent.style.fontSize = `${fontsizeHimnario}vw`;
      console.log('🔤 Aplicando tamaño de fuente del himnario al mini proyector (vw):', `${fontsizeHimnario}vw`);
    }
  }
  proyectorPreviewContent.innerHTML = (referencia ? `<span class='referencia'>${referencia}</span>` : '') + `<span>${texto}</span>`;
}

/**
 * Actualiza el título de la barra superior según el modo y la vista
 */
function actualizarTopBarTitulo() {
  if (!topBarTitulo) return;
  let modo = '';
  if (window.modoActual === 'inicio') {
    modo = 'Inicio';
  } else if (esModoBiblia()) {
    modo = 'Biblia';
  } else {
    modo = 'Himnario';
  }
  if (vistaActual === 'proyector') {
    topBarTitulo.textContent = `${modo} (Proyector)`;
  } else {
    topBarTitulo.textContent = modo;
  }
}

function actualizarBotonPlayMiniProyector() {
  const playMini = document.getElementById('playHimnoMiniProyector');
  if (!playMini) return;
  // Refuerzo: SIEMPRE ocultar en modo Biblia e Inicio
  if (esModoBiblia() || window.modoActual === 'inicio') {
    playMini.style.display = 'none';
    return;
  }
  // Solo mostrar en modo Himnario y si hay himno activo
  const debeMostrar = (himnoActivo && (
    vistaActual === 'proyector' || modoPantallaCompleta || document.body.classList.contains('auto-fullscreen-landscape')
  ));
  if (debeMostrar) {
    playMini.style.display = 'block';
    const icono = playMini.querySelector('i');
    if (himnoSonando) {
      icono.className = 'fa-solid fa-stop';
      playMini.classList.add('playing');
    } else {
      icono.className = 'fa-solid fa-play';
      playMini.classList.remove('playing');
    }
  } else {
    playMini.style.display = 'none';
  }
}

function ajustarRelacionAspectoMiniProyector() {
  if (miniProyectorContainer) {
    miniProyectorContainer.style.aspectRatio = miniProyectorAspect;
    // Fallback para navegadores sin aspect-ratio
    if (!('aspectRatio' in document.body.style)) {
      // fallback: height = width / aspect
      const width = miniProyectorContainer.offsetWidth;
      miniProyectorContainer.style.height = (width / miniProyectorAspect) + 'px';
    } else {
      miniProyectorContainer.style.height = '';
    }
  }
}

/**
 * Alterna entre modo normal y pantalla completa
 */
function alternarPantallaCompleta() {
  modoPantallaCompleta = !modoPantallaCompleta;
  
  if (modoPantallaCompleta) {
    document.body.classList.add('fullscreen-mode');
    document.body.classList.remove('auto-fullscreen-landscape');
    const btnFullscreenMini = document.getElementById('btnFullscreenMini');
    if (btnFullscreenMini) {
      const icono = btnFullscreenMini.querySelector('i');
      if (icono) {
        icono.className = 'fa-solid fa-compress';
      }
      btnFullscreenMini.title = 'Salir de pantalla completa';
    }
    console.log('🖥️ Modo pantalla completa activado');
  } else {
    document.body.classList.remove('fullscreen-mode');
    const btnFullscreenMini = document.getElementById('btnFullscreenMini');
    if (btnFullscreenMini) {
      const icono = btnFullscreenMini.querySelector('i');
      if (icono) {
        icono.className = 'fa-solid fa-expand';
      }
      btnFullscreenMini.title = 'Pantalla completa';
    }
    if (autoFullscreenLandscape && esDispositivoMovil() && window.innerWidth > window.innerHeight) {
      document.body.classList.add('auto-fullscreen-landscape');
    }
    console.log('📱 Modo pantalla completa desactivado');
  }
  // Actualizar botón de play SIEMPRE después de cambiar pantalla completa
  actualizarBotonPlayMiniProyector();
  ocultarPlayFooter();
  if (esModoBiblia()) ocultarPlayFooter();
  // Refuerzo: actualizar el botón de play del himno
  actualizarBotonPlayHimno();
}

/**
 * Maneja el cambio de orientación del dispositivo
 */
function manejarCambioOrientacion() {
  if (!autoFullscreenLandscape) return;
  
  const esLandscape = window.innerWidth > window.innerHeight;
  const esMovil = esDispositivoMovil();
  
  if (esMovil && esLandscape && !modoPantallaCompleta) {
    // Activar auto-fullscreen landscape
    document.body.classList.add('auto-fullscreen-landscape');
    console.log('🔄 Auto-fullscreen landscape activado');
  } else if (esMovil && !esLandscape) {
    // Desactivar auto-fullscreen landscape
    document.body.classList.remove('auto-fullscreen-landscape');
    console.log('🔄 Auto-fullscreen landscape desactivado');
  }
  
  // Actualizar botón de play
  actualizarBotonPlayMiniProyector();
}

/**
 * Habilita o deshabilita el auto-fullscreen landscape
 */
function toggleAutoFullscreenLandscape() {
  autoFullscreenLandscape = !autoFullscreenLandscape;
  
  if (!autoFullscreenLandscape) {
    document.body.classList.remove('auto-fullscreen-landscape');
  } else {
    // Verificar si debe aplicar ahora
    manejarCambioOrientacion();
  }
  
  console.log('🔄 Auto-fullscreen landscape:', autoFullscreenLandscape ? 'habilitado' : 'deshabilitado');
}

// Llamar también al hacer resize en el panel de control
window.addEventListener('resize', ajustarRelacionAspectoMiniProyector);

// Escuchar eventos de sincronización de proyector
// Elimina el bloque duplicado de listeners de socket para proyectorAbierto/proyectorCerrado si existe fuera de inicializarSocketIO

// Hacer las funciones disponibles globalmente
window.cambiarModoGlobal = cambiarModoGlobal;
window.alternarPantallaCompleta = alternarPantallaCompleta;
window.toggleAutoFullscreenLandscape = toggleAutoFullscreenLandscape;
window.actualizarVistaProyector = actualizarVistaProyector;

// --- INICIO: Identificador único de cliente para sincronización de memoria ---
function obtenerClientId() {
  let clientId = localStorage.getItem('clientId');
  if (!clientId) {
    clientId = 'cli_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem('clientId', clientId);
  }
  return clientId;
}
const CLIENT_ID = obtenerClientId();
// --- FIN ---

// Inicializar la aplicación cuando el DOM esté listo
console.log('📋 DOM cargado, iniciando aplicación...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOMContentLoaded disparado, llamando a inicializar()...');
  inicializar().then(() => {
    if (vistaPrevia) vistaPrevia.style.display = 'none';
    if (vistaProyector) vistaProyector.style.display = 'flex';
    vistaActual = 'proyector';
    actualizarTopBarTitulo();
    const botonera = document.getElementById('botoneraNavegacion');
    if (botonera) botonera.style.display = 'none';
    const playMini = document.getElementById('playHimnoMiniProyector');
    if (playMini) {
      playMini.addEventListener('click', () => {
        reproducirHimno();
        actualizarBotonPlayMiniProyector();
      });
    }
    actualizarVistaProyector();
    actualizarBotonPlayMiniProyector();
    actualizarVisibilidadBotonProyector();
  }).catch(error => {
    console.error('❌ Error al inicializar la aplicación:', error);
  });
  
  // Inicializar manejo de orientación
  setTimeout(() => {
    manejarCambioOrientacion();
  }, 1000);
});

function actualizarVisibilidadBotonProyector() {
  const boton = document.getElementById('abrirProyector');
  const body = document.body;
  if (!boton) return;
  if (proyectorWindow && !proyectorWindow.closed && proyectorPendienteClick) {
    boton.classList.add('proyector-abierto');
    boton.classList.remove('proyector-normal');
    boton.style.display = '';
    boton.textContent = 'No olvides hacer click en el proyector';
    boton.style.pointerEvents = 'none';
    boton.style.cursor = 'not-allowed';
    body.classList.add('con-boton-proyector');
  } else if (proyectorWindow && !proyectorWindow.closed && !proyectorPendienteClick) {
    boton.classList.remove('proyector-abierto');
    boton.classList.add('proyector-normal');
    boton.style.display = '';
    boton.textContent = 'Abrir Ventana de Proyección';
    boton.style.pointerEvents = '';
    boton.style.cursor = '';
    body.classList.remove('con-boton-proyector');
  } else {
    boton.classList.remove('proyector-abierto');
    boton.classList.add('proyector-normal');
    boton.style.display = '';
    boton.textContent = 'Abrir Ventana de Proyección';
    boton.style.pointerEvents = '';
    boton.style.cursor = '';
    body.classList.add('con-boton-proyector');
  }
}

// Función para mostrar/ocultar grillas de capítulos y versículos (accordion)
function mostrarGrillasBiblia(mostrar) {
  const contentCap = document.getElementById('contentCapitulos');
  const contentVers = document.getElementById('contentVersiculos');
  if (contentCap) contentCap.classList.toggle('collapsed', !mostrar);
  if (contentVers) contentVers.classList.toggle('collapsed', !mostrar);
}

// Lógica de accordions para capítulos y versículos
function inicializarAccordionsBiblia() {
  const headerCap = document.getElementById('headerCapitulos');
  const contentCap = document.getElementById('contentCapitulos');
  const headerVers = document.getElementById('headerVersiculos');
  const contentVers = document.getElementById('contentVersiculos');

  if (headerCap && contentCap) {
    headerCap.addEventListener('click', () => {
      contentCap.classList.toggle('collapsed');
    });
  }
  if (headerVers && contentVers) {
    headerVers.addEventListener('click', () => {
      contentVers.classList.toggle('collapsed');
    });
  }
}

// Nueva función para actualizar la referencia en la vista previa
function actualizarReferenciaBibliaEnVistaPrevia() {
  // Buscar el div de referencia
  let referenciaDiv = elementos.vistaPrevia.querySelector('.referencia-biblia');
  if (!referenciaDiv) {
    referenciaDiv = document.createElement('div');
    referenciaDiv.className = 'referencia-biblia';
    elementos.vistaPrevia.prepend(referenciaDiv);
  }
  if (!bibliaActual || !libroActivo || capituloActivo === null) {
    referenciaDiv.textContent = '';
    return;
  }
  let referenciaTexto = `${libroActivo} ${capituloActivo + 1}`;
  if (typeof versiculoActivoIndex === 'number' && versiculoActivoIndex >= 0 && bibliaActual[libroActivo][capituloActivo][versiculoActivoIndex]) {
    const versiculo = bibliaActual[libroActivo][capituloActivo][versiculoActivoIndex];
    referenciaTexto = `${libroActivo} ${capituloActivo + 1}:${versiculo.verse}`;
  }
  referenciaDiv.textContent = referenciaTexto;
}

// --- Clear buttons para inputs de búsqueda ---
function toggleClearBtn(input, btn) {
  if (input.value.length > 0) {
    btn.style.display = 'flex';
  } else {
    btn.style.display = 'none';
  }
}
if (elementos.buscarLibroInput && elementos.clearBuscarLibro) {
  elementos.buscarLibroInput.addEventListener('input', function() {
    toggleClearBtn(elementos.buscarLibroInput, elementos.clearBuscarLibro);
  });
  elementos.clearBuscarLibro.addEventListener('click', function() {
    elementos.buscarLibroInput.value = '';
    elementos.clearBuscarLibro.style.display = 'none';
    elementos.sugerenciasLibros.style.display = 'none';
    limpiarGrillas();
  });
  // Inicializar visibilidad
  toggleClearBtn(elementos.buscarLibroInput, elementos.clearBuscarLibro);
}
if (elementos.buscarHimnoInput && elementos.clearBuscarHimno) {
  elementos.buscarHimnoInput.addEventListener('input', function() {
    toggleClearBtn(elementos.buscarHimnoInput, elementos.clearBuscarHimno);
  });
  elementos.clearBuscarHimno.addEventListener('click', function() {
    elementos.buscarHimnoInput.value = '';
    elementos.clearBuscarHimno.style.display = 'none';
    elementos.listaHimnos.style.display = 'none';
  });
  // Inicializar visibilidad
  toggleClearBtn(elementos.buscarHimnoInput, elementos.clearBuscarHimno);
}

document.addEventListener('DOMContentLoaded', function() {
  // --- Limpiar libro ---
  const buscarLibroInput = document.getElementById('buscarLibroInput');
  const clearBuscarLibro = document.getElementById('clearBuscarLibro');
  if (buscarLibroInput && clearBuscarLibro) {
    buscarLibroInput.addEventListener('input', function() {
      clearBuscarLibro.style.display = buscarLibroInput.value.length > 0 ? 'flex' : 'none';
    });
    clearBuscarLibro.addEventListener('click', function(e) {
      buscarLibroInput.value = '';
      clearBuscarLibro.style.display = 'none';
      const sugerenciasLibros = document.getElementById('sugerenciasLibros');
      if (sugerenciasLibros) sugerenciasLibros.style.display = 'none';
      if (typeof limpiarGrillas === 'function') limpiarGrillas();
      buscarLibroInput.focus();
      e.preventDefault();
      e.stopPropagation();
    });
    // Inicializar visibilidad
    clearBuscarLibro.style.display = buscarLibroInput.value.length > 0 ? 'flex' : 'none';
  }

  // --- Limpiar himno ---
  const buscarHimnoInput = document.getElementById('buscarHimnoInput');
  const clearBuscarHimno = document.getElementById('clearBuscarHimno');
  if (buscarHimnoInput && clearBuscarHimno) {
    buscarHimnoInput.addEventListener('input', function() {
      clearBuscarHimno.style.display = buscarHimnoInput.value.length > 0 ? 'flex' : 'none';
    });
    clearBuscarHimno.addEventListener('click', function(e) {
      buscarHimnoInput.value = '';
      clearBuscarHimno.style.display = 'none';
      const listaHimnos = document.getElementById('listaHimnos');
      if (listaHimnos) listaHimnos.style.display = 'none';
      buscarHimnoInput.focus();
      e.preventDefault();
      e.stopPropagation();
    });
    // Inicializar visibilidad
    clearBuscarHimno.style.display = buscarHimnoInput.value.length > 0 ? 'flex' : 'none';
  }
});

// --- INICIO: Sincronización de memoria con el servidor ---
function solicitarMemoriaServidor() {
  if (window.socket) {
    console.log('📤 Solicitando memoria del servidor...');
    window.socket.emit('get_memoria');
  } else {
    console.error('❌ Socket no disponible para solicitar memoria');
  }
}

/**
 * Fuerza la sincronización de memoria con el servidor
 */
function forzarSincronizacionMemoria() {
  console.log('🔄 Forzando sincronización de memoria...');
  if (window.socket && window.socket.connected) {
    solicitarMemoriaServidor();
  } else {
    console.error('❌ Socket no conectado para sincronizar memoria');
  }
}

/**
 * Verifica el estado actual de la memoria
 */
function verificarEstadoMemoria() {
  console.log('📋 Estado actual de la memoria:');
  console.log('  - Memoria local:', window.memoriaUltima);
  console.log('  - Socket conectado:', window.socket ? window.socket.connected : false);
  console.log('  - Modo actual:', window.modoActual);
  console.log('  - Himno activo:', himnoActivo ? `${himnoActivo.numero} - ${himnoActivo.titulo}` : 'Ninguno');
  console.log('  - Estrofa activa:', estrofaActivaIndex);
  return {
    memoriaLocal: window.memoriaUltima,
    socketConectado: window.socket ? window.socket.connected : false,
    modoActual: window.modoActual,
    himnoActivo: himnoActivo,
    estrofaActiva: estrofaActivaIndex
  };
}

// Hacer funciones disponibles globalmente para debugging
window.forzarSincronizacionMemoria = forzarSincronizacionMemoria;
window.verificarEstadoMemoria = verificarEstadoMemoria;
window.solicitarMemoriaServidor = solicitarMemoriaServidor;

// Función adicional para debugging de sincronización
window.debugSincronizacion = function() {
  console.log('🔍 === DEBUG SINCRONIZACIÓN ===');
  console.log('📋 Memoria local:', window.memoriaUltima);
  console.log('🌐 Socket conectado:', window.socket ? window.socket.connected : false);
  console.log('🆔 Client ID:', CLIENT_ID);
  console.log('📱 Modo actual:', window.modoActual);
  console.log('🎵 Himno activo:', himnoActivo ? `${himnoActivo.numero} - ${himnoActivo.titulo}` : 'Ninguno');
  console.log('📖 Libro activo:', libroActivo);
  console.log('📄 Capítulo activo:', capituloActivo);
  console.log('📝 Versículo activo:', versiculoActivoIndex);
  console.log('🎼 Estrofa activa:', estrofaActivaIndex);
  
  // Solicitar memoria del servidor para comparar
  if (window.socket && window.socket.connected) {
    console.log('📤 Solicitando memoria del servidor para comparar...');
    window.socket.emit('get_memoria');
  }
  
  return {
    memoriaLocal: window.memoriaUltima,
    socketConectado: window.socket ? window.socket.connected : false,
    clientId: CLIENT_ID,
    modoActual: window.modoActual,
    himnoActivo: himnoActivo,
    libroActivo: libroActivo,
    capituloActivo: capituloActivo,
    versiculoActivo: versiculoActivoIndex,
    estrofaActiva: estrofaActivaIndex
  };
};

// Función para debugging de configuración
window.debugConfiguracion = function() {
  console.log('🔧 === DEBUG CONFIGURACIÓN ===');
  console.log('📋 Configuración actual:', config);
  console.log('🎵 Configuración himnario:', {
    fontsizeHimnario: config.fontsizeHimnario,
    showIndicadorVerso: config.showIndicadorVerso,
    indicadorVersoPct: config.indicadorVersoPct,
    showNombreHimno: config.showNombreHimno,
    nombreHimnoPct: config.nombreHimnoPct,
    showSeccionActualTotal: config.showSeccionActualTotal,
    seccionActualTotalPct: config.seccionActualTotalPct
  });
  console.log('📖 Configuración biblia:', {
    fontsizeBiblia: config.fontsizeBiblia,
    soloReferencia: config.soloReferencia
  });
  
  // Verificar controles del DOM
  const controles = {
    sliderFontsizeHimnario: document.getElementById('miniSliderFontsizeHimnario')?.value,
    checkIndicadorVerso: document.getElementById('miniCheckIndicadorVerso')?.checked,
    sliderIndicadorVerso: document.getElementById('miniSliderIndicadorVerso')?.value,
    checkNombreHimno: document.getElementById('miniCheckNombreHimno')?.checked,
    sliderNombreHimno: document.getElementById('miniSliderNombreHimno')?.value,
    checkSeccionActualTotal: document.getElementById('miniCheckSeccionActualTotal')?.checked,
    sliderSeccionActualTotal: document.getElementById('miniSliderSeccionActualTotal')?.value
  };
  console.log('🎛️ Controles del DOM:', controles);
  
  return {
    config: config,
    controles: controles
  };
};

// Función para forzar sincronización de configuración
window.forzarSincronizacionConfiguracion = function() {
  console.log('🔄 Forzando sincronización de configuración...');
  
  // Enviar configuración actual a todos los dispositivos
  if (window.socket && window.socket.connected) {
    // Enviar cada configuración individualmente para asegurar sincronización
    const configuraciones = [
      { tipo: 'fontsizeHimnario', valor: config.fontsizeHimnario },
      { tipo: 'showIndicadorVerso', valor: config.showIndicadorVerso },
      { tipo: 'indicadorVersoPct', valor: config.indicadorVersoPct },
      { tipo: 'showNombreHimno', valor: config.showNombreHimno },
      { tipo: 'nombreHimnoPct', valor: config.nombreHimnoPct },
      { tipo: 'showSeccionActualTotal', valor: config.showSeccionActualTotal },
      { tipo: 'seccionActualTotalPct', valor: config.seccionActualTotalPct }
    ];
    
    configuraciones.forEach(conf => {
      window.socket.emit('configuracion_actualizada', {
        tipo: conf.tipo,
        valor: conf.valor,
        clientId: CLIENT_ID
      });
    });
    
    console.log('✅ Configuraciones enviadas para sincronización');
  } else {
    console.error('❌ Socket no conectado para sincronizar configuración');
  }
};

// Función específica para debugging de configuración del himnario
window.debugConfigHimnario = function() {
  console.log('🔧 === DEBUG CONFIGURACIÓN HIMNARIO ===');
  console.log('📊 Configuración actual:', {
    fontsizeHimnario: config.fontsizeHimnario,
    showIndicadorVerso: config.showIndicadorVerso,
    indicadorVersoPct: config.indicadorVersoPct,
    showNombreHimno: config.showNombreHimno,
    nombreHimnoPct: config.nombreHimnoPct,
    showSeccionActualTotal: config.showSeccionActualTotal,
    seccionActualTotalPct: config.seccionActualTotalPct
  });
  
  // Verificar controles del panel principal
  const sliderFontsize = document.getElementById('miniSliderFontsizeHimnario');
  const valueFontsize = document.getElementById('miniFontsizeValueHimnario');
  console.log('🎛️ Controles panel principal:', {
    sliderFontsize: sliderFontsize ? sliderFontsize.value : 'No encontrado',
    valueFontsize: valueFontsize ? valueFontsize.textContent : 'No encontrado'
  });
  
  // Verificar controles del mini proyector
  const miniSliderFontsize = document.getElementById('miniSliderFontsizeHimnario');
  const miniValueFontsize = document.getElementById('miniFontsizeValueHimnario');
  console.log('🎛️ Controles mini proyector:', {
    miniSliderFontsize: miniSliderFontsize ? miniSliderFontsize.value : 'No encontrado',
    miniValueFontsize: miniValueFontsize ? miniValueFontsize.textContent : 'No encontrado'
  });
  
  // Verificar modo actual
  console.log('📱 Modo actual:', window.modoActual);
  console.log('🔍 ¿Es modo himnario?', !esModoBiblia());
  
  // Forzar actualización
  console.log('🔄 Forzando actualización de mini proyector...');
  if (typeof window.actualizarMiniProyector === 'function') {
    window.actualizarMiniProyector();
  }
  
  // Enviar configuración al proyector
  console.log('📤 Enviando configuración al proyector...');
  enviarMensajeProyector('config', {
    fontsize: config.fontsizeHimnario,
    showIndicadorVerso: config.showIndicadorVerso,
    indicadorVersoPct: config.indicadorVersoPct,
    showNombreHimno: config.showNombreHimno,
    nombreHimnoPct: config.nombreHimnoPct,
    showSeccionActualTotal: config.showSeccionActualTotal,
    seccionActualTotalPct: config.seccionActualTotalPct
  });
  
  return {
    config: {
      fontsizeHimnario: config.fontsizeHimnario,
      showIndicadorVerso: config.showIndicadorVerso,
      indicadorVersoPct: config.indicadorVersoPct,
      showNombreHimno: config.showNombreHimno,
      nombreHimnoPct: config.nombreHimnoPct,
      showSeccionActualTotal: config.showSeccionActualTotal,
      seccionActualTotalPct: config.seccionActualTotalPct
    },
    controles: {
      sliderFontsize: sliderFontsize ? sliderFontsize.value : null,
      valueFontsize: valueFontsize ? valueFontsize.textContent : null,
      miniSliderFontsize: miniSliderFontsize ? miniSliderFontsize.value : null,
      miniValueFontsize: miniValueFontsize ? miniValueFontsize.textContent : null
    },
    modo: window.modoActual,
    esHimnario: !esModoBiblia()
  };
};

// Función para forzar sincronización limpia del himnario
window.forzarSincronizacionHimnario = function() {
  console.log('🔄 === FORZANDO SINCRONIZACIÓN LIMPIA DEL HIMNARIO ===');
  
  // Limpiar todos los timeouts pendientes
  if (guardarConfigHimnarioTimeout) {
    clearTimeout(guardarConfigHimnarioTimeout);
    guardarConfigHimnarioTimeout = null;
  }
  
  // Asegurar que la configuración esté inicializada
  if (typeof config.showIndicadorVerso === 'undefined') config.showIndicadorVerso = false;
  if (typeof config.indicadorVersoPct === 'undefined') config.indicadorVersoPct = 2.5;
  if (typeof config.showNombreHimno === 'undefined') config.showNombreHimno = false;
  if (typeof config.nombreHimnoPct === 'undefined') config.nombreHimnoPct = 2.3;
  if (typeof config.showSeccionActualTotal === 'undefined') config.showSeccionActualTotal = false;
  if (typeof config.seccionActualTotalPct === 'undefined') config.seccionActualTotalPct = 2.5;
  
  // Enviar configuración completa al proyector
  const configEnviar = {
    fontsize: config.fontsizeHimnario || 5,
    showIndicadorVerso: config.showIndicadorVerso || false,
    indicadorVersoPct: config.indicadorVersoPct || 2.5,
    showNombreHimno: config.showNombreHimno || false,
    nombreHimnoPct: config.nombreHimnoPct || 2.3,
    showSeccionActualTotal: config.showSeccionActualTotal || false,
    seccionActualTotalPct: config.seccionActualTotalPct || 2.5
  };
  
  console.log('📤 Enviando configuración limpia:', configEnviar);
  enviarMensajeProyector('config', configEnviar);
  
  // Reenviar estrofa actual si existe
  if (himnoActivo && estrofaActivaIndex >= 0) {
    console.log('🔄 Reenviando estrofa actual...');
    setTimeout(() => {
      enviarEstrofaAlProyector(estrofaActivaIndex);
    }, 100);
  }
  
  return {
    configEnviada: configEnviar,
    estrofaReenviada: himnoActivo && estrofaActivaIndex >= 0
  };
};

// Función específica para forzar actualización del mini proyector
window.forzarActualizacionMiniProyector = function() {
  console.log('🔄 === FORZANDO ACTUALIZACIÓN MINI PROYECTOR ===');
  
  // Forzar actualización de vista proyector
  console.log('📤 Llamando a actualizarVistaProyector...');
  actualizarVistaProyector();
  
  // Forzar actualización de mini proyector
  console.log('📤 Llamando a actualizarMiniProyector...');
  if (typeof window.actualizarMiniProyector === 'function') {
    window.actualizarMiniProyector();
  }
  
  // Verificar elementos del mini proyector
  const miniProyectorContainer = document.getElementById('vistaProyector');
  const proyectorPreviewContent = document.getElementById('proyectorPreviewContent');
  
  console.log('🔍 Elementos del mini proyector:', {
    miniProyectorContainer: !!miniProyectorContainer,
    proyectorPreviewContent: !!proyectorPreviewContent,
    fontsizeHimnario: config.fontsizeHimnario,
    modoActual: window.modoActual,
    esHimnario: !esModoBiblia()
  });
  
  if (proyectorPreviewContent) {
    console.log('🔤 Tamaño de fuente actual del mini proyector:', proyectorPreviewContent.style.fontSize);
  }
  
  // Enviar configuración al proyector
  console.log('📤 Enviando configuración al proyector...');
  enviarMensajeProyector('config', {
    fontsize: config.fontsizeHimnario || 5,
    showIndicadorVerso: config.showIndicadorVerso || false,
    indicadorVersoPct: config.indicadorVersoPct || 2.5,
    showNombreHimno: config.showNombreHimno || false,
    nombreHimnoPct: config.nombreHimnoPct || 2.3,
    showSeccionActualTotal: config.showSeccionActualTotal || false,
    seccionActualTotalPct: config.seccionActualTotalPct || 2.5
  });
  
  return {
    actualizado: true,
    elementos: {
      miniProyectorContainer: !!miniProyectorContainer,
      proyectorPreviewContent: !!proyectorPreviewContent
    },
    config: {
      fontsizeHimnario: config.fontsizeHimnario,
      modoActual: window.modoActual,
      esHimnario: !esModoBiblia()
    }
  };
};

function actualizarMemoriaServidor(nuevoEstado) {
  if (window.socket) {
    window.socket.emit('set_memoria', { ...nuevoEstado, clientId: CLIENT_ID });
  }
}

async function aplicarMemoria(memoria) {
  if (!memoria) return;
  console.log('🔄 Aplicando memoria:', memoria);
  console.log('📋 Estado actual antes de aplicar:', {
    modoActual: window.modoActual,
    himnoActivo: himnoActivo ? `${himnoActivo.numero} - ${himnoActivo.titulo}` : 'Ninguno',
    estrofaActiva: estrofaActivaIndex,
    libroActivo: libroActivo,
    capituloActivo: capituloActivo,
    versiculoActivo: versiculoActivoIndex
  });
  
  window.memoriaUltima = memoria;
  
  if (window.modoActual !== memoria.modo) {
    console.log('🔄 Cambiando modo para aplicar memoria:', memoria.modo);
    window.cambiarModoGlobal(memoria.modo, false);
    return;
  }
  
  if (memoria.modo === 'biblia' && memoria.biblia) {
    console.log('📖 Aplicando estado de Biblia:', memoria.biblia);
    await seleccionarEstadoBiblia(memoria.biblia);
  }
  
  if (memoria.modo === 'himnario' && memoria.himnario) {
    console.log('🎵 Aplicando estado de Himnario:', memoria.himnario);
    await seleccionarEstadoHimnario(memoria.himnario);
  }
  
  actualizarVistaProyector();
  actualizarBotonPlayMiniProyector();
  actualizarReferenciaBibliaEnVistaPrevia();
  
  console.log('📋 Estado actual después de aplicar:', {
    modoActual: window.modoActual,
    himnoActivo: himnoActivo ? `${himnoActivo.numero} - ${himnoActivo.titulo}` : 'Ninguno',
    estrofaActiva: estrofaActivaIndex,
    libroActivo: libroActivo,
    capituloActivo: capituloActivo,
    versiculoActivo: versiculoActivoIndex
  });
  console.log('✅ Memoria aplicada exitosamente');
}

async function seleccionarEstadoBiblia(biblia) {
  if (!bibliaActual || !biblia.libro) return;
  libroActivo = biblia.libro;
  renderizarGrillaCapitulos(libroActivo);
  // --- Actualizar input de búsqueda ---
  if (elementos.buscarLibroInput) {
    let textoInput = biblia.libro;
    if (typeof biblia.capitulo === 'number' && biblia.capitulo >= 0) {
      textoInput += ' ' + (biblia.capitulo + 1);
      if (typeof biblia.versiculo === 'number' && biblia.versiculo >= 0) {
        textoInput += ' ' + (biblia.versiculo + 1);
      }
    }
    elementos.buscarLibroInput.value = textoInput;
  }
  if (typeof biblia.capitulo === 'number' && biblia.capitulo >= 0) {
    capituloActivo = biblia.capitulo;
    cargarCapitulo(libroActivo, capituloActivo);
    renderizarGrillaVersiculos();
    if (typeof biblia.versiculo === 'number' && biblia.versiculo >= 0) {
      versiculoActivoIndex = biblia.versiculo;
      resaltarCard(versiculoActivoIndex);
      actualizarReferenciaBibliaEnVistaPrevia();
      await enviarVersiculoAlProyector(versiculoActivoIndex);
    }
  }
}

async function seleccionarEstadoHimnario(himnario) {
  if (!himnario.numero) return;
  
  // Verificar que el índice de himnos esté cargado
  if (!indiceHimnos || indiceHimnos.length === 0) {
    console.log('⏳ Índice de himnos no disponible, esperando...');
    const datosListos = await verificarDatosListos();
    if (!datosListos) {
      console.error('❌ No se pudo cargar el índice de himnos después de 5 segundos');
      return;
    }
  }
  
  console.log('🔍 Buscando himno en índice:', himnario.numero);
  console.log('📋 Índice disponible:', indiceHimnos.length, 'himnos');
  
  // Buscar el archivo del himno en el índice
  const himno = indiceHimnos.find(h => h.number === himnario.numero);
  if (himno) {
    console.log('✅ Himno encontrado en índice:', himno);
    himnoActivo = await parseHymn(himno.file);
    if (himnoActivo) {
      console.log('✅ Himno cargado exitosamente:', himnoActivo.numero, himnoActivo.titulo);
      // --- Actualizar input de búsqueda ---
      if (elementos.buscarHimnoInput) {
        elementos.buscarHimnoInput.value = `${himnoActivo.numero} - ${himnoActivo.titulo}`;
      }
      cargarHimnoEnVistaPrevia();
      if (typeof himnario.estrofa === 'number' && himnario.estrofa >= 0) {
        estrofaActivaIndex = himnario.estrofa;
        resaltarCard(estrofaActivaIndex);
        enviarEstrofaAlProyector(estrofaActivaIndex);
      }
      // --- Forzar actualización del mini proyector con la estrofa activa ---
      actualizarVistaProyector();
    } else {
      console.error('❌ No se pudo cargar el himno:', himno.file);
    }
  } else {
    console.error('❌ Himno no encontrado en índice:', himnario.numero);
    console.log('🔍 Himnos disponibles:', indiceHimnos.slice(0, 5).map(h => h.number));
  }
}

// Configurar listeners de memoria cuando el socket esté disponible
function configurarListenersMemoria() {
  if (!window.socket) {
    console.log('⏳ Socket no disponible, esperando...');
    setTimeout(configurarListenersMemoria, 100);
    return;
  }
  
  console.log('🔌 Configurando listeners de memoria...');
  
  // Listener para memoria inicial
  window.socket.on('memoria_estado', async (memoria) => {
    console.log('📥 Memoria inicial recibida:', memoria);
    console.log('🔍 Comparando con memoria local:', window.memoriaUltima);
    await aplicarMemoria(memoria);
  });
  
  // Listener para actualizaciones de memoria
      window.socket.on('memoria_actualizada', async function(payload) {
    console.log('📥 Memoria actualizada recibida:', payload);
        // payload puede ser { memoria, clientId }
        let memoria = payload;
        let fromClientId = null;
        if (payload && typeof payload === 'object' && 'memoria' in payload) {
          memoria = payload.memoria;
          fromClientId = payload.clientId;
        } else if (payload && typeof payload === 'object' && 'clientId' in payload) {
          fromClientId = payload.clientId;
        }
        // Si el cambio es propio, ignorar
    if (fromClientId && fromClientId === CLIENT_ID) {
      console.log('🔄 Ignorando cambio propio');
      return;
    }
    console.log('🔄 Aplicando memoria desde otro dispositivo:', memoria);
        await aplicarMemoria(memoria);
      });
  
  // Solicitar memoria inicial
  console.log('📤 Solicitando memoria inicial del servidor...');
      solicitarMemoriaServidor();
    }

// Iniciar configuración de listeners cuando el DOM esté listo
if (typeof io !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🏠 DOM cargado, configurando listeners de memoria...');
    configurarListenersMemoria();
    // Iniciar verificación periódica de memoria
    iniciarVerificacionMemoria();
  });
}
// --- FIN: Sincronización de memoria con el servidor ---

/**
 * Verifica periódicamente que la memoria esté sincronizada
 */
function iniciarVerificacionMemoria() {
  // Verificar cada 30 segundos si la memoria está sincronizada
  setInterval(() => {
    if (window.socket && window.socket.connected) {
      console.log('🔍 Verificación periódica de memoria...');
      // Solo solicitar si no tenemos memoria o si han pasado más de 5 minutos
      const ultimaVerificacion = window.ultimaVerificacionMemoria || 0;
      const ahora = Date.now();
      if (!window.memoriaUltima || (ahora - ultimaVerificacion) > 300000) { // 5 minutos
        console.log('📤 Solicitando verificación de memoria...');
        solicitarMemoriaServidor();
        window.ultimaVerificacionMemoria = ahora;
      }
    }
  }, 30000); // 30 segundos
}

/**
 * Verifica que todos los datos necesarios estén cargados
 * @returns {Promise<boolean>} true si todos los datos están listos
 */
async function verificarDatosListos() {
  const maxIntentos = 50; // 5 segundos
  let intentos = 0;
  
  while (intentos < maxIntentos) {
    // Verificar que el índice de himnos esté cargado
    if (indiceHimnos && indiceHimnos.length > 0) {
      console.log('✅ Datos listos para restaurar estado');
      return true;
    }
    
    console.log(`⏳ Esperando datos... (${intentos + 1}/${maxIntentos})`);
    await new Promise(resolve => setTimeout(resolve, 100));
    intentos++;
  }
  
  console.error('❌ Timeout esperando datos');
  return false;
}

// --- Lógica de accordions para controles del Himnario ---
function inicializarAccordionsHimnario() {
  // Inicializar propiedades de configuración del himnario si no existen
  if (typeof config.showIndicadorVerso === 'undefined') config.showIndicadorVerso = false;
  if (typeof config.indicadorVersoPct === 'undefined') config.indicadorVersoPct = 2.5;
  if (typeof config.showNombreHimno === 'undefined') config.showNombreHimno = false;
  if (typeof config.nombreHimnoPct === 'undefined') config.nombreHimnoPct = 2.3;
  if (typeof config.showSeccionActualTotal === 'undefined') config.showSeccionActualTotal = false;
  if (typeof config.seccionActualTotalPct === 'undefined') config.seccionActualTotalPct = 2.5;
  
  console.log('🔧 Configuración del himnario inicializada:', {
    showIndicadorVerso: config.showIndicadorVerso,
    indicadorVersoPct: config.indicadorVersoPct,
    showNombreHimno: config.showNombreHimno,
    nombreHimnoPct: config.nombreHimnoPct,
    showSeccionActualTotal: config.showSeccionActualTotal,
    seccionActualTotalPct: config.seccionActualTotalPct
  });
  // Tamaño texto principal
  const cardFontsize = document.getElementById('cardFontsizeHimnario');
  const headerFontsize = cardFontsize?.querySelector('.accordion-header');
  const contentFontsize = document.getElementById('contentFontsizeHimnario');
  const sliderFontsize = document.getElementById('miniSliderFontsizeHimnario');
  const valueFontsize = document.getElementById('miniFontsizeValueHimnario');
  if (headerFontsize && contentFontsize) {
    headerFontsize.addEventListener('click', () => {
      contentFontsize.style.display = (contentFontsize.style.display === 'none' || !contentFontsize.style.display) ? 'block' : 'none';
    });
  }
  if (sliderFontsize && valueFontsize) {
    // Inicializar valor desde config
    const pct = vwAPorcentaje(config.fontsizeHimnario || 5);
    sliderFontsize.value = pct;
    valueFontsize.textContent = pct + '%';
    sliderFontsize.addEventListener('input', async () => {
      valueFontsize.textContent = sliderFontsize.value + '%';
      const vw = porcentajeAVw(parseInt(sliderFontsize.value));
      config.fontsizeHimnario = vw;
      await guardarYEnviarConfigHimnario('fontsizeHimnario', vw);
    });
  }

  // Indicador de verso
  const cardIndicador = document.getElementById('cardIndicadorVerso');
  const headerIndicador = cardIndicador?.querySelector('.accordion-header');
  const contentIndicador = document.getElementById('contentIndicadorVerso');
  const sliderIndicador = document.getElementById('miniSliderIndicadorVerso');
  const valueIndicador = document.getElementById('miniIndicadorVersoValue');
  const checkIndicador = document.getElementById('miniCheckIndicadorVerso');
  function actualizarEstadoIndicador() {
    if (checkIndicador.checked) {
      cardIndicador.classList.remove('disabled');
    } else {
      cardIndicador.classList.add('disabled');
      contentIndicador.style.display = 'none';
    }
  }
  if (headerIndicador && contentIndicador && checkIndicador) {
    // Inicializar checkbox desde config
    checkIndicador.checked = !!config.showIndicadorVerso;
    actualizarEstadoIndicador();
    headerIndicador.addEventListener('click', () => {
      if (checkIndicador.checked) {
        contentIndicador.style.display = (contentIndicador.style.display === 'none' || !contentIndicador.style.display) ? 'block' : 'none';
      }
    });
    checkIndicador.addEventListener('change', async () => {
      actualizarEstadoIndicador();
      config.showIndicadorVerso = checkIndicador.checked;
      await guardarYEnviarConfigHimnario('showIndicadorVerso', checkIndicador.checked);
    });
  }
  if (sliderIndicador && valueIndicador) {
    // Inicializar valor desde config
    const pct = vwAPorcentaje(config.indicadorVersoPct || 2.5);
    sliderIndicador.value = pct;
    valueIndicador.textContent = pct + '%';
    sliderIndicador.addEventListener('input', async () => {
      valueIndicador.textContent = sliderIndicador.value + '%';
      const pctValue = parseInt(sliderIndicador.value);
      const vwValue = porcentajeAVw(pctValue);
      config.indicadorVersoPct = vwValue;
      await guardarYEnviarConfigHimnario('indicadorVersoPct', vwValue);
    });
  }

  // Título del himno
  const cardNombre = document.getElementById('cardNombreHimno');
  const headerNombre = cardNombre?.querySelector('.accordion-header');
  const contentNombre = document.getElementById('contentNombreHimno');
  const sliderNombre = document.getElementById('miniSliderNombreHimno');
  const valueNombre = document.getElementById('miniNombreHimnoValue');
  const checkNombre = document.getElementById('miniCheckNombreHimno');
  function actualizarEstadoNombre() {
    if (checkNombre.checked) {
      cardNombre.classList.remove('disabled');
    } else {
      cardNombre.classList.add('disabled');
      contentNombre.style.display = 'none';
    }
  }
  if (headerNombre && contentNombre && checkNombre) {
    checkNombre.checked = !!config.showNombreHimno;
    actualizarEstadoNombre();
    headerNombre.addEventListener('click', () => {
      if (checkNombre.checked) {
        contentNombre.style.display = (contentNombre.style.display === 'none' || !contentNombre.style.display) ? 'block' : 'none';
      }
    });
    checkNombre.addEventListener('change', async () => {
      actualizarEstadoNombre();
      config.showNombreHimno = checkNombre.checked;
      await guardarYEnviarConfigHimnario('showNombreHimno', checkNombre.checked);
    });
  }
  if (sliderNombre && valueNombre) {
    // Inicializar valor desde config
    const pct = vwAPorcentaje(config.nombreHimnoPct || 2.3);
    sliderNombre.value = pct;
    valueNombre.textContent = pct + '%';
    sliderNombre.addEventListener('input', async () => {
      valueNombre.textContent = sliderNombre.value + '%';
      const pctValue = parseInt(sliderNombre.value);
      const vwValue = porcentajeAVw(pctValue);
      config.nombreHimnoPct = vwValue;
      await guardarYEnviarConfigHimnario('nombreHimnoPct', vwValue);
    });
  }

  // Secciones
  const cardSeccion = document.getElementById('cardSeccionActualTotal');
  const headerSeccion = cardSeccion?.querySelector('.accordion-header');
  const contentSeccion = document.getElementById('contentSeccionActualTotal');
  const sliderSeccion = document.getElementById('miniSliderSeccionActualTotal');
  const valueSeccion = document.getElementById('miniSeccionActualTotalValue');
  const checkSeccion = document.getElementById('miniCheckSeccionActualTotal');
  function actualizarEstadoSeccion() {
    if (checkSeccion.checked) {
      cardSeccion.classList.remove('disabled');
    } else {
      cardSeccion.classList.add('disabled');
      contentSeccion.style.display = 'none';
    }
  }
  if (headerSeccion && contentSeccion && checkSeccion) {
    checkSeccion.checked = !!config.showSeccionActualTotal;
    actualizarEstadoSeccion();
    headerSeccion.addEventListener('click', () => {
      if (checkSeccion.checked) {
        contentSeccion.style.display = (contentSeccion.style.display === 'none' || !contentSeccion.style.display) ? 'block' : 'none';
      }
    });
    checkSeccion.addEventListener('change', async () => {
      actualizarEstadoSeccion();
      config.showSeccionActualTotal = checkSeccion.checked;
      await guardarYEnviarConfigHimnario('showSeccionActualTotal', checkSeccion.checked);
    });
  }
  if (sliderSeccion && valueSeccion) {
    // Inicializar valor desde config
    const pct = vwAPorcentaje(config.seccionActualTotalPct || 2.5);
    sliderSeccion.value = pct;
    valueSeccion.textContent = pct + '%';
    sliderSeccion.addEventListener('input', async () => {
      valueSeccion.textContent = sliderSeccion.value + '%';
      const pctValue = parseInt(sliderSeccion.value);
      const vwValue = porcentajeAVw(pctValue);
      config.seccionActualTotalPct = vwValue;
      await guardarYEnviarConfigHimnario('seccionActualTotalPct', vwValue);
    });
  }
}

// Variable para debounce de guardarYEnviarConfigHimnario
let guardarConfigHimnarioTimeout = null;

// --- Guardar y sincronizar configuración de himnario ---
async function guardarYEnviarConfigHimnario(tipo, valor) {
  // Debounce para evitar múltiples envíos simultáneos
  if (guardarConfigHimnarioTimeout) {
    clearTimeout(guardarConfigHimnarioTimeout);
  }
  
  guardarConfigHimnarioTimeout = setTimeout(async () => {
    console.log('📤 guardarYEnviarConfigHimnario ejecutada (debounced):', tipo, valor);
    
    // Asegurar que todas las propiedades de configuración del himnario estén inicializadas
    if (typeof config.showIndicadorVerso === 'undefined') config.showIndicadorVerso = false;
    if (typeof config.indicadorVersoPct === 'undefined') config.indicadorVersoPct = 2.5;
    if (typeof config.showNombreHimno === 'undefined') config.showNombreHimno = false;
    if (typeof config.nombreHimnoPct === 'undefined') config.nombreHimnoPct = 2.3;
    if (typeof config.showSeccionActualTotal === 'undefined') config.showSeccionActualTotal = false;
    if (typeof config.seccionActualTotalPct === 'undefined') config.seccionActualTotalPct = 2.5;
  
  await guardarConfiguracionCompleta(config);
    
  // Emitir evento de socket para sincronizar con otros dispositivos
  if (window.socket) {
    window.socket.emit('configuracion_actualizada', {
      tipo,
      valor,
      clientId: CLIENT_ID
    });
  }
    
  // Actualizar mini proyector local
  if (typeof window.actualizarMiniProyector === 'function') {
    await window.actualizarMiniProyector();
  }
    
  // Actualizar vista proyector local
  actualizarVistaProyector();
    
    // Enviar config al proyector con valores específicos de Himnario
    const configEnviar = {
      fontsize: config.fontsizeHimnario || 5,
      showIndicadorVerso: config.showIndicadorVerso || false,
      indicadorVersoPct: config.indicadorVersoPct || 2.5,
      showNombreHimno: config.showNombreHimno || false,
      nombreHimnoPct: config.nombreHimnoPct || 2.3,
      showSeccionActualTotal: config.showSeccionActualTotal || false,
      seccionActualTotalPct: config.seccionActualTotalPct || 2.5
    };
    
    console.log('📤 Enviando configuración completa de Himnario al proyector:', configEnviar);
    enviarMensajeProyector('config', configEnviar);
    
    // Si hay una estrofa activa, reenviarla con la nueva configuración
    if (himnoActivo && estrofaActivaIndex >= 0) {
      console.log('🔄 Reenviando estrofa con nueva configuración...');
      setTimeout(() => {
        enviarEstrofaAlProyector(estrofaActivaIndex);
      }, 50);
    }
  }, 150); // Aumentar debounce a 150ms para evitar conflictos
}

// --- NUEVO: Funciones separadas para configuración de Biblia e Himnario ---

// Variable para debounce de guardarYEnviarConfigBiblia
let guardarConfigBibliaTimeout = null;

/**
 * Guarda y envía configuración específica de Biblia
 */
async function guardarYEnviarConfigBiblia(tipo, valor) {
  // Debounce para evitar múltiples envíos simultáneos
  if (guardarConfigBibliaTimeout) {
    clearTimeout(guardarConfigBibliaTimeout);
  }
  
  guardarConfigBibliaTimeout = setTimeout(async () => {
    console.log('📤 guardarYEnviarConfigBiblia ejecutada (debounced):', tipo, valor);
    
    await guardarConfiguracionCompleta(config);
    
    // Emitir evento de socket para sincronizar con otros dispositivos
    if (window.socket) {
      window.socket.emit('configuracion_actualizada', {
        tipo,
        valor,
        clientId: CLIENT_ID
      });
    }
    
    // Actualizar mini proyector local
    if (typeof window.actualizarMiniProyector === 'function') {
      await window.actualizarMiniProyector();
    }
    
    // Actualizar vista proyector local
    actualizarVistaProyector();
    
    // Enviar config al proyector con valores específicos de Biblia
    const configEnviar = {
      fontsize: config.fontsizeBiblia || 5,
      soloReferencia: config.soloReferencia || false
    };
    
    console.log('📤 Enviando configuración de Biblia al proyector:', configEnviar);
    enviarMensajeProyector('config', configEnviar);
    
    // Si hay un versículo activo, reenviarlo con la nueva configuración
    if (bibliaActual && libroActivo && capituloActivo !== null && versiculoActivoIndex >= 0) {
      console.log('🔄 Reenviando versículo con nueva configuración...');
      await enviarVersiculoAlProyector(versiculoActivoIndex);
    }
  }, 100); // Debounce de 100ms
}

// --- NUEVO: Funciones para el modo Inicio ---

/**
 * Carga la lista de imágenes de fondo disponibles
 */
async function cargarImagenesFondo() {
  console.log('🖼️ Cargando imágenes de fondo...');
  
  try {
    // Lista de imágenes disponibles en la carpeta bkg
    const imagenesDisponibles = [
      { nombre: 'Fondo A', archivo: 'fondo-completo-A.png' },
      { nombre: 'Fondo B', archivo: 'fondo-completo-B.png' }
    ];
    
    const listaImagenesFondo = document.getElementById('listaImagenesFondo');
    if (!listaImagenesFondo) {
      console.error('❌ Elemento listaImagenesFondo no encontrado');
      return;
    }
    
    // Limpiar lista anterior
    listaImagenesFondo.innerHTML = '';
    
    // Cargar configuración actual
    const config = await obtenerConfiguracion();
    const imagenActual = config.background || 'fondo-completo-A.png';
    
    // Crear elementos para cada imagen
    imagenesDisponibles.forEach(imagen => {
      const div = document.createElement('div');
      div.className = 'card';
      div.style.cursor = 'pointer';
      div.style.padding = '1em';
      div.style.margin = '0.5em 0';
      div.style.borderRadius = '8px';
      div.style.border = '2px solid transparent';
      div.style.transition = 'all 0.2s';
      
      // Marcar como seleccionada si es la actual
      if (imagen.archivo === imagenActual) {
        div.classList.add('selected');
        div.style.borderColor = 'var(--color-destacado)';
        div.style.background = '#333';
      }
      
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1em;">
          <img src="/src/assets/bkg/${imagen.archivo}" 
               alt="${imagen.nombre}" 
               style="width: 80px; height: 45px; object-fit: cover; border-radius: 4px;">
          <div>
            <div style="font-weight: bold; color: #f1f1f1;">${imagen.nombre}</div>
            <div style="font-size: 0.9em; color: #aaa;">${imagen.archivo}</div>
          </div>
        </div>
      `;
      
      // Evento de clic para seleccionar imagen
      div.addEventListener('click', () => {
        seleccionarImagenFondo(imagen.archivo);
        
        // Actualizar selección visual
        document.querySelectorAll('#listaImagenesFondo .card').forEach(card => {
          card.classList.remove('selected');
          card.style.borderColor = 'transparent';
          card.style.background = '#222';
        });
        div.classList.add('selected');
        div.style.borderColor = 'var(--color-destacado)';
        div.style.background = '#333';
      });
      
      listaImagenesFondo.appendChild(div);
    });
    
    console.log('✅ Lista de imágenes de fondo cargada');
  } catch (error) {
    console.error('❌ Error al cargar imágenes de fondo:', error);
  }
}

/**
 * Selecciona una imagen de fondo y la envía al proyector
 */
async function seleccionarImagenFondo(nombreArchivo) {
  console.log('🖼️ Seleccionando imagen de fondo:', nombreArchivo);
  
  try {
    // Actualizar configuración
    config.background = nombreArchivo;
    await guardarConfiguracionCompleta(config);
    
    // Enviar al proyector
    enviarMensajeProyector('change_mode', { 
      imageSrc: `/src/assets/bkg/${nombreArchivo}`,
      mode: 'inicio'
    });
    
    // Actualizar mini proyector
    if (typeof window.actualizarMiniProyector === 'function') {
      await window.actualizarMiniProyector();
    }
    
    // Actualizar vista proyector
    actualizarVistaProyector();
    
    // Emitir evento de socket para sincronizar con otros dispositivos
    if (window.socket) {
      window.socket.emit('configuracion_actualizada', {
        tipo: 'background',
        valor: nombreArchivo,
        clientId: CLIENT_ID
      });
    }
    
    console.log('✅ Imagen de fondo seleccionada y enviada al proyector');
  } catch (error) {
    console.error('❌ Error al seleccionar imagen de fondo:', error);
  }
}