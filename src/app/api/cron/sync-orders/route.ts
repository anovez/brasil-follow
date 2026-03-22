import { NextRequest, NextResponse } from 'next/server'
import { ProviderManager } from '@/lib/providers/provider-manager'

export async function POST(request: NextRequest) {
  try {
    // Verify CRON_SECRET
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = await ProviderManager.syncAllActiveOrders()

    const summary = {
      total: results.length,
      completed: results.filter((r: any) => r.status === 'COMPLETED').length,
      partial: results.filter((r: any) => r.status === 'PARTIAL').length,
      cancelled: results.filter((r: any) => r.status === 'CANCELLED').length,
      errors: results.filter((r: any) => r.error).length,
    }

    return NextResponse.json({
      success: true,
      summary,
      results,
    })
  } catch (error) {
    console.error('Sync orders cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
