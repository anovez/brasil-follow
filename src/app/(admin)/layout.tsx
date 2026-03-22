import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { AdminShell } from "./admin-shell"

export default async function AdminLayout({
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

  if (!user || user.role !== "ADMIN") {
    redirect("/new-order")
  }

  const userData = {
    name: user.name,
    email: user.email,
    image: user.image,
    balance: Number(user.balance),
    level: user.level,
    role: user.role,
  }

  return <AdminShell user={userData}>{children}</AdminShell>
}
