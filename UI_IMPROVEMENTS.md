# Mejoras de UI - Nevin y Versículos

## Fecha: 16 de Enero, 2026

---

## 📋 Resumen de Cambios

Se implementaron dos mejoras importantes en la interfaz de usuario:

1. **Botones de Copy y Share en mensajes de Nevin**
2. **Control de tamaño de fuente funcional en versículos** (movido desde Settings)

---

## 1. Botones de Copy y Share en Mensajes de Nevin ✅

### Ubicación
- **Archivo**: `src/screens/NevinScreen.tsx`
- **Posición**: Esquina inferior derecha de cada mensaje de Nevin

### Funcionalidad

#### Botón Copy (Copiar)
- **Icono**: `content-copy`
- **Acción**: Copia el contenido del mensaje al portapapeles
- **Feedback**: Alert con mensaje "✓ Copiado"

#### Botón Share (Compartir)
- **Icono**: `share-variant`
- **Acción**: Abre el diálogo nativo de compartir del sistema
- **Formato**: `"Nevin responde:\n\n[contenido]\n\n— Tzotzil Bible App"`

### Cambios Técnicos

#### Imports Agregados
```typescript
import { ..., Clipboard, Share } from 'react-native';
```

#### Estructura de Mensaje
```typescript
<View style={styles.messageFooter}>
  <Text style={styles.timestamp}>...</Text>
  {!message.isUser && (
    <View style={styles.messageActions}>
      <TouchableOpacity style={styles.messageActionButton} onPress={copyAction}>
        <MaterialCommunityIcons name="content-copy" size={14} color="#6b7c93" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.messageActionButton} onPress={shareAction}>
        <MaterialCommunityIcons name="share-variant" size={14} color="#6b7c93" />
      </TouchableOpacity>
    </View>
  )}
</View>
```

#### Estilos Agregados
```typescript
messageFooter: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 6,
},
messageActions: {
  flexDirection: 'row',
  gap: 8,
},
messageActionButton: {
  padding: 4,
  borderRadius: 4,
  backgroundColor: 'rgba(107, 124, 147, 0.1)',
},
```

---

## 2. Control de Tamaño de Fuente en Versículos ✅

### Cambios en Settings

#### Archivo: `src/screens/SettingsScreen.tsx`

**Eliminado**:
- Sección completa de "APARIENCIA"
- Control de tamaño de fuente no funcional
- Funciones `handleFontSizeChange()` y `getFontSizeLabel()`

**Reemplazado con**:
```tsx
{/* Nota: El ajustador de tamaño de fuente se ha movido al menú de opciones de versículos */}
```

### Cambios en Versículos

#### Archivo: `src/screens/VersesScreen.tsx`

### Estado y Persistencia

#### Nuevo Estado
```typescript
const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
```

#### Nueva Constante
```typescript
const FONT_SIZE_KEY = 'verse_font_size';
```

#### Carga de Preferencias
```typescript
const [savedVersion, savedDisplayMode, savedFontSize] = await Promise.all([
  AsyncStorage.getItem(SELECTED_VERSION_KEY),
  AsyncStorage.getItem(DISPLAY_MODE_KEY),
  AsyncStorage.getItem(FONT_SIZE_KEY), // ← Nuevo
]);

if (savedFontSize !== null && ['small', 'medium', 'large'].includes(savedFontSize)) {
  setFontSize(savedFontSize as 'small' | 'medium' | 'large');
}
```

### Funciones de Tamaño Dinámico

#### getFontSizeValue()
```typescript
const getFontSizeValue = () => {
  switch (fontSize) {
    case 'small': return { normal: 14, parallel: 11 };
    case 'large': return { normal: 18, parallel: 15 };
    default: return { normal: 16, parallel: 13 };
  }
};
```

#### getLineHeightValue()
```typescript
const getLineHeightValue = () => {
  switch (fontSize) {
    case 'small': return { normal: 22, parallel: 18 };
    case 'large': return { normal: 30, parallel: 24 };
    default: return { normal: 26, parallel: 21 };
  }
};
```

### Aplicación en Renderizado

#### Vista Simple (Single)
```typescript
<Text style={[
  styles.verseText, 
  { 
    fontSize: getFontSizeValue().normal, 
    lineHeight: getLineHeightValue().normal 
  }
]}>
  {verseText}
</Text>
```

#### Vista Paralela (Parallel)
```typescript
// Columna izquierda (Tzotzil)
<Text style={[
  styles.parallelVerseText, 
  { 
    fontSize: getFontSizeValue().parallel, 
    lineHeight: getLineHeightValue().parallel 
  }
]}>
  {verse.text_tzotzil}
</Text>

// Columna derecha (Español/RV1960)
<Text style={[
  styles.parallelVerseText, 
  { 
    fontSize: getFontSizeValue().parallel, 
    lineHeight: getLineHeightValue().parallel 
  }
]}>
  {getVerseText(verse, secondaryVersion) || '-'}
</Text>
```

### Control en Menú de Opciones

