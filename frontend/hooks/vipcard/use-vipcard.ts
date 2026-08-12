import { useQuery, useQueryClient, useMutation, keepPreviousData } from "@tanstack/react-query"
import { vipCardApi } from "@/lib/api/vipcard"
import type { VipTier, VipCard, UpgradeLog, VipCardStats } from "@/types/vipcard"


export function useVipTiers() {
  return useQuery({
    queryKey: ["vip-tiers"],
    queryFn: async () => (await vipCardApi.getTiers()).data as VipTier[],
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useVipCards() {
  return useQuery({
    queryKey: ["vip-cards"],
    queryFn: async () => (await vipCardApi.getCards({ per_page: 200 })).data as VipCard[],
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useVipCardStats() {
  return useQuery({
    queryKey: ["vip-card-stats"],
    queryFn: async () => (await vipCardApi.getCardStats()).data as VipCardStats,
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}

export function useVipUpgradeLogs() {
  return useQuery({
    queryKey: ["vip-upgrade-logs"],
    queryFn: async () => (await vipCardApi.getUpgradeLogs()).data as UpgradeLog[],
    staleTime: 60 * 1000,
    placeholderData: keepPreviousData,
  })
}


export function useVipCardMutations() {
  const queryClient = useQueryClient()

  const refreshStats = async () => {
    const statsRes = await vipCardApi.getCardStats()
    queryClient.setQueryData(["vip-card-stats"], statsRes.data)
  }

  const issueCard = useMutation({
    mutationFn: (payload: { tierId: number; note: string; expiresAt: string | null; monthlyLimit: number }) =>
      vipCardApi.issueCard(payload),
    onSuccess: async (res) => {
      queryClient.setQueryData<VipCard[]>(["vip-cards"], (old = []) => [res.data, ...old])
      queryClient.setQueryData<VipCardStats>(["vip-card-stats"], (old) =>
        old ? { ...old, total: old.total + 1, active: old.active + 1 } : old
      )
    },
  })

  const toggleActive = useMutation({
    mutationFn: (card: VipCard) => vipCardApi.toggleCard(card.id),
    onSuccess: async (res) => {
      queryClient.setQueryData<VipCard[]>(["vip-cards"], (old = []) =>
        old.map((c) => (c.id === res.data.id ? res.data : c))
      )
      await refreshStats()
    },
  })

  const extendCard = useMutation({
    mutationFn: ({ cardId, newExpiry, newMonthlyLimit }: { cardId: number; newExpiry: string | null; newMonthlyLimit: number }) =>
      vipCardApi.extendCard(cardId, { expiresAt: newExpiry, monthlyLimit: newMonthlyLimit }),
    onSuccess: async (res) => {
      queryClient.setQueryData<VipCard[]>(["vip-cards"], (old = []) =>
        old.map((c) => (c.id === res.data.id ? res.data : c))
      )
      await refreshStats()
    },
  })

  const upgradeCard = useMutation({
    mutationFn: ({ cardId, toTierId }: { cardId: number; toTierId: number }) =>
      vipCardApi.upgradeCard(cardId, { toTierId }),
    onSuccess: async (res) => {
      const { newCard, oldCard } = res.data
      queryClient.setQueryData<VipCard[]>(["vip-cards"], (old = []) => [
        newCard,
        ...old.map((c) => (c.id === oldCard.id ? oldCard : c)),
      ])
      const [statsRes, logsRes] = await Promise.all([
        vipCardApi.getCardStats(),
        vipCardApi.getUpgradeLogs(),
      ])
      queryClient.setQueryData(["vip-card-stats"], statsRes.data)
      queryClient.setQueryData(["vip-upgrade-logs"], logsRes.data)
    },
  })

  const deleteCard = useMutation({
    mutationFn: (id: number) => vipCardApi.deleteCard(id),
    onSuccess: async (_res, id) => {
      queryClient.setQueryData<VipCard[]>(["vip-cards"], (old = []) => old.filter((c) => c.id !== id))
      await refreshStats()
    },
  })

  const saveTiers = useMutation({
    mutationFn: (updated: VipTier[]) => vipCardApi.bulkSaveTiers(updated),
    onSuccess: (res) => {
      queryClient.setQueryData(["vip-tiers"], res.data)
    },
  })

  return { issueCard, toggleActive, extendCard, upgradeCard, deleteCard, saveTiers }
}