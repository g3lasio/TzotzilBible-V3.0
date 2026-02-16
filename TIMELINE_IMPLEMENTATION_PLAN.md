# Plan de Implementación: Cronología Bíblica

**Fecha**: 16 de febrero de 2026  
**Arquitecto**: Manuelito (Manus AI)  
**Propuesta Seleccionada**: El Códice Viviente (Propuesta 2)

---

## Fase 1: Preparación de Datos y Base de Datos

### 1.1 Consolidar Archivos JSON
**Objetivo**: Combinar los tres archivos JSON en una sola estructura unificada.

**Tareas**:
- Crear script de consolidación que combine `old-testament-timeline(1).json`, `old-testament-timeline-part2(1).json` y `new-testament-timeline(1).json`
- Generar archivo único `biblical_timeline.json` con todos los 223 eventos
- Validar que no haya IDs duplicados

**Archivo de salida**:
```json
{
  "metadata": {
    "title": "Cronología Bíblica Completa",
    "version": "1.0",
    "totalEvents": 223,
    "timeSpan": "4004 a.C. - 100 d.C.",
    "created": "2026-02-16"
  },
  "events": [...]
}
```

### 1.2 Diseñar Esquema de Base de Datos
**Objetivo**: Crear tablas SQLite para almacenar la cronología.

**Tablas**:

**timeline_events**:
```sql
CREATE TABLE timeline_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  yearBC INTEGER,
  yearAD INTEGER,
  yearStart INTEGER,
  yearEnd INTEGER,
  dateDisplay TEXT NOT NULL,
  reference TEXT NOT NULL,
  testament TEXT NOT NULL,
  era TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  certaintyLevel TEXT,
  significance TEXT,
  relatedVerses TEXT, -- JSON array
  keyPersons TEXT     -- JSON array
);
```

**timeline_eras**:
```sql
CREATE TABLE timeline_eras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  testament TEXT NOT NULL,
  startYear INTEGER,
  endYear INTEGER,
  description TEXT,
  eventCount INTEGER DEFAULT 0
);
```

**Índices para Performance**:
```sql
CREATE INDEX idx_events_testament ON timeline_events(testament);
CREATE INDEX idx_events_era ON timeline_events(era);
CREATE INDEX idx_events_category ON timeline_events(category);
CREATE INDEX idx_events_year ON timeline_events(yearBC, yearAD);
```

### 1.3 Script de Importación
**Objetivo**: Cargar los datos JSON en la base de datos SQLite.

**Archivo**: `scripts/import_timeline.ts`

**Funcionalidad**:
- Leer `biblical_timeline.json`
- Insertar eventos en `timeline_events`
- Calcular y poblar `timeline_eras` con estadísticas
- Validar integridad de datos

---

## Fase 2: Backend y Servicios

### 2.1 Servicio de Cronología
**Archivo**: `src/services/TimelineService.ts`

**Métodos principales**:
```typescript
class TimelineService {
  // Obtener todas las eras
  static async getEras(): Promise<Era[]>
  
  // Obtener eventos por era
  static async getEventsByEra(eraName: string): Promise<TimelineEvent[]>
  
  // Obtener eventos por testamento
  static async getEventsByTestament(testament: 'OT' | 'NT'): Promise<TimelineEvent[]>
  
  // Buscar eventos
  static async searchEvents(query: string): Promise<TimelineEvent[]>
  
  // Filtrar eventos
  static async filterEvents(filters: FilterOptions): Promise<TimelineEvent[]>
  
  // Obtener evento por ID
  static async getEventById(id: string): Promise<TimelineEvent | null>
  
  // Obtener eventos relacionados (por persona, lugar, etc.)
  static async getRelatedEvents(eventId: string): Promise<TimelineEvent[]>
}
```

**FilterOptions**:
```typescript
interface FilterOptions {
  testament?: 'OT' | 'NT';
  era?: string;
  category?: string;
  person?: string;
  location?: string;
  yearRange?: { start: number; end: number };
}
```

