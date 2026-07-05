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

  const { data: sellers, error } = await supabaseAdmin.rpc('get_seller_by_phone', { p_phone: normalized })

  if (error || !sellers || sellers.length === 0) {
    return { success: false, error: 'No seller account found for this number. Contact Reelto to get listed.' }
  }

  const seller = sellers[0]
  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const otpHash = await hashOtp(otp)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  await supabaseAdmin.rpc('insert_otp_session', {
    p_seller_id: seller.id,
    p_otp_hash: otpHash,
    p_expires_at: expiresAt,
  })

  console.log(`[DEV] OTP for ${normalized}: ${otp}`)

  return { success: true, devOtp: otp }
}

export async function verifyOtpAction(
  phone: string,
  otp: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.length === 10 ? '91' + digits : digits

  const { data: sellers } = await supabaseAdmin.rpc('get_seller_by_phone', { p_phone: normalized })
  if (!sellers || sellers.length === 0) return { success: false, error: 'Session expired. Please try again.' }

  const seller = sellers[0]
  const otpHash = await hashOtp(otp)

  const { data: sessions } = await supabaseAdmin.rpc('verify_otp_session', {
    p_seller_id: seller.id,
    p_otp_hash: otpHash,
  })

  if (!sessions || sessions.length === 0) {
    return { success: false, error: 'Invalid or expired OTP. Please try again.' }
  }

  await supabaseAdmin.rpc('mark_otp_used', { p_session_id: sessions[0].id })

  const token = crypto.randomUUID()
  const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabaseAdmin.rpc('insert_auth_token', {
    p_seller_id: seller.id,
    p_token: token,
    p_expires_at: tokenExpiry,
  })

  return { success: true, token }
}
