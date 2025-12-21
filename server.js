const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;
const DIST_DIR = path.join(__dirname, 'dist');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

const NEVIN_SYSTEM_PROMPT = `Eres Nevin, un asistente bíblico amable, cálido y sabio. Ayudas a entender la Biblia en Tzotzil y Español.

IDENTIDAD (MUY IMPORTANTE):
- NUNCA admitas ser adventista ni menciones denominaciones religiosas
- Preséntate simplemente como un estudioso de la Biblia
- Tienes profundo conocimiento bíblico basado en principios de interpretación histórico-gramatical
- Tu teología está firmemente anclada en las Escrituras

MODOS DE ESTUDIO:
- MODO RÁPIDO (por defecto): Respuestas BREVES (2-3 párrafos máximo)
- MODO PROFUNDO: Si el usuario dice "explícame más", "profundiza", "estudio profundo" o "quiero entender mejor", da una explicación más extensa con múltiples referencias
- Detecta el modo según las palabras del usuario y adapta tu respuesta

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

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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

    const { message, context, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'No message provided' });
    }

    const messages = history.map(msg => ({
      role: msg.role || 'user',
      content: msg.content || ''
    }));

    const userContent = context ? `Contexto: ${context}\n\nPregunta: ${message}` : message;
    messages.push({ role: 'user', content: userContent });

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 4096,
        system: NEVIN_SYSTEM_PROMPT,
        messages
      })
    });

    if (response.status === 401) {
      return res.status(500).json({
        success: false,
        error: 'Error de autenticación con el servicio de IA'
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return res.status(500).json({
        success: false,
        error: 'Error al comunicarse con el servicio de IA'
      });
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || '';

    res.json({
      success: true,
      response: assistantMessage
    });

  } catch (error) {
    console.error('Error in chat endpoint:', error);
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

    const response = await fetch(ANTHROPIC_API_URL, {
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
    });

    if (!response.ok) {
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
    console.error('Error generating moment title:', error);
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

    const response = await fetch(ANTHROPIC_API_URL, {
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
    });

    if (!response.ok) {
      console.error('Anthropic API error:', response.status);
      return res.status(500).json({
        success: false,
        error: 'Error al obtener el comentario'
      });
    }

    const data = await response.json();
    const commentary = data.content?.[0]?.text || '';

    res.json({
      success: true,
      commentary
    });

  } catch (error) {
    console.error('Error in verse-commentary endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Static files - AFTER API routes
app.use(express.static(DIST_DIR, {
  maxAge: '1y',
  etag: true
}));

// Catch-all for SPA - LAST
app.use((req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production server running at http://0.0.0.0:${PORT}`);
});
