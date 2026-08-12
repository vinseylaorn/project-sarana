"use client"


import "@/lib/i18n"                         
import { createContext, useContext, type ReactNode } from "react"
import { useTranslation }  from "react-i18next"

export type Language = "en" | "kh"

interface LanguageContextType {
  language:    Language
  setLanguage: (lang: Language) => void
  isKh:        boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n: i18nInstance } = useTranslation()
  const language = (i18nInstance.language === "kh" ? "kh" : "en") as Language
  const setLanguage = (lang: Language) => {
    i18nInstance.changeLanguage(lang)
  }
  return (
    <LanguageContext.Provider value={{ language, setLanguage, isKh: language === "kh" }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}

export function useT() {
  const { t }  = useTranslation("common")
  const { isKh } = useLanguage()
  return { t, isKh }
}