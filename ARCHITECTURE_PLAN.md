# Plan de Arquitectura y Actualización: Tzotzil Bible v3.1

**Autor**: Manuelito (Senior Software Architect)
**Fecha**: 16 de febrero de 2026
**Para**: Gelasio (CEO)

---

## 1. Resumen Ejecutivo

Hola Gelasio, he completado el análisis inicial de la arquitectura de **Tzotzil Bible v3.0**. El proyecto está construido sobre una base sólida con **React Native y Expo**, lo que facilita su naturaleza multiplataforma (iOS, Android, Web). La gestión de datos bíblicos se centraliza en un único archivo JSON (`all_verses.json`), y la lógica de la aplicación está bien estructurada en componentes y servicios.

Este documento detalla el plan estratégico para implementar las nuevas funcionalidades solicitadas, corregir los bugs existentes y definir los formatos de contenido necesarios para que puedas prepararlos con Claude. Mi objetivo es asegurar que la próxima versión sea robusta, escalable y fácil de mantener.

---

## 2. Formatos de Contenido Requeridos

Para que pueda integrar el nuevo material que prepararás con Claude, es crucial que siga una estructura específica. A continuación, detallo el formato exacto que necesito para cada nueva funcionalidad.

### 2.1. Nuevas Versiones de la Biblia (NVI, DHH, TLA)

**Formato Requerido**: Un único archivo `JSON` por cada nueva versión.

Cada archivo debe contener un array de objetos, donde cada objeto representa un versículo. La estructura debe ser idéntica a la existente, pero solo con el campo de texto de esa versión.

**Ejemplo de Estructura (`nvi.json`, `dhh.json`, `tla.json`):**
```json
[
  {
    "book_id": 1,      // ID numérico del libro (Génesis=1, Éxodo=2, etc.)
    "chapter": 1,      // Número del capítulo
    "verse": 1,        // Número del versículo
    "text": "En el principio creó Dios los cielos y la tierra." // Texto del versículo
  },
  {
    "book_id": 1,
    "chapter": 1,
    "verse": 2,
    "text": "Y la tierra estaba desordenada y vacía..."
  }
  // ...así sucesivamente para todos los versículos de la Biblia
]
```

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `book_id` | `Number` | ID numérico del libro (1-66) | `1` |
| `chapter` | `Number` | Número del capítulo | `1` |
| `verse` | `Number` | Número del versículo | `1` |
| `text` | `String` | Texto completo del versículo | `"En el principio..."` |

**Instrucción Clave**: Necesito un archivo JSON completo por cada versión (NVI, DHH, TLA) que contenga **todos los versículos de la Biblia** en este formato. Esto me permitirá integrarlos eficientemente en la base de datos de la aplicación.

### 2.2. Plan de Lectura Anual Cronológico

**Formato Requerido**: Un único archivo `JSON` llamado `reading_plan_chronological.json`.

Este archivo contendrá un array de 365 objetos, uno por cada día del año. Cada objeto especificará los capítulos a leer ese día.

**Ejemplo de Estructura (`reading_plan_chronological.json`):**
```json
[
  {
    "day": 1,
    "title": "La Creación",
    "readings": [
      { "book": "Génesis", "chapters": [1, 2] },
      { "book": "Salmos", "chapters": [8] }
    ]
  },
  {
    "day": 2,
    "title": "La Caída del Hombre",
    "readings": [
      { "book": "Génesis", "chapters": [3, 4, 5] }
    ]
  }
  // ...así sucesivamente hasta el día 365
]
```

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `day` | `Number` | Día del año (1-365) | `1` |
| `title` | `String` | Título temático para la lectura del día | `"La Creación"` |
| `readings`| `Array` | Array de objetos que definen los pasajes | `[{ "book": "Génesis", "chapters": [1, 2] }]` |

**Instrucción Clave**: El campo `book` debe coincidir exactamente con el nombre del libro en español como aparece en la versión Reina-Valera 1960 (ej. "Génesis", "Éxodo", "Salmos").

### 2.3. Cronología Bíblica (Línea de Tiempo)

**Formato Requerido**: Un único archivo `JSON` llamado `timeline_events.json`.

Este archivo contendrá un array de eventos, cada uno con su fecha, descripción y los pasajes bíblicos asociados.

**Ejemplo de Estructura (`timeline_events.json`):**
```json
[
  {
    "event_id": 1,
    "title": "La Creación",
    "date_bc_ad": "BC",
    "year_start": 4004,
    "year_end": null,
    "description": "Dios crea los cielos y la tierra en seis días y descansa en el séptimo.",
    "references": [
      { "book": "Génesis", "chapters": [1, 2] }
    ]
  },
  {
    "event_id": 2,
    "title": "El Diluvio Universal",
    "date_bc_ad": "BC",
    "year_start": 2348,
    "year_end": 2347,
    "description": "Debido a la maldad de la humanidad, Dios envía un diluvio que cubre toda la tierra, salvando solo a Noé, su familia y los animales en el arca.",
    "references": [
      { "book": "Génesis", "chapters": [6, 7, 8, 9] }
    ]
  }
  // ...así sucesivamente para todos los eventos
]
```

