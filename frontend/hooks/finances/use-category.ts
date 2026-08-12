import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import { financeCategoriesApi, expensesApi, incomesApi } from "@/lib/api"

export function useFinanceCategories() {
  return useQuery({
    queryKey: ["finance-categories"],
    queryFn: () => financeCategoriesApi.list(),
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useExpensesForCategoryCount() {
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

export function useIncomesForCategoryCount() {
  return useQuery({
    queryKey: ["incomes"],
    queryFn: async () => {
      const data: any = await incomesApi.list()
      return data?.data?.data ?? []
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}


export function useFinanceCategoryMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["finance-categories"] })

  const create = useMutation({
    mutationFn: (payload: { name: string; type: "income" | "expense" }) =>
      financeCategoriesApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { name: string; type: "income" | "expense" } }) =>
      financeCategoriesApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => financeCategoriesApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}