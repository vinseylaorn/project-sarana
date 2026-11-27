// lib/utils/print-inventory-report.tsx
// Print util dedicated to the Inventory report (separate from the Sales print-report).

export interface PrintInventoryItem {
   name: string
   category?: string | null
   stock: number
   min_stock: number
   unit?: string | null
   supplier?: string | null
}

export interface PrintInventoryKpi {
   totalProducts: number
   goodStock: number
   lowStock: number
   outStock: number
   totalIn: number
   totalOut: number
}

export interface PrintInventoryOptions {
   title?: string
   items: PrintInventoryItem[]
   kpi: PrintInventoryKpi
   startDate?: string
   endDate?: string
   isKh?: boolean
   onDone?: () => void
}

const esc = (v: unknown): string =>
   String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")

const GREEN = "#03624C"
const AMBER = "#D97706"
const RED = "#DC2626"
const BLUE = "#1857D8"

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box }
  body { font-family: 'Kantumruy Pro', 'Noto Sans Khmer', 'Sora', sans-serif; padding: 32px; color: #1f2937 }
  h1 { font-size: 22px; font-weight: 900; color: ${GREEN}; margin-bottom: 4px }
  .meta { font-size: 11px; color: #9ca3af; margin-bottom: 24px }
  .stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 28px }
  .stat { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 14px 16px }
  .stat-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700 }
  .stat-value { font-size: 22px; font-weight: 900; color: #111827; margin-top: 4px }
  h2 { font-size: 14px; font-weight: 800; color: #111827; margin-bottom: 10px }
  table { width: 100%; border-collapse: collapse }
  thead { background: #f3f4f6 }
  th, td { padding: 10px 12px; font-size: 12px; text-align: left; border-bottom: 1px solid #f0f0f0 }
  th { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; font-weight: 700 }
  .num { text-align: right; font-variant-numeric: tabular-nums }
  .name { font-weight: 700 }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 11px; font-weight: 700 }
  .empty { text-align: center; padding: 28px; color: #6b7280 }
  tr { page-break-inside: avoid }
  @media print { body { padding: 16px } }
`

function buildHTML(o: PrintInventoryOptions): string {
   const kh = !!o.isKh
   const t = (en: string, km: string) => (kh ? km : en)
   const title = o.title ?? t("Inventory Report", "របាយការណ៍ស្តុកទំនិញ")

   const period =
      o.startDate || o.endDate
         ? `${o.startDate || "…"} → ${o.endDate || "…"}`
         : t("All time", "គ្រប់ពេល")

   const stats = [
      { label: t("Total Products", "ផលិតផលសរុប"), value: o.kpi.totalProducts, color: "#111827" },
      { label: t("Good Stock", "ស្តុកល្អ"), value: o.kpi.goodStock, color: GREEN },
      { label: t("Low Stock", "ស្តុកជិតអស់"), value: o.kpi.lowStock, color: AMBER },
      { label: t("Out of Stock", "អស់ស្តុក"), value: o.kpi.outStock, color: RED },
      { label: t("Stock In", "ចូល"), value: `+${o.kpi.totalIn}`, color: GREEN },
      { label: t("Stock Out", "ចេញ"), value: `-${o.kpi.totalOut}`, color: BLUE },
   ]

   const statCards = stats.map(s => `
    <div class="stat">
      <p class="stat-label">${esc(s.label)}</p>
      <p class="stat-value" style="color:${s.color}">${esc(s.value)}</p>
    </div>`).join("")

   const rows = o.items.map(item => {
      const out = item.stock === 0
      const need = Math.max(0, item.min_stock - item.stock)
      const unit = esc(item.unit ?? "")
      const badge = out
         ? `<span class="badge" style="background:${RED};color:#fff">${t("Out of stock", "អស់ស្តុក")}</span>`
         : `<span class="badge" style="background:${AMBER}1A;color:${AMBER}">${t("Low stock", "ជិតអស់")}</span>`
      return `
    <tr>
      <td class="name">${esc(item.name)}</td>
      <td>${esc(item.category ?? "—")}</td>
      <td>${badge}</td>
      <td class="num" style="color:${out ? RED : AMBER};font-weight:700">${esc(item.stock)} ${unit}</td>
      <td class="num">${esc(item.min_stock)} ${unit}</td>
      <td class="num" style="font-weight:700">+${need} ${unit}</td>
      <td>${esc(item.supplier ?? "—")}</td>
    </tr>`
   }).join("")

   const body = rows || `
    <tr><td colspan="7" class="empty">${t("All items are well stocked", "ស្តុកទាំងអស់នៅកម្រិតល្អ")}</td></tr>`

   return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(title)}</title>
  <style>${PRINT_STYLES}</style>
</head>
<body>
  <h1>${esc(title)}</h1>
  <p class="meta">${t("Generated", "បង្កើតនៅ")}: ${esc(new Date().toLocaleString())} · ${esc(period)} · ${o.items.length} ${t("items", "ធាតុ")}</p>
  <div class="stats">${statCards}</div>
  <h2>${t("Low & Out of Stock Items", "ផលិតផលស្តុកជិតអស់ / អស់")}</h2>
  <table>
    <thead>
      <tr>
        <th>${t("Item", "ឈ្មោះ")}</th>
        <th>${t("Category", "ប្រភេទ")}</th>
        <th>${t("Status", "ស្ថានភាព")}</th>
        <th class="num">${t("Stock", "ស្តុក")}</th>
        <th class="num">${t("Min", "អប្បបរមា")}</th>
        <th class="num">${t("Need", "ត្រូវបន្ថែម")}</th>
        <th>${t("Supplier", "អ្នកផ្គត់ផ្គង់")}</th>
      </tr>
    </thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`
}

function printViaIframe(html: string, onDone?: () => void) {
   const iframe = document.createElement("iframe")
   iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0"

   let printed = false
   const run = () => {
      if (printed) return
      printed = true
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => {
         if (document.body.contains(iframe)) document.body.removeChild(iframe)
         onDone?.()
      }, 1000)
   }

   iframe.onload = run
   iframe.srcdoc = html
   document.body.appendChild(iframe)
   // fallback in case onload does not fire
   setTimeout(run, 800)
}

export function printInventoryReport(options: PrintInventoryOptions) {
   // Unlike the sales report, print even when the list is empty (shows "all well stocked")
   printViaIframe(buildHTML(options), options.onDone)
}