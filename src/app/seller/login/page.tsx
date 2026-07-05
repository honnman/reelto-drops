'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOtpAction, verifyOtpAction } from './actions'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

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
    const result = await sendOtpAction(phone)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    if (result.devOtp) setDevOtp(result.devOtp)
    setStep('otp')
  }

  /* ─── Step 2: Verify OTP ─── */
  async function verifyOtp() {
    setError('')
    setLoading(true)
    const result = await verifyOtpAction(phone, otp)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }

    localStorage.setItem('drop_seller_token', result.token!)
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
                onClick={() => { setStep('phone'); setOtp(''); setDevOtp('') }}
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
