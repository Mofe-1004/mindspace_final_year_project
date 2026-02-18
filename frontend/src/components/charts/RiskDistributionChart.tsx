/**
 * Risk Distribution Chart - Bar chart showing risk level distribution
 * Used in Counselor Dashboard
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface RiskDistributionChartProps {
  low: number
  moderate: number
  high: number
}

const COLORS = {
  low: '#22c55e',      // green-500
  moderate: '#f59e0b', // amber-500
  high: '#ef4444',     // red-500
}

export default function RiskDistributionChart({
  low,
  moderate,
  high,
}: RiskDistributionChartProps) {
  const data = [
    { name: 'Low Risk', value: low, color: COLORS.low },
    { name: 'Moderate Risk', value: moderate, color: COLORS.moderate },
    { name: 'High Risk', value: high, color: COLORS.high },
  ]

  const total = low + moderate + high

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available for the selected period.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          className="text-muted-foreground"
          allowDecimals={false}
        />
        <Tooltip
          formatter={(value: number) => [
            `${value} submissions (${((value / total) * 100).toFixed(1)}%)`,
            '',
          ]}
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
