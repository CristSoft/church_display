// Script de prueba para el proyector
// Ejecutar en la consola del navegador del proyector

console.log('🧪 Iniciando prueba del proyector...');

// Verificar elementos
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');

console.log('🔍 Elementos encontrados:', {
    textoPrincipal: !!textoPrincipal,
    referencia: !!referencia
});

if (!textoPrincipal || !referencia) {
    console.error('❌ Elementos no encontrados');
    return;
}

// Función de prueba
function probarTamaños() {
    const tamanos = [3, 4, 5, 6, 7];
    let index = 0;
    
    const cambiarTamaño = () => {
        const tamaño = tamanos[index];
        
        // Aplicar estilos
        textoPrincipal.style.fontSize = tamaño + 'vw';
        referencia.style.fontSize = (tamaño * 0.7) + 'vw';
        
        // Verificar que se aplicaron
        const computedPrincipal = window.getComputedStyle(textoPrincipal);
        const computedRef = window.getComputedStyle(referencia);
        
        console.log(`🔤 Tamaño ${tamaño}vw aplicado:`, {
            principal: computedPrincipal.fontSize,
            referencia: computedRef.fontSize
        });
        
        index = (index + 1) % tamanos.length;
    };
    
    // Cambiar cada segundo
    const interval = setInterval(cambiarTamaño, 1000);
    
    // Detener después de 5 cambios
    setTimeout(() => {
        clearInterval(interval);
        console.log('✅ Prueba completada');
    }, 5000);
    
    // Ejecutar el primer cambio inmediatamente
    cambiarTamaño();
}

// Ejecutar prueba
probarTamaños(); 