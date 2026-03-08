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
import Anthropic from '@anthropic-ai/sdk';
import {
  Sentiment,
  RiskLevel,
  BibleVerse,
  BibleVerseSentimentMatch,
  BibleVerseCategory,
  getBibleVerseCategory
} from '../_types/shared';

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
  negative_angry: [
    {
      reference: 'Psalm 62:5-6',
      text: 'Yes, my soul, find rest in God; my hope comes from him. Truly he is my rock and my salvation; he is my fortress, I will not be shaken.'
    },
    {
      reference: 'Romans 12:12',
      text: 'Be joyful in hope, patient in affliction, faithful in prayer.'
    },
  ],
  negative_struggle: [
    {
      reference: 'John 8:36',
      text: 'So if the Son sets you free, you will be free indeed.'
    },
    {
      reference: '2 Corinthians 12:9',
      text: 'But he said to me, "My grace is sufficient for you, for my power is made perfect in weakness." Therefore I will boast all the more gladly about my weaknesses, so that Christ\'s power may rest on me.'
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
      return [];
    }

    return data || [];
  } catch {
    return [];
  }
}

/**
 * Uses Claude Haiku to pick the most contextually appropriate verse
 * from a list of candidates based on the student's dominant emotion.
 *
 * Returns the index of the best verse, or -1 on failure.
 */
/**
 * Category-specific guidance for the AI verse ranker.
 * Each line tells Claude Haiku what KIND of verse to prefer for this emotion category.
 */
const CATEGORY_GUIDANCE: Record<BibleVerseCategory, string> = {
  positive: 'Pick a verse that celebrates joy or gratitude with the student.',
  negative_anxious: 'Pick a verse that offers peace and reassurance about the future.',
  negative_sad: 'Pick a verse that offers comfort and hope during grief or sadness.',
  negative_angry: 'Read what the student wrote carefully. If they are angry at a PERSON (family, friend, roommate), pick a verse about peace, forgiveness, or healing relationships. If they are frustrated with a SITUATION (school, systems, unfairness), pick a verse about patience, endurance, or God\'s justice. Either way, never scold or tell the student to stop being angry.',
  negative_struggle: 'Pick a verse that speaks to strength and freedom from hardship.',
  neutral_encouragement: 'Pick a verse that gently encourages and uplifts.',
  at_risk: 'Pick the most personally comforting verse — one that affirms the student\'s worth and God\'s presence. Avoid any verse with violent or dark imagery.',
};

async function aiRankVerses(
  verses: { reference: string; text: string }[],
  dominantEmotion: string,
  sentiment: Sentiment,
  riskLevel: RiskLevel,
  category: BibleVerseCategory,
  studentText?: string,
  concernType?: 'substance_abuse' | 'abuse' | 'eating_disorder' | 'isolation' | null
): Promise<number> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || verses.length <= 1) return -1;

  try {
    const client = new Anthropic({ apiKey });

    const verseList = verses
      .map((v, i) => `${i + 1}. ${v.reference}: "${v.text}"`)
      .join('\n');

    // Build context-aware prompt — include specific concern type when available
    const concernLabels: Record<string, string> = {
      substance_abuse: 'substance addiction',
      abuse: 'physical or emotional abuse',
      eating_disorder: 'an eating disorder or self-neglect',
      isolation: 'severe loneliness and isolation',
    };
    const concernContext = concernType && concernLabels[concernType]
      ? ` This student is dealing with ${concernLabels[concernType]}.`
      : '';

    // Include student's text so the AI can understand the situation (not just the emotion label)
    const studentContext = studentText
      ? `\n\nThe student wrote: "${studentText}"`
      : '';

    const guidance = CATEGORY_GUIDANCE[category];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 10,
      messages: [
        {
          role: 'user',
          content: `A university student is feeling "${dominantEmotion}" (sentiment: ${sentiment}, risk: ${riskLevel}).${concernContext}${studentContext}

${guidance} Always pick a verse that COMFORTS or ENCOURAGES — never one that corrects, lectures, or implies the student is sinning. Prefer verses that use "you" or feel like a direct promise. Reply with ONLY the number.

${verseList}`,
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    const match = text.match(/\d+/);
    if (match) {
      const index = parseInt(match[0], 10) - 1;
      if (index >= 0 && index < verses.length) {
        return index;
      }
    }
    return -1;
  } catch {
    return -1;
  }
}

/**
 * Selects an appropriate Bible verse based on sentiment, risk level, and emotion.
 *
 * Flow:
 * 1. Determine category from sentiment + risk level
 * 2. Fetch candidate verses from DB (or use fallbacks)
 * 3. If ANTHROPIC_API_KEY is configured, use Claude Haiku to pick the best match
 * 4. Otherwise, pick randomly
 *
 * @param sentiment - The detected sentiment
 * @param riskLevel - The assessed risk level
 * @param dominantEmotion - The dominant emotion detected by ML (e.g., 'sadness', 'confusion')
 * @param hasConcernLanguage - Whether addiction/abuse/neglect phrases were detected
 * @returns A verse with reference and text
 */
export async function selectVerse(
  sentiment: Sentiment,
  riskLevel: RiskLevel,
  dominantEmotion?: string,
  hasConcernLanguage?: boolean,
  concernType?: 'substance_abuse' | 'abuse' | 'eating_disorder' | 'isolation' | null,
  studentText?: string
): Promise<SelectedVerse> {
  // Determine the appropriate category (uses emotion to distinguish anger vs sadness, concern → struggle)
  const category = getBibleVerseCategory(sentiment, riskLevel, dominantEmotion, hasConcernLanguage);

  // Try to fetch from database first
  const dbVerses = await fetchVersesFromDB(category);

  // Build candidate list
  let candidates: SelectedVerse[];
  if (dbVerses.length > 0) {
    candidates = dbVerses.map((v) => ({
      reference: v.verse_reference,
      text: v.verse_text,
    }));
  } else {
    candidates = FALLBACK_VERSES[category];
  }

  // If AI key is configured and we have a dominant emotion, use AI ranking
  if (dominantEmotion && process.env.ANTHROPIC_API_KEY && candidates.length > 1) {
    const bestIndex = await aiRankVerses(candidates, dominantEmotion, sentiment, riskLevel, category, studentText, concernType);
    if (bestIndex >= 0) {
      return candidates[bestIndex];
    }
  }

  // Fallback to random selection
  return randomChoice(candidates);
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
    negative_angry: 0,
    negative_struggle: 0,
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
