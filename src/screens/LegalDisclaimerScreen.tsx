import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

const LAST_UPDATED = '19 de Diciembre, 2025';

export default function LegalDisclaimerScreen() {
  return (
    <MainLayout title="Aviso Legal" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="alert-circle-outline" size={40} color="#ffd700" />
          </View>
          <Text style={styles.subtitle}>Uso de Inteligencia Artificial y Contenido Teológico</Text>
          <Text style={styles.lastUpdated}>Última actualización: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.importantCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 180, 0, 0.1)']}
            style={styles.importantGradient}
          >
            <View style={styles.importantHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#ffd700" />
              <Text style={styles.importantTitle}>Aviso Importante</Text>
            </View>
            <Text style={styles.importantText}>
              Este documento contiene información crítica sobre las limitaciones y el uso apropiado de la inteligencia artificial (Nevin AI) y el contenido teológico de esta aplicación. Por favor, léalo cuidadosamente.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="robot-outline" size={24} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Sobre Nevin AI</Text>
            </View>
            <Text style={styles.paragraph}>
              Nevin es un asistente de inteligencia artificial diseñado para apoyar el estudio bíblico y responder consultas teológicas. Está basado en tecnología de procesamiento de lenguaje natural proporcionada por Anthropic (Claude AI).
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="alert-outline" size={24} color="#ff6b6b" />
              <Text style={styles.sectionTitle}>Limitaciones de la IA</Text>
            </View>
            <Text style={styles.paragraph}>
              Es fundamental comprender que Nevin AI:{'\n\n'}
              <Text style={styles.highlight}>• No es infalible:</Text> Las respuestas son generadas por algoritmos y pueden contener errores, imprecisiones o malentendidos.{'\n\n'}
              <Text style={styles.highlight}>• No sustituye autoridad espiritual:</Text> Las respuestas de Nevin no reemplazan la guía de pastores, líderes espirituales, teólogos entrenados o la comunidad de fe.{'\n\n'}
              <Text style={styles.highlight}>• No es inspiración divina:</Text> El contenido generado por IA es producto de procesamiento computacional, no de revelación espiritual.{'\n\n'}
              <Text style={styles.highlight}>• Puede tener sesgos:</Text> Como toda IA, puede reflejar sesgos presentes en sus datos de entrenamiento.{'\n\n'}
              <Text style={styles.highlight}>• Tiene limitaciones contextuales:</Text> Puede no comprender completamente el contexto histórico, cultural o personal de cada consulta.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="book-cross" size={24} color="#00ff88" />
              <Text style={styles.sectionTitle}>Contenido Teológico</Text>
            </View>
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>Traducción Tzotzil:</Text> La traducción bíblica al idioma Tzotzil ha sido desarrollada con respeto por la fidelidad doctrinal, el contexto bíblico y las particularidades lingüísticas y culturales de la lengua Tzotzil.{'\n\n'}
              <Text style={styles.highlight}>Perspectiva Doctrinal:</Text> Las respuestas de Nevin están orientadas hacia una perspectiva bíblica conservadora, pero esto no garantiza alineación perfecta con todas las tradiciones denominacionales.{'\n\n'}
              <Text style={styles.highlight}>Interpretación:</Text> Diferentes tradiciones cristianas pueden tener interpretaciones variadas de ciertos pasajes. La aplicación no pretende ser la autoridad final en disputas teológicas.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="check-decagram" size={24} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Uso Recomendado</Text>
            </View>
            <Text style={styles.paragraph}>
              Recomendamos usar Tzotzil Bible y Nevin AI de la siguiente manera:{'\n\n'}
              • Como herramienta de apoyo y punto de partida para el estudio{'\n'}
              • Verificando siempre las respuestas con las Escrituras directamente{'\n'}
              • Consultando con líderes espirituales en temas sensibles o importantes{'\n'}
              • Combinando el uso de la IA con estudio personal y oración{'\n'}
              • Usando discernimiento espiritual en la evaluación de respuestas{'\n'}
              • No dependiendo exclusivamente de la IA para decisiones de vida importantes
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-alert-outline" size={24} color="#ff6b6b" />
              <Text style={styles.sectionTitle}>Exención de Responsabilidad</Text>
            </View>
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>El desarrollador y Tzotzil Bible no se hacen responsables de:</Text>{'\n\n'}
              • Decisiones personales, espirituales, financieras o de salud tomadas basándose en respuestas de Nevin AI{'\n\n'}
              • Interpretaciones teológicas que resulten en conflicto con denominaciones o tradiciones específicas{'\n\n'}
              • Daños emocionales, espirituales o de cualquier tipo derivados del uso de la aplicación{'\n\n'}
              • La precisión absoluta de cualquier información proporcionada por la IA{'\n\n'}
              • El uso inapropiado de la aplicación por parte de los usuarios
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="scale-balance" size={24} color="#00ff88" />
              <Text style={styles.sectionTitle}>Principio Rector</Text>
            </View>
            <Text style={styles.paragraph}>
              Creemos firmemente que la tecnología debe servir para acercar a las personas a la Palabra de Dios, nunca para reemplazarla. Nevin AI es una herramienta diseñada para facilitar el acceso y comprensión de las Escrituras, no para sustituir la relación personal con Dios, la comunión con la iglesia, ni el consejo pastoral.
            </Text>
            <View style={styles.scriptureBox}>
              <Text style={styles.scriptureText}>
                "Lámpara es a mis pies tu palabra, y lumbrera a mi camino."
              </Text>
              <Text style={styles.scriptureRef}>— Salmos 119:105</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="flag-outline" size={24} color="#00f3ff" />
              <Text style={styles.sectionTitle}>Reportar Contenido</Text>
            </View>
            <Text style={styles.paragraph}>
              Si encuentra respuestas de Nevin AI que considere:{'\n\n'}
              • Teológicamente incorrectas o preocupantes{'\n'}
              • Ofensivas o inapropiadas{'\n'}
              • Potencialmente dañinas{'\n\n'}
              Por favor, repórtelas a través de la función de feedback en Ajustes o contactando a:{'\n'}
              gelasio@chyrris.com
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Sola Scriptura</Text>
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
    marginBottom: 24,
    paddingTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    color: '#ffd700',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 13,
    color: '#6b7c93',
    fontStyle: 'italic',
  },
  importantCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  importantGradient: {
    padding: 20,
  },
  importantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffd700',
    marginLeft: 10,
  },
  importantText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#e6d5a8',
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
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e6f3ff',
    marginLeft: 12,
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    color: '#b8c5d4',
    textAlign: 'justify',
  },
  highlight: {
    color: '#00ff88',
    fontWeight: '600',
  },
  scriptureBox: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.08)',
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#00ff88',
  },
  scriptureText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#e6f3ff',
    lineHeight: 24,
    textAlign: 'center',
  },
  scriptureRef: {
    fontSize: 13,
    color: '#00ff88',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
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
    backgroundColor: '#ffd700',
    marginBottom: 16,
    borderRadius: 1,
  },
  footerText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#ffd700',
    letterSpacing: 1,
  },
});
