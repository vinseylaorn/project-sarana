import { useQueryClient, useMutation } from "@tanstack/react-query"
import { suppliersApi } from "@/lib/api"

type SupplierPayload = {
  name: string
  contact_name: string | null
  phone: string
  email: string | null
  address: string | null
  category_id: number | null
  status: "Active" | "Inactive"
  note: string | null
}

export function useSupplierMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["suppliers"] })
  }

  const create = useMutation({
    mutationFn: (payload: SupplierPayload) => suppliersApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: SupplierPayload }) =>
      suppliersApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => suppliersApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}