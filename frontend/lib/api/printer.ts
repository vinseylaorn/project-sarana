// lib/api/printer.ts

import { get, post, put, del } from "./client"

export interface PrinterDevice {
  id:         string
  name:       string
  ipAddress:  string
  status:     "online" | "offline"
  categories: string[]
}

export interface ScanResult {
  found:   number
  devices: { ip_address: string; name: string; status: string; categories: string[] }[]
}

export const printerApi = {
  list: () =>
    get<PrinterDevice[]>("/printers"),

  create: (payload: { name: string; ip_address: string; categories?: string[] }) =>
    post<PrinterDevice>("/printers", payload),

  update: (id: string, payload: Partial<{
    name:       string
    ip_address: string
    categories: string[]
    status:     "online" | "offline"
  }>) => put<PrinterDevice>(`/printers/${id}`, payload),

  delete: (id: string) =>
    del<{ message: string }>(`/printers/${id}`),

  scan: (subnet?: string) =>
    post<ScanResult>("/printers/scan", { subnet }),

  saveScan: (devices: { ip_address: string; name: string }[]) =>
    post<PrinterDevice[]>("/printers/scan/save", { devices }),

  ping: (id: string) =>
    post<{ id: string; status: string }>(`/printers/${id}/ping`, {}),
}