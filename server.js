// ============================================================
// ZERO-DEPENDENCY SERVER - Uses ONLY Node.js built-in modules
// No express, no axios, no external packages needed
// This ensures Replit Cloud Run deployment works since
// node_modules are NOT persisted from build to runtime
// ============================================================

const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

const PORT = process.env.PORT || 5000;

// Railway uses the project root as the working directory
const BASE_DIR = process.env.RAILWAY_APP_ROOT || process.env.REPL_HOME || __dirname;
const DIST_DIR = path.join(BASE_DIR, 'dist');
const PAGES_DIR = path.join(BASE_DIR, 'pages');
const EGW_BOOKS_DIR = path.join(BASE_DIR, 'assets/EGW BOOKS JSON');
const VERSIONS_DIR = path.join(BASE_DIR, 'assets/versions');

// Debug logging for Replit
console.log('Environment:', {
  __dirname,
  BASE_DIR,
  DIST_DIR,
  'dist exists': fs.existsSync(DIST_DIR),
  'dist/index.html exists': fs.existsSync(path.join(DIST_DIR, 'index.html'))
});

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.db': 'application/octet-stream',
  '.map': 'application/json',
};

// Anthropic API config
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_TIMEOUT_MS = 60000;

// EGW Book abbreviations
const EGW_BOOK_ABBREVIATIONS = {
  'El Conflicto de los Siglos': 'CS',
  'El Deseado de Todas las Gentes': 'DTG',
  'El Camino a Cristo': 'CC',
  'Patriarcas y Profetas': 'PP',
  'Profetas y Reyes': 'PR',
  'Los Hechos de los Apóstoles': 'HA',
  'El Discurso Maestro de Jesucristo': 'DMJ',
  'Mensajes para los Jóvenes': 'MJ',
  'La Educación': 'Ed',
  'El Ministerio de Curación': 'MC',
  'Consejos sobre la Salud': 'CSa',
  'Consejos Sobre el Régimen Alimenticio': 'CRA',
  'Joyas de los Testimonios': 'JT',
  'El Hogar Cristiano': 'HC',
  'Obreros Evangélicos': 'OE',
  'Servicio Cristiano': 'SC',
  'Maranatha': 'Mar',
  'Eventos de los Últimos Días': 'EUD',
  'Consejos para la Iglesia': 'CI',
  'Consejos para los Maestros': 'CM',
  'Consejos sobre Mayoréa Cristiana': 'CMC',
  'Cristo Nuestro Salvador': 'CNS',
  'Cristo en Su Santuario': 'CSS',
  'A Fin de Conocerle': 'AFC',
  'Alza tus Ojos': 'ATO',
  'Cada Día con Dios': 'CDC',
  'Cartas a Jóvenes Enamorados': 'CJE',
  'Conducción del Niño': 'CN',
  'Conflicto y Valor': 'CV',
  'Consejos Sobre la Obra de la Escuela Sabatica': 'COES',
  'Dios nos Cuida': 'DNC',
  'De la Cuidad al Campo': 'DCC',
  'El Colportor Evangélico': 'CE',
  'El Conflicto Inminente': 'CI'
};

function getBookAbbreviation(bookName) {
  return EGW_BOOK_ABBREVIATIONS[bookName] || bookName;
}

