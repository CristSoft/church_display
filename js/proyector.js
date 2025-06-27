 
// 1. Conectarse al canal de comunicación
const channel = new BroadcastChannel('proyector_channel');
const videoBg = document.getElementById('video-bg');
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');

// 2. Escuchar mensajes
channel.onmessage = (event) => {
    const data = event.data; // { tipo, texto, ref, videoSrc }

    if (data.tipo === 'update_text') {
        textoPrincipal.innerHTML = data.texto; // Usar innerHTML para saltos de línea <br>
        referencia.textContent = data.ref;
    }

    if (data.tipo === 'change_mode') {
        videoBg.src = data.videoSrc;
    }
};