// 1. Conectarse al canal de comunicación
const channel = new BroadcastChannel('proyector_channel');
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');

// 2. Escuchar mensajes
channel.onmessage = (event) => {
    const data = event.data; // { tipo, texto, ref, videoSrc, config, soloReferencia }

    if (data.tipo === 'update_text') {
        // Aplicar transición suave
        textoPrincipal.classList.add('fade-out');
        referencia.classList.add('fade-out');
        
        setTimeout(() => {
            if (data.soloReferencia) {
                textoPrincipal.innerHTML = data.texto;
                referencia.style.display = 'none';
            } else {
                textoPrincipal.innerHTML = data.texto;
                referencia.textContent = data.ref;
                referencia.style.display = '';
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