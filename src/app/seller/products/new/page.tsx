'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { supabaseAdmin } from '@/lib/supabase'
import SellerNav from '@/components/seller/SellerNav'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'
const BUCKET = 'drop-product-images'

export default function NewProductPage() {
  const router = useRouter()
  const { seller, loading: authLoading } = useSellerAuth()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [fabric, setFabric] = useState('')
  const [category, setCategory] = useState('')
  const [storePrice, setStorePrice] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, 8)
    const newFiles = [...files, ...picked].slice(0, 8)
    setFiles(newFiles)
    const urls = newFiles.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
  }

  function removeFile(i: number) {
    const newFiles = files.filter((_, idx) => idx !== i)
    setFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  async function save() {
    if (!seller || !name.trim()) return
    setError('')
    setSaving(true)

    // Upload photos
    const photoUrls: string[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const path = `${seller.id}/${Date.now()}_${i}_${file.name.replace(/[^a-z0-9._]/gi, '_')}`
      const { error: uploadErr } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(path, file, { upsert: false })

      if (!uploadErr) {
        const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
        photoUrls.push(urlData.publicUrl)
      }
    }

    // Insert product
    const { error: insertErr } = await supabaseAdmin.from('drop_products').insert({
      drop_seller_id: seller.id,
      source: seller.type,
      name: name.trim(),
      description: description.trim() || null,
      fabric: fabric.trim() || null,
      category: category.trim() || null,
      store_price: storePrice ? Math.round(parseFloat(storePrice)) : null,
      photos: photoUrls,
      is_active: true,
    })

    setSaving(false)
    if (insertErr) { setError(insertErr.message); return }
    router.push('/seller/products')
  }

  if (authLoading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f' }}>
      <SellerNav />
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '28px 20px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', fontWeight: 700, color: '#f0f0f0', marginBottom: '24px' }}>
          Add Product
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Photos */}
          <div>
            <label style={labelStyle}>Photos (up to 8)</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {previews.map((url, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    background: '#1a1a1a',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => removeFile(i)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.7)',
                      color: '#ccc',
                      border: 'none',
                      fontSize: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {previews.length < 8 && (
                <button
                  onClick={() => fileRef.current?.click()}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '8px',
                    border: '1px dashed #2e2e2e',
                    background: 'transparent',
                    color: '#444',
                    cursor: 'pointer',
                    fontSize: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  +
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={onFilePick}
            />
          </div>

          <Field label="Product name *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Banarasi Silk — Crimson Gold"
              style={inputStyle}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Weave, occasion, blouse piece details..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Field label="Fabric">
              <input
                type="text"
                value={fabric}
                onChange={(e) => setFabric(e.target.value)}
                placeholder="e.g. Pure Silk"
                style={inputStyle}
              />
            </Field>
            <Field label="Category">
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Bridal"
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="Store price (₹)">
            <input
              type="number"
              value={storePrice}
              onChange={(e) => setStorePrice(e.target.value)}
              placeholder="e.g. 4500"
              style={inputStyle}
            />
          </Field>

          {error && <p style={{ color: '#ef4444', fontSize: '13px' }}>{error}</p>}

          <button
            onClick={save}
            disabled={!name.trim() || saving}
            style={{
              background: !name.trim() || saving ? '#222' : GRAD,
              color: !name.trim() || saving ? '#444' : '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '15px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: !name.trim() || saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#666',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#141414',
  border: '1px solid #242424',
  borderRadius: '10px',
  padding: '12px 14px',
  color: '#e5e5e5',
  fontSize: '15px',
  outline: 'none',
}
