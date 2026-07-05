'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

export default function SellerDropsPage() {
  const { seller, loading } = useSellerAuth()
  const [drops, setDrops] = useState<DropEvent[]>([])

  useEffect(() => {
    if (!seller) return
    supabaseAdmin
      .from('drop_events')
      .select('*')
      .eq('drop_seller_id', seller.id)
      .order('scheduled_at', { ascending: false })
      .then(({ data }) => setDrops((data as DropEvent[]) ?? []))
  }, [seller])

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '26px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>My Drops</h1>
          <Link href="/seller/drops/new" style={{ background: GRAD, color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '9px 18px', fontSize: '13px', fontWeight: 700 }}>
            + New Drop
          </Link>
        </div>

        {drops.length === 0 ? (
          <p style={{ color: '#444', fontSize: '14px' }}>No drops yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drops.map((d) => (
              <Link key={d.id} href={`/seller/drops/${d.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '12px', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: '14px', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</p>
                    <p style={{ color: '#9a8f87', fontSize: '12px', margin: 0 }}>{new Date(d.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · {d.total_items ?? 0} items</p>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, background: '#f5f0ea', color: '#9a8f87', borderRadius: '6px', padding: '3px 8px', textTransform: 'capitalize', flexShrink: 0 }}>{d.status}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
