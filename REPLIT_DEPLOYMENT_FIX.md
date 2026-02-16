# Corrección de Deployment en Replit - Tzotzil Bible

**Fecha**: 16 de febrero de 2026
**Autor**: Manuelito (Senior Software Architect)

---

## Diagnóstico del Problema

He revisado la configuración de deployment en Replit y he identificado que la estructura actual está **correctamente configurada** para funcionar. El problema que experimentaste probablemente se debe a uno de estos factores:

1. **Build incompleto**: El directorio `dist/` no se generó correctamente
2. **Dependencias faltantes**: `npm install` no se ejecutó completamente
3. **Puerto incorrecto**: Replit esperaba un puerto diferente al configurado
4. **Timeout durante el build**: El proceso de `expo export` tardó demasiado

---

## Configuración Actual (Correcta)

### `.replit`
```toml
language = "nodejs"
run = "npx expo start --web --port 5000 --host 0.0.0.0"
modules = ["nodejs-20"]

[[ports]]
localPort = 5000
externalPort = 80
```

### `package.json` - Scripts
```json
{
  "scripts": {
    "web-deploy": "expo start --web --port 5000 --host 0.0.0.0",
    "build:deploy": "npm install && npx expo export --platform web",
    "serve:production": "node server.js",
    "production": "node prebuild.js && node server.js"
  }
}
```

### `server.js` - Auto-build
El servidor está configurado para **auto-construir** el bundle si no existe:
```javascript
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
```

---

## Solución Recomendada

Para asegurar que el deployment funcione correctamente en Replit, sigue estos pasos:

### Paso 1: Limpiar Build Anterior
```bash
rm -rf dist/
rm -rf .expo/
rm -rf node_modules/.cache/
```

### Paso 2: Reinstalar Dependencias
```bash
npm install
```

### Paso 3: Generar Build Manualmente (Primera Vez)
```bash
npx expo export --platform web
```

Este comando generará el directorio `dist/` con todos los archivos estáticos de la aplicación web.

### Paso 4: Iniciar el Servidor
```bash
node server.js
```

El servidor:
1. Verificará si `dist/index.html` existe
2. Si no existe, ejecutará `expo export` automáticamente
3. Iniciará en el puerto 5000
4. Servirá los archivos estáticos desde `dist/`
5. Expondrá los endpoints de la API de Nevin

---

## Configuración Recomendada para Replit

### Opción A: Usar el Script de Producción (Recomendado)

Modifica el comando `run` en `.replit`:
```toml
run = "npm run production"
```

Este script ejecuta:
1. `node prebuild.js` - Prepara el entorno
2. `node server.js` - Inicia el servidor (con auto-build si es necesario)

### Opción B: Build Explícito + Servidor

Si prefieres separar el build del servidor:
```toml
run = "npm run build:deploy && npm run serve:production"
```

---

## Variables de Entorno Requeridas

Asegúrate de configurar estas variables en Replit:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `PORT` | `5000` | Puerto del servidor (opcional, default: 5000) |
| `ANTHROPIC_API_KEY` | `tu-api-key` | API key de Claude para Nevin AI |
| `NODE_ENV` | `production` | Modo de producción |

---

## Troubleshooting

### Problema: "Cannot find module 'express'"
**Solución**: Ejecuta `npm install` para instalar todas las dependencias.

### Problema: "dist/index.html not found" y el build falla
**Solución**: 
1. Verifica que tienes suficiente espacio en Replit
2. Ejecuta manualmente: `npx expo export --platform web`
3. Revisa los logs para ver errores específicos

### Problema: "Port 5000 already in use"
**Solución**: 
1. Detén todos los procesos en Replit
2. Cambia el puerto en `.replit` y en `server.js` si es necesario

### Problema: La app carga pero Nevin no responde
**Solución**: 
1. Verifica que `ANTHROPIC_API_KEY` esté configurada
2. Revisa los logs del servidor para errores de API
3. Asegúrate de que los archivos EGW JSON estén en `assets/EGW BOOKS JSON/`

---

## Verificación Post-Deployment

Una vez que el servidor esté corriendo, verifica:

1. **Página principal**: `https://tu-repl.replit.app/` debe cargar la app
2. **Privacy Policy**: `https://tu-repl.replit.app/privacy-policy` debe cargar
3. **Terms of Service**: `https://tu-repl.replit.app/terms-of-service` debe cargar
4. **API de Nevin**: Prueba hacer una pregunta en la app

---

## Recomendación Final

Para el deployment en Replit, usa esta configuración en `.replit`:

```toml
language = "nodejs"
run = "npm run production"
modules = ["nodejs-20"]

[[ports]]
localPort = 5000
externalPort = 80

[nix]
channel = "stable-24_05"
```

Y asegúrate de que el script `production` en `package.json` sea:
```json
"production": "node prebuild.js && node server.js"
```

Esto garantiza que:
- El entorno se prepara correctamente
- El build se genera si no existe
- El servidor inicia y responde inmediatamente a health checks
- Los archivos EGW se cargan en background sin bloquear el inicio

---

## Próximos Pasos

1. Haz pull de los cambios de bugs que acabo de corregir
2. Ejecuta los pasos de limpieza y build en Replit
3. Inicia el servidor con `npm run production`
4. Prueba la funcionalidad de compartir en Nevin (bug corregido)
5. Prueba las citas de EGW en Nevin (formato mejorado)
