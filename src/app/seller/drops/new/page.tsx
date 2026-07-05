'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { createDropAction } from '@/app/seller/actions'
import { slugify } from '@/lib/utils'
import SellerNav from '@/components/seller/SellerNav'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

export default function NewDropPage() {
  const router = useRouter()
  const { seller, loading } = useSellerAuth()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [slug, setSlug] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function onTitleChange(v: string) {
    setTitle(v)
    setSlug(slugify(v))
  }

  async function create() {
    if (!seller || !title.trim() || !slug || !scheduledAt) return
    setError('')
    setSaving(true)

    const result = await createDropAction(seller.id, {
      title: title.trim(),
      description: description.trim() || null,
      slug,
      scheduled_at: new Date(scheduledAt).toISOString(),
    })

    setSaving(false)
    if (result.error || !result.drop) { setError(result.error ?? 'Failed to create'); return }
    router.push(`/seller/drops/${result.drop.id}`)
  }

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', fontWeight: 700, color: '#1a1a1a', marginBottom: '24px' }}>
          New Drop
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <Field label="Drop title *">
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Weekend Kanjivaram Drop"
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's special about this drop?"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <Field label="Slug (URL) *">
            <div style={{ display: 'flex', alignItems: 'center', ...fieldBox }}>
              <span style={{ color: '#b8a898', padding: '12px 0 12px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}>
                drop.reelto.in/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="weekend-kanjivaram-drop"
                style={{ ...inputStyle, paddingLeft: '4px', border: 'none', background: 'transparent' }}
              />
            </div>
          </Field>

          <Field label="Scheduled date & time *">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              style={{ ...inputStyle, colorScheme: 'light' }}
            />
          </Field>

          {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}

          <button
            onClick={create}
            disabled={!title.trim() || !slug || !scheduledAt || saving}
            style={{
              background: (!title.trim() || !slug || !scheduledAt || saving) ? '#e8e0d8' : GRAD,
              color: (!title.trim() || !slug || !scheduledAt || saving) ? '#b8a898' : '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: (!title.trim() || !slug || !scheduledAt || saving) ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {saving && <Spinner />}
            Create Drop & Add Items →
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', color: '#9a8f87', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Spinner() {
  return (
    <>
      <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  )
}

const fieldBox: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e8e0d8',
  borderRadius: '10px',
  overflow: 'hidden',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#fff',
  border: '1px solid #e8e0d8',
  borderRadius: '10px',
  padding: '12px 14px',
  color: '#1a1a1a',
  fontSize: '15px',
  outline: 'none',
}
