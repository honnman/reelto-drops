'use server'
import { supabaseAdmin } from '@/lib/supabase'

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function sendOtpAction(
  phone: string
): Promise<{ success: boolean; devOtp?: string; error?: string }> {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.length === 10 ? '91' + digits : digits

  const { data: sellerData } = await supabaseAdmin
    .from('drop_seller_profiles')
    .select('id')
    .eq('phone', normalized)
    .maybeSingle()

  if (!sellerData) {
    return { success: false, error: 'No seller account found for this number. Contact Reelto to get listed.' }
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpHash = await hashOtp(otp)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabaseAdmin.from('drop_seller_sessions').insert({
    drop_seller_id: sellerData.id,
    otp_hash: otpHash,
    otp_expires_at: expiresAt,
    is_otp_used: false,
  })

  console.log(`[DEV] OTP for ${normalized}: ${otp}`)

  // Return OTP to display on screen (dev only — remove when Interakt is wired)
  return { success: true, devOtp: otp }
}

export async function verifyOtpAction(
  phone: string,
  otp: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.length === 10 ? '91' + digits : digits

  const { data: seller } = await supabaseAdmin
    .from('drop_seller_profiles')
    .select('id')
    .eq('phone', normalized)
    .single()

  if (!seller) return { success: false, error: 'Session expired. Please try again.' }

  const otpHash = await hashOtp(otp)

  const { data: session } = await supabaseAdmin
    .from('drop_seller_sessions')
    .select('id')
    .eq('drop_seller_id', seller.id)
    .eq('otp_hash', otpHash)
    .eq('is_otp_used', false)
    .gt('otp_expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!session) return { success: false, error: 'Invalid or expired OTP. Please try again.' }

  await supabaseAdmin
    .from('drop_seller_sessions')
    .update({ is_otp_used: true })
    .eq('id', session.id)

  const token = crypto.randomUUID()
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabaseAdmin.from('drop_seller_sessions').insert({
    drop_seller_id: seller.id,
    token,
    token_expires_at: tokenExpiry,
    is_otp_used: true,
  })

  return { success: true, token }
}
