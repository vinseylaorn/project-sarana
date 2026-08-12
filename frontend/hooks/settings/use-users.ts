"use client"

import { useQuery, useMutation, useQueryClient,keepPreviousData } from "@tanstack/react-query"
import { usersApi } from "@/lib/api"

export const USERS_QUERY_KEY = ["users"] as const


export function useUsersList() {
  return useQuery({
    queryKey: USERS_QUERY_KEY,
    queryFn: () => usersApi.list(),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  })
}

export interface CreateUserPayload {
  name: string
  email: string
  password: string
  role_id: number | null
  status: string
  image?: string | null
}

export interface UpdateUserPayload {
  name?: string
  email?: string
  password?: string
  role_id?: number | null
  status?: string
  image?: string | null
}

export function useUsersMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ["roles"] })
  }

  const create = useMutation({
    mutationFn: (payload: CreateUserPayload) => usersApi.create(payload),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      usersApi.update(id, payload),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: invalidate,
  })

  return { create, update, remove }
}