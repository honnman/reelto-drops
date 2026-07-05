import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const { data, error } = await supabaseAdmin.rpc('get_seller_by_phone', { p_phone: '919742335657' })

  return NextResponse.json({
    url_set: !!url,
    key_set: !!key,
    rpc_result: data,
    error: error?.message ?? null,
  })
}
