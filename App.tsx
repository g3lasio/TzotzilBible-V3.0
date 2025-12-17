import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, Button } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { databaseService } from './src/services/DatabaseService';

const queryClient = new QueryClient();

type AppState = 'loading' | 'ready' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    setAppState('loading');
    try {
      const dbInitialized = await databaseService.initDatabase();
      const status = databaseService.getStatus();
      
      if (!dbInitialized || status === 'failed' || status === 'pending') {
        const error = databaseService.getInitError();
        setErrorMessage(
          error?.message || 
          'No se pudo inicializar la base de datos. Por favor reinicia la aplicación.'
        );
        setAppState('error');
        return;
      }
      
      if (status === 'ready' || status === 'web_fallback') {
        setAppState('ready');
      } else {
        setErrorMessage('Estado de inicialización desconocido.');
        setAppState('error');
      }
    } catch (error) {
      console.error('Error initializing app:', error);
      setErrorMessage('Error inesperado al iniciar la aplicación.');
      setAppState('error');
    }
  };

  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Cargando Biblia...</Text>
      </View>
    );
  }

  if (appState === 'error') {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Error de Inicialización</Text>
        <Text style={styles.errorMessage}>{errorMessage}</Text>
        <Button mode="contained" onPress={initializeApp} style={styles.retryButton}>
          Reintentar
        </Button>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    minWidth: 150,
  },
});
