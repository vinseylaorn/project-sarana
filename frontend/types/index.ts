// types/index.ts

// ─── Auth & Permissions ───────────────────────────────────────────
export interface PagePermissions {
  view: boolean; 
  create: boolean; 
  edit: boolean; 
  delete: boolean
}
// ─── Role & Permissions ───────────────────────────────────────────
export interface RolePage {
  page:        string
  pageKey:     string
  label:       string
  labelKh:     string
  section:     string | null
  sectionKh:   string | null
  href:        string | null
  isDashboard: boolean
  permissions: PagePermissions
}
export interface Role {
  id:           number
  name:         string
  description:  string | null
  users_count?: number
  pages?:       RolePage[]
  users?:       User[]
  created_at?: string
   updated_at?:  string 
}

// ─── Users ───────────────────────────────────────────
export interface User {
  id:           number
  username:     string
  email:        string
  role:         string | null
  role_id:      number | null
  status:       "Active" | "Inactive"
  image:        string | null
  created_at?:  string
  updated_at?:  string 
  permissions?: Record<string, PagePermissions>
}

// ─── Staff ────────────────────────────────────────────────────────
export interface Staff {
  id:           number
  name:         string
  user_id:      number | null
  user_name:    string | null
  user_email:   string | null
  gender:       "Male" | "Female"
  phone:        string
  email:        string | null
  position:     string | null
  salary:       string
  status:       "Active" | "Inactive"
  can_use_pos:  boolean         
  has_pin:      boolean         
  image:        string | null
  date:         string | null
  created_at?:  string
}

// ─── Inventory ────────────────────────────────────────────────────
export interface StockCategory {
  id:          number
  name:        string
  product_count?: number
  created_at?: string
  updated_at?: string  
}

export interface InventoryItem {
  id:          number
  category_id: number
  category:    string
  name:        string
  unit:        string
  size:        "Small" | "Normal" | "Large"
  stock:       number
  min_stock:   number
  supplier_id: number | null
  created_at?: string
  updated_at?: string
}

export interface Supplier {
  id:           number
  name:         string
  contact_name: string | null
  phone:        string
  email:        string | null
  address:      string | null
  category_id:  number | null
  category:     StockCategory | null
  status:       "Active" | "Inactive"
  note:         string | null
  created_at?:  string
}

export interface StockHistory {
  id:          number
  productName: string
  type:        "IN" | "OUT"
  qty:         number
  unit:        string
  reason:      string
  timestamp:   string
}

export interface Spoilage {
  id:            number
  inventory_id:  number
  category_id:   number | null
  category_name: string
  product_name:  string
  unit:          string | null
  qty:           number
  description:   string | null
  date:          string
  created_at?:   string
}

// ─── Menu ─────────────────────────────────────────────────────────
export interface MenuCategory {
  id:          number
  name:        string
  created_at?: string
  updated_at?: string 
  discounts?:  {
    id:         number
    name:       string
    value_type: "percentage" | "flat"
    value:      number
  }[]
}

export interface RecipeItem {
  inventory_id:   number
  inventory_name: string
  unit:           string
  deduct_qty:     number
  stock?:         number
  min_stock?:     number
}

export interface MenuItem {
  id:          number
  category_id: number
  category?:   string
  name:        string
  price:       number
  image?:      string | null
  available:   boolean
  recipe:      { inventory_id: number; inventory_name?: string; unit?: string; deduct_qty: number }[]
  discount?: {
    id:         number
    name:       string
    value:      number
    value_type: "percentage" | "flat"
  } | null
  discounted_price?: number | null
}

// ─── Orders ───────────────────────────────────────────────────────
export interface OrderItem {
  menu_item_id:         number
  name:                 string
  price:                number
  original_price?:      number | null
  quantity:             number
  note?:                string | null  
  discount?: {
    name:       string
    value:      number
    value_type: "percentage" | "flat"
  } | null
}
export interface Order {
  id:                   number
  order_ref:            string
  table_name:           string | null
  order_type:           string
  total:                number
  status:               string
  payment_method?:      string | null
  items:                OrderItem[]
  created_at?:          string
  staff_id?:            number | null
  working_shift_id?:    number | null
  // ✅ Discount / Tax / VIP fields
  discount_amount?:     number
  tax_amount?:          number
  vip_discount_amount?: number
}

// ─── Tables ───────────────────────────────────────────────────────
export interface Table {
  id:           number
  name:         string
  seats:        number
  floor:        string
  status:       "available" | "occupied" | "reserved"
  reserve_time: string | null
  created_at?:  string
}

// ─── Finance ──────────────────────────────────────────────────────
export interface FinanceCategory {
  id:          number
  name:        string
  type:        "income" | "expense"
  date:        string
  created_at?: string
  updated_at?: string
}

export interface Expense {
  id:          number | string
  title:       string
  amount:      string
  category:    string | null
  date:        string | null
  is_auto:     boolean
  isAuto:      boolean
  created_at?: string
}

export interface Income {
  id:              string
  title:           string
  amount:          number
  date:            string
  category:        string
  isAutoGenerated: boolean
  payment_method?: string
  description?:    string
  order?:          Order
}

