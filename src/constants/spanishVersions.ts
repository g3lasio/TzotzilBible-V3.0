/**
 * Spanish Bible Version Constants
 * 
 * Defines available Spanish Bible translations and their metadata.
 * Used for version picker UI and text retrieval logic.
 */

export type SpanishVersionKey = 'RV1960' | 'NVI' | 'TLA' | 'DHH';

export interface SpanishVersionInfo {
  key: SpanishVersionKey;
  name: string;
  fullName: string;
  description: string;
  coverage: number; // Percentage of verses available (0-100)
  fieldName: 'text_spanish_rv1960' | 'text_spanish_nvi' | 'text_spanish_tla' | 'text_spanish_dhh';
}

/**
 * Available Spanish Bible versions in display order
 * Order: RV1960 (most popular) → NVI → TLA → DHH
 */
export const SPANISH_VERSIONS: SpanishVersionInfo[] = [
  {
    key: 'RV1960',
    name: 'RV1960',
    fullName: 'Reina Valera 1960',
    description: 'Traducción tradicional, ampliamente reconocida',
    coverage: 100,
    fieldName: 'text_spanish_rv1960',
  },
  {
    key: 'NVI',
    name: 'NVI',
    fullName: 'Nueva Versión Internacional',
    description: 'Traducción moderna, fácil de entender',
    coverage: 99.94,
    fieldName: 'text_spanish_nvi',
  },
  {
    key: 'TLA',
    name: 'TLA',
    fullName: 'Traducción en Lenguaje Actual',
    description: 'Lenguaje contemporáneo, muy accesible',
    coverage: 92.08,
    fieldName: 'text_spanish_tla',
  },
  {
    key: 'DHH',
    name: 'DHH',
    fullName: 'Dios Habla Hoy',
    description: 'Popular en comunidades católicas',
    coverage: 79.91,
    fieldName: 'text_spanish_dhh',
  },
];

/**
 * Default Spanish version (RV1960 - 100% coverage)
 */
export const DEFAULT_SPANISH_VERSION: SpanishVersionKey = 'RV1960';

/**
 * Storage key for user's preferred Spanish version
 */
export const SPANISH_VERSION_STORAGE_KEY = 'preferred_spanish_version';

/**
 * Get version info by key
 */
export function getVersionInfo(key: SpanishVersionKey): SpanishVersionInfo {
  return SPANISH_VERSIONS.find(v => v.key === key) || SPANISH_VERSIONS[0];
}

/**
 * Get field name for a version key
 */
export function getVersionFieldName(key: SpanishVersionKey): string {
  return getVersionInfo(key).fieldName;
}
