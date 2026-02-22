#!/bin/bash

# ============================================================
# FIX SCRIPT: iOS Xcode Build Errors - Missing Expo Modules
# ============================================================
# 
# Este script resuelve el error:
# "module map file '.../Expo.modulemap' not found"
# "no such module 'Expo'"
#
# Causa: CocoaPods no instaló correctamente las dependencias
# de Expo para builds de Release/Archive
#
# Solución: Limpiar cache, reinstalar pods, y reconstruir
# ============================================================

set -e  # Exit on error

echo "============================================================"
echo "  FIX: iOS Xcode Build Errors - Missing Expo Modules"
echo "============================================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: No se encuentra package.json"
    echo "   Por favor ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

echo "✅ Directorio correcto detectado"
echo ""

# Paso 1: Limpiar node_modules y reinstalar
echo "📦 Paso 1: Limpiando node_modules y reinstalando dependencias..."
rm -rf node_modules
npm install
echo "✅ Dependencias de Node reinstaladas"
echo ""

# Paso 2: Limpiar cache de CocoaPods
echo "🧹 Paso 2: Limpiando cache de CocoaPods..."
cd ios
rm -rf Pods
rm -rf ~/Library/Caches/CocoaPods
rm -rf Podfile.lock
rm -rf ~/Library/Developer/Xcode/DerivedData/*
echo "✅ Cache de CocoaPods limpiado"
echo ""

# Paso 3: Reinstalar pods
echo "📦 Paso 3: Reinstalando CocoaPods..."
pod deintegrate || true
pod install --repo-update
echo "✅ CocoaPods reinstalados"
echo ""

# Paso 4: Limpiar build de Xcode
echo "🧹 Paso 4: Limpiando build de Xcode..."
cd ..
xcodebuild clean -workspace ios/TzotzilBible.xcworkspace -scheme TzotzilBible -configuration Release || true
echo "✅ Build de Xcode limpiado"
echo ""

echo "============================================================"
echo "  ✅ FIX COMPLETADO"
echo "============================================================"
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Abre Xcode:"
echo "   open ios/TzotzilBible.xcworkspace"
echo ""
echo "2. En Xcode:"
echo "   - Product > Clean Build Folder (Cmd+Shift+K)"
echo "   - Cierra y vuelve a abrir Xcode"
echo "   - Product > Archive"
echo ""
echo "3. Si el error persiste, ejecuta:"
echo "   npx expo prebuild --platform ios --clean"
echo "   cd ios && pod install"
echo ""
echo "============================================================"
