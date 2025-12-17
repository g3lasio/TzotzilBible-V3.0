import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Share, Dimensions } from 'react-native';
import { Text, Card, Button, useTheme, Surface, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BibleService } from '../services/BibleService';
import type { RootStackParamList } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const theme = useTheme();
  const [dailyPromise, setDailyPromise] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDailyPromise();
  }, []);

  const loadDailyPromise = async () => {
    try {
      const promise = await BibleService.getRandomPromise();
      setDailyPromise(promise);
    } catch (error) {
      console.error('Error loading daily promise:', error);
      setDailyPromise('El Señor es mi pastor; nada me faltará. - Salmo 23:1');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${dailyPromise}\n\n- Biblia Tzotzil`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const menuItems = [
    {
      title: 'Biblia',
      subtitle: 'Lee la Palabra de Dios en Tzotzil y Español',
      icon: 'book-open-page-variant',
      color: '#4CAF50',
      route: 'Bible' as const,
    },
    {
      title: 'Nevin AI',
      subtitle: 'Consulta con tu asistente bíblico inteligente',
      icon: 'robot',
      color: '#2196F3',
      route: 'Nevin' as const,
    },
    {
      title: 'Búsqueda',
      subtitle: 'Encuentra versículos por palabra clave',
      icon: 'magnify',
      color: '#FF9800',
      route: 'Search' as const,
    },
    {
      title: 'Configuración',
      subtitle: 'Personaliza tu experiencia de lectura',
      icon: 'cog',
      color: '#9C27B0',
      route: 'Settings' as const,
    },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#1a237e', '#3949ab', '#5c6bc0']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Text style={styles.appTitle}>Biblia Tzotzil</Text>
          <Text style={styles.appSubtitle}>La Palabra de Dios en tu idioma</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Surface style={styles.promiseCard} elevation={4}>
          <LinearGradient
            colors={['#fff8e1', '#ffecb3']}
            style={styles.promiseGradient}
          >
            <View style={styles.promiseHeader}>
              <MaterialCommunityIcons name="star-four-points" size={24} color="#f57c00" />
              <Text style={styles.promiseTitle}>Promesa del Día</Text>
            </View>
            
            {loading ? (
              <Text style={styles.promiseText}>Cargando promesa...</Text>
            ) : (
              <Text style={styles.promiseText}>{dailyPromise}</Text>
            )}
            
            <View style={styles.promiseActions}>
              <Button 
                mode="contained" 
                onPress={handleShare}
                icon="share-variant"
                style={styles.shareButton}
                buttonColor="#f57c00"
              >
                Compartir
              </Button>
              <IconButton 
                icon="refresh"
                size={24}
                onPress={loadDailyPromise}
                style={styles.refreshButton}
              />
            </View>
          </LinearGradient>
        </Surface>

        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <Card 
              key={item.route}
              style={styles.menuCard} 
              onPress={() => navigation.navigate(item.route)}
            >
              <LinearGradient
                colors={[item.color, adjustColor(item.color, -30)]}
                style={styles.menuCardGradient}
              >
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={40} 
                  color="#fff" 
                />
                <Text style={styles.menuCardTitle}>{item.title}</Text>
                <Text style={styles.menuCardSubtitle}>{item.subtitle}</Text>
              </LinearGradient>
            </Card>
          ))}
        </View>

        <Surface style={styles.statsCard} elevation={2}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>66</Text>
              <Text style={styles.statLabel}>Libros</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>31,105</Text>
              <Text style={styles.statLabel}>Versículos</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>2</Text>
              <Text style={styles.statLabel}>Idiomas</Text>
            </View>
          </View>
        </Surface>

        <Text style={styles.footer}>
          Biblia Tzotzil - Adventista del Séptimo Día
        </Text>
      </View>
    </ScrollView>
  );
}

function adjustColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  appSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },
  content: {
    padding: 16,
    marginTop: -20,
  },
  promiseCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  promiseGradient: {
    padding: 20,
  },
  promiseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  promiseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e65100',
    marginLeft: 10,
  },
  promiseText: {
    fontSize: 18,
    lineHeight: 28,
    color: '#5d4037',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 16,
  },
  promiseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  shareButton: {
    borderRadius: 20,
  },
  refreshButton: {
    marginLeft: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  menuCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuCardGradient: {
    padding: 20,
    alignItems: 'center',
    minHeight: 140,
    justifyContent: 'center',
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 12,
    textAlign: 'center',
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
    textAlign: 'center',
  },
  statsCard: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a237e',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  footer: {
    textAlign: 'center',
    color: '#999',
    fontSize: 12,
    marginBottom: 20,
  },
});
