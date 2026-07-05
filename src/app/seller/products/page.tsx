'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { getSellerProductsAction } from '@/app/seller/actions'
import { DropProduct } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

export default function SellerProductsPage() {
  const { seller, loading } = useSellerAuth()
  const [products, setProducts] = useState<DropProduct[]>([])

  useEffect(() => {
    if (!seller) return
    getSellerProductsAction(seller.id).then(setProducts)
  }, [seller])

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>My Products</h1>
          <Link href="/seller/products/new" style={{ background: GRAD, color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}>
            + Add Product
          </Link>
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ color: '#b8a898', fontSize: '14px', marginBottom: '16px' }}>No products yet.</p>
            <Link href="/seller/products/new" style={{ background: GRAD, color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '10px 20px', fontSize: '14px', fontWeight: 700 }}>
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {products.map((p) => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ aspectRatio: '1', background: '#f5f0ea', overflow: 'hidden' }}>
                  {p.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photos[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>🪡</div>
                  )}
                </div>
                <div style={{ padding: '10px 12px' }}>
                  <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: '13px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  {p.fabric && <p style={{ color: '#9a8f87', fontSize: '11px', margin: 0 }}>{p.fabric}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
