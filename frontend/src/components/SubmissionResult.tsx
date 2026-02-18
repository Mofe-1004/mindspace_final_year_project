/**
 * SubmissionResult Component
 *
 * Displays the analysis result after a submission:
 * - Empathetic message (gradient card)
 * - Bible verse
 * - Counselor contact option (if moderate/high risk)
 *
 * Designed to feel warm, supportive, and non-clinical.
 */

import { useState } from 'react'
import { BookOpen, MessageCircle, X, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Card, CardContent } from './ui/card'
import { CreateSubmissionResponse, Sentiment } from '../../../types/shared'

interface SubmissionResultProps {
  result: CreateSubmissionResponse
  onNewSubmission: () => void
}

// Sentiment colours (used for styling only — label comes from dominant_emotion)
const SENTIMENT_CONFIG: Record<Sentiment, { color: string; bgColor: string }> = {
  [Sentiment.POSITIVE]: { color: 'text-green-600', bgColor: 'bg-green-50' },
  [Sentiment.NEUTRAL]:  { color: 'text-blue-600',  bgColor: 'bg-blue-50'  },
  [Sentiment.NEGATIVE]: { color: 'text-amber-600', bgColor: 'bg-amber-50' },
}

// Maps raw GoEmotions labels to human-friendly names
const EMOTION_DISPLAY: Record<string, string> = {
  confusion: 'Confused', nervousness: 'Anxious', sadness: 'Sad',
  fear: 'Worried', disappointment: 'Disappointed', grief: 'Deeply Sad',
  remorse: 'Remorseful', anger: 'Frustrated', annoyance: 'Unsettled',
  embarrassment: 'Embarrassed', curiosity: 'Curious', neutral: 'Steady',
  optimism: 'Hopeful', joy: 'Joyful', love: 'Loved', admiration: 'Grateful',
  amusement: 'Amused', excitement: 'Excited', gratitude: 'Thankful',
  pride: 'Proud', relief: 'Relieved', caring: 'Caring', unknown: 'Uncertain',
}

function formatEmotion(emotion: string | null | undefined): string {
  if (!emotion) return '-'
  return EMOTION_DISPLAY[emotion.toLowerCase()] ?? emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

export default function SubmissionResult({
  result,
  onNewSubmission,
}: SubmissionResultProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [counselorRequested, setCounselorRequested] = useState(false)

  const sentimentInfo = SENTIMENT_CONFIG[result.sentiment] ?? SENTIMENT_CONFIG[Sentiment.NEUTRAL]
  const emotionLabel = formatEmotion(result.dominant_emotion)

  const handleCounselorRequest = async () => {
    // TODO: Implement counselor request API call
    setCounselorRequested(true)
  }

  return (
    <div className="space-y-4">
      {/* Gradient Response Card */}
      <div className="relative bg-gradient-to-br from-primary to-primary/70 text-white rounded-3xl p-8 shadow-lg">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-medium mb-3">
              You sound {emotionLabel.toLowerCase()}
            </span>
            <h2 className="font-display italic text-2xl leading-tight">We hear you</h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewSubmission}
            className="text-white/70 hover:text-white hover:bg-white/10 -mt-1 -mr-2"
          >
            <X className="h-4 w-4 mr-1" />
            New Entry
          </Button>
        </div>

        {/* Empathetic Message */}
        <p className="text-white/95 leading-relaxed text-base mb-6">
          {result.empathetic_message}
        </p>

        {/* Bible Verse */}
        {result.bible_verse && (
          <div className="bg-white/15 border-l-4 border-secondary rounded-xl px-5 py-4">
            <div className="flex items-start gap-3">
              <BookOpen className="h-4 w-4 text-secondary mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm italic text-white/90 mb-2">
                  "{result.bible_verse.text}"
                </p>
                <p className="text-xs font-semibold text-secondary">
                  — {result.bible_verse.reference}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Analysis Details (collapsible) */}
        <div className="mt-5 pt-4 border-t border-white/20">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span>View analysis details</span>
          </button>

          {showDetails && (
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-xs text-white/60 mb-1">Emotional Tone</p>
                <p className="font-medium text-white">{emotionLabel}</p>
              </div>
              <div className="bg-white/15 rounded-xl p-3">
                <p className="text-xs text-white/60 mb-1">Confidence</p>
                <p className="font-medium text-white">{Math.round(result.confidence * 100)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Counselor Option - Only shown for moderate/high risk */}
      {result.show_counselor_option && !counselorRequested && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-4">
            <Alert className="border-0 bg-transparent p-0">
              <MessageCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm">
                    Would you like to speak with a counselor? They're here to help.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleCounselorRequest}
                    className="shrink-0 rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0"
                  >
                    Contact Counselor
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Counselor Request Confirmation */}
      {counselorRequested && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-green-800">
                <p className="font-medium">Request sent!</p>
                <p className="text-sm mt-1">
                  A counselor will reach out to you soon through your school email.
                  This is completely confidential.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Encouragement Footer */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          Remember: It's okay to not be okay. You're doing great by checking in with yourself.
        </p>
      </div>
    </div>
  )
}
