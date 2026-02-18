import { useState, useMemo } from 'react'
import { LogOut, User, Heart, Loader2, BarChart2, BookOpen, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useSubmissionHistory } from '../hooks/useSubmissionHistory'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import SubmissionForm from '../components/SubmissionForm'
import SubmissionResult from '../components/SubmissionResult'
import SentimentTrendChart from '../components/charts/SentimentTrendChart'
import { CreateSubmissionResponse } from '../../../types/shared'

// Map raw GoEmotions labels to human-friendly display names
const EMOTION_DISPLAY: Record<string, string> = {
  confusion: 'Confused',
  nervousness: 'Anxious',
  sadness: 'Sad',
  fear: 'Worried',
  disappointment: 'Disappointed',
  grief: 'Deeply Sad',
  remorse: 'Remorseful',
  anger: 'Frustrated',
  annoyance: 'Unsettled',
  embarrassment: 'Embarrassed',
  curiosity: 'Curious',
  neutral: 'Steady',
  optimism: 'Hopeful',
  joy: 'Joyful',
  love: 'Loved',
  admiration: 'Grateful',
  amusement: 'Amused',
  excitement: 'Excited',
  gratitude: 'Thankful',
  pride: 'Proud',
  relief: 'Relieved',
  caring: 'Caring',
  unknown: 'Uncertain',
}

function formatEmotion(emotion: string | null | undefined): string {
  if (!emotion) return '-'
  return EMOTION_DISPLAY[emotion.toLowerCase()] ?? emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

type Tab = 'dashboard' | 'journal' | 'trends'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [submissionResult, setSubmissionResult] = useState<CreateSubmissionResponse | null>(null)

  // Fetch submission history
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useSubmissionHistory(50)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSubmitSuccess = (result: CreateSubmissionResponse) => {
    setSubmissionResult(result)
    refetchHistory()
    // Auto-switch to journal tab to show result
    setActiveTab('journal')
  }

  const handleNewSubmission = () => {
    setSubmissionResult(null)
  }

  // Calculate stats from history
  const stats = useMemo(() => {
    if (!historyData?.submissions) {
      return { totalEntries: 0, lastEmotion: null, daysActive: 0 }
    }

    const submissions = historyData.submissions
    const totalEntries = historyData.total_count

    const lastSubmission = submissions[0] ?? null
    const lastEmotion = lastSubmission?.dominant_emotion ?? null

    const uniqueDays = new Set(
      submissions.map((s) => new Date(s.created_at).toDateString())
    ).size

    return { totalEntries, lastEmotion, daysActive: uniqueDays }
  }, [historyData])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'journal', label: 'My Journal', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'trends', label: 'My Trends', icon: <BarChart2 className="h-4 w-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10 flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-display italic text-xl text-primary">MindSpace</h1>

          {/* Tab bar (desktop) */}
          <nav className="hidden sm:flex items-center bg-muted rounded-full p-1 gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user?.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Tab bar (mobile) */}
        <div className="sm:hidden border-t">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {/* ── Tab 1: Dashboard ── */}
        {activeTab === 'dashboard' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {historyLoading ? '-' : stats.totalEntries}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {historyLoading ? '-' : formatEmotion(stats.lastEmotion)}
                    </p>
                    <p className="text-sm text-muted-foreground">Current Mood</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {historyLoading ? '-' : stats.daysActive}
                    </p>
                    <p className="text-sm text-muted-foreground">Days Active</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Welcome card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Welcome to Your Safe Space
                </CardTitle>
                <CardDescription>
                  Express how you're feeling and receive supportive, empathetic feedback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary/5 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="mb-2">
                    <strong className="text-foreground">How it works:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Share what's on your mind (in English or Pidgin)</li>
                    <li>Receive an empathetic reflection of your feelings</li>
                    <li>Get a comforting Bible verse for encouragement</li>
                    <li>Track your emotional journey over time</li>
                  </ol>
                </div>

                <Button
                  className="w-full mt-4 rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0 hover:opacity-90"
                  onClick={() => setActiveTab('journal')}
                >
                  Write in my journal
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Tab 2: My Journal ── */}
        {activeTab === 'journal' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {submissionResult ? (
              <SubmissionResult
                result={submissionResult}
                onNewSubmission={handleNewSubmission}
              />
            ) : (
              <SubmissionForm onSubmitSuccess={handleSubmitSuccess} />
            )}
          </div>
        )}

        {/* ── Tab 3: My Trends ── */}
        {activeTab === 'trends' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Emotional Journey</CardTitle>
                <CardDescription>
                  Track how you've been feeling over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <SentimentTrendChart submissions={historyData?.submissions || []} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          <p>Your privacy matters — data is encrypted and deletable at any time.</p>
        </div>
      </footer>
    </div>
  )
}
