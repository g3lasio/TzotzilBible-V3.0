export type BibleVersion = {
  id: string;
  name: string;
  shortName: string;
  language: string;
  color: string;
  textField: 'text_tzotzil' | 'text';
  isAvailable: boolean;
  isPrimary?: boolean;
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
};

export const SECONDARY_VERSIONS: BibleVersion[] = [
  {
    id: 'rv1960',
    name: 'Reina-Valera 1960',
    shortName: 'RV1960',
    language: 'es',
    color: '#00f3ff',
    textField: 'text',
    isAvailable: true,
  },
  {
    id: 'nvi',
    name: 'Nueva Versión Internacional',
    shortName: 'NVI',
    language: 'es',
    color: '#9b59b6',
    textField: 'text',
    isAvailable: false,
  },
  {
    id: 'lbla',
    name: 'La Biblia de las Américas',
    shortName: 'LBLA',
    language: 'es',
    color: '#e67e22',
    textField: 'text',
    isAvailable: false,
  },
  {
    id: 'ntv',
    name: 'Nueva Traducción Viviente',
    shortName: 'NTV',
    language: 'es',
    color: '#1abc9c',
    textField: 'text',
    isAvailable: false,
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
