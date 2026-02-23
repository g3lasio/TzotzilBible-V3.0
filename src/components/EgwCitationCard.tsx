/**
 * EgwCitationCard — Nebula Dark Style
 *
 * Renders EGW citations found in Nevin AI responses as a subtle
 * bordered inline block. The card uses a near-transparent background
 * with a golden left-border accent and the feather icon — it complements
 * the chat flow without competing visually.
 *
 * Policy: The name "Elena G. de White" is NEVER displayed.
 *         Only the book abbreviation reference is shown (e.g. "CT p. 354").
 *
 * Parses the standard markdown blockquote format used by the AI:
 *   > "Quote text here."
 *   >
 *   > — (BookAbbrev p. XXX)
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
      {/* Golden left accent bar */}
      <View style={styles.leftBar} />

      <View style={styles.inner}>
        {/* Header row: feather icon + reference only (NO name) */}
        <View style={styles.header}>
          <MaterialCommunityIcons
            name="feather"
            size={11}
            color="rgba(255, 209, 102, 0.65)"
            style={styles.featherIcon}
          />
          <Text style={styles.headerText}>
            {reference ? reference : 'Escritos EGW'}
          </Text>
        </View>

        {/* Quote text */}
        <Text style={styles.quoteText}>"{quote.trim()}"</Text>
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

    // Separate quote lines from attribution line (starts with —)
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
  // Outer container — very subtle, near-transparent background
  card: {
    flexDirection: 'row',
    marginVertical: 10,
    marginHorizontal: 0,
    borderRadius: 8,
    overflow: 'hidden',
    // Barely-there background: just enough to distinguish from plain text
    backgroundColor: 'rgba(255, 209, 102, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 209, 102, 0.12)',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD166',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 0 8px rgba(255, 209, 102, 0.06)',
      } as any,
    }),
  },

  // Thin golden left accent bar
  leftBar: {
    width: 2,
    backgroundColor: 'rgba(255, 209, 102, 0.55)',
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#FFD166',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      web: {
        boxShadow: '0 0 6px rgba(255,209,102,0.4)',
      } as any,
    }),
  },

  // Content area
  inner: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  // Header: feather icon + reference abbreviation only
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  featherIcon: {
    marginRight: 5,
  },
  headerText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 209, 102, 0.6)',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Quote text — serif italic, warm cream tone
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    color: 'rgba(240, 224, 176, 0.85)',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
});
