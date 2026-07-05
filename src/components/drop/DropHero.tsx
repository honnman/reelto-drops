import { DropEvent } from '@/lib/types'
import { formatDropDate } from '@/lib/utils'

interface DropHeroProps {
  drop: DropEvent
}

export default function DropHero({ drop }: DropHeroProps) {
  const soldCount = drop.total_sold ?? 0
  const totalItems = drop.total_items ?? 0
  const available = totalItems - soldCount

  return (
    <div style={{ padding: '28px 20px 20px' }}>
      <p style={{ fontSize: '13px', color: '#b8a898', letterSpacing: '0.5px', marginBottom: '10px', textTransform: 'uppercase' }}>
        {formatDropDate(drop.scheduled_at)}
      </p>

      <h1
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: 1.2,
          color: '#1a1a1a',
          margin: '0 0 16px',
          letterSpacing: '-0.5px',
        }}
      >
        {drop.title}
      </h1>

      <div
        style={{
          width: '40px',
          height: '2px',
          background: 'linear-gradient(135deg, #EA580C, #DB2877)',
          borderRadius: '2px',
          marginBottom: '20px',
        }}
      />

      <div
        style={{
          display: 'flex',
          background: '#fff',
          border: '1px solid #e8e0d8',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {[
          { label: 'Total Items', value: totalItems, color: '#1a1a1a' },
          { label: 'Sold', value: soldCount, color: '#9a8f87' },
          { label: 'Available', value: available, color: '#DB2877' },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: '12px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid #e8e0d8' : 'none',
            }}
          >
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#b8a898', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {drop.description && (
        <p style={{ fontSize: '14px', color: '#9a8f87', lineHeight: 1.6, marginTop: '16px', marginBottom: 0 }}>
          {drop.description}
        </p>
      )}
    </div>
  )
}
