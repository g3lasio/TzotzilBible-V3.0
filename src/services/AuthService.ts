import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/auth';

export class AuthService {
  private static readonly USER_KEY = 'app_user';

  static async login(): Promise<boolean> {
    const user: User = {
      id: 1,
      username: 'Usuario',
      email: '',
      isActive: true,
      nevinAccess: true,
      lastLogin: new Date().toISOString()
    };
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    return true;
  }

  static async logout(): Promise<void> {
    await AsyncStorage.removeItem(this.USER_KEY);
  }

  static async getCurrentUser(): Promise<User | null> {
    try {
      const userStr = await AsyncStorage.getItem(this.USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return !!user;
  }

  static async ensureLocalUser(): Promise<User> {
    let user = await this.getCurrentUser();
    if (!user) {
      await this.login();
      user = await this.getCurrentUser();
    }
    return user!;
  }
}
