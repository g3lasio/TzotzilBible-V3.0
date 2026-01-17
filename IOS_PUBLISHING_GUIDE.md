# Guía Paso a Paso: Publicar TzotzilBible en iOS App Store

**Fecha**: 17 de Enero, 2026  
**Plataforma**: iOS (iPhone/iPad)  
**Método**: EAS (Expo Application Services)

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- [x] **Apple Developer Program** membership activa ($99/año)
- [x] **Cuenta de Apple** con autenticación de dos factores
- [x] **App creada** en App Store Connect (ID: 6738797638)
- [x] **EAS CLI** instalado (viene con el proyecto)
- [x] **Acceso a Replit** shell

---

## 🚀 Paso 1: Preparar el Entorno

### En Replit Shell:

```bash
# 1. Ir al directorio del proyecto
cd TzotzilBible-V3.0

# 2. Asegurarse de tener la última versión del código
git pull origin main

# 3. Instalar dependencias (si es necesario)
npm install
```

---

## 🔐 Paso 2: Login a EAS

```bash
# Login a tu cuenta de Expo
eas login
```

**Credenciales**:
- Email: `gelasiochyrris@gmail.com`
- Password: [tu password de Expo]

**Output esperado**:
```
✔ Logged in as gelasiochyrris
```

---

## 📦 Paso 3: Compilar el Bundle de Producción

Antes de hacer el build, necesitas compilar el código JavaScript:

```bash
# Compilar bundle de producción
npx expo export --platform ios

# Verificar que se compiló
ls -lh dist/
```

**Output esperado**:
```
dist/
├── index.html
├── _expo/
│   └── static/js/ios/...
└── assets/
```

---

## 🏗️ Paso 4: Build para iOS (App Store)

Este es el comando principal que crea el archivo IPA:

```bash
# Build para App Store
eas build --platform ios --profile production
```

### ¿Qué Pasa Durante el Build?

1. **EAS sube tu código** a los servidores de Expo
2. **Compila la app nativa** en la nube (no necesitas Mac)
3. **Firma la app** con tus certificados de Apple
4. **Genera el archivo IPA** listo para App Store

### Preguntas Durante el Build:

**Pregunta 1**: "Would you like to automatically create an App Store Connect API Key?"
```
Respuesta: Yes (y)
```

**Pregunta 2**: "Log in to your Apple account"
```
Email: gelasiochyrris@gmail.com
Password: [tu password de Apple]
Código 2FA: [código de tu iPhone]
```

**Pregunta 3**: "Select a team"
```
Selecciona: Gelasio Chyrris (8LKWFPB6RJ)
```

### Tiempo Estimado:

- ⏱️ **10-20 minutos** para el build completo

### Output Durante el Build:

```
✔ Compressing project files...
✔ Uploading to EAS Build...
✔ Queued build...
✔ Build in progress...
  ├ Provisioning...
  ├ Installing dependencies...
  ├ Running fastlane...
  ├ Building...
  └ Uploading artifacts...
✔ Build finished!
```

---

## 📥 Paso 5: Descargar el Archivo IPA

Cuando el build termine, verás:

```
Build finished!

Build ID: [build-id]
Build URL: https://expo.dev/accounts/[account]/projects/tzotzil-bible/builds/[build-id]

Download URL: https://expo.dev/artifacts/[artifact-id]
```

### Opción A: Descargar Manualmente

1. **Copia el "Download URL"** del output
2. **Abre en navegador** y descarga el IPA
3. **Guarda** el archivo (ej: `tzotzil-bible-2.1.0.ipa`)

### Opción B: Descargar con Comando

```bash
# Descargar el IPA directamente
eas build:download --platform ios --profile production
```

El archivo se guardará en el directorio actual.

---

## 📤 Paso 6: Subir a App Store Connect (Opción 1 - Automático)

### Usando EAS Submit:

```bash
# Submit automático a App Store Connect
eas submit --platform ios --profile production
```

### Preguntas Durante Submit:

**Pregunta 1**: "Select a build to submit"
```
Selecciona: [El build más reciente que acabas de crear]
```

**Pregunta 2**: "Log in to Apple"
```
Email: gelasiochyrris@gmail.com
Password: [tu password]
Código 2FA: [código]
```

### ¿Qué Hace EAS Submit?

1. **Sube el IPA** a App Store Connect
2. **Procesa el build** (10-15 minutos)
3. **Lo hace disponible** para TestFlight y App Store

