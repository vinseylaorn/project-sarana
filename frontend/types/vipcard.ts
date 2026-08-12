// types/vipcard.ts

// ─── Tier (Card Type) ──────────────────────────────────────────────────────

export type TierIcon = "star" | "gem" | "crown"

export interface VipTier {
  id:           number
  name:         string        
  nameKh:       string       
  discount:     number        
  minVisits:    number
  maxVisits:    number | null  
  upgrade:      number | null  
  monthlyLimit: number         
  color:        string        
  bgFrom:       string
  bgTo:         string
  accentColor:  string
  icon:         TierIcon
}

// ─── Card ──────────────────────────────────────────────────────────────────

export interface VipCard {
  id:            number
  code:          string       
  tierId:        number
  tierName:      string      
  totalVisits:   number
  usedThisMonth: number
  monthlyLimit:  number       
  issuedAt:      string       
  expiresAt:     string | null
  isActive:      boolean
  note:          string
}

// ─── Upgrade Log ───────────────────────────────────────────────────────────

export interface UpgradeLog {
  id:                   number
  cardId:               number   
  cardCode:             string   
  oldCardCode:          string | null 
  fromTierId:           number
  fromTierName:         string
  toTierId:             number
  toTierName:           string
  totalVisitsAtUpgrade: number
  upgradedAt:           string   
}

// ─── Request Payloads ──────────────────────────────────────────────────────

export interface IssueCardPayload {
  tierId:        number
  expiresAt?:    string | null   
  monthlyLimit?: number          
  note?:         string
}

export interface ExtendCardPayload {
  expiresAt:    string | null
  monthlyLimit: number
}

export interface UpgradeCardPayload {
  toTierId: number
}

export interface BulkSaveTiersPayload {
  tiers: (Omit<VipTier, "id"> & { id?: number })[]
}

// ─── Query Params ──────────────────────────────────────────────────────────

export interface VipCardListParams {
  search?:    string
  tier_id?:   number | string
  sort?:      "code" | "total_visits" | "used_this_month" | "expires_at" | "issued_at"
  direction?: "asc" | "desc"
  page?:      number
  per_page?:  number
}

export interface UpgradeLogListParams {
  search?:    string
  date_from?: string   // "YYYY-MM-DD"
  date_to?:   string   // "YYYY-MM-DD"
}

// ─── API Responses ─────────────────────────────────────────────────────────

export interface PaginationMeta {
  total:        number
  per_page:     number
  current_page: number
  last_page:    number
}

export interface VipCardStats {
  total:   number
  active:  number
  expired: number
  paused:  number
}

// ─── Upgrade API Response ──────────────────────────────────────────────────

export interface UpgradeCardResult {
  newCard: VipCard
  oldCard: VipCard
}

export interface LookupCardResult {
  card:     VipCard
  tier:     VipTier
  isActive: boolean
  expired:  boolean
}