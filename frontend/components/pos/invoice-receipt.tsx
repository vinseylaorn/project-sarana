"use client"

import React from "react"
import { useSettings } from "@/lib/settings-context"

interface InvoiceReceiptProps {
  data: {
    orderType:      string
    items:          { name: string; price: number; quantity: number }[]
    subtotal:       number
    discountAmount: number
    discountLabel:  string   
    taxAmount:      number
    taxLabel:       string  
    finalTotal:     number
    selectedMethod: string
    cashReceived:   number
    change:         number
    splitEntries?:  { method: string; amount: string }[]
    payMode:        "full" | "split"
  }
}

export const InvoiceReceipt = React.forwardRef<HTMLDivElement, InvoiceReceiptProps>(({ data }, ref) => {
  const { systemName, systemLogo } = useSettings()
  const now     = new Date()
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
          .invoice-content { width: 80mm !important; }
        }
      `}</style>
      <div
        ref={ref}
        className="invoice-print-area"
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          color: "#000", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "100%", height: "100%",
        }} >
        <div className="invoice-content" style={{ width: "80mm", maxWidth: "80mm", fontSize: 11 }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            {systemLogo && (
              <img src={systemLogo} alt="logo"
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, margin: "0 auto 6px" }} />
            )}
            <p style={{ fontSize: 15, fontWeight: 900, letterSpacing: 2, margin: 0, textTransform: "uppercase" }}>
              {systemName || "RESTAURANT"}
            </p>
            <p style={{ fontSize: 10, margin: "2px 0 0" }}>Siem Reap, Cambodia</p>
            <p style={{ fontSize: 10, margin: "1px 0" }}>Tel: 012 345 678</p>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ fontSize: 10, marginBottom: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Order: {orderId}</span>
              <span>{dateStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Type: {data.orderType}</span>
              <span>{timeStr}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #000" }}>
                <th style={{ textAlign: "left", paddingBottom: 4, fontWeight: 700 }}>Item</th>
                <th style={{ textAlign: "center", paddingBottom: 4, fontWeight: 700, width: 30 }}>Qty</th>
                <th style={{ textAlign: "right", paddingBottom: 4, fontWeight: 700, width: 55 }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {data.items?.length > 0 ? data.items.map((item, i) => (
                <tr key={i}>
                  <td style={{ padding: "3px 0" }}>{item.name}</td>
                  <td style={{ textAlign: "center", padding: "3px 0" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right", padding: "3px 0" }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} style={{ textAlign: "center", padding: "8px 0", color: "#999", fontStyle: "italic" }}>
                    No items
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ fontSize: 11 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
              <span>Subtotal</span>
              <span>${data.subtotal.toFixed(2)}</span>
            </div>
            {data.discountAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Discount ({data.discountLabel})</span>
                <span>-${data.discountAmount.toFixed(2)}</span>
              </div>
            )}
            {data.taxAmount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span>Tax ({data.taxLabel})</span>
                <span>+${data.taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: "flex", justifyContent: "space-between",
              fontWeight: 900, fontSize: 13,
              borderTop: "1px solid #000", paddingTop: 4, marginTop: 4,
            }}>
              <span>TOTAL</span>
              <span>${data.finalTotal.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ fontSize: 10 }}>
            {data.payMode === "split" ? (
              data.splitEntries?.filter(e => parseFloat(e.amount) > 0).map((e, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ textTransform: "capitalize" }}>{e.method}:</span>
                  <span>${parseFloat(e.amount).toFixed(2)}</span>
                </div>
              ))
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Method:</span>
                  <span style={{ fontWeight: 700, textTransform: "uppercase" }}>{data.selectedMethod}</span>
                </div>
                {data.selectedMethod === "cash" && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Cash Received:</span>
                      <span>${data.cashReceived.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
                      <span>Change:</span>
                      <span>${data.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <div style={{ textAlign: "center", marginTop: 14, borderTop: "1px solid #000", paddingTop: 8 }}>
            <p style={{ fontWeight: 900, fontSize: 13, margin: 0, letterSpacing: 1 }}>THANK YOU!</p>
            <p style={{ fontSize: 9, margin: "3px 0 0", color: "#555" }}>
              Please come again · សូមមកម្ដងទៀត
            </p>
            <p style={{ fontSize: 8, margin: "6px 0 0", color: "#bbb" }}>
              Powered by {systemName || "Restaurant System"}
            </p>
          </div>

        </div>
      </div>
    </>
  )
})
InvoiceReceipt.displayName = "InvoiceReceipt"