import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Image } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { databaseService } from './src/services/DatabaseService';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, Quantico_400Regular, Quantico_700Bold } from '@expo-google-fonts/quantico';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00f3ff',
    secondary: '#00ff88',
    background: '#0a0e14',
    surface: '#0d1117',
    text: '#e6f3ff',
  },
};

type AppState = 'loading' | 'ready' | 'error';

export default function App() {
  const [appState, setAppState] = useState<AppState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [fontsLoaded] = useFonts({
    Quantico_400Regular,
    Quantico_700Bold,
  });

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (fontsLoaded && appState !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, appState]);

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

  if (appState === 'loading' || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0a0e14', '#1a2332']}
          style={styles.gradient}
        >
          <Image 
            source={require('./assets/icon.png')} 
            style={styles.appLogo}
            resizeMode="contain"
          />
          <Text style={styles.loadingTitle}>Tzotzil Bible</Text>
          <ActivityIndicator size="large" color="#00f3ff" style={styles.loader} />
          <Text style={styles.loadingText}>Cargando Biblia...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (appState === 'error') {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#0a0e14', '#1a2332']}
          style={styles.gradient}
        >
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Error de Inicialización</Text>
          <Text style={styles.errorMessage}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={initializeApp}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider theme={darkTheme}>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="light" />
        </NavigationContainer>
      </PaperProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  appLogo: {
    width: 100,
    height: 100,
  },
  loadingTitle: {
    fontSize: 28,
    fontFamily: 'Quantico_700Bold',
    color: '#00ff88',
    marginTop: 16,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  loader: {
    marginTop: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7c93',
  },
  errorContainer: {
    flex: 1,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginTop: 16,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6b7c93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#00f3ff',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#0a0e14',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
