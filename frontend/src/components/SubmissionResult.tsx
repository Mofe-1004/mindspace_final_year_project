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
import { CreateSubmissionResponse } from '../../../types/shared'

interface SubmissionResultProps {
  result: CreateSubmissionResponse
  submittedText: string
  onNewSubmission: () => void
}

// Maps raw GoEmotions labels to human-friendly names
const EMOTION_DISPLAY: Record<string, string> = {
  confusion: 'Confused', nervousness: 'Anxious', sadness: 'Sad',
  fear: 'Worried', disappointment: 'Disappointed', grief: 'Deeply Sad',
  remorse: 'Remorseful', anger: 'Frustrated', annoyance: 'Unsettled',
  embarrassment: 'Embarrassed', curiosity: 'Curious', neutral: 'Steady', crisis: 'Distressed',
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
  submittedText,
  onNewSubmission,
}: SubmissionResultProps) {
  const [showDetails, setShowDetails] = useState(false)

  const emotionLabel = formatEmotion(result.dominant_emotion)

  const handleCounselorRequest = () => {
    // Dismiss the result to reveal the dashboard with the counselor contact card
    onNewSubmission()
    // Scroll to the counselor card after a brief delay (let the DOM update)
    setTimeout(() => {
      const card = document.getElementById('counselor-contact-card')
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' })
        card.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
        setTimeout(() => card.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 3000)
      }
    }, 100)
  }

  return (
    <div className="space-y-4">
      {/* Original Entry */}
      {submittedText && (
        <div className="bg-muted/50 border border-border/40 rounded-2xl px-5 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Your Entry</p>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{submittedText}</p>
        </div>
      )}

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
            <div className="mt-3 text-sm">
              <div className="bg-white/15 rounded-xl p-3 inline-block">
                <p className="text-xs text-white/60 mb-1">Emotional Tone</p>
                <p className="font-medium text-white">{emotionLabel}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Counselor Option - Only shown for moderate/high risk */}
      {result.show_counselor_option && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-4">
            <Alert className="border-0 bg-transparent p-0">
              <MessageCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="ml-2">
                <div className="flex flex-col gap-3">
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
                  <p className="text-xs text-muted-foreground">
                    For your safety, entries flagged as high-risk are shared with your assigned
                    counselor so they can support you. All other entries remain private.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
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
