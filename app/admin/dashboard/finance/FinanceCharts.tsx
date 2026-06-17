'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts'

// ── Theme colours (approximate hex for recharts) ──────────────────────────────
const C = {
  primary:   '#22C4C4',
  success:   '#4ADE80',
  warning:   '#FBBF24',
  error:     '#F87171',
  info:      '#60A5FA',
  secondary: '#FDE68A',
  muted:     '#94A3B8',
}

const PIE_PALETTE = [C.primary, C.success, C.warning, C.info, C.secondary, C.error]

// ── Formatters ────────────────────────────────────────────────────────────────
const fmtShort = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`
  if (Math.abs(v) >= 1_000)     return `${(v / 1_000).toFixed(0)}rb`
  return v.toFixed(0)
}

const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

// ── Revenue trend + EBITDA ────────────────────────────────────────────────────

type TrendRow = { month: string; revenue: number; count: number }

interface RevenueChartProps {
  trend: TrendRow[]
  targetBulanan: number
  directCostPct: number
  opexBulanan: number
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-lg p-3 text-sm min-w-40">
      <p className="font-semibold text-base-content mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono font-medium">{fmtIDR(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function RevenueChart({ trend, targetBulanan, directCostPct, opexBulanan }: RevenueChartProps) {
  // Recharts expects chronological order (left → right = oldest → newest)
  const data = [...trend].reverse().map((r) => {
    const estEBITDA = r.revenue * (1 - directCostPct / 100) - opexBulanan
    return {
      month:    r.month,
      Pendapatan: r.revenue,
      'Est. EBITDA': estEBITDA,
    }
  })

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-base-content/40">
        Belum ada data
      </div>
    )
  }

  return (
    <div style={{ height: 280 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="oklch(91% 0.02 195)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickFormatter={fmtShort}
            tick={{ fontSize: 11, fill: C.muted }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip content={<RevenueTooltip />} cursor={{ fill: 'oklch(96% 0.01 195 / 0.6)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />

          {/* Target reference line */}
          <ReferenceLine
            y={targetBulanan}
            stroke={C.warning}
            strokeDasharray="4 3"
            strokeWidth={1.5}
            label={{ value: `Target ${fmtShort(targetBulanan)}`, position: 'insideTopRight', fontSize: 10, fill: C.warning }}
          />

          <Bar dataKey="Pendapatan" fill={C.primary} radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Line
            type="monotone"
            dataKey="Est. EBITDA"
            stroke={C.success}
            strokeWidth={2}
            dot={{ r: 3, fill: C.success, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Payment method donut ──────────────────────────────────────────────────────

type PaymentRow = { name: string; revenue: number; count: number }

function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number
  innerRadius: number; outerRadius: number; percent: number
}) {
  if (percent < 0.06) return null
  const RADIAN = Math.PI / 180
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

function DonutTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: PaymentRow }[] }) {
  if (!active || !payload?.length) return null
  const { name, value, payload: row } = payload[0]
  return (
    <div className="bg-base-100 border border-base-300 rounded-xl shadow-lg p-3 text-sm">
      <p className="font-semibold mb-1">{name}</p>
      <p className="font-mono">{fmtIDR(value)}</p>
      <p className="text-base-content/50 text-xs">{row.count} transaksi</p>
    </div>
  )
}

export function PaymentDonut({ data, totalRevenue }: { data: PaymentRow[]; totalRevenue: number }) {
  const filtered = data.filter((d) => d.revenue > 0)

  if (filtered.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-base-content/40">
        Belum ada data
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            dataKey="revenue"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius="52%"
            outerRadius="78%"
            paddingAngle={filtered.length > 1 ? 2 : 0}
            labelLine={false}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            label={DonutLabel as any}
          >
            {filtered.map((_, i) => (
              <Cell key={i} fill={PIE_PALETTE[i % PIE_PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(value: string, entry: any) => {
              const rev: number = entry?.payload?.revenue ?? 0
              const pct = totalRevenue > 0 ? ((rev / totalRevenue) * 100).toFixed(1) : '0'
              return <span style={{ fontSize: 12 }}>{value} ({pct}%)</span>
            }}
          />
        </PieChart>
      </ResponsiveContainer>
  )
}
