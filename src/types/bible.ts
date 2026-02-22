
export interface Book {
  id: number;
  name: string;
  book_number: number;
  testament: string;
  chapters?: number;
}

export interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  verses_count: number;
}

export interface BibleVerse {
  id: number;
  book_id: number;
  chapter: number;
  verse: number;
  text: string; // Current selected Spanish version text
  text_tzotzil?: string;
  book_name?: string;
  // Bundled versions
  text_spanish_rv1960?: string;
  // Downloadable Spanish versions
  text_spanish_nvi?: string;
  text_spanish_tla?: string;
  text_spanish_dhh?: string;
  text_spanish_lbla?: string;
  text_spanish_nbla?: string;
  text_spanish_ntv?: string;
  text_spanish_rva2015?: string;
  text_spanish_rvc?: string;
  text_spanish_tlai?: string;
  text_spanish_vbl?: string;
  text_spanish_bes?: string;
  text_spanish_pddpt?: string;
  // Downloadable English versions
  text_english_nkjv?: string;
  // Allow dynamic version fields
  [key: string]: any;
}

export interface SearchResult {
  verses: BibleVerse[];
  total: number;
  query: string;
}
