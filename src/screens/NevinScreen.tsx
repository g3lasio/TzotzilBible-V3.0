import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Text, TextInput, ActivityIndicator, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NevinAIService } from '../services/NevinAIService';
import { MomentsService } from '../services/MomentsService';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList, TabParamList } from '../types/navigation';
import type { Moment, ChatMessage } from '../types/nevin';
import MainLayout from '../components/MainLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type NevinRouteProp = RouteProp<TabParamList, 'NevinTab'>;

const { width } = Dimensions.get('window');

const INTRIGUE_QUESTIONS = [
  '¿Por qué Dios descansó si no se cansa?',
  '¿El árbol prohibido era realmente malo?',
  '¿Judas tuvo opción de no traicionar?',
  '¿Por qué Jesús lloró si sabía que resucitaría a Lázaro?',
  '¿Por qué Dios endureció el corazón de Faraón?',
  '¿Qué idioma hablaban en el Edén?',
  '¿Satanás puede leer nuestros pensamientos?',
  '¿Por qué murió Moisés sin entrar a Canaán?',
  '¿Los ángeles tienen libre albedrío?',
  '¿Por qué permitió Dios que Job sufriera?',
  '¿Qué pasó con el arca del pacto?',
  '¿Por qué Elías tuvo miedo de Jezabel?',
  '¿Caín encontró esposa en otro lugar?',
  '¿Por qué Jesús maldijo la higuera?',
  '¿Los animales van al cielo?',
];

const getRandomQuestions = () => {
  const shuffled = [...INTRIGUE_QUESTIONS].sort(() => Math.random() - 0.5);
  const count = Math.floor(Math.random() * 2) + 3;
  return shuffled.slice(0, count);
};

const AI_THINKING_PHRASES = [
  'Analizando las Escrituras...',
  'Consultando pasajes bíblicos...',
  'Reflexionando teológicamente...',
  'Buscando en la Palabra...',
  'Procesando tu pregunta...',
];