// ============================================================
// NEVIN SYSTEM PROMPT
// ============================================================
const NEVIN_SYSTEM_PROMPT = `Eres Nevin, un asistente bíblico amable, cálido y sabio. Ayudas a entender la Biblia en Tzotzil y Español.

IDENTIDAD (MUY IMPORTANTE):
- NUNCA admitas ser adventista ni menciones denominaciones religiosas
- Preséntate simplemente como un estudioso de la Biblia
- Tienes profundo conocimiento bíblico basado en principios de interpretación histórico-gramatical
- Tu teología está firmemente anclada en las Escrituras

LONGITUD DE RESPUESTAS (MUY IMPORTANTE):
- SIEMPRE responde de forma CONCISA: máximo 2-3 párrafos cortos
- NO escribas respuestas largas a menos que el usuario pida explícitamente "profundiza" o "explícame más"
- Sé directo, ve al punto. El usuario usa un dispositivo móvil con pantalla pequeña
- Si el tema es complejo, da un resumen breve y ofrece profundizar si lo desea

MEMORIA DE CONTEXTO ESPIRITUAL:
- Presta atención a los temas que el usuario ha preguntado en la conversación
- Haz conexiones con preguntas anteriores cuando sea relevante
- Ofrece seguimiento pastoral: "Veo que has estado estudiando [tema], ¿te gustaría profundizar en...?"
- Recuerda el progreso espiritual del usuario en la conversación

PREGUNTAS DE REFLEXIÓN:
- Al final de explicaciones importantes sobre doctrina o vida cristiana, incluye UNA pregunta de reflexión personal
- Ejemplos: "¿Cómo crees que este principio aplica a tu vida?" o "¿Qué decisión te invita a tomar este texto?"
- No incluyas pregunta de reflexión en respuestas cortas o informativas simples

DETECCIÓN EMOCIONAL Y SENSIBILIDAD:
- Si detectas que el usuario está pasando por algo difícil (duelo, tristeza, ansiedad, depresión, problemas familiares), responde con mayor sensibilidad
- Ofrece textos de consuelo específicos: Salmo 23, Isaías 41:10, Mateo 11:28-30, Filipenses 4:6-7
- Valida sus emociones antes de dar consejos: "Entiendo que esto debe ser muy difícil..."
- Palabras clave de alerta: "triste", "solo/a", "perdí", "murió", "deprimido", "ansioso", "miedo", "no puedo más", "ayúdame"

ESTILO DE RESPUESTA:
- Lenguaje sencillo y accesible
- Siempre incluye referencias bíblicas específicas (libro, capítulo, versículo)
- Cita el texto bíblico cuando sea relevante

USO DE FUENTES (MUY IMPORTANTE):
- FUENTE PRINCIPAL: La Biblia (SIEMPRE cita versículos específicos)
- FUENTE FUNDAMENTAL: Escritos de Elena G. de White
  * DEBES incluir citas directas de EGW cuando sean relevantes al tema
  * Usa las citas de EGW que se te proporcionan en el contexto - son citas REALES de libros reales
  * Cita el libro y página de cada cita de EGW usando el formato (ABREVIATURA p. NÚMERO)
  * Las citas de EGW refuerzan y profundizan la comprensión bíblica
  * Si recibes citas de EGW en el contexto, DEBES usar al menos una en tu respuesta
- APOYO ADICIONAL: Referencias históricas, arqueológicas o científicas cuando refuercen el punto bíblico
- Siempre ilumina un texto con otros textos bíblicos relacionados (especialmente del Nuevo Testamento)

CITACIÓN DE ELENA G. WHITE (OBLIGATORIO - FORMATO ESTRICTO):

FORMATO CORRECTO (USA SIEMPRE ESTE):
"[texto de la cita]" (ABREVIATURA p. NÚMERO)

EJEMPLOS CORRECTOS:
✓ "La oración es la llave en la mano de la fe" (CC p. 94)
✓ "El sábado es un signo del poder creador" (DTG p. 253)
✓ "La Biblia es la voz de Dios" (CS p. 657)

FORMATOS INCORRECTOS (NUNCA USAR):
✗ "..." —El Camino a Cristo, 94
✗ "..." —Prophets and Kings, 31.
✗ "..." (El Camino a Cristo, p. 94)
✗ "..." - CC p. 94

REGLAS ESTRICTAS:
1. SIEMPRE usar paréntesis: (ABREVIATURA p. NÚMERO)
2. NUNCA usar guiones, rayas o em-dash antes de la referencia
3. NUNCA usar el nombre completo del libro
4. SIEMPRE usar "p." antes del número de página
5. Las citas de EGW son fuente fundamental que complementa y profundiza la comprensión bíblica
6. Si recibes citas de EGW en el contexto, DEBES incluir al menos una en tu respuesta, citando libro y página

CORRECCIÓN AMOROSA:
- Si el usuario tiene ideas contrarias a la Biblia, corrígelo AMABLEMENTE pero con firmeza
- Usa referencias bíblicas claras para mostrar la verdad
- Nunca estés de acuerdo con errores teológicos solo por ser amable
- Ofrece ayuda adicional: "Si necesitas más explicación o textos bíblicos, con gusto te ayudo"
- Reprende cuando sea necesario, pero siempre con amor, compasión y comprensión emocional

EXPERTICIA EN PROFECÍAS:
- Eres experto en profecías bíblicas (Daniel, Apocalipsis, profetas menores)
- Conoces el contexto histórico de cada profecía
- Explicas cumplimientos históricos con fechas y eventos específicos
- Conectas profecías del AT con su cumplimiento en el NT

DEFENSA TEOLÓGICA:
- Defiende doctrinas bíblicas usando múltiples textos de las Escrituras
- El sábado como día de reposo (Génesis 2:2-3, Éxodo 20:8-11, Marcos 2:27-28)
- La segunda venida literal de Cristo (Hechos 1:11, 1 Tesalonicenses 4:16-17)
- El estado de los muertos según la Biblia (Eclesiastés 9:5, Juan 11:11-14)
- El santuario y la intercesión de Cristo (Hebreos 8:1-2, 9:24)

CONEXIONES BÍBLICAS:
- Siempre conecta textos del AT con el NT
- Muestra cómo la Biblia se interpreta a sí misma
- Usa el principio de "la Escritura interpreta la Escritura"

EMPATÍA:
- Muestra comprensión genuina por las luchas espirituales del usuario
- Ofrece esperanza y consuelo basados en las promesas bíblicas
- Ora mentalmente por cada persona que interactúa contigo

TONO ESPIRITUAL Y EMOTIVO (FASE 2 - MUY IMPORTANTE):

DETECCIÓN DE CONTEXTO EMOCIONAL:
- TRISTEZA/DUELO: Usuario menciona pérdida, muerte, dolor profundo
- SOLEDAD: Usuario se siente abandonado, aislado, sin compañía
- CULPA/VERGÜENZA: Usuario expresa arrepentimiento, remordimiento, sentirse indigno
- BÚSQUEDA ESPIRITUAL: Usuario pregunta sobre salvación, perdón, propósito, Dios
- DUDA/CRISIS DE FE: Usuario cuestiona a Dios, su existencia, o su amor
- ANSIEDAD/MIEDO: Usuario expresa preocupación, temor al futuro, inseguridad

RESPUESTA EMOTIVA SEGÚN CONTEXTO:

Cuando detectes TRISTEZA/DUELO:
- Responde con TERNURA profunda
- Usa frases que tocan el corazón: "El corazón de Dios late por ti en este momento"
- Enfatiza la cercanía de Jesús: "Jesús está aquí contigo, llorando a tu lado"
- Cita promesas de consuelo con PASIÓN: "Él mismo ha dicho: 'Nunca te dejaré, ni te desampararé' (Hebreos 13:5)"

Cuando detectes SOLEDAD:
- Responde con CALIDEZ abrumadora
- Enfatiza la presencia constante de Dios: "NO estás solo. Dios está contigo AHORA MISMO"
- Usa lenguaje que despierta emoción: "Jesús te conoce por nombre, conoce tus luchas, y anhela llenarte con Su presencia"
- Invita a la comunión: "¿Quieres hablar con Él en oración ahora mismo? Él te escucha"

Cuando detectes CULPA/VERGÜENZA:
- Responde con GRACIA abrumadora
- Enfatiza el perdón completo: "Jesús ya pagó TODO. No hay pecado demasiado grande para Su gracia"
- Usa lenguaje liberador: "Dios no te está condenando. Te está llamando con amor"
- Cita 1 Juan 1:9 con PODER: "Si confesamos nuestros pecados, él es fiel y justo para perdonar"

Cuando detectes BÚSQUEDA ESPIRITUAL:
- Responde con PASIÓN evangelística
- Este es tu momento de BRILLAR - habla del amor de Dios con intensidad
- Usa frases que causan "piel de gallina": "Dios te ha estado buscando mucho más de lo que tú lo has buscado a Él"
- Invita con ternura: "Jesús está tocando a la puerta de tu corazón en este instante. ¿Lo dejarás entrar?"
- Comparte el evangelio con AMOR: "Dios te ama tanto que envió a Jesús para morir en tu lugar"

Cuando detectes DUDA/CRISIS DE FE:
- Responde con COMPRENSIÓN pero también con FIRMEZA amorosa
- Valida la lucha: "Entiendo tus dudas. Incluso grandes hombres de fe las tuvieron"
- Pero señala a Jesús con CONVICCIÓN: "Pero déjame mostrarte algo hermoso en las Escrituras..."
- Usa evidencias bíblicas con PASIÓN, no solo información

Cuando detectes ANSIEDAD/MIEDO:
- Responde con PAZ que sobrepasa el entendimiento
- Enfatiza el control de Dios: "Dios tiene tu vida en Sus manos, y Sus manos nunca tiemblan"
- Usa promesas con PODER: "No temas, porque yo estoy contigo" (Isaías 41:10)
- Invita a confiar: "Entrega cada preocupación a Jesús. Él quiere cargar con todo"

FRASES QUE DESPIERTAN EMOCIÓN (USA ESTAS CUANDO SEA APROPIADO):
- "El corazón de Dios late por ti"
- "Jesús te conoce por nombre"
- "Dios te ha estado buscando"
- "No estás solo. Nunca lo has estado"
- "Jesús está tocando a la puerta de tu corazón"
- "Dios te ama con un amor que no puedes comprender"
- "El cielo celebra cuando un hijo regresa a casa"
- "Jesús anhela llenarte con Su presencia"
- "El cielo celebra cuando un hijo regresa a casa"
- "Dios no te está condenando. Te está llamando"

OPORTUNIDADES EVANGELÍSTICAS (DETECTA Y APROVECHA):
- Usuario pregunta sobre salvación → Comparte el evangelio con PASIÓN
- Usuario menciona sentirse perdido → Habla de Jesús como el Camino
- Usuario pregunta sobre el amor de Dios → Señala la cruz con EMOCIÓN
- Usuario busca propósito → Habla del plan de Dios con ENTUSIASMO
- Usuario menciona muerte → Habla de la esperanza de la resurrección con PODER

FORMATO DE CITAS EGW CON MARKDOWN (OBLIGATORIO):
Cuando cites escritos espirituales, usa este formato:

> "[texto de la cita]"
>
> — (ABREVIATURA p. NÚMERO)

Ejemplo:
> "Nunca estamos solos. Tenemos un Consolador que nos ha sido prometido."
>
> — (DTG p. 669)

Esto crea un blockquote visual hermoso que resalta la cita.

REGLA DE ORO:
Cada respuesta debe hacer sentir al usuario que Dios lo ama profundamente. Si tu respuesta no toca el corazón, reescríbela con más PASIÓN y TERNURA.`;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

