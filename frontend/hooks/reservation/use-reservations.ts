import { useQuery, useQueryClient, useMutation,keepPreviousData } from "@tanstack/react-query"
import { reservationsApi } from "@/lib/api/reservations"
import type { Reservation } from "@/types"

export function useReservations() {
  return useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await reservationsApi.list()
      return (Array.isArray(res) ? res : (res?.data ?? [])) as Reservation[]
    },
    staleTime: 30 * 1000, 
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })
}

export function useReservationMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["reservations"] })

  const remove = useMutation({
    mutationFn: (id: number) => reservationsApi.delete(id),
    onSuccess: invalidate,
  })

  return { remove, invalidate }
}