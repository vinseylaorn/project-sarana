interface CartItem {
  id?: string | number
  name: string
  price: number
  original_price?: number | null
  quantity: number
  discount?: {
    name: string
    value: number
    value_type: "percentage" | "flat"
  } | null
}

interface SplitEntry {
  method: string
  amount: string
}

interface PrintBillParams {
  // ── Order info ──────────────────────────────────────
  items: CartItem[]
  orderType: string
  orderId?: number | null
  orderRef?: string

  // ── Totals ──────────────────────────────────────────
  subtotal: number
  discountAmount: number
  discountMode: "%" | "$"
  discountPct: number
  taxEnabled: boolean
  taxPct: number
  taxAmount: number
  finalTotal: number
  itemDiscountTotal: number

  // ── VIP ─────────────────────────────────────────────
  vipCode?: string
  vipCardTierName?: string
  vipTierDiscount?: number
  vipDiscountAmount?: number

  // ── Payment ─────────────────────────────────────────
  payMode?: "full" | "split"
  selectedMethod?: string | null
  cashReceived?: number
  change?: number
  splitEntries?: SplitEntry[]

  // ── Staff / Shift ─────────────────────────────────────
  staffName?: string | null
  shiftType?: string | null
  tableName?: string | null
  date?: string | null
  time?: string | null

  // ── Branding ─────────────────────────────────────────
  systemLogo?: string | null
  systemName?: string | null
}

const KHMER_FONT_NAME = "Noto Sans Khmer"
const KHMER_FONT = `'${KHMER_FONT_NAME}', 'Khmer OS Battambang', 'Khmer Sangam MN', sans-serif`
const KHMER_FONT_CSS = "https://fonts.googleapis.com/css2?family=Noto+Sans+Khmer:wght@400;500;700;900&display=block"

