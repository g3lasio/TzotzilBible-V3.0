import { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { AuthService } from '../services/AuthService';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AuthService.ensureLocalUser();
      setUser(userData);
    } catch (err) {
      console.error('Error checking auth status:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setError(null);
      await AuthService.login();
      const userData = await AuthService.getCurrentUser();
      setUser(userData);
    } catch (err) {
      setError('Error al iniciar sesión');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
    } catch (err) {
      console.error('Error logging out:', err);
      throw err;
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    loading,
    error,
    login,
    logout,
  };
}
