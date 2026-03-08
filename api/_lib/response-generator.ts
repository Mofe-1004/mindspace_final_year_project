/**
 * Response Generator - Empathetic Message Templates
 *
 * Generates supportive, non-diagnostic empathetic messages
 * based on sentiment analysis and risk level.
 *
 * Key principles:
 * - NEVER clinical or diagnostic language
 * - Always supportive and validating
 * - Culturally sensitive (optional Pidgin phrases)
 * - Varied responses to avoid repetition
 */

import { Sentiment, RiskLevel, Language } from '../_types/shared';

/**
 * Template structure for empathetic messages
 */
interface MessageTemplate {
  message: string;
  pidginVariant?: string; // Optional Pidgin-friendly version
}

/**
 * Templates organized by sentiment and risk level
 */
const TEMPLATES: Record<Sentiment, Record<RiskLevel, MessageTemplate[]>> = {
  [Sentiment.POSITIVE]: {
    [RiskLevel.LOW]: [
      {
        message: "It's wonderful to hear you're feeling good! Keep nurturing whatever is bringing you this positive energy.",
        pidginVariant: "E sweet to hear say you dey fine! Keep am going, you dey try well well."
      },
      {
        message: "Your positive spirit really shines through. Remember this feeling - it's a reminder of your inner strength.",
        pidginVariant: "Your spirit dey glow! No forget this feeling o, e show say you strong inside."
      },
      {
        message: "I'm glad things are going well for you. Celebrating these moments is important for your wellbeing.",
      },
      {
        message: "It sounds like you're in a good place right now. That's something to be grateful for!",
        pidginVariant: "E be like say things dey okay for you now. Na something to thank God for!"
      },
      {
        message: "Your words carry a sense of peace and contentment. May this feeling stay with you.",
      },
    ],
    [RiskLevel.MODERATE]: [
      {
        message: "I sense some positive feelings alongside some challenges. It's okay to hold both at once.",
        pidginVariant: "I see say some things dey good, some dey challenge you. E no be problem to feel both."
      },
      {
        message: "You're doing well even when things aren't perfect. That takes real strength.",
      },
      {
        message: "There's light in your words, even if everything isn't exactly where you want it. Keep going.",
      },
    ],
    [RiskLevel.HIGH]: [
      {
        message: "I can see you're trying to stay positive, and that's incredibly brave. Please know that support is available if you need it.",
        pidginVariant: "I see say you dey try to stay positive - you get heart. Abeg know say help dey if you need am."
      },
      {
        message: "Your strength in trying to see the good is admirable. Remember, it's also okay to ask for help when things feel heavy.",
      },
    ],
  },

  [Sentiment.NEUTRAL]: {
    [RiskLevel.LOW]: [
      {
        message: "Thank you for sharing what's on your mind. Sometimes just expressing our thoughts can bring clarity.",
        pidginVariant: "Thank you wey you share wetin dey your mind. Sometimes when we talk am out, e dey help us see clear."
      },
      {
        message: "It sounds like you're processing things in your own way. That's perfectly okay.",
      },
      {
        message: "I hear you. Taking time to reflect on our experiences is valuable.",
        pidginVariant: "I hear you well well. When we take time think about wetin dey happen, e dey help."
      },
      {
        message: "Your thoughts matter, and I'm here to listen. Feel free to share whenever you need to.",
      },
      {
        message: "Thank you for checking in. Remember, every day doesn't have to be extraordinary - ordinary is okay too.",
      },
    ],
    [RiskLevel.MODERATE]: [
      {
        message: "I sense there might be something weighing on you beneath the surface. It's okay to explore those feelings when you're ready.",
        pidginVariant: "E be like say something dey your mind wey you never talk. When you ready, e go be okay to open up."
      },
      {
        message: "Sometimes we keep things steady on the outside while processing a lot inside. That's very human.",
      },
      {
        message: "I'm here for you, whatever you're working through. You don't have to have everything figured out.",
      },
    ],
    [RiskLevel.HIGH]: [
      {
        message: "I want you to know that you're not alone, even when things feel uncertain. Support is available whenever you're ready.",
        pidginVariant: "Make you know say you no dey alone, even when things no clear. Help dey anytime wey you ready."
      },
      {
        message: "Your wellbeing matters deeply. If you're going through something difficult, please consider reaching out to someone you trust.",
      },
    ],
  },

  [Sentiment.NEGATIVE]: {
    [RiskLevel.LOW]: [
      {
        message: "I'm sorry you're going through a tough time. It's okay to feel this way - your feelings are valid.",
        pidginVariant: "E pain me say things no easy for you now. E dey okay to feel like this - your feelings matter."
      },
      {
        message: "Difficult days are part of life, but they don't define you. This feeling will pass.",
        pidginVariant: "Hard days go come, but dem no define you. This feeling go pass."
      },
      {
        message: "It sounds like things are challenging right now. Remember, you've gotten through hard times before.",
      },
      {
        message: "I hear the heaviness in your words. Please be gentle with yourself during this time.",
        pidginVariant: "I hear say your heart heavy. Abeg take am easy on yourself."
      },
      {
        message: "What you're feeling is real and it matters. You don't have to carry this alone.",
      },
    ],
    [RiskLevel.MODERATE]: [
      {
        message: "I can sense that things feel really difficult right now. Please know that it's okay to ask for support - you deserve it.",
        pidginVariant: "I dey see say things hard well well for you now. E dey okay to ask for help - you deserve am."
      },
      {
        message: "Your struggles are valid, and so is your need for support. Consider talking to someone you trust about what you're going through.",
      },
      {
        message: "What you're experiencing sounds overwhelming. Remember, seeking help is a sign of strength, not weakness.",
        pidginVariant: "Wetin you dey face too much. Remember, to find help na strength, no be weakness."
      },
      {
        message: "I'm concerned about what you're sharing. Please know that there are people who care about you and want to help.",
      },
    ],
    [RiskLevel.HIGH]: [
      {
        message: "What you're sharing sounds really heavy, and I want you to know that you matter deeply. Please consider reaching out to a counselor or someone you trust - you don't have to face this alone.",
        pidginVariant: "Wetin you share heavy well well, and I wan make you know say you matter. Abeg try talk to counselor or person wey you trust - you no need carry this alone."
      },
      {
        message: "I hear how much pain you're in, and I'm genuinely concerned. Your life has value, and there are people who want to support you through this. Please reach out to someone who can help.",
      },
      {
        message: "You're going through something very difficult, and I want you to know that help is available right now. Please talk to a counselor - they're here specifically to support students like you.",
        pidginVariant: "You dey go through something wey hard well well. Help dey available now now. Abeg talk to counselor - dem dey there specifically to help students like you."
      },
    ],
  },
};

