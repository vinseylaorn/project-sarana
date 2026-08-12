// lib/api/vipcard.ts

import { get, post, put, del, patch } from "./client"
import type {
  VipTier,
  VipCard,
  UpgradeLog,
  IssueCardPayload,
  ExtendCardPayload,
  UpgradeCardPayload,
  BulkSaveTiersPayload,
  VipCardListParams,
  UpgradeLogListParams,
  PaginationMeta,
  VipCardStats,
  UpgradeCardResult,
  LookupCardResult,
} from "@/types/vipcard"

function qs(params?: Record<string, unknown>): string {
  if (!params) return ""
  const p = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, String(v))
  })
  const str = p.toString()
  return str ? `?${str}` : ""
}

const getTiers = () =>
  get<{ data: VipTier[] }>("/vip/tiers")

const createTier = (payload: Omit<VipTier, "id">) =>
  post<{ data: VipTier }>("/vip/tiers", payload)

const updateTier = (id: number, payload: Partial<Omit<VipTier, "id">>) =>
  put<{ data: VipTier }>(`/vip/tiers/${id}`, payload)

const deleteTier = (id: number) =>
  del<{ message: string }>(`/vip/tiers/${id}`)

const bulkSaveTiers = (tiers: BulkSaveTiersPayload["tiers"]) =>
  post<{ data: VipTier[] }>("/vip/tiers/bulk", { tiers })

const getCards = (params?: VipCardListParams) =>
  get<{ data: VipCard[]; meta: PaginationMeta }>(
    `/vip/cards${qs(params as Record<string, unknown>)}`
  )

const getCardStats = () =>
  get<{ data: VipCardStats }>("/vip/cards/stats")

const getCard = (id: number) =>
  get<{ data: VipCard }>(`/vip/cards/${id}`)

const issueCard = (payload: IssueCardPayload) =>
  post<{ data: VipCard }>("/vip/cards", payload)

const toggleCard = (id: number) =>
  patch<{ data: VipCard }>(`/vip/cards/${id}/toggle`, {})

const extendCard = (id: number, payload: ExtendCardPayload) =>
  patch<{ data: VipCard }>(`/vip/cards/${id}/extend`, payload)

const upgradeCard = (id: number, payload: UpgradeCardPayload) =>
  patch<{ data: UpgradeCardResult }>(`/vip/cards/${id}/upgrade`, payload)

const deleteCard = (id: number) =>
  del<{ message: string }>(`/vip/cards/${id}`)

const lookupCard = (code: string) =>
  get<{ data: LookupCardResult }>(`/vip/cards/lookup?code=${encodeURIComponent(code)}`)

const getUpgradeLogs = (params?: UpgradeLogListParams) =>
  get<{ data: UpgradeLog[]; total: number }>(
    `/vip/upgrade-logs${qs(params as Record<string, unknown>)}`
  )

export const vipCardApi = {
  getTiers,
  createTier,
  updateTier,
  deleteTier,
  bulkSaveTiers,

  getCards,
  getCardStats,
  getCard,
  issueCard,
  toggleCard,
  extendCard,
  upgradeCard,
  deleteCard,
  lookupCard,
  getUpgradeLogs,
}