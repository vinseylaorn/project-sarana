"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface SettingsContextType {
  systemName: string
  systemLogo: string
  updateSettings: (name: string, logo: string) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [systemName, setSystemName] = useState("My System")
  const [systemLogo, setSystemLogo] = useState("")

  useEffect(() => {
    const saved = localStorage.getItem("system_identity")
    if (saved) {
      const parsed = JSON.parse(saved)
      setSystemName(parsed.name || "My System")
      setSystemLogo(parsed.logo || "")
    }
  }, [])
  const updateSettings = (name: string, logo: string) => {
    setSystemName(name)
    setSystemLogo(logo)
    localStorage.setItem("system_identity", JSON.stringify({ name, logo }))
  }

  return (
    <SettingsContext.Provider value={{ systemName, systemLogo, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}
export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) throw new Error("useSettings must be used within SettingsProvider")
  return context
}