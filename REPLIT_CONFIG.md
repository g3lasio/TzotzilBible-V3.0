# Configuración de Replit para TzotzilBible

**Fecha**: 17 de Enero, 2026  
**Propósito**: Documentar la configuración de Replit y por qué está configurado así

---

## 🎯 Propósito de Replit en Este Proyecto

**Replit se usa SOLO para**:
- ✅ Desarrollo y testing local
- ✅ Preview web para debugging
- ✅ Ejecutar comandos de EAS

**Replit NO se usa para**:
- ❌ Deployment de producción
- ❌ Hosting de la app
- ❌ Builds de producción

---

## 🏗️ Arquitectura de Deployment

### Para Desarrollo/Testing:
```
Replit → expo start --web → Preview en navegador
```

### Para Producción:
```
Replit Shell → eas build → EAS Cloud → App Store / Google Play
```

---

## 📝 Configuración Actual

### `.replit` File:

```toml
language = "nodejs"
run = "npx expo start --web --port 5000 --host 0.0.0.0"
modules = ["nodejs-20"]

# NO hay sección [deployment]
# Deployment deshabilitado intencionalmente
```

**Por qué**:
- Replit intentaba hacer deployment en Cloud Run (web hosting)
- El proyecto es una mobile app, no web app
- Cloud Run no es apropiado para Expo mobile apps
- EAS es la herramienta correcta para builds móviles

---

## 🚀 Flujo de Trabajo

### 1. Desarrollo en Replit:

```bash
# Iniciar servidor de desarrollo
npm start
# o
npx expo start --web
```

**Resultado**: Preview web en Replit para testing rápido

### 2. Testing en Dispositivo:

```bash
# Iniciar sin --web
npx expo start

# Escanear QR con Expo Go en tu teléfono
```

**Resultado**: App nativa en tu dispositivo para testing real

### 3. Build de Producción:

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

**Resultado**: Archivos IPA/AAB listos para stores

### 4. Submit a Stores:

```bash
# iOS
eas submit --platform ios --profile production

# Android
eas submit --platform android --profile production
```

**Resultado**: Apps en App Store / Google Play

---

## ⚠️ Por Qué NO Usar Replit Deployment

### Problemas con Replit Deployment:

1. **Cloud Run es para web apps**
   - Requiere servidor HTTP que abra puerto rápidamente
   - Expo mobile apps no son web apps tradicionales
   - Metro bundler tarda demasiado en compilar

2. **Conflicto de configuración**
   - `server.js` existe pero no es compatible con Expo
   - `deploymentTarget = "cloudrun"` no es apropiado
   - Timeout de Cloud Run es muy corto para Expo

3. **No necesario**
   - EAS maneja builds móviles perfectamente
   - App Store / Google Play son los destinos finales
   - No necesitas web hosting para una mobile app

---

## ✅ Configuración Correcta

### Para Mobile Apps en Replit:

**Desarrollo**:
- ✅ Usar `expo start` para preview
- ✅ Usar Expo Go para testing en dispositivo

**Producción**:
- ✅ Usar EAS para builds (iOS/Android)
- ✅ Usar EAS Submit para subir a stores

**NO intentar**:
- ❌ Deployment de Replit (Cloud Run)
- ❌ Web hosting de Replit
- ❌ Builds locales (no tienes Mac/Xcode)

---

## 📊 Comparación

| Aspecto | Replit Deployment | EAS Build |
|---------|-------------------|-----------|
| **Para qué** | Web apps | Mobile apps |
| **Hosting** | Cloud Run | App Store / Google Play |
| **Build** | Local/Cloud Run | EAS Cloud |
| **Apropiado para TzotzilBible** | ❌ No | ✅ Sí |

---

## 🔧 Troubleshooting

### Si Ves Error de Deployment en Replit:

**Error típico**:
```
Cloud Run deployments require a web server to open a port quickly,
but this is an Expo/React Native mobile app
```

**Solución**:
- ✅ Ignorar el error
- ✅ No intentar hacer deployment en Replit
- ✅ Usar EAS para builds de producción

### Si Quieres Web Deployment:

**Opción 1**: Crear build web separado
```bash
npx expo export --platform web
# Subir dist/ a cualquier hosting (Vercel, Netlify, etc.)
```

**Opción 2**: Mantener solo mobile
- No necesitas web deployment
- App Store / Google Play son suficientes

---

## 📚 Referencias

- [EAS Build](https://docs.expo.dev/build/introduction/)
- [EAS Submit](https://docs.expo.dev/submit/introduction/)
- [Expo Go](https://expo.dev/go)
- [Replit Docs](https://docs.replit.com/)

---

## 🎯 Resumen

**Replit**: Solo para desarrollo y testing  
**EAS**: Para builds de producción  
**Stores**: Para distribución final  

**No intentes hacer deployment en Replit. Usa EAS.**
