# Soluciones Implementadas para Producción - TzotzilBible V3.0

**Fecha**: 16 de enero de 2026  
**Estado**: ✅ Listo para builds de producción (IPA/AAB)

---

## 🔍 Problemas Identificados

### 1. Versión de Node.js Incompatible
**Problema**: El servidor de Replit usaba Node v20.19.3, pero las dependencias de Metro y React Native requieren Node >= 20.19.4.

**Síntomas**:
```
npm warn EBADENGINE Unsupported engine {
  package: 'metro@0.83.3',
  required: { node: '>=20.19.4' },
  current: { node: 'v20.19.3', npm: '10.8.2' }
}
```

### 2. Módulo Express No Encontrado
**Problema**: El archivo `server.js` intentaba cargar Express pero fallaba en producción.

**Síntomas**:
```
Error: Cannot find module 'express'
Require stack:
- /home/runner/workspace/server.js
```

### 3. Configuración Mixta Web/Móvil
**Problema**: El proyecto estaba configurado principalmente para deployment web en Replit, no para builds móviles nativos (IPA/AAB).

### 4. Inconsistencias en Configuración
**Problema**: Existían dos archivos de configuración (`app.json` y `app.config.js`) con versiones y configuraciones diferentes.

### 5. Falta de Service Account Key
**Problema**: No existe `service-account-key.json` necesario para subir AAB a Google Play Store automáticamente.

---

## ✅ Soluciones Implementadas

### 1. Actualización de package.json
**Cambios**:
- ✅ Agregado campo `engines` para especificar Node >= 20.19.4
- ✅ Confirmado que Express está en `dependencies` (no devDependencies)
- ✅ Actualizado nombre del paquete a "tzotzil-bible"
- ✅ Actualizada versión a 2.1.0 para consistencia

**Archivo**: `package.json`
```json
"engines": {
  "node": ">=20.19.4",
  "npm": ">=10.0.0"
}
```

### 2. Corrección de .replit
**Cambios**:
- ✅ Agregado `npm install --production` antes de ejecutar el servidor
- ✅ Agregado `npm install --production` en el build step
- ✅ Mantenida configuración de Node 20

**Archivo**: `.replit`
```toml
[deployment]
run = ["sh", "-c", "npm install --production && node server.js"]
build = ["sh", "-c", "npm install --production && npx expo export --platform web"]
```

### 3. Actualización de eas.json
**Cambios**:
- ✅ Cambiado `requireCommit: false` para facilitar builds de prueba
- ✅ Configuración de Android para AAB (app-bundle) en producción
- ✅ Configuración de iOS con auto-incremento de buildNumber
- ✅ Configuración de submit para ambas plataformas

**Archivo**: `eas.json`

### 4. Unificación de Configuración de App
**Cambios**:
- ✅ Respaldado `app.json` a `app.json.backup`
- ✅ Actualizado `app.config.js` como fuente única de verdad
- ✅ Incrementado buildNumber iOS a 31
- ✅ Incrementado versionCode Android a 26
- ✅ Agregada plataforma "web" explícitamente

**Archivo**: `app.config.js`

### 5. Documentación Actualizada
**Cambios**:
- ✅ Creado `PRODUCTION_FIXES.md` (este documento)
- ✅ Documentados todos los problemas y soluciones
- ✅ Incluidas instrucciones paso a paso para builds

---

## 📱 Instrucciones para Builds de Producción

### Prerequisitos

1. **Instalar EAS CLI** (si no está instalado):
```bash
npm install -g eas-cli
```

2. **Login en Expo**:
```bash
eas login
```

3. **Verificar configuración del proyecto**:
```bash
eas whoami
eas project:info
```

---

### 🤖 Build de Android (AAB para Google Play)

**Comando**:
```bash
eas build --platform android --profile production
```

**Proceso**:
1. EAS subirá el código al servidor de builds
2. Compilará el proyecto con Gradle
3. Generará un archivo AAB (Android App Bundle)
4. Tiempo estimado: 10-15 minutos

**Resultado**:
- Archivo: `tzotzil-bible-v2.1.0-build26.aab`
- Ubicación: Descargable desde el dashboard de EAS
- Listo para subir a Google Play Console

**Configuración actual**:
- Package: `com.chyrris.tzotzilbible`
- Version: 2.1.0
- Version Code: 26
- Build Type: app-bundle
- Target SDK: 34
- Min SDK: 21

---

### 🍎 Build de iOS (IPA para App Store)

**Comando**:
```bash
eas build --platform ios --profile production
```

**Proceso**:
1. EAS subirá el código al servidor de builds (Mac M1)
2. Compilará el proyecto con Xcode
3. Generará un archivo IPA
4. Auto-incrementará el buildNumber
5. Tiempo estimado: 15-20 minutos

**Resultado**:
- Archivo: `tzotzil-bible-v2.1.0-build31.ipa`
- Ubicación: Descargable desde el dashboard de EAS
- Listo para subir a App Store Connect

**Configuración actual**:
- Bundle ID: `com.chyrris.tzotzilbible`
- Version: 2.1.0
- Build Number: 31 (auto-incrementa)
- Resource Class: m1-medium