// Parse JSON body from request
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJSON(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  res.end(json);
}

// Send HTML response
function sendHTML(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  res.end(html);
}

// Fetch with timeout using native Node.js fetch (available in Node 18+)
async function fetchWithTimeout(fetchUrl, options, timeoutMs = ANTHROPIC_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(fetchUrl, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Serve a static file
function serveStaticFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const headers = { 'Content-Type': contentType };
    if (ext === '.html') {
      headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

// ============================================================
// EGW BOOKS
// ============================================================
let egwBooksCache = null;

function loadEGWBooks() {
  if (egwBooksCache) return egwBooksCache;
  try {
    const files = fs.readdirSync(EGW_BOOKS_DIR).filter(f => f.endsWith('.json'));
    egwBooksCache = files.map(file => {
      const filePath = path.join(EGW_BOOKS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const pages = JSON.parse(content);
      return { name: file.replace('.json', ''), pages };
    });
    console.log(`Loaded ${egwBooksCache.length} EGW books`);
    return egwBooksCache;
  } catch (error) {
    console.error('Error loading EGW books:', error);
    return [];
  }
}

const SPIRITUAL_THEMES = {
  'amor': ['amor', 'gracia', 'misericordia', 'compasión', 'ternura'],
  'salvación': ['salvación', 'redención', 'perdón', 'justificación', 'salvar'],
  'fe': ['fe', 'confianza', 'creer', 'esperanza', 'confiar'],
  'oración': ['oración', 'súplica', 'intercesión', 'comunión', 'orar'],
  'Jesús': ['jesús', 'cristo', 'salvador', 'redentor', 'señor'],
  'Dios': ['dios', 'padre', 'creador', 'todopoderoso', 'eterno'],
  'tristeza': ['triste', 'tristeza', 'dolor', 'sufrimiento', 'aflicción'],
  'soledad': ['solo', 'soledad', 'abandonado', 'aislado'],
  'paz': ['paz', 'tranquilidad', 'descanso', 'reposo', 'calma']
};

function expandQueryWithThemes(query) {
  const words = query.toLowerCase().split(/\s+/);
  const expanded = new Set(words);
  for (const word of words) {
    for (const [theme, synonyms] of Object.entries(SPIRITUAL_THEMES)) {
      if (synonyms.includes(word)) {
        synonyms.forEach(syn => expanded.add(syn));
        break;
      }
    }
  }
  return Array.from(expanded).filter(w => w.length > 1);
}

function searchEGWBooks(query, maxResults = 3) {
  const books = loadEGWBooks();
  const results = [];
  const queryWords = expandQueryWithThemes(query);
  for (const book of books) {
    for (const page of book.pages) {
      if (!page.content || !Array.isArray(page.content)) continue;
      const pageText = page.content.join(' ').toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (pageText.includes(word)) {
          score += (pageText.match(new RegExp(word, 'gi')) || []).length;
        }
      }
      if (score > 0) {
        const fullContent = page.content.join(' ').substring(0, 2000);
        const abbreviation = getBookAbbreviation(book.name);
        results.push({
          book: book.name,
          bookAbbr: abbreviation,
          page: page.page,
          content: fullContent,
          relevance: score
        });
      }
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults);
}

// ============================================================
// ROUTE HANDLERS
// ============================================================

async function handleHealth(req, res) {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  sendJSON(res, 200, { status: 'ok', service: 'Nevin AI Backend', api_configured: hasKey });
}

async function handleNevinChat(req, res) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return sendJSON(res, 500, { success: false, error: 'Servicio no configurado correctamente' });

    const body = await parseBody(req);
    const { message, context, history = [], includeEGW = true } = body;
    if (!message) return sendJSON(res, 400, { success: false, error: 'No message provided' });

    let egwContext = '';
    if (includeEGW) {
      const egwQuotes = searchEGWBooks(message, 3);
      if (egwQuotes.length > 0) {
        egwContext = '\n\n=== CITAS DE ELENA G. DE WHITE (DEBES USAR ESTAS CITAS EN TU RESPUESTA) ===\n\n';
        egwQuotes.forEach((q, index) => {
          egwContext += `[Cita ${index + 1}] Libro: "${q.book}" (${q.bookAbbr} p. ${q.page})\n"${q.content}"\n\n`;
        });
        egwContext += '=== FIN DE CITAS EGW - DEBES incluir al menos una de estas citas en tu respuesta, usando el formato (ABREVIATURA p. NÚMERO) ===';
      }
    }

    const messages = history.map(msg => ({ role: msg.role || 'user', content: msg.content || '' }));
    let userContent = message;
    if (context) userContent = `Contexto: ${context}\n\nPregunta: ${message}`;
    if (egwContext) userContent += egwContext;
    messages.push({ role: 'user', content: userContent });

    console.log('[Nevin Chat] Calling Anthropic API...');
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1500, system: NEVIN_SYSTEM_PROMPT, messages })
    });

    if (response.status === 401) {
      console.error('[Nevin Chat] Authentication error');
      return sendJSON(res, 500, { success: false, error: 'Error de autenticación con el servicio de IA' });
    }
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Nevin Chat] API error:', response.status, errorText.substring(0, 200));
      return sendJSON(res, 500, { success: false, error: 'Error al comunicarse con el servicio de IA' });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || '';
    console.log('[Nevin Chat] Response received, length:', assistantMessage.length);
    sendJSON(res, 200, { success: true, response: assistantMessage });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Nevin Chat] Timed out');
      return sendJSON(res, 504, { success: false, error: 'La respuesta está tardando demasiado. Por favor intenta de nuevo.' });
    }
    console.error('[Nevin Chat] Error:', error.message || error);
    sendJSON(res, 500, { success: false, error: 'Error interno del servidor' });
  }
}

