import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated } from 'react-native';
import { Text, TextInput, Button, Card, ActivityIndicator, IconButton, Surface } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkApiKey();
    loadHistory();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Verificando configuración...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!hasApiKey) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#1a237e', '#3949ab', '#5c6bc0']}
          style={styles.setupGradient}
        >
          <Animated.View style={[styles.setupContent, { opacity: fadeAnim }]}>
            <MaterialCommunityIcons name="robot" size={80} color="#fff" />
            <Text style={styles.setupTitle}>Nevin AI</Text>
            <Text style={styles.setupSubtitle}>Tu asistente bíblico inteligente</Text>
            
            <Surface style={styles.setupCard} elevation={4}>
              <MaterialCommunityIcons name="key" size={40} color="#f57c00" />
              <Text style={styles.setupCardTitle}>Configuración Requerida</Text>
              <Text style={styles.setupCardText}>
                Para usar Nevin AI, necesitas configurar una clave API de Anthropic (Claude).
              </Text>
              <Text style={styles.setupCardHint}>
                Puedes obtener una clave gratuita en console.anthropic.com
              </Text>
              <Button 
                mode="contained" 
                onPress={() => navigation.navigate('Settings')}
                icon="cog"
                style={styles.setupButton}
                buttonColor="#1a237e"
              >
                Ir a Configuración
              </Button>
            </Surface>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <LinearGradient
          colors={['#1a237e', '#3949ab']}
          style={styles.header}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <MaterialCommunityIcons name="robot" size={28} color="#fff" />
              <View style={styles.headerText}>
                <Text style={styles.headerTitle}>Nevin AI</Text>
                <Text style={styles.headerSubtitle}>Asistente Bíblico</Text>
              </View>
            </View>
            {messages.length > 0 && (
              <IconButton 
                icon="delete-outline"
                iconColor="#fff"
                size={24}
                onPress={handleClearHistory}
              />
            )}
          </View>
        </LinearGradient>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Surface style={styles.welcomeCard} elevation={2}>
              <LinearGradient
                colors={['#e8f5e9', '#c8e6c9']}
                style={styles.welcomeGradient}
              >
                <MaterialCommunityIcons name="hand-wave" size={40} color="#4CAF50" />
                <Text style={styles.welcomeTitle}>¡Hola! Soy Nevin</Text>
                <Text style={styles.welcomeText}>
                  Tu asistente bíblico con inteligencia artificial. 
                  Puedo ayudarte con preguntas sobre la Biblia, 
                  interpretaciones teológicas y principios adventistas.
                </Text>
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>Prueba preguntándome:</Text>
                  {[
                    '¿Qué significa Juan 3:16?',
                    '¿Cuál es el día de reposo bíblico?',
                    'Explica la parábola del hijo pródigo'
                  ].map((suggestion, index) => (
                    <Button
                      key={index}
                      mode="outlined"
                      onPress={() => setInputMessage(suggestion)}
                      style={styles.suggestionButton}
                      compact
                    >
                      {suggestion}
                    </Button>
                  ))}
                </View>
              </LinearGradient>
            </Surface>
          )}
          
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.nevinMessageWrapper,
              ]}
            >
              {!message.isUser && (
                <View style={styles.avatarContainer}>
                  <MaterialCommunityIcons name="robot" size={20} color="#1a237e" />
                </View>
              )}
              <Surface
                style={[
                  styles.messageCard,
                  message.isUser ? styles.userMessage : styles.nevinMessage,
                ]}
                elevation={1}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser && styles.userMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={styles.timestamp}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </Surface>
            </View>
          ))}
          
          {loading && (
            <View style={[styles.messageWrapper, styles.nevinMessageWrapper]}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="robot" size={20} color="#1a237e" />
              </View>
              <Surface style={[styles.messageCard, styles.nevinMessage, styles.typingIndicator]} elevation={1}>
                <ActivityIndicator size="small" color="#1a237e" />
                <Text style={styles.typingText}>Nevin está escribiendo...</Text>
              </Surface>
            </View>
          )}
        </ScrollView>

        <Surface style={styles.inputContainer} elevation={4}>
          <TextInput
            value={inputMessage}
            onChangeText={setInputMessage}
            placeholder="Escribe tu pregunta..."
            mode="outlined"
            multiline
            style={styles.input}
            disabled={loading}
            outlineColor="#e0e0e0"
            activeOutlineColor="#1a237e"
            right={
              <TextInput.Icon
                icon="send"
                onPress={handleSendMessage}
                disabled={loading || !inputMessage.trim()}
                color={inputMessage.trim() ? '#1a237e' : '#ccc'}
              />
            }
          />
        </Surface>
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
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  setupGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupContent: {
    alignItems: 'center',
    width: '100%',
  },
  setupTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
  },
  setupSubtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    marginBottom: 32,
  },
  setupCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  setupCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
  },
  setupCardText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#666',
    marginBottom: 8,
  },
  setupCardHint: {
    fontSize: 13,
    textAlign: 'center',
    color: '#999',
    marginBottom: 20,
  },
  setupButton: {
    borderRadius: 10,
    paddingHorizontal: 16,
  },
  welcomeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  welcomeGradient: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#2e7d32',
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'center',
    marginTop: 12,
  },
  suggestionsContainer: {
    marginTop: 20,
    width: '100%',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
  },
  suggestionButton: {
    marginBottom: 8,
    borderColor: '#4CAF50',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  nevinMessageWrapper: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageCard: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#1a237e',
    borderBottomRightRadius: 4,
  },
  nevinMessage: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    textAlign: 'right',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  inputContainer: {
    padding: 12,
    backgroundColor: '#fff',
  },
  input: {
    maxHeight: 100,
    backgroundColor: '#fff',
  },
});
