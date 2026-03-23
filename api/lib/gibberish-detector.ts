/**
 * Gibberish Detector - Input Quality Validation
 *
 * Validates text quality BEFORE expensive ML analysis.
 * Uses rule-based heuristics that are safe for Nigerian Pidgin.
 *
 * Rules applied in order:
 * 1. Minimum word count (≥ 3)
 * 2. Must contain alphabetic characters
 * 3. Character repetition check (no spam like "aaaaaaa")
 * 4. Word repetition check (no copy-paste loops)
 * 5. Keyboard smash detection (words with no vowels)
 * 6. Dictionary word ratio (English + Pidgin whitelist)
 */

import { PIDGIN_MARKERS } from './language-detector';

// ── Common English words (top ~300 most frequent) ──────────────────────────
// Covers articles, pronouns, prepositions, common verbs, adjectives, nouns
const COMMON_ENGLISH_WORDS = new Set([
  // Articles & determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those', 'my', 'your', 'his',
  'her', 'its', 'our', 'their', 'some', 'any', 'no', 'every', 'each', 'all',
  // Pronouns
  'i', 'me', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'him',
  'us', 'who', 'what', 'which', 'whom', 'myself', 'yourself', 'itself',
  // Prepositions & conjunctions
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'of', 'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'then', 'than',
  'because', 'since', 'while', 'when', 'where', 'how', 'why', 'until',
  // Common verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'shall', 'can', 'must', 'need', 'get', 'got', 'go', 'went',
  'gone', 'come', 'came', 'take', 'took', 'make', 'made', 'give', 'gave',
  'know', 'knew', 'think', 'thought', 'say', 'said', 'tell', 'told',
  'see', 'saw', 'find', 'found', 'want', 'like', 'feel', 'felt', 'try',
  'tried', 'keep', 'kept', 'let', 'put', 'run', 'ran', 'sit', 'sat',
  'stand', 'stood', 'lose', 'lost', 'pay', 'paid', 'meet', 'met',
  'bring', 'brought', 'hold', 'held', 'write', 'wrote', 'read',
  'learn', 'learned', 'help', 'helped', 'start', 'started', 'stop',
  'stopped', 'open', 'opened', 'close', 'closed', 'turn', 'show',
  'hear', 'heard', 'play', 'move', 'live', 'believe', 'happen',
  'work', 'worked', 'call', 'called', 'ask', 'asked', 'use', 'used',
  'look', 'looked', 'talk', 'talked', 'love', 'loved', 'hate', 'care',
  // Common adjectives
  'good', 'bad', 'great', 'big', 'small', 'long', 'short', 'old', 'new',
  'young', 'high', 'low', 'right', 'wrong', 'best', 'worst', 'hard',
  'easy', 'happy', 'sad', 'angry', 'afraid', 'scared', 'tired', 'sick',
  'sorry', 'fine', 'sure', 'real', 'true', 'free', 'full', 'empty',
  'different', 'same', 'important', 'possible', 'able', 'ready',
  'better', 'worse', 'much', 'many', 'more', 'most', 'less', 'few',
  'first', 'last', 'next', 'other', 'only', 'own', 'alone', 'enough',
  // Common nouns
  'time', 'day', 'night', 'week', 'month', 'year', 'today', 'tomorrow',
  'people', 'person', 'man', 'woman', 'child', 'children', 'boy', 'girl',
  'family', 'friend', 'friends', 'mother', 'father', 'brother', 'sister',
  'life', 'world', 'home', 'house', 'school', 'class', 'exam', 'test',
  'work', 'job', 'money', 'food', 'water', 'hand', 'head', 'heart',
  'mind', 'body', 'eye', 'eyes', 'face', 'name', 'place', 'way',
  'thing', 'things', 'part', 'problem', 'question', 'answer', 'reason',
  'point', 'fact', 'case', 'story', 'word', 'words', 'idea',
  // Common adverbs
  'not', 'very', 'really', 'just', 'also', 'too', 'still', 'already',
  'always', 'never', 'often', 'sometimes', 'usually', 'again', 'here',
  'there', 'now', 'well', 'even', 'almost', 'maybe', 'please',
  // Indefinite pronouns — conspicuously missing from original list
  'nobody', 'everybody', 'somebody', 'someone', 'anyone', 'everyone',
  'nothing', 'everything', 'something', 'anything',
  'nowhere', 'somewhere', 'anywhere', 'everywhere', 'whoever', 'whatever',
  // Common verb inflections (3rd person singular / gerunds / past) missing from base forms
  'keeps', 'takes', 'makes', 'comes', 'goes', 'gets', 'puts', 'runs',
  'tries', 'calls', 'asks', 'looks', 'talks', 'feels', 'hurts', 'helps',
  'shows', 'seems', 'becomes', 'leaves', 'happens', 'means', 'gives',
  'knows', 'thinks', 'says', 'tells', 'sees', 'finds', 'wants', 'likes',
  'caring', 'doing', 'going', 'coming', 'getting', 'making', 'taking',
  'saying', 'telling', 'seeing', 'knowing', 'thinking', 'trying', 'having',
  // Interpersonal / university social context
  'roommate', 'roommates', 'classmate', 'classmates', 'colleague', 'colleagues',
  'lecturer', 'lecturers', 'teacher', 'teachers', 'professor', 'professors',
  'student', 'students', 'guy', 'guys', 'everyone', 'someone',
  // Behaviour / conflict words students commonly use
  'disrespect', 'disrespecting', 'disrespected', 'disrespectful',
  'respect', 'respecting', 'respected', 'respectful',
  'ignore', 'ignoring', 'ignored', 'bully', 'bullying', 'bullied',
  'treat', 'treating', 'treated', 'mistreat', 'mistreating', 'mistreated',
  'behave', 'behaving', 'behavior', 'behaviour', 'attitude',
  'rude', 'rudeness', 'unfair', 'unfairly', 'mean', 'toxic',
  'argue', 'arguing', 'argued', 'argument', 'fight', 'fighting', 'fought',
  'shout', 'shouting', 'yell', 'yelling', 'blame', 'blaming', 'blamed',
  // Additional emotional / expressive words students use
  'upset', 'horrible', 'terrible', 'awful', 'ashamed', 'shame',
  'embarrassed', 'embarrassing', 'scared', 'scared', 'mad', 'furious',
  'heartbroken', 'broken', 'devastated', 'disappointed', 'disappointing',
  'excited', 'happy', 'grateful', 'thankful', 'blessed', 'proud',
  'nervous', 'anxious', 'panic', 'panicking', 'afraid', 'fear',
  'sorry', 'regret', 'regretting', 'guilty', 'guilt',
  'miss', 'missing', 'missed', 'alone', 'lonely', 'isolated',
  'tired', 'exhausted', 'drained', 'burnt', 'burned',
  // Academic context
  'exam', 'exams', 'test', 'tests', 'assignment', 'assignments',
  'project', 'projects', 'lecture', 'lectures', 'course', 'courses',
  'grade', 'grades', 'result', 'results', 'score', 'scores', 'pass', 'fail',
  'failed', 'failing', 'passed', 'passing', 'defence', 'defense',
  'semester', 'campus', 'hostel', 'department', 'faculty',
  // Mental health related
  'stressed', 'stress', 'anxious', 'anxiety', 'depressed', 'depression',
  'lonely', 'overwhelmed', 'worried', 'worry', 'nervous', 'confused',
  'frustrated', 'hopeless', 'helpless', 'exhausted', 'struggling',
  'pressure', 'burden', 'pain', 'hurt', 'suffer', 'suffering',
  'feeling', 'feelings', 'emotion', 'emotions', 'mood', 'mental',
  'health', 'support', 'counselor', 'therapy', 'cope', 'coping',
  'sleep', 'sleeping', 'cry', 'crying', 'pray', 'praying', 'god',
  'faith', 'hope', 'peace', 'rest', 'calm', 'relax', 'breathe',
  // Contractions (without apostrophe — how users often type)
  'dont', 'cant', 'wont', 'isnt', 'arent', 'wasnt', 'werent',
  'havent', 'hasnt', 'didnt', 'wouldnt', 'couldnt', 'shouldnt',
  'im', 'ive', 'ill', 'youre', 'youve', 'youll', 'hes', 'shes',
  'its', 'were', 'theyve', 'theyre', 'theyll', 'thats', 'whats',
  "don't", "can't", "won't", "isn't", "aren't", "wasn't", "weren't",
  "haven't", "hasn't", "didn't", "wouldn't", "couldn't", "shouldn't",
  "i'm", "i've", "i'll", "you're", "you've", "you'll", "he's", "she's",
  "it's", "we're", "they've", "they're", "they'll", "that's", "what's",
]);

