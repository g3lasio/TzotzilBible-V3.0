/**
 * EgwCitationCard — Nebula Dark Style
 *
 * Renders EGW (Ellen G. White) citations found in Nevin AI responses
 * as a distinct "Golden Glow" card. The component parses the standard
 * markdown blockquote format used by the AI:
 *
 *   > "Quote text here."
 *   >
 *   > — (BookAbbrev p. XXX)
 *
 * It does NOT alter any business logic — it only transforms the visual
 * presentation of these specific text segments.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface EgwCitationCardProps {
  quote: string;
  reference: string;
}

export function EgwCitationCard({ quote, reference }: EgwCitationCardProps) {
  return (
    <View style={styles.card}>
      {/* Top golden glow line */}
      <View style={styles.topLine} />

      {/* Badge */}
      <View style={styles.badge}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>ESCRITOS EGW</Text>
        {reference ? (
          <Text style={styles.badgeRef}> · {reference}</Text>
        ) : null}
      </View>

      {/* Decorative large quote mark */}
      <Text style={styles.decorativeQuote}>"</Text>

      {/* Quote text */}
      <Text style={styles.quoteText}>"{quote.trim()}"</Text>

      {/* Attribution */}
      <View style={styles.attribution}>
        <MaterialCommunityIcons name="feather" size={12} color="rgba(255,209,102,0.5)" />
        <Text style={styles.attributionText}>Elena G. de White</Text>
      </View>
    </View>
  );
}

/**
 * Parses a raw message string and splits it into segments:
 * - 'text'  → normal text to be rendered by ClickableVerseText
 * - 'egw'   → EGW citation to be rendered by EgwCitationCard
 *
 * Detects the standard blockquote pattern:
 *   > "..."
 *   >
 *   > — (Ref p. XX)
 *
 * Also handles the simpler single-line variant:
 *   > "..." — (Ref)
 */
export type MessageSegment =
  | { type: 'text'; content: string }
  | { type: 'egw'; quote: string; reference: string };

export function parseMessageSegments(raw: string): MessageSegment[] {
  const segments: MessageSegment[] = [];

  // Regex that captures multi-line blockquote blocks used by Nevin AI.
  // Matches a consecutive run of lines that start with ">" (including empty "> " lines
  // used as spacers between the quote and the attribution line).
  // This correctly captures the full 3-line pattern:
  //   > "Quote text."
  //   >
  //   > — (Ref p. XX)
  const blockquoteRegex = /((?:^>[ \t]?.*\n?)+)/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = blockquoteRegex.exec(raw)) !== null) {
    const blockStart = match.index;
    const blockEnd = match.index + match[0].length;
    const blockRaw = match[0];

    // Text before this block
    if (blockStart > lastIndex) {
      const before = raw.slice(lastIndex, blockStart).trim();
      if (before) segments.push({ type: 'text', content: before });
    }

    // Parse the blockquote lines
    const lines = blockRaw
      .split('\n')
      .map(l => l.replace(/^>\s?/, '').trim())
      .filter(l => l.length > 0);

    // Separate quote lines from attribution line
    const attributionLine = lines.find(l => /^—\s*\(/.test(l) || /^—\s*[A-Z]/.test(l));
    const quoteLines = lines.filter(l => l !== attributionLine);

    const quoteText = quoteLines
      .join(' ')
      .replace(/^[""]/, '')
      .replace(/[""]$/, '')
      .trim();

    // Extract reference abbreviation (e.g. "CC p. 45", "DTG p. 12", "CS p. 107")
    let reference = '';
    if (attributionLine) {
      const refMatch = attributionLine.match(/\(([^)]+)\)/);
      if (refMatch) reference = refMatch[1].trim();
    }

    if (quoteText) {
      segments.push({ type: 'egw', quote: quoteText, reference });
    }

    lastIndex = blockEnd;
  }

  // Remaining text after last block
  if (lastIndex < raw.length) {
    const after = raw.slice(lastIndex).trim();
    if (after) segments.push({ type: 'text', content: after });
  }

  // If nothing was parsed (no blockquotes), return the whole thing as text
  if (segments.length === 0) {
    segments.push({ type: 'text', content: raw });
  }

  return segments;
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    marginHorizontal: 0,
    backgroundColor: 'rgba(20, 14, 4, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.3)',
    padding: 14,
    overflow: 'hidden',
    // Golden glow shadow (works on iOS and web)
    ...Platform.select({
      ios: {
        shadowColor: '#FFD166',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 0 18px rgba(255, 209, 102, 0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
      } as any,
    }),
  },
  topLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255, 209, 102, 0.6)',
    // Gradient-like fade via opacity on web
    ...Platform.select({
      web: {
        background: 'linear-gradient(90deg, transparent, rgba(255,209,102,0.7), transparent)',
        boxShadow: '0 0 8px rgba(255,209,102,0.5)',
      } as any,
    }),
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD166',
    marginRight: 6,
    ...Platform.select({
      ios: { shadowColor: '#FFD166', shadowOpacity: 0.8, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } },
      web: { boxShadow: '0 0 5px #FFD166' } as any,
    }),
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFD166',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  badgeRef: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 209, 102, 0.6)',
    letterSpacing: 0.5,
  },
  decorativeQuote: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 72,
    color: 'rgba(255, 209, 102, 0.06)',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    lineHeight: 72,
  },
  quoteText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#F0E0B0',
    lineHeight: 22,
    marginBottom: 10,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  attribution: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  attributionText: {
    fontSize: 11,
    color: 'rgba(255, 209, 102, 0.5)',
    fontWeight: '500',
  },
});
