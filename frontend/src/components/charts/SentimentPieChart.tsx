/**
 * Sentiment Pie Chart - Shows sentiment distribution
 * Used in Counselor Dashboard for aggregate view
 */

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface SentimentPieChartProps {
  positive: number
  neutral: number
  negative: number
}

const COLORS = {
  positive: '#22c55e', // green-500
  neutral: '#6b7280',  // gray-500
  negative: '#f59e0b', // amber-500
}

export default function SentimentPieChart({
  positive,
  neutral,
  negative,
}: SentimentPieChartProps) {
  const data = [
    { name: 'Positive', value: positive, color: COLORS.positive },
    { name: 'Neutral', value: neutral, color: COLORS.neutral },
    { name: 'Challenging', value: negative, color: COLORS.negative },
  ].filter((item) => item.value > 0)

  const total = positive + neutral + negative

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [`${value} submissions`, '']}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
