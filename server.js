const express = require('express');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const app = express();

const EGW_BOOKS_DIR = path.join(__dirname, 'assets/EGW BOOKS JSON');
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

const indexPath = path.join(DIST_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.log('dist/index.html not found. Building web bundle...');
  try {
    execSync('npx expo export --platform web', { stdio: 'inherit', cwd: __dirname });
    console.log('Web bundle built successfully.');
  } catch (err) {
    console.error('Failed to build web bundle:', err.message);
    process.exit(1);
  }
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_TIMEOUT_MS = 60000; // 60 second timeout for AI responses

// Helper function for fetch with timeout
async function fetchWithTimeout(url, options, timeoutMs = ANTHROPIC_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

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

USO DE FUENTES:
- FUENTE PRINCIPAL: La Biblia (cita versículos específicos)
- APOYO SECUNDARIO: Puedes citar escritos de Elena G. de White como referencia histórica/espiritual, pero nunca como autoridad principal
- APOYO ADICIONAL: Referencias históricas, arqueológicas o científicas cuando refuercen el punto bíblico
- Siempre ilumina un texto con otros textos bíblicos relacionados (especialmente del Nuevo Testamento)

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
- Ora mentalmente por cada persona que interactúa contigo`;

// Request logging middleware with no-cache headers for development
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Service worker - aggressively clear all caches and unregister
app.get('/service-worker.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', 'application/javascript');
  res.send(`
self.addEventListener('install', function(e) { 
  self.skipWaiting(); 
});
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(names.map(function(n) { return caches.delete(n); }));
    }).then(function() { 
      return self.clients.claim(); 
    }).then(function() {
      return self.registration.unregister();
    })
  );
});
self.addEventListener('fetch', function(e) {
  e.respondWith(fetch(e.request));
});
  `);
});

// CORS middleware for mobile apps - MUST be first
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// API ROUTES - Must come BEFORE static file serving

app.get('/api/health', (req, res) => {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  res.json({
    status: 'ok',
    service: 'Nevin AI Backend',
    api_configured: hasKey
  });
});

app.post('/api/nevin/chat', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Servicio no configurado correctamente'
      });
    }

    const { message, context, history = [], includeEGW = true } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    let egwContext = '';
    if (includeEGW) {
      const egwQuotes = searchEGWBooks(message, 1);
      if (egwQuotes.length > 0) {
        const q = egwQuotes[0];
        egwContext = `\n\n[Cita EGW opcional: "${q.content.substring(0, 150)}..." - ${q.book}]`;
      }
    }

    const messages = history.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

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
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: NEVIN_SYSTEM_PROMPT,
        messages
      })
    });

    if (response.status === 401) {
      console.error('[Nevin Chat] Authentication error with Anthropic');
      return res.status(500).json({
        success: false,
        error: 'Error de autenticación con el servicio de IA'
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Nevin Chat] Anthropic API error:', response.status, errorText.substring(0, 200));
      return res.status(500).json({
        success: false,
        error: 'Error al comunicarse con el servicio de IA'
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || '';
    console.log('[Nevin Chat] Response received, length:', assistantMessage.length);

    res.json({
      success: true,
      response: assistantMessage
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Nevin Chat] Request timed out after', ANTHROPIC_TIMEOUT_MS, 'ms');
      return res.status(504).json({
        success: false,
        error: 'La respuesta está tardando demasiado. Por favor intenta de nuevo.'
      });
    }
    console.error('[Nevin Chat] Error:', error.message || error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

app.post('/api/nevin/generate-moment-title', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Servicio no configurado'
      });
    }

    const { conversation } = req.body;
    if (!conversation) {
      return res.json({ title: 'Reflexión bíblica', themes: [] });
    }

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
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }]
      })
    }, 30000); // 30 second timeout for title generation

    if (!response.ok) {
      console.log('[Moment Title] API returned non-OK status:', response.status);
      return res.json({ title: 'Reflexión bíblica', themes: [] });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text || '{}';

    try {
      const parsed = JSON.parse(text);
      res.json({
        success: true,
        title: parsed.title || 'Reflexión bíblica',
        themes: parsed.themes || [],
        summary: parsed.summary || ''
      });
    } catch {
      res.json({ title: 'Reflexión bíblica', themes: [] });
    }

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('[Moment Title] Request timed out');
    } else {
      console.error('[Moment Title] Error:', error.message || error);
    }
    res.json({ title: 'Reflexión bíblica', themes: [] });
  }
});

app.post('/api/nevin/verse-commentary', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Servicio no configurado correctamente'
      });
    }

    const { book, chapter = 1, verse = 1, textTzotzil, textSpanish } = req.body;
    const verseRef = `${book} ${chapter}:${verse}`;

    let verseContent = '';
    if (textTzotzil) verseContent += `\n\n**Tzotzil:** "${textTzotzil}"`;
    if (textSpanish) verseContent += `\n\n**RV1960:** "${textSpanish}"`;

    const userMessage = `Proporciona un comentario teológico completo del siguiente versículo:

VERSÍCULO: ${verseRef}
${verseContent}

