// 1. Conectarse al canal de comunicación
const channel = new BroadcastChannel('proyector_channel');
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');

// 2. Escuchar mensajes
channel.onmessage = (event) => {
    const data = event.data; // { tipo, texto, ref, videoSrc }

    if (data.tipo === 'update_text') {
        // Aplicar transición suave
        textoPrincipal.classList.add('fade-out');
        referencia.classList.add('fade-out');
        
        setTimeout(() => {
            textoPrincipal.innerHTML = data.texto; // Usar innerHTML para saltos de línea <br>
            referencia.textContent = data.ref;
            
            // Remover clases de fade-out para mostrar el nuevo texto
            textoPrincipal.classList.remove('fade-out');
            referencia.classList.remove('fade-out');
        }, 150); // La mitad del tiempo de transición CSS (300ms / 2)
    }

    if (data.tipo === 'change_mode') {
        videoBg.src = data.videoSrc;
    }
};