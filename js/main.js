// main.js
import { getBibleVersions, parseBible, getHymnIndex, parseHymn } from './dataManager.js';

// Variables globales
let proyectorWindow = null;
let channel = null;
let bibliaActual = null;
let indiceHimnos = [];
let capituloActivo = null;
let versiculoActivoIndex = -1;
let estrofaActivaIndex = -1;
let libroActivo = null;
let himnoActivo = null;

// Referencias a elementos del DOM
let elementos = {};

// Variable global para saber si está sonando el himno
let himnoSonando = false;
let fadeOutTimeout = null;

/**
 * Inicializa la aplicación
 */
async function inicializar() {
  // Obtener referencias a elementos del DOM
  elementos = {
    abrirProyector: document.getElementById('abrirProyector'),
    modoSwitch: document.getElementById('modoSwitch'),
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
    reproductorAudio: document.getElementById('reproductorAudio')
  };

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
    const esModoBiblia = elementos.modoSwitch.checked;
    opcionSoloReferencia.style.display = esModoBiblia ? '' : 'none';
    sliderFontBibliaContainer.style.display = esModoBiblia ? '' : 'none';
    sliderFontHimnarioContainer.style.display = esModoBiblia ? 'none' : '';
  }
  actualizarOpcionesModo();
  elementos.modoSwitch.addEventListener('change', actualizarOpcionesModo);

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
    const esModoBiblia = elementos.modoSwitch.checked;
    const configEnviar = {
      fontsize: esModoBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
      soloReferencia: esModoBiblia ? config.soloReferencia : null
    };
    channel.postMessage({ tipo: 'config', config: configEnviar });
  }
  // Enviar config inicial al abrir proyector
  if (proyectorWindow && !proyectorWindow.closed) {
    const esModoBiblia = elementos.modoSwitch.checked;
    const configEnviar = {
      fontsize: esModoBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
      soloReferencia: esModoBiblia ? config.soloReferencia : null
    };
    channel.postMessage({ tipo: 'config', config: configEnviar });
  }
  // Enviar config cada vez que se abre el proyector
  const originalAbrirProyector = abrirProyector;
  window.abrirProyector = function() {
    originalAbrirProyector();
    setTimeout(() => {
      const esModoBiblia = elementos.modoSwitch.checked;
      const configEnviar = {
        fontsize: esModoBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
        soloReferencia: esModoBiblia ? config.soloReferencia : null
      };
      channel.postMessage({ tipo: 'config', config: configEnviar });
    }, 500);
  };

  // Inicializar BroadcastChannel
  channel = new BroadcastChannel('proyector_channel');

  // Configurar eventos
  configurarEventos();

  // Cargar datos iniciales
  await cargarDatosIniciales();
  
  // Establecer modo inicial
  cambiarModo();
}

/**
 * Configura todos los event listeners
 */
function configurarEventos() {
  // Botón abrir proyector
  elementos.abrirProyector.addEventListener('click', abrirProyector);

  // Switch de modo
  elementos.modoSwitch.addEventListener('change', cambiarModo);

  // Eventos modo Biblia
  elementos.versionBiblia.addEventListener('change', cambiarVersionBiblia);
  elementos.buscarLibro.addEventListener('keyup', filtrarLibros);
  elementos.buscarLibro.addEventListener('focus', () => {
    if (bibliaActual) {
      mostrarSugerenciasLibros();
    }
  });
  elementos.sugerenciasLibros.addEventListener('click', seleccionarLibro);
  elementos.grillaCapitulos.addEventListener('click', seleccionarCapitulo);
  elementos.grillaVersiculos.addEventListener('click', seleccionarVersiculo);

  // Eventos modo Himnario
  elementos.buscarHimno.addEventListener('keyup', filtrarHimnos);
  elementos.listaHimnos.addEventListener('click', seleccionarHimno);

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
}

/**
 * Carga los datos iniciales de la aplicación
 */
