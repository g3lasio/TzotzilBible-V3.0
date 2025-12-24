const BOOK_ALIASES: { [key: string]: string } = {
  'génesis': 'Génesis', 'genesis': 'Génesis', 'gén': 'Génesis', 'gen': 'Génesis',
  'éxodo': 'Éxodo', 'exodo': 'Éxodo', 'éx': 'Éxodo', 'ex': 'Éxodo',
  'levítico': 'Levítico', 'levitico': 'Levítico', 'lev': 'Levítico',
  'números': 'Números', 'numeros': 'Números', 'núm': 'Números', 'num': 'Números',
  'deuteronomio': 'Deuteronomio', 'deut': 'Deuteronomio', 'dt': 'Deuteronomio',
  'josué': 'Josué', 'josue': 'Josué', 'jos': 'Josué',
  'jueces': 'Jueces', 'jue': 'Jueces',
  'rut': 'Rut',
  '1 samuel': '1 Samuel', '1samuel': '1 Samuel', '1 sam': '1 Samuel', '1sam': '1 Samuel',
  '2 samuel': '2 Samuel', '2samuel': '2 Samuel', '2 sam': '2 Samuel', '2sam': '2 Samuel',
  '1 reyes': '1 Reyes', '1reyes': '1 Reyes', '1 rey': '1 Reyes',
  '2 reyes': '2 Reyes', '2reyes': '2 Reyes', '2 rey': '2 Reyes',
  '1 crónicas': '1 Crónicas', '1 cronicas': '1 Crónicas', '1 crón': '1 Crónicas',
  '2 crónicas': '2 Crónicas', '2 cronicas': '2 Crónicas', '2 crón': '2 Crónicas',
  'esdras': 'Esdras', 'esd': 'Esdras',
  'nehemías': 'Nehemías', 'nehemias': 'Nehemías', 'neh': 'Nehemías',
  'ester': 'Ester', 'est': 'Ester',
  'job': 'Job',
  'salmos': 'Salmos', 'salmo': 'Salmos', 'sal': 'Salmos', 'sl': 'Salmos',
  'proverbios': 'Proverbios', 'prov': 'Proverbios', 'pr': 'Proverbios',
  'eclesiastés': 'Eclesiastés', 'eclesiastes': 'Eclesiastés', 'ecl': 'Eclesiastés', 'ec': 'Eclesiastés',
  'cantares': 'Cantares', 'cantar': 'Cantares', 'cnt': 'Cantares', 'cantar de los cantares': 'Cantares',
  'isaías': 'Isaías', 'isaias': 'Isaías', 'is': 'Isaías', 'isa': 'Isaías',
  'jeremías': 'Jeremías', 'jeremias': 'Jeremías', 'jer': 'Jeremías',
  'lamentaciones': 'Lamentaciones', 'lam': 'Lamentaciones',
  'ezequiel': 'Ezequiel', 'ez': 'Ezequiel', 'eze': 'Ezequiel',
  'daniel': 'Daniel', 'dan': 'Daniel', 'dn': 'Daniel',
  'oseas': 'Oseas', 'os': 'Oseas',
  'joel': 'Joel', 'jl': 'Joel',
  'amós': 'Amós', 'amos': 'Amós', 'am': 'Amós',
  'abdías': 'Abdías', 'abdias': 'Abdías', 'abd': 'Abdías',
  'jonás': 'Jonás', 'jonas': 'Jonás', 'jon': 'Jonás',
  'miqueas': 'Miqueas', 'miq': 'Miqueas', 'mi': 'Miqueas',
  'nahúm': 'Nahúm', 'nahum': 'Nahúm', 'nah': 'Nahúm',
  'habacuc': 'Habacuc', 'hab': 'Habacuc',
  'sofonías': 'Sofonías', 'sofonias': 'Sofonías', 'sof': 'Sofonías',
  'hageo': 'Hageo', 'hag': 'Hageo',
  'zacarías': 'Zacarías', 'zacarias': 'Zacarías', 'zac': 'Zacarías',
  'malaquías': 'Malaquías', 'malaquias': 'Malaquías', 'mal': 'Malaquías',
  'mateo': 'Mateo', 'mat': 'Mateo', 'mt': 'Mateo',
  'marcos': 'Marcos', 'mar': 'Marcos', 'mr': 'Marcos', 'mc': 'Marcos',
  'lucas': 'Lucas', 'luc': 'Lucas', 'lc': 'Lucas',
  'juan': 'Juan', 'jn': 'Juan',
  'hechos': 'Hechos', 'hch': 'Hechos', 'hec': 'Hechos',
  'romanos': 'Romanos', 'rom': 'Romanos', 'ro': 'Romanos',
  '1 corintios': '1 Corintios', '1corintios': '1 Corintios', '1 cor': '1 Corintios', '1cor': '1 Corintios',
  '2 corintios': '2 Corintios', '2corintios': '2 Corintios', '2 cor': '2 Corintios', '2cor': '2 Corintios',
  'gálatas': 'Gálatas', 'galatas': 'Gálatas', 'gál': 'Gálatas', 'gal': 'Gálatas',
  'efesios': 'Efesios', 'efe': 'Efesios', 'ef': 'Efesios',
  'filipenses': 'Filipenses', 'fil': 'Filipenses', 'flp': 'Filipenses',
  'colosenses': 'Colosenses', 'col': 'Colosenses',
  '1 tesalonicenses': '1 Tesalonicenses', '1tesalonicenses': '1 Tesalonicenses', '1 tes': '1 Tesalonicenses',
  '2 tesalonicenses': '2 Tesalonicenses', '2tesalonicenses': '2 Tesalonicenses', '2 tes': '2 Tesalonicenses',
  '1 timoteo': '1 Timoteo', '1timoteo': '1 Timoteo', '1 tim': '1 Timoteo',
  '2 timoteo': '2 Timoteo', '2timoteo': '2 Timoteo', '2 tim': '2 Timoteo',
  'tito': 'Tito', 'tit': 'Tito',
  'filemón': 'Filemón', 'filemon': 'Filemón', 'flm': 'Filemón',
  'hebreos': 'Hebreos', 'heb': 'Hebreos',
  'santiago': 'Santiago', 'stg': 'Santiago', 'stgo': 'Santiago',
  '1 pedro': '1 Pedro', '1pedro': '1 Pedro', '1 ped': '1 Pedro', '1 pe': '1 Pedro',
  '2 pedro': '2 Pedro', '2pedro': '2 Pedro', '2 ped': '2 Pedro', '2 pe': '2 Pedro',
  '1 juan': '1 Juan', '1juan': '1 Juan', '1 jn': '1 Juan',
  '2 juan': '2 Juan', '2juan': '2 Juan', '2 jn': '2 Juan',
  '3 juan': '3 Juan', '3juan': '3 Juan', '3 jn': '3 Juan',
  'judas': 'Judas', 'jud': 'Judas',
  'apocalipsis': 'Apocalipsis', 'apoc': 'Apocalipsis', 'ap': 'Apocalipsis', 'apo': 'Apocalipsis',
};

