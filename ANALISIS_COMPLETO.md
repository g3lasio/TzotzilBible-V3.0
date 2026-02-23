# Análisis Detallado y Plan de Acción para el Proyecto Tzotzil Bible v7.0.0

**Fecha:** 23 de Febrero de 2026
**Autor:** Manus AI

## 1. Resumen Ejecutivo

Tras un análisis exhaustivo del repositorio `g3lasio/TzotzilBible-V3.0`, se han identificado varias áreas críticas que requieren atención inmediata antes de proceder con el despliegue y la compilación de las aplicaciones para iOS y Android. Los problemas principales se centran en la gestión de dependencias, la carga de datos asíncrona que provoca errores en la interfaz de usuario, una lógica de fallback de versiones de la Biblia que no funciona como se esperaba en la plataforma nativa, y una configuración de compilación incompleta que impide el correcto funcionamiento de módulos nativos.

Este informe detalla los hallazgos clave y presenta un plan de acción concreto para estabilizar el proyecto, corregir los errores y asegurar un proceso de compilación y despliegue exitoso. Las acciones recomendadas se dividen en tres áreas principales: **Correcciones Críticas de la Aplicación**, **Optimización del Proceso de Compilación (Builds)** y **Mejoras Recomendadas a Largo Plazo**.

## 2. Diagnóstico de Problemas Críticos

A continuación, se presenta una tabla que resume los problemas más importantes encontrados durante el análisis, su impacto en el proyecto y la causa raíz identificada.

| Problema Crítico | Impacto | Causa Raíz | Archivos Afectados |
| :--- | :--- | :--- | :--- |
| **Error Fatal: `TypeError: Cannot read properties of undefined (reading 'toLowerCase')`** | La aplicación crashea en la pantalla de selección de libros, impidiendo la navegación. | Una condición de carrera (race condition) en `BibleScreen.tsx`. El componente intenta renderizar la lista de libros antes de que los nombres de los libros se hayan cargado de forma asíncrona, resultando en un intento de llamar a `.toLowerCase()` sobre un valor `undefined`. | `src/screens/BibleScreen.tsx`, `src/services/BibleService.ts` |
| **Fallo en Versiones Descargadas (Fallback a RV1960)** | Las versiones de la Biblia que el usuario descarga no se muestran en la app nativa; el sistema recurre incorrectamente a la versión RV1960. | La base de datos SQLite (`bible.db`) incluida en la app solo contiene las columnas para las versiones Tzotzil y RV1960. La lógica en `DatabaseService.ts` para "enriquecer" los versículos con el texto de las versiones descargadas es ineficiente y propensa a fallos, ya que realiza una consulta a `VersionManager` por cada versículo individualmente, lo cual no funciona correctamente. | `src/services/DatabaseService.ts`, `src/services/VersionManager.ts`, `assets/bible.db` |
| **Módulos Nativos No Registrados** | Funcionalidades como notificaciones, almacenamiento seguro y el portapapeles no funcionarán en las compilaciones de iOS y Android. | Los plugins de Expo para `expo-notifications`, `expo-secure-store` y `expo-clipboard` están instalados y se usan en el código, pero no están declarados en la sección `plugins` del archivo `app.config.js`. Esto impide que EAS (Expo Application Services) configure el código nativo necesario durante el proceso de compilación. | `app.config.js` |
| **Dependencias Redundantes y Conflictivas** | Riesgo de conflictos de versiones y aumento innecesario del tamaño de la aplicación. | El proyecto incluye tanto `@expo/vector-icons` como `react-native-vector-icons` en `package.json`. La primera es la librería recomendada para proyectos de Expo y ya gestiona la segunda internamente, por lo que tener ambas explícitamente es redundante y una fuente común de errores de compilación. | `package.json` |

## 3. Plan de Acción Detallado

Se ha preparado un plan de acción dividido en fases para abordar sistemáticamente los problemas identificados. Se recomienda aplicar estas correcciones en el orden presentado para maximizar la estabilidad del proyecto.

### Fase 1: Correcciones Críticas de la Aplicación

El objetivo de esta fase es solucionar los errores que impiden el funcionamiento básico de la aplicación.

