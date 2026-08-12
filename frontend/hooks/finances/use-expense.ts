import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import { expensesApi } from "@/lib/api"
export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const data = await expensesApi.list()
      return Array.isArray(data) ? data : []
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useExpenseMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["expenses"] }) // also used by finance-categories record-count query
  }

  const create = useMutation({
    mutationFn: (payload: {
      title: string; amount: number; category: string; date: string; is_auto?: boolean
    }) => expensesApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: {
      id: number
      payload: { title: string; amount: number; category: string; date: string }
    }) => expensesApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}