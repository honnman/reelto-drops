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
        borderBottom: '1px solid #1e1e1e',
        position: 'sticky',
        top: 0,
        background: 'rgba(15,15,15,0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10,
      }}
    >
      {/* Left: Reelto wordmark */}
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

      {/* Center: Drop badge */}
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

      {/* Right: seller + live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontSize: '13px', color: '#aaa', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              animation: 'pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.4); }
          50% { opacity: 0.8; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
      `}</style>
    </div>
  )
}
