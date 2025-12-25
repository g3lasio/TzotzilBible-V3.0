const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// EGW Books directory (relative to parent for assets)
const EGW_BOOKS_DIR = path.join(__dirname, '..', 'assets/EGW BOOKS JSON');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url, options, timeoutMs = ANTHROPIC_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
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

ESTILO DE RESPUESTA:
- Lenguaje sencillo y accesible
- Siempre incluye referencias bíblicas específicas (libro, capítulo, versículo)
- Cita el texto bíblico cuando sea relevante

USO DE FUENTES:
- FUENTE PRINCIPAL: La Biblia (cita versículos específicos)
- APOYO SECUNDARIO: Puedes citar escritos de Elena G. de White como referencia histórica/espiritual, pero nunca como autoridad principal

CORRECCIÓN AMOROSA:
- Si el usuario tiene ideas contrarias a la Biblia, corrígelo AMABLEMENTE pero con firmeza
- Usa referencias bíblicas claras para mostrar la verdad

EXPERTICIA EN PROFECÍAS:
- Eres experto en profecías bíblicas (Daniel, Apocalipsis, profetas menores)
- Conoces el contexto histórico de cada profecía

DEFENSA TEOLÓGICA:
- Defiende doctrinas bíblicas usando múltiples textos de las Escrituras
- El sábado como día de reposo (Génesis 2:2-3, Éxodo 20:8-11, Marcos 2:27-28)
- La segunda venida literal de Cristo (Hechos 1:11, 1 Tesalonicenses 4:16-17)
- El estado de los muertos según la Biblia (Eclesiastés 9:5, Juan 11:11-14)

