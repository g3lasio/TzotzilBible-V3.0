# Nevin Backend

API backend para Nevin AI - Asistente bíblico con Claude.

## Instalación

```bash
npm install
```

## Ejecución

```bash
node server.js
```

El servidor corre en `http://localhost:5000` por defecto.

## Variables de entorno requeridas

| Variable | Descripción |
|----------|-------------|
| `ANTHROPIC_API_KEY` | API key de Anthropic para Claude |
| `PORT` | (Opcional) Puerto del servidor, default: 5000 |

## Endpoints

### GET /api/health
Verifica que el servidor esté corriendo.

**Respuesta:**
```json
{ "ok": true }
```

### POST /api/nevin/chat
Envía un mensaje a Nevin y recibe una respuesta.

**Body:**
```json
{
  "message": "¿Qué dice la Biblia sobre el amor?",
  "context": "",
  "history": []
}
```

**Respuesta:**
```json
{
  "success": true,
  "response": "..."
}
```
