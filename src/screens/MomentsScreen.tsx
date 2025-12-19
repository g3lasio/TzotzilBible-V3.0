import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { MomentsService } from '../services/MomentsService';
import { MomentPreview } from '../types/nevin';
import MainLayout from '../components/MainLayout';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'Hace un momento' : `Hace ${diffMins} minutos`;
    }
    return diffHours === 1 ? 'Hace una hora' : `Hace ${diffHours} horas`;
  }
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  
  return date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
};

export default function MomentsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [moments, setMoments] = useState<MomentPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMoments = async () => {
    const data = await MomentsService.getAllMoments();
    setMoments(data);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadMoments();
    }, [])
  );

  useEffect(() => {
    MomentsService.migrateOldHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMoments();
    setRefreshing(false);
  };

  const handleOpenMoment = async (momentId: string) => {
    await MomentsService.setActiveMoment(momentId);
    navigation.navigate('MainTabs', { screen: 'NevinTab' });
  };

  const handleNewMoment = async () => {
    await MomentsService.createMoment();
    navigation.navigate('MainTabs', { screen: 'NevinTab' });
  };

  const handleDeleteMoment = (momentId: string, title: string) => {
    Alert.alert(
      'Eliminar momento',
      `¿Deseas eliminar "${title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await MomentsService.deleteMoment(momentId);
            loadMoments();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <MainLayout title="Momentos">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00ff88" />
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Momentos">
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ff88"
            colors={['#00ff88']}
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tus reflexiones</Text>
          <Text style={styles.headerSubtitle}>
            Cada momento guarda un tema o pregunta significativa
          </Text>
        </View>

        <TouchableOpacity style={styles.newMomentButton} onPress={handleNewMoment}>
          <View style={styles.newMomentIcon}>
            <MaterialCommunityIcons name="plus" size={24} color="#0a0e14" />
          </View>
          <Text style={styles.newMomentText}>Iniciar nueva reflexión</Text>
        </TouchableOpacity>

        {moments.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color="#6b7c93" />
            <Text style={styles.emptyTitle}>Sin momentos aún</Text>
            <Text style={styles.emptySubtitle}>
              Tus conversaciones con Nevin se guardarán aquí como reflexiones significativas
            </Text>
          </View>
        ) : (
          <View style={styles.momentsList}>
            {moments.map((moment) => (
              <TouchableOpacity
                key={moment.id}
                style={styles.momentCard}
                onPress={() => handleOpenMoment(moment.id)}
                onLongPress={() => handleDeleteMoment(moment.id, moment.title)}
              >
                <View style={styles.momentHeader}>
                  <View style={styles.momentIconContainer}>
                    <MaterialCommunityIcons name="creation" size={18} color="#00ff88" />
                  </View>
                  <Text style={styles.momentDate}>
                    {formatRelativeDate(moment.updatedAt)}
                  </Text>
                </View>
                
                <Text style={styles.momentTitle}>{moment.title}</Text>
                
                {moment.summary && (
                  <Text style={styles.momentSummary} numberOfLines={2}>
                    {moment.summary}
                  </Text>
                )}
                
                {moment.themes.length > 0 && (
                  <View style={styles.themesContainer}>
                    {moment.themes.slice(0, 3).map((theme, index) => (
                      <View key={index} style={styles.themeTag}>
                        <Text style={styles.themeText}>{theme}</Text>
                      </View>
                    ))}
                  </View>
                )}
                
                <View style={styles.momentFooter}>
                  <MaterialCommunityIcons name="message-outline" size={14} color="#6b7c93" />
                  <Text style={styles.messageCount}>
                    {moment.messageCount} {moment.messageCount === 1 ? 'mensaje' : 'mensajes'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '300',
    color: '#e6f3ff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7c93',
    lineHeight: 20,
  },
  newMomentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 136, 0.3)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  newMomentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00ff88',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  newMomentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00ff88',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#a0b8d0',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7c93',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  momentsList: {
    gap: 12,
  },
  momentCard: {
    backgroundColor: 'rgba(20, 30, 45, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  momentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  momentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  momentDate: {
    fontSize: 12,
    color: '#6b7c93',
  },
  momentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#e6f3ff',
    marginBottom: 8,
  },
  momentSummary: {
    fontSize: 14,
    color: '#a0b8d0',
    lineHeight: 20,
    marginBottom: 12,
  },
  themesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  themeTag: {
    backgroundColor: 'rgba(0, 243, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  themeText: {
    fontSize: 11,
    color: '#00f3ff',
    textTransform: 'lowercase',
  },
  momentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  messageCount: {
    fontSize: 12,
    color: '#6b7c93',
  },
});
