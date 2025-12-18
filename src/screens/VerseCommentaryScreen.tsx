import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Animated } from 'react-native';
import { Text, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NevinAIService } from '../services/NevinAIService';
import type { BibleStackParamList } from '../types/navigation';
import MainLayout from '../components/MainLayout';

type VerseCommentaryRouteProp = RouteProp<BibleStackParamList, 'VerseCommentary'>;
type NavigationProp = NativeStackNavigationProp<BibleStackParamList>;

const { width } = Dimensions.get('window');

export default function VerseCommentaryScreen() {
  const route = useRoute<VerseCommentaryRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book, chapter, verse, textTzotzil, textSpanish } = route.params;
  
  const [commentary, setCommentary] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadCommentary();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadCommentary = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await NevinAIService.getVerseCommentary({
        book,
        chapter,
        verse,
        textTzotzil,
        textSpanish
      });

      if (result.success && result.commentary) {
        setCommentary(result.commentary);
      } else {
        setError(result.error || 'No se pudo obtener el comentario');
      }
    } catch (err) {
      console.error('Error loading commentary:', err);
      setError('Error al cargar el comentario. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCommentary = (text: string) => {
    const sections = text.split(/(\n\n|\n(?=[📖🔍📜🗺️💎📚✨🙏]))/);
    
    return sections.map((section, index) => {
      if (!section.trim()) return null;
      
      const isHeader = /^[📖🔍📜🗺️💎📚✨🙏]/.test(section.trim());
      const hasStars = section.includes('**');
      
      if (hasStars) {
        const parts = section.split(/\*\*(.*?)\*\*/g);
        return (
          <Text key={index} style={isHeader ? styles.sectionHeader : styles.commentaryText}>
            {parts.map((part, partIndex) => 
              partIndex % 2 === 1 ? (
                <Text key={partIndex} style={styles.boldText}>{part}</Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      }
      
      return (
        <Text 
          key={index} 
          style={isHeader ? styles.sectionHeader : styles.commentaryText}
        >
          {section}
        </Text>
      );
    });
  };

  return (
    <MainLayout 
      title="Comentario Bíblico" 
      showBackButton 
      onBackPress={() => navigation.goBack()}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.verseHeader}>
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.15)', 'rgba(0, 243, 255, 0.1)']}
            style={styles.verseHeaderGradient}
          >
            <View style={styles.verseHeaderContent}>
              <View style={styles.nevinBadge}>
                <MaterialCommunityIcons name="robot" size={20} color="#00ff88" />
                <Text style={styles.nevinBadgeText}>NEVIN AI</Text>
              </View>
              
              <Text style={styles.verseReference}>
                {book} {chapter}:{verse}
              </Text>
              
              <View style={styles.versionChips}>
                {textTzotzil && (
                  <Chip 
                    mode="outlined" 
                    style={styles.versionChip}
                    textStyle={styles.versionChipText}
                  >
                    TZO
                  </Chip>
                )}
                {textSpanish && (
                  <Chip 
                    mode="outlined" 
                    style={[styles.versionChip, styles.versionChipCyan]}
                    textStyle={styles.versionChipTextCyan}
                  >
                    RV1960
                  </Chip>
                )}
              </View>
            </View>

            {textTzotzil && (
              <View style={styles.verseTextContainer}>
                <Text style={styles.versionLabel}>Tzotzil:</Text>
                <Text style={styles.verseText}>{textTzotzil}</Text>
              </View>
            )}
            
            {textSpanish && (
              <View style={styles.verseTextContainer}>
                <Text style={[styles.versionLabel, { color: '#00f3ff' }]}>RV1960:</Text>
                <Text style={styles.verseText}>{textSpanish}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.commentaryContainer}
          contentContainerStyle={styles.commentaryContent}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00ff88" />
              <Text style={styles.loadingText}>Nevin está analizando el versículo...</Text>
              <Text style={styles.loadingSubtext}>
                Aplicando metodología hermenéutica adventista
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={48} color="#ff6b6b" />
              <Text style={styles.errorText}>{error}</Text>
              <IconButton
                icon="refresh"
                iconColor="#00f3ff"
                size={32}
                onPress={loadCommentary}
                style={styles.retryButton}
              />
            </View>
          ) : (
            <View style={styles.commentaryWrapper}>
              <View style={styles.commentaryTitleRow}>
                <MaterialCommunityIcons name="book-open-page-variant" size={24} color="#00ff88" />
                <Text style={styles.commentaryTitle}>Comentario Teológico</Text>
              </View>
              
              <LinearGradient
                colors={['rgba(20, 30, 45, 0.9)', 'rgba(15, 25, 40, 0.95)']}
                style={styles.commentaryCard}
              >
                {formatCommentary(commentary)}
              </LinearGradient>
              
              <View style={styles.footer}>
                <MaterialCommunityIcons name="shield-check" size={16} color="#6b7c93" />
                <Text style={styles.footerText}>
                  Basado en principios hermenéuticos adventistas
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  verseHeader: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.4)',
  },
  verseHeaderGradient: {
    padding: 16,
  },
  verseHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  nevinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  nevinBadgeText: {
    color: '#00ff88',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 6,
    letterSpacing: 1,
  },
  verseReference: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e6f3ff',
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  versionChips: {
    flexDirection: 'row',
    gap: 8,
  },
  versionChip: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderColor: 'rgba(0, 255, 136, 0.4)',
    height: 28,
  },
  versionChipCyan: {
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    borderColor: 'rgba(0, 243, 255, 0.4)',
  },
  versionChipText: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '600',
  },
  versionChipTextCyan: {
    color: '#00f3ff',
    fontSize: 11,
    fontWeight: '600',
  },
  verseTextContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  versionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00ff88',
    marginBottom: 4,
  },
  verseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#c8d6e5',
    fontStyle: 'italic',
  },
  commentaryContainer: {
    flex: 1,
  },
  commentaryContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: '#e6f3ff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  loadingSubtext: {
    color: '#6b7c93',
    fontSize: 13,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  commentaryWrapper: {
    flex: 1,
  },
  commentaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  commentaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ff88',
    marginLeft: 10,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  commentaryCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginTop: 20,
    marginBottom: 8,
  },
  commentaryText: {
    fontSize: 15,
    lineHeight: 26,
    color: '#c8d6e5',
    marginBottom: 8,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#e6f3ff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: '#6b7c93',
    fontSize: 12,
    marginLeft: 8,
    fontStyle: 'italic',
  },
});
