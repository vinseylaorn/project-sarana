// lib/api/exchange-rate.ts
import { get } from "./client"

export interface NbcRateData {
   rate: number
   date: string
   /** true = backend returned last-known cached rate because the NBC/MEF API was unreachable */
   stale: boolean
}

export interface NbcRateResponse {
   success: boolean
   data: NbcRateData
   message?: string
}

export const exchangeRateApi = {
   /**
    * Official USD→KHR rate from the National Bank of Cambodia (via Laravel).
    * @param refresh  true = bypass the backend cache and fetch a fresh value
    */
   getNbcRate: (refresh = false) =>
      get<NbcRateResponse>(`/system-settings/nbc-rate${refresh ? "?refresh=1" : ""}`),
}