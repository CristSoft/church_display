// 1. Conectarse al canal de comunicación
const channel = new BroadcastChannel('proyector_channel');
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');
const contadorSeccion = document.getElementById('contador-seccion');
const indicadorEstrofa = document.getElementById('indicador-estrofa');

// 2. Escuchar mensajes
channel.onmessage = (event) => {
    const data = event.data; // { tipo, texto, ref, videoSrc, config, soloReferencia, himnoData }

    if (data.tipo === 'update_text') {
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
    }

    if (data.tipo === 'change_mode') {
        videoBg.src = data.videoSrc;
    }

    if (data.tipo === 'config' && data.config) {
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
};

/**
 * Muestra los indicadores específicos para himnos
 * @param {Object} himnoData - Datos del himno { esTitulo, numero, titulo, seccionActual, totalSecciones, verseActual, totalVerses }
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
        contadorSeccion.textContent = `${himnoData.seccionActual}/${himnoData.totalSecciones}`;
        contadorSeccion.style.display = '';
        contadorSeccion.classList.add('visible');
        
        // Mostrar indicador de estrofa
        if (himnoData.verseActual === 'coro') {
            indicadorEstrofa.textContent = 'Coro';
        } else {
            const totalAjustado = Math.max(1, himnoData.totalVerses - 1);
            indicadorEstrofa.textContent = `Verso ${himnoData.verseActual}/${totalAjustado}`;
        }
        indicadorEstrofa.style.display = '';
        indicadorEstrofa.classList.add('visible');
    }
}