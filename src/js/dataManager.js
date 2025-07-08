// dataManager.js - Script normal (no módulo)

console.log('📚 dataManager.js cargando...');

/**
 * Obtiene la lista de versiones de la Biblia disponibles.
 * @returns {Promise<Array<{file: string, description: string}>>}
 */
async function getBibleVersions() {
  try {
    // Crear un archivo de índice que liste las biblias disponibles
    // Como no podemos leer el directorio directamente desde el navegador,
    // crearemos un archivo JSON que contenga la lista de biblias
    const response = await fetch('/src/assets/biblias/biblias-disponibles.json');
    if (response.ok) {
      const data = await response.json();
      const biblias = data.biblias || [];
      const descripciones = data.descripciones || {};
      
      // Convertir archivos XML a JSON
      return biblias.map(file => ({
        file: file.replace('.xml', '.json'),
        description: descripciones[file] || file.replace('.xml', '').replace('.json', '')
      }));
    }
    
    // Fallback: lista hardcodeada basada en los archivos JSON disponibles
    const fallbackBiblias = [
      'es-DHH.json',
      'es-NTV.json', 
      'es-rv2015.json',
      'es-rv2020.json',
      'es-rv60.json'
    ];
    
    const fallbackDescripciones = {
      'es-DHH.json': 'Dios Habla Hoy',
      'es-NTV.json': 'Nueva Traducción Viviente',
      'es-rv2015.json': 'Reina Valera 2015',
      'es-rv2020.json': 'Reina Valera 2020',
      'es-rv60.json': 'Reina Valera 1960'
    };
    
    return fallbackBiblias.map(file => ({
      file: file,
      description: fallbackDescripciones[file] || file.replace('.json', '')
    }));
  } catch (error) {
    console.error('Error al cargar las versiones de la Biblia:', error);
    // Fallback: lista hardcodeada basada en los archivos JSON disponibles
    const fallbackBiblias = [
      'es-DHH.json',
      'es-NTV.json', 
      'es-rv2015.json',
      'es-rv2020.json',
      'es-rv60.json'
    ];
    
    const fallbackDescripciones = {
      'es-DHH.json': 'Dios Habla Hoy',
      'es-NTV.json': 'Nueva Traducción Viviente',
      'es-rv2015.json': 'Reina Valera 2015',
      'es-rv2020.json': 'Reina Valera 2020',
      'es-rv60.json': 'Reina Valera 1960'
    };
    
    return fallbackBiblias.map(file => ({
      file: file,
      description: fallbackDescripciones[file] || file.replace('.json', '')
    }));
  }
}

/**
 * Carga y parsea un archivo XML de una Biblia.
 * @param {string} versionFileName - Nombre del archivo XML (ej. 'RVR1960.xml')
 * @returns {Promise<Object>} Objeto con la estructura { Libro: [ [ {verse, text}, ... ], ... ] }
 */
