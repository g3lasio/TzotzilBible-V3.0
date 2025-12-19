import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

const LAST_UPDATED = '19 de Diciembre, 2025';

export default function TermsOfServiceScreen() {
  return (
    <MainLayout title="Términos de Servicio" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="file-document-outline" size={40} color="#00f3ff" />
          </View>
          <Text style={styles.lastUpdated}>Última actualización: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>1. Aceptación de los Términos</Text>
            <Text style={styles.paragraph}>
              Al descargar, instalar o utilizar la aplicación Tzotzil Bible, usted acepta estar sujeto a estos Términos de Servicio. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la aplicación.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>2. Descripción del Servicio</Text>
            <Text style={styles.paragraph}>
              Tzotzil Bible es una aplicación de estudio bíblico que ofrece:{'\n\n'}
              • Textos bíblicos en idioma Tzotzil y Español{'\n'}
              • Sistema de lectura bilingüe y paralela{'\n'}
              • Nevin AI: Asistente de inteligencia artificial para consultas teológicas y bíblicas{'\n'}
              • Herramientas de estudio, búsqueda y navegación bíblica{'\n'}
              • Funcionalidad offline para textos bíblicos
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>3. Uso Aceptable</Text>
            <Text style={styles.paragraph}>
              Al utilizar Tzotzil Bible, usted acepta:{'\n\n'}
              • Usar la aplicación únicamente para fines legales y apropiados{'\n'}
              • No intentar manipular, hackear o interferir con el funcionamiento de la aplicación{'\n'}
              • No utilizar la aplicación para difundir contenido ofensivo, odioso o contrario a los valores bíblicos{'\n'}
              • No usar Nevin AI para generar contenido falso, engañoso o dañino{'\n'}
              • Respetar los derechos de propiedad intelectual
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>4. Propiedad Intelectual</Text>
            <Text style={styles.paragraph}>
              <Text style={styles.highlight}>Contenido de la Aplicación:</Text> El diseño, código, gráficos, logotipos y estructura de la aplicación son propiedad de Tzotzil Bible y están protegidos por leyes de propiedad intelectual.{'\n\n'}
              <Text style={styles.highlight}>Textos Bíblicos:</Text> La traducción al Tzotzil ha sido desarrollada con cuidado doctrinal y respeto cultural. Los textos en español corresponden a versiones de dominio público o debidamente licenciadas.{'\n\n'}
              <Text style={styles.highlight}>Contenido de Usuario:</Text> Las notas y marcadores que usted cree permanecen bajo su propiedad.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>5. Nevin AI - Asistente Bíblico</Text>
            <Text style={styles.paragraph}>
              El uso del asistente Nevin AI está sujeto a las siguientes condiciones:{'\n\n'}
              • Nevin es una herramienta de apoyo al estudio, no un sustituto de líderes espirituales, pastores o consejeros{'\n'}
              • Las respuestas son generadas por inteligencia artificial y pueden contener imprecisiones{'\n'}
              • Se recomienda verificar la información con fuentes bíblicas primarias{'\n'}
              • Nevin requiere conexión a internet para funcionar{'\n'}
              • El servicio puede experimentar interrupciones temporales
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>6. Disponibilidad del Servicio</Text>
            <Text style={styles.paragraph}>
              • La lectura bíblica funciona sin conexión a internet{'\n'}
              • Las funciones de IA requieren conexión activa{'\n'}
              • Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto del servicio{'\n'}
              • No garantizamos disponibilidad ininterrumpida del servicio de IA{'\n'}
              • Las actualizaciones pueden incluir cambios en funcionalidades
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>7. Limitación de Responsabilidad</Text>
            <Text style={styles.paragraph}>
              Tzotzil Bible se proporciona "tal cual" sin garantías de ningún tipo. No somos responsables de:{'\n\n'}
              • Decisiones tomadas basándose en el contenido de la aplicación{'\n'}
              • Interpretaciones teológicas derivadas de respuestas de IA{'\n'}
              • Pérdida de datos locales por mal funcionamiento del dispositivo{'\n'}
              • Interrupciones en el servicio de IA{'\n'}
              • Daños indirectos, incidentales o consecuentes
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>8. Terminación</Text>
            <Text style={styles.paragraph}>
              • Usted puede dejar de usar la aplicación en cualquier momento desinstalándola{'\n'}
              • Nos reservamos el derecho de restringir el acceso en caso de violación de estos términos{'\n'}
              • La terminación no afecta los datos almacenados localmente en su dispositivo
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>9. Modificaciones a los Términos</Text>
            <Text style={styles.paragraph}>
              Podemos modificar estos Términos de Servicio en cualquier momento. Los cambios significativos serán notificados a través de la aplicación. El uso continuado después de las modificaciones constituye aceptación de los nuevos términos.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>10. Ley Aplicable</Text>
            <Text style={styles.paragraph}>
              Estos términos se rigen por las leyes aplicables en la jurisdicción donde opera el desarrollador. Cualquier disputa será resuelta mediante arbitraje o en los tribunales competentes.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>11. Contacto</Text>
            <Text style={styles.paragraph}>
              Para preguntas sobre estos Términos de Servicio:{'\n\n'}
              Email: legal@tzotzilbible.app{'\n'}
              Soporte: feedback@tzotzilbible.app
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Gracias por usar Tzotzil Bible</Text>
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
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 243, 255, 0.3)',
  },
  lastUpdated: {
    fontSize: 13,
    color: '#6b7c93',
    fontStyle: 'italic',
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
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#00f3ff',
    marginBottom: 12,
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
    fontSize: 13,
    fontStyle: 'italic',
    color: '#6b7c93',
    letterSpacing: 0.5,
  },
});
