import AsyncStorage from '@react-native-async-storage/async-storage';
import { AIResponse, ChatMessage } from '../types/nevin';
import { api } from './api';

class NevinServiceClass {
  private static readonly CHAT_HISTORY_KEY = 'nevin_chat_history';

  private detectEmotion(text: string): Record<string, number> {
    const emotionPatterns: Record<string, string[]> = {
      tristeza: ['triste', 'deprimido', 'solo', 'dolor', 'pena', 'angustia', 'desesperado'],
      desmotivacion: ['cansado', 'sin ganas', 'difícil', 'no puedo', 'rendirme', 'fracaso'],
      busqueda_motivacion: ['ayuda', 'necesito fuerza', 'animo', 'esperanza', 'consejo'],
      preocupacion: ['preocupado', 'ansioso', 'miedo', 'inquieto', 'nervioso']
    };

    const textLower = text.toLowerCase();
    const emotions: Record<string, number> = {};

    Object.entries(emotionPatterns).forEach(([emotion, keywords]) => {
      const score = keywords.reduce((count, keyword) =>
        textLower.includes(keyword) ? count + 1 : count, 0);
      emotions[emotion] = score > 0 ? score / keywords.length : 0;
    });

    return emotions;
  }

  async getToken(): Promise<string | null> {
    return await AsyncStorage.getItem('user_token');
  }

  async getResponse(
    message: string,
    chatHistory: ChatMessage[] = []
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const token = await this.getToken();

      if (!token) {
        return {
          success: false,
          error: 'No se encontró el token de autenticación'
        };
      }

      const response = await api.post('/api/nevin/chat/revolutionary', {
        question: message,
        context: '',
        language: 'Spanish',
        extended_thinking: true,
        chat_history: chatHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        message: response.data.response
      };

    } catch (error) {
      console.error('Error en NevinService.getResponse:', error);
      return {
        success: false,
        error: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.'
      };
    }
  }

  async sendMessage(
    message: string,
    chatHistory: ChatMessage[] = []
  ): Promise<AIResponse> {
    try {
      const token = await this.getToken();

      if (!token) {
        return {
          success: false,
          error: 'No se encontró el token de autenticación',
          emotions: {}
        };
      }

      const response = await api.post('/api/nevin/chat/revolutionary', {
        question: message,
        context: '',
        language: 'Spanish',
        extended_thinking: true,
        chat_history: chatHistory.map(msg => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        response: response.data.response,
        emotions: response.data.emotions || {}
      };

    } catch (error) {
      console.error('Error en NevinService.sendMessage:', error);
      return {
        success: false,
        error: 'Lo siento, hubo un error procesando tu mensaje. Por favor, intenta nuevamente.',
        emotions: {}
      };
    }
  }

  async loadChatHistory(): Promise<ChatMessage[]> {
    try {
      const history = await AsyncStorage.getItem(NevinServiceClass.CHAT_HISTORY_KEY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error cargando historial del chat:', error);
      return [];
    }
  }

  async saveChatHistory(messages: ChatMessage[]): Promise<void> {
    try {
      await AsyncStorage.setItem(NevinServiceClass.CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error guardando historial del chat:', error);
    }
  }

  async clearChatHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(NevinServiceClass.CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Error limpiando historial del chat:', error);
    }
  }
}

export const NevinService = new NevinServiceClass();
export const nevinService = NevinService;
export default NevinService;
