# Instrucciones de Compilación - Tzotzil Bible App

## Requisitos Previos

### Para Android (APK)
1. **Android Studio** (versión más reciente)
2. **JDK 17+**
3. **Node.js 18+**
4. **npm o yarn**

### Para iOS (IPA)
1. **macOS** (requerido)
2. **Xcode 15+**
3. **Cuenta de Apple Developer** ($99/año)
4. **Node.js 18+**

---

## Paso 1: Preparar el Proyecto

```bash
cd mobile-app

# Instalar dependencias
npm install

# Construir el webapp
npm run build
```

---

## Paso 2: Configurar la URL del Backend

Edita `dist/index.html` y cambia `API_BASE` a tu URL de producción:

```javascript
const API_BASE = 'https://tu-app.replit.app';
```

---

## Paso 3: Generar APK para Android

### 3.1 Agregar plataforma Android
```bash
npx cap add android
npx cap sync android
```

### 3.2 Abrir en Android Studio
```bash
npx cap open android
```

### 3.3 En Android Studio:

1. **Configurar el keystore (primera vez):**
   - Ir a `Build > Generate Signed Bundle / APK`
   - Seleccionar `APK`
   - Crear nuevo keystore o usar existente
   - Completar información del keystore

2. **Generar APK de Release:**
   - `Build > Generate Signed Bundle / APK`
   - Seleccionar `APK`
   - Seleccionar `release`
   - Click `Finish`

3. **Ubicación del APK:**
   - `android/app/release/app-release.apk`

### 3.4 Comandos alternativos (CLI):
```bash
cd android
./gradlew assembleRelease
```

El APK estará en: `android/app/build/outputs/apk/release/`

---

## Paso 4: Generar IPA para iOS

### 4.1 Agregar plataforma iOS
```bash
npx cap add ios
npx cap sync ios
```

### 4.2 Abrir en Xcode
```bash
npx cap open ios
```

### 4.3 En Xcode:

1. **Configurar Signing:**
   - Seleccionar el proyecto en el navegador
   - Ir a `Signing & Capabilities`
   - Seleccionar tu Team (cuenta Apple Developer)
   - Habilitar `Automatically manage signing`

2. **Configurar Bundle Identifier:**
   - Cambiar a: `com.tzotzilbible.app`

3. **Archivar para distribución:**
   - `Product > Archive`
   - En el Organizer, click `Distribute App`
   - Seleccionar `App Store Connect` o `Ad Hoc`

4. **Exportar IPA:**
   - Seguir el asistente de exportación
   - El IPA se guardará en la ubicación seleccionada

---

## Paso 5: Publicar en Tiendas

### Google Play Store

1. **Crear cuenta de desarrollador** ($25 único)
   - https://play.google.com/console

2. **Crear nueva aplicación**
   - Nombre: Tzotzil Bible
   - Idioma: Español

3. **Completar ficha de tienda:**
   - Descripción corta y larga
   - Capturas de pantalla (mínimo 2)
   - Ícono de alta resolución (512x512)
   - Gráfico de funciones (1024x500)

4. **Subir APK:**
   - Ir a `Producción > Crear nueva versión`
   - Subir el APK firmado
   - Completar notas de la versión

5. **Enviar para revisión**

### App Store

1. **Crear App en App Store Connect**
   - https://appstoreconnect.apple.com

2. **Completar información:**
   - Nombre, categoría, descripción
   - Capturas de pantalla para cada dispositivo
   - Ícono de App (1024x1024)
   - Política de privacidad URL

3. **Subir build desde Xcode:**
   - El build aparecerá en App Store Connect
   - Seleccionar build para revisión

4. **Enviar para revisión**

---

## Configuración de Íconos y Splash Screen

### Android
Los íconos deben estar en:
- `android/app/src/main/res/mipmap-hdpi/` (72x72)
- `android/app/src/main/res/mipmap-mdpi/` (48x48)
- `android/app/src/main/res/mipmap-xhdpi/` (96x96)
- `android/app/src/main/res/mipmap-xxhdpi/` (144x144)
- `android/app/src/main/res/mipmap-xxxhdpi/` (192x192)

### iOS
Los íconos deben estar en:
- `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

Usa herramientas como:
- https://appicon.co/
- https://www.appicon.build/

---

## Solución de Problemas

### Error: "SDK location not found"
```bash
# Crear local.properties en android/
echo "sdk.dir=/path/to/Android/Sdk" > android/local.properties
```

### Error: "Gradle build failed"
```bash
cd android
./gradlew clean
./gradlew build
```

### Error: "Code signing required" (iOS)
- Asegúrate de tener una cuenta Apple Developer activa
- Verifica que el Bundle ID sea único

### Error: "Capacitor not synced"
```bash
npx cap sync
```

---

## Actualizaciones Futuras

Para actualizar la app:

1. Actualizar el código del webapp Flask
2. Ejecutar:
   ```bash
   npm run build
   npx cap sync
   ```
3. Incrementar versión en:
   - `android/app/build.gradle` (versionCode y versionName)
   - `ios/App/App/Info.plist` (CFBundleVersion y CFBundleShortVersionString)
4. Generar nuevo APK/IPA
5. Subir a las tiendas

---

## Contacto y Soporte

Para problemas técnicos con la compilación, revisa:
- [Documentación de Capacitor](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [Apple Developer Documentation](https://developer.apple.com/documentation/)
