import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Animated, TouchableOpacity, Dimensions, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
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
import ClickableVerseText from '../components/ClickableVerseText';
import { EgwCitationCard, parseMessageSegments } from '../components/EgwCitationCard';

/**
 * NevinMessageContent — renders a Nevin AI message with mixed content:
 * normal text segments (via ClickableVerseText) and EGW citation blocks
 * (via EgwCitationCard). The parsing logic lives in EgwCitationCard.ts
 * and does NOT touch any business/service logic.
 */
const NevinMessageContent = React.memo(({ content }: { content: string }) => {
  const segments = parseMessageSegments(content);
  return (
    <View>
      {segments.map((seg, i) => {
        if (seg.type === 'egw') {
          return (
            <EgwCitationCard
              key={i}
              quote={seg.quote}
              reference={seg.reference}
            />
          );
        }
        return (
          <ClickableVerseText
            key={i}
            text={seg.content}
            style={styles.messageText}
            linkColor="#00f3ff"
          />
        );
      })}
    </View>
  );
});

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
    // Prevenir múltiples ejecuciones
    if (loading) {
      console.log('handleNewMoment: Already loading, ignoring tap');
      return;
    }
    
    console.log('handleNewMoment: Starting new moment creation');
    
    try {
      setLoading(true);
      
      // Validar que el servicio esté disponible
      if (!MomentsService) {
        console.error('handleNewMoment: MomentsService not available');
        throw new Error('Servicio de momentos no disponible');
      }
      
      console.log('handleNewMoment: Creating moment...');
      
      // Crear nuevo momento con timeout para evitar cuelgues
      const createPromise = MomentsService.createMoment();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout creating moment')), 10000)
      );
      
      const newMoment = await Promise.race([createPromise, timeoutPromise]) as Moment;
      
      console.log('handleNewMoment: Moment created successfully', newMoment.id);
      
      // Validar que se creó correctamente
      if (!newMoment || !newMoment.id) {
        console.error('handleNewMoment: Invalid moment returned');
        throw new Error('No se pudo crear el momento');
      }
      
      // Actualizar estado
      setCurrentMoment(newMoment);
      setMomentTitle(newMoment.title);
      setMessages([]);
      
      console.log('handleNewMoment: State updated successfully');
      
      // Mostrar feedback visual de éxito
      Alert.alert(
        'Nueva conversación',
        'Se creó una nueva conversación exitosamente',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('handleNewMoment: Error creating new moment:', error);
      console.error('handleNewMoment: Error stack:', error.stack);
      
      // Mensaje de error más descriptivo
      const errorMessage = error.message || 'Error desconocido';
      Alert.alert(
        'Error al crear conversación',
        `No se pudo crear una nueva conversación: ${errorMessage}. Por favor, verifica que tienes espacio de almacenamiento disponible e intenta de nuevo.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Reintentar', onPress: () => handleNewMoment() }
        ]
      );
    } finally {
      console.log('handleNewMoment: Cleaning up, setting loading to false');
      setLoading(false);
    }
  };

  const handleOpenMoments = () => {
    navigation.navigate('Moments');
  };

  return (
    <MainLayout title="Nevin">
      {/* Nebula Dark background — overrides MainLayout's default gradient for this screen only */}
      <LinearGradient
        colors={['#060B14', '#0A1020', '#060B14']}
        locations={[0, 0.5, 1]}
        style={styles.nebulaBackground}
      >
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
                {message.isUser ? (
                  <Text style={[styles.messageText, styles.userMessageText]}>
                    {message.content}
                  </Text>
                ) : (
                  <NevinMessageContent content={message.content} />
                )}
                <View style={styles.messageFooter}>
                  <Text style={[styles.timestamp, message.isUser && styles.userTimestamp]}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  {!message.isUser && (
                    <View style={styles.messageActions}>
                      <TouchableOpacity
                        style={styles.messageActionButton}
                        onPress={async () => {
                          await Clipboard.setStringAsync(message.content);
                          Alert.alert('✓ Copiado', 'Mensaje copiado al portapapeles');
                        }}
                      >
                        <MaterialCommunityIcons name="content-copy" size={14} color="#6b7c93" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.messageActionButton}
                        onPress={async () => {
                          try {
                            const shareText = `Nevin responde:\n\n${message.content}\n\n— Tzotzil Bible App`;
                            
                            // Web: usar Navigator.share si está disponible
                            if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
                              await navigator.share({
                                title: 'Respuesta de Nevin',
                                text: shareText
                              });
                            } else if (Platform.OS === 'web') {
                              // Fallback para web: copiar al portapapeles
                              await Clipboard.setStringAsync(shareText);
                              Alert.alert('✓ Copiado', 'Texto copiado al portapapeles para compartir');
                            } else {
                              // Móvil: usar Share API nativa
                              await Share.share({
                                message: shareText,
                                title: 'Respuesta de Nevin'
                              });
                            }
                          } catch (error) {
                            console.error('Error sharing:', error);
                          }
                        }}
                      >
                        <MaterialCommunityIcons name="share-variant" size={14} color="#6b7c93" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
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
              style={[styles.newChatButton, loading && styles.newChatButtonDisabled]}
              onPress={handleNewMoment}
              disabled={loading}
              activeOpacity={0.7}
              accessible={true}
              accessibilityLabel="Crear nueva conversación"
              accessibilityHint="Toca para iniciar una nueva conversación con Nevin"
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator size="small" color="#00ff88" />
              ) : (
                <MaterialCommunityIcons 
                  name="plus" 
                  size={20} 
                  color="#00ff88" 
                />
              )}
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
      </LinearGradient>
    </MainLayout>
  );
}

// ─────────────────────────────────────────────────────────
// NEBULA DARK — Design Tokens
// ─────────────────────────────────────────────────────────
// Background:   #060B14  (deep space navy)
// Surface:      rgba(12, 21, 37, 0.85)  (frosted glass)
// Cyan accent:  #00F3FF  (neon glow)
// Green accent: #00FF88  (status / avatar)
// Border:       rgba(0, 243, 255, 0.12)
// Text primary: #E8EDF5
// Text muted:   #6B7C93
// User bubble:  #00F3FF  (solid cyan)
// AI bubble:    rgba(12, 21, 37, 0.85) + cyan border
// ─────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Nebula Dark full-screen background overlay
  // Covers the MainLayout gradient with a deeper space-navy tone
  nebulaBackground: {
    flex: 1,
    backgroundColor: '#060B14',
  },

  keyboardAvoid: {
    flex: 1,
  },

  // ── Header bar ──────────────────────────────────────────
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.12)',
    backgroundColor: '#060B14',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  chatHeaderTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00F3FF',
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
    backgroundColor: '#00FF88',
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    color: '#6B7C93',
  },

  // ── Moments pill ────────────────────────────────────────
  momentsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  momentsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00F3FF',
    letterSpacing: 0.3,
  },
  momentTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  momentTitleText: {
    fontSize: 13,
    color: '#7A8FA6',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // ── Welcome screen ──────────────────────────────────────
  welcomeContainer: {
    paddingTop: 48,
    paddingHorizontal: 12,
  },
  welcomeContent: {
    alignItems: 'center',
    marginBottom: 44,
  },
  welcomeGreeting: {
    fontSize: 36,
    fontWeight: '200',
    color: '#E8EDF5',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  welcomeSubtext: {
    fontSize: 14,
    color: '#6B7C93',
    textAlign: 'center',
    lineHeight: 20,
  },
  intrigueContainer: {
    marginTop: 8,
  },
  intrigueLabel: {
    fontSize: 10,
    color: '#6B7C93',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  intrigueChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  intrigueChip: {
    backgroundColor: 'rgba(0, 243, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.14)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  intrigueChipText: {
    color: '#A0B8D0',
    fontSize: 12,
    lineHeight: 17,
  },

  // ── Chat scroll area ────────────────────────────────────
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },

  // ── Message wrappers ────────────────────────────────────
  messageWrapper: {
    flexDirection: 'row',
    marginVertical: 5,
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

  // ── Avatar ──────────────────────────────────────────────
  avatarContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
    // Subtle glow on iOS/web
    ...Platform.select({
      ios: {
        shadowColor: '#00F3FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      web: {
        boxShadow: '0 0 8px rgba(0,243,255,0.2)',
      } as any,
    }),
  },

  // ── Message bubble ──────────────────────────────────────
  messageCard: {
    // User messages: max 78% width; Nevin messages: up to 88% for long content
    maxWidth: '88%',
    borderRadius: 18,
    padding: 13,
  },

  // User bubble — solid cyan (Nebula Dark signature)
  userMessage: {
    backgroundColor: '#00F3FF',
    borderBottomRightRadius: 4,
    maxWidth: '78%',
    ...Platform.select({
      ios: {
        shadowColor: '#00F3FF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,243,255,0.25)',
      } as any,
    }),
  },

  // Nevin bubble — frosted glass with cyan border
  nevinMessage: {
    backgroundColor: 'rgba(12, 21, 37, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    borderBottomLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      web: {
        backdropFilter: 'blur(12px)',
        boxShadow: '0 2px 16px rgba(0,0,0,0.3)',
      } as any,
    }),
  },

  // ── Text styles ─────────────────────────────────────────
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#DCE8F5',
  },
  userMessageText: {
    color: '#060B14',
    fontWeight: '500',
  },

  // ── Timestamp & footer ──────────────────────────────────
  timestamp: {
    fontSize: 10,
    color: '#6B7C93',
    marginTop: 7,
    textAlign: 'right',
  },
  userTimestamp: {
    color: 'rgba(6, 11, 20, 0.55)',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 243, 255, 0.08)',
  },
  messageActions: {
    flexDirection: 'row',
    gap: 10,
  },
  messageActionButton: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(107, 124, 147, 0.08)',
  },

  // ── Typing indicator ────────────────────────────────────
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  typingText: {
    marginLeft: 10,
    color: '#6B7C93',
    fontSize: 14,
  },

  // ── Input area ──────────────────────────────────────────
  inputContainer: {
    backgroundColor: '#060B14',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 243, 255, 0.12)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      } as any,
    }),
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
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  newChatButtonDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    maxHeight: 80,
    backgroundColor: 'rgba(12, 21, 37, 0.7)',
    fontSize: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.12)',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00F3FF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00F3FF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      web: {
        boxShadow: '0 0 12px rgba(0,243,255,0.45)',
      } as any,
    }),
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(0, 243, 255, 0.25)',
    ...Platform.select({
      ios: { shadowOpacity: 0 },
      web: { boxShadow: 'none' } as any,
    }),
  },
});
