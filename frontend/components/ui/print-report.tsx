// lib/utils/print-report.tsx

function fmt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00"
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export interface PrintOrder {
  order_ref:       string
  table_name?:     string | null
  order_type:      string
  total:           any
  payment_method?: string | null
}

export interface PrintTotals {
  totalRevenue: number
  totalOrders:  number
  avgOrder:     number
}

export interface PrintReportOptions {
  title?:      string
  orders:      PrintOrder[]
  totals:      PrintTotals
  stats?:      { label: string; value: string | number }[]
  onDone?:     () => void
}

// ── Styles ────────────────────────────────────────────────────────────────────

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box }
  body { font-family: 'Sora', sans-serif; padding: 32px; color: #1f2937 }
  h1 { font-size: 22px; font-weight: 900; color: #4f46e5; margin-bottom: 4px }
  .meta { font-size: 11px; color: #9ca3af; margin-bottom: 24px }
  .stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px }
  .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px }
  .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700 }
  .stat-value { font-size: 22px; font-weight: 900; color: #111827; margin-top: 4px }
  table { width: 100%; border-collapse: collapse }
  thead { background: #f3f4f6 }
  th, td { padding: 10px 12px; font-size: 12px; text-align: left; border-bottom: 1px solid #f0f0f0 }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700 }
  td.amount { font-weight: 700; color: #4f46e5 }
`

// ── HTML builder ──────────────────────────────────────────────────────────────

function buildHTML({ title = "Report", orders, totals, stats }: PrintReportOptions) {
  const statCards = (stats ?? [
    { label: "Total Revenue", value: fmt(totals.totalRevenue) },
    { label: "Total Orders",  value: totals.totalOrders },
    { label: "Avg Order",     value: fmt(totals.avgOrder) },
  ]).map(s => `
    <div class="stat">
      <p class="stat-label">${s.label}</p>
      <p class="stat-value">${s.value}</p>
    </div>`
  ).join("")

  const rows = orders.slice(0, 50).map(o => `
    <tr>
      <td>${o.order_ref}</td>
      <td>${o.table_name ?? o.order_type}</td>
      <td class="amount">${fmt(o.total)}</td>
      <td>${o.payment_method ?? "-"}</td>
    </tr>`
  ).join("")

  return `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated: ${new Date().toLocaleString()} · ${orders.length} orders</p>
  <div class="stats">${statCards}</div>
  <table>
    <thead>
      <tr>
        <th>Order Ref</th><th>Table / Type</th><th>Amount</th><th>Method</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

// ── Core print util ───────────────────────────────────────────────────────────

function printViaIframe(html: string, onDone?: () => void) {
  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0"
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }

  doc.open(); doc.write(html); doc.close()

  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe)
      onDone?.()
    }, 1000)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function printReport(options: PrintReportOptions) {
  if (!options.orders.length) return
  const html = buildHTML(options)
  printViaIframe(html, options.onDone)
}