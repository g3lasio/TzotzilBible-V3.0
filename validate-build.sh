#!/bin/bash

echo "🔍 Validando configuración para builds de producción..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

errors=0
warnings=0

# Check Node version
echo "📦 Verificando versión de Node..."
node_version=$(node -v | cut -d'v' -f2)
required_version="20.19.4"
if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
    echo -e "${GREEN}✓${NC} Node version: v$node_version (>= v$required_version)"
else
    echo -e "${RED}✗${NC} Node version: v$node_version (requiere >= v$required_version)"
    ((errors++))
fi

# Check if app.config.js exists
echo ""
echo "📱 Verificando archivos de configuración..."
if [ -f "app.config.js" ]; then
    echo -e "${GREEN}✓${NC} app.config.js existe"
else
    echo -e "${RED}✗${NC} app.config.js no encontrado"
    ((errors++))
fi

# Check if app.json exists (should not)
if [ -f "app.json" ]; then
    echo -e "${YELLOW}⚠${NC} app.json existe (puede causar conflictos con app.config.js)"
    ((warnings++))
fi

# Check eas.json
if [ -f "eas.json" ]; then
    echo -e "${GREEN}✓${NC} eas.json existe"
else
    echo -e "${RED}✗${NC} eas.json no encontrado"
    ((errors++))
fi

# Check critical assets
echo ""
echo "🖼️  Verificando assets críticos..."
assets=("assets/icon.png" "assets/splash-icon.png" "assets/adaptive-icon.png" "assets/bible.db")
for asset in "${assets[@]}"; do
    if [ -f "$asset" ]; then
        size=$(du -h "$asset" | cut -f1)
        echo -e "${GREEN}✓${NC} $asset ($size)"
    else
        echo -e "${RED}✗${NC} $asset no encontrado"
        ((errors++))
    fi
done

# Check package.json
echo ""
echo "📋 Verificando package.json..."
if grep -q '"express"' package.json; then
    echo -e "${GREEN}✓${NC} Express está en dependencies"
else
    echo -e "${RED}✗${NC} Express no está en dependencies"
    ((errors++))
fi

if grep -q '"engines"' package.json; then
    echo -e "${GREEN}✓${NC} Campo engines definido"
else
    echo -e "${YELLOW}⚠${NC} Campo engines no definido"
    ((warnings++))
fi

# Check .gitignore
echo ""
echo "🔒 Verificando .gitignore..."
if grep -q "service-account-key.json" .gitignore; then
    echo -e "${GREEN}✓${NC} Credenciales protegidas en .gitignore"
else
    echo -e "${YELLOW}⚠${NC} service-account-key.json no está en .gitignore"
    ((warnings++))
fi

# Check EAS project ID
echo ""
echo "🌐 Verificando configuración de EAS..."
if grep -q "projectId" app.config.js; then
    project_id=$(grep "projectId" app.config.js | cut -d'"' -f2)
    echo -e "${GREEN}✓${NC} EAS projectId: $project_id"
else
    echo -e "${RED}✗${NC} EAS projectId no encontrado en app.config.js"
    ((errors++))
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}✅ Validación exitosa!${NC}"
    echo "El proyecto está listo para builds de producción."
    echo ""
    echo "Comandos disponibles:"
    echo "  eas build --platform android --profile production  # AAB para Google Play"
    echo "  eas build --platform ios --profile production      # IPA para App Store"
    echo "  eas build --platform android --profile preview     # APK para testing"
    exit 0
else
    echo -e "${RED}❌ Validación fallida con $errors error(es)${NC}"
    if [ $warnings -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $warnings advertencia(s)${NC}"
    fi
    echo ""
    echo "Por favor corrige los errores antes de hacer builds de producción."
    exit 1
fi
