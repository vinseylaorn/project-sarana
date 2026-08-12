import { useQuery, useQueryClient, useMutation,keepPreviousData } from "@tanstack/react-query"
import { staffApi } from "@/lib/api"
import type { Staff } from "@/types"

export function useStaffList() {
  return useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const data = await staffApi.list()
      return Array.isArray(data) ? data : []
    },
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useStaffMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["staff"] })

  const create = useMutation({
    mutationFn: (payload: Record<string, any>) => staffApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: Staff["id"]; payload: Record<string, any> }) =>
      staffApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: Staff["id"]) => staffApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}