async function cargarDatosIniciales() {
  try {
    // Cargar versiones de Biblia
    const versiones = await getBibleVersions();
    elementos.versionBiblia.innerHTML = '<option value="">Selecciona una versión</option>';
    versiones.forEach(version => {
      const option = document.createElement('option');
      option.value = version.file;
      option.textContent = version.description;
      elementos.versionBiblia.appendChild(option);
    });

    // Cargar índice de himnos
    indiceHimnos = await getHymnIndex();
  } catch (error) {
    console.error('Error al cargar datos iniciales:', error);
  }
}

/**
 * Abre la ventana del proyector
 */
function abrirProyector() {
  if (proyectorWindow && !proyectorWindow.closed) {
    proyectorWindow.focus();
  } else {
    proyectorWindow = window.open('proyector.html', 'proyector', 'width=800,height=600');
  }
}

/**
 * Cambia entre modo Biblia e Himnario
 */
function cambiarModo() {
  const esModoBiblia = elementos.modoSwitch.checked;
  
  if (esModoBiblia) {
    elementos.controlBiblia.style.display = 'block';
    elementos.controlHimnario.style.display = 'none';
    channel.postMessage({ 
      tipo: 'change_mode', 
      videoSrc: 'assets/videos/verso-bg.mkv' 
    });
    ocultarPlayFooter();
  } else {
    elementos.controlBiblia.style.display = 'none';
    elementos.controlHimnario.style.display = 'block';
    channel.postMessage({ 
      tipo: 'change_mode', 
      videoSrc: 'assets/videos/himno-bg.mp4' 
    });
  }
  
  // Enviar configuración actualizada según el modo
  const config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
  const configEnviar = {
    fontsize: esModoBiblia ? config.fontsizeBiblia : config.fontsizeHimnario,
    soloReferencia: esModoBiblia ? config.soloReferencia : null
  };
  channel.postMessage({ tipo: 'config', config: configEnviar });
  
  limpiarVistaPrevia();
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
    return;
  }
  
  const libros = Object.keys(bibliaActual);
  const filtrados = libros.filter(libro => 
    libro.toLowerCase().includes(texto)
  );
  
  mostrarSugerenciasLibros(filtrados);
}

/**
 * Muestra sugerencias de libros
 */
function mostrarSugerenciasLibros(libros = null) {
  elementos.sugerenciasLibros.innerHTML = '';
  
  if (!bibliaActual) return;
  
  const librosAMostrar = libros || Object.keys(bibliaActual).slice(0, 10);
  
  librosAMostrar.forEach(libro => {
    const div = document.createElement('div');
    div.textContent = libro;
    div.dataset.libro = libro;
    elementos.sugerenciasLibros.appendChild(div);
  });
  
  if (librosAMostrar.length > 0) {
    elementos.sugerenciasLibros.style.display = 'block';
    
    // Posicionar las sugerencias debajo del input
    const inputRect = elementos.buscarLibro.getBoundingClientRect();
    elementos.sugerenciasLibros.style.top = (inputRect.bottom + 5) + 'px';
    elementos.sugerenciasLibros.style.left = inputRect.left + 'px';
  } else {
    elementos.sugerenciasLibros.style.display = 'none';
  }
}

/**
 * Selecciona un libro
 */
function seleccionarLibro(event) {
  if (event.target.dataset.libro) {
    const libro = event.target.dataset.libro;
    libroActivo = libro;
    elementos.buscarLibro.value = libro;
    elementos.sugerenciasLibros.style.display = 'none';
    renderizarGrillaCapitulos(libro);
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
      const response = await fetch(`assets/himnos/letra/${himno.file}`, { method: 'HEAD' });
      if (response.ok) {
        himnosValidos.push(himno);
      } else {
        console.warn(`Himno no encontrado: ${himno.file}`);
      }
    } catch (error) {
      console.warn(`Error al verificar himno ${himno.file}:`, error);
    }
  }
  
  if (himnosValidos.length === 0) {
    elementos.listaHimnos.innerHTML = '<div style="padding: 1em; color: #888;">No se encontraron himnos</div>';
    return;
  }
  
  himnosValidos.forEach(himno => {
    const div = document.createElement('div');
    div.innerHTML = `<strong>${himno.number}</strong> - ${himno.title}`;
    div.dataset.himno = himno.file;
    elementos.listaHimnos.appendChild(div);
  });
}

/**
 * Selecciona un himno
 */
