/**
 * Language Detector - Nigerian Pidgin vs English
 *
 * Detects whether text is written in:
 * - English (standard)
 * - Nigerian Pidgin
 * - Mixed (both languages present)
 *
 * Uses pattern matching with common Pidgin markers.
 * This is a lightweight, fast approach that doesn't require ML.
 */

import { Language } from '../../types/shared';

/**
 * Common Nigerian Pidgin words and phrases
 * These are distinctive markers that indicate Pidgin usage
 */
export const PIDGIN_MARKERS = [
  // Common Pidgin words
  'dey', 'wetin', 'wahala', 'abi', 'sha', 'shey', 'sef', 'abeg',
  'na', 'dem', 'una', 'wey', 'sabi', 'no be', 'e don', 'im',
  'gist', 'gobe', 'kolo', 'japa', 'gbas', 'yawa', 'oya',
  'chop', 'comot', 'dodo', 'jara', 'katakata', 'omo', 'pikin',
  'carry go', 'no wahala', 'no vex', 'how far', 'wehdone',
  'e be like', 'make i', 'weda', 'beta', 'berra', 'helep',

  // Pidgin expressions
  'i no fit', 'e no easy', 'no be small', 'body no be firewood',
  'i tire', 'e tire me', 'my head dey pain', 'i no understand',
  'wetin dey happen', 'how body', 'i dey', 'e dey', 'we dey',
  'i wan', 'make we', 'no go', 'go come', 'e no get',

  // Emotional expressions in Pidgin
  'i dey fear', 'i dey worry', 'my heart dey pain', 'i no happy',
  'i dey vex', 'i no sabi wetin', 'everything don spoil',
  'i dey try', 'na wa', 'na so', 'i no fit cope',
];

/**
 * Common English-only indicators (words rarely used in Pidgin)
 */
const ENGLISH_INDICATORS = [
  'although', 'therefore', 'however', 'consequently', 'furthermore',
  'nevertheless', 'regarding', 'concerning', 'essentially', 'specifically',
  'particularly', 'approximately', 'subsequently', 'unfortunately',
  'additionally', 'alternatively', 'accordingly', 'meanwhile',
];

/**
 * Counts occurrences of patterns in text (case-insensitive)
 */
function countPatterns(text: string, patterns: string[]): number {
  const lowerText = ` ${text.toLowerCase()} `; // Add spaces for word boundary matching
  let count = 0;

  for (const pattern of patterns) {
    // Match as whole words/phrases
    const regex = new RegExp(`\\b${pattern.replace(/\s+/g, '\\s+')}\\b`, 'gi');
    const matches = lowerText.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
}

/**
 * Detects the primary language of the input text
 *
 * Algorithm:
 * 1. Count Pidgin markers in the text
 * 2. Count English-specific indicators
 * 3. Calculate ratio based on text length
 * 4. Classify as Pidgin, English, or Mixed
 *
 * @param text - The input text to analyze
 * @returns Language enum value
 */
export function detectLanguage(text: string): Language {
  if (!text || text.trim().length === 0) {
    return Language.ENGLISH; // Default to English for empty text
  }

  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // For very short text, be conservative
  if (wordCount < 3) {
    return Language.ENGLISH;
  }

  const pidginCount = countPatterns(text, PIDGIN_MARKERS);
  const englishCount = countPatterns(text, ENGLISH_INDICATORS);

  // Calculate density (markers per 10 words)
  const pidginDensity = (pidginCount / wordCount) * 10;
  const englishDensity = (englishCount / wordCount) * 10;

  // Classification thresholds
  const PIDGIN_THRESHOLD = 0.5; // At least 0.5 Pidgin markers per 10 words
  const MIXED_THRESHOLD = 0.2;  // Some Pidgin presence

  // Pure Pidgin: high Pidgin density, low formal English
  if (pidginDensity >= PIDGIN_THRESHOLD && englishDensity < 0.3) {
    return Language.PIDGIN;
  }

  // Mixed: some Pidgin markers present
  if (pidginDensity >= MIXED_THRESHOLD) {
    return Language.MIXED;
  }

  // Default to English
  return Language.ENGLISH;
}

/**
 * Gets a human-readable description of the detected language
 */
export function getLanguageDescription(language: Language): string {
  switch (language) {
    case Language.PIDGIN:
      return 'Nigerian Pidgin';
    case Language.MIXED:
      return 'Mixed (English and Pidgin)';
    case Language.ENGLISH:
    default:
      return 'English';
  }
}

/**
 * Checks if text contains any Pidgin elements
 * Useful for deciding whether to use Pidgin-friendly responses
 */
export function containsPidgin(text: string): boolean {
  const language = detectLanguage(text);
  return language === Language.PIDGIN || language === Language.MIXED;
}