export interface BibleReference {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  originalText: string;
  startIndex: number;
  endIndex: number;
}

export interface TextSegment {
  type: 'text' | 'reference';
  content: string;
  reference?: BibleReference;
}

function normalizeBook(bookName: string): string | null {
  const normalized = bookName.toLowerCase().trim();
  return BOOK_ALIASES[normalized] || null;
}

export function parseBibleReferences(text: string): BibleReference[] {
  const references: BibleReference[] = [];
  
  const bookNames = Object.keys(BOOK_ALIASES).sort((a, b) => b.length - a.length);
  const bookPattern = bookNames.map(b => b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  
  const regex = new RegExp(
    `(${bookPattern})\\s*(\\d{1,3})\\s*:\\s*(\\d{1,3})(?:\\s*-\\s*(\\d{1,3}))?`,
    'gi'
  );
  
  let match;
  while ((match = regex.exec(text)) !== null) {
    const bookName = normalizeBook(match[1]);
    if (bookName) {
      references.push({
        book: bookName,
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10),
        verseEnd: match[4] ? parseInt(match[4], 10) : undefined,
        originalText: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
    }
  }
  
  return references.sort((a, b) => a.startIndex - b.startIndex);
}

export function segmentText(text: string): TextSegment[] {
  const references = parseBibleReferences(text);
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  
  for (const ref of references) {
    if (ref.startIndex > lastIndex) {
      segments.push({
        type: 'text',
        content: text.slice(lastIndex, ref.startIndex),
      });
    }
    
    segments.push({
      type: 'reference',
      content: ref.originalText,
      reference: ref,
    });
    
    lastIndex = ref.endIndex;
  }
  
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      content: text.slice(lastIndex),
    });
  }
  
  return segments;
}
