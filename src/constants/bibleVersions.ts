export type BibleVersion = {
  id: string;
  name: string;
  shortName: string;
  language: string;
  color: string;
  textField: string;
  isAvailable: boolean;
  isPrimary?: boolean;
  isSearchable?: boolean;
  coverage?: number;
  isBundled?: boolean;
  isDownloadable?: boolean;
  downloadSizeMB?: number;
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
  // === BUNDLED ===
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

  // === DOWNLOADABLE SPANISH ===
  {
    id: 'nvi',
    name: 'Nueva Versión Internacional',
    shortName: 'NVI',
    language: 'es',
    color: '#9b59b6',
    textField: 'text_spanish_nvi',
    isAvailable: true,
    isSearchable: false,
    coverage: 99.9,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.2,
  },
  {
    id: 'lbla',
    name: 'La Biblia de las Américas',
    shortName: 'LBLA',
    language: 'es',
    color: '#8e44ad',
    textField: 'text_spanish_lbla',
    isAvailable: true,
    isSearchable: false,
    coverage: 92.1,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.0,
  },
  {
    id: 'nbla',
    name: 'Nueva Biblia de las Américas',
    shortName: 'NBLA',
    language: 'es',
    color: '#6c3483',
    textField: 'text_spanish_nbla',
    isAvailable: true,
    isSearchable: false,
    coverage: 92.1,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.0,
  },
  {
    id: 'ntv',
    name: 'Nueva Traducción Viviente',
    shortName: 'NTV',
    language: 'es',
    color: '#2ecc71',
    textField: 'text_spanish_ntv',
    isAvailable: true,
    isSearchable: false,
    coverage: 96.3,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.4,
  },
  {
    id: 'rva2015',
    name: 'Reina Valera Actualizada 2015',
    shortName: 'RVA2015',
    language: 'es',
    color: '#27ae60',
    textField: 'text_spanish_rva2015',
    isAvailable: true,
    isSearchable: false,
    coverage: 100.0,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.2,
  },
  {
    id: 'rvc',
    name: 'Reina Valera Contemporánea',
    shortName: 'RVC',
    language: 'es',
    color: '#16a085',
    textField: 'text_spanish_rvc',
    isAvailable: true,
    isSearchable: false,
    coverage: 87.8,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 5.8,
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
    coverage: 92.1,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 8.0,
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
    coverage: 79.9,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 5.7,
  },
  {
    id: 'tlai',
    name: 'Traducción Lenguaje Actual Interconfesional',
    shortName: 'TLAI',
    language: 'es',
    color: '#f39c12',
    textField: 'text_spanish_tlai',
    isAvailable: true,
    isSearchable: false,
    coverage: 100.0,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 8.3,
  },
  {
    id: 'vbl',
    name: 'Versión Biblia Libre',
    shortName: 'VBL',
    language: 'es',
    color: '#d35400',
    textField: 'text_spanish_vbl',
    isAvailable: true,
    isSearchable: false,
    coverage: 89.2,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.1,
  },
  {
    id: 'bes',
    name: 'Biblia en Español Sencillo',
    shortName: 'BES',
    language: 'es',
    color: '#e74c3c',
    textField: 'text_spanish_bes',
    isAvailable: true,
    isSearchable: false,
    coverage: 99.8,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 6.4,
  },
  {
    id: 'pddpt',
    name: 'Palabra de Dios para Todos',
    shortName: 'PDDPT',
    language: 'es',
    color: '#c0392b',
    textField: 'text_spanish_pddpt',
    isAvailable: true,
    isSearchable: false,
    coverage: 81.5,
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 5.5,
  },

  // === DOWNLOADABLE ENGLISH ===
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
    isBundled: true,
    isDownloadable: false,
    downloadSizeMB: 5.8,
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
