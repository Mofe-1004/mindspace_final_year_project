/**
 * ML Service - HuggingFace Integration
 *
 * Handles sentiment analysis using Cardiff RoBERTa and
 * mental health risk assessment using GoEmotions.
 *
 * Flow: Translate Pidgin → Cardiff (sentiment) → GoEmotions (emotions/risk) → Combined result
 */

import {
  Sentiment,
  RiskLevel,
  MLAnalysisResult
} from '../_types/shared';
import { detectLanguage } from './language-detector';

// Working model identifiers (tested and confirmed on HuggingFace Inference Providers)
const CARDIFF_MODEL = 'cardiffnlp/twitter-roberta-base-sentiment-latest';
const GOEMOTIONS_MODEL = 'SamLowe/roberta-base-go_emotions';

// Timeout for each model call (30 seconds to handle cold starts)
// HuggingFace free tier models can take 20-30 seconds on first request after idle
const MODEL_TIMEOUT_MS = 30000;

// HuggingFace API base URL (new router endpoint)
const HF_API_URL = 'https://router.huggingface.co/hf-inference/models';

/**
 * Common Nigerian Pidgin to English translations
 * This helps the models understand Pidgin text better
 */
const PIDGIN_TRANSLATIONS: Record<string, string> = {
  // Expressions of distress
  'i no fit': "i can't",
  'i no fit cope': "i can't cope",
  'e no easy': "it's not easy",
  'wahala': 'problem',
  'wahala dey': 'there is a problem',
  'i dey tire': 'i am tired',
  'i tire': 'i am tired',
  'wetin': 'what',
  'wetin dey happen': 'what is happening',
  'i no know wetin to do': "i don't know what to do",
  'e dey pain me': 'it hurts me',
  'my heart dey pain me': 'my heart hurts',
  'i no happy': "i'm not happy",
  'i no dey happy': "i'm not happy",
  'i dey sad': 'i am sad',
  'i dey vex': 'i am angry',
  'i dey fear': 'i am afraid',
  'fear dey catch me': 'i am afraid',
  'i dey worry': 'i am worried',
  'i no fit sleep': "i can't sleep",
  'sleep no dey come': "i can't sleep",
  'i wan give up': 'i want to give up',
  'i no see hope': "i don't see hope",
  'na so life be': 'that is how life is',
  'life no balance': 'life is not balanced',
  'i dey struggle': 'i am struggling',
  'e too much for me': "it's too much for me",
  'i no fit again': "i can't anymore",
  'body no dey': "i don't feel well",
  'my body no correct': "i don't feel well",

  // Positive expressions
  'i dey okay': 'i am okay',
  'i dey fine': 'i am fine',
  'i dey alright': 'i am alright',
  'i happy': 'i am happy',
  'i dey happy': 'i am happy',
  'e sweet me': 'it makes me happy',
  'i dey grateful': 'i am grateful',
  'God dey': 'God is present',
  'we move': "let's move forward",
  'we dey move': 'we are moving forward',
  'e go better': 'it will get better',
  'na small thing': "it's a small thing",

  // Transitive fear/scare patterns ("dey [verb] me" where subject is external)
  'dey fear me': 'scares me',
  'dey fear us': 'scares us',
  'dey scare me': 'scares me',
  'dey worry me': 'worries me',
  'dey pain me': 'hurts me',
  'dey stress me': 'stresses me',

  // "no wan" - very common negation of desire
  'no wan': "don't want",
  'i wan': 'i want',

  // Pidgin comparative "pass" = "more than"
  'pass anything': 'more than anything',
  'pass everything': 'more than everything',
  'pass all': 'more than all of them',
  'pass before': 'more than before',

  // General expressions
  'abeg': 'please',
  'oya': 'come on',
  'sha': 'anyway',
  'dey': 'am/is/are',  // Generic fallback — specific "dey X me" patterns above take priority
  'no be': "it's not",
  'na': "it's",
  'dem': 'they/them',
  'una': 'you all',
  'wey': 'that/which',
  'for': 'in/at',
  'chop': 'eat',
  'gist': 'talk/story',
  'japa': 'run away/escape',
  'sabi': 'know',
  'shege': 'trouble/suffering',
};

/**
 * HuggingFace text classification response type
 */
interface HfClassificationResult {
  label: string;
  score: number;
}

/**
 * Translates Nigerian Pidgin phrases to English
 * Uses simple phrase matching for common expressions
 */
