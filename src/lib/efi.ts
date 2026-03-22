import EfiPay from 'sdk-node-apis-efi'
import { writeFileSync, existsSync } from 'fs'
import crypto from 'crypto'

// Decode certificate from Base64 env var and write to /tmp
function getCertPath(): string {
  const certPath = '/tmp/efi-cert.p12'
  if (!existsSync(certPath)) {
    const certBase64 = process.env.EFI_CERTIFICATE_BASE64
    if (!certBase64) throw new Error('EFI_CERTIFICATE_BASE64 not configured')
    const certBuffer = Buffer.from(certBase64, 'base64')
    writeFileSync(certPath, certBuffer)
  }
  return certPath
}

function getEfiClient() {
  return new EfiPay({
    sandbox: process.env.EFI_SANDBOX === 'true',
    client_id: process.env.EFI_CLIENT_ID!,
    client_secret: process.env.EFI_CLIENT_SECRET!,
    certificate: getCertPath(),
  })
}

// Generate unique txId (26-35 alphanumeric chars)
function generateTxId(): string {
  return crypto.randomBytes(16).toString('hex').substring(0, 32)
}

export async function createPixCharge(amount: number, description: string) {
  const efi = getEfiClient()
  const txid = generateTxId()

  const charge = await efi.pixCreateImmediateCharge({ txid }, {
    calendario: { expiracao: 1800 }, // 30 minutes
    valor: { original: amount.toFixed(2) },
    chave: process.env.EFI_PIX_KEY!,
    infoAdicionais: [{ nome: 'Plataforma', valor: 'Brasil Follow' }],
  })

  // Generate QR Code
  const qrCode = await efi.pixGenerateQRCode({ id: charge.loc.id })

  return {
    txid: charge.txid,
    pixCopiaECola: qrCode.qrcode,
    qrCodeBase64: qrCode.imagemQrcode,
    expiresAt: new Date(Date.now() + 1800 * 1000),
  }
}

export async function checkPixPayment(txid: string) {
  const efi = getEfiClient()
  try {
    const charge = await efi.pixDetailCharge({ txid })
    return {
      status: charge.status, // ATIVA, CONCLUIDA, REMOVIDA_PELO_USUARIO_RECEBEDOR, etc
      paid: charge.status === 'CONCLUIDA',
      e2eId: charge.pix?.[0]?.endToEndId || null,
      paidAmount: charge.pix?.[0]?.valor ? parseFloat(charge.pix[0].valor) : null,
    }
  } catch {
    return { status: 'ERROR', paid: false, e2eId: null, paidAmount: null }
  }
}
