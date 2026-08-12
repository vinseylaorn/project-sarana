// lib/api/setting.ts

import { get, put, del } from "@/lib/api/client"
import { SystemSetting, SystemSettingPayload } from "@/types"

export const systemSettingApi = {
  get: () =>
    get<{ success: boolean; data: SystemSetting }>("/system-settings"),
  update: (payload: SystemSettingPayload) =>
    put<{ success: boolean; message: string; data: SystemSetting }>(
      "/system-settings",
      payload
    ),
  removeLogo: () =>
    del<{ success: boolean; message: string }>("/system-settings/logo"),
}