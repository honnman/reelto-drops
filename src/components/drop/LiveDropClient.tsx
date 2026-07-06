'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { DropEvent, DropEventItem, DropProduct, DropSellerProfile, TrustedBuyer } from '@/lib/types'
import { formatINR, buildWhatsAppUrl } from '@/lib/utils'
import DropHeader from '@/components/drop/DropHeader'
import DropHero from '@/components/drop/DropHero'
import TrustedBiddersBoard from '@/components/drop/TrustedBiddersBoard'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

interface ItemWithProduct extends DropEventItem {
  product: DropProduct
}

interface Props {
  drop: DropEvent
  seller: DropSellerProfile
  items: ItemWithProduct[]
  buyers: TrustedBuyer[]
}

interface BidEntry {
  id: string
  phone: string
  amount: number
  status: string
  created_at: string
}

interface ItemLiveState {
  current_bid: number | null
  bid_count: number
  status: DropEventItem['status']
  winning_bid_amount: number | null
}

export default function LiveDropClient({ drop, seller, items: initialItems, buyers }: Props) {
  // Live state per item: itemId -> live fields
  const [liveState, setLiveState] = useState<Record<string, ItemLiveState>>(() => {
    const map: Record<string, ItemLiveState> = {}
    for (const item of initialItems) {
      map[item.id] = {
        current_bid: item.current_bid,
        bid_count: item.bid_count,
        status: item.status,
        winning_bid_amount: item.winning_bid_amount,
      }
    }
    return map
  })

  // Bids feed for the currently live item
  const [bidFeed, setBidFeed] = useState<BidEntry[]>([])
  const [activeItemId, setActiveItemId] = useState<string | null>(null)

  // Bid form state
  const [phone, setPhone] = useState('')
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [bidError, setBidError] = useState('')
  const [bidSuccess, setBidSuccess] = useState('')

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    // Find the currently live item
    const liveItem = initialItems.find((i) => liveState[i.id]?.status === 'live')
    setActiveItemId(liveItem?.id ?? null)
  }, [liveState, initialItems])

  useEffect(() => {
    if (!activeItemId) return

    // Load initial bids for this item
    supabase.rpc('get_item_bids', { p_item_id: activeItemId, p_limit: 20 }).then(({ data }) => {
      setBidFeed((data as BidEntry[]) ?? [])
    })
  }, [activeItemId])

  useEffect(() => {
    // Subscribe to realtime changes
    const channel = supabase
      .channel(`drop:${drop.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'drop_bids', filter: `drop_event_id=eq.${drop.id}` },
        (payload) => {
          const bid = payload.new as BidEntry
          setBidFeed((prev) => [bid, ...prev].slice(0, 30))
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drop_event_items', filter: `drop_event_id=eq.${drop.id}` },
        (payload) => {
          const updated = payload.new as DropEventItem
          setLiveState((prev) => ({
            ...prev,
            [updated.id]: {
              current_bid: updated.current_bid,
              bid_count: updated.bid_count,
              status: updated.status,
              winning_bid_amount: updated.winning_bid_amount,
            },
          }))
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => { supabase.removeChannel(channel) }
  }, [drop.id])

  async function submitBid() {
    if (!activeItemId || !phone || !bidAmount) return
    setBidError('')
    setBidSuccess('')
    setBidding(true)

    const digits = phone.replace(/\D/g, '')
    const normalized = digits.length === 10 ? '91' + digits : digits
    const amount = Math.round(parseFloat(bidAmount))

    const { data, error } = await supabase.rpc('place_bid', {
      p_item_id: activeItemId,
      p_phone: normalized,
      p_amount: amount,
    })

    setBidding(false)

    if (error || !data?.success) {
      setBidError(data?.error ?? error?.message ?? 'Failed to place bid')
      return
    }

    setBidSuccess(`Bid of ${formatINR(amount)} placed!`)
    setBidAmount('')
    setTimeout(() => setBidSuccess(''), 3000)
  }

  const sellerWaUrl = buildWhatsAppUrl(
    seller.whatsapp_number,
    `Hi! I missed an item in ${drop.title}. Can you help?`
  )

  const liveItem = initialItems.find((i) => liveState[i.id]?.status === 'live')
  const currentBid = liveItem ? (liveState[liveItem.id]?.current_bid ?? liveItem.starting_bid) : null
  const minNextBid = currentBid ? currentBid + 1 : null

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3', maxWidth: '480px', margin: '0 auto' }}>
      <DropHeader drop={drop} seller={seller} />
      <DropHero drop={drop} />
      <TrustedBiddersBoard buyers={buyers} />

      <div style={{ padding: '0 20px' }}>
        {initialItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#b8a898', fontSize: '14px' }}>
            No items added yet. Check back soon!
          </div>
        ) : (
          initialItems.map((item) => {
            const live = liveState[item.id] ?? {
              current_bid: item.current_bid,
              bid_count: item.bid_count,
              status: item.status,
              winning_bid_amount: item.winning_bid_amount,
            }
            const isLive = live.status === 'live'
            const isSold = live.status === 'sold'
            const isUpcoming = live.status === 'upcoming'

            return (
              <ItemCardLive
                key={item.id}
                item={{ ...item, ...live }}
                product={item.product}
                isActiveForBid={isLive && item.id === activeItemId}
                bidFeed={isLive ? bidFeed : []}
                phone={phone}
                setPhone={setPhone}
                bidAmount={bidAmount}
                setBidAmount={setBidAmount}
                bidding={bidding}
                bidError={bidError}
                bidSuccess={bidSuccess}
                minNextBid={isLive ? minNextBid : null}
                onSubmitBid={submitBid}
              />
            )
          })
        )}
      </div>

      {/* Bottom WhatsApp CTA */}
      <div style={{ padding: '24px 20px 40px', textAlign: 'center', borderTop: '1px solid #e8e0d8', marginTop: '8px' }}>
        <p style={{ fontSize: '13px', color: '#9a8f87', marginBottom: '14px', lineHeight: 1.5 }}>
          Missed an item? Message the seller after the drop ends
        </p>
        <a
          href={sellerWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#22c55e', color: '#fff', textDecoration: 'none', borderRadius: '12px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
        >
          <WhatsAppIcon />
          WhatsApp {seller.display_name}
        </a>
      </div>
    </div>
  )
}

/* ─── Item card with live bid UI ─── */
function ItemCardLive({
  item,
  product,
  isActiveForBid,
  bidFeed,
  phone,
  setPhone,
  bidAmount,
  setBidAmount,
  bidding,
  bidError,
  bidSuccess,
  minNextBid,
  onSubmitBid,
}: {
  item: DropEventItem & { product?: DropProduct }
  product: DropProduct
  isActiveForBid: boolean
  bidFeed: BidEntry[]
  phone: string
  setPhone: (v: string) => void
  bidAmount: string
  setBidAmount: (v: string) => void
  bidding: boolean
  bidError: string
  bidSuccess: string
  minNextBid: number | null
  onSubmitBid: () => void
}) {
  const isSold = item.status === 'sold'
  const isLive = item.status === 'live'
  const isUpcoming = item.status === 'upcoming'
  const photo = product.photos?.[0] ?? null

  const currentBidDisplay = item.current_bid
    ? formatINR(item.current_bid)
    : formatINR(item.starting_bid)

  const statusTag = isSold
    ? { label: 'Sold', bg: '#f5f0ea', color: '#b8a898' }
    : isLive
    ? { label: '⚡ Now Live', bg: 'rgba(219,40,119,0.1)', color: '#DB2877' }
    : { label: 'Up Next', bg: '#f5f0ea', color: '#9a8f87' }

  return (
    <div
      style={{
        background: '#fff',
        border: isLive ? '1px solid #DB2877' : '1px solid #e8e0d8',
        borderRadius: '16px',
        overflow: 'hidden',
        opacity: isSold ? 0.5 : 1,
        boxShadow: isLive ? '0 0 0 1px rgba(219,40,119,0.2), 0 8px 32px rgba(219,40,119,0.1)' : 'none',
        marginBottom: '16px',
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: '#f5f0ea' }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', filter: isUpcoming ? 'blur(8px) brightness(0.3)' : 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', filter: isUpcoming ? 'blur(8px) brightness(0.3)' : 'none' }}>🪡</div>
        )}
        <span style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', color: '#ccc', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', borderRadius: '6px', padding: '3px 8px' }}>
          {String(item.sort_order).padStart(2, '0')}
        </span>
        <span style={{ position: 'absolute', top: '10px', right: '10px', background: statusTag.bg, color: statusTag.color, fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px', border: isLive ? '1px solid rgba(219,40,119,0.4)' : '1px solid #e8e0d8' }}>
          {statusTag.label}
        </span>
        {isLive && item.bid_count > 0 && (
          <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px' }}>
            {item.bid_count} bid{item.bid_count !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px' }}>
        <h3 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '18px', fontWeight: 700, color: isSold ? '#b8a898' : '#1a1a1a', margin: '0 0 4px', lineHeight: 1.25 }}>
          {product.name}
        </h3>
        {(product.description || product.fabric) && (
          <p style={{ fontSize: '12px', color: '#9a8f87', margin: '0 0 12px', lineHeight: 1.5 }}>
            {[product.description, product.fabric].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Price / bid row */}
        {isSold ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#b8a898', marginBottom: '2px' }}>Sold for</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#b8a898' }}>
                {formatINR(item.winning_bid_amount ?? item.starting_bid)}
              </div>
            </div>
            <span style={{ background: '#f5f0ea', color: '#b8a898', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}>Sold Out</span>
          </div>
        ) : isUpcoming ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#4a4a4a' }}>₹ —</div>
            <span style={{ background: '#f5f0ea', color: '#9a8f87', borderRadius: '10px', padding: '10px 20px', fontSize: '13px', fontWeight: 600 }}>Upcoming</span>
          </div>
        ) : isLive ? (
          <>
            {/* Current bid display */}
            <div style={{ background: 'rgba(219,40,119,0.05)', border: '1px solid rgba(219,40,119,0.15)', borderRadius: '12px', padding: '12px 14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#DB2877', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>
                    {item.current_bid ? 'Current Bid' : 'Starting Bid'}
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a', fontFamily: 'var(--font-inter), sans-serif' }}>
                    {currentBidDisplay}
                  </div>
                </div>
                {item.bid_count > 0 && (
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 700, color: '#DB2877' }}>{item.bid_count}</div>
                    <div style={{ fontSize: '11px', color: '#9a8f87' }}>bids</div>
                  </div>
                )}
              </div>
            </div>

            {/* Bid feed */}
            {bidFeed.length > 0 && (
              <div style={{ marginBottom: '14px', maxHeight: '120px', overflowY: 'auto' }}>
                {bidFeed.slice(0, 5).map((bid, i) => (
                  <div key={bid.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: i < 4 ? '1px solid #f5f0ea' : 'none' }}>
                    <span style={{ fontSize: '12px', color: '#9a8f87' }}>
                      {'•••' + bid.phone.slice(-4)}
                      {i === 0 && <span style={{ marginLeft: '6px', fontSize: '10px', background: 'rgba(219,40,119,0.1)', color: '#DB2877', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>Leading</span>}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: i === 0 ? '#DB2877' : '#9a8f87' }}>{formatINR(bid.amount)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bid form */}
            {isActiveForBid && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Your mobile number"
                  style={inputStyle}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9a8f87', fontSize: '15px' }}>₹</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      placeholder={minNextBid ? String(minNextBid) : ''}
                      min={minNextBid ?? 1}
                      style={{ ...inputStyle, paddingLeft: '28px' }}
                    />
                  </div>
                  <button
                    onClick={onSubmitBid}
                    disabled={bidding || !phone || phone.replace(/\D/g,'').length < 10 || !bidAmount || parseFloat(bidAmount) < (minNextBid ?? 1)}
                    style={{
                      background: (bidding || !phone || phone.replace(/\D/g,'').length < 10 || !bidAmount) ? '#e8e0d8' : GRAD,
                      color: (bidding || !phone || phone.replace(/\D/g,'').length < 10 || !bidAmount) ? '#b8a898' : '#fff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '12px 20px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: bidding ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {bidding ? '…' : 'Place Bid'}
                  </button>
                </div>
                {bidError && <p style={{ color: '#ef4444', fontSize: '12px', margin: 0 }}>{bidError}</p>}
                {bidSuccess && <p style={{ color: '#22c55e', fontSize: '12px', margin: 0, fontWeight: 600 }}>{bidSuccess}</p>}
                <p style={{ fontSize: '11px', color: '#b8a898', margin: 0 }}>
                  Min bid: {formatINR(minNextBid ?? item.starting_bid)} · incl. shipping
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#faf5f0',
  border: '1px solid #e8e0d8',
  borderRadius: '10px',
  padding: '12px 14px',
  color: '#1a1a1a',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