### Output Esperado:

```
✔ Uploaded successfully!
✔ Processing build...
✔ Build available in App Store Connect

App Store Connect URL:
https://appstoreconnect.apple.com/apps/6738797638
```

---

## 📤 Paso 7: Subir a App Store Connect (Opción 2 - Manual)

Si prefieres subir manualmente:

### 1. Instalar Transporter (Mac)

- Descarga **Transporter** desde Mac App Store
- O usa **Xcode** (si tienes Mac)

### 2. Subir el IPA

1. **Abre Transporter**
2. **Arrastra el archivo IPA** a Transporter
3. **Click "Deliver"**
4. **Espera** a que procese (10-15 minutos)

### 3. Verificar en App Store Connect

1. Ve a https://appstoreconnect.apple.com
2. Selecciona **"Tzotzil Bible"**
3. Ve a **"TestFlight"** tab
4. Deberías ver el nuevo build

---

## 🧪 Paso 8: Probar en TestFlight

Antes de enviar a revisión, prueba en TestFlight:

### 1. Agregar el Build a TestFlight

En App Store Connect:
1. Ve a **TestFlight** → **iOS Builds**
2. Selecciona el build recién subido
3. **Agrega a un grupo de testing**
4. **Completa la información** de "What to Test"

### 2. Invitar Testers

1. Ve a **TestFlight** → **Internal Testing** o **External Testing**
2. **Agrega testers** por email
3. Ellos recibirán invitación por email

### 3. Probar la App

1. **Instala TestFlight** en tu iPhone
2. **Acepta la invitación**
3. **Descarga e instala** la app
4. **Prueba exhaustivamente**:
   - ✅ Todas las pantallas funcionan
   - ✅ Botones Copy/Share en Nevin
   - ✅ Control de fuente en versículos
   - ✅ No hay crashes
   - ✅ Funciona en iPad

---

## 📝 Paso 9: Completar Metadata en App Store Connect

Antes de enviar a revisión, completa:

### 1. App Information

- **Name**: Tzotzil Bible
- **Subtitle**: [Tu subtitle]
- **Category**: Reference o Education
- **Content Rights**: [Tu información]

### 2. Pricing and Availability

- **Price**: Free (o el precio que quieras)
- **Availability**: [Países donde estará disponible]
- **⚠️ IMPORTANTE**: **Excluir China mainland** (por el problema de licencia)

### 3. App Privacy

- **Privacy Policy URL**: [Tu URL de privacy policy]
- **Privacy Practices**: Completar el cuestionario

### 4. App Review Information

- **Contact Information**: Tu email y teléfono
- **Demo Account** (si la app requiere login):
  - Username: [demo username]
  - Password: [demo password]
- **Notes**: Explicar cualquier funcionalidad especial

### 5. Version Information

- **What's New**: Descripción de esta versión
- **Promotional Text**: Texto promocional (opcional)
- **Description**: Descripción completa de la app
- **Keywords**: Palabras clave para búsqueda
- **Support URL**: URL de soporte
- **Marketing URL**: URL de marketing (opcional)

### 6. Screenshots

**CRÍTICO**: Debes subir screenshots para:
- **iPhone 6.7"** (iPhone 15 Pro Max, etc.)
- **iPhone 6.5"** (iPhone 14 Plus, etc.)
- **iPad Pro 12.9"** (si soportas iPad)

**Cómo tomar screenshots**:
1. Abre la app en TestFlight
2. Navega a pantallas importantes
3. Toma screenshots (botón power + volumen arriba)
4. Sube a App Store Connect

**Screenshots recomendados**:
1. Pantalla principal (Home)
2. Lista de libros de la Biblia
3. Lectura de versículos
4. Pantalla de Nevin (con conversación)
5. Configuración o features especiales

---

## 🚀 Paso 10: Enviar a Revisión de Apple

Cuando todo esté completo:

### 1. Seleccionar Build

En App Store Connect:
1. Ve a **App Store** tab
2. Click **"+ Version"** o selecciona la versión existente
3. **Selecciona el build** de TestFlight

### 2. Completar Información de Versión

- **Version Number**: 2.1.0
- **Copyright**: © 2026 [Tu nombre/organización]
- **Age Rating**: Completar cuestionario

### 3. Enviar

1. **Click "Add for Review"**
2. **Revisa** toda la información
3. **Click "Submit for Review"**

