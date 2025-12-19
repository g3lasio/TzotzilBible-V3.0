import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MainLayout from '../components/MainLayout';
import { FONTS } from '../config';

const LAST_UPDATED = '19 de Diciembre, 2025';

export default function PrivacyPolicyScreen() {
  return (
    <MainLayout title="Política de Privacidad" showBackButton>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        <View style={styles.headerSection}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color="#00ff88" />
          </View>
          <Text style={styles.lastUpdated}>Última actualización: {LAST_UPDATED}</Text>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>1. Introducción</Text>
            <Text style={styles.paragraph}>
              Tzotzil Bible ("nosotros", "nuestra aplicación") se compromete a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información cuando utiliza nuestra aplicación de estudio bíblico.
            </Text>
            <Text style={styles.paragraph}>
              Al utilizar Tzotzil Bible, usted acepta las prácticas descritas en esta política. Le recomendamos leer este documento completo para comprender nuestro compromiso con su privacidad.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>2. Información que Recopilamos</Text>
            <Text style={styles.subtitle}>2.1 Datos de Uso Local</Text>
            <Text style={styles.paragraph}>
              Almacenamos localmente en su dispositivo:{'\n'}
              • Preferencias de la aplicación (tamaño de fuente, configuraciones){'\n'}
              • Historial de conversaciones con Nevin AI{'\n'}
              • Marcadores y notas personales{'\n'}
              • Progreso de lectura bíblica
            </Text>
            <Text style={styles.subtitle}>2.2 Datos Procesados por IA</Text>
            <Text style={styles.paragraph}>
              Cuando utiliza el asistente Nevin AI:{'\n'}
              • Sus preguntas y consultas teológicas son enviadas a servicios externos de inteligencia artificial (Anthropic Claude) para generar respuestas.{'\n'}
              • No almacenamos sus conversaciones en servidores externos de forma permanente.{'\n'}
              • Las consultas se procesan en tiempo real y no se utilizan para entrenar modelos de IA.
            </Text>
            <Text style={styles.subtitle}>2.3 Datos Técnicos</Text>
            <Text style={styles.paragraph}>
              Podemos recopilar automáticamente:{'\n'}
              • Información básica del dispositivo (modelo, sistema operativo){'\n'}
              • Reportes de errores anónimos para mejorar la estabilidad{'\n'}
              • Estadísticas agregadas de uso (sin identificación personal)
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>3. Uso de la Información</Text>
            <Text style={styles.paragraph}>
              Utilizamos la información recopilada para:{'\n'}
              • Proporcionar y mejorar la funcionalidad de la aplicación{'\n'}
              • Generar respuestas teológicas personalizadas a través de Nevin AI{'\n'}
              • Guardar sus preferencias y configuraciones{'\n'}
              • Diagnosticar problemas técnicos y mejorar la estabilidad{'\n'}
              • Desarrollar nuevas funcionalidades
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>4. Compartir Información con Terceros</Text>
            <Text style={styles.paragraph}>
              Compartimos información limitada con los siguientes terceros:{'\n\n'}
              <Text style={styles.highlight}>Anthropic (Claude AI):</Text> Las consultas realizadas a Nevin AI son procesadas por la API de Anthropic Claude. Anthropic tiene su propia política de privacidad y no utiliza las consultas de API para entrenar sus modelos.{'\n\n'}
              No vendemos, alquilamos ni compartimos su información personal con terceros para fines de marketing.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>5. Almacenamiento y Seguridad</Text>
            <Text style={styles.paragraph}>
              • Los datos locales se almacenan de forma segura en el almacenamiento interno de su dispositivo.{'\n'}
              • Utilizamos conexiones cifradas (HTTPS) para todas las comunicaciones con servidores externos.{'\n'}
              • No almacenamos contraseñas ni información financiera.{'\n'}
              • Implementamos medidas de seguridad estándar de la industria para proteger sus datos durante la transmisión.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>6. Retención de Datos</Text>
            <Text style={styles.paragraph}>
              • Los datos locales permanecen en su dispositivo hasta que desinstale la aplicación o los elimine manualmente.{'\n'}
              • Puede eliminar su historial de conversaciones con Nevin desde la sección de Ajustes.{'\n'}
              • Los datos de sesión con servicios de IA no se retienen más allá de la sesión activa.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>7. Sus Derechos</Text>
            <Text style={styles.paragraph}>
              Usted tiene derecho a:{'\n'}
              • Acceder a los datos almacenados localmente en su dispositivo{'\n'}
              • Eliminar su historial de conversaciones con Nevin{'\n'}
              • Desinstalar la aplicación para eliminar todos los datos locales{'\n'}
              • Contactarnos para solicitar información sobre sus datos{'\n'}
              • Usar la aplicación sin la función de IA si lo prefiere
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>8. Menores de Edad</Text>
            <Text style={styles.paragraph}>
              Tzotzil Bible está diseñada para uso general y familiar. No recopilamos intencionalmente información personal de menores de 13 años. El contenido de la aplicación es apropiado para todas las edades y promueve valores espirituales positivos.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>9. Cambios a esta Política</Text>
            <Text style={styles.paragraph}>
              Podemos actualizar esta política ocasionalmente. Le notificaremos de cambios significativos a través de la aplicación. La fecha de "Última actualización" al inicio de este documento indica cuándo se realizó la última modificación.
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.contentCard}>
          <LinearGradient
            colors={['rgba(20, 30, 45, 0.8)', 'rgba(15, 25, 40, 0.9)']}
            style={styles.cardGradient}
          >
            <Text style={styles.sectionTitle}>10. Contacto</Text>
            <Text style={styles.paragraph}>
              Si tiene preguntas sobre esta Política de Privacidad o sobre el manejo de sus datos, puede contactarnos en:{'\n\n'}
              Email: gelasio@chyrris.com{'\n'}
              Web: https://bible.chyrris.com
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.footerSection}>
          <View style={styles.footerDivider} />
          <Text style={styles.footerText}>Su privacidad es nuestra prioridad</Text>
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
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 136, 0.3)',
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
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00ff88',
    marginTop: 12,
    marginBottom: 8,
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
    backgroundColor: '#00ff88',
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
