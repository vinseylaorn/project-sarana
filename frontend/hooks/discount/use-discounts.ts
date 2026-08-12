import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import { discountsApi } from "@/lib/api/discount"
import type { Discount } from "@/types"

export function useDiscounts() {
  return useQuery({
    queryKey: ["discounts"],
    queryFn: () => discountsApi.list() as Promise<Discount[]>,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData, // 👈 រក្សាទិន្នន័យចាស់ពេល refetch/remount, កុំឲ្យលោតទៅ empty
  })
}

export function useDiscountMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["discounts"] })

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Discount["status"] }) =>
      discountsApi.update(id, { status }),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => discountsApi.delete(id),
    onSuccess: invalidate,
  })

  return { toggleStatus, remove, invalidate }
}