import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Share, TouchableOpacity, Dimensions, Modal, Pressable } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRoute, useNavigation, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BibleService } from '../services/BibleService';
import type { BibleVerse } from '../types/bible';
import type { BibleStackParamList } from '../types/navigation';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MainLayout from '../components/MainLayout';
import VersionToggle, { TogglePosition } from '../components/VersionToggle';
import { TZOTZIL_VERSION, SECONDARY_VERSIONS, BibleVersion, getVersionById } from '../constants/bibleVersions';

const DEFAULT_SECONDARY_VERSION = 'rv1960';

const getAvailableSecondaryVersion = (versionId: string): BibleVersion => {
  const version = getVersionById(versionId);
  if (version && version.isAvailable && !version.isPrimary) {
    return version;
  }
  const defaultVersion = getVersionById(DEFAULT_SECONDARY_VERSION);
  return defaultVersion!;
};

type VersesRouteProp = RouteProp<BibleStackParamList, 'Verses'>;
type NavigationProp = NativeStackNavigationProp<BibleStackParamList>;

const { width } = Dimensions.get('window');
const isSmallScreen = width < 600;

type ViewMode = 'stacked' | 'parallel';
type DisplayMode = 'tzotzil' | 'both' | 'secondary';

const displayModeToToggle = (mode: DisplayMode): TogglePosition => {
  switch (mode) {
    case 'tzotzil': return 'left';
    case 'both': return 'center';
    case 'secondary': return 'right';
  }
};

const toggleToDisplayMode = (position: TogglePosition): DisplayMode => {
  switch (position) {
    case 'left': return 'tzotzil';
    case 'center': return 'both';
    case 'right': return 'secondary';
  }
};

const FAVORITES_KEY = 'verse_favorites';
const SELECTED_VERSION_KEY = 'selected_secondary_version';
const DISPLAY_MODE_KEY = 'display_mode';

