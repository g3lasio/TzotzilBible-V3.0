import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
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
          <View style={styles.picker}>
            {SECONDARY_VERSIONS.map((version: BibleVersion) => {
              const isSelected = version.id === selectedVersion;
              
              return (
                <TouchableOpacity
                  key={version.id}
                  style={[
                    styles.option,
                    isSelected && styles.optionSelected
                  ]}
                  onPress={() => handleSelect(version.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.optionText,
                    isSelected && styles.optionTextSelected
                  ]}>
                    {version.shortName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#1a2332',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#2a3442',
  },
  picker: {
    // Simple list of options
  },
  option: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2a3442',
  },
  optionSelected: {
    backgroundColor: '#00f3ff22',
  },
  optionText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: '#00f3ff',
    fontWeight: 'bold',
  },
});
