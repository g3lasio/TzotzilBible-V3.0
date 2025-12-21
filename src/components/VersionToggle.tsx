import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Pressable, Animated, LayoutChangeEvent } from 'react-native';
import { Text } from 'react-native-paper';

export type TogglePosition = 'left' | 'center' | 'right';

interface VersionToggleProps {
  value: TogglePosition;
  onChange: (position: TogglePosition) => void;
  onRightDoubleTap?: () => void;
  leftLabel: string;
  centerLabel: string;
  rightLabel: string;
  leftColor?: string;
  rightColor?: string;
}

const POSITIONS: TogglePosition[] = ['left', 'center', 'right'];

export default function VersionToggle({
  value,
  onChange,
  onRightDoubleTap,
  leftLabel,
  centerLabel,
  rightLabel,
  leftColor = '#00ff88',
  rightColor = '#00f3ff',
}: VersionToggleProps) {
  const containerWidth = useRef(0);
  const animatedValue = useRef(new Animated.Value(POSITIONS.indexOf(value))).current;

  useEffect(() => {
    const toIndex = POSITIONS.indexOf(value);
    Animated.timing(animatedValue, {
      toValue: toIndex,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [value, animatedValue]);

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.current = event.nativeEvent.layout.width;
  };

  const segmentWidth = containerWidth.current / 3 || 70;
  const thumbWidth = segmentWidth - 4;

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [2, segmentWidth + 2, segmentWidth * 2 + 2],
  });

  const handlePress = (position: TogglePosition) => {
    if (position === 'right' && value === 'right' && onRightDoubleTap) {
      onRightDoubleTap();
    } else if (position !== value) {
      onChange(position);
    }
  };

  const getTextColor = (position: TogglePosition) => {
    if (value === position) {
      if (position === 'left') return leftColor;
      if (position === 'right') return rightColor;
      return '#00f3ff';
    }
    return '#6b7c93';
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.thumb,
            {
              width: thumbWidth > 0 ? thumbWidth : 66,
              transform: [{ translateX }],
            },
          ]}
        />
        
        <Pressable
          style={styles.segment}
          onPress={() => handlePress('left')}
          accessibilityRole="button"
          accessibilityState={{ selected: value === 'left' }}
        >
          <View style={[styles.dot, { backgroundColor: leftColor }]} />
          <Text style={[styles.label, { color: getTextColor('left') }]}>
            {leftLabel}
          </Text>
        </Pressable>

        <Pressable
          style={styles.segment}
          onPress={() => handlePress('center')}
          accessibilityRole="button"
          accessibilityState={{ selected: value === 'center' }}
        >
          <Text style={[styles.label, { color: getTextColor('center') }]}>
            {centerLabel}
          </Text>
        </Pressable>

        <Pressable
          style={styles.segment}
          onPress={() => handlePress('right')}
          accessibilityRole="button"
          accessibilityState={{ selected: value === 'right' }}
        >
          <View style={[styles.dot, { backgroundColor: rightColor }]} />
          <Text style={[styles.label, { color: getTextColor('right') }]}>
            {rightLabel}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
  },
  track: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 40, 55, 0.95)',
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.25)',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    backgroundColor: 'rgba(0, 243, 255, 0.2)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0, 243, 255, 0.5)',
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
