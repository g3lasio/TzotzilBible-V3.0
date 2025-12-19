import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Linking, Share, Image } from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NevinAIService } from '../services/NevinAIService';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';
import type { RootStackParamList } from '../types/navigation';

const APP_VERSION = '2.1.0';
const FEEDBACK_EMAIL = 'feedback@tzotzilbible.app';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
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

  const handleClearHistory = () => {
    Alert.alert(
      'Limpiar Historial',
      '¿Estás seguro? Esto eliminará tu historial de conversaciones con Nevin.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: async () => {
            await NevinAIService.clearChatHistory();
            Alert.alert('Listo', 'Historial eliminado correctamente.');
          }
        }
      ]
    );
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent(`Feedback - Tzotzil Bible v${APP_VERSION}`);
    const body = encodeURIComponent('\n\n---\nDispositivo: \nVersión: ' + APP_VERSION);
    Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: '¡Descarga Tzotzil Bible! Una Biblia bilingüe en Tzotzil y Español con asistente AI. https://tzotzilbible.app',
        title: 'Tzotzil Bible'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    saveSettings('fontSize', size);
  };

  const getFontSizeLabel = () => {
    switch (fontSize) {
      case 'small': return 'Pequeño';
      case 'large': return 'Grande';
      default: return 'Mediano';
    }
  };

  return (
    <MainLayout title="Ajustes">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APARIENCIA</Text>
          <View style={styles.settingCard}>
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="format-size" size={24} color="#00f3ff" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Tamaño de Fuente</Text>
                    <Text style={styles.settingDesc}>{getFontSizeLabel()}</Text>
                  </View>
                </View>
                <View style={styles.fontSizeControl}>
                  <TouchableOpacity 
                    style={[styles.fontButton, fontSize === 'small' && styles.fontButtonActive]}
                    onPress={() => handleFontSizeChange('small')}
                  >
                    <Text style={[styles.fontButtonText, fontSize === 'small' && styles.fontButtonTextActive]}>A</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.fontButton, fontSize === 'medium' && styles.fontButtonActive]}
                    onPress={() => handleFontSizeChange('medium')}
                  >
                    <Text style={[styles.fontButtonTextMedium, fontSize === 'medium' && styles.fontButtonTextActive]}>A</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.fontButton, fontSize === 'large' && styles.fontButtonActive]}
                    onPress={() => handleFontSizeChange('large')}
                  >
                    <Text style={[styles.fontButtonTextLarge, fontSize === 'large' && styles.fontButtonTextActive]}>A</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS</Text>
          <TouchableOpacity 
            style={styles.settingCard}
            onPress={handleClearHistory}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="delete-outline" size={24} color="#ff6b6b" />
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: '#ff6b6b' }]}>Limpiar Historial</Text>
                    <Text style={styles.settingDesc}>Eliminar conversaciones con Nevin</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Comunidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>COMUNIDAD</Text>
          
          <TouchableOpacity 
            style={styles.settingCard}
            onPress={handleSendFeedback}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="message-text-outline" size={24} color="#00ff88" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Enviar Comentarios</Text>
                    <Text style={styles.settingDesc}>Ayúdanos a mejorar la app</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard}
            onPress={handleShareApp}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="share-variant" size={24} color="#00f3ff" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Compartir App</Text>
                    <Text style={styles.settingDesc}>Recomienda Tzotzil Bible</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard}
            onPress={() => navigation.navigate('About')}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="information-outline" size={24} color="#00ff88" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Acerca de Nosotros</Text>
                    <Text style={styles.settingDesc}>Conoce más sobre la app</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard}
            onPress={() => navigation.navigate('ContactSupport')}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="headset" size={24} color="#00f3ff" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Contacto y Soporte</Text>
                    <Text style={styles.settingDesc}>Obtén ayuda o envía sugerencias</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LEGAL</Text>
          
          <TouchableOpacity 
            style={styles.settingCard}
            onPress={() => navigation.navigate('PrivacyPolicy')}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={24} color="#00ff88" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Política de Privacidad</Text>
                    <Text style={styles.settingDesc}>Cómo manejamos tus datos</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard}
            onPress={() => navigation.navigate('TermsOfService')}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="file-document-outline" size={24} color="#00f3ff" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Términos de Servicio</Text>
                    <Text style={styles.settingDesc}>Condiciones de uso de la app</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingCard}
            onPress={() => navigation.navigate('LegalDisclaimer')}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#ffd700" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Aviso Legal</Text>
                    <Text style={styles.settingDesc}>IA, contenido teológico y limitaciones</Text>
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#6b7c93" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Información */}
        <View style={styles.infoContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.appLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Tzotzil Bible</Text>
          <Text style={styles.versionText}>Versión {APP_VERSION}</Text>
          <Text style={styles.infoNote}>
            La Biblia funciona sin internet.{'\n'}
            Nevin AI requiere conexión.
          </Text>
          <Text style={styles.copyright}>© 2025 Tzotzil Bible</Text>
        </View>

      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00f3ff',
    letterSpacing: 1,
    marginBottom: 12,
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  settingCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  settingGradient: {
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingInfo: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e6f3ff',
  },
  settingDesc: {
    fontSize: 13,
    color: '#6b7c93',
    marginTop: 2,
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  fontButtonActive: {
    backgroundColor: 'rgba(0, 255, 136, 0.2)',
    borderColor: '#00ff88',
  },
  fontButtonText: {
    fontSize: 12,
    color: '#6b7c93',
    fontWeight: 'bold',
  },
  fontButtonTextMedium: {
    fontSize: 16,
    color: '#6b7c93',
    fontWeight: 'bold',
  },
  fontButtonTextLarge: {
    fontSize: 20,
    color: '#6b7c93',
    fontWeight: 'bold',
  },
  fontButtonTextActive: {
    color: '#00ff88',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    padding: 24,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  appLogo: {
    width: 60,
    height: 60,
  },
  appName: {
    fontSize: 22,
    fontFamily: FONTS.bold,
    color: '#00ff88',
    marginBottom: 4,
    letterSpacing: 1,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#00f3ff',
    marginBottom: 12,
  },
  infoNote: {
    fontSize: 12,
    color: '#6b7c93',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  copyright: {
    fontSize: 11,
    color: '#4a5568',
    fontFamily: FONTS.regular,
  },
});
