#!/bin/bash

# ============================================================
# FIX ALTERNATIVO: Regenerar proyecto iOS desde cero
# ============================================================
# 
# Este script regenera completamente el proyecto iOS nativo
# usando expo prebuild --clean
#
# Usa este script si el fix principal no funciona
# ============================================================

set -e  # Exit on error

echo "============================================================"
echo "  FIX ALTERNATIVO: Regenerar proyecto iOS desde cero"
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

# Paso 1: Limpiar todo
echo "🧹 Paso 1: Limpiando todo..."
rm -rf node_modules
rm -rf ios
rm -rf ~/Library/Developer/Xcode/DerivedData/*
rm -rf ~/Library/Caches/CocoaPods
echo "✅ Limpieza completa"
echo ""

# Paso 2: Reinstalar dependencias
echo "📦 Paso 2: Reinstalando dependencias de Node..."
npm install
echo "✅ Dependencias reinstaladas"
echo ""

# Paso 3: Regenerar proyecto iOS
echo "🔨 Paso 3: Regenerando proyecto iOS nativo..."
npx expo prebuild --platform ios --clean
echo "✅ Proyecto iOS regenerado"
echo ""

# Paso 4: Instalar pods
echo "📦 Paso 4: Instalando CocoaPods..."
cd ios
pod install --repo-update
cd ..
echo "✅ CocoaPods instalados"
echo ""

echo "============================================================"
echo "  ✅ FIX ALTERNATIVO COMPLETADO"
echo "============================================================"
echo ""
echo "PRÓXIMOS PASOS:"
echo ""
echo "1. Abre Xcode:"
echo "   open ios/TzotzilBible.xcworkspace"
echo ""
echo "2. En Xcode:"
echo "   - Product > Clean Build Folder (Cmd+Shift+K)"
echo "   - Product > Archive"
echo ""
echo "============================================================"