export default function VersesScreen() {
  const route = useRoute<VersesRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { book, chapter, initialVerse } = route.params;
  
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('both');
  const [selectedSecondaryVersion, setSelectedSecondaryVersion] = useState('rv1960');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<BibleVerse | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

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

  const loadPreferences = async () => {
    try {
      const [savedVersion, savedDisplayMode] = await Promise.all([
        AsyncStorage.getItem(SELECTED_VERSION_KEY),
        AsyncStorage.getItem(DISPLAY_MODE_KEY),
      ]);
      
      let normalizedVersion = DEFAULT_SECONDARY_VERSION;
      if (savedVersion) {
        const version = getVersionById(savedVersion);
        if (version && version.isAvailable && !version.isPrimary) {
          normalizedVersion = savedVersion;
        } else {
          await AsyncStorage.setItem(SELECTED_VERSION_KEY, DEFAULT_SECONDARY_VERSION);
        }
      }
      setSelectedSecondaryVersion(normalizedVersion);
      
      if (savedDisplayMode !== null && ['tzotzil', 'both', 'secondary'].includes(savedDisplayMode)) {
        setDisplayMode(savedDisplayMode as DisplayMode);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = async (versionId: string, mode: DisplayMode) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(SELECTED_VERSION_KEY, versionId),
        AsyncStorage.setItem(DISPLAY_MODE_KEY, mode),
      ]);
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadVerses();
    setRefreshing(false);
  };

  useEffect(() => {
    loadVerses();
    loadFavorites();
    loadPreferences();
  }, [book, chapter]);

  const loadFavorites = async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(new Set(JSON.parse(stored)));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (verse: BibleVerse) => {
    const verseKey = `${book}-${chapter}-${verse.verse}`;
    const newFavorites = new Set(favorites);
    
    if (newFavorites.has(verseKey)) {
      newFavorites.delete(verseKey);
    } else {
      newFavorites.add(verseKey);
    }
    
    setFavorites(newFavorites);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavorites]));
    setMenuVisible(false);
    setSelectedVerse(null);
  };

  const isFavorite = (verse: BibleVerse) => {
    return favorites.has(`${book}-${chapter}-${verse.verse}`);
  };

  const openVerseMenu = (verse: BibleVerse) => {
    setSelectedVerse(verse);
    setMenuVisible(true);
  };

  const askNevinAboutVerse = (verse: BibleVerse) => {
    setMenuVisible(false);
    setSelectedVerse(null);
    
    const question = `Nevin, explícame este versículo: ${book} ${chapter}:${verse.verse}`;
    
    navigation.dispatch(
      CommonActions.navigate({
        name: 'MainTabs',
        params: {
          screen: 'NevinTab',
          params: {
            initialQuestion: question,
            verseContext: {
              book,
              chapter,
              verse: verse.verse,
              textTzotzil: verse.text_tzotzil,
              textSpanish: verse.text
            }
          }
        },
        merge: true
      })
    );
  };

  const handleDisplayModeChange = (mode: DisplayMode) => {
    setDisplayMode(mode);
    savePreferences(selectedSecondaryVersion, mode);
  };

  const handleVersionSelect = (versionId: string) => {
    const version = getVersionById(versionId);
    if (version && version.isAvailable) {
      setSelectedSecondaryVersion(versionId);
      savePreferences(versionId, displayMode);
    }
    setDropdownVisible(false);
  };

  const handleShare = async (verse: BibleVerse, secondaryVersion: BibleVersion) => {
    try {
      let text = `${book} ${chapter}:${verse.verse}\n`;
      
      if (displayMode === 'tzotzil') {
        text += `\n${TZOTZIL_VERSION.shortName}:\n${verse.text_tzotzil}`;
      } else if (displayMode === 'secondary') {
        const verseText = verse[secondaryVersion.textField];
        if (verseText) {
          text += `\n${secondaryVersion.shortName}:\n${verseText}`;
        }
      } else {
        text += `\n${TZOTZIL_VERSION.shortName}:\n${verse.text_tzotzil}`;
        const verseText = verse[secondaryVersion.textField];
        if (verseText) {
          text += `\n\n${secondaryVersion.shortName}:\n${verseText}`;
        }
      }
      
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

  const currentSecondaryVersion = getAvailableSecondaryVersion(selectedSecondaryVersion);

  const renderVerseSingle = (verse: BibleVerse, mode: 'tzotzil' | 'secondary') => {
    const verseText = mode === 'tzotzil' 
      ? verse.text_tzotzil 
      : getVerseText(verse, currentSecondaryVersion) || verse.text_tzotzil;
    
    return (
      <TouchableOpacity
        key={verse.id || `${verse.chapter}-${verse.verse}`}
        style={[
          styles.verseCard,
          initialVerse === verse.verse && styles.highlightedVerse
        ]}
        onLongPress={() => handleShare(verse, currentSecondaryVersion)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={initialVerse === verse.verse 
            ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
            : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
          style={styles.verseGradient}
        >
          <View style={styles.singleVerseHeader}>
            <View style={styles.singleHeaderSpacer}>
              {isFavorite(verse) && (
                <MaterialCommunityIcons name="heart" size={14} color="#ff6b6b" />
              )}
            </View>
            
            <View style={styles.verseNumberBadge}>
              <Text style={styles.verseNumber}>{verse.verse}</Text>
            </View>
            
            <View style={styles.singleHeaderSpacer}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => openVerseMenu(verse)}
              >
                <MaterialCommunityIcons name="dots-vertical" size={20} color="#6b7c93" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.textBlock}>
            <Text style={styles.verseText}>{verseText}</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderVerseParallel = (verse: BibleVerse) => {
    const secondaryVersion = currentSecondaryVersion;
    
    return (
      <TouchableOpacity
        key={verse.id || `${verse.chapter}-${verse.verse}`}
        style={[
          styles.parallelVerseCard,
          initialVerse === verse.verse && styles.highlightedVerse
        ]}
        onLongPress={() => handleShare(verse, currentSecondaryVersion)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={initialVerse === verse.verse 
            ? ['rgba(0, 255, 136, 0.15)', 'rgba(0, 255, 136, 0.08)']
            : ['rgba(18, 28, 42, 0.95)', 'rgba(12, 22, 36, 0.98)']}
          style={styles.parallelVerseGradient}
        >
          <View style={styles.parallelHeaderRow}>
            <View style={styles.parallelHeaderSpacer}>
              {isFavorite(verse) && (
                <MaterialCommunityIcons name="heart" size={14} color="#ff6b6b" />
              )}
            </View>
            
            <View style={styles.parallelVerseNumberBadge}>
              <Text style={styles.parallelVerseNumber}>{verse.verse}</Text>
            </View>
            
            <View style={styles.parallelHeaderSpacer}>
              <TouchableOpacity
                style={styles.parallelMenuButton}
                onPress={() => openVerseMenu(verse)}
              >
                <MaterialCommunityIcons name="dots-vertical" size={18} color="#6b7c93" />
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.parallelColumns}>
            <View style={styles.parallelColumnLeft}>
              <Text style={styles.parallelVerseText}>{verse.text_tzotzil}</Text>
            </View>
            
            <View style={styles.holographicDividerContainer}>
              <LinearGradient
                colors={['rgba(0, 243, 255, 0)', 'rgba(0, 243, 255, 0.6)', 'rgba(0, 255, 200, 0.9)', 'rgba(0, 243, 255, 0.6)', 'rgba(0, 243, 255, 0)']}
                style={styles.holographicDivider}
              />
              <View style={styles.holographicGlow} />
            </View>
            
            <View style={styles.parallelColumnRight}>
              <Text style={styles.parallelVerseText}>{getVerseText(verse, secondaryVersion) || '-'}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
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
          <VersionToggle
            value={displayModeToToggle(displayMode)}
            onChange={(position) => handleDisplayModeChange(toggleToDisplayMode(position))}
            onRightDoubleTap={() => setDropdownVisible(true)}
            leftLabel={TZOTZIL_VERSION.shortName}
            centerLabel="Ambos"
            rightLabel={currentSecondaryVersion.shortName}
            leftColor={TZOTZIL_VERSION.color}
            rightColor={currentSecondaryVersion.color}
          />
        </View>

        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00f3ff" />
          }
          showsVerticalScrollIndicator={false}
        >
          {verses.map((verse) => {
            if (displayMode === 'both') {
              return renderVerseParallel(verse);
            } else if (displayMode === 'tzotzil') {
              return renderVerseSingle(verse, 'tzotzil');
            } else {
              return renderVerseSingle(verse, 'secondary');
            }
          })}
          
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

        <Modal
          visible={menuVisible}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setMenuVisible(false);
            setSelectedVerse(null);
          }}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setMenuVisible(false);
              setSelectedVerse(null);
            }}
          >
            <View style={styles.menuContainer}>
              <LinearGradient
                colors={['rgba(25, 35, 50, 0.98)', 'rgba(15, 25, 40, 0.98)']}
                style={styles.menuGradient}
              >
                {selectedVerse && (
                  <Text style={styles.menuTitle}>
                    {book} {chapter}:{selectedVerse.verse}
                  </Text>
                )}
                
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => selectedVerse && handleShare(selectedVerse, currentSecondaryVersion)}
                >
                  <MaterialCommunityIcons name="share-variant" size={20} color="#00f3ff" />
                  <Text style={styles.menuItemText}>Compartir</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => selectedVerse && askNevinAboutVerse(selectedVerse)}
                >
                  <MaterialCommunityIcons name="creation" size={20} color="#00ff88" />
                  <Text style={styles.menuItemText}>Preguntar a Nevin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => selectedVerse && toggleFavorite(selectedVerse)}
                >
                  <MaterialCommunityIcons 
                    name={selectedVerse && isFavorite(selectedVerse) ? "heart" : "heart-outline"} 
                    size={20} 
                    color="#ff6b6b" 
                  />
                  <Text style={styles.menuItemText}>
                    {selectedVerse && isFavorite(selectedVerse) ? 'Quitar de favoritos' : 'Marcar como favorito'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.menuItem, styles.menuItemLast]}
                  onPress={() => {
                    setMenuVisible(false);
                    setSelectedVerse(null);
                  }}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#6b7c93" />
                  <Text style={[styles.menuItemText, { color: '#6b7c93' }]}>Cerrar</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Pressable>
        </Modal>

        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.dropdownContainer}>
              <LinearGradient
                colors={['rgba(25, 35, 50, 0.98)', 'rgba(15, 25, 40, 0.98)']}
                style={styles.dropdownGradient}
              >
                <Text style={styles.dropdownTitle}>Seleccionar versión</Text>
                
                {SECONDARY_VERSIONS.map((version) => (
                  <TouchableOpacity
                    key={version.id}
                    style={[
                      styles.dropdownItem,
                      !version.isAvailable && styles.dropdownItemDisabled,
                      selectedSecondaryVersion === version.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => version.isAvailable && handleVersionSelect(version.id)}
                    disabled={!version.isAvailable}
                  >
                    <View style={styles.dropdownItemLeft}>
                      <View style={[styles.versionIndicator, { backgroundColor: version.color, opacity: version.isAvailable ? 1 : 0.4, marginRight: 10 }]} />
                      <View>
                        <Text style={[
                          styles.dropdownItemText,
                          !version.isAvailable && styles.dropdownItemTextDisabled
                        ]}>
                          {version.shortName}
                        </Text>
                        <Text style={[
                          styles.dropdownItemSubtext,
                          !version.isAvailable && styles.dropdownItemTextDisabled
                        ]}>
                          {version.name}
                        </Text>
                      </View>
                    </View>
                    {!version.isAvailable ? (
                      <View style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonText}>Próximamente</Text>
                      </View>
                    ) : selectedSecondaryVersion === version.id ? (
                      <MaterialCommunityIcons name="check" size={20} color="#00ff88" />
                    ) : null}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[styles.dropdownItem, styles.dropdownItemLast]}
                  onPress={() => setDropdownVisible(false)}
                >
                  <MaterialCommunityIcons name="close" size={20} color="#6b7c93" />
                  <Text style={[styles.dropdownItemText, { color: '#6b7c93', marginLeft: 12 }]}>Cerrar</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </Pressable>
        </Modal>
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.12)',
    backgroundColor: 'rgba(10, 14, 20, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.18)',
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  primaryVersionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.25)',
  },
  versionIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  primaryVersionText: {
    color: '#00ff88',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  toggleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 124, 147, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 124, 147, 0.25)',
    gap: 4,
  },
  toggleOptionCenter: {
    marginHorizontal: 6,
  },
  toggleOptionActive: {
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    borderColor: 'rgba(0, 243, 255, 0.4)',
  },
  toggleOptionText: {
    color: '#6b7c93',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  toggleOptionTextActive: {
    color: '#00f3ff',
  },
  versionDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 243, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  versionDropdownText: {
    color: '#00f3ff',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  versionPlaceholder: {
    width: 70,
  },
  versionSelectButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(107, 124, 147, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 124, 147, 0.25)',
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
  parallelVerseCard: {
    marginBottom: 14,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.18)',
  },
  parallelVerseGradient: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  parallelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  parallelHeaderSpacer: {
    flex: 1,
    alignItems: 'center',
  },
  parallelVerseNumberBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#00f3ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  parallelVerseNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0a0e14',
  },
  parallelMenuButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  parallelColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  parallelColumnLeft: {
    flex: 1,
    paddingRight: 12,
  },
  parallelColumnRight: {
    flex: 1,
    paddingLeft: 12,
  },
  holographicDividerContainer: {
    width: 3,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holographicDivider: {
    width: 2,
    height: '100%',
    borderRadius: 1,
  },
  holographicGlow: {
    position: 'absolute',
    width: 8,
    height: '100%',
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    borderRadius: 4,
  },
  parallelVerseText: {
    fontSize: 13,
    lineHeight: 21,
    color: '#e0ecf8',
  },
  verseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  singleVerseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  singleHeaderSpacer: {
    flex: 1,
    alignItems: 'center',
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
  verseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  menuGradient: {
    padding: 16,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginBottom: 16,
    textAlign: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.15)',
  },
  menuItemLast: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  menuItemText: {
    fontSize: 15,
    color: '#e6f3ff',
    marginLeft: 12,
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
  dropdownContainer: {
    width: '85%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  dropdownGradient: {
    padding: 16,
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00f3ff',
    marginBottom: 16,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 243, 255, 0.15)',
    borderRadius: 8,
  },
  dropdownItemSelected: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  dropdownItemDisabled: {
    opacity: 0.6,
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
    marginTop: 8,
    justifyContent: 'flex-start',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#e6f3ff',
    fontWeight: '600',
  },
  dropdownItemSubtext: {
    fontSize: 11,
    color: '#6b7c93',
    marginTop: 2,
  },
  dropdownItemTextDisabled: {
    color: '#6b7c93',
  },
  comingSoonBadge: {
    backgroundColor: 'rgba(155, 89, 182, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(155, 89, 182, 0.4)',
  },
  comingSoonText: {
    fontSize: 10,
    color: '#9b59b6',
    fontWeight: '600',
  },
});
