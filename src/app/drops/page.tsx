import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function DropsPage() {
  const { data: drops } = await supabaseAdmin
    .from('drop_events')
    .select('*, drop_seller_profiles(display_name)')
    .in('status', ['live', 'scheduled'])
    .order('scheduled_at')

  const typedDrops = (drops ?? []) as (DropEvent & { drop_seller_profiles: { display_name: string } | null })[]
  const live = typedDrops.filter((d) => d.status === 'live')
  const upcoming = typedDrops.filter((d) => d.status === 'scheduled')

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', maxWidth: '480px', margin: '0 auto', padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '24px', fontWeight: 700, background: 'linear-gradient(135deg, #EA580C, #DB2877)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Reelto Drop
        </span>
        <Link href="/seller/login" style={{ color: '#555', fontSize: '13px', textDecoration: 'none' }}>
          Seller →
        </Link>
      </div>

      <div style={{ padding: '28px 20px 0' }}>
        {live.length > 0 && (
          <section style={{ marginBottom: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ width: '8px', height: '8px', background: '#DB2877', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
              <span style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>Live Now</span>
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
            </div>
            {live.map((d) => <DropCard key={d.id} drop={d} isLive />)}
          </section>
        )}

        <section>
          <p style={{ color: '#555', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', fontWeight: 600 }}>
            Upcoming Drops
          </p>
          {upcoming.length === 0 ? (
            <p style={{ color: '#333', fontSize: '14px' }}>No upcoming drops. Check back soon!</p>
          ) : (
            upcoming.map((d) => <DropCard key={d.id} drop={d} />)
          )}
        </section>
      </div>
    </div>
  )
}

function DropCard({ drop, isLive }: { drop: DropEvent & { drop_seller_profiles: { display_name: string } | null }; isLive?: boolean }) {
  return (
    <Link href={`/${drop.slug}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: '#141414',
        border: isLive ? '1px solid #DB2877' : '1px solid #1e1e1e',
        borderRadius: '14px',
        padding: '16px',
        marginBottom: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        boxShadow: isLive ? '0 0 0 1px rgba(219,40,119,0.1)' : 'none',
      }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(234,88,12,0.2), rgba(219,40,119,0.2))', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>🪡</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: '#e0e0e0', fontWeight: 600, fontSize: '15px', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{drop.title}</p>
          <p style={{ color: '#555', fontSize: '12px', margin: 0 }}>
            {drop.drop_seller_profiles?.display_name} · {new Date(drop.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </p>
        </div>
        {isLive && <span style={{ background: 'rgba(219,40,119,0.15)', color: '#DB2877', fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px', flexShrink: 0 }}>LIVE</span>}
        <span style={{ color: '#333', fontSize: '18px' }}>›</span>
      </div>
    </Link>
  )
}