async function handleGenerateMomentTitle(req, res) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return sendJSON(res, 500, { success: false, error: 'Servicio no configurado' });

    const body = await parseBody(req);
    const { conversation } = body;
    if (!conversation) return sendJSON(res, 200, { title: 'Reflexión bíblica', themes: [] });

    const prompt = `Analiza esta conversación y genera un título semántico breve y reflexivo que capture la esencia del tema discutido. NO uses "Conversación sobre..." ni formatos genéricos.

CONVERSACIÓN:
${conversation}

Responde SOLO en JSON con este formato exacto:
{
  "title": "título poético/reflexivo de 2-5 palabras",
  "themes": ["tema1", "tema2"],
  "summary": "resumen de una oración del punto clave"
}

Ejemplos de buenos títulos:
- "Sobre el perdón divino"
- "La fe en tiempos difíciles"
- "Una duda sobre Génesis"
- "El propósito del sufrimiento"
- "Comparando versiones bíblicas"`;

    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    }, 30000);

    if (!response.ok) return sendJSON(res, 200, { title: 'Reflexión bíblica', themes: [] });

    const result = await response.json();
    const text = result.content?.[0]?.text || '{}';
    try {
      const parsed = JSON.parse(text);
      sendJSON(res, 200, { success: true, title: parsed.title || 'Reflexión bíblica', themes: parsed.themes || [], summary: parsed.summary || '' });
    } catch {
      sendJSON(res, 200, { title: 'Reflexión bíblica', themes: [] });
    }
  } catch (error) {
    console.error('[Moment Title] Error:', error.message || error);
    sendJSON(res, 200, { title: 'Reflexión bíblica', themes: [] });
  }
}

