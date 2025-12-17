import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NevinAIService } from '../services/NevinAIService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function NevinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checkingKey, setCheckingKey] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    checkApiKey();
    loadHistory();
  }, []);

  const checkApiKey = async () => {
    const hasKey = await NevinAIService.hasApiKey();
    setHasApiKey(hasKey);
    setCheckingKey(false);
  };

  const loadHistory = async () => {
    const history = await NevinAIService.getChatHistory();
    const loadedMessages: Message[] = history.map((msg: { role: 'user' | 'assistant'; content: string }, index: number) => ({
      id: index.toString(),
      content: msg.content,
      isUser: msg.role === 'user',
      timestamp: new Date()
    }));
    setMessages(loadedMessages);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await NevinAIService.sendMessage(newUserMessage.content);

      const nevinResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, nevinResponse]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro que deseas eliminar toda la conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await NevinAIService.clearChatHistory();
            setMessages([]);
          }
        }
      ]
    );
  };

  if (checkingKey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!hasApiKey) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text variant="headlineMedium" style={styles.title}>Nevin AI</Text>
          <Card style={styles.setupCard}>
            <Card.Content>
              <Text style={styles.setupText}>
                Para usar Nevin AI, necesitas configurar una clave API de Anthropic.
              </Text>
              <Text style={styles.setupSubtext}>
                Puedes obtener una en console.anthropic.com
              </Text>
            </Card.Content>
            <Card.Actions>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Settings')}
              >
                Ir a Configuración
              </Button>
            </Card.Actions>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Nevin AI</Text>
          {messages.length > 0 && (
            <Button 
              mode="text" 
              onPress={handleClearHistory}
              compact
            >
              Limpiar
            </Button>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.length === 0 && (
            <Card style={styles.welcomeCard}>
              <Card.Content>
                <Text style={styles.welcomeTitle}>¡Hola! Soy Nevin</Text>
                <Text style={styles.welcomeText}>
                  Tu asistente bíblico con inteligencia artificial. 
                  Puedo ayudarte con preguntas sobre la Biblia, 
                  interpretaciones y principios adventistas.
                </Text>
              </Card.Content>
            </Card>
          )}
          
          {messages.map((message) => (
            <Card
              key={message.id}
              style={[
                styles.messageCard,
                message.isUser ? styles.userMessage : styles.nevinMessage,
              ]}
            >
              <Card.Content>
                <Text>{message.content}</Text>
              </Card.Content>
            </Card>
          ))}
          
          {loading && (
            <Card style={[styles.messageCard, styles.nevinMessage]}>
              <Card.Content>
                <ActivityIndicator size="small" />
              </Card.Content>
            </Card>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Escribe tu mensaje..."
            mode="outlined"
            multiline
            style={styles.input}
            disabled={loading}
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
              />
            }
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
  },
  setupCard: {
    margin: 20,
    maxWidth: 400,
  },
  setupText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  setupSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  welcomeCard: {
    marginBottom: 20,
    backgroundColor: '#e8f5e9',
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#333',
  },
  messagesContainer: {
    flex: 1,
    padding: 10,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageCard: {
    marginVertical: 5,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e3f2fd',
  },
  nevinMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  inputContainer: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  input: {
    maxHeight: 100,
  },
});
