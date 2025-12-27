#!/bin/bash
# Script de Deployment para TzotzilBible
# Autor: Manus AI
# Fecha: 27 de diciembre de 2025

set -e

echo "🚀 TzotzilBible - Script de Deployment"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -f "server.js" ]; then
    print_error "Error: Este script debe ejecutarse desde la raíz del proyecto TzotzilBible"
    exit 1
fi

print_success "Directorio del proyecto verificado"

# 2. Verificar que los archivos de fix existen
if [ ! -f ".replit" ]; then
    print_error "Error: Archivo .replit no encontrado"
    exit 1
fi

print_success "Archivos de configuración encontrados"

# 3. Instalar dependencias
echo ""
echo "📦 Instalando dependencias..."
npm install --production

if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error al instalar dependencias"
    exit 1
fi

# 4. Exportar bundle web
echo ""
echo "🔨 Construyendo bundle web de Expo..."
npx expo export --platform web

if [ $? -eq 0 ]; then
    print_success "Bundle web construido correctamente"
else
    print_error "Error al construir bundle web"
    exit 1
fi

# 5. Verificar que dist/ existe
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    print_error "Error: El directorio dist/ no se generó correctamente"
    exit 1
fi

print_success "Directorio dist/ generado correctamente"

# 6. Verificar que Express está instalado
if [ ! -d "node_modules/express" ]; then
    print_error "Error: Express no está instalado en node_modules"
    exit 1
fi

print_success "Express instalado correctamente"

# 7. Resumen
echo ""
echo "======================================"
echo "🎉 Build completado exitosamente"
echo "======================================"
echo ""
echo "Archivos generados:"
echo "  - dist/index.html"
echo "  - node_modules/express"
echo ""
echo "Próximos pasos:"
echo "  1. Hacer commit de los cambios:"
echo "     git add ."
echo "     git commit -m 'Fix: Resolver deployment - instalar dependencias'"
echo "     git push origin main"
echo ""
echo "  2. Hacer deployment en Replit:"
echo "     - Ve a la pestaña 'Deployments'"
echo "     - Haz clic en 'Deploy'"
echo "     - Espera 3-5 minutos"
echo ""
echo "  3. Verificar que funciona:"
echo "     - Visita la URL de deployment"
echo "     - Prueba la navegación"
echo "     - Prueba Nevin AI"
echo ""
print_success "¡Listo para deployment!"
