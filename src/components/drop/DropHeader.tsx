import { DropEvent, DropSellerProfile } from '@/lib/types'

interface DropHeaderProps {
  drop: DropEvent
  seller: DropSellerProfile
}

export default function DropHeader({ drop, seller }: DropHeaderProps) {
  const isLive = drop.status === 'live'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 20px',
        borderBottom: '1px solid #e8e0d8',
        position: 'sticky',
        top: 0,
        background: 'rgba(253,248,243,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10,
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-playfair), serif',
          fontSize: '22px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #EA580C, #DB2877)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          letterSpacing: '-0.3px',
        }}
      >
        Reelto
      </span>

      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          color: '#DB2877',
          border: '1px solid #DB2877',
          borderRadius: '20px',
          padding: '3px 10px',
        }}
      >
        Drop
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', color: '#9a8f87', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {seller.display_name}
        </span>
        {isLive && (
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
