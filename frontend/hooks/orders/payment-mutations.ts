import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { ordersApi, workingShiftsApi } from "@/lib/api"
import type { Order, WorkingShift } from "@/types"

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const data = await ordersApi.list()
      return data.map((o: any) => ({
        ...o,
        working_shift_id: o.working_shift_id ?? o.shift_id ?? null,
      })) as Order[]
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useWorkingShifts() {
  return useQuery({
    queryKey: ["working-shifts"],
    queryFn: () => workingShiftsApi.list() as Promise<WorkingShift[]>,
    staleTime: 60 * 1000,
  })
}