# Guía de Deployment en Replit - TzotzilBible

## Problema Resuelto

Se ha corregido el error **"The module 'express' cannot be found when running server.js"** que ocurría durante el deployment en Replit.

## Causa del Problema

El comando de build anterior solo ejecutaba `npx expo export --platform web`, lo cual:
- ❌ NO instalaba las dependencias de Node.js (Express)
- ❌ Cloud Run creaba un contenedor limpio sin node_modules
- ❌ Al ejecutar `node server.js`, Express no estaba disponible

## Solución Implementada

Se actualizó el archivo `.replit` con el siguiente comando de build:

```bash
build = ["sh", "-c", "npm install --production && npx expo export --platform web"]
```

Esto asegura que:
- ✅ Se instalan todas las dependencias de producción (incluyendo Express)
- ✅ Se genera el bundle web de Expo en el directorio `dist/`
- ✅ El servidor Express puede iniciar correctamente

## Archivos Modificados

### 1. `.replit`
- **Cambio**: Actualizado el comando `build` para incluir `npm install --production`
- **Línea 8**: `build = ["sh", "-c", "npm install --production && npx expo export --platform web"]`

### 2. `package.json`
- **Agregados**: Nuevos scripts para deployment
  - `build:deploy`: Script combinado para build completo
  - `serve:production`: Script para iniciar el servidor en producción

### 3. `.dockerignore`
- **Actualizado**: Optimizado para excluir archivos innecesarios en deployment
- **Mantiene**: Archivos esenciales como `assets/`, `dist/`, `server.js`

## Pasos para Deployment Manual en Replit

### Opción 1: Deployment Automático (Recomendado)

1. **Hacer commit y push de los cambios**:
   ```bash
   git add .replit package.json .dockerignore
   git commit -m "Fix: Corregir deployment - instalar dependencias antes de build"
   git push origin main
   ```

2. **En Replit, ir a la pestaña "Deployments"**

3. **Hacer clic en "Deploy"**
   - Replit detectará automáticamente la nueva configuración
   - El build ahora instalará Express antes de exportar el web bundle

4. **Esperar a que el deployment complete**
   - El proceso puede tomar 3-5 minutos
   - Verás logs del build y deployment

5. **Verificar que funciona**:
   - Visita la URL de deployment
   - La aplicación web debería cargar correctamente
   - Nevin AI debería funcionar (si tienes ANTHROPIC_API_KEY configurada)

### Opción 2: Build Local de Prueba

Antes de hacer deployment, puedes probar localmente en Replit:

```bash
# Instalar dependencias
npm install

# Exportar bundle web
npx expo export --platform web

# Iniciar servidor de producción
node server.js
```

Si el servidor inicia sin errores, el deployment funcionará.

## Configuración de Variables de Entorno

En Replit, ve a "Secrets" y agrega:

- `PORT`: 5000 (opcional, ya tiene default)
- `ANTHROPIC_API_KEY`: Tu API key de Anthropic (si quieres que Nevin funcione)

## Arquitectura del Deployment

```
┌─────────────────────────────────────┐
│     Replit Cloud Run Container      │
├─────────────────────────────────────┤
│                                     │
│  1. Build Phase:                    │
│     npm install --production        │
│     npx expo export --platform web  │
│                                     │
│  2. Runtime Phase:                  │
│     node server.js                  │
│     ├─ Sirve dist/ (static files)   │
│     ├─ API /chat (Nevin AI)         │
│     ├─ API /generate-title          │
│     ├─ API /generate-commentary     │
│     └─ Carga libros EGW             │
│                                     │
└─────────────────────────────────────┘
```

## Verificación Post-Deployment

1. **Verificar que la web carga**:
   - Visita la URL de deployment
   - Deberías ver la aplicación de la Biblia Tzotzil

2. **Verificar endpoints API**:
   - Prueba el endpoint `/chat` desde la app
   - Nevin debería responder (si tienes API key configurada)

3. **Verificar logs**:
   - En Replit, ve a la pestaña "Logs"
   - Deberías ver: `Production server running at http://0.0.0.0:5000`
   - También: `Loading EGW books in background...`

## Solución de Problemas Comunes

### Error: "Cannot find module 'express'"
- **Causa**: El build no instaló dependencias
- **Solución**: Verifica que el archivo `.replit` tenga el comando correcto
- **Verificar**: Línea 8 debe ser `build = ["sh", "-c", "npm install --production && npx expo export --platform web"]`

### Error: "dist/index.html not found"
- **Causa**: El build de Expo falló
- **Solución**: Revisa los logs de build en Replit
- **Verificar**: Que todas las dependencias de Expo estén instaladas

### Error: "Port already in use"
- **Causa**: Otro proceso está usando el puerto
- **Solución**: Replit maneja esto automáticamente en deployment
- **Nota**: Solo ocurre en desarrollo local

### Deployment muy lento
- **Causa**: Instalación de todas las dependencias
- **Solución**: Normal, puede tomar 3-5 minutos
- **Optimización**: El `.dockerignore` ya excluye archivos innecesarios

## Builds para Móvil (APK/IPA)

El deployment web NO afecta los builds móviles. Para generar APK/IPA:

### Android APK:
```bash
eas build --platform android --profile preview
```

### Android AAB (Play Store):
```bash
eas build --platform android --profile production
```

### iOS IPA:
```bash
eas build --platform ios --profile production
```

**Importante**: Los builds móviles usan EAS Build, no Replit Deployment.

## Flujo de Trabajo Recomendado

1. **Desarrollo local**: Usa `npm run dev` en Replit
2. **Pruebas**: Verifica que todo funciona
3. **Commit**: Guarda cambios en Git
4. **Deploy web**: Usa Replit Deployment para la versión web
5. **Build móvil**: Usa EAS Build para APK/IPA cuando necesites actualizar las apps

## Notas Importantes

- ✅ **Web deployment**: Automático en Replit
- ✅ **APK/IPA builds**: Manual con EAS Build
- ✅ **Backend de Neon**: Separado, no afectado por este deployment
- ✅ **Base de datos SQLite**: Incluida en assets, funciona offline en móvil
- ✅ **Libros EGW**: Incluidos en assets, cargados en memoria al iniciar servidor

## Contacto y Soporte

Si tienes problemas con el deployment:
1. Revisa los logs en Replit
2. Verifica que los archivos `.replit`, `package.json` y `.dockerignore` estén actualizados
3. Asegúrate de que las dependencias estén en `dependencies` (no en `devDependencies`)

---

**Última actualización**: 27 de diciembre de 2025
**Versión**: 1.0
**Estado**: ✅ Problema resuelto y documentado
