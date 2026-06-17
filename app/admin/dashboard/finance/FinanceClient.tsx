'use client'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { RevenueChart, PaymentDonut } from './FinanceCharts'

// ── Types ─────────────────────────────────────────────────────────────────────

export type FinanceData = {
  totalRevenue: number
  totalCount: number
  monthRevenue: number
  monthCount: number
  yearRevenue: number
  outstandingAmount: number
  outstandingCount: number
  avgPerBooking: number
  monthlyTrend: { month: string; revenue: number; count: number }[]
  paymentBreakdown: { name: string; revenue: number; count: number }[]
  recentBookings: { id: string; price: number; created_at: string; payment_method: string }[]
}

export type Assumptions = {
  targetBulanan: number
  targetTahunan: number
  opexBulanan: number
  modal: number
  directCostPct: number   // blended direct-cost ratio as a whole-number percent, e.g. 60.6
  bepTrips: number        // from pricing model, can be overridden
}

// ── Defaults (from Ritsu_Financial_Model_Filled.xlsx) ────────────────────────
export const DEFAULTS: Assumptions = {
  targetBulanan:  320_000,
  targetTahunan:  3_840_000,
  opexBulanan:    70_000,
  modal:          500_000,
  directCostPct:  60.625,   // 194,000 / 320,000 × 100
  bepTrips:       13.9,
}

const LS_KEY = 'ritsu_finance_assumptions'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

const fmtPct = (n: number, d = 1) => `${(n * 100).toFixed(d)}%`

// ── Field ─────────────────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  prefix = 'Rp',
  suffix,
  step = 1_000,
  min = 0,
  note,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  prefix?: string
  suffix?: string
  step?: number
  min?: number
  note?: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-base-content/60">{label}</span>
      <div className="flex items-center gap-1.5">
        {prefix && <span className="text-sm text-base-content/40 shrink-0">{prefix}</span>}
        <input
          type="number"
          className="input input-sm input-bordered flex-1 min-w-0"
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        />
        {suffix && <span className="text-sm text-base-content/40 shrink-0">{suffix}</span>}
      </div>
      {note && <p className="text-[10px] text-base-content/35">{note}</p>}
    </div>
  )
}

// ── Main client component ─────────────────────────────────────────────────────

