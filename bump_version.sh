#!/bin/bash

# ============================================================
# BUMP VERSION - Increment version automatically
# ============================================================
# 
# Este script incrementa automáticamente la versión y build
# en todos los archivos necesarios:
# - app.config.js
# - android/app/build.gradle
# - ios/TzotzilBible/Info.plist
#
# Uso:
#   ./bump_version.sh patch   # 4.1.0 -> 4.1.1
#   ./bump_version.sh minor   # 4.1.0 -> 4.2.0
#   ./bump_version.sh major   # 4.1.0 -> 5.0.0
# ============================================================

set -e  # Exit on error

BUMP_TYPE=${1:-patch}

echo "============================================================"
echo "  BUMP VERSION - $BUMP_TYPE"
echo "============================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "app.config.js" ]; then
    echo "❌ ERROR: No se encuentra app.config.js"
    exit 1
fi

# Extraer versión actual
CURRENT_VERSION=$(grep -m 1 'version:' app.config.js | sed 's/.*version: "\(.*\)".*/\1/')
CURRENT_BUILD=$(grep -m 1 'const BUILD_NUMBER' app.config.js | sed 's/.*"\(.*\)".*/\1/')
CURRENT_VERSION_CODE=$(grep -m 1 'const VERSION_CODE' app.config.js | sed 's/.*= \(.*\);.*/\1/')

echo "📖 Versión actual:"
echo "   Version: $CURRENT_VERSION"
echo "   iOS Build: $CURRENT_BUILD"
echo "   Android Version Code: $CURRENT_VERSION_CODE"
echo ""

# Parsear versión (major.minor.patch)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Incrementar según tipo
case $BUMP_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo "❌ ERROR: Tipo de bump inválido: $BUMP_TYPE"
        echo "   Usa: patch, minor, o major"
        exit 1
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
NEW_BUILD=$((CURRENT_BUILD + 1))
NEW_VERSION_CODE=$((CURRENT_VERSION_CODE + 1))

echo "📦 Nueva versión:"
echo "   Version: $NEW_VERSION"
echo "   iOS Build: $NEW_BUILD"
echo "   Android Version Code: $NEW_VERSION_CODE"
echo ""

# Confirmar cambios
read -p "¿Continuar con el bump? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Cancelado"
    exit 1
fi

# 1. Actualizar app.config.js
echo "📝 Actualizando app.config.js..."
sed -i.backup "s/const BUILD_NUMBER = \"$CURRENT_BUILD\"/const BUILD_NUMBER = \"$NEW_BUILD\"/" app.config.js
sed -i.backup "s/const VERSION_CODE = $CURRENT_VERSION_CODE/const VERSION_CODE = $NEW_VERSION_CODE/" app.config.js
sed -i.backup "s/version: \"$CURRENT_VERSION\"/version: \"$NEW_VERSION\"/" app.config.js
rm app.config.js.backup
echo "✅ app.config.js actualizado"

# 2. Actualizar Android build.gradle
if [ -f "android/app/build.gradle" ]; then
    echo "📝 Actualizando android/app/build.gradle..."
    sed -i.backup "s/versionCode $CURRENT_VERSION_CODE/versionCode $NEW_VERSION_CODE/" android/app/build.gradle
    sed -i.backup "s/versionName \"$CURRENT_VERSION\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle
    rm android/app/build.gradle.backup
    echo "✅ android/app/build.gradle actualizado"
fi

# 3. Actualizar iOS Info.plist si existe
if [ -f "ios/TzotzilBible/Info.plist" ]; then
    echo "📝 Actualizando ios/TzotzilBible/Info.plist..."
    /usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $NEW_VERSION" ios/TzotzilBible/Info.plist
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $NEW_BUILD" ios/TzotzilBible/Info.plist
    echo "✅ ios/TzotzilBible/Info.plist actualizado"
fi

echo ""
echo "============================================================"
echo "  ✅ VERSION BUMPED: $CURRENT_VERSION → $NEW_VERSION"
echo "============================================================"
echo ""
echo "Cambios aplicados:"
echo "  - app.config.js"
echo "  - android/app/build.gradle"
echo "  - ios/TzotzilBible/Info.plist"
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Revisar cambios:"
echo "   git diff"
echo ""
echo "2. Commit y push:"
echo "   git add app.config.js android/app/build.gradle ios/TzotzilBible/Info.plist"
echo "   git commit -m \"chore: bump version to $NEW_VERSION (build $NEW_BUILD)\""
echo "   git push origin main"
echo ""
echo "3. Hacer build:"
echo "   open ios/TzotzilBible.xcworkspace"
echo "   # Product > Archive"
echo ""
echo "============================================================"
