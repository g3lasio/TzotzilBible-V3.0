import React, { useState, useEffect } from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { SECONDARY_VERSIONS, BibleVersion } from '../constants/bibleVersions';
import { versionManager, VersionDownloadProgress } from '../services/VersionManager';

interface VersionPickerModalProps {
  visible: boolean;
  selectedVersion: string;
  onSelect: (versionId: string) => void;
  onClose: () => void;
}

export default function VersionPickerModal({ visible, selectedVersion, onSelect, onClose }: VersionPickerModalProps) {
  const [downloadStates, setDownloadStates] = useState<Record<string, VersionDownloadProgress>>({});
  const [downloadedVersions, setDownloadedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      refreshDownloadStatus();
    }
  }, [visible]);

  const refreshDownloadStatus = () => {
    const downloaded = new Set<string>();
    for (const version of SECONDARY_VERSIONS) {
      if (version.isBundled || versionManager.isVersionDownloaded(version.id)) {
        downloaded.add(version.id);
      }
    }
    setDownloadedVersions(downloaded);
  };

  const handleSelect = (version: BibleVersion) => {
    if (version.isBundled) {
      onSelect(version.id);
      onClose();
      return;
    }

    if (downloadedVersions.has(version.id)) {
      onSelect(version.id);
      onClose();
      return;
    }

    handleDownload(version);
  };

  const handleDownload = async (version: BibleVersion) => {
    setDownloadStates(prev => ({
      ...prev,
      [version.id]: { versionId: version.id, progress: 0, status: 'downloading' }
    }));

    const success = await versionManager.downloadVersion(version.id, (progress) => {
      setDownloadStates(prev => ({
        ...prev,
        [version.id]: progress
      }));
    });

    if (success) {
      refreshDownloadStatus();
      onSelect(version.id);
      onClose();
    } else {
      if (Platform.OS === 'web') {
        alert(`Error al descargar ${version.name}. Verifica tu conexión a internet.`);
      } else {
        Alert.alert(
          'Error de Descarga',
          `No se pudo descargar ${version.name}. Verifica tu conexión a internet e intenta de nuevo.`,
          [{ text: 'OK' }]
        );
      }
    }
  };

  const handleDelete = async (version: BibleVersion) => {
    if (Platform.OS === 'web') {
      if (confirm(`¿Eliminar ${version.name}?`)) {
        await versionManager.deleteVersion(version.id);
        refreshDownloadStatus();
      }
    } else {
      Alert.alert(
        'Eliminar Versión',
        `¿Deseas eliminar ${version.name} del dispositivo?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Eliminar', 
            style: 'destructive',
            onPress: async () => {
              await versionManager.deleteVersion(version.id);
              refreshDownloadStatus();
            }
          }
        ]
      );
    }
  };

  const getVersionStatus = (version: BibleVersion): 'bundled' | 'downloaded' | 'downloading' | 'available' | 'error' => {
    if (version.isBundled) return 'bundled';
    
    const downloadState = downloadStates[version.id];
    if (downloadState) {
      if (downloadState.status === 'downloading' || downloadState.status === 'processing') return 'downloading';
      if (downloadState.status === 'error') return 'error';
    }
    
    if (downloadedVersions.has(version.id)) return 'downloaded';
    return 'available';
  };

  const renderStatusBadge = (version: BibleVersion) => {
    const status = getVersionStatus(version);
    const downloadState = downloadStates[version.id];

    switch (status) {
      case 'bundled':
        return <Text style={styles.badgeBundled}>Incluida</Text>;
      case 'downloaded':
        return (
          <View style={styles.badgeRow}>
            <Text style={styles.badgeDownloaded}>✓</Text>
            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); handleDelete(version); }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.deleteBtn}>✕</Text>
            </TouchableOpacity>
          </View>
        );
      case 'downloading':
        return (
          <View style={styles.badgeRow}>
            <ActivityIndicator size="small" color="#00f3ff" />
            <Text style={styles.badgeDownloading}>
              {downloadState?.progress || 0}%
            </Text>
          </View>
        );
      case 'error':
        return <Text style={styles.badgeError}>Error - Reintentar</Text>;
      case 'available':
        return (
          <Text style={styles.badgeDownload}>
            ↓ {version.downloadSizeMB || '~5'}MB
          </Text>
        );
    }
  };

  // Group versions by language
  const spanishVersions = SECONDARY_VERSIONS.filter(v => v.language === 'es');
  const englishVersions = SECONDARY_VERSIONS.filter(v => v.language === 'en');

  const renderVersionItem = (version: BibleVersion) => {
    const isSelected = version.id === selectedVersion;
    const status = getVersionStatus(version);
    const isDownloading = status === 'downloading';
    
    return (
      <TouchableOpacity
        key={version.id}
        style={[
          styles.option,
          isSelected && styles.optionSelected,
          isDownloading && styles.optionDownloading,
        ]}
        onPress={() => !isDownloading && handleSelect(version)}
        activeOpacity={isDownloading ? 1 : 0.7}
        disabled={isDownloading}
      >
        <View style={styles.optionContent}>
          <View style={styles.optionLeft}>
            <Text style={[
              styles.optionShortName,
              isSelected && styles.optionTextSelected,
              { color: version.color },
            ]}>
              {version.shortName}
            </Text>
            <View style={styles.optionInfo}>
              <Text style={[
                styles.optionName,
                isSelected && styles.optionNameSelected,
              ]} numberOfLines={1}>
                {version.name}
              </Text>
              {version.coverage && version.coverage < 100 && (
                <Text style={styles.coverageText}>
                  {version.coverage}% cobertura
                </Text>
              )}
            </View>
          </View>
          <View style={styles.optionRight}>
            {renderStatusBadge(version)}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const downloadedCount = downloadedVersions.size;
  const totalVersions = SECONDARY_VERSIONS.length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Versiones de la Biblia</Text>
            <Text style={styles.headerSubtext}>
              {downloadedCount} de {totalVersions} disponibles
            </Text>
          </View>
          
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={true}>
            {/* Spanish Versions Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Español</Text>
              <Text style={styles.sectionCount}>{spanishVersions.length} versiones</Text>
            </View>
            {spanishVersions.map(renderVersionItem)}

            {/* English Versions Section */}
            {englishVersions.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>English</Text>
                  <Text style={styles.sectionCount}>{englishVersions.length} version{englishVersions.length > 1 ? 's' : ''}</Text>
                </View>
                {englishVersions.map(renderVersionItem)}
              </>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {versionManager.getTotalStorageMB() > 0 
                ? `Almacenamiento: ${versionManager.getTotalStorageMB()} MB`
                : 'Toca una versión para descargarla'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a2332',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 320,
    maxWidth: 380,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#2a3442',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
    backgroundColor: '#141c28',
  },
  headerText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerSubtext: {
    color: '#556677',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  scrollArea: {
    maxHeight: 450,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#141c28',
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
  },
  sectionTitle: {
    color: '#00f3ff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    color: '#556677',
    fontSize: 10,
  },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
  },
  optionSelected: {
    backgroundColor: '#00f3ff15',
  },
  optionDownloading: {
    backgroundColor: '#00f3ff08',
    opacity: 0.8,
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionInfo: {
    flex: 1,
    marginRight: 8,
  },
  optionShortName: {
    fontSize: 14,
    fontWeight: 'bold',
    width: 65,
  },
  optionName: {
    color: '#8899aa',
    fontSize: 11,
  },
  optionNameSelected: {
    color: '#aabbcc',
  },
  coverageText: {
    color: '#556677',
    fontSize: 9,
    marginTop: 1,
  },
  optionRight: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextSelected: {
    fontWeight: 'bold',
  },
  badgeBundled: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeDownloaded: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: 'bold',
  },
  badgeDownload: {
    color: '#00f3ff',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeDownloading: {
    color: '#00f3ff',
    fontSize: 11,
    marginLeft: 6,
  },
  badgeError: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    color: '#666',
    fontSize: 14,
    padding: 4,
  },
  footer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#141c28',
    borderTopWidth: 1,
    borderTopColor: '#2a3442',
  },
  footerText: {
    color: '#556677',
    fontSize: 11,
    textAlign: 'center',
  },
});