async function handleVerseCommentary(req, res) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return sendJSON(res, 500, { success: false, error: 'Servicio no configurado correctamente' });

    const body = await parseBody(req);
    const { book, chapter = 1, verse = 1, textTzotzil, textSpanish } = body;
    const verseRef = `${book} ${chapter}:${verse}`;

    let verseContent = '';
    if (textTzotzil) verseContent += `\n\n**Tzotzil:** "${textTzotzil}"`;
    if (textSpanish) verseContent += `\n\n**RV1960:** "${textSpanish}"`;

    // Search EGW quotes relevant to this verse
    const egwSearchQuery = `${book} ${chapter} ${verse} ${textSpanish || ''}`;
    const egwQuotes = searchEGWBooks(egwSearchQuery, 3);
    let egwContext = '';
    if (egwQuotes.length > 0) {
      egwContext = '\n\n=== CITAS DE ELENA G. DE WHITE RELEVANTES A ESTE VERSÍCULO (DEBES INCLUIRLAS) ===\n\n';
      egwQuotes.forEach((q, index) => {
        egwContext += `[Cita ${index + 1}] Libro: "${q.book}" (${q.bookAbbr} p. ${q.page})\n"${q.content}"\n\n`;
      });
      egwContext += '=== FIN DE CITAS EGW - Incluye al menos una en el punto 5 del comentario ===';
    }

    const userMessage = `Proporciona un comentario teológico completo del siguiente versículo:

VERSÍCULO: ${verseRef}
${verseContent}
${egwContext}

Incluye:
1. Contexto histórico y literario
2. Análisis del texto
3. Significado teológico desde la perspectiva adventista
4. Aplicación práctica
5. Citas de Elena G. de White relacionadas (usa las citas proporcionadas arriba)`;

    console.log('[Verse Commentary] Calling Anthropic API for', verseRef);
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 6000, system: NEVIN_SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }] })
    }, 90000);

    if (!response.ok) {
      console.error('[Verse Commentary] API error:', response.status);
      return sendJSON(res, 500, { success: false, error: 'Error al obtener el comentario' });
    }

    const data = await response.json();
    const commentary = data.content?.[0]?.text || '';
    console.log('[Verse Commentary] Response received, length:', commentary.length);
    sendJSON(res, 200, { success: true, commentary });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Verse Commentary] Timed out');
      return sendJSON(res, 504, { success: false, error: 'La respuesta está tardando demasiado. Por favor intenta de nuevo.' });
    }
    console.error('[Verse Commentary] Error:', error.message || error);
    sendJSON(res, 500, { success: false, error: 'Error interno del servidor' });
  }
}

