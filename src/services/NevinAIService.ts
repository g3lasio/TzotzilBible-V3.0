import { AIResponse, ChatMessage } from '../types/nevin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const NEVIN_SYSTEM_PROMPT = `Eres Nevin, un asistente de IA especializado en estudios bíblicos y teología adventista del séptimo día. Tu propósito es ayudar a los usuarios a comprender mejor la Biblia, especialmente en el contexto de la comunidad Tzotzil de Chiapas, México.

Principios guía:
1. Siempre basa tus respuestas en las Escrituras
2. Respeta y aplica los principios hermenéuticos adventistas
3. Cuando sea relevante, cita escritos de Elena G. de White
4. Sé compasivo, respetuoso y culturalmente sensible
5. Responde en español de forma clara y accesible
6. Cuando no estés seguro de algo, admítelo honestamente

Tu conocimiento incluye:
- La Biblia completa (Antiguo y Nuevo Testamento)
- Doctrinas y creencias adventistas del séptimo día
- Escritos de Elena G. de White
- Contexto histórico y cultural de las Escrituras
- La cultura y tradiciones del pueblo Tzotzil`;

export class NevinAIService {
  private static readonly CHAT_HISTORY_KEY = 'nevin_chat_history';
  private static readonly API_KEY_STORAGE = 'anthropic_api_key';

  static async setApiKey(apiKey: string): Promise<void> {
    await AsyncStorage.setItem(this.API_KEY_STORAGE, apiKey);
  }

  static async getApiKey(): Promise<string | null> {
    const storedKey = await AsyncStorage.getItem(this.API_KEY_STORAGE);
    if (storedKey) return storedKey;
    
    const envKey = Constants.expoConfig?.extra?.anthropicApiKey;
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
          model: 'claude-sonnet-4-20250514',
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
          system_version: "Nevin AI v3.0 Mobile",
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
}