#### Ubicación
Dentro del modal de opciones de versículo (3 puntos), entre "Marcar como favorito" y "Cerrar"

#### Estructura
```typescript
<View style={styles.menuItem}>
  <MaterialCommunityIcons name="format-size" size={20} color="#00f3ff" />
  <Text style={styles.menuItemText}>Tamaño de fuente</Text>
  <View style={styles.fontSizeControl}>
    <TouchableOpacity 
      style={[styles.fontButton, fontSize === 'small' && styles.fontButtonActive]}
      onPress={async () => {
        setFontSize('small');
        await AsyncStorage.setItem(FONT_SIZE_KEY, 'small');
      }}
    >
      <Text style={[styles.fontButtonText, fontSize === 'small' && styles.fontButtonTextActive]}>A</Text>
    </TouchableOpacity>
    {/* Medium y Large buttons... */}
  </View>
</View>
```

#### Estilos Agregados
```typescript
fontSizeControl: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  marginLeft: 'auto',
},
fontButton: {
  width: 32,
  height: 32,
  borderRadius: 6,
  backgroundColor: 'rgba(0, 243, 255, 0.1)',
  justifyContent: 'center',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: 'rgba(0, 243, 255, 0.2)',
},
fontButtonActive: {
  backgroundColor: 'rgba(0, 255, 136, 0.2)',
  borderColor: '#00ff88',
},
fontButtonText: {
  fontSize: 10,
  color: '#6b7c93',
  fontWeight: 'bold',
},
fontButtonTextMedium: {
  fontSize: 14,
  color: '#6b7c93',
  fontWeight: 'bold',
},
fontButtonTextLarge: {
  fontSize: 18,
  color: '#6b7c93',
  fontWeight: 'bold',
},
fontButtonTextActive: {
  color: '#00ff88',
},
```

---

## 🎯 Características Clave

### Botones de Nevin
✅ Solo aparecen en mensajes de Nevin (no en mensajes del usuario)  
✅ Posicionados en esquina inferior derecha  
✅ Iconos pequeños y discretos (14px)  
✅ Feedback inmediato al copiar  
✅ Integración nativa con sistema de compartir

### Control de Fuente
✅ Funciona en tiempo real  
✅ Aplica a TODO el capítulo  
✅ Aplica a AMBAS versiones en modo paralelo  
✅ Se guarda en AsyncStorage (persiste entre sesiones)  
✅ Tres tamaños: Small (14/11px), Medium (16/13px), Large (18/15px)  
✅ Ajuste automático de line-height proporcional  
✅ Accesible desde menú de opciones de cualquier versículo

---

## 📱 Experiencia de Usuario

### Flujo de Uso - Botones de Nevin

1. Usuario hace una pregunta a Nevin
2. Nevin responde con un mensaje
3. Usuario ve dos botones pequeños en la esquina inferior:
   - 📋 Copiar
   - 🔗 Compartir
4. Al tocar "Copiar": mensaje copiado al portapapeles + alert de confirmación
5. Al tocar "Compartir": se abre el diálogo nativo del sistema

### Flujo de Uso - Tamaño de Fuente

1. Usuario está leyendo un capítulo
2. Toca los 3 puntos en cualquier versículo
3. Ve la opción "Tamaño de fuente" con 3 botones (A pequeña, A mediana, A grande)
4. Selecciona el tamaño deseado
5. **TODO el capítulo** se actualiza inmediatamente
6. Si está en modo paralelo, **ambas versiones** se actualizan
7. La preferencia se guarda automáticamente
8. Al volver a abrir la app, el tamaño se mantiene

---

## 🧪 Testing Requerido

### Test 1: Botones de Nevin - Copy
- [ ] Hacer pregunta a Nevin
- [ ] Esperar respuesta
- [ ] Tocar botón de copiar
- [ ] Verificar alert "✓ Copiado"
- [ ] Pegar en otra app (Notes, WhatsApp)
- [ ] Verificar que el texto es correcto

### Test 2: Botones de Nevin - Share
- [ ] Hacer pregunta a Nevin
- [ ] Esperar respuesta
- [ ] Tocar botón de compartir
- [ ] Verificar que se abre diálogo nativo
- [ ] Compartir a WhatsApp/Telegram
- [ ] Verificar formato: "Nevin responde:\n\n[texto]\n\n— Tzotzil Bible App"

### Test 3: Tamaño de Fuente - Vista Simple
- [ ] Abrir un capítulo en modo "TZO" o "RV1960" (no paralelo)
- [ ] Tocar 3 puntos en cualquier versículo
- [ ] Cambiar a "Small"
- [ ] Verificar que TODO el capítulo se hace más pequeño
- [ ] Cambiar a "Large"
- [ ] Verificar que TODO el capítulo se hace más grande
- [ ] Cerrar y reabrir la app
- [ ] Verificar que el tamaño se mantiene

