// Script de depuración para estilos del proyector
// Ejecutar en la consola del navegador del proyector

console.log('🔍 Iniciando depuración de estilos...');

// Obtener elementos
const textoPrincipal = document.getElementById('texto-principal');
const referencia = document.getElementById('referencia');

if (!textoPrincipal || !referencia) {
    console.error('❌ Elementos no encontrados');
    return;
}

// Función para analizar estilos
function analizarEstilos() {
    console.log('🔍 === ANÁLISIS DE ESTILOS ===');
    
    // Estilos inline
    console.log('📋 Estilos inline:', {
        textoPrincipal: textoPrincipal.style.fontSize,
        referencia: referencia.style.fontSize
    });
    
    // Estilos computados
    const computedPrincipal = window.getComputedStyle(textoPrincipal);
    const computedRef = window.getComputedStyle(referencia);
    
    console.log('📋 Estilos computados:', {
        textoPrincipal: computedPrincipal.fontSize,
        referencia: computedRef.fontSize
    });
    
    // Verificar clases CSS
    console.log('📋 Clases CSS:', {
        textoPrincipal: textoPrincipal.className,
        referencia: referencia.className
    });
    
    // Verificar si hay estilos importantes
    console.log('📋 Estilos importantes:', {
        textoPrincipal: computedPrincipal.getPropertyPriority('font-size'),
        referencia: computedRef.getPropertyPriority('font-size')
    });
    
    // Verificar el contenedor padre
    const contenido = document.getElementById('contenido');
    console.log('📋 Contenedor padre:', {
        existe: !!contenido,
        clases: contenido ? contenido.className : 'N/A'
    });
}

// Función para aplicar estilos de prueba
function aplicarEstilosPrueba() {
    console.log('🔧 Aplicando estilos de prueba...');
    
    // Limpiar estilos inline existentes
    textoPrincipal.style.removeProperty('font-size');
    referencia.style.removeProperty('font-size');
    
    // Aplicar nuevos estilos
    textoPrincipal.style.fontSize = '8vw';
    referencia.style.fontSize = '5.6vw';
    
    console.log('✅ Estilos de prueba aplicados');
    
    // Analizar después de aplicar
    setTimeout(analizarEstilos, 200);
}

// Función para forzar la aplicación de estilos
function forzarEstilos() {
    console.log('💪 Forzando aplicación de estilos...');
    
    // Usar setProperty con !important
    textoPrincipal.style.setProperty('font-size', '10vw', 'important');
    referencia.style.setProperty('font-size', '7vw', 'important');
    
    console.log('✅ Estilos forzados aplicados');
    
    // Analizar después de aplicar
    setTimeout(analizarEstilos, 200);
}

// Función para verificar CSS
function verificarCSS() {
    console.log('🎨 Verificando reglas CSS...');
    
    // Obtener todas las reglas CSS que afectan al texto principal
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
        try {
            const rules = sheets[i].cssRules || sheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
                const rule = rules[j];
                if (rule.selectorText && rule.selectorText.includes('#texto-principal')) {
                    console.log('🎨 Regla CSS encontrada:', {
                        selector: rule.selectorText,
                        fontSize: rule.style.fontSize
                    });
                }
            }
        } catch (e) {
            // Ignorar errores de CORS
        }
    }
}

// Ejecutar análisis inicial
analizarEstilos();

// Exponer funciones globalmente
window.analizarEstilos = analizarEstilos;
window.aplicarEstilosPrueba = aplicarEstilosPrueba;
window.forzarEstilos = forzarEstilos;
window.verificarCSS = verificarCSS;

console.log('🔍 Funciones disponibles:');
console.log('- analizarEstilos() - Analiza los estilos actuales');
console.log('- aplicarEstilosPrueba() - Aplica estilos de prueba');
console.log('- forzarEstilos() - Fuerza estilos con !important');
console.log('- verificarCSS() - Verifica reglas CSS'); 