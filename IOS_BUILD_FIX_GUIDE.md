# GUÍA DE SOLUCIÓN - Errores de Build iOS en Xcode

**Fecha:** 20 Feb 2026  
**Error:** `module map file '.../Expo.modulemap' not found`  
**Causa:** CocoaPods no instaló correctamente las dependencias de Expo para builds de Release/Archive

---

## DIAGNÓSTICO DEL PROBLEMA

### Errores detectados en el log:

```
<unknown>:0: error: module map file '.../EXApplication.modulemap' not found
<unknown>:0: error: module map file '.../EXConstants.modulemap' not found
<unknown>:0: error: module map file '.../Expo.modulemap' not found
... (14 módulos Expo en total)

/ios/TzotzilBible/AppDelegate.swift:1:8: error: no such module 'Expo'
import Expo
       ^
```

### Causa raíz:

Este es un **problema común con Expo + CocoaPods** cuando se intenta hacer **Archive** (Release build) en lugar de un build normal (Debug). Los module maps de Expo no se generan correctamente para el esquema de Release.

**Por qué ocurre:**
1. CocoaPods no compiló correctamente los frameworks de Expo para Release
2. Los module maps (.modulemap) no se generaron en el directorio de build
3. El bridging header de Swift no puede encontrar los módulos de Expo

---

## SOLUCIÓN 1: FIX RÁPIDO (Recomendado)

### Ejecutar script automático:

```bash
cd ~/TzotzilBible-V3.0  # O donde esté tu proyecto

# Dar permisos de ejecución
chmod +x fix_ios_build.sh

# Ejecutar el fix
./fix_ios_build.sh
```

### Qué hace el script:

1. ✅ Limpia `node_modules` y reinstala dependencias
2. ✅ Limpia cache de CocoaPods (`~/Library/Caches/CocoaPods`)
3. ✅ Elimina `Pods/` y `Podfile.lock`
4. ✅ Limpia DerivedData de Xcode
5. ✅ Reinstala pods con `pod install --repo-update`
6. ✅ Limpia build de Xcode con `xcodebuild clean`

### Después del script:

```bash
# Abrir Xcode
open ios/TzotzilBible.xcworkspace

# En Xcode:
# 1. Product > Clean Build Folder (Cmd+Shift+K)
# 2. Cerrar y volver a abrir Xcode
# 3. Product > Archive
```

**Tiempo estimado:** 5-10 minutos

---

## SOLUCIÓN 2: FIX ALTERNATIVO (Si Solución 1 falla)

### Regenerar proyecto iOS desde cero:

```bash
cd ~/TzotzilBible-V3.0

# Dar permisos de ejecución
chmod +x fix_ios_build_alternative.sh

# Ejecutar el fix alternativo
./fix_ios_build_alternative.sh
```

### Qué hace el script alternativo:

1. ✅ Elimina completamente `node_modules/` e `ios/`
2. ✅ Limpia todos los caches (CocoaPods, Xcode DerivedData)
3. ✅ Reinstala dependencias de Node
4. ✅ Regenera proyecto iOS con `npx expo prebuild --platform ios --clean`
5. ✅ Instala pods frescos

### Después del script:

```bash
# Abrir Xcode
open ios/TzotzilBible.xcworkspace

# En Xcode:
# 1. Product > Archive
```

**Tiempo estimado:** 10-15 minutos

---

## SOLUCIÓN 3: MANUAL (Si ambos scripts fallan)

### Paso a paso manual:

```bash
cd ~/TzotzilBible-V3.0

# 1. Limpiar todo
rm -rf node_modules
rm -rf ios/Pods
rm -rf ios/Podfile.lock
rm -rf ~/Library/Caches/CocoaPods
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# 2. Reinstalar dependencias
npm install

# 3. Reinstalar pods
cd ios
pod deintegrate
pod install --repo-update
cd ..

# 4. Abrir Xcode
open ios/TzotzilBible.xcworkspace
```

### En Xcode:

1. **Product > Clean Build Folder** (Cmd+Shift+K)
2. **Cerrar Xcode completamente**
3. **Volver a abrir Xcode**
4. **Product > Archive**

---

## SOLUCIÓN 4: NUCLEAR (Último recurso)

Si nada funciona, regenerar todo desde cero:

```bash
cd ~/TzotzilBible-V3.0

# 1. Backup de archivos importantes
cp app.config.js app.config.js.backup
cp -r assets assets.backup

# 2. Eliminar TODO
rm -rf node_modules
rm -rf ios
rm -rf android
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/CocoaPods

# 3. Reinstalar desde cero
npm install
npx expo prebuild --clean

# 4. Instalar pods
cd ios
pod install --repo-update
cd ..

# 5. Abrir Xcode
open ios/TzotzilBible.xcworkspace
```

**Tiempo estimado:** 15-20 minutos

---

## VERIFICACIÓN POST-FIX

Después de aplicar cualquier solución, verifica:

### 1. Pods instalados correctamente:

```bash
cd ios
ls Pods/
```

Deberías ver directorios como:
- `EXApplication/`
- `EXConstants/`
- `Expo/`
- `ExpoModulesCore/`
- etc.

### 2. Module maps generados:

```bash
find ios/Pods -name "*.modulemap" | grep Expo
```

Deberías ver archivos como:
- `ios/Pods/.../EXApplication.modulemap`
- `ios/Pods/.../Expo.modulemap`
- etc.

### 3. Xcode workspace correcto:

```bash
ls ios/*.xcworkspace
```

Debes usar `TzotzilBible.xcworkspace` (NO `.xcodeproj`)

---

## TROUBLESHOOTING ADICIONAL

### Error persiste después de todos los fixes:

**Verificar versión de CocoaPods:**

```bash
pod --version
```

Si es < 1.11.0, actualizar:

```bash
sudo gem install cocoapods
```

**Verificar versión de Xcode:**

```bash
xcodebuild -version
```

Debe ser Xcode 14+ para iOS 16+

**Verificar Ruby:**

```bash
ruby --version
```

Debe ser Ruby 2.7+

### Error "ffi" al instalar pods:

```bash
sudo gem install ffi
cd ios
pod install
```

### Error "Permission denied":

```bash
sudo chown -R $(whoami) ~/Library/Caches/CocoaPods
sudo chown -R $(whoami) ios/Pods
```

---

## PREVENCIÓN FUTURA

Para evitar este problema en futuros builds:

### 1. Siempre usar workspace:

```bash
open ios/TzotzilBible.xcworkspace  # ✅ CORRECTO
# NO: open ios/TzotzilBible.xcodeproj  # ❌ INCORRECTO
```

### 2. Limpiar antes de Archive:

Antes de hacer Product > Archive:
1. Product > Clean Build Folder (Cmd+Shift+K)
2. Cerrar y reabrir Xcode

### 3. Actualizar pods regularmente:

```bash
cd ios
pod update
```

### 4. No editar archivos en ios/ manualmente:

Los archivos en `ios/` son generados automáticamente por `expo prebuild`. Si necesitas cambios, edita `app.config.js` y regenera:

```bash
npx expo prebuild --platform ios --clean
```

---

## NOTAS IMPORTANTES

### ⚠️ NO HACER:

- ❌ No abrir `.xcodeproj` (usar `.xcworkspace`)
- ❌ No editar `Podfile` manualmente sin regenerar
- ❌ No hacer `pod install` sin limpiar cache primero
- ❌ No mezclar builds de Debug y Release sin limpiar

### ✅ SIEMPRE HACER:

- ✅ Usar `.xcworkspace` en lugar de `.xcodeproj`
- ✅ Limpiar build folder antes de Archive
- ✅ Cerrar y reabrir Xcode después de cambios en pods
- ✅ Verificar que todos los pods estén instalados

---

## RESUMEN DE COMANDOS

### Fix rápido (una línea):

```bash
cd ~/TzotzilBible-V3.0 && rm -rf node_modules ios/Pods ios/Podfile.lock ~/Library/Caches/CocoaPods ~/Library/Developer/Xcode/DerivedData/* && npm install && cd ios && pod install --repo-update && cd .. && open ios/TzotzilBible.xcworkspace
```

### Fix alternativo (una línea):

```bash
cd ~/TzotzilBible-V3.0 && rm -rf node_modules ios ~/Library/Caches/CocoaPods ~/Library/Developer/Xcode/DerivedData/* && npm install && npx expo prebuild --platform ios --clean && cd ios && pod install --repo-update && cd .. && open ios/TzotzilBible.xcworkspace
```

---

## CONTACTO Y SOPORTE

Si después de intentar todas las soluciones el error persiste:

1. Envía el log completo de `pod install`
2. Envía el log completo del build de Xcode
3. Verifica versiones de herramientas:
   ```bash
   node --version
   npm --version
   pod --version
   xcodebuild -version
   ruby --version
   ```

---

**¡Éxito con el build!** 🚀