### Test 4: Tamaño de Fuente - Vista Paralela
- [ ] Abrir un capítulo en modo "Ambos" (paralelo)
- [ ] Tocar 3 puntos en cualquier versículo
- [ ] Cambiar a "Small"
- [ ] Verificar que AMBAS columnas (TZO y RV1960) se hacen más pequeñas
- [ ] Cambiar a "Large"
- [ ] Verificar que AMBAS columnas se hacen más grandes
- [ ] Verificar que el texto sigue siendo legible
- [ ] Verificar que no hay overflow

### Test 5: Persistencia
- [ ] Cambiar tamaño de fuente a "Large"
- [ ] Cerrar completamente la app (force quit)
- [ ] Reabrir la app
- [ ] Navegar a cualquier capítulo
- [ ] Verificar que el tamaño es "Large"

### Test 6: Regresión - Settings
- [ ] Abrir Settings
- [ ] Verificar que NO aparece el control de fuente antiguo
- [ ] Verificar que las otras opciones funcionan correctamente

### Test 7: Regresión - Nevin
- [ ] Verificar que los mensajes del usuario NO tienen botones
- [ ] Verificar que el timestamp sigue visible
- [ ] Verificar que el layout no está roto
- [ ] Verificar que el scroll funciona correctamente

---

## ⚠️ Notas Importantes

### Sobre Botones de Nevin
- Los botones solo aparecen en mensajes de **Nevin**, no en mensajes del usuario
- El botón de copiar usa `Clipboard.setString()` (API nativa de React Native)
- El botón de compartir usa `Share.share()` (API nativa de React Native)
- Los iconos son pequeños (14px) para no distraer de la lectura

### Sobre Tamaño de Fuente
- El control se eliminó de Settings porque **no era funcional**
- Ahora está en el menú de opciones de versículos donde **SÍ es funcional**
- El tamaño se aplica **dinámicamente** usando inline styles
- Se guardan en AsyncStorage con la key `verse_font_size`
- Los tamaños son diferentes para vista simple vs paralela:
  - **Vista simple**: 14/16/18px
  - **Vista paralela**: 11/13/15px (más pequeño para que quepan dos columnas)
- El line-height se ajusta proporcionalmente para mantener legibilidad

### Sobre Compatibilidad
- Todas las funciones usan APIs nativas de React Native
- Compatible con iOS y Android
- No requiere permisos especiales
- No requiere dependencias adicionales

---

## 📦 Archivos Modificados

1. **src/screens/NevinScreen.tsx**
   - Agregados imports: `Clipboard`, `Share`
   - Modificada estructura de mensaje (messageFooter)
   - Agregados estilos: `messageFooter`, `messageActions`, `messageActionButton`

2. **src/screens/SettingsScreen.tsx**
   - Eliminada sección de "APARIENCIA"
   - Eliminadas funciones relacionadas con fontSize

3. **src/screens/VersesScreen.tsx**
   - Agregado estado: `fontSize`
   - Agregada constante: `FONT_SIZE_KEY`
   - Modificada función: `loadPreferences()`
   - Agregadas funciones: `getFontSizeValue()`, `getLineHeightValue()`
   - Modificadas funciones: `renderVerseSingle()`, `renderVerseParallel()`
   - Agregado control en menú de opciones
   - Agregados estilos: `fontSizeControl`, `fontButton`, `fontButtonActive`, `fontButtonText`, etc.

---

## ✅ Checklist de Implementación

- [x] Agregar imports de Clipboard y Share en NevinScreen
- [x] Crear estructura de messageFooter con botones
- [x] Implementar acción de copiar con feedback
- [x] Implementar acción de compartir con formato
- [x] Agregar estilos para botones de Nevin
- [x] Eliminar sección de fuente de Settings
- [x] Agregar estado fontSize en VersesScreen
- [x] Agregar carga/guardado de fontSize en AsyncStorage
- [x] Crear funciones getFontSizeValue() y getLineHeightValue()
- [x] Aplicar fontSize dinámico en renderVerseSingle()
- [x] Aplicar fontSize dinámico en renderVerseParallel()
- [x] Agregar control de fuente en menú de opciones
- [x] Agregar estilos para control de fuente
- [x] Crear documentación completa
- [ ] Testing en desarrollo (pendiente)
- [ ] Commit y push a GitHub (pendiente)
- [ ] Build de producción (pendiente)

---

## 🚀 Próximos Pasos

1. **Testing en Replit/Expo**
   - Ejecutar la app en modo desarrollo
   - Probar todas las funcionalidades nuevas
   - Verificar que no hay regresiones

2. **Commit y Push**
   ```bash
   git add -A
   git commit -m "Feature: Botones Copy/Share en Nevin + Control de fuente funcional en versículos"
   git push origin main
   ```

3. **Build de Producción**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

4. **Testing en TestFlight/Google Play Internal**
   - Probar en dispositivos reales
   - Verificar en iPad (para el bug de Apple)
   - Recolectar feedback

5. **Resubmisión a App Store**
   - Incluir nota sobre mejoras de UI
   - Mencionar el fix del botón plus en iPad
   - Excluir China del mercado

---

**Implementación completada el 16 de Enero, 2026**
