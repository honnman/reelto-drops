'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSellerAuth } from '@/lib/useSellerAuth'
import {
  getDropAction,
  getDropItemsAction,
  getSellerProductsAction,
  updateDropStatusAction,
  addItemToDropAction,
  closeItemAction,
  revealItemWithTimerAction,
  getReeltoProductsAction,
  createProductAction,
} from '@/app/seller/actions'
import { DropEvent, DropEventItem, DropProduct } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'
import { formatINR } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

type ItemWithProduct = DropEventItem & { product?: DropProduct }

interface ReeltoProduct {
  id: string
  name: string
  description: string | null
  fabric: string | null
  category: string | null
  price: number
  photos: string[]
}

function useCountdown(endsAt: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!endsAt) { setSecondsLeft(null); return }
    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000))
      setSecondsLeft(diff)
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [endsAt])

  return secondsLeft
}

export default function ManageDropPage() {
  const params = useParams()
  const router = useRouter()
  const { seller, loading: authLoading } = useSellerAuth()
  const dropId = params.id as string

  const [drop, setDrop] = useState<DropEvent | null>(null)
  const [items, setItems] = useState<ItemWithProduct[]>([])
  const [products, setProducts] = useState<DropProduct[]>([])
  const [reeltoProducts, setReeltoProducts] = useState<ReeltoProduct[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [addTab, setAddTab] = useState<'local' | 'reelto'>('local')
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedReeltoId, setSelectedReeltoId] = useState('')
  const [startingBid, setStartingBid] = useState('')
  const [timerSeconds, setTimerSeconds] = useState('120')
  const [adding, setAdding] = useState(false)

  // Live item timer from realtime
  const [liveItemEndsAt, setLiveItemEndsAt] = useState<string | null>(null)
  const liveItemId = items.find((i) => i.status === 'live')?.id ?? null
  const secondsLeft = useCountdown(liveItemEndsAt)
  const autoClosedRef = useRef(false)

  async function load() {
    const dropData = await getDropAction(dropId)
    if (!dropData) { router.replace('/seller/drops'); return }
    setDrop(dropData)

    const [loadedItems, loadedProducts] = await Promise.all([
      getDropItemsAction(dropId),
      seller ? getSellerProductsAction(seller.id) : Promise.resolve([]),
    ])
    setItems(loadedItems)
    setProducts(loadedProducts)

    // Set initial timer for any live item
    const liveItem = loadedItems.find((i) => i.status === 'live')
    if (liveItem?.timer_ends_at) setLiveItemEndsAt(liveItem.timer_ends_at)

    setPageLoading(false)
  }

  useEffect(() => {
    if (!authLoading && seller) {
      load()
      // Load reelto products if seller is reelto type
      if (seller.influencer_id) {
        getReeltoProductsAction(seller.influencer_id).then(setReeltoProducts)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, seller])

  // Realtime: listen for item updates (timer extensions, status changes)
  useEffect(() => {
    const channel = supabase
      .channel(`seller-drop:${dropId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'drop_event_items',
        filter: `drop_event_id=eq.${dropId}`,
      }, (payload) => {
        const updated = payload.new as DropEventItem
        setItems((prev) => prev.map((i) => i.id === updated.id ? { ...i, ...updated } : i))
        if (updated.status === 'live' && updated.timer_ends_at) {
          setLiveItemEndsAt(updated.timer_ends_at)
          autoClosedRef.current = false
        }
        if (updated.status !== 'live') setLiveItemEndsAt(null)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [dropId])

  // Auto-close when timer hits 0
  useEffect(() => {
    if (secondsLeft === 0 && liveItemId && !autoClosedRef.current) {
      autoClosedRef.current = true
      closeItemAction(liveItemId).then(({ winnerPhone, amount }) => {
        setItems((prev) => prev.map((i) =>
          i.id === liveItemId
            ? { ...i, status: 'sold', winning_bid_amount: amount ?? null, winning_phone: winnerPhone ?? null }
            : i
        ))
        setLiveItemEndsAt(null)
      })
    }
  }, [secondsLeft, liveItemId])

  async function updateDropStatus(newStatus: DropEvent['status']) {
    setError('')
    await updateDropStatusAction(dropId, newStatus)
    const patch: Partial<DropEvent> = { status: newStatus }
    if (newStatus === 'live') patch.started_at = new Date().toISOString()
    if (newStatus === 'ended') patch.ended_at = new Date().toISOString()
    setDrop((d) => d ? { ...d, ...patch } : d)
  }

  async function revealItem(item: ItemWithProduct) {
    const liveItem = items.find((i) => i.status === 'live' && i.id !== item.id)
    if (liveItem) { setActionError('Close the current live item first.'); return }
    setActionError('')
    autoClosedRef.current = false
    const secs = parseInt(timerSeconds) || 120
    const result = await revealItemWithTimerAction(item.id, secs)
    if (result.endsAt) {
      setLiveItemEndsAt(result.endsAt)
      setItems((prev) => prev.map((i) =>
        i.id === item.id
          ? { ...i, status: 'live', revealed_at: new Date().toISOString(), timer_ends_at: result.endsAt!, timer_seconds: secs }
          : i
      ))
    }
  }

  async function closeItem(item: ItemWithProduct) {
    autoClosedRef.current = true
    const result = await closeItemAction(item.id)
    setItems((prev) => prev.map((i) =>
      i.id === item.id
        ? { ...i, status: result.winnerPhone ? 'sold' : 'unsold', winning_bid_amount: result.amount ?? null, winning_phone: result.winnerPhone ?? null }
        : i
    ))
    setLiveItemEndsAt(null)
  }

  async function addLocalItem() {
    if (!selectedProductId || !startingBid) return
    setAdding(true)
    const nextOrder = (items.at(-1)?.sort_order ?? 0) + 1
    const result = await addItemToDropAction({
      drop_event_id: dropId,
      drop_product_id: selectedProductId,
      sort_order: nextOrder,
      starting_bid: Math.round(parseFloat(startingBid)),
    })
    if (result.item) {
      const product = products.find((p) => p.id === selectedProductId)
      setItems((prev) => [...prev, { ...result.item!, product }])
    }
    setAdding(false)
    setShowAddModal(false)
    setSelectedProductId('')
    setStartingBid('')
  }

  async function importAndAddReeltoItem() {
    if (!selectedReeltoId || !startingBid || !seller) return
    setAdding(true)

    const rp = reeltoProducts.find((p) => p.id === selectedReeltoId)
    if (!rp) { setAdding(false); return }

    // Create drop_product from reelto product
    const createResult = await createProductAction({
      drop_seller_id: seller.id,
      source: 'reelto',
      name: rp.name,
      description: rp.description,
      fabric: rp.fabric,
      category: rp.category,
      store_price: rp.price,
      photos: rp.photos,
    })

    if (createResult.error) { setAdding(false); return }

    // Reload products to get the new one
    const updated = await getSellerProductsAction(seller.id)
    setProducts(updated)

    // Find the newly created product (most recent)
    const newProduct = updated[0]
    if (!newProduct) { setAdding(false); return }

    const nextOrder = (items.at(-1)?.sort_order ?? 0) + 1
    const result = await addItemToDropAction({
      drop_event_id: dropId,
      drop_product_id: newProduct.id,
      sort_order: nextOrder,
      starting_bid: Math.round(parseFloat(startingBid)),
    })
    if (result.item) {
      setItems((prev) => [...prev, { ...result.item!, product: newProduct }])
    }
    setAdding(false)
    setShowAddModal(false)
    setSelectedReeltoId('')
    setStartingBid('')
  }

  if (authLoading || pageLoading) return <LoadingScreen />
  if (!drop) return null

  const liveItem = items.find((i) => i.status === 'live')

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>

        {/* Drop header */}
        <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', color: '#1a1a1a', margin: '0 0 4px' }}>{drop.title}</h1>
              <p style={{ color: '#9a8f87', fontSize: '13px', margin: 0 }}>
                {new Date(drop.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <StatusBadge status={drop.status} />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {drop.status === 'draft' && <ActionBtn label="Publish Drop" onClick={() => updateDropStatus('scheduled')} grad />}
            {drop.status === 'scheduled' && <ActionBtn label="🔴 Go Live" onClick={() => updateDropStatus('live')} grad />}
            {drop.status === 'live' && <ActionBtn label="End Drop" onClick={() => updateDropStatus('ended')} danger />}
            {drop.status !== 'ended' && drop.status !== 'cancelled' && (
              <a href={`/${drop.slug}`} target="_blank" rel="noopener noreferrer"
                style={{ border: '1px solid #e8e0d8', color: '#b8a898', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
                View Public Page ↗
              </a>
            )}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
        </div>

        {/* Live item timer banner */}
        {liveItem && secondsLeft !== null && (
          <div style={{
            background: secondsLeft <= 30 ? 'rgba(239,68,68,0.08)' : 'rgba(219,40,119,0.05)',
            border: `1px solid ${secondsLeft <= 30 ? 'rgba(239,68,68,0.3)' : 'rgba(219,40,119,0.2)'}`,
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: '#9a8f87', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Live: {liveItem.product?.name ?? '—'}
                {(liveItem.soft_close_count ?? 0) > 0 && (
                  <span style={{ marginLeft: '8px', color: '#EA580C' }}>+{liveItem.soft_close_count} extensions</span>
                )}
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: secondsLeft <= 30 ? '#ef4444' : '#DB2877', fontFamily: 'monospace' }}>
                {String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end' }}>
              <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 700 }}>
                {liveItem.current_bid ? formatINR(liveItem.current_bid) : formatINR(liveItem.starting_bid)}
              </div>
              <div style={{ fontSize: '11px', color: '#9a8f87' }}>{liveItem.bid_count} bid{liveItem.bid_count !== 1 ? 's' : ''}</div>
              <button onClick={() => closeItem(liveItem)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Close Now
              </button>
            </div>
          </div>
        )}

        {/* Timer preset for next reveal */}
        {drop.status === 'live' && !liveItem && (
          <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: '#9a8f87', flexShrink: 0 }}>Timer for next item:</span>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[60, 120, 180, 300].map((s) => (
                <button
                  key={s}
                  onClick={() => setTimerSeconds(String(s))}
                  style={{
                    background: timerSeconds === String(s) ? GRAD : '#f5f0ea',
                    color: timerSeconds === String(s) ? '#fff' : '#9a8f87',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {s < 60 ? `${s}s` : `${s / 60}m`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ color: '#b8a898', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Items ({items.length})
          </h2>
          {drop.status !== 'ended' && (
            <button onClick={() => setShowAddModal(true)}
              style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
              + Add Item
            </button>
          )}
        </div>

        {actionError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#ef4444', fontSize: '13px', marginBottom: '14px' }}>
            {actionError}
          </div>
        )}

        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#b8a898', fontSize: '13px' }}>No items yet. Add your first product!</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                dropStatus={drop.status}
                onReveal={() => revealItem(item)}
                onClose={() => closeItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add item modal */}
      {showAddModal && (
        <Modal onClose={() => { setShowAddModal(false); setSelectedProductId(''); setSelectedReeltoId(''); setStartingBid('') }} title="Add Item to Drop">
          {/* Tabs — only show reelto tab if seller has influencer_id */}
          {seller?.influencer_id && reeltoProducts.length > 0 && (
            <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid #e8e0d8' }}>
              {(['local', 'reelto'] as const).map((tab) => (
                <button key={tab} onClick={() => setAddTab(tab)} style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  borderBottom: addTab === tab ? '2px solid #DB2877' : '2px solid transparent',
                  color: addTab === tab ? '#DB2877' : '#9a8f87',
                  fontWeight: addTab === tab ? 700 : 400,
                  fontSize: '13px',
                  padding: '8px 0',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                }}>
                  {tab === 'reelto' ? 'Import from Reelto' : 'My Products'}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {addTab === 'local' ? (
              <>
                <div>
                  <label style={labelStyle}>Select product</label>
                  {products.length === 0 ? (
                    <p style={{ color: '#9a8f87', fontSize: '13px' }}>No products yet. <a href="/seller/products/new" style={{ color: '#DB2877' }}>Add one first</a></p>
                  ) : (
                    <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                      <option value="">— Choose product —</option>
                      {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label style={labelStyle}>Starting bid (₹)</label>
                  <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} placeholder="e.g. 1200" style={inputStyle} />
                </div>
                <button onClick={addLocalItem} disabled={!selectedProductId || !startingBid || adding}
                  style={{ background: !selectedProductId || !startingBid || adding ? '#e8e0d8' : GRAD, color: !selectedProductId || !startingBid || adding ? '#b8a898' : '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  {adding ? 'Adding…' : 'Add to Drop'}
                </button>
              </>
            ) : (
              <>
                <div>
                  <label style={labelStyle}>Select Reelto product</label>
                  <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {reeltoProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => setSelectedReeltoId(p.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px',
                          borderRadius: '10px', border: selectedReeltoId === p.id ? '2px solid #DB2877' : '1px solid #e8e0d8',
                          cursor: 'pointer', background: selectedReeltoId === p.id ? 'rgba(219,40,119,0.04)' : '#fff',
                        }}
                      >
                        {p.photos[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.photos[0]} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: '11px', color: '#9a8f87' }}>{[p.fabric, p.category].filter(Boolean).join(' · ')} · {formatINR(p.price)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Starting bid (₹)</label>
                  <input type="number" value={startingBid} onChange={(e) => setStartingBid(e.target.value)} placeholder="e.g. 1200" style={inputStyle} />
                </div>
                <button onClick={importAndAddReeltoItem} disabled={!selectedReeltoId || !startingBid || adding}
                  style={{ background: !selectedReeltoId || !startingBid || adding ? '#e8e0d8' : GRAD, color: !selectedReeltoId || !startingBid || adding ? '#b8a898' : '#fff', border: 'none', borderRadius: '10px', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                  {adding ? 'Importing…' : 'Import & Add to Drop'}
                </button>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

function ItemRow({ item, dropStatus, onReveal, onClose }: {
  item: ItemWithProduct
  dropStatus: DropEvent['status']
  onReveal: () => void
  onClose: () => void
}) {
  const photo = item.product?.photos?.[0]
  const isLive = item.status === 'live'
  const statusColors: Record<string, { bg: string; color: string }> = {
    upcoming: { bg: '#f5f0ea', color: '#9a8f87' },
    live: { bg: 'rgba(219,40,119,0.1)', color: '#DB2877' },
    sold: { bg: 'rgba(34,197,94,0.08)', color: '#22c55e' },
    unsold: { bg: '#f5f0ea', color: '#b8a898' },
  }
  const sc = statusColors[item.status] ?? statusColors.upcoming

  return (
    <div style={{ background: '#fff', border: isLive ? '1px solid #DB2877' : '1px solid #e8e0d8', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#f5f0ea', flexShrink: 0 }}>
        {photo
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🪡</div>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#1a1a1a', fontSize: '14px', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(item.sort_order).padStart(2, '0')} · {item.product?.name ?? '—'}
        </p>
        <p style={{ color: '#9a8f87', fontSize: '12px', margin: 0 }}>
          {item.current_bid ? `Current: ${formatINR(item.current_bid)} · ${item.bid_count} bids` : formatINR(item.starting_bid)}
          {item.status === 'sold' && item.winning_phone && ` · Winner: •••${item.winning_phone.slice(-4)}`}
        </p>
      </div>
      <span style={{ background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px', flexShrink: 0, textTransform: 'capitalize' }}>{item.status}</span>
      {dropStatus === 'live' && item.status === 'upcoming' && (
        <button onClick={onReveal} style={smallBtn('#EA580C')}>Reveal</button>
      )}
      {dropStatus === 'live' && item.status === 'live' && (
        <button onClick={onClose} style={smallBtn('#ef4444')}>Close</button>
      )}
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
  return <span style={{ background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700, borderRadius: '8px', padding: '4px 10px', textTransform: 'capitalize', flexShrink: 0 }}>{status}</span>
}

function ActionBtn({ label, onClick, grad, danger }: { label: string; onClick: () => void; grad?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: danger ? 'rgba(239,68,68,0.1)' : grad ? GRAD : '#f5f0ea',
      color: danger ? '#ef4444' : grad ? '#fff' : '#1a1a1a',
      border: danger ? '1px solid rgba(239,68,68,0.3)' : grad ? 'none' : '1px solid #e8e0d8',
      borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
    }}>{label}</button>
  )
}

function smallBtn(color: string): React.CSSProperties {
  return { background: 'transparent', border: `1px solid ${color}`, color, borderRadius: '6px', padding: '5px 10px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#1a1a1a', fontSize: '18px', fontWeight: 700, margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9a8f87', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#b8a898', fontSize: '14px' }}>Loading…</div>
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', color: '#9a8f87', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }
const inputStyle: React.CSSProperties = { background: '#faf5f0', border: '1px solid #e8e0d8', borderRadius: '10px', padding: '11px 14px', color: '#1a1a1a', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }
