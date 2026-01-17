#!/bin/bash

echo "=========================================="
echo "  DIAGNÓSTICO COMPLETO - TzotzilBible"
echo "=========================================="
echo ""

# 1. Verificar versión de Git y commit actual
echo "1. INFORMACIÓN DE GIT"
echo "---------------------"
git --version
echo "Branch actual: $(git branch --show-current)"
echo "Último commit: $(git log --oneline -1)"
echo "Estado: $(git status --short | wc -l) archivos modificados"
echo ""

# 2. Verificar que los archivos tienen los cambios
echo "2. VERIFICACIÓN DE ARCHIVOS"
echo "---------------------------"
node ../verify_changes.js
echo ""

# 3. Verificar estructura de directorios
echo "3. ESTRUCTURA DE PROYECTO"
echo "-------------------------"
echo "src/screens existe: $([ -d src/screens ] && echo 'SÍ' || echo 'NO')"
echo "Archivos en src/screens:"
ls -1 src/screens/ | grep -E "Nevin|Verses|Settings" | while read file; do
  size=$(wc -l "src/screens/$file" | awk '{print $1}')
  echo "  - $file ($size líneas)"
done
echo ""

# 4. Verificar package.json y dependencias críticas
echo "4. DEPENDENCIAS CRÍTICAS"
echo "------------------------"
if [ -f package.json ]; then
  echo "React Native version: $(grep '"react-native"' package.json | cut -d'"' -f4)"
  echo "Expo version: $(grep '"expo"' package.json | cut -d'"' -f4)"
  echo "node_modules existe: $([ -d node_modules ] && echo 'SÍ' || echo 'NO')"
fi
echo ""

# 5. Verificar cachés
echo "5. ESTADO DE CACHÉS"
echo "-------------------"
echo ".expo existe: $([ -d .expo ] && echo 'SÍ (DEBE SER LIMPIADO)' || echo 'NO (OK)')"
echo "node_modules/.cache existe: $([ -d node_modules/.cache ] && echo 'SÍ (DEBE SER LIMPIADO)' || echo 'NO (OK)')"
echo "Metro cache: $(ls -d /tmp/metro-* 2>/dev/null | wc -l) archivos"
echo ""

# 6. Verificar procesos en ejecución
echo "6. PROCESOS EN EJECUCIÓN"
echo "------------------------"
expo_process=$(pgrep -f "expo" | wc -l)
metro_process=$(pgrep -f "metro" | wc -l)
echo "Procesos Expo: $expo_process"
echo "Procesos Metro: $metro_process"
if [ $expo_process -gt 0 ] || [ $metro_process -gt 0 ]; then
  echo "⚠️  HAY PROCESOS EN EJECUCIÓN - Deben ser detenidos"
else
  echo "✅ No hay procesos en ejecución"
fi
echo ""

# 7. Verificar configuración de Metro
echo "7. CONFIGURACIÓN DE METRO"
echo "-------------------------"
if [ -f metro.config.js ]; then
  echo "metro.config.js existe: SÍ"
  echo "Configuración personalizada detectada"
else
  echo "metro.config.js existe: NO (usando default)"
fi
echo ""

# 8. Recomendaciones
echo "=========================================="
echo "  RECOMENDACIONES"
echo "=========================================="
echo ""

changes_ok=$(node ../verify_changes.js 2>/dev/null | grep -c "✅ Todos los cambios")
cache_exists=$([ -d .expo ] && echo 1 || echo 0)
processes_running=$([ $expo_process -gt 0 ] && echo 1 || echo 0)

if [ "$changes_ok" -eq 1 ] && [ "$cache_exists" -eq 1 ]; then
  echo "✅ Los archivos tienen los cambios correctos"
  echo "⚠️  PERO hay cachés que deben ser limpiados"
  echo ""
  echo "SOLUCIÓN:"
  echo "1. Detener el servidor (Ctrl+C)"
  echo "2. Ejecutar: rm -rf .expo node_modules/.cache /tmp/metro-*"
  echo "3. Ejecutar: npx expo start --clear"
  echo "4. Recargar la app en el dispositivo"
elif [ "$changes_ok" -eq 1 ] && [ "$processes_running" -eq 1 ]; then
  echo "✅ Los archivos tienen los cambios correctos"
  echo "⚠️  PERO hay procesos que deben ser detenidos"
  echo ""
  echo "SOLUCIÓN:"
  echo "1. Ejecutar: pkill -f 'expo'"
  echo "2. Ejecutar: npx expo start --clear"
  echo "3. Recargar la app en el dispositivo"
elif [ "$changes_ok" -eq 1 ]; then
  echo "✅ Los archivos tienen los cambios correctos"
  echo "✅ No hay cachés problemáticos"
  echo ""
  echo "Si aún no ves los cambios en la app:"
  echo "1. Asegúrate de haber recargado la app (sacude el dispositivo → Reload)"
  echo "2. O ejecuta: npx expo start --clear"
  echo "3. Si persiste, reinstala: rm -rf node_modules && npm install"
else
  echo "⚠️  Los archivos NO tienen todos los cambios"
  echo ""
  echo "SOLUCIÓN:"
  echo "1. Ejecutar: git pull origin main"
  echo "2. Verificar nuevamente con este script"
fi

echo ""
echo "=========================================="
echo "  FIN DEL DIAGNÓSTICO"
echo "=========================================="
