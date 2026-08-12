"use client"

import { toast }                    from "sonner"
import { Check, AlertTriangle }     from "lucide-react"

if (typeof document !== "undefined" && !document.getElementById("__toast_kf")) {
  const s = document.createElement("style")
  s.id = "__toast_kf"
  s.textContent = `
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-14px) scale(0.96); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
  `
  document.head.appendChild(s)
}

const base: React.CSSProperties = {
  fontFamily: "'Sora', sans-serif",
  display:    "flex",
  alignItems: "flex-start",
  gap:        12,
  padding:    "13px 16px",
  borderRadius: 12,
  width:      420,
  animation:  "toastIn 0.36s cubic-bezier(0.34,1.45,0.64,1) forwards",
}

const iconStyle: React.CSSProperties = {
  width:        30,
  height:       30,
  borderRadius: "50%",
  flexShrink:   0,
  display:      "flex",
  alignItems:   "center",
  justifyContent: "center",
  marginTop:    1,
}

function ToastIcon({ color, children }: { color: string; children: React.ReactNode }) {
  return <div style={{ ...iconStyle, background: color }}>{children}</div>
}

function CloseBtn({ id, color }: { id: string | number; color: string }) {
  return (
    <button
      onClick={() => toast.dismiss(id)}
      style={{ background: "none", border: "none", cursor: "pointer", color, opacity: 0.4, fontSize: 18, padding: 0 }}
    >×</button>
  )
}

function ToastBody({ title, desc, titleColor, descColor }: {
  title: string; desc?: string; titleColor: string; descColor: string
}) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: titleColor, margin: 0 }}>{title}</p>
      {desc && <p style={{ fontSize: 12, color: descColor, margin: "4px 0 0" }}>{desc}</p>}
    </div>
  )
}

export function toastSuccess(msg: string, desc?: string) {
  toast.custom(id => (
    <div
      style={{ ...base, border: "1px solid transparent" }}
      className="bg-[#03624C] dark:bg-[#1857D8] dark:border-[#1857D8]" >
      <ToastIcon color="rgba(255,255,255,0.16)">
        <Check className="w-4 h-4 text-white" />
      </ToastIcon>
      <ToastBody title={msg} desc={desc} titleColor="#ffffffff" descColor="rgba(255,255,255,0.78)" />
      <CloseBtn id={id} color="rgba(255,255,255,0.65)" />
    </div>
  ), { duration: 3000 })
}

export function toastError(msg: string, desc?: string) {
  toast.custom(id => (
    <div style={{ ...base, background: "#ffebee", border: "1px solid #ffcdd2" }}>
      <ToastIcon color="#ffcdd2">
        <AlertTriangle className="w-4 h-4 text-[#c62828]" />
      </ToastIcon>
      <ToastBody title={msg} desc={desc} titleColor="#c62828" descColor="#ef5350" />
      <CloseBtn id={id} color="#c62828" />
    </div>
  ), { duration: 4000 })
}

export function toastWarn(msg: string, desc?: string) {
  toast.custom(id => (
    <div style={{ ...base, background: "#fffde7", border: "1px solid #fff176" }}>
      <ToastIcon color="#fff176">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 4V8M7 10.5V10.6" stroke="#f9a825" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </ToastIcon>
      <ToastBody title={msg} desc={desc} titleColor="#f57f17" descColor="#f9a825" />
      <CloseBtn id={id} color="#f57f17" />
    </div>
  ), { duration: 3000 })
}

export function toastInfo(msg: string, desc?: string) {
  toast.custom(id => (
    <div style={{ ...base, background: "#e8eaf6", border: "1px solid #c5cae9" }}>
      <ToastIcon color="#c5cae9">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="#3949ab" strokeWidth="1.5" />
          <path d="M7 6V10M7 4V4.1" stroke="#3949ab" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </ToastIcon>
      <ToastBody title={msg} desc={desc} titleColor="#283593" descColor="#3949ab" />
      <CloseBtn id={id} color="#283593" />
    </div>
  ), { duration: 3000 })
}