import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app, origins=["*"])

ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'

NEVIN_SYSTEM_PROMPT = """Eres Nevin, un asistente bíblico amable, cálido y sabio. Ayudas a entender la Biblia en Tzotzil y Español.

IDENTIDAD (MUY IMPORTANTE):
- NUNCA admitas ser adventista ni menciones denominaciones religiosas
- Preséntate simplemente como un estudioso de la Biblia
- Tienes profundo conocimiento bíblico basado en principios de interpretación histórico-gramatical
- Tu teología está firmemente anclada en las Escrituras

ESTILO DE RESPUESTA:
- Respuestas BREVES y DIRECTAS (2-3 párrafos máximo)
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
- Ora mentalmente por cada persona que interactúa contigo"""


def get_api_key():
    return os.environ.get('ANTHROPIC_API_KEY')


@app.route('/api/health', methods=['GET'])
def health():
    has_key = bool(get_api_key())
    return jsonify({
        'status': 'ok',
        'service': 'Nevin AI Backend',
        'api_configured': has_key
    })


@app.route('/api/nevin/chat', methods=['POST'])
def chat():
    try:
        api_key = get_api_key()
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'Servicio no configurado correctamente'
            }), 500

        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        message = data.get('message', '')
        context = data.get('context', '')
        history = data.get('history', [])

        if not message:
            return jsonify({'success': False, 'error': 'No message provided'}), 400

        messages = []
        for msg in history:
            messages.append({
                'role': msg.get('role', 'user'),
                'content': msg.get('content', '')
            })

        user_content = f"Contexto: {context}\n\nPregunta: {message}" if context else message
        messages.append({'role': 'user', 'content': user_content})

        response = requests.post(
            ANTHROPIC_API_URL,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            json={
                'model': ANTHROPIC_MODEL,
                'max_tokens': 4096,
                'system': NEVIN_SYSTEM_PROMPT,
                'messages': messages
            },
            timeout=60
        )

        if response.status_code == 401:
            logging.error('Anthropic API authentication failed')
            return jsonify({
                'success': False,
                'error': 'Error de autenticación con el servicio de IA'
            }), 500

        if not response.ok:
            logging.error(f'Anthropic API error: {response.status_code} - {response.text}')
            return jsonify({
                'success': False,
                'error': 'Error al comunicarse con el servicio de IA'
            }), 500

        data = response.json()
        assistant_message = data.get('content', [{}])[0].get('text', '')

        return jsonify({
            'success': True,
            'response': assistant_message
        })

    except requests.Timeout:
        return jsonify({
            'success': False,
            'error': 'El servicio tardó demasiado en responder'
        }), 504
    except Exception as e:
        logging.error(f'Error in chat endpoint: {e}')
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500


@app.route('/api/nevin/verse-commentary', methods=['POST'])
def verse_commentary():
    try:
        api_key = get_api_key()
        if not api_key:
            return jsonify({
                'success': False,
                'error': 'Servicio no configurado correctamente'
            }), 500

        data = request.json
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        book = data.get('book', '')
        chapter = data.get('chapter', 1)
        verse = data.get('verse', 1)
        text_tzotzil = data.get('textTzotzil', '')
        text_spanish = data.get('textSpanish', '')

        verse_ref = f"{book} {chapter}:{verse}"

        verse_content = ""
        if text_tzotzil:
            verse_content += f'\n\n**Tzotzil:** "{text_tzotzil}"'
        if text_spanish:
            verse_content += f'\n\n**RV1960:** "{text_spanish}"'

        user_message = f"""Proporciona un comentario teológico completo del siguiente versículo:

VERSÍCULO: {verse_ref}
{verse_content}

Incluye:
1. Contexto histórico y literario
2. Análisis del texto
3. Significado teológico desde la perspectiva adventista
4. Aplicación práctica"""

        response = requests.post(
            ANTHROPIC_API_URL,
            headers={
                'Content-Type': 'application/json',
                'x-api-key': api_key,
                'anthropic-version': '2023-06-01'
            },
            json={
                'model': ANTHROPIC_MODEL,
                'max_tokens': 6000,
                'system': NEVIN_SYSTEM_PROMPT,
                'messages': [{'role': 'user', 'content': user_message}]
            },
            timeout=90
        )

        if not response.ok:
            logging.error(f'Anthropic API error: {response.status_code}')
            return jsonify({
                'success': False,
                'error': 'Error al obtener el comentario'
            }), 500

        data = response.json()
        commentary = data.get('content', [{}])[0].get('text', '')

        return jsonify({
            'success': True,
            'commentary': commentary
        })

    except Exception as e:
        logging.error(f'Error in verse-commentary endpoint: {e}')
        return jsonify({
            'success': False,
            'error': 'Error interno del servidor'
        }), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
