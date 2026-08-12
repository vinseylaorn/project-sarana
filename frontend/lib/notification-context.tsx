"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: "info" | "warning" | "success"
}

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  addNotification: (n: Omit<Notification, "read" | "time"> & { id?: string }) => void
  hasNotification: (id: string) => boolean
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const unreadCount = notifications.filter(n => !n.read).length

  const hasNotification = (id: string) =>
    notifications.some(n => n.id === id)

  const markAsRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

  const markAllAsRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

  const clearAll = () => setNotifications([])

  const addNotification = (n: Omit<Notification, "read" | "time"> & { id?: string }) => {
    const now = new Date()
    const time = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    const id = n.id || (n.title + "_" + Date.now())
    setNotifications(prev => [
      { ...n, id, read: false, time },
      ...prev,
    ])
  }

  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount,
      markAsRead, markAllAsRead, clearAll,
      addNotification, hasNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider")
  return ctx
}