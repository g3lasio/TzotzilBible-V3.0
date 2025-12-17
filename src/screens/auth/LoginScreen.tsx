import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text, Surface, Button } from 'react-native-paper';
import { AuthService } from '../../services/AuthService';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function LoginScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    autoLogin();
  }, []);

  const autoLogin = async () => {
    await AuthService.ensureLocalUser();
    navigation.replace('Home');
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.surface}>
        <Text variant="headlineMedium" style={styles.title}>Biblia Tzotzil</Text>
        <Text style={styles.subtitle}>Cargando...</Text>
        <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
        <Button mode="contained" onPress={autoLogin} style={styles.button}>
          Entrar
        </Button>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    padding: 16,
  },
  surface: {
    padding: 20,
    borderRadius: 8,
    elevation: 4,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 24,
  },
  button: {
    minWidth: 150,
  },
});
