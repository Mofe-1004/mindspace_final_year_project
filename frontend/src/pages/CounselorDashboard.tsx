/**
 * Counselor Dashboard - Aggregate trends view for approved counselors
 */

import { useState, useMemo } from 'react'
import { LogOut, User, Users, TrendingUp, AlertTriangle, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useAuth } from '../lib/AuthContext'
import { useAggregateTrends } from '../hooks/useAggregateTrends'
import { usePendingApprovals } from '../hooks/usePendingApprovals'
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
import { Sentiment } from '../../../types/shared'

export default function CounselorDashboard() {
  const { user, signOut } = useAuth()
  const [dateRange] = useState({ days: 7 })

  // Calculate date range
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - dateRange.days * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0]

  // Fetch aggregate trends
  const { data: trendsData, isLoading: trendsLoading } = useAggregateTrends(startDate, endDate)

  // Fetch pending approvals
  const { data: approvalsData, isLoading: approvalsLoading, approveMutation } = usePendingApprovals()

  const handleSignOut = async () => {
    await signOut()
  }

  const handleApprove = (userId: string) => {
    approveMutation.mutate({ userId, approve: true })
  }

  const handleReject = (userId: string) => {
    approveMutation.mutate({
      userId,
      approve: false,
      rejectionReason: 'Your request has been reviewed and declined.',
    })
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/10">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display italic text-xl text-primary">MindSpace</h1>
            <span className="text-xs text-muted-foreground border border-border rounded-full px-2 py-0.5">Counselor</span>
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

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-3xl font-bold text-purple-600">
                    {approvalsLoading ? '-' : approvalsData?.total_count || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sentiment Distribution */}
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

            {/* Risk Distribution */}
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

          {/* Pending Approvals */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Counselor Approvals</CardTitle>
              <CardDescription>
                Staff members waiting for counselor access approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {approvalsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : approvalsData?.approvals && approvalsData.approvals.length > 0 ? (
                <div className="space-y-4">
                  {approvalsData.approvals.map((approval) => (
                    <div
                      key={approval.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{approval.user_email}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested: {new Date(approval.requested_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => handleApprove(approval.user_id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleReject(approval.user_id)}
                          disabled={approveMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No pending approvals at this time.
                </div>
              )}
            </CardContent>
          </Card>

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
                    All data shown here is anonymized and aggregated. Individual student
                    identities and submissions are not accessible. Data only appears when
                    at least 5 students have submitted in a time period (K-anonymity).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