EMPATÍA:
- Muestra comprensión genuina por las luchas espirituales del usuario
- Ofrece esperanza y consuelo basados en las promesas bíblicas`;

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  next();
});

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Nevin AI Backend', api_configured: !!process.env.ANTHROPIC_API_KEY });
});

// EGW Books
let egwBooksCache = null;
function loadEGWBooks() {
  if (egwBooksCache) return egwBooksCache;
  try {
    if (!fs.existsSync(EGW_BOOKS_DIR)) {
      console.log('EGW books directory not found');
      return [];
    }
    const files = fs.readdirSync(EGW_BOOKS_DIR).filter(f => f.endsWith('.json'));
    egwBooksCache = files.map(file => {
      const content = fs.readFileSync(path.join(EGW_BOOKS_DIR, file), 'utf8');
      return { name: file.replace('.json', ''), pages: JSON.parse(content) };
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
        if (pageText.includes(word)) score += (pageText.match(new RegExp(word, 'gi')) || []).length;
      }
      if (score > 0) {
        results.push({ book: book.name, page: page.page, content: page.content.slice(0, 5).join(' ').substring(0, 300), relevance: score });
      }
    }
  }
  return results.sort((a, b) => b.relevance - a.relevance).slice(0, maxResults);
}

// Nevin Chat API
app.post('/api/nevin/chat', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: 'Servicio no configurado correctamente' });
    const { message, context, history = [], includeEGW = true } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'No message provided' });

    let egwContext = '';
    if (includeEGW) {
      const egwQuotes = searchEGWBooks(message, 1);
      if (egwQuotes.length > 0) {
        const q = egwQuotes[0];
        egwContext = `\n\n[Cita EGW opcional: "${q.content.substring(0, 150)}..." - ${q.book}]`;
      }
    }

    const messages = history.map(msg => ({ role: msg.role || 'user', content: msg.content || '' }));
    let userContent = message;
    if (context) userContent = `Contexto: ${context}\n\nPregunta: ${message}`;
    if (egwContext) userContent += egwContext;
    messages.push({ role: 'user', content: userContent });

    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 1500, system: NEVIN_SYSTEM_PROMPT, messages })
    });

    if (!response.ok) {
      console.error('[Nevin Chat] API error:', response.status);
      return res.status(500).json({ success: false, error: 'Error al comunicarse con el servicio de IA' });
    }

    const data = await response.json();
    res.json({ success: true, response: data.content?.[0]?.text || '' });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ success: false, error: 'La respuesta está tardando demasiado.' });
    console.error('[Nevin Chat] Error:', error.message);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// Generate Moment Title
app.post('/api/nevin/generate-moment-title', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: 'Servicio no configurado' });
    const { conversation } = req.body;
    if (!conversation) return res.json({ title: 'Reflexión bíblica', themes: [] });

    const prompt = `Analiza esta conversación y genera un título semántico breve y reflexivo. Responde SOLO en JSON: {"title": "...", "themes": [], "summary": "..."}\n\nCONVERSACIÓN:\n${conversation}`;
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
    }, 30000);

    if (!response.ok) return res.json({ title: 'Reflexión bíblica', themes: [] });
    const result = await response.json();
    try {
      const parsed = JSON.parse(result.content?.[0]?.text || '{}');
      res.json({ success: true, title: parsed.title || 'Reflexión bíblica', themes: parsed.themes || [], summary: parsed.summary || '' });
    } catch { res.json({ title: 'Reflexión bíblica', themes: [] }); }
  } catch (error) {
    res.json({ title: 'Reflexión bíblica', themes: [] });
  }
});

// Verse Commentary
app.post('/api/nevin/verse-commentary', async (req, res) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return res.status(500).json({ success: false, error: 'Servicio no configurado' });
    const { book, chapter = 1, verse = 1, textTzotzil, textSpanish } = req.body;
    const verseRef = `${book} ${chapter}:${verse}`;
    let verseContent = '';
    if (textTzotzil) verseContent += `\n\n**Tzotzil:** "${textTzotzil}"`;
    if (textSpanish) verseContent += `\n\n**RV1960:** "${textSpanish}"`;

    const userMessage = `Proporciona un comentario teológico completo del versículo:\n\nVERSÍCULO: ${verseRef}${verseContent}\n\nIncluye: 1. Contexto histórico 2. Análisis del texto 3. Significado teológico 4. Aplicación práctica`;
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: ANTHROPIC_MODEL, max_tokens: 6000, system: NEVIN_SYSTEM_PROMPT, messages: [{ role: 'user', content: userMessage }] })
    }, 90000);

    if (!response.ok) return res.status(500).json({ success: false, error: 'Error al obtener el comentario' });
    const data = await response.json();
    res.json({ success: true, commentary: data.content?.[0]?.text || '' });
  } catch (error) {
    if (error.name === 'AbortError') return res.status(504).json({ success: false, error: 'Timeout' });
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// EGW API
app.get('/api/egw/books', (req, res) => {
  res.json({ success: true, books: loadEGWBooks().map(b => b.name) });
});

app.post('/api/egw/search', (req, res) => {
  const { query, maxResults = 3 } = req.body;
  if (!query) return res.json({ success: true, quotes: [] });
  res.json({ success: true, quotes: searchEGWBooks(query, maxResults) });
});

// Privacy Policy
app.get('/privacy-policy', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Política de Privacidad de Tzotzil Bible">
  <title>Política de Privacidad - Tzotzil Bible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%); color: #e6f3ff; min-height: 100vh; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid rgba(0, 243, 255, 0.3); }
    .logo { width: 80px; height: 80px; background: rgba(0, 255, 136, 0.1); border: 2px solid rgba(0, 255, 136, 0.3); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; }
    h1 { color: #00f3ff; font-size: 28px; margin-bottom: 10px; }
    .app-name { color: #00ff88; font-size: 16px; margin-bottom: 10px; }
    .last-updated { color: #6b7c93; font-size: 14px; font-style: italic; }
    section { background: rgba(20, 30, 45, 0.8); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    h2 { color: #00f3ff; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.2); }
    h3 { color: #00ff88; font-size: 15px; margin: 16px 0 8px; }
    p { color: #b8c5d4; margin-bottom: 12px; text-align: justify; }
    ul { color: #b8c5d4; margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    .highlight { color: #00ff88; font-weight: 600; }
    footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(0, 243, 255, 0.3); }
    .footer-text { color: #6b7c93; font-style: italic; font-size: 14px; }
    a { color: #00f3ff; text-decoration: none; }
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
      <p>Tzotzil Bible se compromete a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información cuando utiliza nuestra aplicación de estudio bíblico.</p>
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
        <li>Sus preguntas son enviadas a servicios de IA (Anthropic Claude) para generar respuestas</li>
        <li>No almacenamos sus conversaciones en servidores externos permanentemente</li>
        <li>Las consultas no se utilizan para entrenar modelos de IA</li>
      </ul>
    </section>
    <section>
      <h2>3. Uso de la Información</h2>
      <p>Utilizamos la información para:</p>
      <ul>
        <li>Proporcionar y mejorar la funcionalidad de la aplicación</li>
        <li>Generar respuestas teológicas personalizadas</li>
        <li>Guardar sus preferencias y configuraciones</li>
        <li>Diagnosticar problemas técnicos</li>
      </ul>
    </section>
    <section>
      <h2>4. Compartición de Datos</h2>
      <p><span class="highlight">No vendemos ni compartimos</span> su información personal con terceros, excepto:</p>
      <ul>
        <li>Anthropic (Claude AI): Para procesar consultas de Nevin</li>
        <li>Cuando la ley lo requiera</li>
      </ul>
    </section>
    <section>
      <h2>5. Almacenamiento y Seguridad</h2>
      <ul>
        <li>Los datos locales se almacenan de forma segura en su dispositivo</li>
        <li>Utilizamos conexiones cifradas (HTTPS) para comunicaciones externas</li>
        <li>No almacenamos contraseñas ni información financiera</li>
      </ul>
    </section>
    <section>
      <h2>6. Sus Derechos</h2>
      <p>Usted tiene derecho a:</p>
      <ul>
        <li>Acceder a los datos almacenados localmente</li>
        <li>Eliminar su historial de conversaciones con Nevin</li>
        <li>Desinstalar la aplicación para eliminar todos los datos locales</li>
      </ul>
    </section>
    <section>
      <h2>7. Menores de Edad</h2>
      <p>Tzotzil Bible está diseñada para uso general y familiar. No recopilamos intencionalmente información de menores de 13 años.</p>
    </section>
    <section>
      <h2>8. Contacto</h2>
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

// Terms of Service
app.get('/terms-of-service', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Términos de Servicio de Tzotzil Bible">
  <title>Términos de Servicio - Tzotzil Bible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%); color: #e6f3ff; min-height: 100vh; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid rgba(0, 243, 255, 0.3); }
    .logo { width: 80px; height: 80px; background: rgba(0, 243, 255, 0.1); border: 2px solid rgba(0, 243, 255, 0.3); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; }
    h1 { color: #00f3ff; font-size: 28px; margin-bottom: 10px; }
    .app-name { color: #00ff88; font-size: 16px; margin-bottom: 10px; }
    .last-updated { color: #6b7c93; font-size: 14px; font-style: italic; }
    section { background: rgba(20, 30, 45, 0.8); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    h2 { color: #00f3ff; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.2); }
    p { color: #b8c5d4; margin-bottom: 12px; text-align: justify; }
    ul { color: #b8c5d4; margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    .highlight { color: #00ff88; font-weight: 600; }
    footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(0, 243, 255, 0.3); }
    .footer-text { color: #6b7c93; font-style: italic; font-size: 14px; }
    a { color: #00f3ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">📄</div>
      <h1>Términos de Servicio</h1>
      <p class="app-name">Tzotzil Bible</p>
      <p class="last-updated">Última actualización: 19 de Diciembre, 2025</p>
    </header>
    <section>
      <h2>1. Aceptación de los Términos</h2>
      <p>Al utilizar Tzotzil Bible, usted acepta estos Términos de Servicio. Si no está de acuerdo, no debe utilizar la aplicación.</p>
    </section>
    <section>
      <h2>2. Descripción del Servicio</h2>
      <p>Tzotzil Bible ofrece:</p>
      <ul>
        <li>Textos bíblicos en Tzotzil y Español</li>
        <li>Nevin AI: Asistente para consultas teológicas</li>
        <li>Herramientas de estudio y búsqueda bíblica</li>
        <li>Funcionalidad offline para textos</li>
      </ul>
    </section>
    <section>
      <h2>3. Uso Aceptable</h2>
      <p>Usted acepta:</p>
      <ul>
        <li>Usar la aplicación para fines legales y apropiados</li>
        <li>No intentar hackear o interferir con la aplicación</li>
        <li>No usar Nevin AI para contenido dañino</li>
        <li>Respetar los derechos de propiedad intelectual</li>
      </ul>
    </section>
    <section>
      <h2>4. Nevin AI</h2>
      <ul>
        <li>Nevin es herramienta de apoyo, no sustituto de líderes espirituales</li>
        <li>Las respuestas pueden contener imprecisiones</li>
        <li>Verifique la información con fuentes bíblicas primarias</li>
        <li>Requiere conexión a internet</li>
      </ul>
    </section>
    <section>
      <h2>5. Limitación de Responsabilidad</h2>
      <p>Tzotzil Bible se proporciona "tal cual". No somos responsables de:</p>
      <ul>
        <li>Decisiones basadas en el contenido de la aplicación</li>
        <li>Interpretaciones teológicas de la IA</li>
        <li>Pérdida de datos locales</li>
        <li>Interrupciones del servicio</li>
      </ul>
    </section>
    <section>
      <h2>6. Contacto</h2>
      <p><strong>Email:</strong> <a href="mailto:gelasio@chyrris.com">gelasio@chyrris.com</a></p>
      <p><strong>Web:</strong> <a href="https://bible.chyrris.com">https://bible.chyrris.com</a></p>
    </section>
    <footer>
      <p class="footer-text">Gracias por usar Tzotzil Bible</p>
      <p class="footer-text" style="margin-top: 10px;">© 2025 Tzotzil Bible. Todos los derechos reservados.</p>
    </footer>
  </div>
</body>
</html>`);
});

