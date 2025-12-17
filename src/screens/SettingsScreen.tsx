import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { List, Switch, Button, Divider, Title, Text, IconButton, Portal, Modal, Card } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NevinAIService } from '../services/NevinAIService';

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(false);
  const [bilingualMode, setBilingualMode] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    loadSettings();
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const hasKey = await NevinAIService.hasApiKey();
    setHasApiKey(hasKey);
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setDarkMode(parsed.darkMode ?? false);
        setBilingualMode(parsed.bilingualMode ?? true);
        setFontSize(parsed.fontSize ?? 'medium');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (key: string, value: any) => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      const currentSettings = settings ? JSON.parse(settings) : {};
      const newSettings = { ...currentSettings, [key]: value };
      await AsyncStorage.setItem('userSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleSaveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await NevinAIService.setApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setShowApiKeyModal(false);
      setApiKeyInput('');
      Alert.alert('Listo', 'La clave API se guardó correctamente.');
    }
  };

  const handleRemoveApiKey = () => {
    Alert.alert(
      'Eliminar Clave API',
      '¿Estás seguro? Nevin AI dejará de funcionar sin una clave API.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await NevinAIService.setApiKey('');
            await NevinAIService.clearChatHistory();
            setHasApiKey(false);
          }
        }
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Limpiar Datos',
      '¿Estás seguro? Esto eliminará tu historial de chat y preferencias.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await NevinAIService.clearChatHistory();
            await AsyncStorage.removeItem('userSettings');
            Alert.alert('Listo', 'Datos eliminados correctamente.');
          }
        }
      ]
    );
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    saveSettings('fontSize', size);
  };

  return (
    <ScrollView style={styles.container}>
      <Title style={styles.title}>Configuración</Title>

      <List.Section>
        <List.Subheader>Apariencia</List.Subheader>
        <List.Item
          title="Modo Oscuro"
          left={props => <List.Icon {...props} icon="theme-light-dark" />}
          right={() => (
            <Switch
              value={darkMode}
              onValueChange={(value) => {
                setDarkMode(value);
                saveSettings('darkMode', value);
              }}
            />
          )}
        />
        <List.Item
          title="Tamaño de Fuente"
          description={fontSize === 'small' ? 'Pequeño' : fontSize === 'large' ? 'Grande' : 'Mediano'}
          left={props => <List.Icon {...props} icon="format-size" />}
          right={() => (
            <View style={styles.fontSizeControl}>
              <IconButton 
                icon="minus" 
                onPress={() => handleFontSizeChange('small')} 
                disabled={fontSize === 'small'}
              />
              <Text>A</Text>
              <IconButton 
                icon="plus" 
                onPress={() => handleFontSizeChange('large')} 
                disabled={fontSize === 'large'}
              />
            </View>
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Contenido</List.Subheader>
        <List.Item
          title="Modo Bilingüe"
          description="Mostrar texto en español y tzotzil"
          left={props => <List.Icon {...props} icon="translate" />}
          right={() => (
            <Switch
              value={bilingualMode}
              onValueChange={(value) => {
                setBilingualMode(value);
                saveSettings('bilingualMode', value);
              }}
            />
          )}
        />
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Nevin AI</List.Subheader>
        <List.Item
          title="Clave API de Anthropic"
          description={hasApiKey ? "Configurada ✓" : "No configurada"}
          left={props => <List.Icon {...props} icon="key" />}
          onPress={() => setShowApiKeyModal(true)}
        />
        {hasApiKey && (
          <List.Item
            title="Eliminar Clave API"
            description="Desactivar Nevin AI"
            left={props => <List.Icon {...props} icon="key-remove" />}
            onPress={handleRemoveApiKey}
          />
        )}
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader>Datos</List.Subheader>
        <List.Item
          title="Limpiar Historial de Chat"
          description="Eliminar conversaciones con Nevin"
          left={props => <List.Icon {...props} icon="delete" />}
          onPress={handleClearData}
        />
      </List.Section>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Versión 2.1.0 - Tzotzil Bible
        </Text>
        <Text style={styles.infoSubtext}>
          La Biblia funciona completamente sin internet.
          Nevin AI requiere conexión a internet y una clave API.
        </Text>
      </View>

      <Portal>
        <Modal visible={showApiKeyModal} onDismiss={() => setShowApiKeyModal(false)} contentContainerStyle={styles.modalContainer}>
          <Card>
            <Card.Title title="Configurar Nevin AI" />
            <Card.Content>
              <Text style={styles.modalText}>
                Para usar Nevin AI, necesitas una clave API de Anthropic. 
                Puedes obtener una en console.anthropic.com
              </Text>
              <TextInput
                style={styles.apiInput}
                placeholder="sk-ant-..."
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </Card.Content>
            <Card.Actions>
              <Button onPress={() => setShowApiKeyModal(false)}>Cancelar</Button>
              <Button mode="contained" onPress={handleSaveApiKey}>Guardar</Button>
            </Card.Actions>
          </Card>
        </Modal>
      </Portal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  infoText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  infoSubtext: {
    textAlign: 'center',
    color: '#666',
    fontSize: 12,
  },
  modalContainer: {
    padding: 20,
    margin: 20,
  },
  modalText: {
    marginBottom: 16,
    color: '#666',
  },
  apiInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  }
});
