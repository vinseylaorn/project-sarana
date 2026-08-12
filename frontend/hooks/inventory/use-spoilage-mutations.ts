import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { spoilageApi } from "@/lib/api"

export function useSpoilage() {
  return useQuery({
    queryKey: ["spoilage"],
    queryFn: () => spoilageApi.list(),
  })
}

export function useSpoilageMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["spoilage"] })
    queryClient.invalidateQueries({ queryKey: ["inventory"] })
  }

  const create = useMutation({
    mutationFn: (payload: { inventory_id: number; qty: number; date: string; description?: string }) =>
      spoilageApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: { qty: number; date: string; description?: string } }) =>
      spoilageApi.update(Number(id), payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number | string) => spoilageApi.delete(Number(id)),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}