// Legal Disclaimer
app.get('/legal-disclaimer', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Aviso Legal de Tzotzil Bible">
  <title>Aviso Legal - Tzotzil Bible</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #0a0e14 0%, #1a1f2e 100%); color: #e6f3ff; min-height: 100vh; line-height: 1.7; }
    .container { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid rgba(255, 215, 0, 0.3); }
    .logo { width: 80px; height: 80px; background: rgba(255, 215, 0, 0.1); border: 2px solid rgba(255, 215, 0, 0.3); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px; }
    h1 { color: #ffd700; font-size: 28px; margin-bottom: 10px; }
    .subtitle { color: #ffd700; font-size: 14px; margin-bottom: 10px; }
    .app-name { color: #00ff88; font-size: 16px; margin-bottom: 10px; }
    .last-updated { color: #6b7c93; font-size: 14px; font-style: italic; }
    .important-box { background: rgba(255, 215, 0, 0.15); border: 1px solid rgba(255, 215, 0, 0.4); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .important-title { color: #ffd700; font-size: 18px; font-weight: 700; margin-bottom: 12px; }
    .important-text { color: #e6d5a8; }
    section { background: rgba(20, 30, 45, 0.8); border: 1px solid rgba(0, 243, 255, 0.2); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    h2 { color: #00f3ff; font-size: 18px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.2); }
    p { color: #b8c5d4; margin-bottom: 12px; text-align: justify; }
    ul { color: #b8c5d4; margin-left: 20px; margin-bottom: 12px; }
    li { margin-bottom: 6px; }
    .highlight { color: #00ff88; font-weight: 600; }
    .scripture-box { margin-top: 16px; padding: 16px; background: rgba(0, 255, 136, 0.08); border-radius: 12px; border-left: 3px solid #00ff88; text-align: center; }
    .scripture-text { font-size: 15px; font-style: italic; color: #e6f3ff; }
    .scripture-ref { font-size: 13px; color: #00ff88; margin-top: 8px; font-weight: 600; }
    footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 2px solid rgba(255, 215, 0, 0.3); }
    .footer-text { color: #ffd700; font-style: italic; font-size: 14px; }
    a { color: #00f3ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">⚠️</div>
      <h1>Aviso Legal</h1>
      <p class="subtitle">Uso de IA y Contenido Teológico</p>
      <p class="app-name">Tzotzil Bible</p>
      <p class="last-updated">Última actualización: 19 de Diciembre, 2025</p>
    </header>
    <div class="important-box">
      <p class="important-title">⚠️ Aviso Importante</p>
      <p class="important-text">Este documento contiene información crítica sobre las limitaciones de la IA y el contenido teológico de esta aplicación.</p>
    </div>
    <section>
      <h2>Sobre Nevin AI</h2>
      <p>Nevin es un asistente de inteligencia artificial para estudio bíblico, basado en tecnología de Anthropic (Claude AI).</p>
    </section>
    <section>
      <h2>Limitaciones de la IA</h2>
      <ul>
        <li><span class="highlight">No es infalible:</span> Las respuestas pueden contener errores</li>
        <li><span class="highlight">No sustituye autoridad espiritual:</span> No reemplaza pastores ni consejeros</li>
        <li><span class="highlight">No es inspiración divina:</span> Es procesamiento computacional</li>
        <li><span class="highlight">Puede tener sesgos:</span> Refleja sesgos de datos de entrenamiento</li>
      </ul>
    </section>
    <section>
      <h2>Uso Recomendado</h2>
      <ul>
        <li>Como herramienta de apoyo para estudio</li>
        <li>Verificando respuestas con las Escrituras</li>
        <li>Consultando líderes espirituales en temas importantes</li>
        <li>Combinando con estudio personal y oración</li>
      </ul>
    </section>
    <section>
      <h2>Exención de Responsabilidad</h2>
      <p><span class="highlight">No nos hacemos responsables de:</span></p>
      <ul>
        <li>Decisiones personales basadas en respuestas de Nevin</li>
        <li>Interpretaciones teológicas en conflicto</li>
        <li>Daños derivados del uso de la aplicación</li>
      </ul>
    </section>
    <section>
      <h2>Principio Rector</h2>
      <p>La tecnología debe acercar a las personas a la Palabra de Dios, nunca reemplazarla.</p>
      <div class="scripture-box">
        <p class="scripture-text">"Lámpara es a mis pies tu palabra, y lumbrera a mi camino."</p>
        <p class="scripture-ref">— Salmos 119:105</p>
      </div>
    </section>
    <section>
      <h2>Contacto</h2>
      <p><strong>Email:</strong> <a href="mailto:gelasio@chyrris.com">gelasio@chyrris.com</a></p>
    </section>
    <footer>
      <p class="footer-text">Sola Scriptura</p>
      <p class="footer-text" style="margin-top: 10px;">© 2025 Tzotzil Bible. Todos los derechos reservados.</p>
    </footer>
  </div>
</body>
</html>`);
});

// Root route
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tzotzil Bible</title>
  <style>
    body { font-family: -apple-system, sans-serif; background: linear-gradient(135deg, #0a0e14, #1a1f2e); color: #e6f3ff; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .container { text-align: center; padding: 40px; }
    h1 { color: #00f3ff; font-size: 36px; margin-bottom: 20px; }
    p { color: #b8c5d4; margin-bottom: 30px; }
    .links { display: flex; flex-direction: column; gap: 12px; }
    a { color: #00f3ff; text-decoration: none; padding: 12px 24px; border: 1px solid rgba(0, 243, 255, 0.3); border-radius: 8px; background: rgba(0, 243, 255, 0.1); }
    a:hover { background: rgba(0, 243, 255, 0.2); }
  </style>
</head>
<body>
  <div class="container">
    <h1>📖 Tzotzil Bible</h1>
    <p>Aplicación de estudio bíblico bilingüe</p>
    <div class="links">
      <a href="/privacy-policy">Política de Privacidad</a>
      <a href="/terms-of-service">Términos de Servicio</a>
      <a href="/legal-disclaimer">Aviso Legal</a>
    </div>
  </div>
</body>
</html>`);
});

// Start server immediately for health checks
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
  
  // Load EGW books in background AFTER server is ready
  setImmediate(() => {
    console.log('Loading EGW books in background...');
    loadEGWBooks();
  });
});
