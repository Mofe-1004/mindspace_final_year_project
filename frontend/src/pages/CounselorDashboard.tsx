/**
 * Counselor Dashboard - Tabbed layout for approved counselors
 *
 * Tabs:
 *   Overview  — Stats cards + Sentiment/Risk charts
 *   My Students — Aggregate trends for assigned students
 *   Alerts   — At-risk student alerts (acknowledge / resolve)
 */

import { useState, useMemo } from 'react'
import {
  LogOut,
  User,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Bell,
  BarChart3,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useAggregateTrends } from '../hooks/useAggregateTrends'
import { useMyStudentsTrends } from '../hooks/useMyStudentsTrends'
import { useCounselorAlerts } from '../hooks/useAlerts'
import { Button } from '../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card'
import SentimentPieChart from '../components/charts/SentimentPieChart'
import RiskDistributionChart from '../components/charts/RiskDistributionChart'
import { Sentiment } from '../../../api/_types/shared'

type Tab = 'overview' | 'students' | 'alerts'

export default function CounselorDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dateRange] = useState({ days: 7 })

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - dateRange.days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Fetch aggregate trends
  const { data: trendsData, isLoading: trendsLoading } = useAggregateTrends(startDate, endDate)

  // Fetch assigned students' trends
  const { data: myStudentsData, isLoading: myStudentsLoading } = useMyStudentsTrends(dateRange.days)

  // Fetch alerts
  const {
    data: alertsData,
    isLoading: alertsLoading,
    acknowledgeMutation,
    resolveMutation,
  } = useCounselorAlerts()

  const handleSignOut = async () => {
    await signOut()
  }

  // Calculate totals from daily summary
  const totals = useMemo(() => {
    if (!trendsData?.daily_summary) {
      return { positive: 0, neutral: 0, negative: 0, low: 0, moderate: 0, high: 0, total: 0 }
    }

    return trendsData.daily_summary.reduce(
      (acc, day) => ({
        positive: acc.positive + Math.round((day.positive_percentage / 100) * day.total_submissions),
        neutral: acc.neutral + Math.round((day.neutral_percentage / 100) * day.total_submissions),
        negative: acc.negative + Math.round((day.negative_percentage / 100) * day.total_submissions),
        low: acc.low + Math.round((day.low_risk_percentage / 100) * day.total_submissions),
        moderate: acc.moderate + Math.round((day.moderate_risk_percentage / 100) * day.total_submissions),
        high: acc.high + Math.round((day.high_risk_percentage / 100) * day.total_submissions),
        total: acc.total + day.total_submissions,
      }),
      { positive: 0, neutral: 0, negative: 0, low: 0, moderate: 0, high: 0, total: 0 }
    )
  }, [trendsData])

  const getSentimentLabel = (sentiment: Sentiment) => {
    switch (sentiment) {
      case Sentiment.POSITIVE:
        return 'Positive'
      case Sentiment.NEUTRAL:
        return 'Neutral'
      case Sentiment.NEGATIVE:
        return 'Challenging'
    }
  }

  const pendingAlertCount = alertsData?.pending_count ?? 0

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'students', label: 'My Students', icon: <UserCheck className="h-4 w-4" /> },
    {
      id: 'alerts',
      label: `Alerts${pendingAlertCount > 0 ? ` (${pendingAlertCount})` : ''}`,
      icon: <Bell className="h-4 w-4" />,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display italic text-xl text-primary">MindSpace</h1>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">
              Counselor
            </span>
          </div>
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
      </header>

      {/* Tab Navigation */}
      <div className="border-b bg-background/80">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">

          {/* ── Tab 1: Overview ── */}
          {activeTab === 'overview' && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="text-3xl font-bold text-primary">
                        {trendsLoading ? '-' : `~${totals.total}`}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Submissions (7 days)</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p className="text-3xl font-bold text-green-600">
                        {trendsLoading
                          ? '-'
                          : trendsData?.overall_stats?.most_common_sentiment
                          ? getSentimentLabel(trendsData.overall_stats.most_common_sentiment)
                          : '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">Most Common Mood</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-3xl font-bold text-amber-600">
                        {trendsLoading ? '-' : trendsData?.overall_stats?.average_risk_level?.toFixed(1) || '-'}
                      </p>
                      <p className="text-sm text-muted-foreground">Avg Risk Level (1-3)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Sentiment Distribution</CardTitle>
                    <CardDescription>
                      Overall mood breakdown for the past {dateRange.days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <SentimentPieChart
                        positive={totals.positive}
                        neutral={totals.neutral}
                        negative={totals.negative}
                      />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Risk Level Distribution</CardTitle>
                    <CardDescription>
                      Student risk levels for the past {dateRange.days} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {trendsLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <RiskDistributionChart
                        low={totals.low}
                        moderate={totals.moderate}
                        high={totals.high}
                      />
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Privacy Notice */}
              <Card className="bg-accent border-accent-foreground/10">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Privacy Protection</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Trend data is shown in aggregate form only. You can see your assigned
                        students and receive high-risk alerts, but individual submission content
                        is not accessible. All counselor-student interactions remain confidential.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Tab 2: My Students ── */}
          {activeTab === 'students' && (
            <>
              {/* Assigned Student List */}
              <Card>
                <CardHeader>
                  <CardTitle>My Assigned Students</CardTitle>
                  <CardDescription>
                    Students assigned to your care
                    {myStudentsData?.total_assigned_students
                      ? ` (${myStudentsData.total_assigned_students} total)`
                      : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myStudentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : !myStudentsData || myStudentsData.total_assigned_students === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <UserCheck className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                      <p className="font-medium">No students assigned yet</p>
                      <p className="text-sm mt-1">Contact your admin to assign students to you.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3 font-medium text-muted-foreground">Student Email</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Entries (7d)</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Latest Mood</th>
                            <th className="text-center py-2 px-3 font-medium text-muted-foreground">Latest Risk</th>
                            <th className="text-right py-2 px-3 font-medium text-muted-foreground">Last Active</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myStudentsData.assigned_students.map((student) => (
                            <tr key={student.id} className="border-b last:border-0">
                              <td className="py-2.5 px-3 font-medium">{student.email}</td>
                              <td className="py-2.5 px-3 text-center">{student.total_submissions}</td>
                              <td className="py-2.5 px-3 text-center">
                                {student.latest_sentiment ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    student.latest_sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                                    student.latest_sentiment === 'neutral' ? 'bg-gray-100 text-gray-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {student.latest_sentiment === 'positive' ? 'Positive' :
                                     student.latest_sentiment === 'neutral' ? 'Neutral' : 'Challenging'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">No entries</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {student.latest_risk_level ? (
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                    student.latest_risk_level === 'low' ? 'bg-green-100 text-green-700' :
                                    student.latest_risk_level === 'moderate' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                  }`}>
                                    {student.latest_risk_level === 'low' ? 'Low' :
                                     student.latest_risk_level === 'moderate' ? 'Moderate' : 'High'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">-</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-right text-muted-foreground text-xs">
                                {student.last_active
                                  ? new Date(student.last_active).toLocaleDateString()
                                  : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Tab 3: Alerts ── */}
          {activeTab === 'alerts' && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <CardTitle>At-Risk Alerts</CardTitle>
                </div>
                <CardDescription>
                  Students flagged as high-risk that require your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : !alertsData || alertsData.alerts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="font-medium">No alerts</p>
                    <p className="text-sm mt-1">You'll see alerts here when assigned students are flagged as high-risk.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Summary */}
                    <div className="flex gap-4 mb-4 text-sm">
                      <span className="px-3 py-1 rounded-full bg-red-100 text-red-700 font-medium">
                        {alertsData.alerts.filter((a) => a.status === 'pending').length} Pending
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 font-medium">
                        {alertsData.alerts.filter((a) => a.status === 'acknowledged').length} Acknowledged
                      </span>
                      <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                        {alertsData.alerts.filter((a) => a.status === 'resolved').length} Resolved
                      </span>
                    </div>

                    {/* Alert list */}
                    {alertsData.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-4 border rounded-lg ${
                          alert.status === 'pending'
                            ? 'bg-red-50/50 border-red-200'
                            : alert.status === 'acknowledged'
                            ? 'bg-amber-50/50 border-amber-200'
                            : 'bg-green-50/50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle
                                className={`h-4 w-4 ${
                                  alert.status === 'pending'
                                    ? 'text-red-600'
                                    : alert.status === 'acknowledged'
                                    ? 'text-amber-600'
                                    : 'text-green-600'
                                }`}
                              />
                              <span className="font-medium text-sm">
                                {alert.risk_level === 'high' ? 'High' : 'Moderate'} Risk Alert
                              </span>
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${
                                  alert.status === 'pending'
                                    ? 'bg-red-100 text-red-700'
                                    : alert.status === 'acknowledged'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-green-100 text-green-700'
                                }`}
                              >
                                {alert.status}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Student: {alert.student_email} &middot; {new Date(alert.triggered_at).toLocaleString()}
                            </p>
                            {alert.resolved_at && (
                              <p className="text-xs text-green-600 mt-0.5">
                                Resolved: {new Date(alert.resolved_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                          {alert.status !== 'resolved' && (
                            <div className="flex gap-2 flex-shrink-0">
                              {alert.status === 'pending' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-amber-600 border-amber-600 hover:bg-amber-50"
                                  onClick={() => acknowledgeMutation.mutate(alert.id)}
                                  disabled={acknowledgeMutation.isPending}
                                >
                                  Acknowledge
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => resolveMutation.mutate({ alertId: alert.id })}
                                disabled={resolveMutation.isPending}
                              >
                                Resolve
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Flagged entry text */}
                        {alert.submission_text && (
                          <div className="mt-3 p-3 bg-background/80 border border-border/50 rounded-md">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                              Flagged Entry
                            </p>
                            <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                              {alert.submission_text}
                            </p>
                          </div>
                        )}

                        {alert.resolution_notes && (
                          <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-xs font-medium text-green-700">Resolution Notes</p>
                            <p className="text-sm text-green-800">{alert.resolution_notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </main>
    </div>
  )
}
