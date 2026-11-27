"use client"

import React from "react"
import { useSettings } from "@/lib/settings-context"

interface InvoiceReceiptProps {
  data: {
    orderType: string
    items: { name: string; price: number; quantity: number }[]
    subtotal: number
    discountAmount: number
    discountLabel: string
    taxAmount: number
    taxLabel: string
    finalTotal: number
    selectedMethod: string
    cashReceived: number
    change: number
    splitEntries?: { method: string; amount: string }[]
    payMode: "full" | "split"
  }
}

// var(--font-kantumruy) is a CSS custom property that next/font defines on an
// ancestor element in the normal app tree. Chrome's print / "Save as PDF"
// pass renders this component in a context that does not inherit that
// variable, so it was silently falling back to the browser's generic
// "sans-serif", which can't shape Khmer (no coeng/subscript reordering) —
// that's why the shop name printed broken. We still try the app's Kantumruy
// variable first (so on-screen previews use the exact same font as the rest
// of the app), but now list real, commonly-installed Khmer fonts as
// fallbacks so print/PDF always has a script-correct font to use.
const KANTUMRUY =
  "var(--font-kantumruy), 'Khmer OS Battambang', 'Khmer OS Siemreap', " +
  "'Noto Sans Khmer', 'Khmer Sangam MN', 'Khmer OS', sans-serif"

export const InvoiceReceipt = React.forwardRef<HTMLDivElement, InvoiceReceiptProps>(({ data }, ref) => {
  const { systemName, systemLogo } = useSettings()
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-GB")
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
  const orderId = `#${Math.floor(Date.now() / 1000)}`

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body * { visibility: hidden; }
          .invoice-print-area,
          .invoice-print-area * { visibility: visible; }
          .invoice-print-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            right: 0 !important; bottom: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            background: #fff !important;
          }
          .invoice-content {
            width: 80mm !important;
            box-shadow: none !important;
            border: none !important;
            padding: 4mm 3mm !important;
          }
        }
      `}</style>
      <div
        ref={ref}
        className="invoice-print-area"
        style={{
          fontFamily: KANTUMRUY,
          color: "#000", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: "100%",
        }} >
        <div
          className="invoice-content"
          style={{
            width: "80mm", maxWidth: "80mm", fontSize: 11, lineHeight: 1.5,
            background: "#fff", padding: "10mm 5mm",
            boxShadow: "0 1px 4px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06)",
            border: "1px solid #eee",
          }} >
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            {systemLogo && (
              <img src={systemLogo} alt="logo"
                style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, margin: "0 auto 8px" }} />
            )}
            <p style={{
              fontFamily: KANTUMRUY, fontSize: 16, fontWeight: 700, lineHeight: 1.6,
              margin: 0, letterSpacing: 0.5,
            }}>
              {systemName || "RESTAURANT"}
            </p>
            <p style={{ fontSize: 10, margin: "4px 0 0", color: "#444" }}>Siem Reap, Cambodia</p>
            <p style={{ fontSize: 10, margin: "2px 0 0", color: "#444" }}>Tel: 012 345 678</p>
          </div>

          <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

          <div style={{ fontSize: 10, marginBottom: 8, color: "#333" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span>Order: {orderId}</span>
              <span>{dateStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Type: {data.orderType}</span>
              <span>{timeStr}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1.5px solid #000" }}>
                <th style={{ textAlign: "left", paddingBottom: 5, fontWeight: 700, fontSize: 10 }}>ITEM</th>
                <th style={{ textAlign: "center", paddingBottom: 5, fontWeight: 700, fontSize: 10, width: 28 }}>QTY</th>
                <th style={{ textAlign: "right", paddingBottom: 5, fontWeight: 700, fontSize: 10, width: 55 }}>PRICE</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.length > 0 ? data.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 0", fontFamily: KANTUMRUY, fontSize: 11, lineHeight: 1.6, verticalAlign: "top" }}>
                    {item.name}
                  </td>
                  <td style={{ textAlign: "center", padding: "4px 0", verticalAlign: "top" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "4px 0", verticalAlign: "top", fontVariantNumeric: "tabular-nums" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "10px 0", color: "#999", fontStyle: "italic" }}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

          <div style={{ fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span>Subtotal</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>${data.subtotal.toFixed(2)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, color: "#c0392b" }}>
                <span style={{ fontFamily: KANTUMRUY }}>Discount ({data.discountLabel})</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>-${data.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {data.taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                <span style={{ fontFamily: KANTUMRUY }}>Tax ({data.taxLabel})</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>+${data.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 900, fontSize: 14,
              borderTop: "1.5px solid #000", paddingTop: 6, marginTop: 6,
            }}>
              <span>TOTAL</span>
              <span style={{ fontVariantNumeric: "tabular-nums" }}>${data.finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed #999", margin: "10px 0" }} />

          <div style={{ fontSize: 10, color: "#333" }}>
            {data.payMode === "split" ? (
              data.splitEntries?.filter(e => parseFloat(e.amount) > 0).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ textTransform: "capitalize" }}>{e.method}:</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>${parseFloat(e.amount).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span>Method:</span>
                  <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{data.selectedMethod}</span>
                </div>
                {data.selectedMethod === "cash" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                      <span>Cash Received:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>${data.cashReceived.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>Change:</span>
                      <span style={{ fontVariantNumeric: "tabular-nums" }}>${data.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: 16, borderTop: "1.5px solid #000", paddingTop: 10 }}>
            <p style={{ fontWeight: 900, fontSize: 14, margin: 0, letterSpacing: 1.5 }}>THANK YOU!</p>
            <p style={{ fontFamily: KANTUMRUY, fontSize: 10, lineHeight: 1.6, margin: "4px 0 0", color: "#555" }}>
              Please come again · សូមមកម្ដងទៀត
            </p>
            <p style={{ fontFamily: KANTUMRUY, fontSize: 8, lineHeight: 1.6, margin: "8px 0 0", color: "#bbb" }}>
              Powered by {systemName || "Restaurant System"}
            </p>
          </div>

        </div>
      </div>
    </>
  )
})
InvoiceReceipt.displayName = "InvoiceReceipt"