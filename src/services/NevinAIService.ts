import { AIResponse, ChatMessage } from '../types/nevin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { NEVIN_SYSTEM_PROMPT, VERSE_COMMENTARY_PROMPT } from '../constants/nevinTheology';
import { getBackendUrl } from '../config';

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

  static async hasApiKey(): Promise<boolean> {
    return true;
  }

  static async processQuery(
    message: string,
    context: string = '',
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    try {
      const backendUrl = getBackendUrl();
      console.log('[NevinAI] Backend URL:', backendUrl);
      console.log('[NevinAI] Calling:', `${backendUrl}/api/nevin/chat`);

      const history = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      const response = await fetch(`${backendUrl}/api/nevin/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          context,
          history
        })
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Error al comunicarse con Nevin',
          emotions: {}
        };
      }

      return {
        success: true,
        response: data.response,
        emotions: {},
        metadata: {
          system_version: "Nevin AI v4.0 Teológico",
          powered_by: "Claude Sonnet 4"
        }
      };
    } catch (error: any) {
      console.error('[NevinAI] Error completo:', error);
      console.error('[NevinAI] Error message:', error?.message);
      console.error('[NevinAI] Error name:', error?.name);
      
      const isNetworkError = error?.message?.includes('fetch') || 
                             error?.message?.includes('network') ||
                             error?.message?.includes('Network') ||
                             error?.name === 'TypeError';
      
      const errorMessage = isNetworkError 
        ? '📶 Sin conexión a internet\n\nNevin necesita internet para funcionar. Por favor, verifica tu conexión e intenta de nuevo.\n\n💡 Mientras tanto, puedes leer la Biblia offline.'
        : `Error: ${error?.message || 'No se pudo conectar con Nevin.'}`;
      
      return {
        success: false,
        error: errorMessage,
        emotions: {}
      };
    }
  }

  static async getVerseCommentary(request: VerseCommentaryRequest): Promise<VerseCommentary> {
    try {
      const backendUrl = getBackendUrl();

      const response = await fetch(`${backendUrl}/api/nevin/verse-commentary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          book: request.book,
          chapter: request.chapter,
          verse: request.verse,
          textTzotzil: request.textTzotzil,
          textSpanish: request.textSpanish
        })
      });

      const data = await response.json();

      if (!data.success) {
        return {
          success: false,
          error: data.error || 'Error al obtener comentario'
        };
      }

      return {
        success: true,
        commentary: data.commentary
      };
    } catch (error: any) {
      console.error('Error en getVerseCommentary:', error);
      return {
        success: false,
        error: '📶 Sin conexión. Nevin necesita internet para generar comentarios.'
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
