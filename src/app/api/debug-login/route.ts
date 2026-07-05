import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  // Raw fetch directly to PostgREST — bypasses JS client entirely
  const res = await fetch(`${url}/rest/v1/drop_seller_profiles?phone=eq.919742335657&select=id,display_name,phone`, {
    headers: {
      'apikey': key!,
      'Authorization': `Bearer ${key}`,
    },
  })

  const body = await res.text()

  return NextResponse.json({
    status: res.status,
    body: JSON.parse(body),
  })
}
