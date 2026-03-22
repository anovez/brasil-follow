import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import crypto from 'crypto'
import { Decimal } from '@prisma/client/runtime/library'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | Decimal): string {
  const numericValue = typeof value === 'number' ? value : Number(value)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return email
  const firstChar = localPart[0]
  const masked = firstChar + '***'
  return `${masked}@${domain}`
}

export function maskApiKey(key: string): string {
  if (key.length <= 10) return '***'
  return key.slice(0, 6) + '...' + key.slice(-4)
}

export function calculateLevelDiscount(level: string): number {
  switch (level) {
    case 'BRONZE':
      return 0
    case 'PRATA':
      return 3
    case 'OURO':
      return 5
    case 'DIAMANTE':
      return 10
    default:
      return 0
  }
}

export function getUserLevel(totalSpent: number): string {
  if (totalSpent >= 2000) return 'DIAMANTE'
  if (totalSpent >= 500) return 'OURO'
  if (totalSpent >= 100) return 'PRATA'
  return 'BRONZE'
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
