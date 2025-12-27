# ✅ Checklist de Deployment - TzotzilBible

## Pre-Deployment

- [ ] Revisar que todos los archivos modificados están en el repositorio
- [ ] Verificar que `.replit` tiene el comando de build correcto
- [ ] Confirmar que `package.json` incluye Express en dependencies
- [ ] Asegurar que `.dockerignore` está optimizado

## Archivos Modificados (Para Commit)

- [ ] `.replit` - Configuración de deployment actualizada
- [ ] `package.json` - Scripts de deployment agregados
- [ ] `.dockerignore` - Optimizado para deployment
- [ ] `DEPLOYMENT_GUIDE.md` - Guía completa (nuevo)
- [ ] `BACKEND_VERIFICATION.md` - Verificación del backend (nuevo)
- [ ] `RESUMEN_SOLUCION.md` - Resumen ejecutivo (nuevo)
- [ ] `DIAGNOSTICO_DEPLOYMENT.md` - Análisis técnico (nuevo)
- [ ] `deploy.sh` - Script automatizado (nuevo)
- [ ] `DEPLOYMENT_CHECKLIST.md` - Este checklist (nuevo)

## Git Workflow

### 1. Revisar Cambios
```bash
cd /ruta/a/TzotzilBible-V3.0
git status
git diff .replit
git diff package.json
```

### 2. Agregar Archivos
```bash
git add .replit
git add package.json
git add .dockerignore
git add DEPLOYMENT_GUIDE.md
git add BACKEND_VERIFICATION.md
git add RESUMEN_SOLUCION.md
git add DIAGNOSTICO_DEPLOYMENT.md
git add deploy.sh
git add DEPLOYMENT_CHECKLIST.md
```

### 3. Commit
```bash
git commit -m "Fix: Resolver error de deployment - instalar dependencias antes de build

- Actualizar .replit para instalar npm dependencies antes de expo export
- Agregar scripts de deployment en package.json (build:deploy, serve:production)
- Optimizar .dockerignore para deployment
- Agregar documentación completa de deployment y verificación
- Agregar script automatizado de deployment (deploy.sh)

Fixes: Error 'The module express cannot be found when running server.js'
Tested: Backend de Neon verificado y funcionando correctamente"
```

### 4. Push
```bash
git push origin main
```

## Deployment en Replit

### Paso 1: Abrir Replit
- [ ] Ir a https://replit.com
- [ ] Abrir el proyecto TzotzilBible-V3.0

### Paso 2: Verificar Cambios
- [ ] Confirmar que los archivos actualizados están en Replit
- [ ] Revisar que `.replit` tiene la nueva configuración

### Paso 3: Configurar Secrets (Si es necesario)
- [ ] Ir a la pestaña "Secrets"
- [ ] Agregar `ANTHROPIC_API_KEY` (si no está)
- [ ] Verificar que `PORT` está en 5000 (opcional)

### Paso 4: Hacer Deployment
- [ ] Ir a la pestaña "Deployments"
- [ ] Hacer clic en "Deploy"
- [ ] Esperar a que el build complete (3-5 minutos)

### Paso 5: Monitorear Build
- [ ] Revisar logs de build
- [ ] Verificar que `npm install --production` se ejecuta
- [ ] Confirmar que `npx expo export --platform web` se ejecuta
- [ ] Asegurar que no hay errores

## Post-Deployment

### Verificación Básica
- [ ] La URL de deployment carga correctamente
- [ ] La página principal se muestra sin errores
- [ ] Los assets (imágenes, fuentes) cargan correctamente

### Verificación de Funcionalidad
- [ ] Navegación entre pantallas funciona
- [ ] La Biblia se puede leer (versículos cargan)
- [ ] La búsqueda funciona
- [ ] Los libros se pueden seleccionar

### Verificación de Nevin AI
- [ ] Abrir la pantalla de Nevin
- [ ] Enviar un mensaje de prueba: "Hola"
- [ ] Verificar que Nevin responde
- [ ] Probar una pregunta bíblica: "¿Qué dice Juan 3:16?"

