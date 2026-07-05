import { DropEventItem, DropProduct, DropSellerProfile, DropEvent } from '@/lib/types'
import { formatINR, buildWhatsAppUrl } from '@/lib/utils'

interface ItemCardProps {
  item: DropEventItem
  product: DropProduct
  seller: DropSellerProfile
  drop: DropEvent
}

export default function ItemCard({ item, product, seller, drop }: ItemCardProps) {
  const photo = product.photos?.[0] ?? null
  const isSold = item.status === 'sold'
  const isLive = item.status === 'live'
  const isUpcoming = item.status === 'upcoming'

  const waMessage = `Hi! I want to buy from Reelto Drop: ${drop.title} | Item ${item.sort_order} – ${product.name} | ${formatINR(item.starting_bid)}. Please confirm.`
  const waUrl = buildWhatsAppUrl(seller.whatsapp_number, waMessage)

  /* ─── Card container styles ─── */
  const cardStyle: React.CSSProperties = {
    background: '#141414',
    border: isLive
      ? '1px solid #DB2877'
      : '1px solid #1e1e1e',
    borderRadius: '16px',
    overflow: 'hidden',
    opacity: isSold ? 0.45 : 1,
    boxShadow: isLive
      ? '0 0 0 1px rgba(219,40,119,0.2), 0 8px 32px rgba(219,40,119,0.1)'
      : 'none',
    marginBottom: '16px',
    transition: 'box-shadow 0.2s',
  }

  /* ─── Status tag ─── */
  const statusTag = isSold
    ? { label: 'Sold', bg: '#1a1a1a', color: '#666' }
    : isLive
    ? { label: '⚡ Now Live', bg: 'rgba(219,40,119,0.15)', color: '#DB2877' }
    : { label: 'Up Next', bg: '#1a1a1a', color: '#555' }

  /* ─── Photo filter ─── */
  const imgFilter = isUpcoming ? 'blur(8px) brightness(0.3)' : 'none'

  /* ─── Price display ─── */
  const priceDisplay = isSold
    ? `Sold ${formatINR(item.winning_bid_amount ?? item.starting_bid)}`
    : isUpcoming
    ? '₹ —'
    : formatINR(item.starting_bid)

  return (
    <div style={cardStyle}>
      {/* Photo */}
      <div
        style={{
          position: 'relative',
          aspectRatio: '4/3',
          overflow: 'hidden',
          background: '#1a1a1a',
        }}
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              filter: imgFilter,
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              filter: imgFilter,
            }}
          >
            🪡
          </div>
        )}

        {/* Item number — top left */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.7)',
            color: '#ccc',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            borderRadius: '6px',
            padding: '3px 8px',
            backdropFilter: 'blur(4px)',
          }}
        >
          {String(item.sort_order).padStart(2, '0')}
        </span>

        {/* Status tag — top right */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: statusTag.bg,
            color: statusTag.color,
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '6px',
            padding: '3px 8px',
            border: isLive ? '1px solid rgba(219,40,119,0.4)' : '1px solid #242424',
            backdropFilter: 'blur(4px)',
          }}
        >
          {statusTag.label}
        </span>
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px' }}>
        {/* Product name */}
        <h3
          style={{
            fontFamily: 'var(--font-playfair), serif',
            fontSize: '18px',
            fontWeight: 700,
            color: isSold ? '#666' : '#f0f0f0',
            margin: '0 0 6px',
            lineHeight: 1.25,
          }}
        >
          {product.name}
        </h3>

        {/* Description + fabric */}
        {(product.description || product.fabric) && (
          <p
            style={{
              fontSize: '12px',
              color: '#555',
              margin: '0 0 14px',
              lineHeight: 1.5,
            }}
          >
            {[product.description, product.fabric].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Price row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          {/* Price */}
          <div>
            <div
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: isSold ? '#555' : isLive ? '#f5f5f5' : '#444',
                fontFamily: 'var(--font-inter), sans-serif',
              }}
            >
              {priceDisplay}
            </div>
            {isLive && (
              <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>
                incl. shipping
              </div>
            )}
          </div>

          {/* Action button */}
          {isSold ? (
            <button
              disabled
              style={{
                background: '#1a1a1a',
                color: '#444',
                border: '1px solid #242424',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'not-allowed',
                flexShrink: 0,
              }}
            >
              Sold Out
            </button>
          ) : isLive ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: 'linear-gradient(135deg, #EA580C, #DB2877)',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'none',
                flexShrink: 0,
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Buy Now
            </a>
          ) : (
            <button
              disabled
              style={{
                background: '#1a1a1a',
                color: '#333',
                border: '1px solid #242424',
                borderRadius: '10px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'not-allowed',
                flexShrink: 0,
              }}
            >
              Upcoming
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
