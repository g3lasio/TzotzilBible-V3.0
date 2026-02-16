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
  name: string;
  testament: 'OT' | 'NT';
  startYear: number | null;
  endYear: number | null;
  eventCount: number;
  events: TimelineEvent[];
}

export interface TimelineMetadata {
  title: string;
  version: string;
  description: string;
  totalEvents: number;
  timeSpan: string;
  sources: string[];
  created: string;
  language: string;
}

export interface TimelineData {
  metadata: TimelineMetadata;
  events: TimelineEvent[];
}

export interface FilterOptions {
  testament?: 'OT' | 'NT' | 'ALL';
  era?: string;
  category?: string;
  person?: string;
  location?: string;
  searchQuery?: string;
}