async function parseBible(versionFileName) {
  try {
    const response = await fetch(`/src/assets/biblias/${versionFileName}`);
    
    if (!response.ok) {
      console.error(`Error al cargar el archivo JSON: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const bibleData = await response.json();
    const bible = {};
    
    console.log(`Cargando Biblia desde JSON: ${versionFileName}`);
    console.log(`Encontrados ${Object.keys(bibleData).length} libros en el JSON`);
    
    // Procesar cada libro
    for (const [bookName, chapters] of Object.entries(bibleData)) {
      console.log(`Procesando libro: ${bookName}`);
      bible[bookName] = [];
      
      // Procesar cada capítulo
      for (const [chapterNumber, verses] of Object.entries(chapters)) {
        const chapterArr = [];
        
        // Procesar cada versículo
        for (const [verseNumber, verseText] of Object.entries(verses)) {
          const verseNum = parseInt(verseNumber);
          if (!isNaN(verseNum) && verseText && verseText.trim()) {
            chapterArr.push({ 
              verse: verseNum, 
              text: verseText.trim() 
            });
          }
        }
        
        // Ordenar versículos por número
        chapterArr.sort((a, b) => a.verse - b.verse);
        bible[bookName].push(chapterArr);
      }
    }
    
    console.log('Biblia cargada exitosamente:', Object.keys(bible));
    return bible;
  } catch (err) {
    console.error('Error al parsear la Biblia JSON:', err);
    return null;
  }
}

/**
 * Obtiene el índice de himnos disponibles.
 * @returns {Promise<Array<{number: string, title: string, file: string}>>}
 */
async function getHymnIndex() {
  try {
    // Lista hardcodeada de himnos basada en los archivos disponibles
    // Esto es una solución temporal hasta que se implemente un sistema de indexación dinámica
    const himnos = [
      { number: "001", title: "Cantad alegres al Señor", file: "001 - Cantad alegres al Señor.json" },
      { number: "002", title: "Da gloria al Señor", file: "002 - Da gloria al Señor.json" },
      { number: "003", title: "Unidos en espíritu", file: "003 - Unidos en espíritu.json" },
      { number: "004", title: "Alabanzas sin cesar", file: "004 - Alabanzas sin cesar.json" },
      { number: "005", title: "A ti, glorioso Dios", file: "005 - A ti, glorioso Dios.json" },
      { number: "006", title: "¡Hosanna!", file: "006 - ¡Hosanna!.json" },
      { number: "007", title: "Oh Dios, mi soberano Rey", file: "007 - Oh Dios, mi soberano Rey.json" },
      { number: "008", title: "¡Suenen dulces himnos!", file: "008 - ¡Suenen dulces himnos!.json" },
      { number: "009", title: "Alabemos al Señor", file: "009 - Alabemos al Señor.json" },
      { number: "010", title: "Alaba al Dios de Abraham", file: "010 - Alaba al Dios de Abraham.json" },
      { number: "011", title: "Alma, bendice al Señor", file: "011 - Alma, bendice al Señor.json" },
      { number: "012", title: "Todos juntos reunidos", file: "012 - Todos juntos reunidos.json" },
      { number: "013", title: "Al Dios invisible", file: "013 - Al Dios invisible.json" },
      { number: "014", title: "Engrandecido sea Dios", file: "014 - Engrandecido sea Dios.json" },
      { number: "015", title: "Loámoste, ¡oh Dios!", file: "015 - Loámoste, ¡oh Dios!.json" },
      { number: "016", title: "A nuestro Padre Dios", file: "016 - A nuestro Padre Dios.json" },
      { number: "017", title: "Oh Padre, eterno Dios", file: "017 - Oh Padre, eterno Dios.json" },
      { number: "018", title: "Load al Padre", file: "018 - Load al Padre.json" },
      { number: "019", title: "Padre nuestro", file: "019 - Padre nuestro.json" },
      { number: "020", title: "A Dios, el Padre celestial", file: "020 - A Dios, el Padre celestial.json" },
      { number: "021", title: "Gloria sea al Padre", file: "021 - Gloria sea al Padre.json" },
      { number: "022", title: "Jehová está en su santo templo", file: "022 - Jehová está en su santo templo.json" },
      { number: "023", title: "¡Silencio! ¡Silencio!", file: "023 - ¡Silencio! ¡Silencio!.json" },
      { number: "024", title: "Imploramos tu presencia", file: "024 - Imploramos tu presencia.json" },
      { number: "025", title: "Siento la presencia del Señor", file: "025 - Siento la presencia del Señor.json" },
      { number: "026", title: "Aquí reunidos", file: "026 - Aquí reunidos.json" },
      { number: "027", title: "¡Oh Pastor divino, escucha!", file: "027 - ¡Oh Pastor divino, escucha!.json" },
      { number: "028", title: "Tu pueblo jubiloso", file: "028 - Tu pueblo jubiloso.json" },
      { number: "029", title: "Del culto el tiempo llega", file: "029 - Del culto el tiempo llega.json" },
      { number: "030", title: "Abre mis ojos", file: "030 - Abre mis ojos.json" },
      { number: "031", title: "¡Oh, Señor! al orar", file: "031 - ¡Oh, Señor! al orar.json" },
      { number: "032", title: "Nos reunimos en tu santuario", file: "032 - Nos reunimos en tu santuario.json" },
      { number: "033", title: "Tu presencia, Padre amante, invocamos", file: "033 - Tu presencia, Padre amante, invocamos.json" },
      { number: "034", title: "En momentos así", file: "034 - En momentos así.json" },
      { number: "035", title: "Oye, oh Señor", file: "035 - Oye, oh Señor.json" },
      { number: "036", title: "¡Oh, Dios, que oyes cada oración!", file: "036 - ¡Oh, Dios, que oyes cada oración!.json" },
      { number: "037", title: "Dios os guarde", file: "037 - Dios os guarde.json" },
      { number: "038", title: "Que Dios te guarde", file: "038 - Que Dios te guarde.json" },
      { number: "039", title: "Despide hoy tu grey", file: "039 - Despide hoy tu grey.json" },
      { number: "040", title: "Shalom", file: "040 - Shalom.json" },
      { number: "041", title: "Gracia, amor y comunión", file: "041 - Gracia, amor y comunión.json" },
      { number: "042", title: "Queda, Señor", file: "042 - Queda, Señor.json" },
      { number: "043", title: "Agua de vida", file: "043 - Agua de vida.json" },
      { number: "044", title: "Despídenos con tu bendición", file: "044 - Despídenos con tu bendición.json" },
      { number: "045", title: "Después, Señor", file: "045 - Después, Señor.json" },
      { number: "046", title: "Hoy amanece", file: "046 - Hoy amanece.json" },
      { number: "047", title: "Por la mañana", file: "047 - Por la mañana.json" },
      { number: "048", title: "Oh Dios, si he ofendido un corazón", file: "048 - Oh Dios, si he ofendido un corazón.json" },
      { number: "049", title: "Cristo, ya la noche cierra", file: "049 - Cristo, ya la noche cierra.json" },
      { number: "050", title: "Baja el sol", file: "050 - Baja el sol.json" },
      { number: "051", title: "Nuestro sol se pone ya", file: "051 - Nuestro sol se pone ya.json" },
      { number: "052", title: "Señor Jesús, el día ya se fue", file: "052 - Señor Jesús, el día ya se fue.json" },
      { number: "053", title: "¡Oh amor de Dios!", file: "053 - ¡Oh amor de Dios!.json" },
      { number: "054", title: "Tan bueno es Dios", file: "054 - Tan bueno es Dios.json" },
      { number: "055", title: "Grande, Señor, es tu misericordia", file: "055 - Grande, Señor, es tu misericordia.json" },
      { number: "056", title: "De tal manera amó", file: "056 - De tal manera amó.json" },
      { number: "057", title: "Mi Dios me ama", file: "057 - Mi Dios me ama.json" },
      { number: "058", title: "Grande es el amor divino", file: "058 - Grande es el amor divino.json" },
      { number: "059", title: "Mirad qué amor", file: "059 - Mirad qué amor.json" },
      { number: "060", title: "¡Santo! ¡Santo! ¡Santo! Tu gloria llena", file: "060 - ¡Santo! ¡Santo! ¡Santo! Tu gloria llena.json" },
      { number: "061", title: "Santo, Santo, Santo, Dios Omnipotente", file: "061 - Santo, Santo, Santo, Dios Omnipotente.json" },
      { number: "062", title: "Santo, Santo, Santo, Santo es el Señor", file: "062 - Santo, Santo, Santo, Santo es el Señor.json" },
      { number: "063", title: "Al Rey adorad", file: "063 - Al Rey adorad.json" },
      { number: "064", title: "Yo canto el poder de Dios", file: "064 - Yo canto el poder de Dios.json" },
      { number: "065", title: "El mundo es de mi Dios", file: "065 - El mundo es de mi Dios.json" },
      { number: "066", title: "¿Sabes cuántos?", file: "066 - ¿Sabes cuántos.json" },
      { number: "067", title: "¡Señor, yo te conozco!", file: "067 - ¡Señor, yo te conozco!.json" },
      { number: "068", title: "Todo lo que ha creado Dios", file: "068 - Todo lo que ha creado Dios.json" },
      { number: "069", title: "Señor, mi Dios", file: "069 - Señor, mi Dios.json" },
      { number: "070", title: "¡Nuestro Dios reina!", file: "070 - ¡Nuestro Dios reina!.json" },
      { number: "071", title: "Cada cosa hermosa", file: "071 - Cada cosa hermosa.json" },
      { number: "072", title: "Fue un milagro", file: "072 - Fue un milagro.json" },
      { number: "073", title: "La creación", file: "073 - La creación.json" },
      { number: "074", title: "Himno al Creador", file: "074 - Himno al Creador.json" },
      { number: "075", title: "Grande es Jehová", file: "075 - Grande es Jehová.json" },
      { number: "076", title: "Eterno Dios, mi Creador", file: "076 - Eterno Dios, mi Creador.json" },
      { number: "077", title: "Sea exaltado", file: "077 - Sea exaltado.json" },
      { number: "078", title: "¡Al mundo paz!", file: "078 - ¡Al mundo paz!.json" },
      { number: "079", title: "Se oye un canto en alta esfera", file: "079 - Se oye un canto en alta esfera.json" },
      { number: "080", title: "Venid, pastorcillos", file: "080 - Venid, pastorcillos.json" },
      { number: "081", title: "Noche de paz", file: "081 - Noche de paz.json" },
      { number: "082", title: "Ya repican las campanas", file: "082 - Ya repican las campanas.json" },
      { number: "083", title: "La primera Navidad", file: "083 - La primera Navidad.json" },
      { number: "084", title: "Ve, dilo en las montañas", file: "084 - Ve, dilo en las montañas.json" },
      { number: "085", title: "Allá en el pesebre", file: "085 - Allá en el pesebre.json" },
      { number: "086", title: "A medianoche en Belén", file: "086 - A medianoche en Belén.json" },
      { number: "087", title: "Venid, fieles todos", file: "087 - Venid, fieles todos.json" },
      { number: "088", title: "Oh, aldehuela de Belén", file: "088 - Oh, aldehuela de Belén.json" },
      { number: "089", title: "Cristianos, alegraos hoy", file: "089 - Cristianos, alegraos hoy.json" },
      { number: "090", title: "Somos del oriente", file: "090 - Somos del oriente.json" },
      { number: "091", title: "¿Qué niño es este?", file: "091 - ¿Qué niño es este.json" },
      { number: "092", title: "Angeles cantando están", file: "092 - Angeles cantando están.json" },
      { number: "093", title: "Hubo Uno que quiso", file: "093 - Hubo Uno que quiso.json" },
      { number: "094", title: "Sangró mi soberano Dios", file: "094 - Sangró mi soberano Dios.json" },
      { number: "095", title: "Un día", file: "095 - Un día.json" },
      { number: "096", title: "Al contemplar la excelsa cruz", file: "096 - Al contemplar la excelsa cruz.json" },
      { number: "097", title: "En el monte Calvario", file: "097 - En el monte Calvario.json" },
      { number: "098", title: "Rostro divino", file: "098 - Rostro divino.json" },
      { number: "099", title: "Jamás podrá alguien separarnos", file: "099 - Jamás podrá alguien separarnos.json" },
      { number: "100", title: "¡Dulces momentos!", file: "100 - ¡Dulces momentos!.json" },
      { number: "101", title: "Cabeza sacrosanta", file: "101 - Cabeza sacrosanta.json" },
      { number: "102", title: "Cordero de Dios", file: "102 - Cordero de Dios.json" },
      { number: "103", title: "Jesús resucitado", file: "103 - Jesús resucitado.json" },
      { number: "104", title: "La tumba le encerró", file: "104 - La tumba le encerró.json" },
      { number: "105", title: "Cristo ha resucitado", file: "105 - Cristo ha resucitado.json" },
      { number: "106", title: "Tuya es la gloria", file: "106 - Tuya es la gloria.json" },
      { number: "107", title: "Canto el gran amor", file: "107 - Canto el gran amor.json" },
      { number: "108", title: "Amigo fiel es Cristo", file: "108 - Amigo fiel es Cristo.json" },
      { number: "109", title: "Un buen amigo tengo yo", file: "109 - Un buen amigo tengo yo.json" },
      { number: "110", title: "Cristo es el mejor amigo", file: "110 - Cristo es el mejor amigo.json" },
      { number: "111", title: "Como Jesús no hay otro amigo", file: "111 - Como Jesús no hay otro amigo.json" },
      { number: "112", title: "Ningún otro me amó cual Cristo", file: "112 - Ningún otro me amó cual Cristo.json" },
      { number: "113", title: "Amor que no me dejarás", file: "113 - Amor que no me dejarás.json" },
      { number: "114", title: "Dime la antigua historia", file: "114 - Dime la antigua historia.json" },
      { number: "115", title: "¡Oh, cuán grande amor!", file: "115 - ¡Oh, cuán grande amor!.json" },
      { number: "116", title: "Cristo está a mi lado", file: "116 - Cristo está a mi lado.json" },
      { number: "117", title: "No sé por qué", file: "117 - No sé por qué.json" },
      { number: "118", title: "Cuando estés cansado y abatido", file: "118 - Cuando estés cansado y abatido.json" },
      { number: "119", title: "De su trono, mi Jesús", file: "119 - De su trono, mi Jesús.json" },
      { number: "120", title: "¡Cuánto me alegra!", file: "120 - ¡Cuánto me alegra!.json" },
      { number: "121", title: "Es Jesucristo la vida, la luz", file: "121 - Es Jesucristo la vida, la luz.json" },
      { number: "122", title: "Divino pastor", file: "122 - Divino pastor.json" },
      { number: "123", title: "¡Cuánto nos ama Jesús!", file: "123 - ¡Cuánto nos ama Jesús!.json" },
      { number: "124", title: "Ama el Pastor sus ovejas", file: "124 - Ama el Pastor sus ovejas.json" },
      { number: "125", title: "Infinito amor de Cristo", file: "125 - Infinito amor de Cristo.json" },
      { number: "126", title: "Abrigadas y salvas en el redil", file: "126 - Abrigadas y salvas en el redil.json" },
      { number: "127", title: "Cristo, nombre dulce", file: "127 - Cristo, nombre dulce.json" },
      { number: "128", title: "¡Tu nombre es dulce, buen Jesús!", file: "128 - ¡Tu nombre es dulce, buen Jesús!.json" },
      { number: "129", title: "Cual Jesús no hay otro nombre", file: "129 - Cual Jesús no hay otro nombre.json" },
      { number: "130", title: "Cristo, Cristo, Cristo", file: "130 - Cristo, Cristo, Cristo.json" },
      { number: "131", title: "Bendito es el nombre de Jesús", file: "131 - Bendito es el nombre de Jesús.json" },
      { number: "132", title: "Dulce, hermoso nombre es Jesús", file: "132 - Dulce, hermoso nombre es Jesús.json" },
      { number: "133", title: "Venid, con cánticos venid", file: "133 - Venid, con cánticos venid.json" },
      { number: "134", title: "Cual mirra fragante", file: "134 - Cual mirra fragante.json" },
      { number: "135", title: "Cristo, nombre sublime", file: "135 - Cristo, nombre sublime.json" },
      { number: "136", title: "¡Oh, cuánto amo a Cristo!", file: "136 - ¡Oh, cuánto amo a Cristo!.json" },
      { number: "137", title: "De Jesús el nombre invoca", file: "137 - De Jesús el nombre invoca.json" },
      { number: "138", title: "De mi amante Salvador", file: "138 - De mi amante Salvador.json" },
      { number: "139", title: "La tierna voz del Salvador", file: "139 - La tierna voz del Salvador.json" },
      { number: "140", title: "Te quiero, te quiero", file: "140 - Te quiero, te quiero.json" },
      { number: "141", title: "¡Alabadle!", file: "141 - ¡Alabadle!.json" },
      { number: "142", title: "Venid, cantad de gozo en plenitud", file: "142 - Venid, cantad de gozo en plenitud.json" },
      { number: "143", title: "Digno eres tú", file: "143 - Digno eres tú.json" },
      { number: "144", title: "Mi Salvador", file: "144 - Mi Salvador.json" },
      { number: "145", title: "Con acentos de alegría", file: "145 - Con acentos de alegría.json" },
      { number: "146", title: "Ni en la tierra", file: "146 - Ni en la tierra.json" },
      { number: "147", title: "A Dios sea gloria", file: "147 - A Dios sea gloria.json" },
      { number: "148", title: "Solo Cristo", file: "148 - Solo Cristo.json" },
      { number: "149", title: "Junto a la cruz do Jesús murió", file: "149 - Junto a la cruz do Jesús murió.json" },
      { number: "150", title: "A Cristo doy mi canto", file: "150 - A Cristo doy mi canto.json" },
      { number: "151", title: "Por eso lo amo", file: "151 - Por eso lo amo.json" },
      { number: "152", title: "A ti, Jesús", file: "152 - A ti, Jesús.json" },
      { number: "153", title: "Ved a Cristo", file: "153 - Ved a Cristo.json" },
      { number: "154", title: "Dad gloria al Cordero Rey", file: "154 - Dad gloria al Cordero Rey.json" },
      { number: "155", title: "En Sion Jesús hoy reina", file: "155 - En Sion Jesús hoy reina.json" },
      { number: "156", title: "A Cristo coronad", file: "156 - A Cristo coronad.json" },
      { number: "157", title: "¡Majestad!", file: "157 - ¡Majestad!.json" },
      { number: "158", title: "Amanece ya la mañana de oro", file: "158 - Amanece ya la mañana de oro.json" },
      { number: "159", title: "Yo espero la mañana", file: "159 - Yo espero la mañana.json" },
      { number: "160", title: "Viene otra vez nuestro Salvador", file: "160 - Viene otra vez nuestro Salvador.json" },
      { number: "161", title: "¡Oh! cuán gratas las nuevas", file: "161 - ¡Oh! cuán gratas las nuevas.json" },
      { number: "162", title: "En presencia estar de Cristo", file: "162 - En presencia estar de Cristo.json" },
      { number: "163", title: "Cristo viene, esto es cierto", file: "163 - Cristo viene, esto es cierto.json" },
      { number: "164", title: "Jesús pronto volverá", file: "164 - Jesús pronto volverá.json" },
      { number: "165", title: "¡Vendrá el Señor!", file: "165 - ¡Vendrá el Señor!.json" },
      { number: "166", title: "Siervos de Dios, la trompeta tocad", file: "166 - Siervos de Dios, la trompeta tocad.json" },
      { number: "167", title: "¿Quién en deslumbrante gloria?", file: "167 - ¿Quién en deslumbrante gloria.json" },
      { number: "168", title: "El Rey que viene", file: "168 - El Rey que viene.json" },
      { number: "169", title: "Cuando suene la trompeta", file: "169 - Cuando suene la trompeta.json" },
      { number: "170", title: "La segunda venida de Cristo", file: "170 - La segunda venida de Cristo.json" },
      { number: "171", title: "¿Has oído el mensaje?", file: "171 - ¿Has oído el mensaje.json" },
      { number: "172", title: "Promesa dulce", file: "172 - Promesa dulce.json" },
      { number: "173", title: "¿Será al albor?", file: "173 - ¿Será al albor.json" },
      { number: "174", title: "Mira los hitos", file: "174 - Mira los hitos.json" },
      { number: "175", title: "Ved a Cristo, que se acerca", file: "175 - Ved a Cristo, que se acerca.json" },
      { number: "176", title: "Tú verás al Rey viniendo", file: "176 - Tú verás al Rey viniendo.json" },
      { number: "177", title: "Los tres mensajes angélicos", file: "177 - Los tres mensajes angélicos.json" },
      { number: "178", title: "Contemplé la gloria", file: "178 - Contemplé la gloria.json" },
      { number: "179", title: "¡Cristo viene! Aquel día se acerca", file: "179 - ¡Cristo viene! Aquel día se acerca.json" },
      { number: "180", title: "Sí, lo veremos", file: "180 - Sí, lo veremos.json" },
      { number: "181", title: "Una esperanza", file: "181 - Una esperanza.json" },
      { number: "182", title: "Veremos a Cristo", file: "182 - Veremos a Cristo.json" },
      { number: "183", title: "No me olvidé de ti", file: "183 - No me olvidé de ti.json" },
      { number: "184", title: "Nunca te rindas", file: "184 - Nunca te rindas.json" },
      { number: "185", title: "Al cielo voy", file: "185 - Al cielo voy.json" },
      { number: "186", title: "Hace años escuché", file: "186 - Hace años escuché.json" },
      { number: "187", title: "Aunque anochezca", file: "187 - Aunque anochezca.json" },
      { number: "188", title: "Gran alegría", file: "188 - Gran alegría.json" },
      { number: "189", title: "Cristo muy pronto vendrá", file: "189 - Cristo muy pronto vendrá.json" },
      { number: "190", title: "Santo Espíritu de Cristo", file: "190 - Santo Espíritu de Cristo.json" },
      { number: "191", title: "La nueva proclamad", file: "191 - La nueva proclamad.json" },
      { number: "192", title: "Llena mi ser", file: "192 - Llena mi ser.json" },
      { number: "193", title: "Dios nos ha dado promesa", file: "193 - Dios nos ha dado promesa.json" },
      { number: "194", title: "Vive en mí", file: "194 - Vive en mí.json" },
      { number: "195", title: "Abre mis ojos a la luz", file: "195 - Abre mis ojos a la luz.json" },
      { number: "196", title: "Santo Espíritu de Dios", file: "196 - Santo Espíritu de Dios.json" },
      { number: "197", title: "Dulce Espíritu", file: "197 - Dulce Espíritu.json" },
      { number: "198", title: "Desciende, Espíritu de amor", file: "198 - Desciende, Espíritu de amor.json" },
      { number: "199", title: "Movidos por tu Espíritu", file: "199 - Movidos por tu Espíritu.json" },
      { number: "200", title: "Bautízanos hoy", file: "200 - Bautízanos hoy.json" },
      { number: "201", title: "Canción del Espíritu", file: "201 - Canción del Espíritu.json" },
      { number: "202", title: "Danos el fuego", file: "202 - Danos el fuego.json" },
      { number: "203", title: "Santo Espíritu llena mi vida", file: "203 - Santo Espíritu llena mi vida.json" },
      { number: "204", title: "Oh, cantádmelas otra vez", file: "204 - Oh, cantádmelas otra vez.json" },
      { number: "205", title: "Dadme la Biblia", file: "205 - Dadme la Biblia.json" },
      { number: "206", title: "Padre, tu Palabra es mi delicia", file: "206 - Padre, tu Palabra es mi delicia.json" },
      { number: "207", title: "Dios nos habla", file: "207 - Dios nos habla.json" },
      { number: "208", title: "¡Santa Biblia!", file: "208 - ¡Santa Biblia!.json" },
      { number: "209", title: "La Biblia nos habla de Cristo", file: "209 - La Biblia nos habla de Cristo.json" },
      { number: "210", title: "Huye cual ave", file: "210 - Huye cual ave.json" },
      { number: "211", title: "Fija tus ojos en Cristo", file: "211 - Fija tus ojos en Cristo.json" },
      { number: "212", title: "A tu puerta Cristo está", file: "212 - A tu puerta Cristo está.json" },
      { number: "213", title: "Tierno y amante, Jesús nos invita", file: "213 - Tierno y amante, Jesús nos invita.json" },
      { number: "214", title: "Mientras Jesús te llama", file: "214 - Mientras Jesús te llama.json" },
      { number: "215", title: "Con voz benigna te llama Jesús", file: "215 - Con voz benigna te llama Jesús.json" },
      { number: "216", title: "Dios al pródigo llama", file: "216 - Dios al pródigo llama.json" },
      { number: "217", title: "Bienvenida da Jesús", file: "217 - Bienvenida da Jesús.json" },
      { number: "218", title: "A Jesucristo ven sin tardar", file: "218 - A Jesucristo ven sin tardar.json" },
      { number: "219", title: "Tan triste y tan lejos de Dios", file: "219 - Tan triste y tan lejos de Dios.json" },
      { number: "220", title: "Allá la puerta abierta está", file: "220 - Allá la puerta abierta está.json" },
      { number: "221", title: "Puertas abiertas encontrarán", file: "221 - Puertas abiertas encontrarán.json" },
      { number: "222", title: "Del trono celestial", file: "222 - Del trono celestial.json" },
      { number: "223", title: "Oí la voz del Salvador", file: "223 - Oí la voz del Salvador.json" },
      { number: "224", title: "Oí la voz del buen Jesús", file: "224 - Oí la voz del buen Jesús.json" },
      { number: "225", title: "Un hombre llegose de noche a Jesús", file: "225 - Un hombre llegose de noche a Jesús.json" },
      { number: "226", title: "Buscad primero", file: "226 - Buscad primero.json" },
      { number: "227", title: "Preste oídos el humano", file: "227 - Preste oídos el humano.json" },
      { number: "228", title: "Me buscaréis y me hallaréis", file: "228 - Me buscaréis y me hallaréis.json" },
      { number: "229", title: "¿Has pensado lo que puede costar?", file: "229 - ¿Has pensado lo que puede costar.json" },
      { number: "230", title: "Abre tu corazón", file: "230 - Abre tu corazón.json" },
      { number: "231", title: "Todo en el altar", file: "231 - Todo en el altar.json" },
      { number: "232", title: "Entrégate en oración", file: "232 - Entrégate en oración.json" },
      { number: "233", title: "Ven a la Fuente de vida", file: "233 - Ven a la Fuente de vida.json" },
      { number: "234", title: "¿Temes que en la lucha?", file: "234 - ¿Temes que en la lucha.json" },
      { number: "235", title: "La razón de vivir", file: "235 - La razón de vivir.json" },
      { number: "236", title: "A Jesús entrega todo", file: "236 - A Jesús entrega todo.json" },
      { number: "237", title: "Jesús hoy espera entrar en tu ser", file: "237 - Jesús hoy espera entrar en tu ser.json" },
      { number: "238", title: "Yo escucho, buen Jesús", file: "238 - Yo escucho, buen Jesús.json" },
      { number: "239", title: "De Dios vagaba lejos yo", file: "239 - De Dios vagaba lejos yo.json" },
      { number: "240", title: "Te ruego, oh Dios", file: "240 - Te ruego, oh Dios.json" },
      { number: "241", title: "Perdón te ruego, mi Señor y Dios", file: "241 - Perdón te ruego, mi Señor y Dios.json" },
      { number: "242", title: "Una es, Señor, mi petición", file: "242 - Una es, Señor, mi petición.json" },
      { number: "243", title: "Entrego todo a Cristo", file: "243 - Entrego todo a Cristo.json" },
      { number: "244", title: "Padre, Dios", file: "244 - Padre, Dios.json" },
      { number: "245", title: "Cúmplase, oh Cristo, tu voluntad", file: "245 - Cúmplase, oh Cristo, tu voluntad.json" },
      { number: "246", title: "Te quiero, mi Señor", file: "246 - Te quiero, mi Señor.json" },
      { number: "247", title: "Yo te seguiré", file: "247 - Yo te seguiré.json" },
      { number: "248", title: "Que mi vida entera esté", file: "248 - Que mi vida entera esté.json" },
      { number: "249", title: "Tal como soy", file: "249 - Tal como soy.json" },
      { number: "250", title: "Padre, a tus pies me postro", file: "250 - Padre, a tus pies me postro.json" },
      { number: "251", title: "No yo, sino él", file: "251 - No yo, sino él.json" },
      { number: "252", title: "Dejo el mundo", file: "252 - Dejo el mundo.json" },
      { number: "253", title: "Tuyo soy, Jesús", file: "253 - Tuyo soy, Jesús.json" },
      { number: "254", title: "Anhelo ser limpio", file: "254 - Anhelo ser limpio.json" },
      { number: "255", title: "Oh Cristo, te adoro", file: "255 - Oh Cristo, te adoro.json" },
      { number: "256", title: "Jesús, yo he prometido", file: "256 - Jesús, yo he prometido.json" },
      { number: "257", title: "¡Oh! ven, te invito, Cristo", file: "257 - ¡Oh! ven, te invito, Cristo.json" },
      { number: "258", title: "Tú dejaste tu trono", file: "258 - Tú dejaste tu trono.json" },
      { number: "259", title: "Mi espíritu, alma y cuerpo", file: "259 - Mi espíritu, alma y cuerpo.json" },
      { number: "260", title: "Junto a la cruz de Cristo", file: "260 - Junto a la cruz de Cristo.json" },
      { number: "261", title: "Salvador, a ti me rindo", file: "261 - Salvador, a ti me rindo.json" },
      { number: "262", title: "Los tesoros del mundo", file: "262 - Los tesoros del mundo.json" },
      { number: "263", title: "Entra en este corazón", file: "263 - Entra en este corazón.json" },
      { number: "264", title: "Un día más por Cristo", file: "264 - Un día más por Cristo.json" },
      { number: "265", title: "La senda ancha dejaré", file: "265 - La senda ancha dejaré.json" },
      { number: "266", title: "Vivo por Cristo", file: "266 - Vivo por Cristo.json" },
      { number: "267", title: "A la cruz de Cristo voy", file: "267 - A la cruz de Cristo voy.json" },
      { number: "268", title: "Puedo oír tu voz llamando", file: "268 - Puedo oír tu voz llamando.json" },
      { number: "269", title: "Prefiero a mi Cristo", file: "269 - Prefiero a mi Cristo.json" },
      { number: "270", title: "Meditar en Jesús", file: "270 - Meditar en Jesús.json" },
      { number: "271", title: "Hoy me llama el mundo en vano", file: "271 - Hoy me llama el mundo en vano.json" },
      { number: "272", title: "De esclavitud", file: "272 - De esclavitud.json" },
      { number: "273", title: "Tu vida, oh Salvador", file: "273 - Tu vida, oh Salvador.json" },
      { number: "274", title: "¿Qué te daré, Maestro?", file: "274 - ¿Qué te daré, Maestro.json" },
      { number: "275", title: "Humilde oración", file: "275 - Humilde oración.json" },
      { number: "276", title: "Con nuestras mentes", file: "276 - Con nuestras mentes.json" },
      { number: "277", title: "Amarte más", file: "277 - Amarte más.json" },
      { number: "278", title: "¿Puede el mundo ver a Jesús en mí?", file: "278 - ¿Puede el mundo ver a Jesús en mí.json" },
      { number: "279", title: "Transfórmame a tu imagen", file: "279 - Transfórmame a tu imagen.json" },
      { number: "280", title: "Ser semejante a Jesús", file: "280 - Ser semejante a Jesús.json" },
      { number: "281", title: "He decidido seguir a Cristo", file: "281 - He decidido seguir a Cristo.json" },
      { number: "282", title: "¡Brilla, Jesús!", file: "282 - ¡Brilla, Jesús!.json" },
      { number: "283", title: "Ven, Señor Jesús", file: "283 - Ven, Señor Jesús.json" },
      { number: "284", title: "Me dice el Salvador", file: "284 - Me dice el Salvador.json" },
      { number: "285", title: "Confío en Jesucristo", file: "285 - Confío en Jesucristo.json" },
      { number: "286", title: "Hay una fuente sin igual", file: "286 - Hay una fuente sin igual.json" },
      { number: "287", title: "Rey de mi vida", file: "287 - Rey de mi vida.json" },
      { number: "288", title: "Al contemplarte, mi Salvador", file: "288 - Al contemplarte, mi Salvador.json" },
      { number: "289", title: "¿Qué me puede dar perdón?", file: "289 - ¿Qué me puede dar perdón.json" },
      { number: "290", title: "Fuente de la vida eterna", file: "290 - Fuente de la vida eterna.json" },
      { number: "291", title: "Perdido, fui a mi Jesús", file: "291 - Perdido, fui a mi Jesús.json" },
      { number: "292", title: "Por fe en Cristo, el Redentor", file: "292 - Por fe en Cristo, el Redentor.json" },
      { number: "293", title: "¿Quieres ser salvo de toda maldad?", file: "293 - ¿Quieres ser salvo de toda maldad.json" },
      { number: "294", title: "En Jesús por fe confío", file: "294 - En Jesús por fe confío.json" },
      { number: "295", title: "Las manos, Padre", file: "295 - Las manos, Padre.json" },
      { number: "296", title: "Comprado con sangre por Cristo", file: "296 - Comprado con sangre por Cristo.json" },
      { number: "297", title: "Salvado con sangre por Cristo", file: "297 - Salvado con sangre por Cristo.json" },
      { number: "298", title: "Al Calvario, solo, Jesús ascendió", file: "298 - Al Calvario, solo, Jesús ascendió.json" },
      { number: "299", title: "Hay vida en mirar", file: "299 - Hay vida en mirar.json" },
      { number: "300", title: "Lejos de mi Padre Dios", file: "300 - Lejos de mi Padre Dios.json" },
      { number: "301", title: "Cristo es mi amante Salvador", file: "301 - Cristo es mi amante Salvador.json" },
      { number: "302", title: "Grato es contar la historia", file: "302 - Grato es contar la historia.json" },
      { number: "303", title: "Sublime gracia", file: "303 - Sublime gracia.json" },
      { number: "304", title: "Mi Redentor, el Rey de gloria", file: "304 - Mi Redentor, el Rey de gloria.json" },
      { number: "305", title: "Maravillosa su gracia es", file: "305 - Maravillosa su gracia es.json" },
      { number: "306", title: "Llegó Jesús", file: "306 - Llegó Jesús.json" },
      { number: "307", title: "Roca de la eternidad", file: "307 - Roca de la eternidad.json" },
      { number: "308", title: "Dios descendió", file: "308 - Dios descendió.json" },
      { number: "309", title: "La voz de Jesús", file: "309 - La voz de Jesús.json" },
      { number: "310", title: "Cristo, centro de mi vida", file: "310 - Cristo, centro de mi vida.json" },
      { number: "311", title: "Cuando junte Jesús las naciones", file: "311 - Cuando junte Jesús las naciones.json" },
      { number: "312", title: "Día grande viene", file: "312 - Día grande viene.json" },
      { number: "313", title: "La hora del Juicio", file: "313 - La hora del Juicio.json" },
      { number: "314", title: "Cristo, Rey omnipotente", file: "314 - Cristo, Rey omnipotente.json" },
      { number: "315", title: "El Juicio empezó", file: "315 - El Juicio empezó.json" },
      { number: "316", title: "Hay un mundo feliz más allá", file: "316 - Hay un mundo feliz más allá.json" },
      { number: "317", title: "En el hogar do nunca habrá", file: "317 - En el hogar do nunca habrá.json" },
      { number: "318", title: "En la mansión de mi Señor", file: "318 - En la mansión de mi Señor.json" },
      { number: "319", title: "Cuando mi lucha termine al final", file: "319 - Cuando mi lucha termine al final.json" },
      { number: "320", title: "Jamás se dice 'adiós' allá", file: "320 - Jamás se dice adiós allá.json" },
      { number: "321", title: "Allá sobre montes", file: "321 - Allá sobre montes.json" },
      { number: "322", title: "Busquemos la patria", file: "322 - Busquemos la patria.json" },
      { number: "323", title: "He de conocerle entonces", file: "323 - He de conocerle entonces.json" },
      { number: "324", title: "Pronto yo veré a Jesús", file: "324 - Pronto yo veré a Jesús.json" },
      { number: "325", title: "No puede el mundo ser mi hogar", file: "325 - No puede el mundo ser mi hogar.json" },
      { number: "326", title: "Un día yo he de faltar", file: "326 - Un día yo he de faltar.json" },
      { number: "327", title: "Jerusalén, mi amado hogar", file: "327 - Jerusalén, mi amado hogar.json" },
      { number: "328", title: "¿Nos veremos junto al río?", file: "328 - ¿Nos veremos junto al río.json" },
      { number: "329", title: "En la célica morada", file: "329 - En la célica morada.json" },
      { number: "330", title: "Hay un feliz Edén", file: "330 - Hay un feliz Edén.json" },
      { number: "331", title: "La mañana gloriosa", file: "331 - La mañana gloriosa.json" },
      { number: "332", title: "En la tierra adonde iré", file: "332 - En la tierra adonde iré.json" },
      { number: "333", title: "Aunque en esta vida", file: "333 - Aunque en esta vida.json" },
      { number: "334", title: "Cuánto anhelo llegar", file: "334 - Cuánto anhelo llegar.json" },
      { number: "335", title: "Mi hogar celestial", file: "335 - Mi hogar celestial.json" },
      { number: "336", title: "Del bello país he leído", file: "336 - Del bello país he leído.json" },
      { number: "337", title: "Nunca más adiós", file: "337 - Nunca más adiós.json" },
      { number: "338", title: "Las riberas de dicha inmortal", file: "338 - Las riberas de dicha inmortal.json" },
      { number: "339", title: "A veces oigo un himno", file: "339 - A veces oigo un himno.json" },
      { number: "340", title: "¡Oh, qué música divina!", file: "340 - ¡Oh, qué música divina!.json" },
      { number: "341", title: "Más cerca del hogar", file: "341 - Más cerca del hogar.json" },
      { number: "342", title: "Después del río", file: "342 - Después del río.json" },
      { number: "343", title: "Quiero llegar a ser parte del cielo", file: "343 - Quiero llegar a ser parte del cielo.json" },
      { number: "344", title: "Entonad un himno", file: "344 - Entonad un himno.json" },
      { number: "345", title: "Canta, y tus penas se irán", file: "345 - Canta, y tus penas se irán.json" },
      { number: "346", title: "¡Feliz el día!", file: "346 - ¡Feliz el día!.json" },
      { number: "347", title: "Con gozo canto al Señor", file: "347 - Con gozo canto al Señor.json" },
      { number: "348", title: "Dicha grande", file: "348 - Dicha grande.json" },
      { number: "349", title: "Gran gozo hay en mi alma hoy", file: "349 - Gran gozo hay en mi alma hoy.json" },
      { number: "350", title: "Andando en la luz de Dios", file: "350 - Andando en la luz de Dios.json" },
      { number: "351", title: "Yo tengo gozo", file: "351 - Yo tengo gozo.json" },
      { number: "352", title: "Gozaos, Cristo es Rey", file: "352 - Gozaos, Cristo es Rey.json" },
      { number: "353", title: "Suenan melodías en mi ser", file: "353 - Suenan melodías en mi ser.json" },
      { number: "354", title: "Voy caminando", file: "354 - Voy caminando.json" },
      { number: "355", title: "Yo voy feliz", file: "355 - Yo voy feliz.json" },
      { number: "356", title: "Gozo es conocer a Cristo", file: "356 - Gozo es conocer a Cristo.json" },
      { number: "357", title: "Jesús, tú eres mi alegría", file: "357 - Jesús, tú eres mi alegría.json" },
      { number: "358", title: "En el seno de mi alma", file: "358 - En el seno de mi alma.json" },
      { number: "359", title: "Regocijaos siempre", file: "359 - Regocijaos siempre.json" },
      { number: "360", title: "En Jesucristo, mártir de paz", file: "360 - En Jesucristo, mártir de paz.json" },
      { number: "361", title: "Percibe mi alma un son", file: "361 - Percibe mi alma un son.json" },
      { number: "362", title: "Con sin igual amor", file: "362 - Con sin igual amor.json" },
      { number: "363", title: "Hay un canto nuevo en mi ser", file: "363 - Hay un canto nuevo en mi ser.json" },
      { number: "364", title: "Jesús da paz", file: "364 - Jesús da paz.json" },
      { number: "365", title: "Elevemos al Señor", file: "365 - Elevemos al Señor.json" },
      { number: "366", title: "En Cristo hallo amigo", file: "366 - En Cristo hallo amigo.json" },
      { number: "367", title: "Gracias, Dios", file: "367 - Gracias, Dios.json" },
      { number: "368", title: "Padre amado", file: "368 - Padre amado.json" },
      { number: "369", title: "Gratitud y alabanza", file: "369 - Gratitud y alabanza.json" },
      { number: "370", title: "Por la excelsa majestad", file: "370 - Por la excelsa majestad.json" },
      { number: "371", title: "Jesús te ama", file: "371 - Jesús te ama.json" },
      { number: "372", title: "¿Cómo agradecer?", file: "372 - ¿Cómo agradecer.json" },
      { number: "373", title: "Mi Redentor es Cristo", file: "373 - Mi Redentor es Cristo.json" },
      { number: "374", title: "Dulce comunión", file: "374 - Dulce comunión.json" },
      { number: "375", title: "Sed puros y santos", file: "375 - Sed puros y santos.json" },
      { number: "376", title: "Dulce oración", file: "376 - Dulce oración.json" },
      { number: "377", title: "A los pies de Jesucristo", file: "377 - A los pies de Jesucristo.json" },
      { number: "378", title: "¡Oh, qué amigo nos es Cristo!", file: "378 - ¡Oh, qué amigo nos es Cristo!.json" },
      { number: "379", title: "Habla, Señor, a mi alma", file: "379 - Habla, Señor, a mi alma.json" },
      { number: "380", title: "Ando con Cristo", file: "380 - Ando con Cristo.json" },
      { number: "381", title: "De mañana veo su faz", file: "381 - De mañana veo su faz.json" },
      { number: "382", title: "A solas al huerto yo voy", file: "382 - A solas al huerto yo voy.json" },
      { number: "383", title: "Habla a tu Dios de mañana", file: "383 - Habla a tu Dios de mañana.json" },
      { number: "384", title: "El jardín de oración", file: "384 - El jardín de oración.json" },
      { number: "385", title: "Hablando con Jesús", file: "385 - Hablando con Jesús.json" },
      { number: "386", title: "Hay un lugar de paz", file: "386 - Hay un lugar de paz.json" },
      { number: "387", title: "Aparte del mundo", file: "387 - Aparte del mundo.json" },
      { number: "388", title: "Debo decir a Cristo", file: "388 - Debo decir a Cristo.json" },
      { number: "389", title: "Conversar con Jesucristo", file: "389 - Conversar con Jesucristo.json" },
      { number: "390", title: "Soy yo, Señor", file: "390 - Soy yo, Señor.json" },
      { number: "391", title: "¿Le importará a Jesús?", file: "391 - ¿Le importará a Jesús.json" },
      { number: "392", title: "Hay quien vela mis pisadas", file: "392 - Hay quien vela mis pisadas.json" },
      { number: "393", title: "Mi fe contempla a ti", file: "393 - Mi fe contempla a ti.json" },
      { number: "394", title: "¡Cuán firme cimiento!", file: "394 - ¡Cuán firme cimiento!.json" },
      { number: "395", title: "¡Oh, cuán dulce es fiar en Cristo!", file: "395 - ¡Oh, cuán dulce es fiar en Cristo!.json" },
      { number: "396", title: "¡Oh qué Salvador!", file: "396 - ¡Oh qué Salvador!.json" },
      { number: "397", title: "Oh buen Señor, velada está", file: "397 - Oh buen Señor, velada está.json" },
      { number: "398", title: "Cuando sopla airada la tempestad", file: "398 - Cuando sopla airada la tempestad.json" },
      { number: "399", title: "En estos tiempos", file: "399 - En estos tiempos.json" },
      { number: "400", title: "Castillo fuerte es nuestro Dios", file: "400 - Castillo fuerte es nuestro Dios.json" },
      { number: "401", title: "Eterna Roca es mi Jesús", file: "401 - Eterna Roca es mi Jesús.json" },
      { number: "402", title: "¡Oh!, salvo en la Roca", file: "402 - ¡Oh!, salvo en la Roca.json" },
      { number: "403", title: "Cuando en la lucha", file: "403 - Cuando en la lucha.json" },
      { number: "404", title: "A cualquiera parte", file: "404 - A cualquiera parte.json" },
      { number: "405", title: "Sé quién es Jesús", file: "405 - Sé quién es Jesús.json" },
      { number: "406", title: "Jesús es mi luz", file: "406 - Jesús es mi luz.json" },
      { number: "407", title: "Muy cerca de mi Redentor", file: "407 - Muy cerca de mi Redentor.json" },
      { number: "408", title: "Cristo me ayuda por él a vivir", file: "408 - Cristo me ayuda por él a vivir.json" },
      { number: "409", title: "Si mi débil fe flaqueare", file: "409 - Si mi débil fe flaqueare.json" },
      { number: "410", title: "Cuando te quiero", file: "410 - Cuando te quiero.json" },
      { number: "411", title: "Bajo sus alas", file: "411 - Bajo sus alas.json" },
      { number: "412", title: "Todas las promesas", file: "412 - Todas las promesas.json" },
      { number: "413", title: "Si la carga es pesada", file: "413 - Si la carga es pesada.json" },
      { number: "414", title: "¡Oh, buen Maestro, despierta!", file: "414 - ¡Oh, buen Maestro, despierta!.json" },
      { number: "415", title: "Salvo en los tiernos brazos", file: "415 - Salvo en los tiernos brazos.json" },
      { number: "416", title: "¡Oh!, tenga yo la ardiente fe", file: "416 - ¡Oh!, tenga yo la ardiente fe.json" },
      { number: "417", title: "Dame la fe de mi Jesús", file: "417 - Dame la fe de mi Jesús.json" },
      { number: "418", title: "Padre, yo vengo a ti", file: "418 - Padre, yo vengo a ti.json" },
      { number: "419", title: "Por la justicia de Jesús", file: "419 - Por la justicia de Jesús.json" },
      { number: "420", title: "Nunca desmayes", file: "420 - Nunca desmayes.json" },
      { number: "421", title: "Cariñoso Salvador", file: "421 - Cariñoso Salvador.json" },
      { number: "422", title: "Nada puede ya faltarme", file: "422 - Nada puede ya faltarme.json" },
      { number: "423", title: "Pertenezco a mi Rey", file: "423 - Pertenezco a mi Rey.json" },
      { number: "424", title: "¿Cómo podré estar triste?", file: "424 - ¿Cómo podré estar triste.json" },
      { number: "425", title: "Día en día", file: "425 - Día en día.json" },
      { number: "426", title: "Tengo paz", file: "426 - Tengo paz.json" },
      { number: "427", title: "Lleva todo tu pesar a Cristo", file: "427 - Lleva todo tu pesar a Cristo.json" },
      { number: "428", title: "Su oveja soy", file: "428 - Su oveja soy.json" },
      { number: "429", title: "Él puede", file: "429 - Él puede.json" },
      { number: "430", title: "Solo no estoy", file: "430 - Solo no estoy.json" },
      { number: "431", title: "A él mis problema le doy", file: "431 - A él mis problema le doy.json" },
      { number: "432", title: "Como el ciervo", file: "432 - Como el ciervo.json" },
      { number: "433", title: "Conmigo marcha un ángel", file: "433 - Conmigo marcha un ángel.json" },
      { number: "434", title: "Jesús es mi vida", file: "434 - Jesús es mi vida.json" },
      { number: "435", title: "Dios sabe, Dios oye, Dios ve", file: "435 - Dios sabe, Dios oye, Dios ve.json" },
      { number: "436", title: "Él vive hoy", file: "436 - Él vive hoy.json" },
      { number: "437", title: "Tu presencia, Padre amado, da consuelo", file: "437 - Tu presencia, Padre amado, da consuelo.json" },
      { number: "438", title: "Mira hacia Dios", file: "438 - Mira hacia Dios.json" },
      { number: "439", title: "¡Oh!, quién pudiera andar con Dios", file: "439 - ¡Oh!, quién pudiera andar con Dios.json" },
      { number: "440", title: "Quiero, Jesús, contigo andar", file: "440 - Quiero, Jesús, contigo andar.json" },
      { number: "441", title: "Jesús, te necesito", file: "441 - Jesús, te necesito.json" },
      { number: "442", title: "¡Oh! ¡Maestro y Salvador!", file: "442 - ¡Oh! ¡Maestro y Salvador!.json" },
      { number: "443", title: "Hay un lugar do quiero estar, cerca de ti", file: "443 - Hay un lugar do quiero estar, cerca de ti.json" },
      { number: "444", title: "No me pases", file: "444 - No me pases.json" },
      { number: "445", title: "Más de Jesús", file: "445 - Más de Jesús.json" },
      { number: "446", title: "Más cerca, oh Dios, de ti", file: "446 - Más cerca, oh Dios, de ti.json" },
      { number: "447", title: "Más santidad dame", file: "447 - Más santidad dame.json" },
      { number: "448", title: "Salvador, mi bien eterno", file: "448 - Salvador, mi bien eterno.json" },
      { number: "449", title: "Cristo, mi piloto sé", file: "449 - Cristo, mi piloto sé.json" },
      { number: "450", title: "¡Oh Jesús, Pastor divino!", file: "450 - ¡Oh Jesús, Pastor divino!.json" },
      { number: "451", title: "Cerca, más cerca", file: "451 - Cerca, más cerca.json" },
      { number: "452", title: "Contigo quiero andar", file: "452 - Contigo quiero andar.json" },
      { number: "453", title: "Cómo ser cual Cristo", file: "453 - Cómo ser cual Cristo.json" },
      { number: "454", title: "Yo quisiera andar con Cristo", file: "454 - Yo quisiera andar con Cristo.json" },
      { number: "455", title: "Mi mano ten", file: "455 - Mi mano ten.json" },
      { number: "456", title: "Como la mujer de junto al pozo", file: "456 - Como la mujer de junto al pozo.json" },
      { number: "457", title: "More en mí la belleza del Salvador", file: "457 - More en mí la belleza del Salvador.json" },
      { number: "458", title: "Orad por mí", file: "458 - Orad por mí.json" },
      { number: "459", title: "Háblame más de Cristo", file: "459 - Háblame más de Cristo.json" },
      { number: "460", title: "Quiero estar cerca de Cristo", file: "460 - Quiero estar cerca de Cristo.json" },
      { number: "461", title: "A tu lado anhelo estar", file: "461 - A tu lado anhelo estar.json" },
      { number: "462", title: "Dame a Cristo", file: "462 - Dame a Cristo.json" },
      { number: "463", title: "Mi oración", file: "463 - Mi oración.json" },
      { number: "464", title: "Ven, inspíranos", file: "464 - Ven, inspíranos.json" },
      { number: "465", title: "Ven junto a mí", file: "465 - Ven junto a mí.json" },
      { number: "466", title: "Guíame, ¡oh Salvador!", file: "466 - Guíame, ¡oh Salvador!.json" },
      { number: "467", title: "¡Siempre el Salvador conmigo!", file: "467 - ¡Siempre el Salvador conmigo!.json" },
      { number: "468", title: "Paso a paso Dios me guía", file: "468 - Paso a paso Dios me guía.json" },
      { number: "469", title: "Jesús me guía", file: "469 - Jesús me guía.json" },
      { number: "470", title: "Guíame, Dios", file: "470 - Guíame, Dios.json" },
      { number: "471", title: "Condúceme, Maestro", file: "471 - Condúceme, Maestro.json" },
      { number: "472", title: "Jesús, mi guía es", file: "472 - Jesús, mi guía es.json" },
      { number: "473", title: "Háblame, y hablaré", file: "473 - Háblame, y hablaré.json" },
      { number: "474", title: "¿Qué me importan?", file: "474 - ¿Qué me importan.json" },
      { number: "475", title: "El camino es escabroso", file: "475 - El camino es escabroso.json" },
      { number: "476", title: "¿Muy lejos el hogar está?", file: "476 - ¿Muy lejos el hogar está.json" },
      { number: "477", title: "Los que aman al Señor", file: "477 - Los que aman al Señor.json" },
      { number: "478", title: "Sé fiel siempre, hermano", file: "478 - Sé fiel siempre, hermano.json" },
      { number: "479", title: "De la mano, Señor", file: "479 - De la mano, Señor.json" },
      { number: "480", title: "Digno eres, oh Señor", file: "480 - Digno eres, oh Señor.json" },
      { number: "481", title: "Voy al cielo", file: "481 - Voy al cielo.json" },
      { number: "482", title: "Quiero cantar", file: "482 - Quiero cantar.json" },
      { number: "483", title: "Cuando al cielo lleguemos", file: "483 - Cuando al cielo lleguemos.json" },
      { number: "484", title: "Busca al Señor", file: "484 - Busca al Señor.json" },
      { number: "485", title: "Unidos en verdad", file: "485 - Unidos en verdad.json" },
      { number: "486", title: "En los pasos de Jesús", file: "486 - En los pasos de Jesús.json" },
      { number: "487", title: "Cristo, eres justo Rey", file: "487 - Cristo, eres justo Rey.json" },
      { number: "488", title: "Al andar con Jesús", file: "488 - Al andar con Jesús.json" },
      { number: "489", title: "Solo anhelo, Cristo amado", file: "489 - Solo anhelo, Cristo amado.json" },
      { number: "490", title: "Mejor que los sacrificios", file: "490 - Mejor que los sacrificios.json" },
      { number: "491", title: "Levántate, cristiano", file: "491 - Levántate, cristiano.json" },
      { number: "492", title: "¡Trabajad! ¡Trabajad!", file: "492 - ¡Trabajad! ¡Trabajad!.json" },
      { number: "493", title: "Hoy quiero trabajar contigo", file: "493 - Hoy quiero trabajar contigo.json" },
      { number: "494", title: "Cerca un alma agobiada está", file: "494 - Cerca un alma agobiada está.json" },
      { number: "495", title: "Mi deber", file: "495 - Mi deber.json" },
      { number: "496", title: "Sus manos somos", file: "496 - Sus manos somos.json" },
      { number: "497", title: "Manos", file: "497 - Manos.json" },
      { number: "498", title: "Puedes demostrar con tus manos", file: "498 - Puedes demostrar con tus manos.json" },
      { number: "499", title: "Jesús anduvo por aquí", file: "499 - Jesús anduvo por aquí.json" },
      { number: "500", title: "Hazme tu siervo", file: "500 - Hazme tu siervo.json" },
      { number: "501", title: "Mi vida al servicio de Dios", file: "501 - Mi vida al servicio de Dios.json" },
      { number: "502", title: "Brilla en el sitio donde estés", file: "502 - Brilla en el sitio donde estés.json" },
      { number: "503", title: "Oh Dios, que deseas la vida", file: "503 - Oh Dios, que deseas la vida.json" },
      { number: "504", title: "Señor de todos", file: "504 - Señor de todos.json" },
      { number: "505", title: "Hijo del reino", file: "505 - Hijo del reino.json" },
      { number: "506", title: "¡De pie, de pie, cristianos!", file: "506 - ¡De pie, de pie, cristianos!.json" },
      { number: "507", title: "Tentado, no cedas", file: "507 - Tentado, no cedas.json" },
      { number: "508", title: "Contendamos siempre por nuestra fe", file: "508 - Contendamos siempre por nuestra fe.json" },
      { number: "509", title: "¡Firmes! ¡Fuertes!", file: "509 - ¡Firmes! ¡Fuertes!.json" },
      { number: "510", title: "¿Quién está por Cristo?", file: "510 - ¿Quién está por Cristo.json" },
      { number: "511", title: "Marcharé en la divina luz", file: "511 - Marcharé en la divina luz.json" },
      { number: "512", title: "Nunca estéis desanimados", file: "512 - Nunca estéis desanimados.json" },
      { number: "513", title: "Honra al hombre de valor", file: "513 - Honra al hombre de valor.json" },
      { number: "514", title: "¡Despertad, despertad, oh cristianos!", file: "514 - ¡Despertad, despertad, oh cristianos!.json" },
      { number: "515", title: "Despliegue el cristiano su santa bandera", file: "515 - Despliegue el cristiano su santa bandera.json" },
      { number: "516", title: "¡Firmes y adelante!", file: "516 - ¡Firmes y adelante!.json" },
      { number: "517", title: "De pie, oh grey de Dios", file: "517 - De pie, oh grey de Dios.json" },
      { number: "518", title: "Jesús está buscando voluntarios hoy", file: "518 - Jesús está buscando voluntarios hoy.json" },
      { number: "519", title: "Despierta, hermano, sin demorar", file: "519 - Despierta, hermano, sin demorar.json" },
      { number: "520", title: "¡Adelante! manda el Señor", file: "520 - ¡Adelante! manda el Señor.json" },
      { number: "521", title: "Al Cristo ved", file: "521 - Al Cristo ved.json" },
      { number: "522", title: "Suenen las palabras", file: "522 - Suenen las palabras.json" },
      { number: "523", title: "Los sabios dan su ciencia", file: "523 - Los sabios dan su ciencia.json" },
      { number: "524", title: "Traían en silencio presentes al Señor", file: "524 - Traían en silencio presentes al Señor.json" },
      { number: "525", title: "Con gratitud, llegamos", file: "525 - Con gratitud, llegamos.json" },
      { number: "526", title: "Oh, mi patria, te prometo hoy", file: "526 - Oh, mi patria, te prometo hoy.json" },
      { number: "527", title: "Señor Jehová, omnipotente Dios", file: "527 - Señor Jehová, omnipotente Dios.json" },
      { number: "528", title: "Por montañas, muy cansado", file: "528 - Por montañas, muy cansado.json" },
      { number: "529", title: "Iglesia de Cristo", file: "529 - Iglesia de Cristo.json" },
      { number: "530", title: "Somos un pequeño pueblo muy feliz", file: "530 - Somos un pequeño pueblo muy feliz.json" },
      { number: "531", title: "La familia de Dios", file: "531 - La familia de Dios.json" },
      { number: "532", title: "Sagrado es el amor", file: "532 - Sagrado es el amor.json" },
      { number: "533", title: "Cuán bueno y agradable", file: "533 - Cuán bueno y agradable.json" },
      { number: "534", title: "En tu nombre comenzamos", file: "534 - En tu nombre comenzamos.json" },
      { number: "535", title: "Las faenas terminadas", file: "535 - Las faenas terminadas.json" },
      { number: "536", title: "En sombras de la tarde", file: "536 - En sombras de la tarde.json" },
      { number: "537", title: "Sábado santo", file: "537 - Sábado santo.json" },
      { number: "538", title: "Hoy es día de reposo", file: "538 - Hoy es día de reposo.json" },
      { number: "539", title: "¡Oh, día delicioso!", file: "539 - ¡Oh, día delicioso!.json" },
      { number: "540", title: "Ya asoma el sol brillante", file: "540 - Ya asoma el sol brillante.json" },
      { number: "541", title: "Señor, reposamos", file: "541 - Señor, reposamos.json" },
      { number: "542", title: "Amo tu sábado", file: "542 - Amo tu sábado.json" },
      { number: "543", title: "No te olvides nunca del día del Señor", file: "543 - No te olvides nunca del día del Señor.json" },
      { number: "544", title: "Hoy el sábado glorioso", file: "544 - Hoy el sábado glorioso.json" },
      { number: "545", title: "Santo día", file: "545 - Santo día.json" },
      { number: "546", title: "Santo sábado, bendito", file: "546 - Santo sábado, bendito.json" },
      { number: "547", title: "Sábado es", file: "547 - Sábado es.json" },
      { number: "548", title: "Mi corazón se llena de alegría", file: "548 - Mi corazón se llena de alegría.json" },
      { number: "549", title: "Ya el fin se acerca", file: "549 - Ya el fin se acerca.json" },
      { number: "550", title: "Día santo del Señor", file: "550 - Día santo del Señor.json" },
      { number: "551", title: "Embajador soy de mi Rey", file: "551 - Embajador soy de mi Rey.json" },
      { number: "552", title: "¡Oh!, cuánto necesita", file: "552 - ¡Oh!, cuánto necesita.json" },
      { number: "553", title: "¿Os pusisteis a arar?", file: "553 - ¿Os pusisteis a arar.json" },
      { number: "554", title: "Con Cristo avanza hoy", file: "554 - Con Cristo avanza hoy.json" },
      { number: "555", title: "Hoy gozoso medito", file: "555 - Hoy gozoso medito.json" },
      { number: "556", title: "Yo quiero siempre brillar", file: "556 - Yo quiero siempre brillar.json" },
      { number: "557", title: "¿Qué estás haciendo por Cristo?", file: "557 - ¿Qué estás haciendo por Cristo.json" },
      { number: "558", title: "Ama a tus prójimos", file: "558 - Ama a tus prójimos.json" },
      { number: "559", title: "No te dé temor", file: "559 - No te dé temor.json" },
      { number: "560", title: "Cristo está buscando obreros", file: "560 - Cristo está buscando obreros.json" },
      { number: "561", title: "Oigo del Señor la voz llamando", file: "561 - Oigo del Señor la voz llamando.json" },
      { number: "562", title: "Esparcid la luz de Cristo", file: "562 - Esparcid la luz de Cristo.json" },
      { number: "563", title: "Escuchad, Jesús nos dice", file: "563 - Escuchad, Jesús nos dice.json" },
      { number: "564", title: "Pronto la noche viene", file: "564 - Pronto la noche viene.json" },
      { number: "565", title: "¡Ve, ve oh Sion!", file: "565 - ¡Ve, ve oh Sion!.json" },
      { number: "566", title: "Centinelas del Maestro", file: "566 - Centinelas del Maestro.json" },
      { number: "567", title: "Si en valles de peligros", file: "567 - Si en valles de peligros.json" },
      { number: "568", title: "Hay lugar en la amplia viña", file: "568 - Hay lugar en la amplia viña.json" },
      { number: "569", title: "Id Y predicad el evangelio", file: "569 - Id Y predicad el evangelio.json" },
      { number: "570", title: "Voluntario del Señor", file: "570 - Voluntario del Señor.json" },
      { number: "571", title: "La historia de Cristo contemos", file: "571 - La historia de Cristo contemos.json" },
      { number: "572", title: "Pescadores de hombres", file: "572 - Pescadores de hombres.json" },
      { number: "573", title: "Te envío a ti", file: "573 - Te envío a ti.json" },
      { number: "574", title: "Testimonio", file: "574 - Testimonio.json" },
      { number: "575", title: "Tocad trompeta ya", file: "575 - Tocad trompeta ya.json" },
      { number: "576", title: "Proclamo hoy que soy cristiano", file: "576 - Proclamo hoy que soy cristiano.json" },
      { number: "577", title: "Yo quiero trabajar", file: "577 - Yo quiero trabajar.json" },
      { number: "578", title: "El pueblo que conoce a su Dios", file: "578 - El pueblo que conoce a su Dios.json" },
      { number: "579", title: "La fuente veo", file: "579 - La fuente veo.json" },
      { number: "580", title: "Las aguas del bautismo", file: "580 - Las aguas del bautismo.json" },
      { number: "581", title: "El Pan de vida soy", file: "581 - El Pan de vida soy.json" },
      { number: "582", title: "Hoy venimos cual hermanos", file: "582 - Hoy venimos cual hermanos.json" },
      { number: "583", title: "La Cena de la Comunión", file: "583 - La Cena de la Comunión.json" },
      { number: "584", title: "Amémonos, hermanos", file: "584 - Amémonos, hermanos.json" },
      { number: "585", title: "De rodillas partimos hoy el pan", file: "585 - De rodillas partimos hoy el pan.json" },
      { number: "586", title: "En memoria de mí", file: "586 - En memoria de mí.json" },
      { number: "587", title: "Te dedicamos, oh Señor", file: "587 - Te dedicamos, oh Señor.json" },
      { number: "588", title: "Ven, alma que lloras", file: "588 - Ven, alma que lloras.json" },
      { number: "589", title: "Perfecto amor", file: "589 - Perfecto amor.json" },
      { number: "590", title: "Guía a ti, Señor", file: "590 - Guía a ti, Señor.json" },
      { number: "591", title: "Todo es bello en el hogar", file: "591 - Todo es bello en el hogar.json" },
      { number: "592", title: "Si Dios está, ¡feliz hogar!", file: "592 - Si Dios está, ¡feliz hogar!.json" },
      { number: "593", title: "Hogar de mis recuerdos", file: "593 - Hogar de mis recuerdos.json" },
      { number: "594", title: "Señor, gracias por mi hogar", file: "594 - Señor, gracias por mi hogar.json" },
      { number: "595", title: "Feliz hogar", file: "595 - Feliz hogar.json" },
      { number: "596", title: "Edificamos familias", file: "596 - Edificamos familias.json" },
      { number: "597", title: "Oración por un niño", file: "597 - Oración por un niño.json" },
      { number: "598", title: "Cristo, yo te seguiré", file: "598 - Cristo, yo te seguiré.json" },
      { number: "599", title: "En este bello día", file: "599 - En este bello día.json" },
      { number: "600", title: "Cuando venga Jesucristo", file: "600 - Cuando venga Jesucristo.json" },
      { number: "601", title: "Cuando leo en la Biblia", file: "601 - Cuando leo en la Biblia.json" },
      { number: "602", title: "Es el amor divino", file: "602 - Es el amor divino.json" },
      { number: "603", title: "Yo temprano busco a Cristo", file: "603 - Yo temprano busco a Cristo.json" },
      { number: "604", title: "Bellas las manitas son", file: "604 - Bellas las manitas son.json" },
      { number: "605", title: "Jesús tiene tiempo", file: "605 - Jesús tiene tiempo.json" },
      { number: "606", title: "Llama Jesús, el Buen Pastor", file: "606 - Llama Jesús, el Buen Pastor.json" },
      { number: "607", title: "Nítido rayo por Cristo", file: "607 - Nítido rayo por Cristo.json" },
      { number: "608", title: "Corazones siempre alegres", file: "608 - Corazones siempre alegres.json" },
      { number: "609", title: "¡Oh jóvenes, venid!", file: "609 - ¡Oh jóvenes, venid!.json" },
      { number: "610", title: "Escuchamos tu llamada", file: "610 - Escuchamos tu llamada.json" },
      { number: "611", title: "Oh, juventud del Rey", file: "611 - Oh, juventud del Rey.json" },
      { number: "612", title: "Jesús te necesita hoy", file: "612 - Jesús te necesita hoy.json" },
    ];
    
    return [...himnos];
  } catch (err) {
    console.error('Error al obtener el índice de himnos:', err);
    return [];
  }
}

/**
 * Carga la letra de un himno específico.
 * @param {string} hymnFileName - Nombre del archivo JSON del himno
 * @returns {Promise<Object>} Objeto con la letra del himno
 */
async function parseHymn(hymnFileName) {
  try {
    const response = await fetch(`/src/assets/himnos/letra/${hymnFileName}`);
    if (!response.ok) throw new Error('No se pudo cargar el himno');
    const data = await response.json();
    
    // Extraer el número del nombre del archivo (ej: "246 - Te quiero, mi Señor.json" -> "246")
    const numeroMatch = hymnFileName.match(/^(\d+)/);
    const numero = numeroMatch ? numeroMatch[1] : '';
    
    // Usar el título original del JSON sin filtrar
    const tituloOriginal = data.title || 'Himno';
    
    // Convertir la estructura de sections a estrofas
    const himno = {
      titulo: tituloOriginal, // Usar el título original sin filtrar
      numero: numero, // Usar el número extraído del nombre del archivo
      estrofas: [],
      sections: data.sections || {}
    };
    
    // Agregar el título como primera estrofa (índice 0)
    const tituloLimpio = tituloOriginal.replace(/^Himno\s*#?\d*\s*/, '').trim();
    himno.estrofas.push({
      verso: 'titulo',
      texto: `${numero} | ${tituloLimpio}`,
      sectionKey: 'titulo'
    });
    
    // Procesar las secciones y convertirlas a estrofas (empezando desde índice 1)
    if (data.sections) {
      const sectionKeys = Object.keys(data.sections).sort((a, b) => parseInt(a) - parseInt(b));
      
      sectionKeys.forEach(sectionKey => {
        const section = data.sections[sectionKey];
        if (section && section.text && Array.isArray(section.text)) {
          // Unir las líneas de texto en una sola estrofa
          const textoCompleto = section.text.join('\n');
          
          himno.estrofas.push({
            verso: section.verse || sectionKey,
            texto: textoCompleto,
            sectionKey: sectionKey
          });
        }
      });
    }
    
    console.log('📖 Himno cargado:', {
      numero: himno.numero,
      titulo: himno.titulo,
      estrofas: himno.estrofas.length,
      estructura: himno.estrofas.map((e, i) => `${i}: ${e.verso}`)
    });
    
    return himno;
  } catch (err) {
    console.error('Error al cargar el himno:', err);
    return null;
  }
}

// Hacer las funciones disponibles globalmente
console.log('🌐 Haciendo funciones disponibles globalmente...');
window.getBibleVersions = getBibleVersions;
window.parseBible = parseBible;
window.getHymnIndex = getHymnIndex;
window.parseHymn = parseHymn;
console.log('✅ dataManager.js cargado completamente');
