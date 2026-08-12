// lib/api/dashboard.ts

import { get } from "./client"

export interface DashboardStats {
  todayRevenue:     number
  ordersToday:      number
  avgOrderValue:    number
  tablesOccupied:   number
  totalTables:      number
  pendingOrders:    number
  completedOrders:  number
  revenueChangePercent:  number
  ordersChangePercent:   number
  avgOrderChangePercent: number
  completedPercent:      number
}

export interface RevenuePoint {
  label:   string
  revenue: number
}

export interface DashboardRevenueCharts {
  week:  RevenuePoint[]
  month: RevenuePoint[]
  year:  RevenuePoint[]
}

export interface DashboardOrder {
  id:         number | string
  order_ref:  string
  table:      string      
  status:     "new" | "preparing" | "ready" | "completed"
  items_count: number
  time:       string      
  total:      number
}

export interface DashboardInventoryAlert {
  id:     number
  name:   string
  stock:  number
  unit:   string
  status: "low" | "critical"
}

export interface DashboardTableItem {
  id:     string  
  seats:  number
  floor:  string
  status: "available" | "occupied" | "reserved"
}

export interface DashboardData {
  stats:    DashboardStats
  revenue:  DashboardRevenueCharts
  orders:   DashboardOrder[]
  alerts:   DashboardInventoryAlert[]
  tables:   DashboardTableItem[]
}

export const dashboardApi = {
  get: (): Promise<DashboardData> => get<DashboardData>("/dashboard"),
}