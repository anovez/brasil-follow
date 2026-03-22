import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { DashboardShell } from "./dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = Number(session.user.id)

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      balance: true,
      level: true,
      role: true,
    },
  })

  if (!user) {
    redirect("/login")
  }

  const userData = {
    name: user.name,
    email: user.email,
    image: user.image,
    balance: Number(user.balance),
    level: user.level,
    role: user.role,
  }

  return <DashboardShell user={userData}>{children}</DashboardShell>
}