async function seleccionarHimno(event) {
  if (event.target.dataset.himno) {
    const himnoFile = event.target.dataset.himno;
    // Obtener el título del himno seleccionado desde el elemento
    const himnoDiv = event.target.closest('div');
    if (himnoDiv) {
      // El texto del div es "<strong>NUM</strong> - TÍTULO"
      // Extraemos el título después del guion
      const textoDiv = himnoDiv.textContent;
      const partes = textoDiv.split(' - ');
      if (partes.length > 1) {
        elementos.buscarHimno.value = partes[1].trim();
      } else {
        elementos.buscarHimno.value = textoDiv.trim();
      }
    }
    // Ocultar la lista de resultados
    elementos.listaHimnos.innerHTML = '';
    try {
      console.log('Cargando himno:', himnoFile);
      himnoActivo = await parseHymn(himnoFile);
      if (himnoActivo) {
        console.log('Himno cargado exitosamente:', himnoActivo.titulo);
        cargarHimnoEnVistaPrevia();
      } else {
        console.error('No se pudo cargar el himno:', himnoFile);
        // Mostrar mensaje de error en la vista previa
        elementos.vistaPrevia.innerHTML = `
          <div class="card" style="color: #f44336;">
            <strong>Error:</strong> No se pudo cargar el himno "${himnoFile}"
          </div>
        `;
        ocultarPlayFooter();
      }
    } catch (error) {
      console.error('Error al cargar el himno:', error);
      // Mostrar mensaje de error en la vista previa
      elementos.vistaPrevia.innerHTML = `
        <div class="card" style="color: #f44336;">
          <strong>Error:</strong> ${error.message}
        </div>
      `;
      ocultarPlayFooter();
    }
  }
}

/**
 * Carga un himno en la vista previa
 */
