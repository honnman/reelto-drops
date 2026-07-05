'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'
import { formatINR } from '@/lib/utils'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

export default function SellerDashboardPage() {
  const { seller, loading } = useSellerAuth()
  const [drops, setDrops] = useState<DropEvent[]>([])
  const [dropsLoading, setDropsLoading] = useState(true)

  useEffect(() => {
    if (!seller) return
    supabaseAdmin
      .from('drop_events')
      .select('*')
      .eq('drop_seller_id', seller.id)
      .order('scheduled_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setDrops((data as DropEvent[]) ?? [])
        setDropsLoading(false)
      })
  }, [seller])

  if (loading) return <LoadingScreen />

  const totalDrops = drops.length
  const totalSold = drops.reduce((sum, d) => sum + (d.total_sold ?? 0), 0)
  const totalGmv = drops.reduce((sum, d) => sum + (d.total_gmv ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f' }}>
      <SellerNav />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>
        {/* Welcome */}
        <h1
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '26px',
            fontWeight: 700,
            color: '#f0f0f0',
            marginBottom: '4px',
          }}
        >
          Welcome back, {seller?.display_name}
        </h1>
        <p style={{ color: '#555', fontSize: '13px', marginBottom: '28px' }}>
          Here&apos;s your drop summary
        </p>

        {/* Stats cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { label: 'Total Drops', value: totalDrops, color: '#f0f0f0' },
            { label: 'Items Sold', value: totalSold, color: '#f0f0f0' },
            { label: 'Total GMV', value: formatINR(totalGmv), color: '#DB2877' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#141414',
                border: '1px solid #1e1e1e',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 700,
                  color: stat.color,
                  marginBottom: '4px',
                }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Quick action */}
        <Link href="/seller/drops/new" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: GRAD,
              borderRadius: '14px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              marginBottom: '28px',
            }}
          >
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>
                + Create New Drop
              </div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>
                Schedule your next live auction
              </div>
            </div>
            <span style={{ color: '#fff', fontSize: '20px' }}>›</span>
          </div>
        </Link>

        {/* Recent drops */}
        <h2 style={{ fontSize: '14px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
          Recent Drops
        </h2>

        {dropsLoading ? (
          <p style={{ color: '#444', fontSize: '13px' }}>Loading…</p>
        ) : drops.length === 0 ? (
          <p style={{ color: '#444', fontSize: '13px' }}>No drops yet. Create your first one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drops.map((drop) => (
              <Link key={drop.id} href={`/seller/drops/${drop.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#141414',
                    border: '1px solid #1e1e1e',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#e0e0e0', fontWeight: 600, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {drop.title}
                    </p>
                    <p style={{ color: '#555', fontSize: '12px' }}>
                      {new Date(drop.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{drop.total_items ?? 0} items
                    </p>
                  </div>
                  <StatusBadge status={drop.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: DropEvent['status'] }) {
  const map: Record<string, { bg: string; color: string }> = {
    live: { bg: 'rgba(219,40,119,0.15)', color: '#DB2877' },
    scheduled: { bg: 'rgba(234,88,12,0.15)', color: '#EA580C' },
    ended: { bg: '#1a1a1a', color: '#555' },
    draft: { bg: '#1a1a1a', color: '#444' },
    cancelled: { bg: '#1a1a1a', color: '#444' },
  }
  const s = map[status] ?? map.draft
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: '11px',
        fontWeight: 700,
        borderRadius: '6px',
        padding: '3px 8px',
        textTransform: 'capitalize',
        flexShrink: 0,
      }}
    >
      {status}
    </span>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#444', fontSize: '14px' }}>Loading…</div>
    </div>
  )
}