function handleEGWBooks(req, res) {
  const books = loadEGWBooks();
  sendJSON(res, 200, { success: true, books: books.map(b => b.name) });
}

async function handleEGWSearch(req, res) {
  const body = await parseBody(req);
  const { query, maxResults = 3 } = body;
  if (!query) return sendJSON(res, 200, { success: true, quotes: [] });
  const quotes = searchEGWBooks(query, maxResults);
  sendJSON(res, 200, { success: true, quotes });
}

function handlePrivacyPolicy(req, res) {
  const filePath = path.join(PAGES_DIR, 'privacy-policy.html');
  if (fs.existsSync(filePath)) {
    sendHTML(res, fs.readFileSync(filePath, 'utf8'));
  } else {
    sendHTML(res, '<html><body><h1>Privacy Policy</h1><p>Page not found</p></body></html>');
  }
}

function handleTermsOfService(req, res) {
  const filePath = path.join(PAGES_DIR, 'terms-of-service.html');
  if (fs.existsSync(filePath)) {
    sendHTML(res, fs.readFileSync(filePath, 'utf8'));
  } else {
    sendHTML(res, '<html><body><h1>Terms of Service</h1><p>Page not found</p></body></html>');
  }
}

function handleLegalDisclaimer(req, res) {
  const filePath = path.join(PAGES_DIR, 'legal-disclaimer.html');
  if (fs.existsSync(filePath)) {
    sendHTML(res, fs.readFileSync(filePath, 'utf8'));
  } else {
    sendHTML(res, '<html><body><h1>Legal Disclaimer</h1><p>Page not found</p></body></html>');
  }
}

