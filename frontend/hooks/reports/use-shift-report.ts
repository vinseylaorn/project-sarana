import { useQuery, useQueryClient } from "@tanstack/react-query"
import { workingShiftsApi } from "@/lib/api/working-shifts"
import { ordersApi } from "@/lib/api/orders"
import type { WorkingShift, Order } from "@/types"

interface ReportParams {
  start_date?: string
  end_date?:   string
}

export function useWorkingShifts(params: ReportParams) {
  return useQuery({
    queryKey: ["working-shifts", params],
    queryFn: () => workingShiftsApi.list(params) as Promise<WorkingShift[]>,
    staleTime: 60 * 1000,
  })
}

export function useAllOrdersForShiftReport(params: ReportParams) {
  return useQuery({
    queryKey: ["orders-all-shift-report", params],
    queryFn: async () => {
      try {
        const data = await ordersApi.listAll(params)
        return (data as any[]).map((o) => ({
          ...o,
          working_shift_id: o.working_shift_id ?? o.shift_id ?? null,
        })) as Order[]
      } catch {
        return [] as Order[]
      }
    },
    staleTime: 60 * 1000,
  })
}

export function useShiftReportData(params: ReportParams) {
  const shiftsQuery = useWorkingShifts(params)
  const ordersQuery = useAllOrdersForShiftReport(params)

  const loading = shiftsQuery.isLoading || ordersQuery.isLoading
  const error   = shiftsQuery.error
    ? (shiftsQuery.error as any)?.message ?? "Failed to load"
    : null

  const refetch = () => {
    shiftsQuery.refetch()
    ordersQuery.refetch()
  }

  return {
    shifts:     shiftsQuery.data ?? [],
    allOrders:  ordersQuery.data ?? [],
    loading,
    error,
    isFetching: shiftsQuery.isFetching || ordersQuery.isFetching,
    refetch,
  }
}