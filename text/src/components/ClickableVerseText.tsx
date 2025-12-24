import React from 'react';
import { Text, StyleSheet, Platform, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { segmentText, BibleReference } from '../utils/bibleReferenceParser';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ClickableVerseTextProps {
  text: string;
  style?: any;
  linkColor?: string;
}

export default function ClickableVerseText({ 
  text, 
  style,
  linkColor = '#00f3ff'
}: ClickableVerseTextProps) {
  const navigation = useNavigation<NavigationProp>();
  
  const handleReferencePress = (ref: BibleReference) => {
    navigation.navigate('MainTabs', {
      screen: 'BibleTab',
      params: {
        screen: 'Verses',
        params: {
          book: ref.book,
          chapter: ref.chapter,
          initialVerse: ref.verse,
        },
      },
    });
  };
  
  const segments = segmentText(text);
  
  return (
    <Text style={style}>
      {segments.map((segment, index) => {
        if (segment.type === 'reference' && segment.reference) {
          const ref = segment.reference;
          return (
            <Text
              key={index}
              style={[styles.link, { color: linkColor }]}
              onPress={() => handleReferencePress(ref)}
              accessibilityRole="link"
            >
              {segment.content}
            </Text>
          );
        }
        return segment.content;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  link: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
});