function translatePidgin(text: string): string {
  let translated = text.toLowerCase();

  // Sort by phrase length (longest first) to match longer phrases before shorter ones
  const sortedPhrases = Object.entries(PIDGIN_TRANSLATIONS)
    .sort((a, b) => b[0].length - a[0].length);

  for (const [pidgin, english] of sortedPhrases) {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${pidgin}\\b`, 'gi');
    translated = translated.replace(regex, english);
  }

  return translated;
}

/**
 * Makes a single HTTP request to a HuggingFace model
 */
async function fetchModel(
  model: string,
  text: string,
  timeoutMs: number
): Promise<HfClassificationResult[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${HF_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: text }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HuggingFace API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    // HuggingFace returns [[{label, score}, ...]] for text classification
    if (Array.isArray(result) && Array.isArray(result[0])) {
      return result[0] as HfClassificationResult[];
    }

    // Some models return [{label, score}, ...]
    if (Array.isArray(result)) {
      return result as HfClassificationResult[];
    }

    throw new Error('Unexpected response format from HuggingFace');
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Model ${model} timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Returns true for transient network errors worth retrying (ETIMEDOUT, ECONNRESET, fetch failed)
 * Does NOT retry on HuggingFace API errors (400, 401, 503 model loading) or timeouts
 */
function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  // fetch failed = Node's undici error for TCP-level failures (ETIMEDOUT, ECONNREFUSED, etc.)
  if (msg === 'fetch failed') return true;
  // Catch any cause code directly
  const cause = (error as NodeJS.ErrnoException & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as NodeJS.ErrnoException).code ?? '';
    return ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND'].includes(code);
  }
  return false;
}

/**
 * Calls a HuggingFace model with timeout handling and one retry on network failure
 */
async function callModelWithTimeout(
  model: string,
  text: string,
  timeoutMs: number = MODEL_TIMEOUT_MS
): Promise<HfClassificationResult[]> {
  try {
    return await fetchModel(model, text, timeoutMs);
  } catch (firstError) {
    if (isNetworkError(firstError)) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await fetchModel(model, text, timeoutMs);
    }
    throw firstError;
  }
}

/**
 * Maps Cardiff RoBERTa labels to our Sentiment enum
 * Cardiff returns: negative, neutral, positive
 */
function mapToSentiment(label: string): Sentiment {
  const normalized = label.toLowerCase().trim();

  if (normalized.includes('positive')) return Sentiment.POSITIVE;
  if (normalized.includes('negative')) return Sentiment.NEGATIVE;
  return Sentiment.NEUTRAL;
}

/**
 * Crisis keyword detection
 *
 * GoEmotions doesn't have a "suicidal" label — it maps crisis language to
 * generic emotions like "sadness". This keyword list catches explicit crisis
 * phrases that the model misses, forcing HIGH risk when detected.
 *
 * Includes English and Nigerian Pidgin variants.
 */
const CRISIS_PHRASES = [
  // English — explicit suicidal/crisis language
  'want to die', 'wanna die', 'want to end it', 'end my life', 'end it all',
  'kill myself', 'killing myself', 'take my life', 'take my own life',
  'no reason to live', 'no point in living', 'not worth living',
  'better off dead', 'wish i was dead', 'wish i were dead',
  'don\'t want to be here', 'dont want to be here',
  'don\'t want to exist', 'dont want to exist',
  'can\'t go on', 'cant go on', 'can\'t take it anymore', 'cant take it anymore',
  'no way out', 'give up on life', 'nothing to live for',
  'suicide', 'suicidal',
  // English — indirect crisis language ("feel like dying", self-harm)
  'feel like dying', 'feels like dying', 'like dying', 'rather be dead', 'rather die',
  'ready to die', 'want to disappear', 'wanna disappear',
  'hurt myself', 'harm myself', 'cut myself', 'self harm', 'self-harm',
  'don\'t want to wake up', 'dont want to wake up',
  'don\'t want to live', 'dont want to live', 'tired of living',
  'life is not worth it', 'life isn\'t worth it', 'life isnt worth it',
  // Nigerian Pidgin
  'i wan die', 'i want die', 'make i die', 'i go kill myself',
  'no reason to dey alive', 'life no worth am', 'i no wan live again',
  'i no fit continue', 'wetin be the point', 'i don tire for life',
  'i wan end am', 'nothing dey for me again',
  'e be like say i wan die', 'i dey feel like to die', 'i no wan dey here again',
];

/**
 * Checks if text contains crisis language that should force HIGH risk.
 * Uses lowercase matching against known crisis phrases.
 */
function detectCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}

/**
 * Concern phrases — serious disclosures that should force at least MODERATE risk.
 *
 * These aren't immediately life-threatening (unlike CRISIS_PHRASES → HIGH),
 * but indicate situations that need counselor attention: addiction, abuse,
 * eating disorders, self-neglect, and severe isolation.
 */
/**
 * Concern categories — used to give the AI verse selector specific context
 * about what the student is dealing with.
 */
export type ConcernType = 'substance_abuse' | 'abuse' | 'eating_disorder' | 'isolation' | null;

const CONCERN_CATEGORY_MAP: { phrases: string[]; type: ConcernType }[] = [
  {
    type: 'substance_abuse',
    phrases: [
      'addicted to', 'addiction', 'addicted', 'abusing drugs', 'abusing alcohol',
      'drug abuse', 'alcohol abuse', 'substance abuse',
      'i do drugs', 'i use drugs', 'using drugs', 'taking drugs',
      'can\'t stop drinking', 'cant stop drinking', 'drinking too much',
      'can\'t stop using', 'cant stop using',
      'overdose', 'overdosed',
      'i dey take drugs', 'i dey drink too much',
    ],
  },
  {
    type: 'abuse',
    phrases: [
      'being abused', 'is abusing me', 'abuses me',
      'hits me', 'beats me', 'beating me',
      'molested', 'raped', 'sexually assaulted', 'sexual abuse',
      'domestic violence', 'being hit', 'being beaten',
      'touches me', 'inappropriate touching',
      'dem dey beat me', 'person dey beat me', 'dem dey abuse me',
    ],
  },
  {
    type: 'eating_disorder',
    phrases: [
      'starving myself', 'not eating', 'haven\'t eaten', 'havent eaten',
      'stop eating', 'stopped eating', 'refuse to eat',
      'purging', 'making myself throw up', 'bulimia', 'anorexia', 'binge eating',
      'i no dey chop', 'i no fit chop', 'i never chop',
    ],
  },
  {
    type: 'isolation',
    phrases: [
      'nobody cares about me', 'no one cares about me', 'nobody loves me',
      'no one loves me', 'completely alone', 'all alone',
      'no friends', 'have no one', 'i have nobody',
      'everyone hates me', 'everybody hates me',
      'nobody dey for me', 'no person care about me',
    ],
  },
];

/**
 * Checks if text contains concern language that should force at least MODERATE risk.
 * Returns the specific concern type for better AI verse matching.
 */
function detectConcernLanguage(text: string): { detected: boolean; type: ConcernType } {
  const lower = text.toLowerCase();
  for (const category of CONCERN_CATEGORY_MAP) {
    if (category.phrases.some((phrase) => lower.includes(phrase))) {
      return { detected: true, type: category.type };
    }
  }
  return { detected: false, type: null };
}

/**
 * Risk-related emotions from GoEmotions
 * Grouped by severity for risk assessment
 *
 * HIGH_RISK: Truly concerning emotions that may indicate crisis
 * MODERATE_RISK: Stress/anxiety indicators that warrant attention but aren't crisis
 * POSITIVE: Healthy emotional indicators
 */
const HIGH_RISK_EMOTIONS = ['grief', 'remorse']; // Only true crisis indicators
const MODERATE_RISK_EMOTIONS = ['sadness', 'disappointment', 'nervousness', 'fear', 'anger', 'annoyance', 'confusion', 'embarrassment'];
const POSITIVE_EMOTIONS = ['joy', 'love', 'optimism', 'excitement', 'admiration', 'amusement', 'gratitude', 'pride', 'relief', 'caring'];

/**
 * Maps GoEmotions output to RiskLevel
 * Uses emotion scores to assess mental health risk.
 * Also accepts the original text for crisis keyword detection.
 */
function mapEmotionsToRiskLevel(
  emotions: HfClassificationResult[],
  sentiment: Sentiment,
  originalText?: string
): { riskLevel: RiskLevel; score: number; dominantEmotion: string; hasConcernLanguage: boolean; concernType: ConcernType } {
  // Crisis keyword override — MUST run first, even if models failed.
  // If text contains explicit crisis language (e.g. "want to die", "kill myself"),
  // force HIGH risk immediately regardless of model output.
  if (originalText && detectCrisisLanguage(originalText)) {
    const topLabel = emotions?.length
      ? [...emotions].sort((a, b) => b.score - a.score)[0].label
      : 'crisis';
    return {
      riskLevel: RiskLevel.HIGH,
      score: 1.0,
      dominantEmotion: topLabel,
      hasConcernLanguage: false, // crisis overrides concern
      concernType: null,
    };
  }

  // Concern keyword check — force at least MODERATE risk for serious disclosures
  // (addiction, abuse, eating disorders, severe isolation)
  const concernResult = originalText ? detectConcernLanguage(originalText) : { detected: false, type: null as ConcernType };
  const hasConcernLanguage = concernResult.detected;

  // Handle empty results (API failure fallback)
  if (!emotions || emotions.length === 0) {
    return {
      riskLevel: hasConcernLanguage || sentiment === Sentiment.NEGATIVE ? RiskLevel.MODERATE : RiskLevel.LOW,
      score: 0.5,
      dominantEmotion: 'unknown',
      hasConcernLanguage,
      concernType: concernResult.type,
    };
  }

  // Get top emotions (sorted by score)
  const sortedEmotions = [...emotions].sort((a, b) => b.score - a.score);
  const topEmotion = sortedEmotions[0];

  // Calculate risk scores based on emotion categories
  let highRiskScore = 0;
  let moderateRiskScore = 0;
  let positiveScore = 0;

  for (const emotion of emotions) {
    const label = emotion.label.toLowerCase();

    if (HIGH_RISK_EMOTIONS.includes(label)) {
      highRiskScore += emotion.score;
    } else if (MODERATE_RISK_EMOTIONS.includes(label)) {
      moderateRiskScore += emotion.score;
    } else if (POSITIVE_EMOTIONS.includes(label)) {
      positiveScore += emotion.score;
    }
  }

  // Combine with sentiment for better accuracy
  const sentimentMultiplier = sentiment === Sentiment.NEGATIVE ? 1.3 :
                              sentiment === Sentiment.NEUTRAL ? 1.0 : 0.7;

  const adjustedHighRisk = highRiskScore * sentimentMultiplier;
  const adjustedModerateRisk = moderateRiskScore * sentimentMultiplier;

  // Determine risk level based on adjusted scores
  // HIGH = grief/remorse detected strongly (true crisis)
  // MODERATE = negative emotions like sadness, disappointment, fear (needs attention)
  // LOW = positive or neutral emotions dominate
  let riskLevel: RiskLevel;
  let riskScore: number;

  if (adjustedHighRisk >= 0.3) {
    // HIGH only when grief/remorse are prominent (true crisis indicators)
    riskLevel = RiskLevel.HIGH;
    riskScore = Math.min(adjustedHighRisk + 0.2, 1);
  } else if (adjustedModerateRisk >= 0.4 || (adjustedModerateRisk >= 0.25 && sentiment === Sentiment.NEGATIVE)) {
    // MODERATE when stress/anxiety emotions are present with negative sentiment
    riskLevel = RiskLevel.MODERATE;
    riskScore = adjustedModerateRisk + adjustedHighRisk;
  } else {
    riskLevel = RiskLevel.LOW;
    riskScore = Math.max(0.1, 1 - positiveScore); // Low risk score when positive emotions dominate
  }

  // Concern language floor: if serious disclosure detected, never go below MODERATE
  if (hasConcernLanguage && riskLevel === RiskLevel.LOW) {
    riskLevel = RiskLevel.MODERATE;
    riskScore = Math.max(riskScore, 0.5);
  }

  return {
    riskLevel,
    score: Math.min(Math.round(riskScore * 100) / 100, 1.0), // Cap at 1.0
    dominantEmotion: topEmotion?.label || 'neutral',
    hasConcernLanguage,
    concernType: concernResult.type,
  };
}

/**
 * Analyzes text using Cardiff RoBERTa for sentiment
 */
async function analyzeSentiment(text: string): Promise<{
  sentiment: Sentiment;
  score: number;
}> {
  try {
    const results = await callModelWithTimeout(CARDIFF_MODEL, text);

    if (!results || results.length === 0) {
      throw new Error('No results from Cardiff RoBERTa');
    }

    // Get the highest scoring label
    const topResult = results.reduce((prev, current) =>
      current.score > prev.score ? current : prev
    );

    return {
      sentiment: mapToSentiment(topResult.label),
      score: topResult.score,
    };
  } catch {
    // Fallback to neutral with low confidence
    return {
      sentiment: Sentiment.NEUTRAL,
      score: 0.5,
    };
  }
}

/**
 * Fetches raw emotions from GoEmotions (for parallel execution)
 */
async function analyzeEmotionsRaw(text: string): Promise<HfClassificationResult[]> {
  try {
    const results = await callModelWithTimeout(GOEMOTIONS_MODEL, text);

    if (!results || results.length === 0) {
      throw new Error('No results from GoEmotions');
    }

    return results;
  } catch {
    // Return empty array on failure - will trigger fallback in risk mapping
    return [];
  }
}

/**
 * Main analysis function - analyzes text for sentiment and mental health risk
 *
 * Parallel flow (faster):
 * 1. Detect language (English/Pidgin/Mixed)
 * 2. Translate Pidgin to English (if detected)
 * 3. Run Cardiff + GoEmotions IN PARALLEL
 * 4. Combine results with risk level adjustment based on sentiment
 *
 * @param text - The student's text submission
 * @returns MLAnalysisResult with sentiment, risk level, confidence, and language
 */
export async function analyzeText(text: string): Promise<MLAnalysisResult> {
  // Step 1: Detect language
  const language = detectLanguage(text);

  // Step 2: Translate Pidgin to English for better model understanding
  let processedText = text;
  if (language === 'pidgin' || language === 'mixed') {
    processedText = translatePidgin(text);
  }

  // Step 3: Run BOTH models in parallel for faster response
  const [sentimentResult, emotionsRaw] = await Promise.all([
    analyzeSentiment(processedText),
    analyzeEmotionsRaw(processedText),
  ]);

  // Step 4a: Override weak Cardiff sentiment with strong GoEmotions signal
  // When Cardiff is uncertain (score < 0.5) but GoEmotions detects a high-confidence
  // negative emotion (score >= 0.6), trust GoEmotions instead.
  // This improves accuracy for Pidgin text where translation may be imperfect.
  const NEGATIVE_EMOTION_OVERRIDE = ['fear', 'sadness', 'anger', 'grief', 'remorse', 'disappointment', 'nervousness', 'annoyance', 'embarrassment'];
  if (sentimentResult.score < 0.5 && emotionsRaw.length > 0) {
    const topEmotion = [...emotionsRaw].sort((a, b) => b.score - a.score)[0];
    if (NEGATIVE_EMOTION_OVERRIDE.includes(topEmotion.label.toLowerCase()) && topEmotion.score >= 0.6) {
      sentimentResult.sentiment = Sentiment.NEGATIVE;
      sentimentResult.score = topEmotion.score * 0.8; // Scale to avoid overconfidence
    }
  }

  // Step 4b: Map emotions to risk level (now that we have sentiment context)
  // Pass original text so crisis keywords can be detected even when GoEmotions misses them
  const riskResult = mapEmotionsToRiskLevel(emotionsRaw, sentimentResult.sentiment, text);

  // Calculate combined confidence (average of both models)
  const confidence = (sentimentResult.score + riskResult.score) / 2;

  return {
    sentiment: sentimentResult.sentiment,
    risk_level: riskResult.riskLevel,
    dominant_emotion: riskResult.dominantEmotion,
    confidence: Math.min(Math.round(confidence * 100) / 100, 1.0), // Cap at 1.0 (DB constraint)
    language_detected: language,
    afriberta_score: sentimentResult.score, // Now Cardiff score (keeping field name for compatibility)
    mentalbert_score: riskResult.score,     // Now GoEmotions score (keeping field name for compatibility)
    has_concern_language: riskResult.hasConcernLanguage,
    concern_type: riskResult.concernType,
  };
}

/**
 * Health check for ML services
 * Tests connectivity to HuggingFace models
 */
export async function checkMLHealth(): Promise<{
  healthy: boolean;
  cardiff: boolean;
  goemotions: boolean;
  latency: number;
}> {
  const startTime = Date.now();
  const testText = "I am feeling okay today.";

  let cardiffHealthy = false;
  let goemotionsHealthy = false;

  try {
    await callModelWithTimeout(CARDIFF_MODEL, testText, 5000);
    cardiffHealthy = true;
  } catch {
    // Cardiff unavailable
  }

  try {
    await callModelWithTimeout(GOEMOTIONS_MODEL, testText, 5000);
    goemotionsHealthy = true;
  } catch {
    // GoEmotions unavailable
  }

  return {
    healthy: cardiffHealthy && goemotionsHealthy,
    cardiff: cardiffHealthy,
    goemotions: goemotionsHealthy,
    latency: Date.now() - startTime,
  };
}
