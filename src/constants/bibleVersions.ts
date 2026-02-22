export type BibleVersion = {
  id: string;
  name: string;
  shortName: string;
  language: string;
  color: string;
  textField: 'text_tzotzil' | 'text_spanish_rv1960' | 'text_spanish_nvi' | 'text_spanish_tla' | 'text_spanish_dhh' | 'text_english_nkjv';
  isAvailable: boolean;
  isPrimary?: boolean;
  isSearchable?: boolean;
  coverage?: number;
  isBundled?: boolean;      // true = included in the app build
  isDownloadable?: boolean;  // true = available for on-demand download
  downloadSizeMB?: number;   // approximate download size in MB
};

export const TZOTZIL_VERSION: BibleVersion = {
  id: 'tzotzil',
  name: 'Tzotzil',
  shortName: 'TZO',
  language: 'tzotzil',
  color: '#00ff88',
  textField: 'text_tzotzil',
  isAvailable: true,
  isPrimary: true,
  isSearchable: true,
  isBundled: true,
  isDownloadable: false,
};

export const SECONDARY_VERSIONS: BibleVersion[] = [
  {
    id: 'rv1960',
    name: 'Reina-Valera 1960',
    shortName: 'RV1960',
    language: 'es',
    color: '#00f3ff',
    textField: 'text_spanish_rv1960',
    isAvailable: true,
    isSearchable: false,
    coverage: 100,
    isBundled: true,
    isDownloadable: false,
  },
  {
    id: 'nvi',
    name: 'Nueva Versión Internacional',
    shortName: 'NVI',
    language: 'es',
    color: '#9b59b6',
    textField: 'text_spanish_nvi',
    isAvailable: true,
    isSearchable: false,
    coverage: 100,
    isBundled: false,
    isDownloadable: true,
    downloadSizeMB: 5.2,
  },
  {
    id: 'tla',
    name: 'Traducción en Lenguaje Actual',
    shortName: 'TLA',
    language: 'es',
    color: '#1abc9c',
    textField: 'text_spanish_tla',
    isAvailable: true,
    isSearchable: false,
    coverage: 100,
    isBundled: false,
    isDownloadable: true,
    downloadSizeMB: 5.0,
  },
  {
    id: 'dhh',
    name: 'Dios Habla Hoy',
    shortName: 'DHH',
    language: 'es',
    color: '#e67e22',
    textField: 'text_spanish_dhh',
    isAvailable: true,
    isSearchable: false,
    coverage: 100,
    isBundled: false,
    isDownloadable: true,
    downloadSizeMB: 5.0,
  },
  {
    id: 'nkjv',
    name: 'New King James Version',
    shortName: 'NKJV',
    language: 'en',
    color: '#3498db',
    textField: 'text_english_nkjv',
    isAvailable: true,
    isSearchable: false,
    coverage: 100,
    isBundled: false,
    isDownloadable: true,
    downloadSizeMB: 4.8,
  },
];

export const BIBLE_VERSIONS: BibleVersion[] = [
  TZOTZIL_VERSION,
  ...SECONDARY_VERSIONS,
];

export const getVersionById = (id: string): BibleVersion | undefined => {
  return BIBLE_VERSIONS.find(v => v.id === id);
};

export const getActiveVersions = (activeIds: Set<string>): BibleVersion[] => {
  return BIBLE_VERSIONS.filter(v => activeIds.has(v.id));
};

export const getAvailableSecondaryVersions = (): BibleVersion[] => {
  return SECONDARY_VERSIONS.filter(v => v.isAvailable);
};

export const getSearchableVersions = (): BibleVersion[] => {
  return BIBLE_VERSIONS.filter(v => v.isSearchable);
};

export const getBundledVersions = (): BibleVersion[] => {
  return BIBLE_VERSIONS.filter(v => v.isBundled);
};

export const getDownloadableVersions = (): BibleVersion[] => {
  return SECONDARY_VERSIONS.filter(v => v.isDownloadable);
};
