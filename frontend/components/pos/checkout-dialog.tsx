"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { 
  Check, Loader2, Printer, AlertTriangle, Banknote, CreditCard, Smartphone, 
  Plus, Trash2, X, Crown, Tag, Percent 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/settings-context"
import { ordersApi } from "@/lib/api"
import {  toastError, toastWarn } from "@/lib/toast"
import { vipCardApi } from "@/lib/api/vipcard"
import type { VipCard, VipTier } from "@/types/vipcard"
import { TierIcon } from "@/components/vip-card/tier-icon"
import { printBill } from "@/components/pos/print-bill"

const SORA: React.CSSProperties = { fontFamily: "var(--font-kantumruy), sans-serif" }

interface CartItem {
  id:              string | number
  name:            string
  price:           number
  original_price?: number
  quantity:        number
  discount?: {
    name:       string
    value:      number
    value_type: "percentage" | "flat"
  }
}

interface CheckoutDialogProps {
  open:         boolean
  onOpenChange: (open: boolean) => void
  total:        number
  items:        CartItem[]
  onComplete:   (paymentMethod: string) => void
  orderType:    string
  orderId?:     number | null
  language:     string
}

type PaymentMethodId = "cash" | "card" | "mobile"

interface SplitEntry {
  method: PaymentMethodId
  amount: string
}

const paymentMethods: { id: PaymentMethodId; label: string; icon: React.ElementType }[] = [
  { id: "cash",   label: "Cash",    icon: Banknote   },
  { id: "card",   label: "Card",    icon: CreditCard },
  { id: "mobile", label: "QR Scan", icon: Smartphone },
]

const METHOD_COLORS: Record<PaymentMethodId, string> = {
  cash:   "#03624C",
  card:   "#1857D8",
  mobile: "#7C3AED",
}

