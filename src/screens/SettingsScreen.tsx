import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, Alert, TouchableOpacity,
  Linking, Share, Image, Switch, Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NevinAIService } from '../services/NevinAIService';
import NotificationService from '../services/NotificationService';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';
import type { RootStackParamList } from '../types/navigation';

const APP_VERSION = '7.0.0';
const FEEDBACK_EMAIL = 'feedback@tzotzilbible.app';
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const COLORS = {
  reading:       '#00F3FF',
  nevin:         '#FFD166',
  notifications: '#00FF88',
  community:     '#A78BFA',
  danger:        '#FF6B6B',
};

export default function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [fontSize, setFontSize] = useState('medium');
  const [nevinStyle, setNevinStyle] = useState<'devocional' | 'academico' | 'conversacional'>('devocional');
  const [dailyVerseEnabled, setDailyVerseEnabled] = useState(false);
  const [readingReminderEnabled, setReadingReminderEnabled] = useState(false);

  useEffect(() => { loadSettings(); checkNotificationStatus(); }, []);

  const loadSettings = async () => {
    try {
      const raw = await AsyncStorage.getItem('userSettings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.fontSize) setFontSize(s.fontSize);
        if (s.nevinStyle) setNevinStyle(s.nevinStyle);
        if (s.dailyVerseEnabled !== undefined) setDailyVerseEnabled(s.dailyVerseEnabled);
        if (s.readingReminderEnabled !== undefined) setReadingReminderEnabled(s.readingReminderEnabled);
      }
    } catch (e) { console.error('Error loading settings:', e); }
  };

  const checkNotificationStatus = async () => {
    try {
      const enabled = await NotificationService.areNotificationsEnabled();
      if (!enabled) { setDailyVerseEnabled(false); setReadingReminderEnabled(false); }
    } catch (e) {}
  };

  const saveSetting = async (key: string, value: any) => {
    try {
      const raw = await AsyncStorage.getItem('userSettings');
      const current = raw ? JSON.parse(raw) : {};
      await AsyncStorage.setItem('userSettings', JSON.stringify({ ...current, [key]: value }));
    } catch (e) { console.error('Error saving setting:', e); }
  };

  const handleFontSize = (size: string) => { setFontSize(size); saveSetting('fontSize', size); };

  const handleNevinStyle = (style: 'devocional' | 'academico' | 'conversacional') => {
    setNevinStyle(style); saveSetting('nevinStyle', style);
  };

  const handleDailyVerseToggle = async (value: boolean) => {
    if (value) {
      try {
        const granted = await NotificationService.requestPermissions();
        if (!granted) { Alert.alert('Permisos requeridos', 'Activa las notificaciones en los ajustes del sistema.'); return; }
        await NotificationService.scheduleDailyReminder(7, 0);
      } catch (e) {}
    } else { try { await NotificationService.cancelDailyReminder(); } catch (e) {} }
    setDailyVerseEnabled(value); saveSetting('dailyVerseEnabled', value);
  };

  const handleReadingReminderToggle = async (value: boolean) => {
    if (value) {
      try {
        const granted = await NotificationService.requestPermissions();
        if (!granted) { Alert.alert('Permisos requeridos', 'Activa las notificaciones en los ajustes del sistema.'); return; }
      } catch (e) {}
    }
    setReadingReminderEnabled(value); saveSetting('readingReminderEnabled', value);
  };

  const handleClearHistory = () => {
    Alert.alert('Limpiar Historial de Nevin', '¿Estás seguro? Esto eliminará todas tus conversaciones con Nevin permanentemente.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpiar', style: 'destructive', onPress: async () => { await NevinAIService.clearChatHistory(); Alert.alert('✓ Listo', 'Historial eliminado correctamente.'); } },
    ]);
  };

  const handleSendFeedback = () => {
    const subject = encodeURIComponent(`Feedback — Tzotzil Bible v${APP_VERSION}`);
    const body = encodeURIComponent('\n\n---\nDispositivo: \nVersión: ' + APP_VERSION);
    Linking.openURL(`mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`);
  };

  const handleShareApp = async () => {
    try { await Share.share({ message: '¡Descarga Tzotzil Bible! Una Biblia bilingüe en Tzotzil y Español con asistente AI. https://tzotzilbible.app', title: 'Tzotzil Bible' }); }
    catch (e) { console.error('Error sharing:', e); }
  };

  const SettingRow = ({ icon, iconColor, title, desc, onPress, right, titleColor }: {
    icon: string; iconColor: string; title: string; desc?: string;
    onPress?: () => void; right?: React.ReactNode; titleColor?: string;
  }) => (
    <TouchableOpacity style={styles.settingCard} onPress={onPress} activeOpacity={onPress ? 0.7 : 1} disabled={!onPress && !right}>
      <LinearGradient colors={['rgba(20,30,45,0.8)', 'rgba(15,25,40,0.9)']} style={styles.settingGradient}>
        <View style={styles.settingRow}>
          <View style={[styles.iconBadge, { backgroundColor: `${iconColor}18` }]}>
            <MaterialCommunityIcons name={icon as any} size={20} color={iconColor} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, titleColor ? { color: titleColor } : {}]}>{title}</Text>
            {desc ? <Text style={styles.settingDesc}>{desc}</Text> : null}
          </View>
          {right ?? (onPress ? <MaterialCommunityIcons name="chevron-right" size={22} color="#4A5568" /> : null)}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const FontSizeSelector = () => (
    <View style={styles.settingCard}>
      <LinearGradient colors={['rgba(20,30,45,0.8)', 'rgba(15,25,40,0.9)']} style={styles.settingGradient}>
        <View style={styles.settingRow}>
          <View style={[styles.iconBadge, { backgroundColor: `${COLORS.reading}18` }]}>
            <MaterialCommunityIcons name="format-size" size={20} color={COLORS.reading} />
          </View>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Tamaño de Fuente</Text>
            <Text style={styles.settingDesc}>Texto de versículos</Text>
          </View>
          <View style={styles.fontSizeControl}>
            {(['small', 'medium', 'large'] as const).map((size, i) => (
              <TouchableOpacity key={size} style={[styles.fontButton, fontSize === size && styles.fontButtonActive]} onPress={() => handleFontSize(size)}>
                <Text style={[styles.fontButtonText, { fontSize: 11 + i * 3 }, fontSize === size && styles.fontButtonTextActive]}>A</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const NevinStyleSelector = () => {
    const options: { key: 'devocional' | 'academico' | 'conversacional'; label: string }[] = [
      { key: 'devocional', label: 'Devocional' },
      { key: 'academico', label: 'Académico' },
      { key: 'conversacional', label: 'Casual' },
    ];
    return (
      <View style={styles.settingCard}>
        <LinearGradient colors={['rgba(20,30,45,0.8)', 'rgba(15,25,40,0.9)']} style={styles.settingGradient}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBadge, { backgroundColor: `${COLORS.nevin}18` }]}>
              <MaterialCommunityIcons name="creation" size={20} color={COLORS.nevin} />
            </View>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Estilo de Respuesta</Text>
              <Text style={styles.settingDesc}>Cómo responde Nevin AI</Text>
            </View>
          </View>
          <View style={styles.styleChips}>
            {options.map(opt => (
              <TouchableOpacity key={opt.key} style={[styles.styleChip, nevinStyle === opt.key && { borderColor: COLORS.nevin, backgroundColor: `${COLORS.nevin}18` }]} onPress={() => handleNevinStyle(opt.key)}>
                <Text style={[styles.styleChipText, nevinStyle === opt.key && { color: COLORS.nevin }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  };

  return (
    <MainLayout title="Ajustes">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.reading, textShadowColor: COLORS.reading }]}>LECTURA</Text>
          <FontSizeSelector />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.nevin, textShadowColor: COLORS.nevin }]}>NEVIN AI</Text>
          <NevinStyleSelector />
          <SettingRow icon="delete-outline" iconColor={COLORS.danger} title="Limpiar Historial" desc="Eliminar todas las conversaciones con Nevin" onPress={handleClearHistory} titleColor={COLORS.danger} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.notifications, textShadowColor: COLORS.notifications }]}>NOTIFICACIONES</Text>
          <SettingRow icon="weather-sunset-up" iconColor={COLORS.notifications} title="Versículo del Día" desc="Recibe inspiración cada mañana a las 7:00 AM"
            right={<Switch value={dailyVerseEnabled} onValueChange={handleDailyVerseToggle} trackColor={{ false: 'rgba(107,124,147,0.3)', true: `${COLORS.notifications}55` }} thumbColor={dailyVerseEnabled ? COLORS.notifications : '#6B7C93'} />} />
          <SettingRow icon="book-clock-outline" iconColor={COLORS.notifications} title="Recordatorio del Plan" desc="Aviso diario para continuar tu plan de lectura"
            right={<Switch value={readingReminderEnabled} onValueChange={handleReadingReminderToggle} trackColor={{ false: 'rgba(107,124,147,0.3)', true: `${COLORS.notifications}55` }} thumbColor={readingReminderEnabled ? COLORS.notifications : '#6B7C93'} />} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: COLORS.community, textShadowColor: COLORS.community }]}>COMUNIDAD</Text>
          <SettingRow icon="message-text-outline" iconColor={COLORS.community} title="Enviar Comentarios" desc="Ayúdanos a mejorar la app" onPress={handleSendFeedback} />
          <SettingRow icon="share-variant-outline" iconColor={COLORS.community} title="Compartir App" desc="Recomienda Tzotzil Bible" onPress={handleShareApp} />
          <SettingRow icon="information-outline" iconColor={COLORS.community} title="Acerca de Nosotros" desc="Conoce más sobre la app" onPress={() => Linking.openURL('https://bible.chyrris.com/about')} />
          <SettingRow icon="headset" iconColor={COLORS.community} title="Contacto y Soporte" desc="Obtén ayuda o envía sugerencias" onPress={() => Linking.openURL('https://bible.chyrris.com/support')} />
        </View>

        <View style={styles.legalSection}>
          <TouchableOpacity onPress={() => Linking.openURL('https://bible.chyrris.com/privacy')}><Text style={styles.legalLink}>Política de Privacidad</Text></TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://bible.chyrris.com/terms')}><Text style={styles.legalLink}>Términos de Servicio</Text></TouchableOpacity>
          <Text style={styles.legalDot}>·</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://bible.chyrris.com/legal-disclaimer')}><Text style={styles.legalLink}>Aviso Legal</Text></TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.logoContainer}>
            <Image source={require('../../assets/icon.png')} style={styles.appLogo} resizeMode="contain" />
          </View>
          <Text style={styles.appName}>Tzotzil Bible</Text>
          <Text style={styles.versionText}>Versión {APP_VERSION}</Text>
          <View style={styles.missionVerse}>
            <MaterialCommunityIcons name="feather" size={12} color="rgba(255,209,102,0.45)" style={{ marginBottom: 8 }} />
            <Text style={styles.missionVerseText}>
              “Vienen días”, afirma el Señor y Dios,{'\n'}
              “en que enviaré hambre al país;{'\n'}
              no será hambre de pan ni sed de agua,{'\n'}
              sino hambre de oír las palabras del Señor.”
            </Text>
            <Text style={styles.missionVerseRef}>Amós 8:11</Text>
          </View>
          <Text style={styles.infoNote}>La Biblia funciona sin internet.{'\n'}Nevin AI requiere conexión.</Text>
          <Text style={styles.copyright}>© 2026 Chyrris Technologies</Text>
        </View>

      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 12, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 4 },
  settingCard: { borderRadius: 14, overflow: 'hidden', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(0,243,255,0.12)' },
  settingGradient: { padding: 14 },
  settingRow: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 14, flexShrink: 0 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '600', color: '#E8EDF5' },
  settingDesc: { fontSize: 12, color: '#6B7C93', marginTop: 2, lineHeight: 16 },
  fontSizeControl: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  fontButton: { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(0,243,255,0.06)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,243,255,0.15)' },
  fontButtonActive: { backgroundColor: 'rgba(0,255,136,0.15)', borderColor: '#00FF88' },
  fontButtonText: { color: '#6B7C93', fontWeight: '700' },
  fontButtonTextActive: { color: '#00FF88' },
  styleChips: { flexDirection: 'row', gap: 8, marginTop: 10, paddingLeft: 52 },
  styleChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(107,124,147,0.3)', backgroundColor: 'rgba(107,124,147,0.06)' },
  styleChipText: { fontSize: 12, color: '#6B7C93', fontWeight: '500' },
  legalSection: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 28, paddingHorizontal: 8 },
  legalLink: { fontSize: 11, color: '#4A5568', textDecorationLine: 'underline' },
  legalDot: { fontSize: 11, color: '#4A5568' },
  infoContainer: { alignItems: 'center', marginBottom: 48, paddingHorizontal: 24 },
  logoContainer: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(0,243,255,0.08)', justifyContent: 'center', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: 'rgba(0,243,255,0.2)' },
  appLogo: { width: 56, height: 56 },
  appName: { fontSize: 22, fontFamily: FONTS.bold, color: '#00FF88', marginBottom: 4, letterSpacing: 1, textShadowColor: '#00FF88', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 8 },
  versionText: { fontSize: 13, color: '#00F3FF', marginBottom: 20 },
  missionVerse: { alignItems: 'flex-start', borderLeftWidth: 2, borderLeftColor: 'rgba(255,209,102,0.3)', paddingLeft: 14, marginBottom: 20, alignSelf: 'stretch' },
  missionVerseText: { fontSize: 12, fontStyle: 'italic', color: 'rgba(240,224,176,0.75)', lineHeight: 19, textAlign: 'left' },
  missionVerseRef: { fontSize: 11, color: 'rgba(255,209,102,0.5)', marginTop: 6, alignSelf: 'flex-end', letterSpacing: 0.5 },
  infoNote: { fontSize: 12, color: '#4A5568', textAlign: 'center', lineHeight: 18, marginBottom: 14 },
  copyright: { fontSize: 11, color: '#3A4558', fontFamily: FONTS.regular },
});
