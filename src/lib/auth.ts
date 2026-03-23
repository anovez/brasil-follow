import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { compare } from "bcryptjs"
import prisma from "./prisma"

function generateAffiliateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

function generateApiKey(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let key = "bf_"
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return key
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        login: { label: "Email ou Username", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials, request) {
        const login = credentials?.login as string | undefined
        const password = credentials?.password as string | undefined

        if (!login || !password) {
          return null
        }

        const ip =
          (request?.headers as Headers)?.get?.("x-forwarded-for")?.split(",")[0]?.trim() ||
          (request?.headers as Headers)?.get?.("x-real-ip") ||
          "unknown"
        const userAgent =
          (request?.headers as Headers)?.get?.("user-agent") || "unknown"

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: login.toLowerCase() },
              { username: login.toLowerCase() },
            ],
          },
        })

        if (!user || !user.password) {
          await prisma.securityLog.create({
            data: {
              action: "LOGIN_FAILED",
              ip,
              userAgent,
              details: `Failed login attempt for: ${login}`,
              severity: "WARN",
            },
          })
          return null
        }

        const isPasswordValid = await compare(password, user.password)

        if (!isPasswordValid) {
          await prisma.securityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              ip,
              userAgent,
              details: "Invalid password",
              severity: "WARN",
            },
          })
          return null
        }

        if (user.status === "BANNED") {
          await prisma.securityLog.create({
            data: {
              userId: user.id,
              action: "LOGIN_FAILED",
              ip,
              userAgent,
              details: "Banned user attempted login",
              severity: "WARN",
            },
          })
          return null
        }

        await prisma.securityLog.create({
          data: {
            userId: user.id,
            action: "LOGIN_SUCCESS",
            ip,
            userAgent,
            details: "Credentials login",
            severity: "INFO",
          },
        })

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          image: user.image,
        } as any
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        if (!profile?.email) {
          return false
        }

        const email = profile.email.toLowerCase()
        const googleId = profile.sub || account.providerAccountId

        let existingUser = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUser) {
          if (existingUser.status === "BANNED") {
            return false
          }

          if (!existingUser.googleId) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId,
                image: existingUser.image || (profile as { picture?: string }).picture || null,
              },
            })
          }

          user.id = String(existingUser.id)
          ;(user as any).role = existingUser.role
          ;(user as any).status = existingUser.status
          ;(user as any).level = existingUser.level
        } else {
          let referredById: number | null = null

          if (typeof globalThis !== "undefined") {
            try {
              const { cookies } = await import("next/headers")
              const cookieStore = await cookies()
              const refCode = cookieStore.get("ref")?.value
              if (refCode) {
                const referrer = await prisma.user.findUnique({
                  where: { affiliateCode: refCode },
                  select: { id: true },
                })
                if (referrer) {
                  referredById = referrer.id
                }
              }
            } catch {
              // cookies() may not be available in all contexts
            }
          }

          const baseName = profile.name || email.split("@")[0]
          let username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "")

          const existingUsername = await prisma.user.findUnique({
            where: { username },
          })
          if (existingUsername) {
            username = `${username}${Date.now().toString(36)}`
          }

          let affiliateCode = generateAffiliateCode()
          let codeExists = await prisma.user.findUnique({
            where: { affiliateCode },
          })
          while (codeExists) {
            affiliateCode = generateAffiliateCode()
            codeExists = await prisma.user.findUnique({
              where: { affiliateCode },
            })
          }

          const apiKey = generateApiKey()

          const newUser = await prisma.user.create({
            data: {
              email,
              username,
              name: baseName,
              image: (profile as { picture?: string }).picture || null,
              googleId,
              affiliateCode,
              apiKey,
              referredById,
            },
          })

          user.id = String(newUser.id)
          ;(user as any).role = newUser.role
          ;(user as any).status = newUser.status
          ;(user as any).level = newUser.level
        }

        return true
      }

      return true
    },

    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.userId = Number(user.id)
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(user.id) },
          select: { role: true, status: true, level: true },
        })
        token.role = dbUser?.role || "USER"
        token.status = dbUser?.status || "ACTIVE"
        token.level = dbUser?.level || "BRONZE"
      }

      if (trigger === "update" && token.userId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.userId as number },
          select: { role: true, status: true, level: true, name: true, image: true },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.status = dbUser.status
          token.level = dbUser.level
          token.name = dbUser.name
          token.picture = dbUser.image
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const user = session.user as any
        user.id = String(token.userId)
        user.userId = token.userId as number
        user.role = token.role as string
        user.status = token.status as string
        user.level = token.level as string
      }
      return session
    },
  },
})
