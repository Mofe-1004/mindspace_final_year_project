/**
 * Bible Verse Selector
 *
 * Selects appropriate Bible verses based on sentiment and risk level.
 * Uses the bible_verses table with sentiment_match categories.
 *
 * Categories:
 * - positive: For positive sentiments
 * - negative_anxious: For anxiety/worry/stress
 * - negative_sad: For sadness/grief/loss
 * - neutral_encouragement: For general encouragement
 * - at_risk: For high-risk situations (comforting, crisis-appropriate)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Sentiment,
  RiskLevel,
  BibleVerse,
  BibleVerseSentimentMatch,
  BibleVerseCategory,
  getBibleVerseCategory
} from '../../types/shared';

// Initialize Supabase client for server-side use
let supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    supabase = createClient(url, serviceKey);
  }
  return supabase;
}

/**
 * Selected verse result
 */
export interface SelectedVerse {
  reference: string;
  text: string;
}

/**
 * Fallback verses in case database is unavailable
 * These cover all categories to ensure users always get a verse
 */
const FALLBACK_VERSES: Record<BibleVerseCategory, SelectedVerse[]> = {
  positive: [
    {
      reference: 'Psalm 118:24',
      text: 'This is the day the Lord has made; let us rejoice and be glad in it.'
    },
    {
      reference: 'Philippians 4:4',
      text: 'Rejoice in the Lord always. I will say it again: Rejoice!'
    },
  ],
  negative_anxious: [
    {
      reference: 'Philippians 4:6-7',
      text: 'Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God. And the peace of God, which transcends all understanding, will guard your hearts and your minds in Christ Jesus.'
    },
    {
      reference: 'Matthew 11:28',
      text: 'Come to me, all you who are weary and burdened, and I will give you rest.'
    },
  ],
  negative_sad: [
    {
      reference: 'Psalm 34:18',
      text: 'The Lord is close to the brokenhearted and saves those who are crushed in spirit.'
    },
    {
      reference: '2 Corinthians 1:3-4',
      text: 'Praise be to the God and Father of our Lord Jesus Christ, the Father of compassion and the God of all comfort, who comforts us in all our troubles.'
    },
  ],
  neutral_encouragement: [
    {
      reference: 'Proverbs 3:5-6',
      text: 'Trust in the Lord with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.'
    },
    {
      reference: 'Romans 8:28',
      text: 'And we know that in all things God works for the good of those who love him, who have been called according to his purpose.'
    },
  ],
  at_risk: [
    {
      reference: 'Isaiah 41:10',
      text: 'So do not fear, for I am with you; do not be dismayed, for I am your God. I will strengthen you and help you; I will uphold you with my righteous right hand.'
    },
    {
      reference: 'Psalm 46:1',
      text: 'God is our refuge and strength, an ever-present help in trouble.'
    },
  ],
};

/**
 * Selects a random item from an array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Fetches verses from the database by sentiment category
 */
async function fetchVersesFromDB(
  category: BibleVerseCategory
): Promise<BibleVerse[]> {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('bible_verses')
      .select('*')
      .eq('sentiment_match', category);

    if (error) {
      console.error('Error fetching verses:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Database connection error:', error);
    return [];
  }
}

/**
 * Selects an appropriate Bible verse based on sentiment and risk level
 *
 * @param sentiment - The detected sentiment
 * @param riskLevel - The assessed risk level
 * @returns A verse with reference and text
 */
export async function selectVerse(
  sentiment: Sentiment,
  riskLevel: RiskLevel
): Promise<SelectedVerse> {
  // Determine the appropriate category
  const category = getBibleVerseCategory(sentiment, riskLevel);

  // Try to fetch from database first
  const verses = await fetchVersesFromDB(category);

  if (verses.length > 0) {
    const verse = randomChoice(verses);
    return {
      reference: verse.verse_reference,
      text: verse.verse_text,
    };
  }

  // Fall back to hardcoded verses
  console.warn(`Using fallback verse for category: ${category}`);
  const fallbackVerses = FALLBACK_VERSES[category];
  return randomChoice(fallbackVerses);
}

/**
 * Gets a verse synchronously using fallback verses only
 * Used when database is unavailable or for testing
 */
export function selectVerseFallback(
  sentiment: Sentiment,
  riskLevel: RiskLevel
): SelectedVerse {
  const category = getBibleVerseCategory(sentiment, riskLevel);
  const fallbackVerses = FALLBACK_VERSES[category];
  return randomChoice(fallbackVerses);
}

/**
 * Checks if the verse database has verses for all categories
 */
export async function checkVerseDatabase(): Promise<{
  complete: boolean;
  categories: Record<BibleVerseSentimentMatch, number>;
}> {
  const categories: Record<BibleVerseSentimentMatch, number> = {
    [BibleVerseSentimentMatch.POSITIVE]: 0,
    negative_anxious: 0,
    negative_sad: 0,
    neutral_encouragement: 0,
    at_risk: 0,
  };

  let complete = true;

  for (const category of Object.values(BibleVerseSentimentMatch)) {
    const verses = await fetchVersesFromDB(category);
    categories[category] = verses.length;
    if (verses.length < 5) {
      complete = false; // Need at least 5 verses per category for good variety
    }
  }

  return { complete, categories };
}
