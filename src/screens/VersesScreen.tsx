import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share, TouchableOpacity, Dimensions } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { BibleVerse } from '../types/bible';
import type { BibleStackParamList } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainLayout from '../components/MainLayout';
import { BIBLE_VERSIONS, BibleVersion } from '../constants/bibleVersions';

type VersesRouteProp = RouteProp<BibleStackParamList, 'Verses'>;
type NavigationProp = NativeStackNavigationProp<BibleStackParamList>;

const { width } = Dimensions.get('window');
const isSmallScreen = width < 600;

type ViewMode = 'stacked' | 'parallel';

export default function VersesScreen() {
  const route = useRoute<VersesRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book, chapter, initialVerse } = route.params;
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeVersions, setActiveVersions] = useState<Set<string>>(new Set(['tzotzil', 'rv1960']));
  const [viewMode, setViewMode] = useState<ViewMode>('stacked');
  const scrollViewRef = useRef<ScrollView>(null);

  const loadVerses = async () => {
    try {
      setLoading(true);
      const verseData = await BibleService.getVerses(book, chapter);
      setVerses(verseData);
      setError(null);
    } catch (err) {
      console.error('Error loading verses:', err);
      setError('Error cargando versículos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVerses();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVerses();
  }, [book, chapter]);

  const toggleVersion = (versionId: string) => {
    const newActiveVersions = new Set(activeVersions);
    if (newActiveVersions.has(versionId)) {
      if (newActiveVersions.size > 1) {
        newActiveVersions.delete(versionId);
      }
    } else {
      newActiveVersions.add(versionId);
    }
    setActiveVersions(newActiveVersions);
  };

  const handleShare = async (verse: BibleVerse) => {
    try {
      let text = `${book} ${chapter}:${verse.verse}\n`;
      
      BIBLE_VERSIONS.forEach(version => {
        if (activeVersions.has(version.id)) {
          const verseText = verse[version.textField];
          if (verseText) {
            text += `\n${version.shortName}:\n${verseText}`;
          }
        }
      });
      
      await Share.share({
        message: `${text}\n\n- Tzotzil Bible`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateChapter = (direction: 'prev' | 'next') => {
    const newChapter = direction === 'prev' ? chapter - 1 : chapter + 1;
    if (newChapter >= 1) {
      navigation.replace('Verses', { book, chapter: newChapter });
    }
  };

  const getVerseText = (verse: BibleVerse, version: BibleVersion): string | undefined => {
    return verse[version.textField];
  };

  const renderVerseStacked = (verse: BibleVerse) => {
    const activeVersionsList = BIBLE_VERSIONS.filter(v => activeVersions.has(v.id));
    
    return (
      <TouchableOpacity
        key={verse.id || `${verse.chapter}-${verse.verse}`}
        style={[
          styles.verseCard,
          initialVerse === verse.verse && styles.highlightedVerse
        ]}
        onLongPress={() => handleShare(verse)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={initialVerse === verse.verse 
            ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
            : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
          style={styles.verseGradient}
        >
          <View style={styles.verseHeader}>
            <View style={styles.verseNumberBadge}>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
            </View>
            <View style={styles.verseActions}>
              <TouchableOpacity
                style={styles.nevinButton}
                onPress={() => navigation.navigate('VerseCommentary', {
                  book,
                  chapter,
                  verse: verse.verse,
                  textTzotzil: verse.text_tzotzil,
                  textSpanish: verse.text
                })}
              >
                <MaterialCommunityIcons name="robot" size={16} color="#00ff88" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare(verse)}
              >
                <MaterialCommunityIcons name="share-variant" size={18} color="#6b7c93" />
              </TouchableOpacity>
            </View>
          </View>
          
          {activeVersionsList.map((version, index) => {
            const verseText = getVerseText(verse, version);
            if (!verseText) return null;
            
            return (
              <React.Fragment key={version.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.textBlock}>
                  <View style={styles.languageHeader}>
                    <MaterialCommunityIcons name="translate" size={14} color={version.color} />
                    <Text style={[styles.languageLabel, { color: version.color }]}>
                      {version.shortName}
                    </Text>
                  </View>
                  <Text style={styles.verseText}>{verseText}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderVerseParallel = (verse: BibleVerse) => {
    const activeVersionsList = BIBLE_VERSIONS.filter(v => activeVersions.has(v.id));
    const columnWidth = activeVersionsList.length > 0 ? 100 / activeVersionsList.length : 100;
    
    return (
      <View
        key={verse.id || `${verse.chapter}-${verse.verse}`}
        style={[
          styles.parallelVerseContainer,
          initialVerse === verse.verse && styles.highlightedVerse
        ]}
      >
        <LinearGradient
          colors={initialVerse === verse.verse 
            ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
            : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
          style={styles.parallelGradient}
        >
          <View style={styles.parallelHeader}>
            <View style={styles.verseNumberBadge}>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
            </View>
            <View style={styles.verseActions}>
              <TouchableOpacity
                style={styles.nevinButton}
                onPress={() => navigation.navigate('VerseCommentary', {
                  book,
                  chapter,
                  verse: verse.verse,
                  textTzotzil: verse.text_tzotzil,
                  textSpanish: verse.text
                })}
              >
                <MaterialCommunityIcons name="robot" size={16} color="#00ff88" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() => handleShare(verse)}
              >
                <MaterialCommunityIcons name="share-variant" size={18} color="#6b7c93" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.parallelColumns}>
            {activeVersionsList.map((version, index) => {
              const verseText = getVerseText(verse, version);
              
              return (
                <View 
                  key={version.id} 
                  style={[
                    styles.parallelColumn,
                    { width: `${columnWidth}%` },
                    index > 0 && styles.parallelColumnBorder
                  ]}
                >
                  <View style={[styles.columnHeader, { borderBottomColor: version.color }]}>
                    <Text style={[styles.columnHeaderText, { color: version.color }]}>
                      {version.shortName}
                    </Text>
                  </View>
                  <Text style={styles.parallelVerseText}>
                    {verseText || '-'}
                  </Text>
                </View>
              );
            })}
          </View>
        </LinearGradient>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <MainLayout title={`${book} ${chapter}`} showBackButton>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#00f3ff" />
          <Text style={styles.loadingText}>Cargando versículos...</Text>
        </View>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title={`${book} ${chapter}`} showBackButton>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`${book} ${chapter}`} showBackButton>
      <View style={styles.container}>
        <View style={styles.controls}>
          <View style={styles.controlsLeft}>
            <View style={styles.versionToggles}>
              {BIBLE_VERSIONS.map(version => (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    styles.versionChip,
                    activeVersions.has(version.id) && { 
                      backgroundColor: `${version.color}20`,
                      borderColor: version.color 
                    }
                  ]}
                  onPress={() => toggleVersion(version.id)}
                >
                  <Text style={[
                    styles.versionChipText,
                    activeVersions.has(version.id) && { color: version.color }
                  ]}>
                    {version.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'parallel' && styles.viewModeButtonActive
              ]}
              onPress={() => setViewMode(viewMode === 'stacked' ? 'parallel' : 'stacked')}
            >
              <MaterialCommunityIcons 
                name={viewMode === 'parallel' ? 'view-parallel' : 'view-sequential'} 
                size={20} 
                color={viewMode === 'parallel' ? '#00ff88' : '#6b7c93'} 
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[styles.navButton, chapter <= 1 && styles.navButtonDisabled]}
              onPress={() => navigateChapter('prev')}
              disabled={chapter <= 1}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={chapter <= 1 ? '#6b7c93' : '#00f3ff'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateChapter('next')}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'parallel' && activeVersions.size >= 2 && (
          <View style={styles.parallelLegend}>
            {BIBLE_VERSIONS.filter(v => activeVersions.has(v.id)).map(version => (
              <View key={version.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: version.color }]} />
                <Text style={styles.legendText}>{version.name}</Text>
              </View>
            ))}
          </View>
        )}

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f3ff" />
          }
          showsVerticalScrollIndicator={false}
        >
          {activeVersions.size === 0 && (
            <View style={styles.warningCard}>
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.15)', 'rgba(255, 107, 107, 0.05)']}
                style={styles.warningGradient}
              >
                <MaterialCommunityIcons name="alert" size={24} color="#ff6b6b" />
                <Text style={styles.warningText}>
                  Selecciona al menos una versión para ver los versículos
                </Text>
              </LinearGradient>
            </View>
          )}

          {verses.map((verse) => 
            viewMode === 'parallel' && activeVersions.size >= 2
              ? renderVerseParallel(verse)
              : renderVerseStacked(verse)
          )}
          
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.bottomNavCard, chapter <= 1 && styles.bottomNavCardDisabled]}
              onPress={() => chapter > 1 && navigateChapter('prev')}
              disabled={chapter <= 1}
            >
              <MaterialCommunityIcons 
                name="chevron-left" 
                size={24} 
                color={chapter <= 1 ? '#6b7c93' : '#00f3ff'} 
              />
              <Text style={[styles.bottomNavText, chapter <= 1 && styles.bottomNavTextDisabled]}>
                Anterior
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.bottomNavCard}
              onPress={() => navigateChapter('next')}
            >
              <Text style={styles.bottomNavText}>Siguiente</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#6b7c93',
    fontSize: 16,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.2)',
  },
  controlsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  versionToggles: {
    flexDirection: 'row',
    gap: 8,
  },
  versionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
  },
  versionChipText: {
    color: '#6b7c93',
    fontSize: 12,
    fontWeight: '600',
  },
  viewModeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(20, 30, 45, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  viewModeButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    borderColor: '#00ff88',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  parallelLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingVertical: 8,
    backgroundColor: 'rgba(10, 14, 20, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.1)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#6b7c93',
    fontSize: 11,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  warningCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  warningGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  warningText: {
    marginLeft: 12,
    color: '#ff6b6b',
    flex: 1,
  },
  verseCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  highlightedVerse: {
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  verseGradient: {
    padding: 16,
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  verseNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a0e14',
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nevinButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
  },
  shareButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 124, 147, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textBlock: {
    marginVertical: 8,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  languageLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  verseText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#e6f3ff',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
    marginVertical: 12,
  },
  parallelVerseContainer: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  parallelGradient: {
    padding: 16,
  },
  parallelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parallelColumns: {
    flexDirection: 'row',
  },
  parallelColumn: {
    paddingHorizontal: 8,
  },
  parallelColumnBorder: {
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 243, 255, 0.2)',
  },
  columnHeader: {
    borderBottomWidth: 2,
    paddingBottom: 6,
    marginBottom: 10,
  },
  columnHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  parallelVerseText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#e6f3ff',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  bottomNavCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  bottomNavCardDisabled: {
    opacity: 0.5,
  },
  bottomNavText: {
    fontSize: 13,
    color: '#00f3ff',
    fontWeight: '500',
  },
  bottomNavTextDisabled: {
    color: '#6b7c93',
  },
  errorText: {
    color: '#ff6b6b',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 16,
  },
});