export interface IncomesResponse {
  data: {
    data:         Income[]
    total:        number
    current_page: number
    last_page:    number
    per_page:     number
  }
  summary: {
    total:         number
    order_income:  number
    manual_income: number
  }
}

// ─── Reports ──────────────────────────────────────────────────────
export interface ReportKpi {
  totalRevenue:  number
  salesRevenue:  number
  manualIncome:  number
  totalOrders:   number
  avgOrder:      number
  totalExpense:  number
  revenueChange: number
  dineIn:        number
  takeaway:      number
  app:           number
}

export interface RevenueTrendPoint {
  date:    string
  label:   string
  revenue: number
}

export interface CategoryPoint {
  name:    string
  value:   number
  revenue: number
  count:   number
}

export interface TopItem {
  name:    string
  orders:  number
  revenue: number
}

export interface PaymentPoint {
  name:  string
  value: number
}

export interface ReportCharts {
  revenueByDay:   RevenuePoint[]
  revenueByWeek:  RevenuePoint[]
  revenueByMonth: RevenuePoint[]
  revenueTrend:   RevenueTrendPoint[]
  categoryData:   CategoryPoint[]
  topItems:       TopItem[]
  paymentData:    PaymentPoint[]
}

export interface ReportData {
  kpi:    ReportKpi
  charts: ReportCharts
  recent: Order[]
}

export interface RevenuePoint {
  label:   string
  day?:    string
  revenue: number
}

// ─── Working Shifts ───────────────────────────────────────────────
export type ShiftType   = "Morning" | "Afternoon" | "Night" | "Full Day"
export type ShiftStatus = "Present" | "Absent" | "Late" | "Leave"

export interface WorkingShift {
  id:             number
  staff_id:       number
  staff_name:     string
  staff_image:    string | null
  staff_position: string | null
  date:           string
  shift_type:     ShiftType
  start_time:     string
  end_time:       string
  status:         ShiftStatus
  overtime_hours: number
  note:           string | null
  created_at?:    string

  shift_status?:      "Open" | "Closed"
  open_time?:         string | null
  open_time_raw?:     string | null
  open_amount_usd?:   number
  open_amount_khr?:   number
  close_time?:        string | null
  close_time_raw?:    string | null
  close_amount_usd?:  number
  close_amount_khr?:  number
  total_orders?:      number
  total_revenue_usd?: number
  total_revenue_khr?: number
}

export interface WorkingShiftSummary {
  total:              number
  present:            number
  absent:             number
  late:               number
  leave:              number
  overtime:           number
  open?:              number
  closed?:            number
  total_orders?:      number
  total_revenue_usd?: number
  total_revenue_khr?: number
}

export interface WorkingShiftPayload {
  staff_id:        number
  date:            string
  shift_type:      ShiftType
  start_time:      string
  end_time:        string
  status:          ShiftStatus
  overtime_hours?: number
  note?:           string | null
}

// ─── Reservations ────────────────────────────────────────────────
export type ReservationStatus = "pending" | "confirmed" | "cancelled" | "completed"

export interface ReservationTable {
  id:           number
  name:         string
  seats?:       number
  floor?:       string
  status?:      string
  reserve_time?: string | null
  pivot?: {
    reservation_id: number
    table_id:       number
    status:         "reserved" | "cancelled" | "completed"
  }
}

export interface Reservation {
  id:                number
  customer_name:     string
  customer_phone:    string
  arrival_datetime?: string | null 
  status:            "pending" | "confirmed" | "cancelled" | "completed"
  total_price:       number
  notes?:            string | null
  tables?:           ReservationTable[]
  items?:            ReservationItem[]
  created_at?:       string
  updated_at?:       string
}

export interface ReservationItem {
  id:             number
  menu_item_id:   number
  name:           string
  price:          string
  original_price: string | null
  discount_name:  string | null
  discount_value: string | null
  discount_type:  "percentage" | "flat" | null
  quantity:       number
}

export interface CreateReservationPayload {
  customer_name:     string
  customer_phone:    string
  arrival_datetime?: string  
  table_ids:         number[]
  items?:            Array<{ id: number; quantity: number }>
  notes?:            string
}

export interface ReservationListResponse {
  data:         Reservation[]
  total:        number
  current_page: number
  last_page:    number
  per_page:     number
}
// ─── Discounts ────────────────────────────────────────────────────
export interface Discount {
  id:                number
  name:              string
  scope:             "category" | "product"
  value_type:        "percentage" | "flat"
  value:             number
  target_id?:        number
  target_ids?:       number[]
  start_date?:       string | null
  end_date?:         string | null
  status:            "active" | "inactive" | "expired" | "scheduled"
  min_order_amount?: number | null
  description?:      string | null
  created_at?:       string
  updated_at?:       string
}

// ─── System Settings ──────────────────────────────────────────────
export interface SystemSetting {
  system_name: string
  system_logo: string | null
}

export interface SystemSettingPayload {
  system_name: string
  system_logo: string | null
}