/**
 * Selects a random item from an array
 */
function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates an empathetic response based on analysis results
 *
 * @param sentiment - The detected sentiment
 * @param riskLevel - The assessed risk level
 * @param language - The detected language (for Pidgin-aware responses)
 * @returns An empathetic message string
 */
export function generateEmpatheticResponse(
  sentiment: Sentiment,
  riskLevel: RiskLevel,
  language: Language
): string {
  const templates = TEMPLATES[sentiment][riskLevel];
  const template = randomChoice(templates);

  // Use Pidgin variant if available and user wrote in Pidgin
  if (
    template.pidginVariant &&
    (language === Language.PIDGIN || language === Language.MIXED)
  ) {
    // For mixed language, randomly choose between English and Pidgin
    if (language === Language.MIXED && Math.random() > 0.5) {
      return template.message;
    }
    return template.pidginVariant;
  }

  return template.message;
}

/**
 * Gets a follow-up suggestion based on risk level
 * Used to gently encourage help-seeking for moderate/high risk
 */
export function getFollowUpSuggestion(riskLevel: RiskLevel): string | null {
  if (riskLevel === RiskLevel.LOW) {
    return null;
  }

  if (riskLevel === RiskLevel.MODERATE) {
    const suggestions = [
      "If you'd like to talk to someone, our university counselors are available and confidential.",
      "Remember, speaking to a counselor can help - and it's completely confidential.",
      "Consider checking in with a trusted friend, family member, or counselor.",
    ];
    return randomChoice(suggestions);
  }

  // HIGH risk
  const urgentSuggestions = [
    "Please consider speaking with a counselor today. They're here to help you through this.",
    "Our university counseling services are confidential and free. Please reach out - you deserve support.",
    "You don't have to face this alone. Our counselors are trained to help with exactly what you're going through.",
  ];
  return randomChoice(urgentSuggestions);
}

/**
 * Generates a complete response package
 */
export interface EmpatheticResponsePackage {
  message: string;
  followUpSuggestion: string | null;
  showCounselorOption: boolean;
}

export function generateResponsePackage(
  sentiment: Sentiment,
  riskLevel: RiskLevel,
  language: Language
): EmpatheticResponsePackage {
  return {
    message: generateEmpatheticResponse(sentiment, riskLevel, language),
    followUpSuggestion: getFollowUpSuggestion(riskLevel),
    showCounselorOption: riskLevel === RiskLevel.MODERATE || riskLevel === RiskLevel.HIGH,
  };
}
