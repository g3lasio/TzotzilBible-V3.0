export type BibleVersion = {
  id: string;
  name: string;
  shortName: string;
  language: string;
  color: string;
  textField: 'text_tzotzil' | 'text';
};

export const BIBLE_VERSIONS: BibleVersion[] = [
  {
    id: 'tzotzil',
    name: 'Tzotzil',
    shortName: 'TZO',
    language: 'tzotzil',
    color: '#00ff88',
    textField: 'text_tzotzil',
  },
  {
    id: 'rv1960',
    name: 'Reina-Valera 1960',
    shortName: 'RV1960',
    language: 'es',
    color: '#00f3ff',
    textField: 'text',
  },
];

export const getVersionById = (id: string): BibleVersion | undefined => {
  return BIBLE_VERSIONS.find(v => v.id === id);
};

export const getActiveVersions = (activeIds: Set<string>): BibleVersion[] => {
  return BIBLE_VERSIONS.filter(v => activeIds.has(v.id));
};
