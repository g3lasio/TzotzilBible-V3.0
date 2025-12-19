import AsyncStorage from '@react-native-async-storage/async-storage';
import { Moment, MomentPreview, ChatMessage } from '../types/nevin';
import { getBackendUrl } from '../config';

const MOMENTS_STORAGE_KEY = 'nevin_moments';
const ACTIVE_MOMENT_KEY = 'nevin_active_moment';

export class MomentsService {
  static async getAllMoments(): Promise<MomentPreview[]> {
    try {
      const data = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
      if (!data) return [];
      
      const moments: Moment[] = JSON.parse(data);
      return moments
        .map(m => ({
          id: m.id,
          title: m.title,
          summary: m.summary,
          themes: m.themes,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
          messageCount: m.messages.length
        }))
        .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    } catch (error) {
      console.error('Error loading moments:', error);
      return [];
    }
  }

  static async getMoment(id: string): Promise<Moment | null> {
    try {
      const data = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
      if (!data) return null;
      
      const moments: Moment[] = JSON.parse(data);
      const moment = moments.find(m => m.id === id);
      
      if (moment) {
        return {
          ...moment,
          createdAt: new Date(moment.createdAt),
          updatedAt: new Date(moment.updatedAt),
          messages: moment.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        };
      }
      return null;
    } catch (error) {
      console.error('Error loading moment:', error);
      return null;
    }
  }

  static async createMoment(): Promise<Moment> {
    const newMoment: Moment = {
      id: Date.now().toString(),
      title: 'Nueva reflexión',
      themes: [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.saveMoment(newMoment);
    await this.setActiveMoment(newMoment.id);
    return newMoment;
  }

  static async saveMoment(moment: Moment): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
      let moments: Moment[] = data ? JSON.parse(data) : [];
      
      const existingIndex = moments.findIndex(m => m.id === moment.id);
      if (existingIndex >= 0) {
        moments[existingIndex] = moment;
      } else {
        moments.push(moment);
      }

      await AsyncStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(moments));
    } catch (error) {
      console.error('Error saving moment:', error);
    }
  }

  static async deleteMoment(id: string): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(MOMENTS_STORAGE_KEY);
      if (!data) return;
      
      let moments: Moment[] = JSON.parse(data);
      moments = moments.filter(m => m.id !== id);
      
      await AsyncStorage.setItem(MOMENTS_STORAGE_KEY, JSON.stringify(moments));

      const activeId = await this.getActiveMomentId();
      if (activeId === id) {
        await AsyncStorage.removeItem(ACTIVE_MOMENT_KEY);
      }
    } catch (error) {
      console.error('Error deleting moment:', error);
    }
  }

  static async addMessageToMoment(
    momentId: string,
    userMessage: ChatMessage,
    assistantMessage: ChatMessage
  ): Promise<void> {
    const moment = await this.getMoment(momentId);
    if (!moment) return;

    moment.messages.push(userMessage, assistantMessage);
    moment.updatedAt = new Date();

    if (moment.messages.length === 2) {
      const titleResult = await this.generateSemanticTitle(moment.messages);
      if (titleResult.title) {
        moment.title = titleResult.title;
      }
      if (titleResult.themes) {
        moment.themes = titleResult.themes;
      }
      if (titleResult.summary) {
        moment.summary = titleResult.summary;
      }
    } else if (moment.messages.length % 6 === 0) {
      const titleResult = await this.generateSemanticTitle(moment.messages);
      if (titleResult.themes) {
        moment.themes = titleResult.themes;
      }
    }

    await this.saveMoment(moment);
  }

  static async generateSemanticTitle(messages: ChatMessage[]): Promise<{
    title?: string;
    themes?: string[];
    summary?: string;
  }> {
    try {
      const backendUrl = getBackendUrl();
      
      const conversationText = messages
        .slice(0, 10)
        .map(m => `${m.type === 'user' ? 'Usuario' : 'Nevin'}: ${m.content}`)
        .join('\n');

      const response = await fetch(`${backendUrl}/api/nevin/generate-moment-title`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversation: conversationText })
      });

      if (!response.ok) {
        return { title: 'Reflexión bíblica' };
      }

      const data = await response.json();
      return {
        title: data.title || 'Reflexión bíblica',
        themes: data.themes || [],
        summary: data.summary
      };
    } catch (error) {
      console.error('Error generating title:', error);
      return { title: 'Reflexión bíblica' };
    }
  }

  static async setActiveMoment(id: string | null): Promise<void> {
    try {
      if (id) {
        await AsyncStorage.setItem(ACTIVE_MOMENT_KEY, id);
      } else {
        await AsyncStorage.removeItem(ACTIVE_MOMENT_KEY);
      }
    } catch (error) {
      console.error('Error setting active moment:', error);
    }
  }

  static async getActiveMomentId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(ACTIVE_MOMENT_KEY);
    } catch (error) {
      console.error('Error getting active moment:', error);
      return null;
    }
  }

  static async getActiveMoment(): Promise<Moment | null> {
    const id = await this.getActiveMomentId();
    if (!id) return null;
    return this.getMoment(id);
  }

  static async migrateOldHistory(): Promise<void> {
    try {
      const oldHistory = await AsyncStorage.getItem('nevin_chat_history');
      if (!oldHistory) return;

      const messages: any[] = JSON.parse(oldHistory);
      if (messages.length === 0) return;

      const existingMoments = await this.getAllMoments();
      if (existingMoments.length > 0) return;

      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id || Date.now().toString(),
        content: msg.content,
        type: msg.type || (msg.role === 'user' ? 'user' : 'assistant'),
        timestamp: new Date(msg.timestamp || Date.now())
      }));

      const migrated: Moment = {
        id: 'migrated_' + Date.now(),
        title: 'Conversaciones anteriores',
        themes: ['histórico'],
        messages: chatMessages,
        createdAt: new Date(chatMessages[0]?.timestamp || Date.now()),
        updatedAt: new Date()
      };

      await this.saveMoment(migrated);

      const titleResult = await this.generateSemanticTitle(chatMessages.slice(0, 10));
      if (titleResult.title) {
        migrated.title = titleResult.title;
        migrated.themes = titleResult.themes || [];
        migrated.summary = titleResult.summary;
        await this.saveMoment(migrated);
      }

      console.log('Successfully migrated old chat history to moments');
    } catch (error) {
      console.error('Error migrating old history:', error);
    }
  }
}
