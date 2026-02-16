import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SECONDARY_VERSIONS, BibleVersion } from '../constants/bibleVersions';

interface VersionPickerModalProps {
  visible: boolean;
  selectedVersion: string;
  onSelect: (versionId: string) => void;
  onClose: () => void;
}

export default function VersionPickerModal({ visible, selectedVersion, onSelect, onClose }: VersionPickerModalProps) {
  const handleSelect = (versionId: string) => {
    onSelect(versionId);
    onClose();
  };

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
          <LinearGradient
            colors={['rgba(25, 35, 50, 0.98)', 'rgba(15, 25, 40, 0.98)']}
            style={styles.gradient}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Seleccionar Versión</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={24} color="#6b7c93" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {SECONDARY_VERSIONS.map((version: BibleVersion) => {
                const isSelected = version.id === selectedVersion;
                
                return (
                  <TouchableOpacity
                    key={version.id}
                    style={[
                      styles.versionCard,
                      isSelected && styles.versionCardSelected
                    ]}
                    onPress={() => handleSelect(version.id)}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={
                        isSelected
                          ? [`${version.color}33`, `${version.color}22`]
                          : ['rgba(20, 30, 45, 0.6)', 'rgba(15, 25, 40, 0.8)']
                      }
                      style={styles.versionGradient}
                    >
                      <View style={styles.versionHeader}>
                        <View style={[styles.versionBadge, { backgroundColor: version.color }]}>
                          <Text style={styles.versionBadgeText}>{version.shortName}</Text>
                        </View>
                        {isSelected && (
                          <MaterialCommunityIcons 
                            name="check-circle" 
                            size={24} 
                            color={version.color} 
                          />
                        )}
                      </View>

                      <Text style={styles.versionName}>{version.name}</Text>
                      
                      {version.coverage && (
                        <View style={styles.coverageContainer}>
                          <View style={styles.coverageBar}>
                            <View 
                              style={[
                                styles.coverageFill, 
                                { 
                                  width: `${version.coverage}%`,
                                  backgroundColor: version.color 
                                }
                              ]} 
                            />
                          </View>
                          <Text style={styles.coverageText}>
                            {version.coverage.toFixed(2)}% disponible
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Las versiones con menos del 100% usan RV1960 como respaldo
              </Text>
            </View>
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(107, 124, 147, 0.2)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  versionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  versionCardSelected: {
    borderWidth: 2,
    borderColor: '#00f3ff',
  },
  versionGradient: {
    padding: 16,
  },
  versionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  versionBadgeText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  versionName: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 12,
  },
  coverageContainer: {
    marginTop: 4,
  },
  coverageBar: {
    height: 4,
    backgroundColor: 'rgba(107, 124, 147, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  coverageFill: {
    height: '100%',
    borderRadius: 2,
  },
  coverageText: {
    fontSize: 12,
    color: '#6b7c93',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 124, 147, 0.2)',
  },
  footerText: {
    fontSize: 12,
    color: '#6b7c93',
    textAlign: 'center',
  },
});
