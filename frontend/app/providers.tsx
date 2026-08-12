"use client"

import "@/lib/i18n"
import { useState, useEffect } from "react"
import { ThemeProvider }        from "next-themes"
import { I18nextProvider }      from "react-i18next"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import i18n                     from "@/lib/i18n"
import { RoleProvider }         from "@/lib/role-context"
import { LanguageProvider }     from "@/lib/language-context"
import { SettingsProvider }     from "@/lib/settings-context"
import { NotificationProvider } from "@/lib/notification-context"
import { NotificationChecker }  from "@/components/ui/notification-checker"
import { Toaster }              from "sonner"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  }))

  useEffect(() => {
    const lng = i18n.language?.split("-")[0] || "en"
    const validLng = ["en", "km"].includes(lng) ? lng : "en"

    fetch(`/locales/${validLng}/common.json`)
      .then((r) => r.json())
      .then((data) => {
        i18n.addResourceBundle(validLng, "common", data, true, true)
      })
      .catch(() => {
      })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange >
        <I18nextProvider i18n={i18n}>
          <RoleProvider>
            <SettingsProvider>
              <LanguageProvider>
                <NotificationProvider>
                  <NotificationChecker />
                  {children}
                  <Toaster position="top-center" richColors />
                </NotificationProvider>
              </LanguageProvider>
            </SettingsProvider>
          </RoleProvider>
        </I18nextProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}