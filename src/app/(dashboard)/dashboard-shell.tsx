"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { MobileNav } from "@/components/layout/MobileNav"

interface DashboardShellProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    balance?: number
    level?: string
    role?: string
  }
  children: React.ReactNode
}

export function DashboardShell({ user, children }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} />
      <MobileNav
        open={mobileNavOpen}
        onOpenChange={setMobileNavOpen}
        user={user}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuToggle={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
