/**
 * SubmissionForm Component
 *
 * Text input form for students to submit their feelings.
 * Supports English and Nigerian Pidgin.
 *
 * Features:
 * - Character count with min/max validation
 * - Loading state during submission
 * - Error handling
 * - Bilingual placeholder hints
 */

import { useState } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card'
import { useAuth } from '../lib/AuthContext'
import { CreateSubmissionResponse } from '../../../types/shared'

// Validation constants (matching backend)
const MIN_LENGTH = 10
const MAX_LENGTH = 2000

// Placeholder hints (rotate between English and Pidgin)
const PLACEHOLDERS = [
  "How are you feeling today? Share whatever is on your mind...",
  "Wetin dey your mind today? No hold back, just talk am...",
  "What's going on in your life right now?",
  "How your day go? You fit yarn me anything...",
]

interface SubmissionFormProps {
  onSubmitSuccess: (result: CreateSubmissionResponse) => void
}

export default function SubmissionForm({ onSubmitSuccess }: SubmissionFormProps) {
  const { session } = useAuth()
  const [text, setText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [placeholder] = useState(() =>
    PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
  )

  const charCount = text.length
  const isValidLength = charCount >= MIN_LENGTH && charCount <= MAX_LENGTH
  const canSubmit = isValidLength && !isSubmitting

  const getCharCountColor = () => {
    if (charCount === 0) return 'text-muted-foreground'
    if (charCount < MIN_LENGTH) return 'text-amber-500'
    if (charCount > MAX_LENGTH) return 'text-destructive'
    return 'text-green-600'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!canSubmit || !session?.access_token) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/submissions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to submit. Please try again.')
      }

      if (data.success && data.data) {
        // Clear the form and notify parent
        setText('')
        onSubmitSuccess(data.data)
      } else {
        throw new Error('Unexpected response format')
      }
    } catch (err) {
      console.error('Submission error:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong. Please try again.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling today?</CardTitle>
        <CardDescription>
          Share your thoughts in English or Nigerian Pidgin. Everything you share is private.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              disabled={isSubmitting}
              className="min-h-[150px] rounded-2xl border-2 bg-background/60 focus:border-primary resize-none"
              maxLength={MAX_LENGTH + 100} // Allow slight overflow for UX, validate on submit
            />

            {/* Character Count */}
            <div className="flex justify-between items-center text-sm">
              <span className={getCharCountColor()}>
                {charCount} / {MAX_LENGTH} characters
                {charCount > 0 && charCount < MIN_LENGTH && (
                  <span className="ml-2">
                    (minimum {MIN_LENGTH})
                  </span>
                )}
              </span>
              {charCount >= MIN_LENGTH && charCount <= MAX_LENGTH && (
                <span className="text-green-600 text-xs">Ready to submit</span>
              )}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90 py-6 text-base font-medium"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing your feelings...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Share & Get Support
              </>
            )}
          </Button>

          {/* Privacy Note */}
          <p className="text-xs text-center text-muted-foreground">
            Your submission is private and encrypted. You can delete it anytime.
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
