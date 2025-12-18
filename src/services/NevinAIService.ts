import { AIResponse, ChatMessage } from '../types/nevin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NEVIN_SYSTEM_PROMPT, VERSE_COMMENTARY_PROMPT } from '../constants/nevinTheology';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export interface VerseCommentaryRequest {
  book: string;
  chapter: number;
  verse: number;
  textTzotzil?: string;
  textSpanish?: string;
}

export interface VerseCommentary {
  success: boolean;
  commentary?: string;
  error?: string;
}

export class NevinAIService {
  private static readonly CHAT_HISTORY_KEY = 'nevin_chat_history';
  private static readonly API_KEY_STORAGE = 'anthropic_api_key';

  static async setApiKey(apiKey: string): Promise<void> {
    await AsyncStorage.setItem(this.API_KEY_STORAGE, apiKey);
  }

  static async getApiKey(): Promise<string | null> {
    const storedKey = await AsyncStorage.getItem(this.API_KEY_STORAGE);
    if (storedKey) return storedKey;
    
    const envKey = process.env.ANTHROPIC_API_KEY || 
                   Constants.expoConfig?.extra?.anthropicApiKey;
    return envKey || null;
  }

  static async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key;
  }

  static async processQuery(
    message: string,
    context: string = '',
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    try {
      const apiKey = await this.getApiKey();

      if (!apiKey) {
        return {
          success: false,
          error: 'Se necesita una clave API de Anthropic para usar Nevin AI. Por favor configúrala en ajustes.',
          emotions: {}
        };
      }

      const messages = [
        ...chatHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: context ? `Contexto: ${context}\n\nPregunta: ${message}` : message
        }
      ];

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: 4096,
          system: NEVIN_SYSTEM_PROMPT,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Anthropic API error:', errorData);
        
        if (response.status === 401) {
          return {
            success: false,
            error: 'Clave API inválida. Por favor verifica tu configuración.',
            emotions: {}
          };
        }
        
        return {
          success: false,
          error: 'Error al comunicarse con el servicio de IA. Intenta nuevamente.',
          emotions: {}
        };
      }

      const data = await response.json();
      const assistantMessage = data.content?.[0]?.text || '';

      return {
        success: true,
        response: assistantMessage,
        emotions: {},
        metadata: {
          system_version: "Nevin AI v4.0 Teológico",
          powered_by: "Claude Sonnet 4"
        }
      };
    } catch (error) {
      console.error('Error en NevinAIService.processQuery:', error);
      return {
        success: false,
        error: 'Hubo un error procesando tu mensaje. Verifica tu conexión a internet.',
        emotions: {}
      };
    }
  }

  static async getVerseCommentary(request: VerseCommentaryRequest): Promise<VerseCommentary> {
    try {
      const apiKey = await this.getApiKey();

      if (!apiKey) {
        return {
          success: false,
          error: 'Se necesita una clave API de Anthropic para obtener comentarios de Nevin.'
        };
      }

      const verseReference = `${request.book} ${request.chapter}:${request.verse}`;
      
      let verseContent = '';
      if (request.textTzotzil) {
        verseContent += `\n\n**Tzotzil:** "${request.textTzotzil}"`;
      }
      if (request.textSpanish) {
        verseContent += `\n\n**RV1960:** "${request.textSpanish}"`;
      }

      const userMessage = `${VERSE_COMMENTARY_PROMPT}

VERSÍCULO A ANALIZAR: ${verseReference}
${verseContent}

Por favor, proporciona un comentario teológico completo siguiendo la metodología hermenéutica adventista.`;

      const response = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          max_tokens: 6000,
          system: NEVIN_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Anthropic API error for verse commentary:', errorData);
        
        return {
          success: false,
          error: 'Error al obtener el comentario. Intenta nuevamente.'
        };
      }

      const data = await response.json();
      const commentary = data.content?.[0]?.text || '';

      return {
        success: true,
        commentary
      };
    } catch (error) {
      console.error('Error en getVerseCommentary:', error);
      return {
        success: false,
        error: 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      };
    }
  }

  static async askAboutVerse(
    book: string,
    chapter: number,
    verse: number,
    question: string,
    textTzotzil?: string,
    textSpanish?: string
  ): Promise<AIResponse> {
    const verseReference = `${book} ${chapter}:${verse}`;
    
    let context = `Estamos estudiando ${verseReference}.`;
    if (textTzotzil) {
      context += `\n\nTexto en Tzotzil: "${textTzotzil}"`;
    }
    if (textSpanish) {
      context += `\n\nTexto en RV1960: "${textSpanish}"`;
    }

    return this.processQuery(question, context, []);
  }

  static async loadChatHistory(): Promise<ChatMessage[]> {
    try {
      const history = await AsyncStorage.getItem(this.CHAT_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error cargando historial:', error);
      return [];
    }
  }

  static async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error guardando historial:', error);
    }
  }

  static async clearChatHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Error limpiando historial:', error);
    }
  }

  static async getChatHistory(): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    try {
      const history = await AsyncStorage.getItem(this.CHAT_HISTORY_KEY);
      if (!history) return [];
      const messages: ChatMessage[] = JSON.parse(history);
      return messages.map(msg => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  static async sendMessage(message: string): Promise<string> {
    const history = await this.loadChatHistory();
    
    const result = await this.processQuery(message, '', history);
    
    if (!result.success) {
      throw new Error(result.error || 'Error procesando mensaje');
    }

    const newHistory: ChatMessage[] = [
      ...history,
      {
        id: Date.now().toString(),
        content: message,
        type: 'user',
        timestamp: new Date()
      },
      {
        id: (Date.now() + 1).toString(),
        content: result.response || '',
        type: 'assistant',
        timestamp: new Date()
      }
    ];

    await this.saveChatHistory(newHistory);
    
    return result.response || '';
  }
}
