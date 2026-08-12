"use client"

import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query"
import { workingShiftsApi } from "@/lib/api/working-shifts"

export const WORKING_SHIFTS_QUERY_KEY = ["working-shifts"] as const

type ListParams = Parameters<typeof workingShiftsApi.list>[0]
type SummaryParams = Parameters<typeof workingShiftsApi.summary>[0]

export function useWorkingShiftsList(params?: ListParams) {
  return useQuery({
    queryKey: [...WORKING_SHIFTS_QUERY_KEY, "list", params ?? {}],
    queryFn: () => workingShiftsApi.list(params),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useWorkingShiftsSummary(params?: SummaryParams) {
  return useQuery({
    queryKey: [...WORKING_SHIFTS_QUERY_KEY, "summary", params ?? {}],
    queryFn: () => workingShiftsApi.summary(params),
    staleTime: 30_000,
  })
}

export function useWorkingShiftsMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: WORKING_SHIFTS_QUERY_KEY })
  }

  const remove = useMutation({
    mutationFn: (id: number) => workingShiftsApi.delete(id),
    onSuccess: invalidate,
  })

  return { remove }
}