import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  username: z
    .string()
    .min(3, 'Usuário deve ter no mínimo 3 caracteres')
    .max(20, 'Usuário deve ter no máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Usuário deve conter apenas letras, números e underscore'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[a-zA-Z]/, 'Senha deve conter pelo menos uma letra')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

// Order schemas
export const createOrderSchema = z.object({
  serviceId: z.number().int().positive('ID do serviço inválido'),
  link: z.string().url('URL inválida').max(500, 'URL muito longa'),
  quantity: z
    .number()
    .int('Quantidade deve ser um número inteiro')
    .min(1, 'Quantidade mínima é 1')
    .max(10000000, 'Quantidade máxima é 10.000.000'),
})

// Payment schemas
export const addFundsSchema = z.object({
  amount: z.number().min(5, 'Valor mínimo é R$ 5,00'),
})

// Support schemas
export const createTicketSchema = z.object({
  subject: z
    .string()
    .min(3, 'Assunto deve ter no mínimo 3 caracteres')
    .max(255, 'Assunto deve ter no máximo 255 caracteres'),
  message: z.string().min(10, 'Mensagem deve ter no mínimo 10 caracteres'),
})

export const ticketReplySchema = z.object({
  message: z.string().min(1, 'Mensagem não pode ser vazia'),
})

// Admin schemas
export const updateServiceSchema = z.object({
  pricePerThousand: z.number().positive('Preço deve ser positivo'),
  isActive: z.boolean().optional(),
})

export const createProviderSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  apiUrl: z.string().url('URL da API inválida'),
  apiKey: z.string().min(1, 'Chave da API é obrigatória'),
  defaultMarkup: z
    .number()
    .min(0, 'Markup mínimo é 0%')
    .max(500, 'Markup máximo é 500%'),
  currency: z.enum(['BRL', 'USD'] as const),
  exchangeRate: z.number().positive('Taxa de câmbio deve ser positiva'),
})

export const updateUserRoleSchema = z.object({
  role: z.enum(['USER', 'RESELLER', 'ADMIN'] as const),
})

export const adjustBalanceSchema = z.object({
  amount: z.number({ message: 'Valor é obrigatório' }),
  description: z.string().min(3, 'Descrição deve ter no mínimo 3 caracteres'),
})

// API v2 schemas
export const apiV2Schema = z.object({
  key: z.string().min(1, 'Chave da API é obrigatória'),
  action: z.string().min(1, 'Ação é obrigatória'),
})

// URL safety check
const PRIVATE_IP_RANGES = [
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2[0-9]|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
]

const BLOCKED_HOSTNAMES = [
  'localhost',
  'localhost.localdomain',
  '0.0.0.0',
  '[::1]',
]

const BLOCKED_PROTOCOLS = [
  'javascript:',
  'data:',
  'file:',
  'ftp:',
  'gopher:',
]

export function urlSafetyCheck(url: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(url)

    // Check blocked protocols
    for (const protocol of BLOCKED_PROTOCOLS) {
      if (parsed.protocol === protocol) {
        return { safe: false, reason: `Protocolo não permitido: ${parsed.protocol}` }
      }
    }

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Protocolo não permitido: ${parsed.protocol}` }
    }

    // Check blocked hostnames
    const hostname = parsed.hostname.toLowerCase()
    if (BLOCKED_HOSTNAMES.includes(hostname)) {
      return { safe: false, reason: 'Hostname não permitido' }
    }

    // Check private IP ranges
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return { safe: false, reason: 'Endereço IP privado não permitido' }
      }
    }

    return { safe: true }
  } catch {
    return { safe: false, reason: 'URL inválida' }
  }
}

// Type exports for convenience
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type AddFundsInput = z.infer<typeof addFundsSchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type TicketReplyInput = z.infer<typeof ticketReplySchema>
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>
export type CreateProviderInput = z.infer<typeof createProviderSchema>
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>
export type ApiV2Input = z.infer<typeof apiV2Schema>