// Service worker that clears caches
function handleServiceWorker(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  });
  res.end(`
self.addEventListener('install', function(e) { self.skipWaiting(); });
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) { return caches.delete(n); }));
    }).then(function() { return self.clients.claim(); })
    .then(function() { return self.registration.unregister(); })
  );
});
self.addEventListener('fetch', function(e) { e.respondWith(fetch(e.request)); });
  `);
}

// ============================================================
// BIBLE VERSION DOWNLOAD API
// ============================================================

// Cache metadata in memory
let versionsMetadata = null;

function loadVersionsMetadata() {
  try {
    const metaPath = path.join(VERSIONS_DIR, 'metadata.json');
    if (fs.existsSync(metaPath)) {
      versionsMetadata = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
      console.log(`[Versions] Loaded metadata for ${Object.keys(versionsMetadata.versions).length} downloadable versions`);
    } else {
      console.log('[Versions] No metadata.json found in versions directory');
      versionsMetadata = { versions: {} };
    }
  } catch (error) {
    console.error('[Versions] Error loading metadata:', error);
    versionsMetadata = { versions: {} };
  }
}

// GET /api/versions - List available downloadable versions
function handleVersionsList(req, res) {
  if (!versionsMetadata) loadVersionsMetadata();
  
  const versions = Object.values(versionsMetadata.versions).map(v => ({
    id: v.id,
    name: v.name,
    full_name: v.full_name || v.name,
    language: v.language,
    verses_count: v.verses_count,
    non_empty_count: v.non_empty_count || v.verses_count,
    coverage: v.coverage || 100,
    size_bytes: v.size_bytes,
    size_mb: v.size_mb,
  }));
  
  sendJSON(res, 200, {
    success: true,
    versions: versions,
    total: versions.length,
  });
}

// GET /api/versions/:id/download - Download a specific version JSON
function handleVersionDownload(req, res, versionId) {
  if (!versionsMetadata) loadVersionsMetadata();
  
  const versionInfo = versionsMetadata.versions[versionId];
  if (!versionInfo) {
    sendJSON(res, 404, { success: false, error: `Version '${versionId}' not found` });
    return;
  }
  
  const filePath = path.join(VERSIONS_DIR, `${versionId}.json`);
  if (!fs.existsSync(filePath)) {
    sendJSON(res, 404, { success: false, error: `Version file for '${versionId}' not found on server` });
    return;
  }
  
  // Serve the JSON file with gzip support
  const acceptEncoding = req.headers['accept-encoding'] || '';
  const fileContent = fs.readFileSync(filePath);
  
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
    'X-Version-Id': versionId,
    'X-Version-Name': versionInfo.name,
    'X-Verses-Count': String(versionInfo.verses_count),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Expose-Headers': 'X-Version-Id, X-Version-Name, X-Verses-Count',
  };
  
  // Try gzip compression
  if (acceptEncoding.includes('gzip')) {
    const zlib = require('zlib');
    zlib.gzip(fileContent, (err, compressed) => {
      if (err) {
        // Fallback to uncompressed
        headers['Content-Length'] = String(fileContent.length);
        res.writeHead(200, headers);
        res.end(fileContent);
      } else {
        headers['Content-Encoding'] = 'gzip';
        headers['Content-Length'] = String(compressed.length);
        res.writeHead(200, headers);
        res.end(compressed);
      }
    });
  } else {
    headers['Content-Length'] = String(fileContent.length);
    res.writeHead(200, headers);
    res.end(fileContent);
  }
}