### 2.2 Tipos TypeScript
**Archivo**: `src/types/timeline.ts`

```typescript
export interface TimelineEvent {
  id: string;
  event: string;
  yearBC: number | null;
  yearAD: number | null;
  yearStart: number | null;
  yearEnd: number | null;
  dateDisplay: string;
  reference: string;
  testament: 'OT' | 'NT';
  era: string;
  category: string;
  description: string;
  keyPersons: string[];
  location: string;
  certaintyLevel: 'tradicional' | 'histórico' | 'arqueológico';
  significance: string;
  relatedVerses: string[];
}

export interface Era {
  id: number;
  name: string;
  testament: 'OT' | 'NT';
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  eventCount: number;
}
```

---

## Fase 3: Interfaz de Usuario

### 3.1 Navegación
**Actualizar**: `src/components/MainLayout.tsx`

**Agregar entrada en el sidebar**:
```typescript
{
  icon: 'timeline-text',
  label: 'Cronología Bíblica',
  screen: 'TimelineScreen'
}
```

### 3.2 Pantalla Principal: Lista de Eras
**Archivo**: `src/screens/TimelineScreen.tsx`

**Componentes**:
- Header con título "Cronología Bíblica"
- Buscador global
- Toggle para filtrar por testamento (AT / NT / Ambos)
- Lista de eras con:
  - Nombre de la era
  - Rango de fechas
  - Número de eventos
  - Ícono representativo

**Interacción**:
- Al tocar una era, navega a `TimelineEraScreen`

### 3.3 Pantalla de Era: Lista de Eventos
**Archivo**: `src/screens/TimelineEraScreen.tsx`

**Componentes**:
- Header con nombre de la era y rango de fechas
- Botón de filtros (categoría, persona, lugar)
- Lista cronológica de eventos con:
  - Fecha
  - Título del evento
  - Personas clave (chips)
  - Indicador de categoría (color)

**Interacción**:
- Al tocar un evento, navega a `TimelineEventDetailScreen`

### 3.4 Pantalla de Detalle de Evento
**Archivo**: `src/screens/TimelineEventDetailScreen.tsx`

**Secciones**:
1. **Header**: Título del evento y fecha destacada
2. **Descripción**: Texto completo del evento
3. **Información Clave**:
   - Personas involucradas
   - Ubicación
   - Nivel de certeza histórica
4. **Significado**: Importancia del evento
5. **Referencias Bíblicas**: Lista de versículos relacionados (clickables para ir a la Biblia)
6. **Eventos Relacionados**: Otros eventos conectados (opcional)

**Interacción**:
- Botón para compartir el evento
- Botón para agregar a favoritos (opcional)
- Tocar un versículo abre la Biblia en ese pasaje

### 3.5 Componente de Búsqueda
**Archivo**: `src/components/TimelineSearchBar.tsx`

**Funcionalidad**:
- Búsqueda en tiempo real mientras el usuario escribe
- Busca en: título del evento, descripción, personas, ubicación
- Muestra resultados en una lista con resaltado del término buscado

### 3.6 Componente de Filtros
**Archivo**: `src/components/TimelineFilters.tsx`

**Filtros disponibles**:
- **Categoría**: Dropdown con las 95 categorías
- **Persona**: Autocomplete con todas las personas mencionadas
- **Lugar**: Autocomplete con todas las ubicaciones
- **Rango de años**: Slider para seleccionar rango

**Interacción**:
- Modal que se abre desde la pantalla de era
- Botón "Aplicar Filtros" que cierra el modal y actualiza la lista

---

## Fase 4: Estilo y Tema Visual

### 4.1 Paleta de Colores por Categoría
**Objetivo**: Usar colores para identificar visualmente el tipo de evento.

