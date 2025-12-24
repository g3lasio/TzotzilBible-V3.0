import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

const SUPPORT_EMAIL = 'gelasio@chyrris.com';
const FEEDBACK_EMAIL = 'gelasio@chyrris.com';
const PRIVACY_EMAIL = 'gelasio@chyrris.com';
const WEBSITE = 'https://bible.chyrris.com';
const APP_VERSION = '2.1.0';

export default function ContactSupportScreen() {
  const handleEmail = (email: string, subject: string) => {
    const encodedSubject = encodeURIComponent(subject);
    const body = encodeURIComponent(`\n\n---\nVersión de la App: ${APP_VERSION}\nDispositivo: `);
    Linking.openURL(`mailto:${email}?subject=${encodedSubject}&body=${body}`).catch(() => {
      Alert.alert('Error', 'No se pudo abrir la aplicación de correo.');
    });
  };

  const handleWebsite = () => {
    Linking.openURL(WEBSITE).catch(() => {
      Alert.alert('Error', 'No se pudo abrir el navegador.');
    });
  };

  return (
    <MainLayout title="Contacto y Soporte" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="headset" size={40} color="#00f3ff" />
          </View>
          <Text style={styles.headerTitle}>Estamos aquí para ayudarte</Text>
          <Text style={styles.headerSubtitle}>
            Elige la opción que mejor se adapte a tu consulta
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleEmail(SUPPORT_EMAIL, 'Soporte Técnico - Tzotzil Bible')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(0, 243, 255, 0.15)', 'rgba(0, 200, 255, 0.08)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="wrench-outline" size={28} color="#00f3ff" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Soporte Técnico</Text>
                <Text style={styles.cardDescription}>
                  Problemas con la app, errores, fallos o comportamiento inesperado
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00f3ff" />
            </View>
            <View style={styles.emailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6b7c93" />
              <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleEmail(FEEDBACK_EMAIL, 'Sugerencia - Tzotzil Bible')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(0, 255, 136, 0.15)', 'rgba(0, 220, 120, 0.08)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(0, 255, 136, 0.2)' }]}>
                <MaterialCommunityIcons name="lightbulb-outline" size={28} color="#00ff88" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Sugerencias y Mejoras</Text>
                <Text style={styles.cardDescription}>
                  Ideas para nuevas funciones, mejoras de diseño o usabilidad
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#00ff88" />
            </View>
            <View style={styles.emailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6b7c93" />
              <Text style={styles.emailText}>{FEEDBACK_EMAIL}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleEmail(FEEDBACK_EMAIL, 'Reporte de Contenido IA - Tzotzil Bible')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(255, 180, 0, 0.15)', 'rgba(255, 160, 0, 0.08)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255, 180, 0, 0.2)' }]}>
                <MaterialCommunityIcons name="flag-outline" size={28} color="#ffb400" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Reportar Contenido de IA</Text>
                <Text style={styles.cardDescription}>
                  Respuestas incorrectas, inapropiadas o preocupantes de Nevin
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#ffb400" />
            </View>
            <View style={styles.emailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6b7c93" />
              <Text style={styles.emailText}>{FEEDBACK_EMAIL}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.contactCard}
          onPress={() => handleEmail(PRIVACY_EMAIL, 'Consulta de Privacidad - Tzotzil Bible')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(138, 43, 226, 0.15)', 'rgba(120, 40, 200, 0.08)']}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(138, 43, 226, 0.2)' }]}>
                <MaterialCommunityIcons name="shield-lock-outline" size={28} color="#a855f7" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Privacidad y Datos</Text>
                <Text style={styles.cardDescription}>
                  Consultas sobre manejo de datos, eliminación o derechos de privacidad
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#a855f7" />
            </View>
            <View style={styles.emailRow}>
              <MaterialCommunityIcons name="email-outline" size={16} color="#6b7c93" />
              <Text style={styles.emailText}>{PRIVACY_EMAIL}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.infoGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="clock-outline" size={22} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Tiempo de Respuesta</Text>
            </View>
            <Text style={styles.infoText}>
              Nos esforzamos por responder todas las consultas en un plazo de 48-72 horas hábiles. Para asuntos urgentes de seguridad o privacidad, priorizamos la respuesta.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.infoSection}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.infoGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="frequently-asked-questions" size={22} color="#00ff88" />
              <Text style={styles.sectionTitle}>Antes de Contactar</Text>
            </View>
            <Text style={styles.infoText}>
              Para ayudarte mejor, incluye en tu mensaje:{'\n\n'}
              • Descripción clara del problema o sugerencia{'\n'}
              • Pasos para reproducir el error (si aplica){'\n'}
              • Versión de la app y sistema operativo{'\n'}
              • Capturas de pantalla si es posible
            </Text>
          </LinearGradient>
        </View>

        <TouchableOpacity 
          style={styles.websiteCard}
          onPress={handleWebsite}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['rgba(0, 243, 255, 0.1)', 'rgba(0, 255, 136, 0.1)']}
            style={styles.websiteGradient}
          >
            <MaterialCommunityIcons name="web" size={24} color="#00f3ff" />
            <Text style={styles.websiteText}>Visita nuestra web</Text>
            <Text style={styles.websiteUrl}>{WEBSITE}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.footerSection}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Versión {APP_VERSION}</Text>
          <Text style={styles.footerSubtext}>Tu opinión nos ayuda a mejorar</Text>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
    paddingTop: 8,
  },
  iconContainer: {
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
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#e6f3ff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7c93',
    textAlign: 'center',
  },
  contactCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.25)',
  },
  cardGradient: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e6f3ff',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: '#8a9bb3',
    lineHeight: 18,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 124, 147, 0.2)',
  },
  emailText: {
    fontSize: 13,
    color: '#6b7c93',
    marginLeft: 8,
  },
  infoSection: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  infoGradient: {
    padding: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e6f3ff',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b8c5d4',
  },
  websiteCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  websiteGradient: {
    padding: 20,
    alignItems: 'center',
  },
  websiteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#e6f3ff',
    marginTop: 10,
  },
  websiteUrl: {
    fontSize: 13,
    color: '#00f3ff',
    marginTop: 4,
  },
  footerSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
    paddingVertical: 24,
  },
  footerDivider: {
    width: 40,
    height: 2,
    backgroundColor: '#00f3ff',
    marginBottom: 16,
    borderRadius: 1,
  },
  footerText: {
    fontSize: 14,
    color: '#00f3ff',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#6b7c93',
    marginTop: 6,
    fontStyle: 'italic',
  },
});