Incluye:
1. Contexto histórico y literario
2. Análisis del texto
3. Significado teológico desde la perspectiva adventista
4. Aplicación práctica`;

    console.log('[Verse Commentary] Calling Anthropic API for', verseRef);
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 6000,
        system: NEVIN_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }]
      })
    }, 90000); // 90 second timeout for longer commentary

    if (!response.ok) {
      console.error('[Verse Commentary] Anthropic API error:', response.status);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener el comentario'
      });
    }

    const data = await response.json();
    const commentary = data.content?.[0]?.text || '';
    console.log('[Verse Commentary] Response received, length:', commentary.length);

    res.json({
      success: true,
      commentary
    });

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('[Verse Commentary] Request timed out');
      return res.status(504).json({
        success: false,
        error: 'La respuesta está tardando demasiado. Por favor intenta de nuevo.'
      });
    }
    console.error('[Verse Commentary] Error:', error.message || error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// EGW Books API
let egwBooksCache = null;

function loadEGWBooks() {
  if (egwBooksCache) return egwBooksCache;
  
  try {
    const files = fs.readdirSync(EGW_BOOKS_DIR).filter(f => f.endsWith('.json'));
    egwBooksCache = files.map(file => {
      const filePath = path.join(EGW_BOOKS_DIR, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const pages = JSON.parse(content);
      return {
        name: file.replace('.json', ''),
        pages: pages
      };
    });
    console.log(`Loaded ${egwBooksCache.length} EGW books`);
    return egwBooksCache;
  } catch (error) {
    console.error('Error loading EGW books:', error);
    return [];
  }
}

function searchEGWBooks(query, maxResults = 3) {
  const books = loadEGWBooks();
  const results = [];
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  
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
        results.push({
          book: book.name,
          page: page.page,
          content: page.content.slice(0, 5).join(' ').substring(0, 300),
          relevance: score
        });
      }
    }
  }
  
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, maxResults);
}

app.get('/api/egw/books', (req, res) => {
  const books = loadEGWBooks();
  res.json({ 
    success: true, 
    books: books.map(b => b.name) 
  });
});

app.post('/api/egw/search', (req, res) => {
  const { query, maxResults = 3 } = req.body;
  
  if (!query) {
    return res.json({ success: true, quotes: [] });
  }
  
  const quotes = searchEGWBooks(query, maxResults);
  res.json({ success: true, quotes });
});

// Privacy Policy page - dedicated URL for Google Play Store compliance
app.get('/privacy-policy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Política de Privacidad de Tzotzil Bible - Aplicación de estudio bíblico">
  <title>Política de Privacidad - Tzotzil Bible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%);
      color: #e6f3ff;
      min-height: 100vh;
      line-height: 1.7;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 30px;
      border-bottom: 2px solid rgba(0, 243, 255, 0.3);
    }
    .logo {
      width: 80px;
      height: 80px;
      background: rgba(0, 255, 136, 0.1);
      border: 2px solid rgba(0, 255, 136, 0.3);
      border-radius: 50%;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }
    h1 {
      color: #00f3ff;
      font-size: 28px;
      margin-bottom: 10px;
    }
    .app-name {
      color: #00ff88;
      font-size: 16px;
      margin-bottom: 10px;
    }
    .last-updated {
      color: #6b7c93;
      font-size: 14px;
      font-style: italic;
    }
    section {
      background: rgba(20, 30, 45, 0.8);
      border: 1px solid rgba(0, 243, 255, 0.2);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }
    h2 {
      color: #00f3ff;
      font-size: 18px;
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid rgba(0, 243, 255, 0.2);
    }
    h3 {
      color: #00ff88;
      font-size: 15px;
      margin: 16px 0 8px;
    }
    p {
      color: #b8c5d4;
      margin-bottom: 12px;
      text-align: justify;
    }
    ul {
      color: #b8c5d4;
      margin-left: 20px;
      margin-bottom: 12px;
    }
    li { margin-bottom: 6px; }
    .highlight {
      color: #00ff88;
      font-weight: 600;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 30px;
      border-top: 2px solid rgba(0, 243, 255, 0.3);
    }
    .footer-text {
      color: #6b7c93;
      font-style: italic;
      font-size: 14px;
    }
    a { color: #00f3ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">🛡️</div>
      <h1>Política de Privacidad</h1>
      <p class="app-name">Tzotzil Bible</p>
      <p class="last-updated">Última actualización: 19 de Diciembre, 2025</p>
    </header>

    <section>
      <h2>1. Introducción</h2>
      <p>Tzotzil Bible ("nosotros", "nuestra aplicación") se compromete a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información cuando utiliza nuestra aplicación de estudio bíblico.</p>
      <p>Al utilizar Tzotzil Bible, usted acepta las prácticas descritas en esta política. Le recomendamos leer este documento completo para comprender nuestro compromiso con su privacidad.</p>
    </section>

    <section>
      <h2>2. Información que Recopilamos</h2>
      <h3>2.1 Datos de Uso Local</h3>
      <p>Almacenamos localmente en su dispositivo:</p>
      <ul>
        <li>Preferencias de la aplicación (tamaño de fuente, configuraciones)</li>
        <li>Historial de conversaciones con Nevin AI</li>
        <li>Marcadores y notas personales</li>
        <li>Progreso de lectura bíblica</li>
      </ul>
      <h3>2.2 Datos Procesados por IA</h3>
      <p>Cuando utiliza el asistente Nevin AI:</p>
      <ul>
        <li>Sus preguntas y consultas teológicas son enviadas a servicios externos de inteligencia artificial (Anthropic Claude) para generar respuestas.</li>
        <li>No almacenamos sus conversaciones en servidores externos de forma permanente.</li>
        <li>Las consultas se procesan en tiempo real y no se utilizan para entrenar modelos de IA.</li>
      </ul>
      <h3>2.3 Datos Técnicos</h3>
      <p>Podemos recopilar automáticamente:</p>
      <ul>
        <li>Información básica del dispositivo (modelo, sistema operativo)</li>
        <li>Reportes de errores anónimos para mejorar la estabilidad</li>
        <li>Estadísticas agregadas de uso (sin identificación personal)</li>
      </ul>
    </section>

    <section>
      <h2>3. Uso de la Información</h2>
      <p>Utilizamos la información recopilada para:</p>
      <ul>
        <li>Proporcionar y mejorar la funcionalidad de la aplicación</li>
        <li>Generar respuestas teológicas personalizadas a través de Nevin AI</li>
        <li>Guardar sus preferencias y configuraciones</li>
        <li>Diagnosticar problemas técnicos y mejorar la estabilidad</li>
        <li>Desarrollar nuevas funcionalidades</li>
      </ul>
    </section>

    <section>
      <h2>4. Compartir Información con Terceros</h2>
      <p>Compartimos información limitada con los siguientes terceros:</p>
      <p><span class="highlight">Anthropic (Claude AI):</span> Las consultas realizadas a Nevin AI son procesadas por la API de Anthropic Claude. Anthropic tiene su propia política de privacidad y no utiliza las consultas de API para entrenar sus modelos.</p>
      <p>No vendemos, alquilamos ni compartimos su información personal con terceros para fines de marketing.</p>
    </section>

    <section>
      <h2>5. Almacenamiento y Seguridad</h2>
      <ul>
        <li>Los datos locales se almacenan de forma segura en el almacenamiento interno de su dispositivo.</li>
        <li>Utilizamos conexiones cifradas (HTTPS) para todas las comunicaciones con servidores externos.</li>
        <li>No almacenamos contraseñas ni información financiera.</li>
        <li>Implementamos medidas de seguridad estándar de la industria para proteger sus datos durante la transmisión.</li>
      </ul>
    </section>

    <section>
      <h2>6. Retención de Datos</h2>
      <ul>
        <li>Los datos locales permanecen en su dispositivo hasta que desinstale la aplicación o los elimine manualmente.</li>
        <li>Puede eliminar su historial de conversaciones con Nevin desde la sección de Ajustes.</li>
        <li>Los datos de sesión con servicios de IA no se retienen más allá de la sesión activa.</li>
      </ul>
    </section>

    <section>
      <h2>7. Sus Derechos</h2>
      <p>Usted tiene derecho a:</p>
      <ul>
        <li>Acceder a los datos almacenados localmente en su dispositivo</li>
        <li>Eliminar su historial de conversaciones con Nevin</li>
        <li>Desinstalar la aplicación para eliminar todos los datos locales</li>
        <li>Contactarnos para solicitar información sobre sus datos</li>
        <li>Usar la aplicación sin la función de IA si lo prefiere</li>
      </ul>
    </section>

    <section>
      <h2>8. Menores de Edad</h2>
      <p>Tzotzil Bible está diseñada para uso general y familiar. No recopilamos intencionalmente información personal de menores de 13 años. El contenido de la aplicación es apropiado para todas las edades y promueve valores espirituales positivos.</p>
    </section>

    <section>
      <h2>9. Cambios a esta Política</h2>
      <p>Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos a través de la aplicación. La fecha de "Última actualización" al inicio de este documento indica cuándo se realizó la última modificación.</p>
    </section>

    <section>
      <h2>10. Contacto</h2>
      <p>Si tiene preguntas sobre esta Política de Privacidad o sobre el manejo de sus datos, puede contactarnos en:</p>
      <p><strong>Email:</strong> <a href="mailto:gelasio@chyrris.com">gelasio@chyrris.com</a></p>
      <p><strong>Web:</strong> <a href="https://bible.chyrris.com">https://bible.chyrris.com</a></p>
    </section>

    <footer>
      <p class="footer-text">Su privacidad es nuestra prioridad</p>
      <p class="footer-text" style="margin-top: 10px;">© 2025 Tzotzil Bible. Todos los derechos reservados.</p>
    </footer>
  </div>
</body>
</html>`);
});

// Static files - AFTER API routes (no cache for HTML, cache for assets)
app.use(express.static(DIST_DIR, {
  maxAge: '0',
  etag: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }
  }
}));

// Catch-all for SPA - LAST
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

console.log('Preloading EGW books...');
loadEGWBooks();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);
});
