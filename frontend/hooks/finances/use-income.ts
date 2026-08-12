import { useQuery, useQueryClient, useMutation, keepPreviousData  } from "@tanstack/react-query"
import { incomesApi } from "@/lib/api"
import type { IncomesResponse } from "@/types"

interface IncomeListParams {
  start_date?: string
  end_date?:   string
  category?:   string
  search?:     string
  page:        number
  per_page:    number
}

export function useIncomes(params: IncomeListParams) {
  return useQuery({
    queryKey: ["incomes-list", params],
    queryFn: () => incomesApi.list(params) as Promise<IncomesResponse>,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData, 
  })
}

export function useAllIncomes() {
  return useQuery({
    queryKey: ["incomes-all"],
    queryFn: async () => {
      const res = (await incomesApi.list({ per_page: 9999, page: 1 })) as IncomesResponse
      return res.data.data
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useIncomeMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["incomes-list"] })
    queryClient.invalidateQueries({ queryKey: ["incomes-all"] })
    queryClient.invalidateQueries({ queryKey: ["incomes"] })
  }

  const create = useMutation({
    mutationFn: (payload: {
      title: string; amount: number; date: string
      category: string; payment_method?: string; description?: string
    }) => incomesApi.createManual(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: {
      id: string   // ← was number
      payload: {
        title: string; amount: number; date: string
        category: string; payment_method?: string; description?: string
      }
    }) => incomesApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),   // ← was number
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}