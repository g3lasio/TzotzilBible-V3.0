# ✅ Checklist de Verificación Pre-Build

**Fecha**: 17 de Enero, 2026  
**Build**: iOS Production (buildNumber 32)

---

## 📋 Verificación Completa

### ✅ 1. Configuración de iOS

**app.config.js** (línea 19):
```javascript
buildNumber: "32"  ✅ CORRECTO (incrementado de 31)
```

**eas.json** (iOS production):
```json
"ios": {
  "resourceClass": "m1-medium"
}
```
✅ **CORRECTO** - No tiene `autoIncrement` (no compatible con app.config.js)

---

### ✅ 2. Configuración de Submit

**eas.json** (submit production):
```json
"ios": {
  "appleId": "gelasio@chyrris.com",
  "ascAppId": "6740210615"
}
```
✅ **CORRECTO** - Apple ID y ASC App ID configurados

---

### ✅ 3. Versión de la App

**package.json**:
```json
"version": "2.1.0"
```
✅ **CORRECTO** - Versión consistente

**app.config.js**:
```javascript
version: "2.1.0"
```
✅ **CORRECTO** - Versión consistente

---

### ✅ 4. Certificados y Provisioning

**Status**:
- ✅ Distribution Certificate: Válido hasta 17 Jan 2027
- ✅ Provisioning Profile: Activo hasta 17 Jan 2027
- ✅ Apple Team: UW276ZH5Q7 (Gelasio Sanchez Gomez)

---

### ✅ 5. Bundle Identifier

**app.config.js**:
```javascript
bundleIdentifier: "com.chyrris.tzotzilbible"
```
✅ **CORRECTO** - Registrado en Apple Developer

---

### ✅ 6. Cambios Recientes Implementados

- ✅ Botones Copy/Share en Nevin (multiplataforma)
- ✅ Control de tamaño de fuente en versículos
- ✅ Sistema de citación EGW corregido
- ✅ Fix del botón plus en iPad
- ✅ Vulnerabilidades de seguridad resueltas

---

## 🚀 Comandos a Ejecutar (EN ORDEN)

### Paso 1: Sincronizar Código

```bash
git pull origin main
```

**Verificar que dice**:
```
Already up to date.
```

Si dice "Fast-forward" o muestra cambios, significa que se actualizó correctamente.

---

### Paso 2: Build de iOS

```bash
eas build --platform ios --profile production
```

**Tiempo estimado**: 10-20 minutos

**Qué esperar**:
- ✅ "Checking for build credentials"
- ✅ "Building on remote server"
- ✅ "Build completed successfully"
- ✅ "Build ID: [ID]"
- ✅ "Download: [URL]"

**NO esperar**:
- ❌ "autoIncrement option is not supported" (ya corregido)
- ❌ "Provisioning Profile has expired" (ya renovado)

---

### Paso 3: Submit a App Store

```bash
eas submit --platform ios --profile production
```

**Tiempo estimado**: 5 minutos

**Qué esperar**:
- ✅ "Scheduled iOS submission"
- ✅ "Waiting for submission to complete"
- ✅ "Successfully submitted to App Store Connect"

**NO esperar**:
- ❌ "You've already submitted this build" (buildNumber es nuevo: 32)

---

## ⚠️ Si Algo Sale Mal

### Error: "autoIncrement option is not supported"
**Causa**: eas.json tiene autoIncrement  
**Solución**: Ya corregido (commit `6eea6d7`)

### Error: "You've already submitted this build"
**Causa**: buildNumber duplicado  
**Solución**: Ya corregido (buildNumber = 32, commit `f5054af`)

### Error: "Provisioning Profile has expired"
**Causa**: Certificado expirado  
**Solución**: Ya renovado (válido hasta 2027)

### Error: "Build failed"
**Acción**: Copiar el error completo y enviármelo

---

## 📊 Estado Actual

| Aspecto | Status | Detalles |
|---------|--------|----------|
| **buildNumber** | ✅ 32 | Incrementado correctamente |
| **autoIncrement** | ✅ Eliminado | No compatible con app.config.js |
| **Certificados** | ✅ Válidos | Hasta 17 Jan 2027 |
| **Provisioning** | ✅ Activo | Hasta 17 Jan 2027 |
| **Código** | ✅ Actualizado | Todos los cambios en GitHub |
| **Listo para build** | ✅ SÍ | Todo verificado |

---

## 🎯 Después del Submit Exitoso

### 1. Verificar en App Store Connect

1. Ir a https://appstoreconnect.apple.com
2. Seleccionar "Tzotzil Bible"
3. Ir a "TestFlight" → "iOS"
4. Verificar que aparece **Build 32**
5. Status debería ser "Processing" o "Ready to Submit"

### 2. Probar en TestFlight

1. Agregar build a grupo de testing
2. Instalar en tu iPhone
3. Probar funcionalidades:
   - ✅ Botones Copy/Share en Nevin
   - ✅ Control de fuente en versículos
   - ✅ Botón plus en iPad (no crash)
   - ✅ Sistema de citación EGW

### 3. Preparar para Revisión

1. Completar metadata si falta algo
2. Subir screenshots actualizados
3. Verificar Privacy Policy URL
4. **Excluir China** en "Pricing and Availability"
5. Agregar notas de revisión:

```
Mejoras en esta versión:
- Corregido bug del botón plus en iPad
- Agregados botones para copiar y compartir mensajes
- Mejorado control de tamaño de fuente para mejor lectura
- Optimizado sistema de citación de referencias
```

### 4. Enviar a Revisión

1. Click en "Submit for Review"
2. Confirmar información
3. Esperar 1-2 días para revisión de Apple

---

## ✅ Confirmación Final

**TODO ESTÁ LISTO PARA BUILD.**

No hay errores conocidos. La configuración está correcta. Los certificados están válidos. El buildNumber es nuevo.

**Ejecuta los 3 comandos en orden y todo debería funcionar perfectamente.**
