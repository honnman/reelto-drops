import { TrustedBuyer } from '@/lib/types'
import { maskPhone } from '@/lib/utils'

interface TrustedBiddersBoardProps {
  buyers: TrustedBuyer[]
}

export default function TrustedBiddersBoard({ buyers }: TrustedBiddersBoardProps) {
  if (!buyers || buyers.length === 0) return null

  return (
    <div
      style={{
        margin: '0 20px 24px',
        background: '#fff',
        border: '1px solid #e8e0d8',
        borderRadius: '16px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '16px' }}>⭐</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a', letterSpacing: '0.3px', textTransform: 'uppercase' }}>
          Reelto Trusted Bidders
        </span>
      </div>

      <div style={{ height: '1px', background: 'linear-gradient(90deg, #DB2877 0%, transparent 100%)', marginBottom: '12px', opacity: 0.3 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {buyers.map((buyer) => (
          <div key={buyer.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ fontSize: '10px', color: '#22c55e', flexShrink: 0 }}>🟢</span>
            <span style={{ fontFamily: 'monospace', color: '#4a4a4a', flex: 1, letterSpacing: '1px' }}>
              {maskPhone(buyer.phone)}
            </span>
            <span style={{ color: '#b8a898', fontSize: '12px' }}>{buyer.drops_attended ?? 0} drops</span>
            {buyer.is_verified && (
              <span style={{ fontSize: '11px', color: '#DB2877', fontWeight: 600 }}>✓ verified</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
