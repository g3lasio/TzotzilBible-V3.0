# Guía Rápida - Tzotzil Bible App

## Requisitos

- Node.js 18+
- Android Studio (para APK)
- Xcode (para IPA, solo Mac)

## Compilar APK (Android)

```bash
# 1. Entrar al directorio
cd mobile-app

# 2. Instalar dependencias
npm install

# 3. Agregar plataforma Android
npx cap add android

# 4. Sincronizar
npx cap sync android

# 5. Abrir en Android Studio
npx cap open android
```

En Android Studio:
1. `Build > Generate Signed Bundle / APK`
2. Seleccionar `APK`
3. Crear o seleccionar keystore
4. Generar APK de release

## Compilar IPA (iOS)

```bash
# 1. Entrar al directorio
cd mobile-app

# 2. Instalar dependencias
npm install

# 3. Agregar plataforma iOS
npx cap add ios

# 4. Sincronizar
npx cap sync ios

# 5. Abrir en Xcode
npx cap open ios
```

En Xcode:
1. Configurar Signing con Apple Developer Account
2. `Product > Archive`
3. Exportar IPA

## Actualizar la App

Después de cambios en el webapp Flask:

```bash
npm run build
npx cap sync
```

## Notas Importantes

- El APK se encuentra en: `android/app/build/outputs/apk/release/`
- Antes de publicar, cambia `API_BASE` en `dist/index.html` a tu URL de producción
- Para modo offline completo, ejecuta `node prepare-offline.js`
