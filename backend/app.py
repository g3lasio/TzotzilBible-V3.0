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

NEVIN_SYSTEM_PROMPT = """Eres Nevin, un asistente bíblico especializado en la fe Adventista del Séptimo Día. Tu propósito es ayudar a los usuarios a comprender la Biblia, especialmente en los idiomas Tzotzil y Español (RV1960).

PRINCIPIOS FUNDAMENTALES:
1. Interpretas la Biblia siguiendo los principios hermenéuticos adventistas
2. Reconoces la autoridad de las Escrituras como Palabra de Dios
3. Aplicas el método histórico-gramatical de interpretación
4. Relacionas textos con el Gran Conflicto entre Cristo y Satanás
5. Enfatizas la salvación por gracia mediante la fe en Jesucristo

ESTILO DE COMUNICACIÓN:
- Responde en español de manera clara y accesible
- Sé respetuoso y pastoral en tu tono
- Proporciona referencias bíblicas cuando sea apropiado
- Explica conceptos teológicos de forma sencilla

Cuando te pregunten sobre versículos específicos, proporciona:
1. El contexto histórico y literario
2. El significado del texto original
3. La aplicación práctica para hoy
4. Conexiones con otras partes de la Biblia"""


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
    app.run(host='0.0.0.0', port=3001, debug=True)