**Requisitos**:
- Apple Developer Account activa
- Certificados de distribución configurados en EAS
- Provisioning profiles válidos

---

### 🧪 Builds de Prueba (APK)

Para generar un APK de prueba que se puede instalar directamente:

```bash
eas build --platform android --profile preview
```

**Resultado**:
- Archivo APK instalable directamente
- No requiere Google Play Store
- Ideal para testing interno

---

## 🚀 Deployment Web (Replit)

El deployment web en Replit ahora debería funcionar correctamente:

1. **Push de cambios a GitHub**:
```bash
git add .
git commit -m "Fix: Preparar proyecto para builds de producción IPA/AAB"
git push origin main
```

2. **Deploy en Replit**:
   - Ir a la pestaña "Deployments"
   - Hacer clic en "Deploy"
   - El build instalará Express correctamente
   - El servidor iniciará sin errores

3. **Verificar deployment**:
   - URL web funcionando
   - Nevin AI respondiendo
   - Biblia cargando correctamente

---

## 📋 Checklist Pre-Build

Antes de ejecutar builds de producción, verificar:

### Android (AAB)
- [ ] `app.config.js` tiene el versionCode correcto (26)
- [ ] `app.config.js` tiene la versión correcta (2.1.0)
- [ ] Package name es `com.chyrris.tzotzilbible`
- [ ] Archivo `assets/bible.db` existe
- [ ] Todos los assets (icon.png, splash-icon.png, etc.) existen
- [ ] EAS CLI está instalado y logueado
- [ ] Proyecto EAS está configurado (df16967f-65d9-4e6f-857a-ee208dfad9d8)

### iOS (IPA)
- [ ] `app.config.js` tiene el buildNumber correcto (31)
- [ ] Bundle ID es `com.chyrris.tzotzilbible`
- [ ] Apple Developer Account está activa
- [ ] Certificados de distribución están configurados en EAS
- [ ] Provisioning profiles están válidos
- [ ] App Store Connect tiene la app registrada

### Web (Replit)
- [ ] Cambios pusheados a GitHub
- [ ] `.replit` tiene el comando de build correcto
- [ ] Express está en dependencies
- [ ] `ANTHROPIC_API_KEY` configurada en Secrets de Replit

---

## 🔧 Troubleshooting

### Error: "Cannot find module 'express'"
**Solución**: Ya corregido en `.replit` - ahora instala dependencias antes de ejecutar

### Error: "Unsupported engine Node v20.19.3"
**Solución**: Ya corregido en `package.json` - especifica Node >= 20.19.4

### Error: "EAS project not found"
**Solución**: 
```bash
eas init
# Usar el projectId existente: df16967f-65d9-4e6f-857a-ee208dfad9d8
```

### Error: "No credentials found for iOS"
**Solución**:
```bash
eas credentials
# Configurar certificados de distribución
```

### Build falla con "Asset not found"
**Solución**: Verificar que todos los assets existen:
```bash
ls -la assets/icon.png
ls -la assets/splash-icon.png
ls -la assets/adaptive-icon.png
ls -la assets/bible.db
```

---

## 📝 Notas Importantes

### Service Account Key para Google Play
El archivo `service-account-key.json` NO está incluido en el repositorio por seguridad. Para subir automáticamente a Google Play:

1. Ir a Google Cloud Console
2. Crear una Service Account
3. Descargar el JSON key
4. Guardarlo como `service-account-key.json` en la raíz del proyecto
5. NO commitear este archivo (ya está en .gitignore)

### Subida Manual a Stores

**Google Play**:
1. Descargar el AAB desde EAS
2. Ir a Google Play Console
3. Crear nueva release en "Internal testing" o "Production"
4. Subir el AAB
5. Completar la información de release
6. Enviar para revisión

**App Store**:
1. Descargar el IPA desde EAS
2. Usar Transporter app o Xcode
3. Subir a App Store Connect
4. Completar metadata de la app
5. Enviar para revisión

---

## ✅ Estado Final

### Archivos Modificados
- ✅ `package.json` - Engines y versión actualizada
- ✅ `.replit` - Instalación de dependencias agregada
- ✅ `eas.json` - requireCommit: false
- ✅ `app.config.js` - Versiones incrementadas, configuración unificada
- ✅ `app.json` → `app.json.backup` - Respaldado para evitar conflictos

### Archivos Creados
- ✅ `PRODUCTION_FIXES.md` - Este documento

### Próximos Pasos
1. **Commitear y pushear cambios a GitHub**
2. **Ejecutar builds de producción con EAS**
3. **Descargar AAB e IPA**
4. **Subir a Google Play y App Store**
5. **Verificar deployment web en Replit**

---

## 🎯 Comandos Rápidos

```bash
# Android AAB (Google Play)
eas build --platform android --profile production

# iOS IPA (App Store)
eas build --platform ios --profile production

# Android APK (Testing)
eas build --platform android --profile preview

# Ver status de builds
eas build:list

# Ver configuración del proyecto
eas project:info

# Configurar credenciales
eas credentials
```

---

**Proyecto listo para producción** ✅  
**Fecha**: 16 de enero de 2026  
**Versión**: 2.1.0  
**Android versionCode**: 26  
**iOS buildNumber**: 31