export function CheckoutDialog({
  open, onOpenChange, total, items, onComplete, orderType, orderId, language,
}: CheckoutDialogProps) {
  const isKh                                = language === "khmer"
  const { systemLogo, systemName }          = useSettings()

  const [payMode, setPayMode]               = useState<"full" | "split">("full")
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("cash")
  const [inputValue, setInputValue]         = useState("")

  const [splitEntries, setSplitEntries]     = useState<SplitEntry[]>([
    { method: "cash", amount: "" },
    { method: "card", amount: "" },
  ])
  const [activeSplitIdx, setActiveSplitIdx] = useState(0)

  const [discount, setDiscount]             = useState("0")
  const [discountInput, setDiscountInput]   = useState("")
  const [editingDiscount, setEditingDiscount] = useState(false)
  const [discountMode, setDiscountMode]     = useState<"%" | "$">("%")

  const [taxEnabled, setTaxEnabled]         = useState(false)
  const [taxRate, setTaxRate]               = useState("10")
  const [editingTax, setEditingTax]         = useState(false)
  const [taxInput, setTaxInput]             = useState("")

  const [vipCode,    setVipCode]    = useState("")
  const [vipCard,    setVipCard]    = useState<VipCard | null>(null)
  const [vipTier,    setVipTier]    = useState<VipTier | null>(null)
  const [vipLoading, setVipLoading] = useState(false)
  const [vipError,   setVipError]   = useState("")
  const vipInputRef                 = useRef<HTMLInputElement>(null)

  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete]     = useState(false)
  const completedRef                    = useRef(false)

  const discountRaw    = Math.max(0, Number(discount) || 0)
  const discountAmount = discountMode === "%"
    ? (total * Math.min(100, discountRaw)) / 100
    : Math.min(total, discountRaw)
  const discountPct    = discountMode === "%" ? Math.min(100, discountRaw) : (total > 0 ? (discountAmount / total) * 100 : 0)
  const afterDiscount  = Math.max(0, total - discountAmount)
  const taxPct         = taxEnabled ? Math.min(100, Math.max(0, Number(taxRate) || 0)) : 0
  const taxAmount      = (afterDiscount * taxPct) / 100

  const preVipTotal       = afterDiscount + taxAmount
  const vipDiscountPct    = vipCard && vipTier ? vipTier.discount : 0
  const vipDiscountAmount = (preVipTotal * vipDiscountPct) / 100
  const finalTotal        = Math.max(0, preVipTotal - vipDiscountAmount)

  const cashReceived = parseFloat(inputValue) || 0
  const change       = selectedMethod === "cash" && cashReceived > 0 ? cashReceived - finalTotal : 0
  const amountPaid   = selectedMethod === "cash" && cashReceived > 0 ? Math.min(cashReceived, finalTotal) : 0
  const dueAmount    = selectedMethod === "cash" ? Math.max(0, finalTotal - amountPaid) : 0

  const splitTotal = splitEntries.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const splitDue   = Math.max(0, finalTotal - splitTotal)
  const splitOver  = Math.max(0, splitTotal - finalTotal)

  const quickAmounts = [
    Math.ceil(finalTotal / 10) * 10,
    Math.ceil(finalTotal / 20) * 20,
    Math.ceil(finalTotal / 50) * 50,
    Math.ceil(finalTotal / 100) * 100,
  ].filter((v, i, arr) => arr.indexOf(v) === i && v > 0).slice(0, 4)

  const itemDiscountTotal = items.reduce((sum, item) => {
    if (item.original_price && item.original_price > item.price)
      return sum + (item.original_price - item.price) * item.quantity
    return sum
  }, 0)

  useEffect(() => {
    if (open) {
      completedRef.current = false
      setIsComplete(false)
      setInputValue("")
      setDiscount("0")
      setDiscountInput("")
      setEditingDiscount(false)
      setDiscountMode("%")
      setSelectedMethod("cash")
      setIsProcessing(false)
      setPayMode("full")
      setSplitEntries([{ method: "cash", amount: "" }, { method: "card", amount: "" }])
      setActiveSplitIdx(0)
      setTaxEnabled(false)
      setTaxRate("10")
      setEditingTax(false)
      setTaxInput("")
      setVipCode("")
      setVipCard(null)
      setVipTier(null)
      setVipError("")
      setVipLoading(false)
    }
  }, [open])

  useEffect(() => {
    if (!isComplete || !open) return
    const timer = setTimeout(() => handleClose(), 2500)
    return () => clearTimeout(timer)
  }, [isComplete, open])

  const handleVipLookup = useCallback(async (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) {
      setVipCard(null); setVipTier(null); setVipError("")
      return
    }
    setVipLoading(true)
    setVipError("")
    try {
      const res = await vipCardApi.lookupCard(trimmed)
      const { card, tier, isActive, expired } = res.data
      if (!isActive) {
        setVipError(isKh ? "កាតនេះត្រូវបានផ្អាក" : "Card is paused")
        setVipCard(null); setVipTier(null)
      } else if (expired) {
        setVipError(isKh ? "កាតផុតកំណត់ហើយ" : "Card has expired")
        setVipCard(null); setVipTier(null)
      } else {
        setVipCard(card)
        setVipTier(tier)
        setVipError("")
      }
    } catch {
      setVipError(isKh ? "រកមិនឃើញកាត" : "Card not found")
      setVipCard(null); setVipTier(null)
    } finally {
      setVipLoading(false)
    }
  }, [isKh])

  const clearVip = () => {
    setVipCode(""); setVipCard(null); setVipTier(null); setVipError("")
  }

  const handleNumpad = (key: string) => {
    const setter = payMode === "split"
      ? (fn: (v: string) => string) =>
          setSplitEntries(prev => prev.map((e, i) => i === activeSplitIdx ? { ...e, amount: fn(e.amount) } : e))
      : (fn: (v: string) => string) => setInputValue(prev => fn(prev))

    if (key === "x") {
      setter(prev => prev.slice(0, -1))
    } else if (key === ".") {
      setter(prev => prev.includes(".") ? prev : prev + ".")
    } else {
      setter(prev => {
        const next = prev + key
        if (next.includes(".")) {
          const [, dec] = next.split(".")
          if (dec && dec.length > 2) return prev
        }
        return next
      })
    }
  }

  const handlePayment = async () => {
    if (completedRef.current || isProcessing) return
    completedRef.current = true
    setIsProcessing(true)

    const methodLabel = payMode === "split"
    ? splitEntries
        .filter(e => (parseFloat(e.amount) || 0) > 0)
        .map(e => e.method)
        .join("+")
    : selectedMethod

    try {
      if (orderId) {
        await ordersApi.complete(
          orderId,
          methodLabel,
          vipCard?.id ?? null,
          {
            discount_amount:     discountAmount,
            tax_amount:          taxAmount,
            vip_discount_amount: vipDiscountAmount,
            final_total:         finalTotal,
          }
        )
      }
      setIsComplete(true)
    } catch (error: any) {
      const msg = error?.message ?? ""
      if (msg.includes("No query results") || msg.includes("404") || msg.includes("Not Found")) {
        setIsComplete(true)
        toastWarn(
          isKh ? "ការទូទាត់ត្រូវបានធ្វើរួចហើយ" : "Already completed",
          isKh ? "Order នេះត្រូវបាន complete ហើយ" : "This order was already paid",
        )
      } else {
        completedRef.current = false
        toastError(isKh ? "មិនអាចបញ្ចប់ការទូទាត់បាន" : "Payment failed", msg)
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleClose = () => {
    const methodLabel = payMode === "split"
      ? splitEntries.filter(e => parseFloat(e.amount) > 0).map(e => e.method).join("+")
      : selectedMethod
    if (isComplete) onComplete(methodLabel)
    onOpenChange(false)
  }

  const handlePrint = () => {
    printBill({
      items,
      orderType,
      orderId,
      subtotal:            total,
      discountAmount,
      discountMode,
      discountPct,
      taxEnabled,
      taxPct,
      taxAmount,
      finalTotal,
      itemDiscountTotal,
      vipCode:             vipCode || undefined,
      vipCardTierName:     vipTier?.name,
      vipTierDiscount:     vipTier?.discount,
      vipDiscountAmount,
      payMode,
      selectedMethod,
      cashReceived,
      change,
      splitEntries,
      systemLogo,
      systemName,
    })
  }

  const canPay = !isProcessing && (() => {
    if (payMode === "split") return splitDue <= 0
    if (selectedMethod !== "cash") return true
    if (inputValue === "") return false
    return cashReceived >= finalTotal
  })()

  const addSplitEntry = () => {
    const usedMethods = splitEntries.map(e => e.method)
    const next = (paymentMethods.find(m => !usedMethods.includes(m.id)) ?? paymentMethods[0]).id
    setSplitEntries(prev => [...prev, { method: next, amount: "" }])
    setActiveSplitIdx(splitEntries.length)
  }

  const removeSplitEntry = (idx: number) => {
    if (splitEntries.length <= 2) return
    setSplitEntries(prev => prev.filter((_, i) => i !== idx))
    setActiveSplitIdx(prev => Math.min(prev, splitEntries.length - 2))
  }

  const updateSplitMethod = (idx: number, method: PaymentMethodId) => {
    setSplitEntries(prev => prev.map((e, i) => i === idx ? { ...e, method } : e))
  }

  const fillRemainingSplit = (idx: number) => {
    const others = splitEntries.reduce((s, e, i) => i === idx ? s : s + (parseFloat(e.amount) || 0), 0)
    const rem    = Math.max(0, finalTotal - others)
    setSplitEntries(prev => prev.map((e, i) => i === idx ? { ...e, amount: rem.toFixed(2) } : e))
  }

  const SummaryRows = () => (
    <>
      <div className="flex justify-between text-[13px] text-gray-500">
        <span>{isKh ? "តម្លៃដើម" : "Subtotal"}</span>
        <span className="font-medium text-gray-700">${total.toFixed(2)}</span>
      </div>
      {itemDiscountTotal > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-500">{isKh ? "បញ្ចុះតម្លៃទំនិញ" : "Item discounts"}</span>
          <span className="font-medium text-emerald-600">−${itemDiscountTotal.toFixed(2)}</span>
        </div>
      )}
      {discountAmount > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-500">
            {isKh ? "បញ្ចុះបន្ថែម" : "Extra discount"}{" "}
            <span className="text-gray-400">
              {discountMode === "%" ? `(${discountPct % 1 === 0 ? discountPct.toFixed(0) : discountPct.toFixed(1)}%)` : `($${discountAmount.toFixed(2)})`}
            </span>
          </span>
          <span className="font-medium text-amber-600">−${discountAmount.toFixed(2)}</span>
        </div>
      )}
      {taxEnabled && taxPct > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-500">Tax <span className="text-gray-400">({taxPct}%)</span></span>
          <span className="font-medium text-blue-600">+${taxAmount.toFixed(2)}</span>
        </div>
      )}
      {vipCard && vipTier && vipDiscountAmount > 0 && (
        <div className="flex justify-between text-[13px]">
          <span className="text-gray-500 flex items-center gap-1">
            <Crown className="w-3 h-3 text-purple-500" />
            VIP {vipTier.name} <span className="text-gray-400">({vipTier.discount}%)</span>
          </span>
          <span className="font-medium text-purple-600">−${vipDiscountAmount.toFixed(2)}</span>
        </div>
      )}
      <div className="border-t border-dashed border-gray-300 my-2" />
      <div className="flex justify-between items-baseline">
        <span className="text-[13px] font-semibold text-gray-800">{isKh ? "សរុបត្រូវបង់" : "Total due"}</span>
        <span className="font-black text-[22px] text-gray-900 tracking-tight">${finalTotal.toFixed(2)}</span>
      </div>
      {(itemDiscountTotal + discountAmount + vipDiscountAmount) > 0 && (
        <div className="flex items-center justify-between text-[11px] text-emerald-600 font-semibold bg-emerald-50 rounded-lg px-2.5 py-1.5 mt-1">
          <span>{isKh ? "សន្សំបាន" : "You saved"}</span>
          <span>${(itemDiscountTotal + discountAmount + vipDiscountAmount).toFixed(2)}</span>
        </div>
      )}
    </>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl p-0 border border-gray-200 shadow-xl rounded-2xl bg-white flex flex-col [&>button]:hidden overflow-hidden"
        style={SORA} >
        <DialogTitle className="sr-only">Collect Payment</DialogTitle>
        <DialogDescription className="sr-only">Checkout form</DialogDescription>
        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center py-14 px-6 gap-5" >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.05 }}
                className="w-[72px] h-[72px] rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center" >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 14, delay: 0.2 }}
                  className="w-12 h-12 rounded-full bg-[#03624C] flex items-center justify-center" >
                  <motion.svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6"
                    fill="none"
                    initial="hidden"
                    animate="visible" >
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke="white"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      variants={{
                        hidden: { pathLength: 0, opacity: 0 },
                        visible: {
                          pathLength: 1, opacity: 1,
                          transition: { delay: 0.35, duration: 0.35, ease: "easeOut" },
                        },
                      }}
                    />
                  </motion.svg>
                </motion.div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-center space-y-1" >
                <p className="text-[19px] font-bold text-gray-900">{isKh ? "ទូទាត់បានជោគជ័យ!" : "Payment successful"}</p>
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 220, damping: 16 }}
                  className="text-[26px] font-black text-[#03624C] tracking-tight" >
                  ${finalTotal.toFixed(2)}
                </motion.p>
              </motion.div>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleClose}
                className="h-11 px-10 rounded-lg text-[13px] font-semibold bg-[#03624C] hover:bg-[#024a38] text-white shadow-sm transition-all" >
                {isKh ? "រួចរាល់" : "Done"}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col max-h-[88vh]" >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#03624C]/10 flex items-center justify-center">
                    <CreditCard className="w-[18px] h-[18px] text-[#03624C]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">{isKh ? "ទូទាត់ប្រាក់" : "Collect Payment"}</p>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                      {orderType}{orderId ? ` · #${orderId}` : ` · ${isKh ? "ការកម្ម៉ង់ថ្មី" : "New order"}`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{isKh ? "សរុប" : "Total"}</p>
                  <motion.p
                    key={finalTotal.toFixed(2)}
                    initial={{ opacity: 0.4, y: -2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-[22px] font-black text-[#03624C] leading-tight tracking-tight" >
                    ${finalTotal.toFixed(2)}
                  </motion.p>
                </div>
              </div>
              <div className="px-6 py-4 space-y-4 overflow-y-auto">
                <div className="rounded-lg border border-gray-200 divide-x divide-gray-200 grid grid-cols-2 overflow-hidden">
                  <div className="px-3.5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {isKh ? "បញ្ចុះតម្លៃ" : "Discount"}
                      </span>
                      <div className="flex items-center gap-1">
                        <div className="flex rounded-md overflow-hidden border border-gray-200">
                          {(["%", "$"] as const).map(mode => (
                            <button key={mode}
                              onClick={() => {
                                if (mode !== discountMode) {
                                  const cur = Number(discount) || 0
                                  if (mode === "$") {
                                    setDiscount(((total * Math.min(100, cur)) / 100).toFixed(2))
                                  } else {
                                    setDiscount((total > 0 ? Math.min(100, (Math.min(total, cur) / total) * 100) : 0).toFixed(2))
                                  }
                                  setDiscountMode(mode)
                                  setEditingDiscount(false)
                                }
                              }}
                              className={cn(
                                "px-1.5 py-0.5 text-[10px] font-bold transition-all",
                                discountMode === mode ? "bg-amber-500 text-white" : "text-gray-400 hover:bg-gray-50"
                              )} >
                              {mode}
                            </button>
                          ))}
                        </div>
                        {discountAmount > 0 && (
                          <button
                            onClick={() => { setDiscount("0"); setDiscountInput(""); setEditingDiscount(false) }}
                            className="w-4 h-4 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all" >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                    {editingDiscount ? (
                      <div className="flex items-center gap-1">
                        {discountMode === "$" && <span className="text-[15px] font-bold text-amber-500">$</span>}
                        <input
                          autoFocus type="number" min={0}
                          max={discountMode === "%" ? 100 : total} step="0.01"
                          value={discountInput}
                          onChange={e => setDiscountInput(e.target.value)}
                          onBlur={() => { setDiscount((Number(discountInput) || 0).toString()); setEditingDiscount(false) }}
                          onKeyDown={e => {
                            if (e.key === "Enter") { setDiscount((Number(discountInput) || 0).toString()); setEditingDiscount(false) }
                            if (e.key === "Escape") setEditingDiscount(false)
                          }}
                          className="w-full text-[15px] font-bold bg-transparent border-none outline-none text-amber-700"
                          placeholder="0"
                        />
                        {discountMode === "%" && <span className="text-[15px] font-bold text-amber-400">%</span>}
                      </div>
                    ) : (
                      <button
                        onClick={() => { setDiscountInput(discountRaw > 0 ? discountRaw.toString() : ""); setEditingDiscount(true) }}
                        className="text-left w-full" >
                        {discountAmount > 0 ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[17px] font-black text-amber-600">
                              {discountMode === "%" ? `${discountPct % 1 === 0 ? discountPct.toFixed(0) : discountPct.toFixed(1)}%` : `$${discountAmount.toFixed(2)}`}
                            </span>
                            <span className="text-[11px] text-gray-400">
                              {discountMode === "%" ? `−$${discountAmount.toFixed(2)}` : `(${discountPct.toFixed(1)}%)`}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[12px] text-gray-300">{isKh ? "ចុចដើម្បីកំណត់" : "Tap to set"}</span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Tax */}
                  <div className="px-3.5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 flex items-center gap-1">
                        <Percent className="w-3 h-3" />
                        {isKh ? "ពន្ធ" : "Tax"}
                      </span>
                      <button
                        onClick={() => setTaxEnabled(v => !v)}
                        className={cn("w-7 h-4 rounded-full transition-all relative shrink-0", taxEnabled ? "bg-blue-500" : "bg-gray-200")} >
                        <motion.span
                          className="absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm"
                          animate={{ left: taxEnabled ? 14 : 2 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      </button>
                    </div>
                    {taxEnabled ? (
                      editingTax ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus type="number" min={0} max={100}
                            value={taxInput}
                            onChange={e => setTaxInput(e.target.value)}
                            onBlur={() => { setTaxRate(Math.min(100, Math.max(0, Number(taxInput) || 0)).toString()); setEditingTax(false) }}
                            onKeyDown={e => {
                              if (e.key === "Enter") { setTaxRate(Math.min(100, Math.max(0, Number(taxInput) || 0)).toString()); setEditingTax(false) }
                              if (e.key === "Escape") setEditingTax(false)
                            }}
                            className="w-full text-[15px] font-bold bg-transparent border-none outline-none text-blue-700"
                            placeholder="10"
                          />
                          <span className="text-[15px] font-bold text-blue-400">%</span>
                        </div>
                      ) : (
                        <button onClick={() => { setTaxInput(taxRate); setEditingTax(true) }} className="text-left w-full">
                          <span className="text-[17px] font-black text-blue-600">{taxPct}%</span>
                          <span className="text-[11px] text-gray-400 ml-1.5">+${taxAmount.toFixed(2)}</span>
                        </button>
                      )
                    ) : (
                      <span className="text-[12px] text-gray-300">{isKh ? "បិទ" : "Off"}</span>
                    )}
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 px-3.5 py-1 max-h-[140px] overflow-y-auto">
                  {items.map((item, i) => {
                    const origPrice = item.original_price ?? item.price
                    const hasDisc   = item.original_price && item.original_price > item.price
                    const discAmt   = hasDisc ? (item.original_price! - item.price) * item.quantity : 0
                    const discLabel = item.discount
                      ? item.discount.value_type === "percentage"
                        ? `${item.discount.name} −${item.discount.value}%`
                        : `${item.discount.name} −$${item.discount.value}`
                      : hasDisc ? "Discount" : ""
                    return (
                      <div key={i} className={cn("py-2", i !== items.length - 1 && "border-b border-gray-100")}>
                        <div className="flex justify-between items-start gap-3">
                          <span className="text-[12.5px] font-medium text-gray-700 truncate">
                            {item.name} <span className="text-gray-400">×{item.quantity}</span>
                          </span>
                          <div className="text-right shrink-0">
                            {hasDisc && (
                              <span className="block text-[10px] line-through text-gray-300">
                                ${(origPrice * item.quantity).toFixed(2)}
                              </span>
                            )}
                            <span className={cn("block text-[12.5px] font-semibold", hasDisc ? "text-emerald-600" : "text-gray-800")}>
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {hasDisc && (
                          <p className="text-[10px] text-emerald-500 mt-0.5">
                            {discLabel} · −${discAmt.toFixed(2)}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
                <motion.div
                  animate={vipCard ? { scale: [1, 1.015, 1] } : {}}
                  transition={{ duration: 0.35 }}
                  className={cn(
                    "rounded-lg border px-3.5 py-3 transition-colors",
                    vipCard ? "border-purple-200 bg-purple-50/40" : "border-gray-200"
                  )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn(
                      "text-[10px] font-semibold uppercase tracking-wide flex items-center gap-1",
                      vipCard ? "text-purple-600" : "text-gray-400"
                    )}>
                      <Crown className="w-3 h-3" />
                      VIP Card
                    </span>
                    {vipCard && (
                      <button
                        onClick={clearVip}
                        className="w-4 h-4 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all" >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      ref={vipInputRef}
                      value={vipCode}
                      onChange={e => setVipCode(e.target.value.toUpperCase())}
                      onKeyDown={e => { if (e.key === "Enter") handleVipLookup(vipCode) }}
                      onBlur={() => { if (vipCode && !vipCard) handleVipLookup(vipCode) }}
                      placeholder={isKh ? "000-000-XXX ឬស្គែន..." : "000-000-XXX or scan..."}
                      className="flex-1 h-9 px-3 rounded-lg border border-gray-200 bg-white text-[12px] font-mono font-semibold text-gray-800 placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all uppercase tracking-widest"
                    />
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => handleVipLookup(vipCode)}
                      disabled={vipLoading || !vipCode}
                      className="h-9 px-3.5 rounded-lg bg-purple-500 hover:bg-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11.5px] font-semibold transition-all flex items-center gap-1.5 shrink-0" >
                      {vipLoading
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />
                      }
                      {isKh ? "ត្រួត" : "Apply"}
                    </motion.button>
                  </div>
                  <AnimatePresence>
                    {vipError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        className="text-[11px] text-rose-500 font-medium flex items-center gap-1.5 overflow-hidden" >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        {vipError}
                      </motion.p>
                    )}
                    {vipCard && vipTier && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 24 }}
                        className="mt-2.5 flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white border border-purple-100 overflow-hidden" >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${vipTier.accentColor}22`, border: `1px solid ${vipTier.accentColor}40` }} >
                          <TierIcon icon={vipTier.icon} size={13} color={vipTier.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-gray-800 truncate">{vipTier.name} · {vipCode}</p>
                          <p className="text-[10px] text-gray-400">{isKh ? "ចូលសរុប" : "Visits"}: {vipCard.totalVisits}</p>
                        </div>
                        <span className="text-[15px] font-black text-purple-600 shrink-0">−{vipTier.discount}%</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
                <div className="flex gap-1.5 bg-gray-100 p-1 rounded-lg relative">
                  <button onClick={() => setPayMode("full")}
                    className={cn("relative z-10 flex-1 py-2 rounded-[10px] text-[12.5px] font-semibold transition-colors",
                      payMode === "full" ? "text-[#03624C]" : "text-gray-400 hover:text-gray-600")}>
                    {isKh ? "ទូទាត់ទាំងអស់" : "Full Payment"}
                  </button>
                  <button onClick={() => setPayMode("split")}
                    className={cn("relative z-10 flex-1 py-2 rounded-[10px] text-[12.5px] font-semibold transition-colors",
                      payMode === "split" ? "text-[#1857D8]" : "text-gray-400 hover:text-gray-600")}>
                    {isKh ? "លុយច្រើនប្រភេទ" : "Split Payment"}
                  </button>
                  <motion.div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-[10px] shadow-sm"
                    animate={{ left: payMode === "full" ? 4 : "calc(50% + 0px)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                </div>
                <AnimatePresence mode="wait">
                  {payMode === "full" && (
                    <motion.div
                      key="full"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4" >
                      <div className="grid grid-cols-3 gap-2">
                        {paymentMethods.map(m => {
                          const Icon = m.icon
                          const sel  = selectedMethod === m.id
                          return (
                            <motion.button key={m.id} whileTap={{ scale: 0.95 }} onClick={() => setSelectedMethod(m.id)}
                              className={cn(
                                "flex flex-col items-center gap-1.5 py-3 rounded-lg border transition-all",
                                sel ? "border-current shadow-sm" : "border-gray-200 text-gray-400 hover:border-gray-300"
                              )}
                              style={sel ? { color: METHOD_COLORS[m.id], background: `${METHOD_COLORS[m.id]}0d` } : {}} >
                              <Icon className="w-5 h-5" />
                              <span className="text-[11.5px] font-semibold">{m.label}</span>
                            </motion.button>
                          )
                        })}
                      </div>
                      {selectedMethod === "cash" && (
                        <>
                          <div className="rounded-lg bg-gray-50 px-4 py-3.5 text-center">
                            <p className="text-[11px] text-gray-400 mb-1">{isKh ? "ប្រាក់ទទួល" : "Cash Received"}</p>
                            <p className="text-[30px] font-black text-gray-900 tracking-tight min-h-[40px]">
                              {inputValue ? `$${inputValue}` : <span className="text-gray-300">$0</span>}
                            </p>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {quickAmounts.map(amt => (
                              <motion.button key={amt} whileTap={{ scale: 0.93 }} onClick={() => setInputValue(amt.toString())}
                                className="py-2 rounded-lg text-[12px] font-semibold border border-gray-200 text-gray-600 hover:border-[#03624C]/40 hover:text-[#03624C] hover:bg-[#03624C]/5 transition-all">
                                ${amt}
                              </motion.button>
                            ))}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {["1","2","3","4","5","6","7","8","9",".","0","x"].map(k => (
                              <motion.button key={k} whileTap={{ scale: 0.9 }} onClick={() => handleNumpad(k)}
                                className={cn("py-3 rounded-lg text-[15px] font-semibold transition-colors",
                                  k === "x" ? "text-rose-500 hover:bg-rose-50" : "text-gray-700 bg-gray-50 hover:bg-gray-100")}>
                                {k === "x" ? "⌫" : k}
                              </motion.button>
                            ))}
                          </div>
                        </>
                      )}
                      <div className="rounded-lg bg-gray-50 px-4 py-3.5 space-y-2">
                        <SummaryRows />
                        {selectedMethod === "cash" && (
                          <>
                            <div className="border-t border-gray-200 pt-2 space-y-1.5">
                              <div className="flex justify-between text-[13px]">
                                <span className="text-gray-500">{isKh ? "ប្រាក់ទទួលបាន" : "Amount Paid"}</span>
                                <span className="font-medium text-gray-700">${amountPaid.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-baseline">
                                <span className={cn("text-[13px] font-semibold", dueAmount > 0 ? "text-rose-500" : "text-[#03624C]")}>
                                  {isKh ? "ប្រាក់ខ្វះ" : "Due"}
                                </span>
                                <span className={cn("font-black text-[16px]", dueAmount > 0 ? "text-rose-500" : "text-[#03624C]")}>
                                  ${dueAmount.toFixed(2)}
                                </span>
                              </div>
                              {change > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="flex justify-between items-baseline" >
                                  <span className="text-[13px] font-semibold text-[#03624C]">{isKh ? "ប្រាក់អាប់" : "Change"}</span>
                                  <span className="font-black text-[18px] text-[#03624C]">${change.toFixed(2)}</span>
                                </motion.div>
                              )}
                            </div>
                            {inputValue && cashReceived < finalTotal && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-1.5 text-rose-500 pt-1" >
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                <p className="text-[11.5px] font-medium">{isKh ? "ប្រាក់មិនគ្រប់" : "Insufficient amount"}</p>
                              </motion.div>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                  {payMode === "split" && (
                    <motion.div
                      key="split"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.18 }}
                      className="space-y-4" >
                      <div className="space-y-2">
                        <AnimatePresence initial={false}>
                          {splitEntries.map((entry, idx) => {
                            const isActive = activeSplitIdx === idx
                            const color    = METHOD_COLORS[entry.method]
                            return (
                              <motion.div key={idx}
                                layout
                                initial={{ opacity: 0, height: 0, scale: 0.96 }}
                                animate={{ opacity: 1, height: "auto", scale: 1 }}
                                exit={{ opacity: 0, height: 0, scale: 0.96 }}
                                transition={{ type: "spring", stiffness: 300, damping: 26 }}
                                onClick={() => setActiveSplitIdx(idx)}
                                className={cn("rounded-lg p-3 cursor-pointer transition-colors border overflow-hidden",
                                  isActive ? "shadow-sm" : "border-gray-200 hover:border-gray-300")}
                                style={isActive ? { borderColor: color, background: `${color}08` } : {}}>
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1.5">
                                    {paymentMethods.map(m => {
                                      const Icon = m.icon
                                      const sel  = entry.method === m.id
                                      return (
                                        <motion.button key={m.id} whileTap={{ scale: 0.9 }}
                                          onClick={e => { e.stopPropagation(); updateSplitMethod(idx, m.id) }}
                                          className={cn("w-8 h-8 rounded-lg flex items-center justify-center border transition-all",
                                            sel ? "text-white border-transparent" : "border-gray-200 text-gray-300 bg-white hover:bg-gray-50")}
                                          style={sel ? { background: METHOD_COLORS[m.id] } : {}}>
                                          <Icon className="w-4 h-4" />
                                        </motion.button>
                                      )
                                    })}
                                  </div>
                                  <div className="flex-1 text-right">
                                    <p className="text-[18px] font-black text-gray-900">
                                      {entry.amount ? `$${entry.amount}` : <span className="text-gray-300 text-[14px]">$0.00</span>}
                                    </p>
                                  </div>
                                  <motion.button whileTap={{ scale: 0.93 }}
                                    onClick={e => { e.stopPropagation(); fillRemainingSplit(idx) }}
                                    className="text-[10.5px] font-semibold px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 whitespace-nowrap transition-all">
                                    {isKh ? "ទូទាត់សល់" : "Fill"}
                                  </motion.button>
                                  {splitEntries.length > 2 && (
                                    <motion.button whileTap={{ scale: 0.9 }}
                                      onClick={e => { e.stopPropagation(); removeSplitEntry(idx) }}
                                      className="w-7 h-7 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                  )}
                                </div>
                                <p className="text-[10.5px] font-semibold mt-1.5" style={{ color }}>
                                  {paymentMethods.find(m => m.id === entry.method)?.label ?? entry.method}
                                  {isActive && <span className="ml-1.5 text-gray-400 font-normal">← {isKh ? "កំពុងបញ្ចូល" : "editing"}</span>}
                                </p>
                              </motion.div>
                            )
                          })}
                        </AnimatePresence>
                        {splitEntries.length < 3 && (
                          <motion.button layout whileTap={{ scale: 0.97 }} onClick={addSplitEntry}
                            className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 text-[12px] font-semibold text-gray-400 hover:border-gray-400 hover:text-gray-500 flex items-center justify-center gap-1.5 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                            {isKh ? "បន្ថែមវិធីបង់ប្រាក់" : "Add payment method"}
                          </motion.button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {["1","2","3","4","5","6","7","8","9",".","0","x"].map(k => (
                          <motion.button key={k} whileTap={{ scale: 0.9 }} onClick={() => handleNumpad(k)}
                            className={cn("py-3 rounded-lg text-[15px] font-semibold transition-colors",
                              k === "x" ? "text-rose-500 hover:bg-rose-50" : "text-gray-700 bg-gray-50 hover:bg-gray-100")}>
                            {k === "x" ? "⌫" : k}
                          </motion.button>
                        ))}
                      </div>
                      <div className="rounded-lg bg-gray-50 px-4 py-3.5 space-y-2">
                        <SummaryRows />
                        <div className="border-t border-gray-200 pt-2 space-y-1.5">
                          <div className="flex justify-between text-[13px]">
                            <span className="text-gray-500">{isKh ? "បានទូទាត់" : "Paid so far"}</span>
                            <span className="font-medium text-gray-700">${splitTotal.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-baseline">
                            <span className={cn("text-[13px] font-semibold", splitDue > 0 ? "text-rose-500" : "text-[#03624C]")}>
                              {isKh ? "ប្រាក់ខ្វះ" : "Remaining"}
                            </span>
                            <span className={cn("font-black text-[16px]", splitDue > 0 ? "text-rose-500" : "text-[#03624C]")}>
                              ${splitDue.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        {splitOver > 0 && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-1.5 text-amber-500 pt-1" >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <p className="text-[11.5px] font-medium">{isKh ? "ទូទាត់លើស" : "Overpaid"} ${splitOver.toFixed(2)}</p>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 grid grid-cols-2 gap-2.5 shrink-0">
                <motion.button whileTap={{ scale: 0.97 }} onClick={handlePrint}
                  className="h-11 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
                  <Printer className="w-4 h-4" />{isKh ? "បោះពុម្ព" : "Print"}
                </motion.button>
                <motion.button whileTap={canPay ? { scale: 0.97 } : {}} onClick={handlePayment} disabled={!canPay}
                  className="h-11 rounded-lg text-[14px] font-bold flex items-center justify-center gap-2 bg-[#03624C] hover:bg-[#03624C]/90 text-white shadow-sm shadow-[#1857D8]/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  {isProcessing
                    ? <><Loader2 className="w-4 h-4 animate-spin" />{isKh ? "កំពុងដំណើរការ..." : "Processing..."}</>
                    : isKh ? "បញ្ចប់ការទូទាត់" : "Complete Payment"
                  }
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}