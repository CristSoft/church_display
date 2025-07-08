// main.js - Script normal (no módulo)

// Función para detectar el modo actual (debe estar al inicio)
function esModoBiblia() {
  return window.modoActual === 'biblia';
}

console.log('🚀 main.js iniciando...');

// Variables globales
let proyectorWindow = null;
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

// Referencias a elementos del DOM
let elementos = {};

// Variable global para saber si está sonando el himno
let himnoSonando = false;
let fadeOutTimeout = null;
// Modo de audio: 'cantado', 'instrumental', 'soloLetra'
let audioMode = 'cantado';

console.log('📦 Variables globales inicializadas');

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
function enviarVersiculoAlProyector(versiculoIndex) {
  if (!bibliaActual || !libroActivo || capituloActivo === null || versiculoIndex < 0) {
    console.warn('⚠️ No hay versículo válido para enviar');
    return;
  }

  const versiculo = bibliaActual[libroActivo][capituloActivo][versiculoIndex];
  const referencia = `${libroActivo} ${capituloActivo + 1}:${versiculo.verse}`;
  
  // Obtener configuración
  let config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
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
  
  // Limpiar el título (remover "Himno #" si existe)
  const tituloLimpio = himnoActivo.titulo.replace(/^Himno\s*#?\d*\s*/, '').trim();
  
  if (esTitulo) {
    // Es el título del himno
    enviarMensajeProyector('update_text', {
      texto: `${himnoActivo.numero} | ${tituloLimpio}`,
      ref: `Himno ${himnoActivo.numero} - ${tituloLimpio}`,
      himnoData: {
        esTitulo: true,
        numero: himnoActivo.numero,
        titulo: tituloLimpio,
        totalEstrofas: himnoActivo.estrofas.length
      }
    });
  } else {
    // Es una estrofa
    const textoEstrofa = estrofa.texto; // Usar el texto de la estrofa
    const versoText = estrofa.verso === 'coro' ? 'Coro' : `Verso ${estrofa.verso}`;
    const ref = `${himnoActivo.numero} | ${tituloLimpio} - ${versoText}`;
    
    enviarMensajeProyector('update_text', {
      texto: textoEstrofa,
      ref: ref,
      himnoData: {
        esTitulo: false,
        numero: himnoActivo.numero,
        titulo: tituloLimpio,
        verso: estrofa.verso,
        estrofaIndex: estrofaIndex,
        totalEstrofas: himnoActivo.estrofas.length,
        seccionActual: estrofaIndex, // El índice real de la estrofa
        totalSecciones: himnoActivo.estrofas.length - 1 // -1 porque la primera es el título
      }
    });
  }
  
  console.log('📤 Estrofa enviada al proyector:', {
    index: estrofaIndex,
    esTitulo: esTitulo,
    texto: esTitulo ? `${himnoActivo.numero} | ${tituloLimpio}` : estrofa.texto,
    verso: esTitulo ? 'Título' : estrofa.verso
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
    controlBiblia: document.getElementById('controlBiblia'),
    controlHimnario: document.getElementById('controlHimnario'),
    versionBiblia: document.getElementById('versionBiblia'),
    buscarLibro: document.getElementById('buscarLibro'),
    sugerenciasLibros: document.getElementById('sugerenciasLibros'),
    grillaCapitulos: document.getElementById('grillaCapitulos'),
    grillaVersiculos: document.getElementById('grillaVersiculos'),
    buscarHimno: document.getElementById('buscarHimno'),
    listaHimnos: document.getElementById('listaHimnos'),
    vistaPrevia: document.getElementById('vistaPrevia'),
    anterior: document.getElementById('anterior'),
    siguiente: document.getElementById('siguiente'),
    reproductorAudio: document.getElementById('reproductorAudio'),
    btnCantado: document.getElementById('btnCantado'),
    btnInstrumental: document.getElementById('btnInstrumental'),
    btnSoloLetra: document.getElementById('btnSoloLetra')
  };

  console.log('✅ Referencias a elementos obtenidas');

  // --- Configuración Panel ---
  const btnConfig = document.getElementById('btnConfig');
  const configModal = document.getElementById('configModal');
  const cerrarConfig = document.getElementById('cerrarConfig');
  const sliderFontsizeBiblia = document.getElementById('sliderFontsizeBiblia');
  const fontsizeValueBiblia = document.getElementById('fontsizeValueBiblia');
  const sliderFontsizeHimnario = document.getElementById('sliderFontsizeHimnario');
  const fontsizeValueHimnario = document.getElementById('fontsizeValueHimnario');
  const switchSoloReferencia = document.getElementById('switchSoloReferencia');
  const opcionSoloReferencia = document.getElementById('opcionSoloReferencia');
  const sliderFontBibliaContainer = document.getElementById('sliderFontBibliaContainer');
  const sliderFontHimnarioContainer = document.getElementById('sliderFontHimnarioContainer');

  // Cargar configuración guardada
  let config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
  sliderFontsizeBiblia.value = config.fontsizeBiblia || 5;
  fontsizeValueBiblia.textContent = (config.fontsizeBiblia || 5) + 'vw';
  sliderFontsizeHimnario.value = config.fontsizeHimnario || 5;
  fontsizeValueHimnario.textContent = (config.fontsizeHimnario || 5) + 'vw';
  switchSoloReferencia.checked = !!config.soloReferencia;

  // Mostrar/ocultar sliders según modo
  function actualizarOpcionesModo() {
    const esBiblia = esModoBiblia();
    opcionSoloReferencia.style.display = esBiblia ? '' : 'none';
    sliderFontBibliaContainer.style.display = esBiblia ? '' : 'none';
    sliderFontHimnarioContainer.style.display = esBiblia ? 'none' : '';
  }
  
  // Hacer la función global para poder llamarla desde otras funciones
  window.actualizarOpcionesModo = actualizarOpcionesModo;
  
  actualizarOpcionesModo();

  // Abrir modal
  btnConfig.addEventListener('click', () => {
    configModal.style.display = 'flex';
  });
  // Cerrar modal
  cerrarConfig.addEventListener('click', () => {
    configModal.style.display = 'none';
  });
  configModal.addEventListener('click', (e) => {
    if (e.target === configModal) configModal.style.display = 'none';
  });

  // Slider de fuente Biblia
  sliderFontsizeBiblia.addEventListener('input', () => {
    fontsizeValueBiblia.textContent = sliderFontsizeBiblia.value + 'vw';
    config.fontsizeBiblia = parseFloat(sliderFontsizeBiblia.value);
    guardarYEnviarConfig();
  });

  // Slider de fuente Himnario
  sliderFontsizeHimnario.addEventListener('input', () => {
    fontsizeValueHimnario.textContent = sliderFontsizeHimnario.value + 'vw';
    config.fontsizeHimnario = parseFloat(sliderFontsizeHimnario.value);
    guardarYEnviarConfig();
  });
  // Switch solo referencia
  switchSoloReferencia.addEventListener('change', () => {
    config.soloReferencia = switchSoloReferencia.checked;
    guardarYEnviarConfig();
  });
  

  function guardarYEnviarConfig() {
    localStorage.setItem('proyectorConfig', JSON.stringify(config));
    // Enviar config al proyector según modo
    const esBiblia = esModoBiblia();
    const configEnviar = {
      fontsize: esBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
      soloReferencia: esBiblia ? config.soloReferencia : null
    };
    console.log('🔧 guardarYEnviarConfig llamada:', {
      config,
      esBiblia,
      configEnviar
    });
    enviarMensajeProyector('config', configEnviar);
  }
  // Enviar config inicial al abrir proyector
  if (proyectorWindow && !proyectorWindow.closed) {
    const esBiblia = esModoBiblia();
    const configEnviar = {
      fontsize: esBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
      soloReferencia: esBiblia ? config.soloReferencia : null
    };
    enviarMensajeProyector('config', configEnviar);
  }
  // Enviar config cada vez que se abre el proyector
  const originalAbrirProyector = abrirProyector;
  window.abrirProyector = function() {
    originalAbrirProyector();
    setTimeout(() => {
      const esBiblia = esModoBiblia();
      const configEnviar = {
        fontsize: esBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
        soloReferencia: esBiblia ? config.soloReferencia : null
      };
      enviarMensajeProyector('config', configEnviar);
    }, 500);
  };

  // Configurar eventos
  configurarEventos();

  // Cargar datos iniciales
  await cargarDatosIniciales();
  
  // Establecer modo inicial
  cambiarModo();

  // Inicializar modo de audio
  inicializarAudioMode();
  
  console.log('✅ Función inicializar() completada exitosamente');
  console.log('🔌 Estado final del socket:', {
    existe: typeof window.socket !== 'undefined',
    socket: window.socket,
    conectado: window.socket ? window.socket.connected : 'N/A'
  });
}

/**
 * Configura todos los event listeners
 */
function configurarEventos() {
  // Botón abrir proyector
  elementos.abrirProyector.addEventListener('click', abrirProyector);

  // Eventos modo Biblia
  elementos.versionBiblia.addEventListener('change', cambiarVersionBiblia);
  elementos.buscarLibro.addEventListener('keyup', function(e) {
    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
    filtrarLibros();
  });
  elementos.sugerenciasLibros.addEventListener('click', seleccionarLibro);
  // Navegación con teclado en sugerencias de libros
  elementos.buscarLibro.addEventListener('keydown', manejarTeclasSugerenciasLibros);
  elementos.grillaCapitulos.addEventListener('click', seleccionarCapitulo);
  elementos.grillaVersiculos.addEventListener('click', seleccionarVersiculo);

  // Eventos modo Himnario
  elementos.buscarHimno.addEventListener('keyup', function(e) {
    if (["ArrowUp", "ArrowDown", "Enter"].includes(e.key)) return;
    filtrarHimnos();
  });
  elementos.listaHimnos.addEventListener('click', seleccionarHimno);
  // Navegación con teclado en lista de himnos
  elementos.buscarHimno.addEventListener('keydown', manejarTeclasListaHimnos);

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
    if (!elementos.buscarLibro.contains(event.target) && !elementos.sugerenciasLibros.contains(event.target)) {
      elementos.sugerenciasLibros.style.display = 'none';
    }
  });

  // En configurarEventos, agregar este event listener:
  elementos.buscarLibro.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      // Si ya hay libro, capítulo y versículo válidos, lanzar al proyector
      const texto = elementos.buscarLibro.value.toLowerCase().trim();
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
        enviarVersiculoAlProyector(versiculoActivoIndex);
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
    
    // Cargar índice de himnos
    console.log('🎵 Cargando índice de himnos...');
    console.log('🔍 getHymnIndex disponible:', typeof getHymnIndex !== 'undefined' ? 'Sí' : 'No');
    
    indiceHimnos = await getHymnIndex();
    console.log('✅ Índice de himnos cargado:', indiceHimnos ? indiceHimnos.length + ' himnos' : 'No disponible');
    
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
    
    // Cambiar el texto del botón
    const boton = document.getElementById('abrirProyector');
    if (boton) {
      boton.textContent = '✅ Proyección Abierta';
      boton.style.background = '#28a745';
      boton.style.color = 'white';
      
      // Restaurar después de 3 segundos
      setTimeout(() => {
        boton.textContent = 'Abrir Ventana de Proyección';
        boton.style.background = '';
        boton.style.color = '';
      }, 3000);
    }
  } else {
    // Si es PC, comportamiento normal
  if (proyectorWindow && !proyectorWindow.closed) {
    proyectorWindow.focus();
  } else {
    proyectorWindow = window.open('proyector.html', 'proyector', 'width=800,height=600');
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
function cambiarModo() {
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
  } else {
    elementos.controlBiblia.style.display = 'none';
    elementos.controlHimnario.style.display = 'block';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/himno-bg.mp4' });
  }
  
  // Actualizar opciones del panel de configuración según el modo
  if (typeof window.actualizarOpcionesModo === 'function') {
    window.actualizarOpcionesModo();
  }
  
  // Enviar configuración actualizada según el modo
  const config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
  const configEnviar = {
    fontsize: esBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
    soloReferencia: esBiblia ? config.soloReferencia : null
  };
  enviarMensajeProyector('config', configEnviar);
}

/**
 * Función global para cambiar modo desde el foot navbar
 * Esta función se puede llamar desde index.html
 */
function cambiarModoGlobal(modo) {
  console.log('🔄 Cambiando modo global a:', modo);
  
  // Actualizar el estado global
  window.modoActual = modo;
  
  // Limpiar todo ANTES de cambiar el modo
  limpiarVistaPrevia();
  limpiarProyector();
  limpiarCamposBusqueda();
  
  // Actualizar la interfaz
  if (modo === 'himnario') {
    elementos.controlHimnario.style.display = 'block';
    elementos.controlBiblia.style.display = 'none';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/himno-bg.mp4' });
    console.log('🎵 Modo Himnario activado - Video: /src/assets/videos/himno-bg.mp4');
  } else {
    elementos.controlBiblia.style.display = 'block';
    elementos.controlHimnario.style.display = 'none';
    enviarMensajeProyector('change_mode', { videoSrc: '/src/assets/videos/verso-bg.mp4' });
    ocultarPlayFooter();
    console.log('📖 Modo Biblia activado - Video: /src/assets/videos/verso-bg.mp4');
  }
  
  // Actualizar opciones del panel de configuración según el modo
  if (typeof window.actualizarOpcionesModo === 'function') {
    window.actualizarOpcionesModo();
  }
  
  // Enviar configuración actualizada según el modo
  const config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
  const configEnviar = {
    fontsize: modo === 'biblia' ? config.fontsizeBiblia : config.fontsizeHimnario,
    soloReferencia: modo === 'biblia' ? config.soloReferencia : null
  };
  enviarMensajeProyector('config', configEnviar);
  
  console.log('✅ Cambio de modo completado');
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
  const texto = elementos.buscarLibro.value.toLowerCase().trim();
  if (texto.length === 0) {
    elementos.sugerenciasLibros.style.display = 'none';
    libroSugeridoIndex = -1;
    return;
  }

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

  // Buscar libros que coincidan con el nombre
  const libros = Object.keys(bibliaActual);
  const filtrados = libros.filter(libro => 
    libro.toLowerCase().includes(nombreLibro)
  );
  libroSugeridoIndex = filtrados.length > 0 ? 0 : -1;

  // Si el input termina con un espacio después del nombre del libro (ignorando el espacio entre número y nombre)
  const terminaConEspacio = /^(\d+\s)?[\wáéíóúüñ]+\s$/i.test(elementos.buscarLibro.value);
  if (terminaConEspacio) {
    elementos.sugerenciasLibros.style.display = 'none';
  } else {
    mostrarSugerenciasLibros(filtrados);
  }

  // Selección automática de libro/capítulo/versículo en tiempo real
  const libro = libros.find(l => l.toLowerCase() === nombreLibro);
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
    const inputRect = elementos.buscarLibro.getBoundingClientRect();
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
    elementos.buscarLibro.value = libro;
    elementos.sugerenciasLibros.style.display = 'none';
    renderizarGrillaCapitulos(libro);
    libroSugeridoIndex = -1;
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
}

/**
 * Selecciona un capítulo
 */
function seleccionarCapitulo(event) {
  if (event.target.dataset.capitulo) {
    const capituloIndex = parseInt(event.target.dataset.capitulo);
    capituloActivo = capituloIndex;
    
    // Resaltar capítulo seleccionado
    elementos.grillaCapitulos.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    cargarCapitulo(libroActivo, capituloIndex);
    renderizarGrillaVersiculos();
  }
}

/**
 * Carga un capítulo en la vista previa
 */
function cargarCapitulo(libro, capituloIndex) {
  elementos.vistaPrevia.innerHTML = '';
  const capítulo = bibliaActual[libro][capituloIndex];
  
  capítulo.forEach((versiculo, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.versiculo = index;
    card.innerHTML = `<strong>${versiculo.verse}</strong> ${versiculo.text}`;
    elementos.vistaPrevia.appendChild(card);
  });
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
function seleccionarVersiculo(event) {
  if (event.target.dataset.versiculo) {
    const versiculoIndex = parseInt(event.target.dataset.versiculo);
    versiculoActivoIndex = versiculoIndex;
    
    // Resaltar versículo seleccionado
    elementos.grillaVersiculos.querySelectorAll('button').forEach(btn => {
      btn.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    resaltarCard(versiculoIndex);
    enviarVersiculoAlProyector(versiculoIndex);
  }
}

/**
 * Filtra himnos según el texto ingresado
 */
async function filtrarHimnos() {
  const texto = elementos.buscarHimno.value;
  const textoNormalizado = normalizarTexto(texto.toLowerCase());

  // Si el usuario busca solo por número
  const esNumero = /^\d+$/.test(textoNormalizado);

  // Preparamos una lista de himnos con su relevancia
  let himnosConRelevancia = indiceHimnos.map(himno => {
    const tituloNormalizado = normalizarTexto(himno.title.toLowerCase());
    let relevancia = 1000; // valor alto por defecto
    let posicion = tituloNormalizado.length;

    // Coincidencia exacta (título completo)
    if (tituloNormalizado === textoNormalizado) {
      relevancia = 0;
      posicion = 0;
    } else if (esNumero && himno.number === textoNormalizado.padStart(3, '0')) {
      // Coincidencia exacta por número
      relevancia = 0;
      posicion = 0;
    } else if (tituloNormalizado.includes(textoNormalizado)) {
      // Coincidencia parcial en el título
      relevancia = 1;
      posicion = tituloNormalizado.indexOf(textoNormalizado);
    } else if (himno.number.includes(textoNormalizado)) {
      // Coincidencia parcial en el número
      relevancia = 2;
      posicion = 0;
    }
    return { ...himno, relevancia, posicion };
  });

  // Filtrar solo los que tienen alguna coincidencia
  himnosConRelevancia = himnosConRelevancia.filter(h => h.relevancia < 1000);

  // Ordenar por relevancia y posición de la coincidencia
  himnosConRelevancia.sort((a, b) => {
    if (a.relevancia !== b.relevancia) return a.relevancia - b.relevancia;
    if (a.posicion !== b.posicion) return a.posicion - b.posicion;
    // Si todo es igual, ordenar por número
    return a.number.localeCompare(b.number);
  });

  himnoSugeridoIndex = -1; // Reiniciar selección al filtrar
  await mostrarListaHimnos(himnosConRelevancia);
}

/**
 * Muestra la lista de himnos filtrados
 */
async function mostrarListaHimnos(himnos) {
  elementos.listaHimnos.innerHTML = '';
  
  // Filtrar himnos que realmente existen
  const himnosValidos = [];
  for (const himno of himnos) {
    try {
      const response = await fetch(`/src/assets/himnos/letra/${himno.file}`, { method: 'HEAD' });
      if (response.ok) {
        himnosValidos.push(himno);
      } else {
        console.warn(`Himno no encontrado: ${himno.file}`);
      }
    } catch (error) {
      console.warn(`Error al verificar himno ${himno.file}:`, error);
    }
  }
  
  // Mostrar solo los himnos válidos
  himnosValidos.slice(0, 20).forEach((himno, idx) => {
    const div = document.createElement('div');
    div.textContent = `${himno.number} - ${himno.title}`;
    div.dataset.himno = himno.file;
    if (idx === himnoSugeridoIndex) div.classList.add('selected');
    elementos.listaHimnos.appendChild(div);
  });
  
  if (himnosValidos.length > 0) {
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
      // Cargar el himno
      himnoActivo = await parseHymn(himnoFile);
      if (himnoActivo) {
        // Limpiar el título (remover "Himno #" si existe)
        const tituloLimpio = himnoActivo.titulo.replace(/^Himno\s*#?\d*\s*/, '').trim();
        
        // Actualizar el input con el título del himno
        elementos.buscarHimno.value = `${himnoActivo.numero} - ${tituloLimpio}`;
        elementos.listaHimnos.style.display = 'none';
        himnoSugeridoIndex = -1;
        
        // Cargar en vista previa
        cargarHimnoEnVistaPrevia();
        
        // Enviar título al proyector
        enviarEstrofaAlProyector(0);
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
  
  // Limpiar el título (remover "Himno #" si existe)
  const tituloLimpio = himnoActivo.titulo.replace(/^Himno\s*#?\d*\s*/, '').trim();
  
  himnoActivo.estrofas.forEach((estrofa, index) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.estrofa = index;
  
    if (index === 0) {
      // Es el título
      card.innerHTML = `<strong>${himnoActivo.numero} | ${tituloLimpio}</strong>`;
    } else {
      // Es una estrofa
      const versoText = estrofa.verso === 'coro' ? 'Coro' : `Verso ${estrofa.verso}`;
      card.innerHTML = `<strong>${versoText}</strong><br>${estrofa.texto}`;
    }
    
    elementos.vistaPrevia.appendChild(card);
    
    // Agregar evento de clic
    card.addEventListener('click', manejarClicCard);
  });
  
  // Seleccionar la primera estrofa por defecto (título)
  estrofaActivaIndex = 0;
  resaltarCard(0);
  
  // Mostrar el botón de reproducción
  actualizarBotonPlayHimno();
}

/**
 * Maneja el clic en una card de estrofa/versículo
 */
function manejarClicCard(event) {
  const card = event.currentTarget;
  const estrofaIndex = parseInt(card.dataset.estrofa);
  
  if (esModoBiblia()) {
    // Modo Biblia
    versiculoActivoIndex = estrofaIndex;
    resaltarCard(estrofaIndex);
    enviarVersiculoAlProyector(estrofaIndex);
  } else {
    // Modo Himnario
    estrofaActivaIndex = estrofaIndex;
    resaltarCard(estrofaIndex);
    enviarEstrofaAlProyector(estrofaIndex);
  }
}

/**
 * Actualiza el botón de play del himno
 */
function actualizarBotonPlayHimno() {
  if (!himnoActivo) {
    ocultarPlayFooter();
    return;
  }
  
  // Verificar si existe audio para este himno
  const numeroFormateado = himnoActivo.numero.padStart(3, '0');
  const rutaAudio = construirRutaAudio(numeroFormateado, himnoActivo.titulo);
  
  // Mostrar botón de play
  const playHimnoFooter = document.getElementById('playHimnoFooter');
  if (playHimnoFooter) {
    playHimnoFooter.style.display = 'block';
    
    // Actualizar el estado del botón según si está sonando o no
    if (himnoSonando) {
      playHimnoFooter.textContent = '⏹️ Detener Himno';
      playHimnoFooter.style.background = '#dc3545';
    } else {
      playHimnoFooter.textContent = '▶️ Reproducir Himno';
      playHimnoFooter.style.background = '#28a745';
    }
  }
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
      playHimnoFooter.textContent = '▶️ Reproducir Himno';
      playHimnoFooter.style.background = '#28a745';
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
        playHimnoFooter.textContent = '⏹️ Detener Himno';
        playHimnoFooter.style.background = '#dc3545';
      }
      
      console.log('✅ Comando de reproducción enviado al proyector');
      
    } catch (error) {
      console.error('❌ Error al reproducir himno:', error);
    }
  }
}

/**
 * Navega entre estrofas/versículos
 */
function navegar(direccion) {
  if (esModoBiblia()) {
    // Modo Biblia
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
    enviarVersiculoAlProyector(versiculoActivoIndex);
  } else {
    // Modo Himnario
    if (!himnoActivo || estrofaActivaIndex < 0) return;
    
    const totalEstrofas = himnoActivo.estrofas.length;
    
    estrofaActivaIndex += direccion;
    
    if (estrofaActivaIndex < 0) {
      estrofaActivaIndex = totalEstrofas - 1;
    } else if (estrofaActivaIndex >= totalEstrofas) {
      estrofaActivaIndex = 0;
    }
    
    // Resaltar la card seleccionada
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
      card.classList.toggle('selected', index === estrofaActivaIndex);
    });
    
    enviarEstrofaAlProyector(estrofaActivaIndex);
  }
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
  if (elementos.buscarLibro) {
    elementos.buscarLibro.value = '';
  }
  if (elementos.buscarHimno) {
    elementos.buscarHimno.value = '';
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
    const sugerencias = document.querySelectorAll('.sugerenciasLibros div');
    let index = Array.from(sugerencias).findIndex(div => div.classList.contains('selected'));
    
    if (event.key === "ArrowUp") {
      index = (index - 1 + sugerencias.length) % sugerencias.length;
    } else if (event.key === "ArrowDown") {
      index = (index + 1) % sugerencias.length;
    } else if (event.key === "Enter") {
      const selectedDiv = sugerencias[index];
      if (selectedDiv) {
        seleccionarLibro({ type: 'click', selectedDiv });
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
    const himnos = document.querySelectorAll('.listaHimnos div');
    let index = Array.from(himnos).findIndex(div => div.classList.contains('selected'));
    
    if (event.key === "ArrowUp") {
      index = (index - 1 + himnos.length) % himnos.length;
    } else if (event.key === "ArrowDown") {
      index = (index + 1) % himnos.length;
    } else if (event.key === "Enter") {
      const selectedDiv = himnos[index];
      if (selectedDiv) {
        seleccionarHimno({ type: 'click', target: selectedDiv });
      }
    }
    
  himnos.forEach((div, idx) => {
      div.classList.toggle('selected', idx === index);
    });
  }
}

// Hacer la función cambiarModoGlobal disponible globalmente
window.cambiarModoGlobal = cambiarModoGlobal;

// Inicializar la aplicación cuando el DOM esté listo
console.log('📋 DOM cargado, iniciando aplicación...');
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎯 DOMContentLoaded disparado, llamando a inicializar()...');
  inicializar().catch(error => {
    console.error('❌ Error al inicializar la aplicación:', error);
  });
});