"use client"

import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query"
import { rolesApi } from "@/lib/api"

export const ROLES_QUERY_KEY = ["roles"] as const

type CreateRolePayload = Parameters<typeof rolesApi.create>[0]
type UpdateRolePayload = Parameters<typeof rolesApi.update>[1]

export function useRolesList() {
  return useQuery({
    queryKey: ROLES_QUERY_KEY,
    queryFn: () => rolesApi.list(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export function useRoleDetail(id?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["roles", id],
    queryFn: () => rolesApi.get(id as number),
    enabled: !!id && (options?.enabled ?? true),
  })
}

export function useRoleUsers(id?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ["roles", id, "users"],
    queryFn: () => rolesApi.users(id as number),
    enabled: !!id && (options?.enabled ?? true),
  })
}

export function useRolesMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ROLES_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ["users"] })
  }

  const create = useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRolePayload }) =>
      rolesApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}