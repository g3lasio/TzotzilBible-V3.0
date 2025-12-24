const express = require('express');

const app = express();
const PORT = process.env.PORT || 5000;

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_TIMEOUT_MS = 60000;

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

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Root route - returns API info for browser access
app.get('/', (req, res) => {
  res.json({
    service: 'Nevin AI Backend',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      'GET /api/health',
      'POST /api/nevin/chat'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
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

    const { message, context, history = [], includeEGW = false } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    const messages = history.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    let userContent = message;
    if (context) userContent = `Contexto: ${context}\n\nPregunta: ${message}`;
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nevin Backend running at http://0.0.0.0:${PORT}`);
});