// ── Pure function words (excluded from content-word ratio check) ─────────────
// These words carry grammatical structure but no content signal.
// Without this filter, "I am [gibberish] and [gibberish] but [gibberish]"
// passes because "I", "am", "and", "but" inflate the recognised ratio.
const FUNCTION_WORDS = new Set([
  // Articles & determiners
  'a', 'an', 'the', 'this', 'that', 'these', 'those',
  'my', 'your', 'his', 'her', 'its', 'our', 'their',
  'some', 'any', 'no', 'every', 'each', 'all',
  // Personal & relative pronouns
  'i', 'me', 'you', 'he', 'she', 'it', 'we', 'they', 'them', 'him', 'us',
  'who', 'what', 'which', 'whom', 'myself', 'yourself', 'itself',
  // Prepositions
  'in', 'on', 'at', 'to', 'for', 'with', 'from', 'by', 'about', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between', 'of',
  // Coordinating & subordinating conjunctions
  'and', 'but', 'or', 'nor', 'so', 'yet', 'if', 'then', 'than',
  'because', 'since', 'while', 'when', 'where', 'how', 'why', 'until',
  // Auxiliary verbs
  'is', 'am', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'must',
]);

// ── Build Pidgin word set from markers ──────────────────────────────────────
// Extract individual words from multi-word Pidgin phrases
const PIDGIN_WORDS = new Set<string>();
for (const marker of PIDGIN_MARKERS) {
  for (const word of marker.split(/\s+/)) {
    if (word.length >= 2) {
      PIDGIN_WORDS.add(word.toLowerCase());
    }
  }
}

