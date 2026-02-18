/**
 * Sentiment Trend Chart - Line chart showing emotional trends over time
 * Used in both Student Dashboard and Counselor Dashboard
 */

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { SubmissionHistoryItem, Sentiment } from '../../../../types/shared'

interface SentimentTrendChartProps {
  submissions: SubmissionHistoryItem[]
}

interface ChartDataPoint {
  date: string
  positive: number
  neutral: number
  negative: number
}

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#6b7280',  // gray-500
  negative: '#f59e0b', // amber-500 (softer than red for emotional context)
}

export default function SentimentTrendChart({ submissions }: SentimentTrendChartProps) {
  // Group submissions by date and count sentiments
  const groupedData = submissions.reduce((acc, sub) => {
    const date = new Date(sub.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })

    if (!acc[date]) {
      acc[date] = { positive: 0, neutral: 0, negative: 0 }
    }

    if (sub.sentiment === Sentiment.POSITIVE) acc[date].positive++
    else if (sub.sentiment === Sentiment.NEUTRAL) acc[date].neutral++
    else if (sub.sentiment === Sentiment.NEGATIVE) acc[date].negative++

    return acc
  }, {} as Record<string, { positive: number; neutral: number; negative: number }>)

  // Convert to array and sort by date
  const chartData: ChartDataPoint[] = Object.entries(groupedData)
    .map(([date, counts]) => ({
      date,
      ...counts,
    }))
    .reverse() // Most recent last

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data to display yet. Submit your first entry to start tracking.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="positive"
          stroke={COLORS.positive}
          strokeWidth={2}
          dot={{ fill: COLORS.positive, strokeWidth: 2, r: 4 }}
          name="Positive"
        />
        <Line
          type="monotone"
          dataKey="neutral"
          stroke={COLORS.neutral}
          strokeWidth={2}
          dot={{ fill: COLORS.neutral, strokeWidth: 2, r: 4 }}
          name="Neutral"
        />
        <Line
          type="monotone"
          dataKey="negative"
          stroke={COLORS.negative}
          strokeWidth={2}
          dot={{ fill: COLORS.negative, strokeWidth: 2, r: 4 }}
          name="Challenging"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
