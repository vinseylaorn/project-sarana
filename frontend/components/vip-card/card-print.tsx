"use client"

import { CreditCard, QrCode, Printer } from "lucide-react"
import { cn } from "@/lib/utils"
import { TierIcon } from "./tier-icon"
import { isCardExpired, AC } from "@/components/vip-card/types"
import type { VipCard, VipTier } from "@/components/vip-card/types"
import QRCode from "qrcode"

export function CardVisual({ card, tier }: { card: VipCard; tier: VipTier }) {
  const expired = isCardExpired(card)
  return (
    <div style={{
      width: "100%", height: 180, borderRadius: 14,
      background: `linear-gradient(135deg, ${tier.bgFrom} 0%, ${tier.bgTo} 100%)`,
      position: "relative", overflow: "hidden",
      border: `1px solid ${tier.accentColor}22`,
      opacity: expired ? 0.5 : 1,
    }}>
      <div style={{
        position: "absolute", top: -35, right: -35,
        width: 140, height: 140, borderRadius: "50%",
        background: tier.accentColor, opacity: 0.12,
      }} />
      <div style={{
        position: "absolute", bottom: -25, left: -15,
        width: 100, height: 100, borderRadius: "50%",
        background: tier.accentColor, opacity: 0.07,
      }} />
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}
        viewBox="0 0 340 180"
        preserveAspectRatio="none" >
        {[36, 72, 108, 144].map(y => (
          <line key={y} x1="0" y1={y} x2="340" y2={y} stroke={tier.color} strokeWidth=".7" />
        ))}
        {[68, 136, 204, 272].map(x => (
          <line key={x} x1={x} y1="0" x2={x} y2="180" stroke={tier.color} strokeWidth=".7" />
        ))}
      </svg>
      <div style={{
        position: "relative", zIndex: 2, padding: "18px 20px",
        height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 7,
              background: `${tier.accentColor}22`,
              border: `1px solid ${tier.accentColor}44`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard size={13} color={tier.color} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>VIP Member</div>
            </div>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "2px 9px", borderRadius: 20,
            background: `${tier.accentColor}22`,
            border: `1px solid ${tier.accentColor}44`,
          }}>
            <TierIcon icon={tier.icon} size={10} color={tier.color} />
            <span style={{ fontSize: 8.5, fontWeight: 700, color: tier.color, letterSpacing: ".06em" }}>
              {tier.name.toUpperCase()}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TierIcon icon={tier.icon} size={26} color={`${tier.color}88`} />
          <div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.32)", fontWeight: 600, letterSpacing: ".06em" }}>
              DISCOUNT
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: tier.color, lineHeight: 1.1 }}>
              {tier.discount}%
            </div>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <div style={{ fontSize: 8.5, color: "rgba(255,255,255,.32)", fontWeight: 600, letterSpacing: ".06em" }}>
              VALID UNTIL
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.7)", marginTop: 2 }}>
              {expired
                ? <span style={{ color: "#ef4444" }}>EXPIRED</span>
                : card.expiresAt ?? <span style={{ color: "rgba(255,255,255,.4)" }}>No Limit</span>
              }
            </div>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{
              fontSize: 13, fontFamily: "monospace", letterSpacing: ".14em",
              color: "rgba(255,255,255,.75)", fontWeight: 700,
            }}>
              {card.code}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,.28)", marginTop: 2 }}>
              Issued: {card.issuedAt}
            </div>
          </div>
          <div style={{
            width: 36, height: 36, background: "#fff",
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <QrCode size={22} color="#000" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function PrintCardButton({
  card,
  tier,
  isKh,
}: {
  card: VipCard
  tier: VipTier
  isKh: boolean
}) {
  return (
    <button
      onClick={() => printCardVisual(card, tier)}
      className={cn("h-9 px-4 rounded-xl text-[12px] font-bold flex items-center gap-1.5 border", AC.pill)} >
      <Printer className="w-3.5 h-3.5" />
      {isKh ? "បោះពុម្ព" : "Print Card"}
    </button>
  )
}

export async function printCardVisual(card: VipCard, tier: VipTier) {

  const expired = new Date(card.expiresAt ?? "9999") < new Date()
  const qrDataUrl = await QRCode.toDataURL(card.code, {
    width: 120,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  })

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8"/>
    <title>VIP Card — ${card.code}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800;900&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: 'Sora', sans-serif;
        background: #0f172a;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        gap: 16px;
        padding: 32px;
      }
      .label {
        font-size: 9px; font-weight: 900; letter-spacing: .18em;
        text-transform: uppercase; color: rgba(255,255,255,.25);
        margin-bottom: 6px;
      }
      .card {
        width: 400px; height: 228px;
        border-radius: 18px;
        position: relative; overflow: hidden;
        background: linear-gradient(135deg, ${tier.bgFrom} 0%, ${tier.bgTo} 100%);
        border: 1px solid ${tier.accentColor}33;
        opacity: ${expired ? 0.65 : 1};
        box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 4px 20px ${tier.accentColor}28;
      }
      .blob1 {
        position: absolute; top: -45px; right: -45px;
        width: 180px; height: 180px; border-radius: 50%;
        background: ${tier.accentColor}; opacity: .13;
      }
      .blob2 {
        position: absolute; bottom: -35px; left: -25px;
        width: 140px; height: 140px; border-radius: 50%;
        background: ${tier.accentColor}; opacity: .08;
      }
      .grid-lines { position: absolute; inset: 0; opacity: .05; }
      .inner {
        position: relative; z-index: 2;
        padding: 22px 26px; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .top-row { display: flex; justify-content: space-between; align-items: flex-start; }
      .brand { display: flex; align-items: center; gap: 10px; }
      .brand-icon {
        width: 34px; height: 34px; border-radius: 9px;
        background: ${tier.accentColor}22; border: 1px solid ${tier.accentColor}44;
        display: flex; align-items: center; justify-content: center;
      }
      .brand-name { font-size: 12px; font-weight: 700; color: #fff; }
      .brand-sub  { font-size: 7.5px; font-weight: 600; letter-spacing: .15em; color: rgba(255,255,255,.36); margin-top: 2px; }
      .tier-badge {
        padding: 3px 11px; border-radius: 20px;
        background: ${tier.accentColor}22; border: 1px solid ${tier.accentColor}44;
        font-size: 9px; font-weight: 800; color: ${tier.color}; letter-spacing: .07em;
      }
      .mid-row { display: flex; align-items: center; gap: 14px; }
      .disc-lbl  { font-size: 8.5px; color: rgba(255,255,255,.3); font-weight: 600; letter-spacing: .07em; }
      .disc-val  { font-size: 34px; font-weight: 900; color: ${tier.color}; line-height: 1; }
      .valid-block { margin-left: auto; text-align: right; }
      .valid-lbl   { font-size: 8px; color: rgba(255,255,255,.3); font-weight: 600; letter-spacing: .07em; }
      .valid-val   { font-size: 11.5px; font-weight: 700; color: rgba(255,255,255,.72); margin-top: 3px; }
      .valid-expired { color: #ef4444; }
      .bot-row { display: flex; justify-content: space-between; align-items: flex-end; }
      .code   { font-family: monospace; font-size: 15px; letter-spacing: .18em; color: rgba(255,255,255,.78); font-weight: 700; }
      .issued { font-size: 9px; color: rgba(255,255,255,.26); margin-top: 3px; }
      .qr-box {
        width: 50px; height: 50px; background: #fff;
        border-radius: 7px; display: flex; align-items: center; justify-content: center;
        padding: 3px;
      }
      .qr-box img { width: 100%; height: 100%; display: block; }
      .card-back {
        width: 400px; height: 228px; border-radius: 18px;
        position: relative; overflow: hidden;
        background: linear-gradient(135deg, ${tier.bgFrom} 0%, ${tier.bgTo} 100%);
        border: 1px solid ${tier.accentColor}33;
        box-shadow: 0 24px 64px rgba(0,0,0,0.55), 0 4px 20px ${tier.accentColor}28;
      }
      .back-stripe { position: absolute; top: 36px; left: 0; right: 0; height: 44px; background: rgba(0,0,0,0.55); }
      .back-inner {
        position: relative; z-index: 2;
        padding: 22px 26px; height: 100%;
        display: flex; flex-direction: column; justify-content: space-between;
      }
      .back-footer { display: flex; justify-content: space-between; align-items: flex-end; }
      .back-brand { font-size: 9px; font-weight: 700; color: rgba(255,255,255,.25); letter-spacing: .12em; text-transform: uppercase; }
      .back-note  { font-size: 8px; color: rgba(255,255,255,.18); max-width: 220px; text-align: right; line-height: 1.4; }
      .scan-hint {
        display: flex; align-items: center; gap: 6px;
        font-size: 8px; color: rgba(255,255,255,.22); letter-spacing: .06em;
      }
      @media print {
        body { background: #0f172a !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .card, .card-back { box-shadow: none; page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="label">Front Side</div>
    <div class="card">
      <div class="blob1"></div>
      <div class="blob2"></div>
      <svg class="grid-lines" viewBox="0 0 400 228" preserveAspectRatio="none">
        <line x1="0" y1="46" x2="400" y2="46" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="0" y1="92" x2="400" y2="92" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="0" y1="138" x2="400" y2="138" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="0" y1="184" x2="400" y2="184" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="80"  y1="0" x2="80"  y2="228" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="160" y1="0" x2="160" y2="228" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="240" y1="0" x2="240" y2="228" stroke="${tier.color}" stroke-width=".8"/>
        <line x1="320" y1="0" x2="320" y2="228" stroke="${tier.color}" stroke-width=".8"/>
      </svg>
      <div class="inner">
        <div class="top-row">
          <div class="brand">
            <div class="brand-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${tier.color}" stroke-width="1.8">
                <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div>
              <div class="brand-name">VIP Member</div>
              <div class="brand-sub"></div>
            </div>
          </div>
          <div class="tier-badge">${tier.name.toUpperCase()}</div>
        </div>
        <div class="mid-row">
          <div>
            <div class="disc-lbl">DISCOUNT</div>
            <div class="disc-val">${tier.discount}%</div>
          </div>
          <div class="valid-block">
            <div class="valid-lbl">VALID UNTIL</div>
            <div class="valid-val ${expired ? "valid-expired" : ""}">
              ${expired ? "EXPIRED" : (card.expiresAt ?? "No Limit")}
            </div>
          </div>
        </div>
        <div class="bot-row">
          <div>
            <div class="code">${card.code}</div>
            <div class="issued">Issued: ${card.issuedAt}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:3px">
            <div class="qr-box">
              <img src="${qrDataUrl}" alt="QR ${card.code}" />
            </div>
            <div class="scan-hint">SCAN TO USE</div>
          </div>
        </div>
      </div>
    </div>

    <div class="label" style="margin-top:12px">Back Side</div>
    <div class="card-back">
      <div class="blob1"></div>
      <div class="blob2" style="opacity:.06"></div>
      <div class="back-stripe"></div>
      <div class="back-inner">
        <div></div>
        <div class="back-footer">
          <div class="back-brand">VIP Member</div>
          <div class="back-note">This card is non-transferable.<br/>Present this card to receive your discount.</div>
        </div>
      </div>
    </div>
    <script>window.onload = () => { window.print() }</script>
  </body>
  </html>`

  const win = window.open("", "_blank", "width=560,height=820")
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}