export default function FinanceClient({ data }: { data: FinanceData }) {
  const [asumsi, setAsumsi] = useState<Assumptions>(DEFAULTS)
  const [draft, setDraft]   = useState<Assumptions>(DEFAULTS)
  const [open, setOpen]     = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load from localStorage on mount (avoids hydration mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        const parsed = { ...DEFAULTS, ...JSON.parse(stored) }
        setAsumsi(parsed)
        setDraft(parsed)
      }
    } catch {}
    setMounted(true)
  }, [])

  function openModal() {
    setDraft({ ...asumsi })
    setOpen(true)
  }

  function saveModal() {
    setAsumsi(draft)
    try { localStorage.setItem(LS_KEY, JSON.stringify(draft)) } catch {}
    setOpen(false)
  }

  function resetDefaults() {
    setDraft({ ...DEFAULTS })
  }

  const setD = (key: keyof Assumptions) => (v: number) =>
    setDraft((p) => ({ ...p, [key]: v }))

  // ── Computed values ──────────────────────────────────────────────────────────
  const {
    monthRevenue, yearRevenue, totalRevenue, totalCount, monthCount,
    outstandingAmount, outstandingCount, avgPerBooking,
    monthlyTrend, paymentBreakdown, recentBookings,
  } = data

  const calc = useMemo(() => {
    const ratio         = asumsi.directCostPct / 100
    const estDirectCost = monthRevenue * ratio
    const estGrossProfit = monthRevenue - estDirectCost
    const estGrossMargin = monthRevenue > 0 ? estGrossProfit / monthRevenue : 0
    const estEBITDA      = estGrossProfit - asumsi.opexBulanan
    const estEBITDAMargin = monthRevenue > 0 ? estEBITDA / monthRevenue : 0

    const grossMarginTarget  = 1 - ratio
    const ebitdaMarginTarget = monthRevenue > 0
      ? (monthRevenue * grossMarginTarget - asumsi.opexBulanan) / asumsi.targetBulanan
      : 0

    const bulanPct  = asumsi.targetBulanan  > 0 ? monthRevenue / asumsi.targetBulanan  : 0
    const tahunPct  = asumsi.targetTahunan  > 0 ? yearRevenue  / asumsi.targetTahunan  : 0

    const estimatedMonthlyEBITDA = asumsi.targetBulanan * grossMarginTarget - asumsi.opexBulanan
    const paybackMonths = estimatedMonthlyEBITDA > 0
      ? asumsi.modal / estimatedMonthlyEBITDA
      : Infinity

    const ebitdaAccumulated = totalRevenue * grossMarginTarget - (totalCount > 0 ? asumsi.opexBulanan * (totalRevenue / asumsi.targetBulanan) : 0)
    const paybackPct = isFinite(paybackMonths) && paybackMonths > 0
      ? Math.min(1, ebitdaAccumulated / asumsi.modal)
      : 0

    const maxBar = Math.max(
      ...monthlyTrend.map((r) => r.revenue),
      asumsi.targetBulanan,
      1,
    )

    const isModified = (Object.keys(DEFAULTS) as (keyof Assumptions)[]).some(
      (k) => asumsi[k] !== DEFAULTS[k],
    )

    return {
      estDirectCost, estGrossProfit, estGrossMargin,
      estEBITDA, estEBITDAMargin,
      grossMarginTarget, ebitdaMarginTarget,
      bulanPct, tahunPct,
      paybackMonths, paybackPct,
      maxBar, isModified,
    }
  }, [asumsi, monthRevenue, yearRevenue, totalRevenue, totalCount, monthlyTrend])

  // Avoid flash of default before localStorage loads
  if (!mounted) return null

  return (
    <>
      {/* ── Assumptions modal (portal so it escapes overflow-auto admin container) ── */}
      {open && mounted && createPortal(
        <div className="modal modal-open modal-middle">
          <div className="modal-box max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Edit Asumsi Model</h3>
              <button className="btn btn-ghost btn-sm btn-square" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">Target Pendapatan</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Target/Bulan"  value={draft.targetBulanan} onChange={setD('targetBulanan')} step={10_000} />
                  <Field label="Target/Tahun"  value={draft.targetTahunan} onChange={setD('targetTahunan')} step={100_000} />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">Struktur Biaya</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field
                    label="Rasio Biaya Langsung"
                    value={draft.directCostPct}
                    onChange={setD('directCostPct')}
                    prefix=""
                    suffix="%"
                    step={0.5}
                    min={0}
                    note="% dari pendapatan (default: 60.6%)"
                  />
                  <Field
                    label="OPEX Bulanan"
                    value={draft.opexBulanan}
                    onChange={setD('opexBulanan')}
                    step={5_000}
                    note="Biaya tidak langsung per bulan"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-base-content/40 uppercase tracking-wider mb-2">Modal & BEP</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Modal Awal" value={draft.modal} onChange={setD('modal')} step={50_000} note="Investasi awal" />
                  <Field
                    label="BEP (trip/bulan)"
                    value={draft.bepTrips}
                    onChange={setD('bepTrips')}
                    prefix=""
                    suffix="trip"
                    step={0.5}
                    note="Minimum trip untuk impas"
                  />
                </div>
              </div>
            </div>

            <div className="modal-action mt-6 flex justify-between">
              <button className="btn btn-ghost btn-sm" onClick={resetDefaults}>
                Reset ke Default
              </button>
              <div className="flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Batal</button>
                <button className="btn btn-primary btn-sm" onClick={saveModal}>Simpan</button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop bg-black/40" onClick={() => setOpen(false)} />
        </div>,
        document.body
      )}

      {/* ── Page content ────────────────────────────────────────────────── */}
      <div className="p-6 max-w-6xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Laporan Keuangan</h1>
            <p className="text-base-content/50 text-sm mt-1">
              RITSU Delivery Services — ringkasan keuangan operasional
            </p>
          </div>
          <button className="btn btn-sm btn-outline gap-2 shrink-0" onClick={openModal}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit Asumsi
            {calc.isModified && <span className="badge badge-primary badge-xs">•</span>}
          </button>
        </div>

        {calc.isModified && (
          <div className="alert alert-info py-2 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Menggunakan asumsi kustom — berbeda dari default model Excel.
            <button className="btn btn-xs btn-ghost ml-auto" onClick={() => { setAsumsi(DEFAULTS); localStorage.removeItem(LS_KEY) }}>
              Reset
            </button>
          </div>
        )}

        {/* ── Revenue Snapshot ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">Pendapatan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Bulan Ini',              value: fmt(monthRevenue),      sub: `${monthCount} transaksi`,           color: 'text-primary',  bg: 'bg-primary/10' },
              { label: 'Tahun Ini',              value: fmt(yearRevenue),        sub: `Target ${fmtPct(calc.tahunPct)} tercapai`, color: 'text-primary',  bg: 'bg-primary/10' },
              { label: 'Total Terkumpul',        value: fmt(totalRevenue),       sub: `${totalCount} transaksi`,           color: 'text-success',  bg: 'bg-success/10' },
              { label: 'Outstanding (Belum Lunas)', value: fmt(outstandingAmount), sub: `${outstandingCount} selesai belum dibayar`, color: 'text-error', bg: 'bg-error/10' },
            ].map(({ label, value, sub, color, bg }) => (
              <div key={label} className="card bg-base-100 shadow-sm">
                <div className="card-body p-5 gap-2">
                  <p className="text-xs font-medium text-base-content/50 uppercase tracking-wide leading-tight">{label}</p>
                  <div className={`flex items-center justify-center h-12 w-full rounded-2xl ${bg} mt-1`}>
                    <span className={`text-xl font-bold ${color}`}>{value}</span>
                  </div>
                  <p className="text-xs text-base-content/40">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Target Attainment ──────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">Pencapaian Target</h2>
          <div className="grid md:grid-cols-3 gap-4">

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body gap-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-sm">Target Bulanan</h3>
                  <span className={`text-lg font-bold ${calc.bulanPct >= 1 ? 'text-success' : 'text-primary'}`}>
                    {fmtPct(calc.bulanPct)}
                  </span>
                </div>
                <progress
                  className={`progress w-full ${calc.bulanPct >= 1 ? 'progress-success' : 'progress-primary'}`}
                  value={Math.min(calc.bulanPct * 100, 100)} max={100}
                />
                <div className="flex justify-between text-xs text-base-content/50">
                  <span>{fmt(monthRevenue)} terkumpul</span>
                  <span>Target {fmt(asumsi.targetBulanan)}</span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body gap-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-sm">Target Tahunan</h3>
                  <span className={`text-lg font-bold ${calc.tahunPct >= 1 ? 'text-success' : 'text-primary'}`}>
                    {fmtPct(calc.tahunPct)}
                  </span>
                </div>
                <progress
                  className={`progress w-full ${calc.tahunPct >= 1 ? 'progress-success' : 'progress-primary'}`}
                  value={Math.min(calc.tahunPct * 100, 100)} max={100}
                />
                <div className="flex justify-between text-xs text-base-content/50">
                  <span>{fmt(yearRevenue)} terkumpul</span>
                  <span>Target {fmt(asumsi.targetTahunan)}</span>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
              <div className="card-body gap-3">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold text-sm">Payback Modal</h3>
                  <span className={`text-lg font-bold ${calc.paybackPct >= 1 ? 'text-success' : 'text-warning'}`}>
                    {fmtPct(Math.max(0, calc.paybackPct))}
                  </span>
                </div>
                <progress
                  className={`progress w-full ${calc.paybackPct >= 1 ? 'progress-success' : 'progress-warning'}`}
                  value={Math.min(Math.max(0, calc.paybackPct) * 100, 100)} max={100}
                />
                <div className="flex justify-between text-xs text-base-content/50">
                  <span>Modal {fmt(asumsi.modal)}</span>
                  <span>
                    Est.{' '}
                    {isFinite(calc.paybackMonths)
                      ? `${calc.paybackMonths.toFixed(1)} bln balik modal`
                      : '∞ (EBITDA negatif)'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Estimated P&L ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">
            Estimasi Laba Rugi — Bulan Ini
            <span className="ml-2 font-normal text-base-content/30 normal-case">
              (biaya dihitung dari rasio {asumsi.directCostPct.toFixed(1)}%)
            </span>
          </h2>
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="divide-y divide-base-200">
                {[
                  { label: 'Pendapatan Kotor',    value: monthRevenue,           cls: 'text-primary font-semibold' },
                  { label: 'Est. Biaya Langsung', value: -calc.estDirectCost,    cls: 'text-error', note: `${asumsi.directCostPct.toFixed(1)}% dari pendapatan` },
                  { label: 'Laba Kotor',          value: calc.estGrossProfit,    cls: `font-bold ${calc.estGrossProfit >= 0 ? '' : 'text-error'}`, margin: calc.estGrossMargin },
                  { label: 'OPEX Bulanan',        value: -asumsi.opexBulanan,   cls: 'text-error', note: 'Biaya tidak langsung' },
                  { label: 'EBITDA',              value: calc.estEBITDA,         cls: `font-bold ${calc.estEBITDA >= 0 ? 'text-success' : 'text-error'}`, margin: calc.estEBITDAMargin },
                ].map(({ label, value, cls, note, margin }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <div>
                      <p className={`text-sm ${cls}`}>{label}</p>
                      {note && <p className="text-xs text-base-content/35 mt-0.5">{note}</p>}
                    </div>
                    <div className="text-right">
                      <p className={`font-mono text-sm ${cls}`}>
                        {value >= 0 ? fmt(value) : `(${fmt(Math.abs(value))})`}
                      </p>
                      {margin !== undefined && (
                        <p className="text-[10px] text-base-content/40">{fmtPct(Math.abs(margin))} margin</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-base-200 space-y-2">
                {[
                  {
                    label: `Gross Margin (target ${fmtPct(calc.grossMarginTarget)})`,
                    actual: calc.estGrossMargin,
                    target: calc.grossMarginTarget,
                  },
                  {
                    label: 'EBITDA Margin',
                    actual: calc.estEBITDAMargin,
                    target: calc.ebitdaMarginTarget,
                  },
                ].map(({ label, actual, target }) => (
                  <div key={label}>
                    <div className="flex justify-between text-xs text-base-content/50 mb-1">
                      <span>{label}</span>
                      <span className="font-medium">{fmtPct(Math.max(0, actual))}</span>
                    </div>
                    <progress
                      className={`progress w-full ${actual >= target ? 'progress-success' : actual > 0 ? 'progress-warning' : 'progress-error'}`}
                      value={Math.max(0, actual * 100)} max={100}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Charts ──────────────────────────────────────────────────── */}

        {/* Revenue trend bar + EBITDA line */}
        <section className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Tren Pendapatan &amp; Est. EBITDA — 12 Bulan</h2>
            </div>
            <p className="text-xs text-base-content/40 mb-3">
              Bar = pendapatan · Garis hijau = estimasi EBITDA · Garis kuning = target {fmt(asumsi.targetBulanan)}/bulan
            </p>
            <RevenueChart
              trend={monthlyTrend}
              targetBulanan={asumsi.targetBulanan}
              directCostPct={asumsi.directCostPct}
              opexBulanan={asumsi.opexBulanan}
            />
          </div>
        </section>

        {/* Payment method donut + outstanding */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="font-semibold mb-1">Metode Pembayaran</h2>
              <p className="text-xs text-base-content/40 mb-2 grow-0">Distribusi total pendapatan terkumpul</p>
              <div className="flex-1 min-h-[220px] w-full">
                <PaymentDonut data={paymentBreakdown} totalRevenue={totalRevenue} />
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <h2 className="font-semibold mb-3">Rincian Pembayaran</h2>
              {paymentBreakdown.length === 0 ? (
                <p className="text-sm text-base-content/40">Belum ada data.</p>
              ) : (
                <div className="space-y-3">
                  {paymentBreakdown.map((pm) => {
                    const pct = totalRevenue > 0 ? pm.revenue / totalRevenue : 0
                    return (
                      <div key={pm.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{pm.name}</span>
                          <span>{fmt(pm.revenue)}</span>
                        </div>
                        <progress className="progress progress-primary w-full" value={pct * 100} max={100} />
                        <p className="text-xs text-base-content/40 mt-0.5">
                          {pm.count} transaksi · {fmtPct(pct)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
              {outstandingAmount > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-error/8 border border-error/20">
                  <p className="text-sm font-semibold text-error">Piutang Belum Tertagih</p>
                  <p className="text-lg font-bold text-error mt-0.5">{fmt(outstandingAmount)}</p>
                  <p className="text-xs text-error/70 mt-0.5">{outstandingCount} perjalanan selesai belum dibayar</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── KPI Referensi ──────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">KPI Referensi</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Target Pendapatan/Bulan', value: fmt(asumsi.targetBulanan),        sub: 'dari asumsi model' },
              { label: 'OPEX Bulanan',            value: fmt(asumsi.opexBulanan),           sub: 'biaya tidak langsung' },
              { label: 'BEP',                     value: `${asumsi.bepTrips} trip`,         sub: 'minimum per bulan' },
              { label: 'Rata-rata/Booking',       value: fmt(avgPerBooking),                sub: `dari ${totalCount} transaksi aktual` },
            ].map(({ label, value, sub }) => (
              <div key={label} className="card bg-base-100 shadow-sm">
                <div className="card-body p-4">
                  <p className="text-[10px] font-semibold text-base-content/45 uppercase tracking-wide">{label}</p>
                  <p className="text-lg font-bold mt-1">{value}</p>
                  <p className="text-[10px] text-base-content/40 mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Recent Transactions ────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-3">Transaksi Terbaru</h2>
          <div className="card bg-base-100 shadow-sm overflow-x-auto">
            {recentBookings.length === 0 ? (
              <div className="card-body">
                <p className="text-sm text-base-content/40">Belum ada transaksi.</p>
              </div>
            ) : (
              <table className="table table-sm w-full">
                <thead>
                  <tr>
                    <th>ID Booking</th>
                    <th>Tanggal</th>
                    <th>Metode</th>
                    <th className="text-right">Nominal</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="font-mono text-xs text-base-content/50">{b.id.slice(0, 8)}…</td>
                      <td className="text-sm">{b.created_at}</td>
                      <td className="text-sm">{b.payment_method ?? '—'}</td>
                      <td className="text-right font-semibold text-success">{fmt(b.price)}</td>
                      <td className="text-right"><span className="badge badge-success badge-sm">Lunas</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <p className="text-[11px] text-base-content/30 text-center pb-4">
          Estimasi P&amp;L menggunakan rasio biaya dari asumsi model keuangan RITSU.
          Biaya aktual per trip tidak dilacak secara langsung di sistem.
        </p>
      </div>
    </>
  )
}