// ── Vowel set for keyboard smash detection ──────────────────────────────────
const VOWELS = new Set('aeiouAEIOU');

export interface TextQualityResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates text quality before ML analysis.
 * Returns { valid: true } for acceptable text, or { valid: false, reason } for gibberish.
 */
export function validateTextQuality(text: string): TextQualityResult {
  const trimmed = text.trim();

  // Rule 1: Must contain alphabetic characters
  if (!/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, reason: 'Your entry should contain words, not just numbers or symbols.' };
  }

  // Rule 2: Minimum word count (≥ 3)
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    return { valid: false, reason: 'Please write at least a few words about how you\'re feeling.' };
  }

  // Rule 3: Character repetition — reject if any single character is 80%+ of the text
  const alphaOnly = trimmed.replace(/\s/g, '').toLowerCase();
  if (alphaOnly.length > 0) {
    const charCounts = new Map<string, number>();
    for (const ch of alphaOnly) {
      charCounts.set(ch, (charCounts.get(ch) || 0) + 1);
    }
    for (const count of charCounts.values()) {
      if (count / alphaOnly.length >= 0.8) {
        return { valid: false, reason: 'Please enter a meaningful reflection about your day or feelings.' };
      }
    }
  }

  // Rule 4: Word repetition — reject if the same word makes up > 60% of all words
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    const lower = word.toLowerCase().replace(/[^a-z']/g, '');
    if (lower.length > 0) {
      wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1);
    }
  }
  for (const count of wordCounts.values()) {
    if (count / words.length > 0.6 && words.length > 3) {
      return { valid: false, reason: 'It looks like you repeated the same words. Please share a genuine reflection.' };
    }
  }

  // Rule 5: Keyboard smash detection — reject if > 50% of words have no vowels
  // Only check words that are purely alphabetic and at least 3 chars
  const alphaWords = words
    .map(w => w.replace(/[^a-zA-Z]/g, ''))
    .filter(w => w.length >= 3);

  if (alphaWords.length >= 3) {
    const noVowelCount = alphaWords.filter(
      w => ![...w].some(ch => VOWELS.has(ch))
    ).length;

    if (noVowelCount / alphaWords.length > 0.5) {
      return { valid: false, reason: 'Please enter a meaningful reflection about your day or feelings.' };
    }
  }

  // Rule 6: Content-word ratio — filter function words first, then score against the dictionary.
  // Only content words (non-function words) are checked; structural glue words are excluded.
  // This prevents "I am [gibberish] and [gibberish] but [gibberish]" from passing
  // just because "I", "am", "and", "but" inflate the recognised word count.
  const cleanedWords = words
    .map(w => w.toLowerCase().replace(/[^a-z']/g, ''))
    .filter(w => w.length >= 2);

  if (cleanedWords.length >= 3) {
    const contentWords = cleanedWords.filter(w => !FUNCTION_WORDS.has(w));

    if (contentWords.length >= 1) {
      const recognizedContent = contentWords.filter(
        w => COMMON_ENGLISH_WORDS.has(w) || PIDGIN_WORDS.has(w)
      ).length;

      if (recognizedContent / contentWords.length < 0.3) {
        return { valid: false, reason: 'Please enter a meaningful reflection about your day or feelings.' };
      }
    }
    // If contentWords.length === 0, all words are pure function words —
    // the minimum word count (Rule 2) already limits trivially short inputs.
  }

  return { valid: true };
}
