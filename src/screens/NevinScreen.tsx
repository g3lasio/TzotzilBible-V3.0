import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NevinAIService } from '../services/NevinAIService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

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
      <MainLayout title="Nevin" hideBottomNav>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Verificando configuración...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!hasApiKey) {
    return (
      <MainLayout title="Nevin">
        <View style={styles.setupContainer}>
          <Animated.View style={[styles.setupContent, { opacity: fadeAnim }]}>
            <View style={styles.robotIconContainer}>
              <MaterialCommunityIcons name="robot" size={80} color="#00ff88" />
            </View>
            <Text style={styles.setupTitle}>Nevin AI</Text>
            <Text style={styles.setupSubtitle}>Tu asistente bíblico inteligente</Text>
            
            <View style={styles.setupCard}>
              <LinearGradient
                colors={['rgba(20, 30, 45, 0.9)', 'rgba(15, 25, 40, 0.95)']}
                style={styles.setupCardGradient}
              >
                <MaterialCommunityIcons name="key" size={40} color="#00f3ff" />
                <Text style={styles.setupCardTitle}>Configuración Requerida</Text>
                <Text style={styles.setupCardText}>
                  Para usar Nevin AI, necesitas configurar una clave API de Anthropic (Claude).
                </Text>
                <Text style={styles.setupCardHint}>
                  Puedes obtener una clave en console.anthropic.com
                </Text>
                <TouchableOpacity 
                  style={styles.setupButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <MaterialCommunityIcons name="cog" size={18} color="#0a0e14" />
                  <Text style={styles.setupButtonText}>Ir a Configuración</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Animated.View>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Nevin" hideBottomNav>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderInfo}>
            <View style={styles.nevinAvatar}>
              <MaterialCommunityIcons name="robot" size={24} color="#00ff88" />
            </View>
            <View>
              <Text style={styles.chatHeaderTitle}>Nevin</Text>
              <Text style={styles.chatHeaderSubtitle}>Asistente Bíblico</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <IconButton 
              icon="delete-outline"
              iconColor="#6b7c93"
              size={24}
              onPress={handleClearHistory}
            />
          )}
        </View>
        <View style={styles.chatDivider} />

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeCard}>
              <LinearGradient
                colors={['rgba(0, 255, 136, 0.1)', 'rgba(0, 243, 255, 0.05)']}
                style={styles.welcomeGradient}
              >
                <MaterialCommunityIcons name="hand-wave" size={40} color="#00ff88" />
                <Text style={styles.welcomeTitle}>¡Paz a ti! Soy Nevin</Text>
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
                    <TouchableOpacity
                      key={index}
                      style={styles.suggestionButton}
                      onPress={() => setInputMessage(suggestion)}
                    >
                      <Text style={styles.suggestionButtonText}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </LinearGradient>
            </View>
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
                  <MaterialCommunityIcons name="robot" size={16} color="#00ff88" />
                </View>
              )}
              <View
                style={[
                  styles.messageCard,
                  message.isUser ? styles.userMessage : styles.nevinMessage,
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.isUser && styles.userMessageText
                ]}>
                  {message.content}
                </Text>
                <Text style={[styles.timestamp, message.isUser && styles.userTimestamp]}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          
          {loading && (
            <View style={[styles.messageWrapper, styles.nevinMessageWrapper]}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="robot" size={16} color="#00ff88" />
              </View>
              <View style={[styles.messageCard, styles.nevinMessage, styles.typingIndicator]}>
                <ActivityIndicator size="small" color="#00f3ff" />
                <Text style={styles.typingText}>Nevin está escribiendo...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <MaterialCommunityIcons name="cog" size={22} color="#6b7c93" />
            </TouchableOpacity>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Escribe tu pregunta aquí..."
              mode="outlined"
              multiline
              style={styles.input}
              disabled={loading}
              placeholderTextColor="#6b7c93"
              textColor="#e6f3ff"
              outlineColor="rgba(0, 243, 255, 0.3)"
              activeOutlineColor="#00f3ff"
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputMessage.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={22} 
                color={inputMessage.trim() && !loading ? '#0a0e14' : '#6b7c93'} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7c93',
    fontSize: 16,
  },
  keyboardAvoid: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nevinAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.4)',
  },
  chatHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e6f3ff',
  },
  chatHeaderSubtitle: {
    fontSize: 12,
    color: '#6b7c93',
  },
  chatDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
  },
  setupContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  setupContent: {
    alignItems: 'center',
    width: '100%',
  },
  robotIconContainer: {
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00ff88',
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  setupSubtitle: {
    fontSize: 16,
    color: '#6b7c93',
    marginTop: 8,
    marginBottom: 32,
  },
  setupCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  setupCardGradient: {
    padding: 24,
    alignItems: 'center',
  },
  setupCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 12,
    color: '#e6f3ff',
  },
  setupCardText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#6b7c93',
    marginBottom: 8,
  },
  setupCardHint: {
    fontSize: 13,
    textAlign: 'center',
    color: '#6b7c93',
    marginBottom: 20,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00f3ff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  setupButtonText: {
    color: '#0a0e14',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  welcomeCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  welcomeGradient: {
    padding: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#00ff88',
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  welcomeText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e6f3ff',
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
    color: '#6b7c93',
    marginBottom: 10,
  },
  suggestionButton: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  suggestionButtonText: {
    color: '#00ff88',
    fontSize: 14,
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
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  messageCard: {
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12,
  },
  userMessage: {
    backgroundColor: '#00f3ff',
    borderBottomRightRadius: 4,
  },
  nevinMessage: {
    backgroundColor: 'rgba(20, 30, 45, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#e6f3ff',
  },
  userMessageText: {
    color: '#0a0e14',
  },
  timestamp: {
    fontSize: 10,
    color: '#6b7c93',
    marginTop: 6,
    textAlign: 'right',
  },
  userTimestamp: {
    color: 'rgba(10, 14, 20, 0.6)',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingText: {
    marginLeft: 10,
    color: '#6b7c93',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: 'rgba(10, 14, 20, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 243, 255, 0.2)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
  },
});
