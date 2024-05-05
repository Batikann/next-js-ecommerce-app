'use client'
import { formatCurrency } from '@/lib/formatters'
import { OrderByDayChartsProps } from '@/lib/types'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const OrdersByDayChart = ({ data }: OrderByDayChartsProps) => {
  return (
    <ResponsiveContainer width="100%" minHeight={300}>
      <LineChart data={data}>
        <CartesianGrid stroke="hsl(var(--muted))" />
        <XAxis dataKey="date" stroke="hsl(var(--primary))" />
        <YAxis
          tickFormatter={(tick) => formatCurrency(tick)}
          stroke="hsl(var(--primary))"
        />
        <Tooltip formatter={(value) => formatCurrency(value as number)} />
        <Legend />
        <Line
          dot={false}
          dataKey="totalSales"
          type={'monotone'}
          name="Total Sales"
          stroke="hsl(var(--primary))"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
export default OrdersByDayChart
