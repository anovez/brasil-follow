/* eslint-disable @typescript-eslint/no-unused-vars */
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      userId: number
      role: string
      status: string
      level: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId: number
    role: string
    status: string
    level: string
  }
}

// User roles
export type UserRole = "USER" | "RESELLER" | "ADMIN"
export type UserStatus = "ACTIVE" | "BANNED"
export type UserLevel = "BRONZE" | "PRATA" | "OURO" | "DIAMANTE"

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "PARTIAL"
  | "CANCELLED"
  | "REFUNDED"
  | "ERROR"

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "REFUNDED"

export type TicketStatus = "OPEN" | "ANSWERED" | "CLOSED"

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