function cargarHimnoEnVistaPrevia() {
  elementos.vistaPrevia.innerHTML = '';
  
  // Extraer número del título
  let numero = himnoActivo.numero;
  if (!numero && himnoActivo.titulo) {
    const match = himnoActivo.titulo.match(/Himno #(\d+)/);
    if (match) {
      numero = match[1];
    }
  }
  
  // Si no se pudo extraer el número, usar 001 como fallback
  if (!numero) {
    numero = '001';
  }
  
  // Formatear el número con ceros a la izquierda
  const numeroFormateado = numero.padStart(3, '0');
  
  // Extraer título sin el prefijo "Himno #X"
  let titulo = himnoActivo.titulo;
  if (titulo) {
    titulo = titulo.replace(/^Himno #\d+\s*/, '').trim();
  }
  
  // Título del himno (sin botón play)
  const tituloCard = document.createElement('div');
  tituloCard.className = 'card';
  tituloCard.dataset.estrofa = -1;
  tituloCard.innerHTML = `<strong>${titulo}</strong>`;
  elementos.vistaPrevia.appendChild(tituloCard);
  
  // Estrofas
  if (himnoActivo.estrofas && himnoActivo.estrofas.length > 0) {
    himnoActivo.estrofas.forEach((estrofa, index) => {
      const card = document.createElement('div');
      card.className = 'card';
      card.dataset.estrofa = index;
      card.textContent = estrofa;
      elementos.vistaPrevia.appendChild(card);
    });
  } else {
    // Si no hay estrofas, mostrar mensaje
    const card = document.createElement('div');
    card.className = 'card';
    card.textContent = 'No se encontraron estrofas para este himno';
    elementos.vistaPrevia.appendChild(card);
  }

  // Mostrar el botón play en el footer
  const playBtn = document.getElementById('playHimnoFooter');
  if (playBtn) playBtn.style.display = '';
}

/**
 * Maneja clics en cards de la vista previa
 */
function manejarClicCard(event) {
  const card = event.target.closest('.card');
  if (!card) return;
  const estrofaIndex = parseInt(card.dataset.estrofa);
  const versiculoIndex = parseInt(card.dataset.versiculo);
  if (!isNaN(estrofaIndex)) {
    // Modo Himnario
    estrofaActivaIndex = estrofaIndex;
    resaltarCard(estrofaIndex + 1);
    enviarEstrofaAlProyector(estrofaIndex);
  } else if (!isNaN(versiculoIndex)) {
    // Modo Biblia
    versiculoActivoIndex = versiculoIndex;
    resaltarCard(versiculoIndex);
    enviarVersiculoAlProyector(versiculoIndex);
  }
}

/**
 * Resalta una card seleccionada
 */
function resaltarCard(index) {
  // Remover selección anterior
  document.querySelectorAll('.card.selected').forEach(card => {
    card.classList.remove('selected');
  });
  // Seleccionar nueva card
  const cards = elementos.vistaPrevia.querySelectorAll('.card');
  if (cards[index]) {
    cards[index].classList.add('selected');
  }
}

/**
 * Envía un versículo al proyector
 */
function enviarVersiculoAlProyector(versiculoIndex) {
  const capítulo = bibliaActual[libroActivo][capituloActivo];
  const versiculo = capítulo[versiculoIndex];
  const referencia = `${libroActivo} ${capituloActivo + 1}:${versiculo.verse}`;

  // Leer config
  let config = JSON.parse(localStorage.getItem('proyectorConfig')) || { fontsizeBiblia: 5, fontsizeHimnario: 5, soloReferencia: false };
  if (config.soloReferencia) {
    channel.postMessage({
      tipo: 'update_text',
      texto: referencia,
      ref: '',
      soloReferencia: true
    });
  } else {
    channel.postMessage({
      tipo: 'update_text',
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
  let texto = '';
  let ref = '';
  
  // Extraer número del título
  let numero = himnoActivo.numero;
  if (!numero && himnoActivo.titulo) {
    const match = himnoActivo.titulo.match(/Himno #(\d+)/);
    if (match) {
      numero = match[1];
    }
  }
  
  if (estrofaIndex === -1) {
    // Extraer título sin el prefijo "Himno #X"
    let titulo = himnoActivo.titulo;
    if (titulo) {
      titulo = titulo.replace(/^Himno #\d+\s*/, '').trim();
    }
    texto = titulo;
    ref = `Himno ${numero || ''}`;
  } else {
    texto = himnoActivo.estrofas[estrofaIndex];
    ref = `Himno ${numero || ''} - Estrofa ${estrofaIndex + 1}`;
  }
  
  // Ya no cambiamos el video aquí, solo el texto
  channel.postMessage({
    tipo: 'update_text',
    texto: texto,
    ref: ref,
    soloReferencia: false
  });
}

/**
 * Convierte un texto a formato sin tildes ni caracteres especiales
 * @param {string} texto - Texto a convertir
 * @returns {string} Texto sin tildes ni caracteres especiales
 */
function normalizarTexto(texto) {
  let resultado = texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'n')
    .replace(/[¿¡]/g, '') // Remover signos de interrogación y exclamación iniciales
    .replace(/[^a-z0-9\s]/g, '') // Dejar solo letras, números y espacios
    .replace(/\s+/g, ' ') // Reemplazar múltiples espacios con uno solo
    .trim();

  // Caso especial específico: solo para "¡Oh, jóvenes, venid!"
  if (resultado === 'oh jovenes venid') {
    resultado = 'oh jovenes venid';
  }

  return resultado;
}

/**
 * Busca el archivo de audio correcto para un himno
 * @param {string} numeroFormateado - Número del himno formateado (ej: "001")
 * @param {string} titulo - Título del himno
 * @returns {string} Ruta del archivo de audio
 */
function construirRutaAudio(numeroFormateado, titulo) {
  // Normalizar el título (sin tildes ni caracteres especiales)
  const tituloNormalizado = normalizarTexto(titulo);
  
  // Construir la ruta del archivo
  return `assets/himnos/musica/cantado/${numeroFormateado} - ${tituloNormalizado}.mp3`;
}

/**
 * Cambia el texto del botón play/stop según el estado
 */
function actualizarBotonPlayHimno() {
  const playBtn = document.getElementById('playHimnoFooter');
  if (!playBtn) return;
  if (himnoSonando) {
    playBtn.textContent = '⏹️ Stop';
  } else {
    playBtn.textContent = '▶️ Play';
  }
}

/**
 * Reproduce o detiene el audio del himno con fade out
 */
async function reproducirHimno() {
  const audio = elementos.reproductorAudio;
  if (himnoSonando) {
    // Si está sonando, hacer fade out y detener
    if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
    let fadeDuration = 1000; // ms
    let fadeSteps = 20;
    let step = 0;
    let initialVolume = audio.volume;
    function fade() {
      step++;
      audio.volume = initialVolume * (1 - step / fadeSteps);
      if (step < fadeSteps) {
        fadeOutTimeout = setTimeout(fade, fadeDuration / fadeSteps);
      } else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        himnoSonando = false;
        actualizarBotonPlayHimno();
        // Quitar selección visual de estrofa y reiniciar índice
        document.querySelectorAll('.card.selected').forEach(card => {
          card.classList.remove('selected');
        });
        estrofaActivaIndex = -1;
      }
    }
    fade();
    return;
  }

  if (!himnoActivo) return;
  // Extraer número del título
  let numero = himnoActivo.numero;
  if (!numero && himnoActivo.titulo) {
    const match = himnoActivo.titulo.match(/Himno #(\d+)/);
    if (match) {
      numero = match[1];
    }
  }
  if (!numero) {
    numero = '001';
  }
  const numeroFormateado = numero.padStart(3, '0');
  let titulo = himnoActivo.titulo;
  if (titulo) {
    titulo = titulo.replace(/^Himno #\d+\s*/, '').trim();
  }
  try {
    const audioSrc = construirRutaAudio(numeroFormateado, titulo);
    audio.src = audioSrc;
    audio.volume = 1;
    await audio.play();
    himnoSonando = true;
    actualizarBotonPlayHimno();
    // Enviar título al proyector
    enviarEstrofaAlProyector(-1);
    // Cuando termine el audio, volver a mostrar Play
    audio.onended = () => {
      himnoSonando = false;
      actualizarBotonPlayHimno();
    };
  } catch (error) {
    console.error('Error al reproducir audio:', error);
    alert(`No se pudo reproducir el audio del himno ${numeroFormateado}`);
    himnoSonando = false;
    actualizarBotonPlayHimno();
  }
}

/**
 * Navega entre elementos (anterior/siguiente)
 */
function navegar(direccion) {
  const esModoBiblia = elementos.modoSwitch.checked;
  
  if (esModoBiblia && capituloActivo !== null) {
    // Navegación en Biblia
    const capítulo = bibliaActual[libroActivo][capituloActivo];
    const nuevoIndex = versiculoActivoIndex + direccion;
    
    if (nuevoIndex >= 0 && nuevoIndex < capítulo.length) {
      versiculoActivoIndex = nuevoIndex;
      resaltarCard(nuevoIndex);
      enviarVersiculoAlProyector(nuevoIndex);
      // Resaltar el botón de la grilla de versículos
      elementos.grillaVersiculos.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('selected');
      });
      const btns = elementos.grillaVersiculos.querySelectorAll('button');
      if (btns[nuevoIndex]) {
        btns[nuevoIndex].classList.add('selected');
      }
    }
  } else if (!esModoBiblia && himnoActivo) {
    // Navegación en Himnario
    const nuevoIndex = estrofaActivaIndex + direccion;
    const maxIndex = himnoActivo.estrofas.length - 1;
    
    if (nuevoIndex >= -1 && nuevoIndex <= maxIndex) {
      estrofaActivaIndex = nuevoIndex;
      resaltarCard(nuevoIndex + 1); // +1 porque el título está en índice 0
      enviarEstrofaAlProyector(nuevoIndex);
    }
  }
}

/**
 * Limpia la vista previa
 */
function limpiarVistaPrevia() {
  elementos.vistaPrevia.innerHTML = '';
  versiculoActivoIndex = -1;
  estrofaActivaIndex = -1;
}

/**
 * Limpia las grillas
 */
function limpiarGrillas() {
  elementos.grillaCapitulos.innerHTML = '';
  elementos.grillaVersiculos.innerHTML = '';
  capituloActivo = null;
  libroActivo = null;
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', inicializar);

// Ocultar el botón play del footer si no hay himno activo
function ocultarPlayFooter() {
  const playBtn = document.getElementById('playHimnoFooter');
  if (playBtn) playBtn.style.display = 'none';
}