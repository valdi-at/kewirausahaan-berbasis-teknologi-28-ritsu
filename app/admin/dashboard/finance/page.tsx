import type { Metadata } from 'next'
import { getFinanceMetrics } from '@/app/lib/queries/finance'
import { formatDayMonthYear, formatMonthYear } from '@/app/lib/format'
import FinanceClient from './FinanceClient'

export const metadata: Metadata = { title: 'Finance - RITSU Admin' }

export default async function FinancePage() {
  const metrics = await getFinanceMetrics()

  return (
    <FinanceClient
      data={{
        totalRevenue: metrics.allTime.revenue,
        totalCount: metrics.allTime.count,
        monthRevenue: metrics.thisMonth.revenue,
        monthCount: metrics.thisMonth.count,
        yearRevenue: metrics.thisYear.revenue,
        outstandingAmount: metrics.outstanding.amount,
        outstandingCount: metrics.outstanding.count,
        avgPerBooking: metrics.averagePerBooking,
        monthlyTrend: metrics.monthlyTrend.map((r) => ({
          month: formatMonthYear(r.month),
          revenue: r.revenue,
          count: r.count,
        })),
        paymentBreakdown: metrics.paymentBreakdown.map((r) => ({
          name: r.name,
          revenue: r.revenue,
          count: r.count,
        })),
        recentBookings: metrics.recentPaidBookings.map((r) => ({
          id: r.id,
          price: r.price,
          created_at: formatDayMonthYear(r.createdDate),
          payment_method: r.paymentMethod,
        })),
      }}
    />
  )
}