1.  **Solucionar el `TypeError` en `BibleScreen.tsx`:**
    *   **Acción:** Añadir una guarda de seguridad en el método `filter` para asegurar que `book.name` exista antes de llamar a `.toLowerCase()`. Esto previene el crash de la aplicación si el componente se renderiza antes de que los datos estén completamente cargados.
    *   **Código Sugerido en `src/screens/BibleScreen.tsx`:**
        ```typescript
        const filteredBooks = books.filter(book => {
          const matchesSearch = book && book.name ? book.name.toLowerCase().includes(searchQuery.toLowerCase()) : false;
          // ... resto de la lógica del filtro
          return matchesSearch && matchesTestament;
        });
        ```

2.  **Corregir el Fallback de Versiones en Nativas (iOS/Android):**
    *   **Acción:** Modificar la estrategia de carga de datos en `DatabaseService.ts`. En lugar de enriquecer cada versículo individualmente (lo cual es ineficiente y la causa del fallo), se debe cargar el capítulo completo de la versión descargada en memoria y luego unirlo con los datos de la base de datos. Este enfoque es similar al que ya se utiliza con éxito en la versión web (`WebBibleService.ts`).
    *   **Pasos de Implementación:**
        1.  En `DatabaseService.getVerses`, después de obtener los versículos base de SQLite, iterar sobre las versiones descargadas activas.
        2.  Para cada versión descargada, usar `versionManager.getChapterVerses()` para obtener un mapa con todos los versículos de ese capítulo.
        3.  Unir los textos del mapa en los objetos de versículos correspondientes. Esto reduce cientos de llamadas asíncronas a una sola por versión y capítulo, solucionando el problema de raíz.

### Fase 2: Optimización del Proceso de Compilación (Builds)

Esta fase se enfoca en configurar correctamente el entorno de compilación para asegurar que todas las funcionalidades nativas se incluyan en las apps de iOS y Android.

1.  **Registrar los Plugins Nativos Faltantes:**
    *   **Acción:** Añadir los plugins de Expo que faltan al array `plugins` en `app.config.js`. Esto es **mandatorio** para que las notificaciones y otras funcionalidades nativas funcionen.
    *   **Código Sugerido en `app.config.js`:**
        ```javascript
        plugins: [
          "expo-font",
          ["expo-splash-screen", { /* ...config... */ }],
          ["expo-asset", { assets: ["./assets/bible.db"] }],
          // AÑADIR ESTOS PLUGINS
          "expo-notifications",
          "expo-secure-store",
          "expo-clipboard"
        ],
        ```

2.  **Eliminar Dependencia Redundante:**
    *   **Acción:** Desinstalar `react-native-vector-icons` y eliminarlo de `package.json`. `@expo/vector-icons` ya lo gestiona, y eliminar la dependencia explícita previene posibles conflictos de autolinking.
    *   **Comando:**
        ```bash
        npm uninstall react-native-vector-icons
        ```

### Fase 3: Mejoras Recomendadas a Largo Plazo

Estas acciones mejorarán la mantenibilidad y el rendimiento del proyecto a futuro.

1.  **Refactorizar la Carga de Datos en `BibleScreen.tsx`:**
    *   **Recomendación:** En lugar de depender de un `useEffect` para cargar los libros, considerar el uso de una librería de gestión de estado como `React Query` (que ya está instalada) para manejar la carga, el cacheo y los estados de error de forma más robusta y declarativa.

2.  **Centralizar la Lógica de Versiones:**
    *   **Recomendación:** La lógica para obtener el texto de un versículo con su respectivo fallback a RV1960 está duplicada en `VersesScreen.tsx` y tiene una implementación diferente y compleja en `DatabaseService.ts`. Se debería crear una función de utilidad única en `VersionManager.ts` o un servicio similar que sea la única fuente de verdad para obtener el texto de un versículo, independientemente de la plataforma (web o nativa).

## 4. Conclusión

El proyecto `Tzotzil Bible` es robusto y cuenta con una arquitectura sólida, pero sufre de problemas puntuales críticos que están impidiendo su correcto funcionamiento y despliegue. El `TypeError` y el fallo en el sistema de versiones descargadas son los bloqueadores más inmediatos. La falta de registro de los plugins nativos es un error silencioso que se manifestaría con funcionalidades rotas en producción.

Siguiendo el plan de acción propuesto, es posible estabilizar la aplicación, corregir los errores y preparar el proyecto para una compilación exitosa en iOS y Android. Se recomienda encarecidamente aplicar las correcciones de las Fases 1 y 2 antes de intentar cualquier nuevo build.
