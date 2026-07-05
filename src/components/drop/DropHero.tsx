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
      {/* Date subtitle */}
      <p
        style={{
          fontSize: '13px',
          color: '#888',
          letterSpacing: '0.5px',
          marginBottom: '10px',
          textTransform: 'uppercase',
        }}
      >
        {formatDropDate(drop.scheduled_at)}
      </p>

      {/* Title */}
      <h1
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '32px',
          fontWeight: 700,
          lineHeight: 1.2,
          color: '#f5f5f5',
          margin: '0 0 16px',
          letterSpacing: '-0.5px',
        }}
      >
        {drop.title}
      </h1>

      {/* Gradient divider */}
      <div
        style={{
          width: '40px',
          height: '2px',
          background: 'linear-gradient(135deg, #EA580C, #DB2877)',
          borderRadius: '2px',
          marginBottom: '20px',
        }}
      />

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          background: '#141414',
          border: '1px solid #1e1e1e',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        {[
          { label: 'Total Items', value: totalItems },
          { label: 'Sold', value: soldCount },
          { label: 'Available', value: available },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              flex: 1,
              padding: '12px 8px',
              textAlign: 'center',
              borderRight: i < 2 ? '1px solid #1e1e1e' : 'none',
            }}
          >
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: i === 1 ? '#888' : i === 2 ? '#DB2877' : '#f5f5f5',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              {stat.value}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {drop.description && (
        <p
          style={{
            fontSize: '14px',
            color: '#666',
            lineHeight: 1.6,
            marginTop: '16px',
            marginBottom: 0,
          }}
        >
          {drop.description}
        </p>
      )}
    </div>
  )
}
