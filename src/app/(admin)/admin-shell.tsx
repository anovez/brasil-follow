"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import { Header } from "@/components/layout/Header"
import { AdminMobileNav } from "@/components/layout/AdminMobileNav"

interface AdminShellProps {
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

export function AdminShell({ user, children }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <AdminMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onMenuToggle={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
