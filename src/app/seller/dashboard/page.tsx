'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSellerAuth } from '@/lib/useSellerAuth'
import { getSellerDropsRecentAction } from '@/app/seller/actions'
import { DropEvent } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'
import { formatINR } from '@/lib/utils'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

export default function SellerDashboardPage() {
  const { seller, loading, authError } = useSellerAuth()
  const [drops, setDrops] = useState<DropEvent[]>([])
  const [dropsLoading, setDropsLoading] = useState(true)

  useEffect(() => {
    if (!seller) return
    getSellerDropsRecentAction(seller.id).then((data) => {
      setDrops(data)
      setDropsLoading(false)
    })
  }, [seller])

  if (loading) return <LoadingScreen error={authError} />

  const totalDrops = drops.length
  const totalSold = drops.reduce((sum, d) => sum + (d.total_sold ?? 0), 0)
  const totalGmv = drops.reduce((sum, d) => sum + (d.total_gmv ?? 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>
        <h1
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '26px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '4px',
          }}
        >
          Welcome back, {seller?.display_name}
        </h1>
        <p style={{ color: '#9a8f87', fontSize: '13px', marginBottom: '28px' }}>
          Here&apos;s your drop summary
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          {[
            { label: 'Total Drops', value: totalDrops, color: '#1a1a1a' },
            { label: 'Items Sold', value: totalSold, color: '#1a1a1a' },
            { label: 'Total GMV', value: formatINR(totalGmv), color: '#DB2877' },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: '#fff',
                border: '1px solid #e8e0d8',
                borderRadius: '14px',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color, marginBottom: '4px' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '11px', color: '#b8a898', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

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
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>+ Create New Drop</div>
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '2px' }}>
                Schedule your next live auction
              </div>
            </div>
            <span style={{ color: '#fff', fontSize: '20px' }}>›</span>
          </div>
        </Link>

        <h2 style={{ fontSize: '14px', color: '#b8a898', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '14px' }}>
          Recent Drops
        </h2>

        {dropsLoading ? (
          <p style={{ color: '#b8a898', fontSize: '13px' }}>Loading…</p>
        ) : drops.length === 0 ? (
          <p style={{ color: '#b8a898', fontSize: '13px' }}>No drops yet. Create your first one!</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {drops.map((drop) => (
              <Link key={drop.id} href={`/seller/drops/${drop.id}`} style={{ textDecoration: 'none' }}>
                <div
                  style={{
                    background: '#fff',
                    border: '1px solid #e8e0d8',
                    borderRadius: '12px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: '#1a1a1a', fontWeight: 600, fontSize: '14px', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {drop.title}
                    </p>
                    <p style={{ color: '#9a8f87', fontSize: '12px' }}>
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
    ended: { bg: '#f5f0ea', color: '#9a8f87' },
    draft: { bg: '#f5f0ea', color: '#b8a898' },
    cancelled: { bg: '#f5f0ea', color: '#b8a898' },
  }
  const s = map[status] ?? map.draft
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px', textTransform: 'capitalize', flexShrink: 0 }}>
      {status}
    </span>
  )
}

function LoadingScreen({ error }: { error: string | null }) {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
      {error ? (
        <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '12px', padding: '16px 20px', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ color: '#ef4444', fontSize: '13px', marginBottom: '8px', fontWeight: 600 }}>Auth error</p>
          <p style={{ color: '#9a8f87', fontSize: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>{error}</p>
        </div>
      ) : (
        <div style={{ color: '#b8a898', fontSize: '14px' }}>Loading…</div>
      )}
    </div>
  )
}