export function printBill(params: PrintBillParams): void {
  const {
    items,
    orderType,
    orderId,
    orderRef,
    discountAmount,
    discountMode,
    discountPct,
    taxEnabled,
    taxPct,
    taxAmount,
    finalTotal,
    itemDiscountTotal,
    vipCode,
    vipCardTierName,
    vipTierDiscount,
    vipDiscountAmount = 0,
    payMode,
    selectedMethod,
    cashReceived = 0,
    change = 0,
    splitEntries = [],
    staffName,
    shiftType,
    tableName,
    date: dateProp,
    time: timeProp,
    systemLogo,
    systemName,
  } = params

  const now = new Date()
  const dateStr = dateProp || now.toLocaleDateString("en-GB")
  const timeStr = timeProp || now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  const orderIdStr = orderRef || (orderId ? `#${orderId}` : `#${Math.floor(Date.now() / 1000)}`)

  // ── Item rows ──────────────────────────────────────────────────────────
  const itemRows = items.map(it => {
    const origPrice = it.original_price ?? it.price
    const hasDisc = it.original_price != null && it.original_price > it.price
    const discAmt = hasDisc ? (it.original_price! - it.price) * it.quantity : 0
    const discLabel = it.discount
      ? it.discount.value_type === "percentage"
        ? `${it.discount.name} -${it.discount.value}%`
        : `${it.discount.name} -$${it.discount.value}`
      : hasDisc ? "Discount" : ""
    return `
      <tr>
        <td style="padding:3px 0;font-family:${KHMER_FONT}">${it.name}</td>
        <td style="text-align:center;padding:3px 0">${it.quantity}</td>
        <td style="text-align:right;padding:3px 0">
          ${hasDisc
        ? `<span style="text-decoration:line-through;color:#999;font-size:9px">$${(origPrice * it.quantity).toFixed(2)}</span><br/>$${(it.price * it.quantity).toFixed(2)}`
        : `$${(it.price * it.quantity).toFixed(2)}`
      }
        </td>
      </tr>
      ${hasDisc ? `<tr><td colspan="3" style="padding:0 0 3px 8px;font-size:9px;color:#1857D8;font-family:${KHMER_FONT}">↳ ${discLabel} &nbsp;-$${discAmt.toFixed(2)}</td></tr>` : ""}
    `
  }).join("")

  // ── Summary lines ──────────────────────────────────────────────────────
  const grossSubtotal = items.reduce((s, i) => s + (i.original_price ?? i.price) * i.quantity, 0)
  const totalSaved = itemDiscountTotal + discountAmount + vipDiscountAmount

  const itemDiscLine = itemDiscountTotal > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;color:#1857D8">
         <span>Item Discounts</span><span>-$${itemDiscountTotal.toFixed(2)}</span>
       </div>` : ""

  const discountLine = discountAmount > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;color:#1857D8">
         <span style="font-family:${KHMER_FONT}">Checkout Discount (${discountMode === "%" ? discountPct.toFixed(1) + "%" : "$" + discountAmount.toFixed(2)})</span>
         <span>-$${discountAmount.toFixed(2)}</span>
       </div>` : ""

  const taxLine = taxEnabled && taxPct > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;color:#1d4ed8">
         <span>Tax (${taxPct}%)</span><span>+$${taxAmount.toFixed(2)}</span>
       </div>` : ""

  const vipLine = vipCode && vipCardTierName && vipDiscountAmount > 0
    ? `<div style="display:flex;justify-content:space-between;margin-bottom:2px;color:#7c3aed">
         <span style="font-family:${KHMER_FONT}">👑 VIP ${vipCardTierName} (${vipTierDiscount}%)</span>
         <span>-$${vipDiscountAmount.toFixed(2)}</span>
       </div>` : ""

  // ── Payment lines ──────────────────────────────────────────────────────
  let paymentLines = ""
  if (payMode === "split") {
    paymentLines = splitEntries
      .filter(e => parseFloat(e.amount) > 0)
      .map(e =>
        `<div style="display:flex;justify-content:space-between">
           <span style="text-transform:capitalize;font-family:${KHMER_FONT}">${e.method}:</span>
           <span>$${parseFloat(e.amount).toFixed(2)}</span>
         </div>`
      ).join("")
  } else if (selectedMethod === "cash") {
    paymentLines = `
      <div style="display:flex;justify-content:space-between">
        <span>Method:</span><span style="font-weight:700;text-transform:uppercase">Cash</span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>Cash Received:</span><span>$${cashReceived.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-weight:700">
        <span>Change:</span><span>$${Math.max(0, change).toFixed(2)}</span>
      </div>`
  } else if (selectedMethod) {
    paymentLines = `
      <div style="display:flex;justify-content:space-between">
        <span>Method:</span>
        <span style="font-weight:700;text-transform:uppercase;font-family:${KHMER_FONT}">${selectedMethod}</span>
      </div>`
  }

  const vipHeaderRow = vipCode && vipCardTierName
    ? `<div style="display:flex;justify-content:space-between;margin-top:3px;color:#7c3aed;font-weight:700;font-family:${KHMER_FONT}">
         <span>👑 VIP Card: ${vipCode}</span><span>${vipCardTierName}</span>
       </div>` : ""

  const logoSrc = systemLogo || ""
  const shopName = systemName || "RESTAURANT"
  const logoHtml = logoSrc
    ? `<img src="${logoSrc}" alt="logo" style="width:56px;height:56px;object-fit:cover;border-radius:8px;margin:0 auto 6px;display:block"/>` : ""

  const tableRow = tableName ? `<div style="display:flex;justify-content:space-between;font-family:${KHMER_FONT}"><span>Table:</span><span>${tableName}</span></div>` : ""
  const staffRow = staffName ? `<div style="display:flex;justify-content:space-between;font-family:${KHMER_FONT}"><span>Staff:</span><span>${staffName}</span></div>` : ""
  const shiftRow = shiftType ? `<div style="display:flex;justify-content:space-between;font-family:${KHMER_FONT}"><span>Shift:</span><span>${shiftType}</span></div>` : ""

  const html = `<!DOCTYPE html>
  <html>
    <head>
      <title>Receipt</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link rel="stylesheet" href="${KHMER_FONT_CSS}">
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Courier New',Courier,monospace; font-size:11px; color:#000; background:#fff;
              display:flex; align-items:flex-start; justify-content:center; padding:20px; }
        table { width:100%; border-collapse:collapse; }
        @media print { @page { margin:4mm; size:auto; } }
      </style>
    </head>
    <body>
    <div style="width:80mm">
      <div style="text-align:center;margin-bottom:12px">
        ${logoHtml}
        <p style="font-size:15px;font-weight:900;letter-spacing:2px;margin:0;text-transform:uppercase;line-height:1.6;font-family:${KHMER_FONT}">${shopName}</p>
        <p style="font-size:10px;margin:2px 0 0">Siem Reap, Cambodia</p>
        <p style="font-size:10px;margin:1px 0">Tel: 012 345 678</p>
      </div>

      <div style="border-top:1px dashed #000;margin:8px 0"></div>

      <div style="font-size:10px;margin-bottom:6px">
        <div style="display:flex;justify-content:space-between"><span>Order: ${orderIdStr}</span><span>${dateStr}</span></div>
        <div style="display:flex;justify-content:space-between;font-family:${KHMER_FONT}"><span>Type: ${orderType}</span><span>${timeStr}</span></div>
        ${tableRow}${staffRow}${shiftRow}${vipHeaderRow}
      </div>

      <div style="border-top:1px dashed #000;margin:8px 0"></div>

      <table>
        <thead>
          <tr style="border-bottom:1px solid #000">
            <th style="text-align:left;padding-bottom:4px;font-weight:700">Item</th>
            <th style="text-align:center;padding-bottom:4px;font-weight:700;width:30px">Qty</th>
            <th style="text-align:right;padding-bottom:4px;font-weight:700;width:60px">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || '<tr><td colspan="3" style="text-align:center;padding:8px 0;color:#999;font-style:italic">No items</td></tr>'}
        </tbody>
      </table>

      <div style="border-top:1px dashed #000;margin:8px 0"></div>

      <div style="font-size:11px">
        <div style="display:flex;justify-content:space-between;margin-bottom:2px">
          <span>Subtotal</span><span>$${grossSubtotal.toFixed(2)}</span>
        </div>
        ${itemDiscLine}${discountLine}${taxLine}${vipLine}
        <div style="display:flex;justify-content:space-between;font-weight:900;font-size:13px;border-top:1px solid #000;padding-top:4px;margin-top:4px">
          <span>TOTAL</span><span>$${finalTotal.toFixed(2)}</span>
        </div>
        ${totalSaved > 0 ? `
        <div style="display:flex;justify-content:space-between;margin-top:3px;font-size:10px;color:#16a34a;font-weight:700">
          <span>You saved</span><span>$${totalSaved.toFixed(2)}</span>
        </div>` : ""}
      </div>

      ${paymentLines ? `<div style="border-top:1px dashed #000;margin:8px 0"></div><div style="font-size:10px">${paymentLines}</div>` : ""}

      <div style="text-align:center;margin-top:14px;border-top:1px solid #000;padding-top:8px">
        <p style="font-weight:900;font-size:13px;margin:0;letter-spacing:1px">THANK YOU!</p>
        <p style="font-size:9px;margin:3px 0 0;color:#555;line-height:1.6;font-family:${KHMER_FONT}">Please come again · សូមមកម្ដងទៀត</p>
        <p style="font-size:8px;margin:6px 0 0;color:#bbb;line-height:1.6;font-family:${KHMER_FONT}">Powered by ${shopName}</p>
      </div>

    </div>
    </body>
  </html>`

  const iframe = document.createElement("iframe")
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:0;"
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) { document.body.removeChild(iframe); return }
  doc.open(); doc.write(html); doc.close()
  iframe.onload = () => {
    const win = iframe.contentWindow
    const fontsReady = (doc as any).fonts?.load(`700 16px "${KHMER_FONT_NAME}"`)
      .then(() => (doc as any).fonts.ready)
      .catch(() => Promise.resolve())
      ?? Promise.resolve()
    Promise.race([fontsReady, new Promise(resolve => setTimeout(resolve, 1200))]).then(() => {
      win?.focus()
      win?.print()
      setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe) }, 1000)
    })
  }
}