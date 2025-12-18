import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { NevinAIService } from '../services/NevinAIService';
import MainLayout from '../components/MainLayout';

export default function SettingsScreen() {
  const [bilingualMode, setBilingualMode] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<'tzotzil' | 'rv1960'>('tzotzil');
  const [fontSize, setFontSize] = useState('medium');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setBilingualMode(parsed.bilingualMode ?? true);
        setSelectedVersion(parsed.selectedVersion ?? 'tzotzil');
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

  const handleVersionChange = (version: 'tzotzil' | 'rv1960') => {
    setSelectedVersion(version);
    saveSettings('selectedVersion', version);
  };

  return (
    <MainLayout title="Ajustes">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VERSIÓN BÍBLICA</Text>
          <View style={styles.versionContainer}>
            <TouchableOpacity
              style={[styles.versionCard, selectedVersion === 'tzotzil' && styles.versionCardActive]}
              onPress={() => handleVersionChange('tzotzil')}
            >
              <LinearGradient
                colors={selectedVersion === 'tzotzil' 
                  ? ['rgba(0, 255, 136, 0.2)', 'rgba(0, 255, 136, 0.1)']
                  : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
                style={styles.versionGradient}
              >
                <MaterialCommunityIcons 
                  name={selectedVersion === 'tzotzil' ? 'radiobox-marked' : 'radiobox-blank'} 
                  size={24} 
                  color={selectedVersion === 'tzotzil' ? '#00ff88' : '#6b7c93'} 
                />
                <View style={styles.versionInfo}>
                  <Text style={[styles.versionName, selectedVersion === 'tzotzil' && styles.versionNameActive]}>
                    Tzotzil
                  </Text>
                  <Text style={styles.versionDesc}>Biblia en lengua Tzotzil</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.versionCard, selectedVersion === 'rv1960' && styles.versionCardActive]}
              onPress={() => handleVersionChange('rv1960')}
            >
              <LinearGradient
                colors={selectedVersion === 'rv1960' 
                  ? ['rgba(0, 243, 255, 0.2)', 'rgba(0, 243, 255, 0.1)']
                  : ['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
                style={styles.versionGradient}
              >
                <MaterialCommunityIcons 
                  name={selectedVersion === 'rv1960' ? 'radiobox-marked' : 'radiobox-blank'} 
                  size={24} 
                  color={selectedVersion === 'rv1960' ? '#00f3ff' : '#6b7c93'} 
                />
                <View style={styles.versionInfo}>
                  <Text style={[styles.versionName, selectedVersion === 'rv1960' && styles.versionNameActiveCyan]}>
                    Reina-Valera 1960
                  </Text>
                  <Text style={styles.versionDesc}>Reina-Valera 1960</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTENIDO</Text>
          <View style={styles.settingCard}>
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="translate" size={24} color="#00f3ff" />
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Modo Bilingüe</Text>
                    <Text style={styles.settingDesc}>Mostrar texto en español y tzotzil</Text>
                  </View>
                </View>
                <Switch
                  value={bilingualMode}
                  onValueChange={(value) => {
                    setBilingualMode(value);
                    saveSettings('bilingualMode', value);
                  }}
                  color="#00ff88"
                />
              </View>
            </LinearGradient>
          </View>
        </View>

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
                    <Text style={styles.settingDesc}>
                      {fontSize === 'small' ? 'Pequeño' : fontSize === 'large' ? 'Grande' : 'Mediano'}
                    </Text>
                  </View>
                </View>
                <View style={styles.fontSizeControl}>
                  <TouchableOpacity 
                    style={[styles.fontButton, fontSize === 'small' && styles.fontButtonDisabled]}
                    onPress={() => {
                      setFontSize('small');
                      saveSettings('fontSize', 'small');
                    }}
                    disabled={fontSize === 'small'}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color={fontSize === 'small' ? '#6b7c93' : '#00f3ff'} />
                  </TouchableOpacity>
                  <Text style={styles.fontSizeIndicator}>A</Text>
                  <TouchableOpacity 
                    style={[styles.fontButton, fontSize === 'large' && styles.fontButtonDisabled]}
                    onPress={() => {
                      setFontSize('large');
                      saveSettings('fontSize', 'large');
                    }}
                    disabled={fontSize === 'large'}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color={fontSize === 'large' ? '#6b7c93' : '#00f3ff'} />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DATOS</Text>
          <TouchableOpacity 
            style={styles.settingCard}
            onPress={handleClearData}
          >
            <LinearGradient
              colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
              style={styles.settingGradient}
            >
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <MaterialCommunityIcons name="delete" size={24} color="#ff6b6b" />
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: '#ff6b6b' }]}>Limpiar Historial</Text>
                    <Text style={styles.settingDesc}>Eliminar conversaciones con Nevin</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Versión 2.1.0</Text>
          <Text style={styles.infoSubtext}>Tzotzil Bible</Text>
          <Text style={styles.infoNote}>
            La Biblia funciona completamente sin internet.{'\n'}
            Nevin AI requiere conexión a internet.
          </Text>
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
  versionContainer: {
    gap: 12,
  },
  versionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  versionCardActive: {
    borderColor: 'rgba(0, 255, 136, 0.5)',
  },
  versionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  versionInfo: {
    marginLeft: 16,
  },
  versionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e6f3ff',
  },
  versionNameActive: {
    color: '#00ff88',
  },
  versionNameActiveCyan: {
    color: '#00f3ff',
  },
  versionDesc: {
    fontSize: 13,
    color: '#6b7c93',
    marginTop: 2,
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
  },
  fontButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 243, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontButtonDisabled: {
    backgroundColor: 'rgba(107, 124, 147, 0.1)',
  },
  fontSizeIndicator: {
    fontSize: 18,
    color: '#e6f3ff',
    marginHorizontal: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
    padding: 20,
  },
  infoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00f3ff',
    textShadowColor: '#00f3ff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6b7c93',
    marginTop: 4,
  },
  infoNote: {
    fontSize: 12,
    color: '#6b7c93',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});