| Campo | Tipo | Descripción | Ejemplo |
|---|---|---|---|
| `event_id` | `Number` | ID único del evento | `1` |
| `title` | `String` | Título del evento | `"La Creación"` |
| `date_bc_ad`| `String` | "BC" (Antes de Cristo) o "AD" (Después de Cristo) | `"BC"` |
| `year_start`| `Number` | Año de inicio del evento (negativo para AC si se prefiere) | `4004` |
| `year_end` | `Number` | Año de fin del evento (opcional) | `2347` |
| `description`| `String` | Breve descripción del evento | `"Dios crea los cielos..."` |
| `references`| `Array` | Pasajes bíblicos relacionados | `[{ "book": "Génesis", "chapters": [1, 2] }]` |

**Instrucción Clave**: La precisión de las fechas (`year_start`) es fundamental. Sé que esto requiere una investigación profunda, pero una cronología bien fundamentada será una característica única y de gran valor para la app.

---

## 3. Plan de Implementación de Nuevas Funcionalidades

### 3.1. Integración de Nuevas Versiones

1.  **Modificación de la Base de Datos**: Actualmente, la app usa `expo-sqlite` y carga los datos desde `all_verses.json`. La estrategia más escalable es migrar a una estructura de base de datos más robusta. Propondré crear una tabla `verses` y una tabla `versions`.
2.  **Script de Importación**: Desarrollaré un script que tomará los nuevos archivos JSON (nvi.json, dhh.json, tla.json) y los importará a la base de datos SQLite, asociándolos con la versión correcta.
3.  **Actualización de la UI**: Modificaré el componente `VersionToggle` y la pantalla de `Settings` para permitir al usuario seleccionar y descargar las nuevas versiones disponibles.

### 3.2. Implementación del Plan de Lectura

1.  **Nueva Pantalla**: Crearé una nueva pantalla `ReadingPlanScreen.tsx`.
2.  **Lógica de Datos**: La pantalla leerá el archivo `reading_plan_chronological.json`.
3.  **Interfaz de Usuario**: Mostrará una lista de 365 días. Al tocar un día, se mostrará el título y los pasajes a leer. Los pasajes serán enlaces que llevarán al usuario directamente al capítulo correspondiente en la pantalla de la Biblia.
4.  **Seguimiento de Progreso**: Utilizaré `AsyncStorage` para guardar el progreso del usuario (qué días ha completado).

### 3.3. Implementación de la Cronología Bíblica

1.  **Nueva Pantalla**: Crearé una nueva pantalla `TimelineScreen.tsx`.
2.  **Componente de Línea de Tiempo**: Desarrollaré un componente visual que renderice los eventos del archivo `timeline_events.json` en una línea de tiempo vertical e interactiva.
3.  **Interactividad**: Cada evento en la línea de tiempo será expandible para mostrar la descripción completa y los pasajes de referencia, que a su vez serán enlaces a la Biblia.

---

## 4. Plan de Corrección de Bugs

He analizado los dos bugs que reportaste. Aquí está mi diagnóstico y plan de acción.

### 4.1. Bug #1: Crash al Compartir en Nevin (🔴 Crítico)

-   **Análisis**: El problema se debe a que la función `Share` de React Native se está importando de forma dinámica (`await import(...)`) dentro del evento `onPress`. Esto es inestable y causa el crash de la aplicación en móviles.
-   **Solución**: Modificaré el archivo `src/screens/NevinScreen.tsx` para importar `Share` de forma estática al principio del archivo, tal como se hace en otras pantallas de la app. Esto resolverá el crash.

### 4.2. Bug #2: Formato Incorrecto de Citas de EGW (🟡 Medio)

-   **Análisis**: La documentación `EGW_CITATION_SYSTEM.md` indica que el sistema de abreviaturas ya fue implementado en el backend (`server.js`). Sin embargo, el modelo de IA no está siguiendo las instrucciones del *system prompt* de forma consistente.
-   **Solución**: Reforzaré las instrucciones en el `system prompt` del backend. Seré mucho más explícito, proporcionando ejemplos claros de formatos correctos e incorrectos, y usando un lenguaje que obligue al modelo a seguir las reglas de citación estrictamente. Esto no requerirá cambios en la app, solo en la lógica del servidor.

---

## 5. Próximos Pasos

1.  **Tu Parte (Gelasio)**: Con estos formatos definidos, puedes empezar a trabajar con Claude para generar los archivos `nvi.json`, `dhh.json`, `tla.json`, `reading_plan_chronological.json` y `timeline_events.json`.
2.  **Mi Parte (Manuelito)**:
    -   **Inmediato**: Corregiré los dos bugs reportados, empezando por el crash crítico.
    -   **Siguiente**: Comenzaré a preparar la arquitectura para las nuevas funcionalidades (modificación de la base de datos, creación de las nuevas pantallas, etc.).

Estoy listo para empezar a implementar las correcciones. Por favor, hazme saber si tienes alguna pregunta sobre los formatos de contenido. ¡Vamos a llevar este proyecto al siguiente nivel!