### Verificación de Logs
- [ ] Ir a la pestaña "Logs" en Replit
- [ ] Buscar: `Production server running at http://0.0.0.0:5000`
- [ ] Buscar: `Loading EGW books in background...`
- [ ] Verificar que no hay errores de módulos faltantes

## Troubleshooting

### Si el deployment falla:

#### Error: "Cannot find module 'express'"
- [ ] Verificar que `.replit` tiene `npm install --production` en build
- [ ] Revisar logs de build para ver si npm install se ejecutó
- [ ] Confirmar que Express está en `dependencies` (no `devDependencies`)

#### Error: "dist/index.html not found"
- [ ] Verificar que `npx expo export --platform web` se ejecutó
- [ ] Revisar logs de build para errores de Expo
- [ ] Confirmar que todas las dependencias de Expo están instaladas

#### Error: "Port already in use"
- [ ] Esto es normal en desarrollo, no afecta deployment
- [ ] En deployment, Replit maneja los puertos automáticamente

#### Deployment muy lento
- [ ] Normal, puede tomar 3-5 minutos
- [ ] Instalación de dependencias toma tiempo
- [ ] Esperar pacientemente

### Si la app no carga:

- [ ] Verificar logs de runtime en Replit
- [ ] Confirmar que el servidor inició correctamente
- [ ] Revisar que no hay errores en la consola del navegador
- [ ] Verificar que la URL de deployment es correcta

### Si Nevin no responde:

- [ ] Verificar que `ANTHROPIC_API_KEY` está configurada en Secrets
- [ ] Confirmar que el backend de Neon está activo: https://nevin-b.replit.app
- [ ] Revisar logs para errores de API
- [ ] Probar el endpoint directamente con curl

## Rollback (Si es necesario)

### Si algo sale mal:

```bash
# Revertir el último commit
git revert HEAD

# O volver a un commit anterior
git log  # Ver historial
git reset --hard <commit-hash>  # Volver a un commit específico
git push --force origin main  # Forzar push (¡cuidado!)
```

### Deployment anterior en Replit:
- [ ] Ir a "Deployments"
- [ ] Seleccionar un deployment anterior
- [ ] Hacer clic en "Rollback"

## Builds Móviles (Separado)

### Android APK (Testing)
- [ ] Ejecutar: `eas build --platform android --profile preview`
- [ ] Esperar a que EAS complete el build
- [ ] Descargar e instalar el APK
- [ ] Probar en dispositivo Android

### Android AAB (Play Store)
- [ ] Ejecutar: `eas build --platform android --profile production`
- [ ] Descargar el AAB
- [ ] Subir a Google Play Console

### iOS IPA (App Store)
- [ ] Ejecutar: `eas build --platform ios --profile production`
- [ ] Descargar el IPA
- [ ] Subir a App Store Connect

## Notas Finales

### ✅ Confirmaciones Finales:
- [ ] Web deployment funciona correctamente
- [ ] Apps móviles no se ven afectadas
- [ ] Backend de Neon sigue funcionando
- [ ] Documentación está completa y actualizada

### 📝 Documentación Creada:
- [ ] `DEPLOYMENT_GUIDE.md` - Guía completa
- [ ] `BACKEND_VERIFICATION.md` - Verificación del backend
- [ ] `RESUMEN_SOLUCION.md` - Resumen ejecutivo
- [ ] `DIAGNOSTICO_DEPLOYMENT.md` - Análisis técnico
- [ ] `deploy.sh` - Script automatizado
- [ ] `DEPLOYMENT_CHECKLIST.md` - Este checklist

### 🎉 Deployment Exitoso:
- [ ] URL de deployment funcional
- [ ] Sin errores en logs
- [ ] Todas las funcionalidades operativas
- [ ] Nevin AI respondiendo correctamente

---

**Fecha**: 27 de diciembre de 2025
**Versión**: 1.0
**Estado**: Listo para deployment

**¡Éxito con tu deployment!** 🚀