### 4. Esperar Revisión

- ⏱️ **Típicamente 1-2 días**
- Recibirás email cuando:
  - La app entre en revisión
  - La app sea aprobada o rechazada

---

## 📊 Resumen de Tiempos

| Paso | Tiempo Estimado |
|------|-----------------|
| **Preparación** | 5 minutos |
| **Login EAS** | 2 minutos |
| **Compilar bundle** | 2 minutos |
| **Build iOS** | 10-20 minutos |
| **Submit a App Store** | 5 minutos |
| **Procesamiento** | 10-15 minutos |
| **TestFlight setup** | 10 minutos |
| **Testing** | 30-60 minutos |
| **Completar metadata** | 30-60 minutos |
| **Revisión de Apple** | 1-2 días |
| **TOTAL** | ~2-3 horas + 1-2 días de revisión |

---

## 🔄 Comandos Rápidos de Referencia

```bash
# 1. Login
eas login

# 2. Build
eas build --platform ios --profile production

# 3. Submit
eas submit --platform ios --profile production

# 4. Ver builds
eas build:list

# 5. Ver detalles de un build
eas build:view [build-id]

# 6. Descargar IPA
eas build:download --platform ios --profile production

# 7. Ver configuración
eas config

# 8. Ver información del proyecto
eas project:info
```

---

## ⚠️ Troubleshooting

### Problema: "Apple ID authentication failed"

**Solución**:
```bash
# Re-login
eas login
# Asegúrate de usar la cuenta correcta
```

### Problema: "Build failed"

**Solución**:
```bash
# Ver logs del build
eas build:view [build-id]
# Revisar errores en los logs
```

### Problema: "No provisioning profile found"

**Solución**:
- EAS debería crear automáticamente
- Si falla, ve a https://developer.apple.com y verifica tus certificados

### Problema: "Bundle identifier already in use"

**Solución**:
- Verifica que el `bundleIdentifier` en `app.config.js` sea único
- Debe ser: `com.chyrris.tzotzibbible`

---

## 📝 Checklist Pre-Submit

Antes de enviar a revisión, verifica:

- [ ] **Build exitoso** en EAS
- [ ] **Probado en TestFlight** sin crashes
- [ ] **Metadata completa** en App Store Connect
- [ ] **Screenshots subidos** (todos los tamaños requeridos)
- [ ] **Privacy policy** URL pública y accesible
- [ ] **App Privacy** cuestionario completado
- [ ] **Demo credentials** (si la app requiere login)
- [ ] **China excluida** de availability
- [ ] **Support URL** funcional
- [ ] **Age rating** completado
- [ ] **Build seleccionado** en App Store tab

---

## 🎯 Notas Importantes

### Sobre el Rechazo Anterior de Apple:

1. **Bug del botón plus en iPad**: ✅ Ya corregido
2. **Licencia de China**: ✅ Excluir China de availability

### Sobre los Cambios Recientes:

1. **Botones Copy/Share en Nevin**: ✅ Implementados
2. **Control de fuente en versículos**: ✅ Implementado
3. **Sistema de citación EGW**: ✅ Mejorado

**Menciona estos cambios** en "What's New" y en las notas de revisión.

---

## 📧 Notas para App Review

Incluye esto en las notas de revisión:

```
Versión 2.1.0 - Mejoras y Correcciones

Cambios principales:
1. Corregido bug del botón plus en iPad (reportado en revisión anterior)
2. Agregados botones de compartir y copiar en mensajes de Nevin
3. Mejorado control de tamaño de fuente en lectura de versículos
4. Mejorado sistema de citación de fuentes

La app es una Biblia en idioma Tzotzil con asistente AI (Nevin) para 
preguntas bíblicas. No requiere login. Todas las funcionalidades son 
accesibles inmediatamente.

Nota: La app no está disponible en China mainland debido a requisitos 
de licencia de publicación de contenido religioso.
```

---

## 🎉 ¡Listo!

Siguiendo estos pasos, tu app estará en App Store Connect y lista para revisión.

**Tiempo total estimado**: 2-3 horas de trabajo + 1-2 días de revisión de Apple.

---

## 📚 Referencias

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [EAS Submit Docs](https://docs.expo.dev/submit/introduction/)
- [App Store Connect](https://appstoreconnect.apple.com/)
- [Apple Developer](https://developer.apple.com/)
- [TestFlight](https://developer.apple.com/testflight/)