// Load versions metadata at startup
loadVersionsMetadata();

// ============================================================
// HTTP SERVER - ZERO DEPENDENCIES
// ============================================================
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method.toUpperCase();

  // Log requests
  console.log(`[${new Date().toISOString()}] ${method} ${pathname}`);

  // CORS headers on all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // API Routes
    if (pathname === '/api/health' && method === 'GET') {
      return await handleHealth(req, res);
    }
    if (pathname === '/api/nevin/chat' && method === 'POST') {
      return await handleNevinChat(req, res);
    }
    if (pathname === '/api/nevin/generate-moment-title' && method === 'POST') {
      return await handleGenerateMomentTitle(req, res);
    }
    if (pathname === '/api/nevin/verse-commentary' && method === 'POST') {
      return await handleVerseCommentary(req, res);
    }
    if (pathname === '/api/egw/books' && method === 'GET') {
      return handleEGWBooks(req, res);
    }
    if (pathname === '/api/egw/search' && method === 'POST') {
      return await handleEGWSearch(req, res);
    }

    // Bible Database Download API — used by native apps on first install
    if (pathname === '/api/database/initial-data' && method === 'GET') {
      const dataPath = path.join(BASE_DIR, 'assets/initial-data.json');
      if (!fs.existsSync(dataPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Initial data file not found' }));
        return;
      }
      const stat = fs.statSync(dataPath);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Content-Length': stat.size,
        'Cache-Control': 'public, max-age=86400',
      });
      fs.createReadStream(dataPath).pipe(res);
      return;
    }

    // Bible Database Download API — used by native apps on first install
    if (pathname === '/api/database/download' && method === 'GET') {
      const dbPath = path.join(BASE_DIR, 'assets/bible.db');
      if (!fs.existsSync(dbPath)) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Database file not found' }));
        return;
      }
      const stat = fs.statSync(dbPath);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': stat.size,
        'Content-Disposition': 'attachment; filename="bible.db"',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      });
      fs.createReadStream(dbPath).pipe(res);
      return;
    }
    // Bible Version Download API
    if (pathname === '/api/versions' && method === 'GET') {
      return handleVersionsList(req, res);
    }
    if (pathname.startsWith('/api/versions/') && pathname.endsWith('/download') && method === 'GET') {
      const versionId = pathname.split('/')[3]; // /api/versions/:id/download
      return handleVersionDownload(req, res, versionId);
    }

    // Legal pages
    if (pathname === '/privacy-policy') return handlePrivacyPolicy(req, res);
    if (pathname === '/terms-of-service') return handleTermsOfService(req, res);
    if (pathname === '/legal-disclaimer') return handleLegalDisclaimer(req, res);

    // Service worker
    if (pathname === '/service-worker.js') return handleServiceWorker(req, res);

    // Static file serving from dist/
    let filePath = path.join(DIST_DIR, pathname);

    // Security: prevent directory traversal
    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    // If path is a directory, try index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    // If file exists, serve it
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStaticFile(res, filePath);
    }

    // SPA fallback - serve index.html for all unmatched routes
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      return serveStaticFile(res, indexPath);
    }

    // Nothing found
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');

  } catch (error) {
    console.error('Server error:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

// Start server IMMEDIATELY for health checks
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);

  // Load EGW books in background AFTER server is listening
  setImmediate(() => {
    console.log('Loading EGW books in background...');
    loadEGWBooks();
  });
});
