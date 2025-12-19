import React from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

export default function AboutScreen() {
  return (
    <MainLayout title="Acerca de Nosotros" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/icon.png')} 
              style={styles.appLogo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appName}>Tzotzil Bible</Text>
          <View style={styles.divider} />
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="heart-outline" size={24} color="#00ff88" />
              <Text style={styles.sectionTitle}>Nuestro Propósito</Text>
            </View>
            <Text style={styles.paragraph}>
              Esta aplicación fue creada con el propósito de preservar, estudiar y compartir las Sagradas Escrituras mediante el uso responsable de la tecnología moderna.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-outline" size={24} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Desarrollador</Text>
            </View>
            <Text style={styles.paragraph}>
              Desarrollada por G. Sánchez G., la app integra un trabajo cuidadoso de traducción semántica al idioma tzotzil, buscando mantener la fidelidad doctrinal, el contexto bíblico y la intención teológica del texto original, respetando la profundidad espiritual y cultural de la lengua.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="book-open-page-variant-outline" size={24} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Funcionalidades</Text>
            </View>
            <Text style={styles.paragraph}>
              El sistema permite la lectura y comparación de versiones bíblicas en paralelo, facilitando el estudio serio de la Palabra. A esto se suma Nevin, una inteligencia artificial avanzada diseñada como asistente bíblico, capaz de guiar al usuario en el análisis, comprensión y reflexión teológica de las Escrituras.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="creation" size={24} color="#00ff88" />
              <Text style={styles.sectionTitle}>Nuestra Visión</Text>
            </View>
            <Text style={styles.paragraph}>
              Este proyecto une teología, lenguaje y tecnología, con un compromiso claro hacia la verdad bíblica, la excelencia técnica y una experiencia de estudio profunda y significativa.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Soli Deo Gloria</Text>
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
  heroSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 243, 255, 0.3)',
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
  },
  appLogo: {
    width: 70,
    height: 70,
  },
  appName: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    color: '#00ff88',
    letterSpacing: 2,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#00f3ff',
    marginTop: 16,
    borderRadius: 1,
    shadowColor: '#00f3ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  contentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.2)',
  },
  cardGradient: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e6f3ff',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#b8c5d4',
    textAlign: 'justify',
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
    backgroundColor: '#00ff88',
    marginBottom: 16,
    borderRadius: 1,
    shadowColor: '#00ff88',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#00ff88',
    letterSpacing: 1,
    textShadowColor: '#00ff88',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