**Ejemplos**:
- **Pactos** (covenant): Dorado (#FFD700)
- **Milagros** (miracle): Azul brillante (#00F3FF)
- **Conflictos** (conflict, war): Rojo (#FF4444)
- **Nacimientos** (birth): Verde claro (#00FF88)
- **Profecías** (prophecy): Púrpura (#9B59B6)

**Implementación**: `src/constants/timelineColors.ts`

### 4.2 Diseño de Tarjetas de Evento
**Inspiración**: Manuscritos antiguos, pero con diseño moderno.

**Elementos**:
- Borde sutil con efecto de pergamino
- Fecha destacada en un círculo o badge
- Tipografía clara y legible
- Chips de colores para personas y categorías

### 4.3 Animaciones
**Transiciones suaves**:
- Fade in al cargar listas
- Slide in al abrir detalles de evento
- Smooth scroll en listas largas

---

## Fase 5: Integración con Funcionalidades Existentes

### 5.1 Integración con la Biblia
**Objetivo**: Permitir navegación fluida entre cronología y texto bíblico.

**Implementación**:
- Al tocar un versículo en `relatedVerses`, abrir `BibleScreen` con ese versículo
- Pasar parámetros de navegación: `{ book, chapter, verse }`

### 5.2 Integración con Nevin
**Objetivo**: Nevin puede responder preguntas sobre la cronología.

**Implementación**:
- Agregar contexto de cronología al system prompt de Nevin
- Permitir que Nevin cite eventos de la cronología en sus respuestas
- Botón "Preguntar a Nevin" en la pantalla de detalle de evento

---

## Fase 6: Testing y Optimización

### 6.1 Testing de Performance
**Objetivo**: Asegurar que la app sea rápida con 223 eventos.

**Pruebas**:
- Tiempo de carga de lista de eras
- Tiempo de carga de eventos por era
- Tiempo de búsqueda
- Uso de memoria

**Optimizaciones**:
- Lazy loading de eventos (cargar solo los visibles)
- Caché de resultados de búsqueda
- Índices en base de datos

### 6.2 Testing de UX
**Objetivo**: Validar que la navegación sea intuitiva.

**Pruebas**:
- Flujo de navegación: Eras → Eventos → Detalle
- Búsqueda y filtros
- Integración con Biblia

---

## Fase 7: Deployment

### 7.1 Preparación de Assets
**Tareas**:
- Consolidar JSON en `assets/timeline_data/biblical_timeline.json`
- Asegurar que el script de importación se ejecute en el primer lanzamiento

### 7.2 Actualización de Versión
**Tareas**:
- Actualizar `package.json` a versión 2.2.0
- Actualizar notas de lanzamiento

### 7.3 Testing en Replit
**Tareas**:
- Probar en web
- Verificar que la base de datos se crea correctamente
- Probar todos los flujos de navegación

### 7.4 Builds Móviles
**Tareas**:
- Build de iOS con EAS
- Build de Android con EAS
- Testing en dispositivos físicos

---

## Estimación de Tiempo

| Fase | Tareas | Tiempo Estimado |
|------|--------|-----------------|
| Fase 1: Datos y BD | Consolidar JSON, diseñar esquema, script de importación | 2-3 horas |
| Fase 2: Backend | Servicio, tipos, lógica de negocio | 3-4 horas |
| Fase 3: UI | 4 pantallas, componentes de búsqueda y filtros | 6-8 horas |
| Fase 4: Estilo | Paleta de colores, diseño de tarjetas, animaciones | 2-3 horas |
| Fase 5: Integración | Biblia, Nevin | 2-3 horas |
| Fase 6: Testing | Performance, UX | 2-3 horas |
| Fase 7: Deployment | Assets, versión, builds | 2-3 horas |
| **TOTAL** | | **19-27 horas** |

---

## Próximos Pasos Inmediatos

1. **Aprobación**: Esperar tu confirmación para proceder con la Propuesta 2
2. **Fase 1**: Comenzar con la consolidación de datos y diseño de base de datos
3. **Milestone 1**: Presentar la base de datos funcionando con datos cargados
4. **Milestone 2**: Presentar las pantallas principales con navegación básica
5. **Milestone 3**: Presentar la versión completa con búsqueda, filtros e integración

¿Estás listo para que comience con la Fase 1, Gelasio?
