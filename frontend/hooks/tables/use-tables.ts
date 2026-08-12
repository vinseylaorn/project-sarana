import { useEffect } from "react"
import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import { tablesApi } from "@/lib/api"
import { setGlobalTables, type PosTable } from "@/store/pos.store"
import type { Table } from "@/types"

const apiToTable = (t: Table): PosTable => ({
  id: t.id, name: t.name, seats: t.seats,
  floor: t.floor, status: t.status,
  reserveTime: t.reserve_time ?? undefined,
})

export function useTables() {
  const query = useQuery({
    queryKey: ["tables"],
    queryFn: () => tablesApi.list() as Promise<Table[]>,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    if (query.data) setGlobalTables(query.data.map(apiToTable))
  }, [query.data])

  return query
}

type TablePayload = { name: string; seats: number; floor: string }

export function useTableMutations() {
  const queryClient = useQueryClient()
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["tables"] })

  const create = useMutation({
    mutationFn: (payload: TablePayload) => tablesApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: TablePayload }) =>
      tablesApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => tablesApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove, invalidate }
}