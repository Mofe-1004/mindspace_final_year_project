import { useState, useMemo } from 'react'
import { LogOut, User, Heart, Loader2, BarChart2, BookOpen, LayoutDashboard, ChevronDown, ChevronUp, Trash2, BookOpenCheck, Clock, HeartHandshake, Mail, Phone, Flame, PenLine, Sparkles, TrendingUp, Calendar } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useSubmissionHistory } from '../hooks/useSubmissionHistory'
import { useMyCounselor } from '../hooks/useMyCounselor'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import SubmissionForm from '../components/SubmissionForm'
import SubmissionResult from '../components/SubmissionResult'
import SentimentTrendChart from '../components/charts/SentimentTrendChart'
import { CreateSubmissionResponse, Sentiment, SubmissionHistoryItem } from '../../../types/shared'

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
  crisis: 'Distressed',
  unknown: 'Uncertain',
}

function formatEmotion(emotion: string | null | undefined): string {
  if (!emotion) return '-'
  return EMOTION_DISPLAY[emotion.toLowerCase()] ?? emotion.charAt(0).toUpperCase() + emotion.slice(1)
}

type Tab = 'dashboard' | 'journal' | 'history' | 'trends'

export default function Dashboard() {
  const { user, session, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [submissionResult, setSubmissionResult] = useState<CreateSubmissionResponse | null>(null)
  const [submittedText, setSubmittedText] = useState<string>('')
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch submission history
  const { data: historyData, isLoading: historyLoading, refetch: refetchHistory } = useSubmissionHistory(50)

  // Fetch assigned counselor info
  const { data: counselorData } = useMyCounselor()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleDeleteEntry = async (id: string) => {
    if (!session?.access_token) return
    if (!confirm('Are you sure you want to delete this entry? This cannot be undone.')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/submissions/delete?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) {
        refetchHistory()
        if (expandedEntry === id) setExpandedEntry(null)
      }
    } catch {
      // Delete failed silently — entry remains in list
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitSuccess = (result: CreateSubmissionResponse, text: string) => {
    setSubmissionResult(result)
    setSubmittedText(text)
    refetchHistory()
    // Auto-switch to journal tab to show result
    setActiveTab('journal')
  }

  const handleNewSubmission = () => {
    setSubmissionResult(null)
    setSubmittedText('')
  }

  // Calculate stats from history
  const stats = useMemo(() => {
    if (!historyData?.submissions) {
      return { totalEntries: 0, lastEmotion: null, daysActive: 0, streak: 0, lastEntry: null as SubmissionHistoryItem | null, recentMoods: [] as string[] }
    }

    const submissions = historyData.submissions
    const totalEntries = historyData.total_count

    const lastSubmission = submissions[0] ?? null
    const lastEmotion = lastSubmission?.dominant_emotion ?? null

    const uniqueDays = new Set(
      submissions.map((s) => new Date(s.created_at).toDateString())
    ).size

    // Calculate streak (consecutive days with entries, ending today or yesterday)
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dayMs = 86400000
    const entryDays = [...new Set(submissions.map((s) => {
      const d = new Date(s.created_at)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    }))].sort((a, b) => b - a)

    if (entryDays.length > 0) {
      const mostRecent = entryDays[0]
      // streak counts if most recent is today or yesterday
      if (today.getTime() - mostRecent <= dayMs) {
        streak = 1
        for (let i = 1; i < entryDays.length; i++) {
          if (entryDays[i - 1] - entryDays[i] === dayMs) {
            streak++
          } else {
            break
          }
        }
      }
    }

    // Recent moods (last 5 unique emotions)
    const recentMoods = submissions
      .slice(0, 5)
      .map((s) => s.dominant_emotion)
      .filter(Boolean) as string[]

    return { totalEntries, lastEmotion, daysActive: uniqueDays, streak, lastEntry: lastSubmission, recentMoods }
  }, [historyData])

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }, [])

  const firstName = useMemo(() => {
    // Prefer first_name from Supabase user metadata, fall back to email prefix
    const first = user?.user_metadata?.first_name as string | undefined
    if (first) {
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
    }
    const email = user?.email || ''
    const name = email.split('@')[0] || ''
    return name.charAt(0).toUpperCase() + name.slice(1)
  }, [user])

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'journal', label: 'My Journal', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <Clock className="h-4 w-4" /> },
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
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            {/* Greeting Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary rounded-3xl p-6 sm:p-8 text-white shadow-lg">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
              <div className="relative">
                <p className="text-white/70 text-sm font-medium mb-1">{greeting},</p>
                <h2 className="font-display italic text-2xl sm:text-3xl mb-2">{firstName}</h2>
                <p className="text-white/80 text-sm max-w-md">
                  {stats.totalEntries === 0
                    ? "Welcome to MindSpace. Start your wellness journey by writing your first entry."
                    : stats.streak > 1
                    ? `You're on a ${stats.streak}-day streak. Keep it up!`
                    : "How are you feeling today? Your safe space is ready."
                  }
                </p>
                <Button
                  className="mt-4 rounded-full bg-white text-primary hover:bg-white/90 border-0 shadow-md font-medium"
                  onClick={() => setActiveTab('journal')}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Write in my journal
                </Button>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="group hover:shadow-md transition-shadow border-border/50">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {historyLoading ? '-' : stats.totalEntries}
                      </p>
                      <p className="text-xs text-muted-foreground">Entries</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-md transition-shadow border-border/50">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                      <Sparkles className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-lg font-bold text-foreground leading-tight">
                        {historyLoading ? '-' : formatEmotion(stats.lastEmotion)}
                      </p>
                      <p className="text-xs text-muted-foreground">Mood</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-md transition-shadow border-border/50">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Flame className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {historyLoading ? '-' : stats.streak}
                      </p>
                      <p className="text-xs text-muted-foreground">Streak</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="group hover:shadow-md transition-shadow border-border/50">
                <CardContent className="pt-5 pb-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {historyLoading ? '-' : stats.daysActive}
                      </p>
                      <p className="text-xs text-muted-foreground">Days Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setActiveTab('history')}
                className="group flex items-center gap-4 bg-card hover:bg-accent/50 border border-border/50 rounded-2xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">Past Entries</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {stats.totalEntries > 0
                      ? `${stats.totalEntries} journal ${stats.totalEntries === 1 ? 'entry' : 'entries'}`
                      : 'No entries yet'}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => setActiveTab('trends')}
                className="group flex items-center gap-4 bg-card hover:bg-accent/50 border border-border/50 rounded-2xl p-4 text-left transition-all hover:shadow-md"
              >
                <div className="h-11 w-11 rounded-xl bg-secondary/15 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <TrendingUp className="h-5 w-5 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm">My Trends</p>
                  <p className="text-xs text-muted-foreground truncate">
                    View your emotional journey
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Counselor Contact Card */}
            {counselorData?.counselor && (
              <Card id="counselor-contact-card" className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 transition-all duration-300">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <HeartHandshake className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {(counselorData.counselor.first_name || counselorData.counselor.last_name)
                          ? `Your Counselor — ${[counselorData.counselor.first_name, counselorData.counselor.last_name].filter(Boolean).join(' ')}`
                          : 'Your Counselor'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5 mb-3">
                        You have a counselor assigned to support you. Feel free to reach out anytime.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={`mailto:${counselorData.counselor.email}`}
                          className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-3 py-1.5 transition-colors"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          {counselorData.counselor.email}
                        </a>
                        {counselorData.counselor.phone_number && (
                          <a
                            href={`tel:${counselorData.counselor.phone_number}`}
                            className="inline-flex items-center gap-1.5 text-sm bg-primary/10 text-primary hover:bg-primary/15 rounded-full px-3 py-1.5 transition-colors"
                          >
                            <Phone className="h-3.5 w-3.5" />
                            {counselorData.counselor.phone_number}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Last Entry Preview */}
            {stats.lastEntry && (
              <Card className="border-border/50 overflow-hidden">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Latest Entry</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(stats.lastEntry.created_at).toLocaleDateString('en-NG', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2 mb-3">
                    {stats.lastEntry.text}
                  </p>
                  {stats.lastEntry.empathetic_message && (
                    <div className="bg-primary/5 rounded-xl p-3 mt-2">
                      <p className="text-xs text-muted-foreground mb-1">MindSpace said:</p>
                      <p className="text-sm text-foreground/70 italic line-clamp-2">
                        {stats.lastEntry.empathetic_message}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* How it Works — only show for new users */}
            {stats.totalEntries === 0 && (
              <Card className="border-dashed border-2 border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-primary" />
                    Your Safe Space
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { step: '1', text: 'Share what\'s on your mind (in English or Pidgin)' },
                      { step: '2', text: 'Receive an empathetic reflection of your feelings' },
                      { step: '3', text: 'Get a comforting Bible verse for encouragement' },
                      { step: '4', text: 'Track your emotional journey over time' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-secondary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.step}
                        </div>
                        <p className="text-sm text-muted-foreground pt-1">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── Tab 2: My Journal ── */}
        {activeTab === 'journal' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in">
            {submissionResult ? (
              <SubmissionResult
                result={submissionResult}
                submittedText={submittedText}
                onNewSubmission={handleNewSubmission}
              />
            ) : (
              <SubmissionForm onSubmitSuccess={handleSubmitSuccess} />
            )}
          </div>
        )}

        {/* ── Tab 3: History ── */}
        {activeTab === 'history' && (
          <div className="max-w-2xl mx-auto space-y-5 animate-in fade-in">
            {/* Header */}
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Past Entries</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Your journal entries from the last 30 days</p>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium">
                <BookOpen className="h-3 w-3" />
                {historyData?.total_count ?? 0} {historyData?.total_count === 1 ? 'entry' : 'entries'}
              </span>
            </div>

            {historyLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
                <p className="text-sm text-muted-foreground">Loading your entries...</p>
              </div>
            ) : !historyData?.submissions?.length ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <PenLine className="h-7 w-7 text-primary/50" />
                </div>
                <h3 className="font-medium text-foreground mb-1">No entries yet</h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-4">
                  Start your wellness journey by sharing how you feel today.
                </p>
                <Button
                  className="rounded-full bg-gradient-to-r from-primary to-secondary text-white border-0"
                  onClick={() => setActiveTab('journal')}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Write your first entry
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.submissions.map((entry: SubmissionHistoryItem) => {
                  const isExpanded = expandedEntry === entry.id
                  const sentimentColor =
                    entry.sentiment === Sentiment.POSITIVE ? 'text-green-700' :
                    entry.sentiment === Sentiment.NEGATIVE ? 'text-amber-700' : 'text-blue-700'
                  const sentimentBg =
                    entry.sentiment === Sentiment.POSITIVE ? 'bg-green-100' :
                    entry.sentiment === Sentiment.NEGATIVE ? 'bg-amber-100' : 'bg-blue-100'
                  const sentimentDot =
                    entry.sentiment === Sentiment.POSITIVE ? 'bg-green-500' :
                    entry.sentiment === Sentiment.NEGATIVE ? 'bg-amber-500' : 'bg-blue-500'
                  const date = new Date(entry.created_at)
                  const dateStr = date.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
                  const timeStr = date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' })

                  return (
                    <div key={entry.id} className="group">
                      <button
                        onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                        className={`w-full text-left bg-card border rounded-2xl transition-all hover:shadow-md ${
                          isExpanded ? 'shadow-md border-primary/20' : 'border-border/50 hover:border-border'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            {/* Sentiment dot */}
                            <div className="pt-1.5 flex-shrink-0">
                              <div className={`h-2.5 w-2.5 rounded-full ${sentimentDot}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${sentimentColor} ${sentimentBg}`}>
                                  {formatEmotion(entry.dominant_emotion)}
                                </span>
                                <span className="text-xs text-muted-foreground">{dateStr} at {timeStr}</span>
                              </div>
                              <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
                                {entry.text}
                              </p>
                            </div>
                            <div className="flex-shrink-0 pt-1">
                              <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${
                                isExpanded ? 'bg-primary/10' : 'bg-muted group-hover:bg-primary/10'
                              }`}>
                                {isExpanded
                                  ? <ChevronUp className="h-4 w-4 text-primary" />
                                  : <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                }
                              </div>
                            </div>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="mx-3 mb-3 mt-0 border border-t-0 border-primary/10 rounded-b-2xl bg-muted/30 px-4 py-4 space-y-4">
                          {/* Full entry text */}
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">Your Entry</p>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.text}</p>
                          </div>

                          {/* Empathetic response */}
                          {entry.empathetic_message && (
                            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl p-4">
                              <p className="text-xs font-medium text-primary/60 uppercase tracking-wide mb-1.5">MindSpace Response</p>
                              <p className="text-sm text-foreground/80 leading-relaxed">{entry.empathetic_message}</p>
                            </div>
                          )}

                          {/* Bible verse */}
                          {entry.bible_verse_text && (
                            <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-4 flex items-start gap-3">
                              <BookOpenCheck className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
                              <div>
                                <p className="text-sm italic text-foreground/80 leading-relaxed">"{entry.bible_verse_text}"</p>
                                <p className="text-xs font-semibold text-secondary mt-1.5">-- {entry.bible_verse_reference}</p>
                              </div>
                            </div>
                          )}

                          {/* Delete button */}
                          <div className="flex justify-end pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteEntry(entry.id)
                              }}
                              disabled={deletingId === entry.id}
                              className="text-destructive/70 hover:text-destructive hover:bg-destructive/10 text-xs rounded-full"
                            >
                              {deletingId === entry.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Delete entry
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: My Trends ── */}
        {activeTab === 'trends' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-xl font-semibold text-foreground">Your Emotional Journey</h2>
              <p className="text-sm text-muted-foreground mt-0.5">See how you've been feeling over time</p>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-primary/5 to-secondary/5 px-6 py-4 border-b border-border/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Sentiment over the last 30 days</span>
                </div>
              </div>
              <CardContent className="pt-6">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/40 mb-3" />
                    <p className="text-sm text-muted-foreground">Loading trends...</p>
                  </div>
                ) : !historyData?.submissions?.length ? (
                  <div className="flex flex-col items-center justify-center h-[250px] text-center">
                    <BarChart2 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-muted-foreground text-sm">Not enough data yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Write a few entries and your trends will appear here.</p>
                  </div>
                ) : (
                  <SentimentTrendChart submissions={historyData.submissions} />
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50">
        <div className="container mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          <p>Your privacy matters — data is encrypted and deletable at any time.</p>
        </div>
      </footer>
    </div>
  )
}
