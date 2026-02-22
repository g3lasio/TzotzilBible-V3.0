#!/bin/bash

# ============================================================
# AUTO-UPDATE iOS VERSION - Sync app.config.js to Info.plist
# ============================================================
# 
# Este script lee la versión y buildNumber de app.config.js
# y los aplica directamente al Info.plist de iOS
#
# Esto garantiza que Xcode Archive use los valores correctos
# ============================================================

set -e  # Exit on error

echo "============================================================"
echo "  AUTO-UPDATE iOS VERSION"
echo "============================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.config.js" ]; then
    echo "❌ ERROR: No se encuentra app.config.js"
    echo "   Por favor ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

if [ ! -d "ios" ]; then
    echo "❌ ERROR: No se encuentra el directorio ios/"
    echo "   Ejecuta primero: npx expo prebuild --platform ios --clean"
    exit 1
fi

echo "✅ Directorio correcto detectado"
echo ""

# Extraer VERSION y BUILD_NUMBER de app.config.js
echo "📖 Leyendo versiones de app.config.js..."

VERSION=$(grep -m 1 'version:' app.config.js | sed 's/.*version: "\(.*\)".*/\1/')
BUILD_NUMBER=$(grep -m 1 'const BUILD_NUMBER' app.config.js | sed 's/.*"\(.*\)".*/\1/')

if [ -z "$VERSION" ] || [ -z "$BUILD_NUMBER" ]; then
    echo "❌ ERROR: No se pudo extraer VERSION o BUILD_NUMBER de app.config.js"
    exit 1
fi

echo "   Version: $VERSION"
echo "   Build Number: $BUILD_NUMBER"
echo ""

# Encontrar el archivo Info.plist
INFO_PLIST="ios/TzotzilBible/Info.plist"

if [ ! -f "$INFO_PLIST" ]; then
    echo "❌ ERROR: No se encuentra $INFO_PLIST"
    exit 1
fi

echo "📝 Actualizando $INFO_PLIST..."

# Backup del Info.plist
cp "$INFO_PLIST" "$INFO_PLIST.backup"

# Actualizar CFBundleShortVersionString (version)
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION" "$INFO_PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Add :CFBundleShortVersionString string $VERSION" "$INFO_PLIST"

# Actualizar CFBundleVersion (build number)
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD_NUMBER" "$INFO_PLIST" 2>/dev/null || \
/usr/libexec/PlistBuddy -c "Add :CFBundleVersion string $BUILD_NUMBER" "$INFO_PLIST"

echo "✅ Info.plist actualizado"
echo ""

# Verificar cambios
echo "🔍 Verificando cambios..."
PLIST_VERSION=$(/usr/libexec/PlistBuddy -c "Print :CFBundleShortVersionString" "$INFO_PLIST")
PLIST_BUILD=$(/usr/libexec/PlistBuddy -c "Print :CFBundleVersion" "$INFO_PLIST")

echo "   CFBundleShortVersionString: $PLIST_VERSION"
echo "   CFBundleVersion: $PLIST_BUILD"
echo ""

if [ "$PLIST_VERSION" = "$VERSION" ] && [ "$PLIST_BUILD" = "$BUILD_NUMBER" ]; then
    echo "✅ Verificación exitosa - Versiones sincronizadas"
    rm "$INFO_PLIST.backup"
else
    echo "❌ ERROR: Verificación falló"
    echo "   Restaurando backup..."
    mv "$INFO_PLIST.backup" "$INFO_PLIST"
    exit 1
fi

echo ""
echo "============================================================"
echo "  ✅ ACTUALIZACIÓN COMPLETA"
echo "============================================================"
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Abrir Xcode:"
echo "   open ios/TzotzilBible.xcworkspace"
echo ""
echo "2. Verificar en Xcode que aparezca:"
echo "   Version: $VERSION"
echo "   Build: $BUILD_NUMBER"
echo ""
echo "3. Hacer Archive:"
echo "   Product > Archive"
echo ""
echo "============================================================"
