import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  const { data, error } = await supabaseAdmin
    .from('drop_seller_profiles')
    .select('id, phone, display_name')
    .limit(5)

  return NextResponse.json({
    url_set: !!url,
    key_set: !!key,
    key_prefix: key ? key.slice(0, 20) + '...' : null,
    rows: data,
    error: error?.message ?? null,
  })
}