const ThinkingAnimation = () => {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [phrase] = useState(() => AI_THINKING_PHRASES[Math.floor(Math.random() * AI_THINKING_PHRASES.length)]);

  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot1, { toValue: 0.3, duration: 300, useNativeDriver: true }),
        ])
      ).start();
      
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ])
        ).start();
      }, 150);
      
      setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0.3, duration: 300, useNativeDriver: true }),
          ])
        ).start();
      }, 300);
    };

    const animatePulse = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    };

    animateDots();
    animatePulse();
  }, [dot1, dot2, dot3, pulseAnim]);

  return (
    <View style={thinkingStyles.container}>
      <Animated.View style={[thinkingStyles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
        <MaterialCommunityIcons name="creation" size={20} color="#00ff88" />
      </Animated.View>
      <View style={thinkingStyles.textContainer}>
        <Text style={thinkingStyles.phrase}>{phrase}</Text>
        <View style={thinkingStyles.dotsContainer}>
          <Animated.View style={[thinkingStyles.dot, { opacity: dot1, backgroundColor: '#00ff88' }]} />
          <Animated.View style={[thinkingStyles.dot, { opacity: dot2, backgroundColor: '#00f3ff' }]} />
          <Animated.View style={[thinkingStyles.dot, { opacity: dot3, backgroundColor: '#00ff88' }]} />
        </View>
      </View>
    </View>
  );
};

const thinkingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.2)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  phrase: {
    color: '#00ff88',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function NevinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<NevinRouteProp>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialQuestionProcessed, setInitialQuestionProcessed] = useState(false);
  const [momentLoaded, setMomentLoaded] = useState(false);
  const [currentMoment, setCurrentMoment] = useState<Moment | null>(null);
  const [momentTitle, setMomentTitle] = useState<string>('');
  const [randomQuestions] = useState(() => getRandomQuestions());
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const initialQuestion = route.params?.initialQuestion;
  const verseContext = route.params?.verseContext;

  useFocusEffect(
    useCallback(() => {
      loadMoment();
    }, [])
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (initialQuestion && !initialQuestionProcessed && momentLoaded) {
      setInitialQuestionProcessed(true);
      handleInitialQuestion();
    }
  }, [initialQuestion, momentLoaded]);

  const loadMoment = async () => {
    let moment = await MomentsService.getActiveMoment();
    
    if (!moment) {
      moment = await MomentsService.createMoment();
    }
    
    setCurrentMoment(moment);
    setMomentTitle(moment.title);
    
    const loadedMessages: Message[] = moment.messages.map((msg, index) => ({
      id: msg.id || index.toString(),
      content: msg.content,
      isUser: msg.type === 'user',
      timestamp: new Date(msg.timestamp)
    }));
    
    setMessages(loadedMessages);
    setMomentLoaded(true);
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 100);
  };

  const handleInitialQuestion = async () => {
    if (!initialQuestion || !currentMoment) return;
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: initialQuestion,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setLoading(true);

    try {
      let response: string;
      
      const chatHistory: ChatMessage[] = currentMoment.messages;
      
      if (verseContext) {
        const result = await NevinAIService.askAboutVerse(
          verseContext.book,
          verseContext.chapter,
          verseContext.verse,
          initialQuestion,
          verseContext.textTzotzil,
          verseContext.textSpanish
        );
        response = result.response || result.error || 'No pude procesar tu pregunta';
      } else {
        const result = await NevinAIService.processQuery(initialQuestion, '', chatHistory);
        response = result.response || result.error || 'No pude procesar tu pregunta';
      }

      const nevinResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, nevinResponse]);

      const userChatMsg: ChatMessage = {
        id: newUserMessage.id,
        content: newUserMessage.content,
        type: 'user',
        timestamp: newUserMessage.timestamp
      };
      const assistantChatMsg: ChatMessage = {
        id: nevinResponse.id,
        content: nevinResponse.content,
        type: 'assistant',
        timestamp: nevinResponse.timestamp
      };
      
      await MomentsService.addMessageToMoment(currentMoment.id, userChatMsg, assistantChatMsg);
      
      const updatedMoment = await MomentsService.getMoment(currentMoment.id);
      if (updatedMoment) {
        setCurrentMoment(updatedMoment);
        setMomentTitle(updatedMoment.title);
      }

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      console.error('Error sending initial message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentMoment) return;

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
      const chatHistory: ChatMessage[] = currentMoment.messages;
      const result = await NevinAIService.processQuery(newUserMessage.content, '', chatHistory);
      const response = result.response || result.error || 'No pude procesar tu mensaje';

      const nevinResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, nevinResponse]);

      const userChatMsg: ChatMessage = {
        id: newUserMessage.id,
        content: newUserMessage.content,
        type: 'user',
        timestamp: newUserMessage.timestamp
      };
      const assistantChatMsg: ChatMessage = {
        id: nevinResponse.id,
        content: nevinResponse.content,
        type: 'assistant',
        timestamp: nevinResponse.timestamp
      };
      
      await MomentsService.addMessageToMoment(currentMoment.id, userChatMsg, assistantChatMsg);
      
      const updatedMoment = await MomentsService.getMoment(currentMoment.id);
      if (updatedMoment) {
        setCurrentMoment(updatedMoment);
        setMomentTitle(updatedMoment.title);
      }

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

  const handleNewMoment = async () => {
    const newMoment = await MomentsService.createMoment();
    setCurrentMoment(newMoment);
    setMomentTitle(newMoment.title);
    setMessages([]);
  };

  const handleOpenMoments = () => {
    navigation.navigate('Moments');
  };

  return (
    <MainLayout title="Nevin">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.chatHeader}>
          <TouchableOpacity style={styles.momentsButton} onPress={handleOpenMoments}>
            <MaterialCommunityIcons name="layers-outline" size={18} color="#00f3ff" />
            <Text style={styles.momentsButtonText}>Momentos</Text>
          </TouchableOpacity>
          {messages.length > 0 && (
            <View style={styles.momentTitleContainer}>
              <Text style={styles.momentTitleText} numberOfLines={1}>{momentTitle}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.newMomentBtn} onPress={handleNewMoment}>
            <MaterialCommunityIcons name="plus" size={20} color="#00ff88" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
              <View style={styles.welcomeContent}>
                <Text style={styles.welcomeGreeting}>Hola</Text>
                <Text style={styles.welcomeSubtext}>
                  Pregúntame sobre la Biblia, profecías o teología
                </Text>
              </View>
              
              <View style={styles.intrigueContainer}>
                <Text style={styles.intrigueLabel}>Explora algo:</Text>
                <View style={styles.intrigueChips}>
                  {randomQuestions.map((question, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.intrigueChip}
                      onPress={() => setInputMessage(question)}
                    >
                      <Text style={styles.intrigueChipText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </Animated.View>
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
                  <MaterialCommunityIcons name="creation" size={16} color="#00ff88" />
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
            <View style={styles.thinkingWrapper}>
              <ThinkingAnimation />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity 
              style={styles.newChatButton}
              onPress={handleNewMoment}
            >
              <MaterialCommunityIcons 
                name="plus" 
                size={20} 
                color="#00ff88" 
              />
            </TouchableOpacity>
            <TextInput
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder="Escribe aquí..."
              mode="outlined"
              style={styles.input}
              disabled={loading}
              placeholderTextColor="#6b7c93"
              textColor="#e6f3ff"
              outlineColor="rgba(0, 243, 255, 0.3)"
              activeOutlineColor="#00f3ff"
              dense
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!inputMessage.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={loading || !inputMessage.trim()}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={18} 
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
  keyboardAvoid: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00ff88',
    letterSpacing: 0.5,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff88',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: '#6b7c93',
  },
  momentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  momentsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00f3ff',
  },
  momentTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  momentTitleText: {
    fontSize: 13,
    color: '#a0b8d0',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  newMomentBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  welcomeContainer: {
    paddingTop: 40,
    paddingHorizontal: 8,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeGreeting: {
    fontSize: 32,
    fontWeight: '300',
    color: '#e6f3ff',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6b7c93',
    textAlign: 'center',
  },
  intrigueContainer: {
    marginTop: 10,
  },
  intrigueLabel: {
    fontSize: 11,
    color: '#6b7c93',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  intrigueChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intrigueChip: {
    backgroundColor: 'rgba(0, 243, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  intrigueChipText: {
    color: '#a0b8d0',
    fontSize: 12,
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
  thinkingWrapper: {
    marginVertical: 10,
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
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 243, 255, 0.15)',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  input: {
    flex: 1,
    maxHeight: 80,
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
    fontSize: 14,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 243, 255, 0.3)',
  },
});
