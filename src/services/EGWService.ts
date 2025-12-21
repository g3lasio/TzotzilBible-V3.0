import { getBackendUrl } from '../config';

export interface EGWQuote {
  book: string;
  page: number;
  content: string;
  relevance: number;
}

export interface EGWSearchResult {
  success: boolean;
  quotes: EGWQuote[];
  error?: string;
}

export class EGWService {
  static async searchQuotes(query: string, maxResults: number = 3): Promise<EGWSearchResult> {
    try {
      const backendUrl = getBackendUrl();
      
      const response = await fetch(`${backendUrl}/api/egw/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, maxResults })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        return { success: false, quotes: [], error: data.error };
      }
      
      return { success: true, quotes: data.quotes || [] };
    } catch (error) {
      console.error('Error searching EGW:', error);
      return { success: false, quotes: [], error: 'Error de conexión' };
    }
  }
  
  static async getBookList(): Promise<string[]> {
    try {
      const backendUrl = getBackendUrl();
      const response = await fetch(`${backendUrl}/api/egw/books`);
      const data = await response.json();
      return data.books || [];
    } catch {
      return [];
    }
  }
}
