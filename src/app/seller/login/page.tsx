'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function hashOtp(otp: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(otp)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateToken(): string {
  return crypto.randomUUID()
}

export default function SellerLoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [devOtp, setDevOtp] = useState('')

  /* ─── Step 1: Send OTP ─── */
  async function sendOtp() {
    setError('')
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 10) { setError('Enter a valid 10-digit number'); return }

    setLoading(true)
    const normalized = digits.length === 10 ? '91' + digits : digits

    // Check seller exists
    const { data: sellerData } = await supabaseAdmin
      .from('drop_seller_profiles')
      .select('id')
      .eq('phone', normalized)
      .maybeSingle()

    if (!sellerData) {
      setError("No seller account found for this number. Contact Reelto to get listed.")
      setLoading(false)
      return
    }

    const generatedOtp = generateOtp()
    const otpHash = await hashOtp(generatedOtp)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    // Store OTP session
    await supabaseAdmin.from('drop_seller_sessions').insert({
      drop_seller_id: sellerData.id,
      otp_hash: otpHash,
      otp_expires_at: expiresAt,
      is_otp_used: false,
    })

    // Phase 1: show OTP on screen (Interakt integration later)
    console.log(`[DEV] OTP for ${normalized}: ${generatedOtp}`)
    setDevOtp(generatedOtp)

    setLoading(false)
    setStep('otp')
  }

  /* ─── Step 2: Verify OTP ─── */
  async function verifyOtp() {
    setError('')
    setLoading(true)
    const digits = phone.replace(/\D/g, '')
    const normalized = digits.length === 10 ? '91' + digits : digits

    const { data: seller } = await supabaseAdmin
      .from('drop_seller_profiles')
      .select('id')
      .eq('phone', normalized)
      .single()

    if (!seller) { setError('Session expired. Please try again.'); setLoading(false); return }

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

    if (!session) {
      setError('Invalid or expired OTP. Please try again.')
      setLoading(false)
      return
    }

    // Mark OTP used
    await supabaseAdmin
      .from('drop_seller_sessions')
      .update({ is_otp_used: true })
      .eq('id', session.id)

    // Create auth token
    const token = generateToken()
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    await supabaseAdmin.from('drop_seller_sessions').insert({
      drop_seller_id: seller.id,
      token,
      token_expires_at: tokenExpiry,
      is_otp_used: true,
    })

    localStorage.setItem('drop_seller_token', token)
    router.push('/seller/dashboard')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#fdf8f3',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#fff',
          border: '1px solid #e8e0d8',
          borderRadius: '20px',
          padding: '32px 28px',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <span
            style={{
              fontFamily: 'var(--font-playfair), serif',
              fontSize: '28px',
              fontWeight: 700,
              background: GRAD,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Reelto Drop
          </span>
          <p style={{ color: '#9a8f87', fontSize: '13px', marginTop: '6px' }}>
            Seller Portal
          </p>
        </div>

        {step === 'phone' ? (
          <>
            <label style={labelStyle}>Mobile number</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #e8e0d8',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '16px',
              }}
            >
              <span
                style={{
                  padding: '12px 14px',
                  background: '#faf5f0',
                  color: '#9a8f87',
                  fontSize: '14px',
                  borderRight: '1px solid #e8e0d8',
                  flexShrink: 0,
                }}
              >
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="98765 43210"
                style={inputStyle}
              />
            </div>
            {error && <p style={errorStyle}>{error}</p>}
            <GradButton onClick={sendOtp} loading={loading} disabled={phone.replace(/\D/g,'').length < 10}>
              Send OTP
            </GradButton>
          </>
        ) : (
          <>
            {devOtp && (
              <div style={{ background: '#faf5f0', border: '1px solid #e8e0d8', borderRadius: '10px', padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#9a8f87' }}>
                Dev OTP: <strong style={{ color: '#DB2877', letterSpacing: '4px', fontFamily: 'monospace' }}>{devOtp}</strong>
              </div>
            )}
            <p style={{ fontSize: '13px', color: '#9a8f87', marginBottom: '16px' }}>
              OTP sent to <strong style={{ color: '#1a1a1a' }}>+91 {phone}</strong>.{' '}
              <button
                onClick={() => { setStep('phone'); setOtp('') }}
                style={{ background: 'none', border: 'none', color: '#DB2877', cursor: 'pointer', fontSize: '13px', padding: 0 }}
              >
                Change
              </button>
            </p>
            <label style={labelStyle}>Enter OTP</label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              style={{
                ...inputStyle,
                textAlign: 'center',
                fontSize: '24px',
                letterSpacing: '8px',
                border: '1px solid #e8e0d8',
                borderRadius: '10px',
                marginBottom: '16px',
                width: '100%',
              }}
            />
            {error && <p style={errorStyle}>{error}</p>}
            <GradButton onClick={verifyOtp} loading={loading} disabled={otp.length < 6}>
              Verify & Login
            </GradButton>
          </>
        )}
      </div>
    </div>
  )
}

/* ─── Shared sub-components ─── */

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#9a8f87',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  background: 'transparent',
  border: 'none',
  outline: 'none',
  color: '#1a1a1a',
  fontSize: '16px',
  padding: '12px 14px',
  width: '100%',
}

const errorStyle: React.CSSProperties = {
  color: '#ef4444',
  fontSize: '13px',
  marginBottom: '12px',
}

function GradButton({
  onClick,
  loading,
  disabled,
  children,
}: {
  onClick: () => void
  loading: boolean
  disabled: boolean
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        background: disabled || loading ? '#e8e0d8' : GRAD,
        color: disabled || loading ? '#b8a898' : '#fff',
        border: 'none',
        borderRadius: '10px',
        padding: '14px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'opacity 0.15s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}
    >
      {loading && (
        <span
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid rgba(255,255,255,0.3)',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
      )}
      {children}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  )
}
