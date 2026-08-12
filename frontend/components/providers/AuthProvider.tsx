"use client"
import { RoleProvider, useRole } from "@/lib/role-context"

function LoadingScreen() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useRole()
  if (isLoading) return <LoadingScreen />
  return <>{children}</>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <AuthGate>{children}</AuthGate>
    </RoleProvider>
  )
}