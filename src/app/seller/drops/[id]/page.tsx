'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSellerAuth } from '@/lib/useSellerAuth'
import {
  getDropAction,
  getDropItemsAction,
  getSellerProductsAction,
  updateDropStatusAction,
  addItemToDropAction,
  updateItemStatusAction,
} from '@/app/seller/actions'
import { DropEvent, DropEventItem, DropProduct } from '@/lib/types'
import SellerNav from '@/components/seller/SellerNav'
import { formatINR } from '@/lib/utils'

const GRAD = 'linear-gradient(135deg, #EA580C, #DB2877)'

type ItemWithProduct = DropEventItem & { product?: DropProduct }

export default function ManageDropPage() {
  const params = useParams()
  const router = useRouter()
  const { seller, loading: authLoading } = useSellerAuth()
  const dropId = params.id as string

  const [drop, setDrop] = useState<DropEvent | null>(null)
  const [items, setItems] = useState<ItemWithProduct[]>([])
  const [products, setProducts] = useState<DropProduct[]>([])
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState('')
  const [startingBid, setStartingBid] = useState('')
  const [adding, setAdding] = useState(false)

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
    setPageLoading(false)
  }

  useEffect(() => {
    if (!authLoading && seller) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, seller])

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
    if (liveItem) {
      setActionError('Mark the current live item as sold first before revealing a new one.')
      return
    }
    setActionError('')
    await updateItemStatusAction(item.id, 'live')
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'live', revealed_at: new Date().toISOString() } : i))
  }

  async function markSold(item: ItemWithProduct) {
    await updateItemStatusAction(item.id, 'sold', { winning_bid_amount: item.starting_bid })
    const now = new Date().toISOString()
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'sold', sold_at: now, winning_bid_amount: item.starting_bid } : i))
  }

  async function markUnsold(item: ItemWithProduct) {
    await updateItemStatusAction(item.id, 'unsold')
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: 'unsold' } : i))
  }

  async function addItem() {
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

  if (authLoading || pageLoading) return <LoadingScreen />
  if (!drop) return null

  return (
    <div style={{ minHeight: '100vh', background: '#fdf8f3' }}>
      <SellerNav />
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 20px' }}>

        <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-playfair), serif', fontSize: '22px', color: '#1a1a1a', margin: '0 0 4px' }}>
                {drop.title}
              </h1>
              <p style={{ color: '#9a8f87', fontSize: '13px', margin: 0 }}>
                {new Date(drop.scheduled_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
            </div>
            <StatusBadge status={drop.status} />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {drop.status === 'draft' && (
              <ActionBtn label="Publish Drop" onClick={() => updateDropStatus('scheduled')} grad />
            )}
            {drop.status === 'scheduled' && (
              <ActionBtn label="🔴 Go Live" onClick={() => updateDropStatus('live')} grad />
            )}
            {drop.status === 'live' && (
              <ActionBtn label="End Drop" onClick={() => updateDropStatus('ended')} danger />
            )}
            {drop.status !== 'ended' && drop.status !== 'cancelled' && (
              <a
                href={`/${drop.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ border: '1px solid #e8e0d8', color: '#b8a898', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                View Public Page ↗
              </a>
            )}
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ color: '#b8a898', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
            Items ({items.length})
          </h2>
          {drop.status !== 'ended' && (
            <button
              onClick={() => setShowAddModal(true)}
              style={{ background: GRAD, color: '#fff', border: 'none', borderRadius: '8px', padding: '7px 14px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
            >
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
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#b8a898', fontSize: '13px' }}>
            No items yet. Add your first product!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                dropStatus={drop.status}
                onReveal={() => revealItem(item)}
                onSold={() => markSold(item)}
                onUnsold={() => markUnsold(item)}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add Item to Drop">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Select product</label>
              {products.length === 0 ? (
                <p style={{ color: '#9a8f87', fontSize: '13px' }}>
                  No products yet.{' '}
                  <a href="/seller/products/new" style={{ color: '#DB2877' }}>Add a product first</a>
                </p>
              ) : (
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">— Choose product —</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label style={labelStyle}>Starting bid (₹)</label>
              <input
                type="number"
                value={startingBid}
                onChange={(e) => setStartingBid(e.target.value)}
                placeholder="e.g. 1200"
                style={inputStyle}
              />
            </div>
            <button
              onClick={addItem}
              disabled={!selectedProductId || !startingBid || adding}
              style={{
                background: !selectedProductId || !startingBid || adding ? '#e8e0d8' : GRAD,
                color: !selectedProductId || !startingBid || adding ? '#b8a898' : '#fff',
                border: 'none',
                borderRadius: '10px',
                padding: '13px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: !selectedProductId || !startingBid || adding ? 'not-allowed' : 'pointer',
              }}
            >
              {adding ? 'Adding…' : 'Add to Drop'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ItemRow({ item, dropStatus, onReveal, onSold, onUnsold }: {
  item: ItemWithProduct
  dropStatus: DropEvent['status']
  onReveal: () => void
  onSold: () => void
  onUnsold: () => void
}) {
  const photo = item.product?.photos?.[0]
  const isLive = dropStatus === 'live'
  const statusColors: Record<string, { bg: string; color: string }> = {
    upcoming: { bg: '#f5f0ea', color: '#9a8f87' },
    live: { bg: 'rgba(219,40,119,0.1)', color: '#DB2877' },
    sold: { bg: 'rgba(34,197,94,0.08)', color: '#22c55e' },
    unsold: { bg: '#f5f0ea', color: '#b8a898' },
  }
  const sc = statusColors[item.status] ?? statusColors.upcoming

  return (
    <div style={{ background: '#fff', border: item.status === 'live' ? '1px solid #DB2877' : '1px solid #e8e0d8', borderRadius: '12px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#f5f0ea', flexShrink: 0 }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🪡</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: '#1a1a1a', fontSize: '14px', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {String(item.sort_order).padStart(2, '0')} · {item.product?.name ?? '—'}
        </p>
        <p style={{ color: '#9a8f87', fontSize: '12px', margin: 0 }}>{formatINR(item.starting_bid)}</p>
      </div>
      <span style={{ background: sc.bg, color: sc.color, fontSize: '11px', fontWeight: 700, borderRadius: '6px', padding: '3px 8px', flexShrink: 0, textTransform: 'capitalize' }}>
        {item.status}
      </span>
      {isLive && item.status === 'upcoming' && (
        <button onClick={onReveal} style={smallBtn('#EA580C')}>Reveal</button>
      )}
      {isLive && item.status === 'live' && (
        <>
          <button onClick={onSold} style={smallBtn('#22c55e')}>Mark Sold</button>
          <button onClick={onUnsold} style={smallBtn('#555')}>Unsold</button>
        </>
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
  return (
    <span style={{ background: s.bg, color: s.color, fontSize: '12px', fontWeight: 700, borderRadius: '8px', padding: '4px 10px', textTransform: 'capitalize', flexShrink: 0 }}>
      {status}
    </span>
  )
}

function ActionBtn({ label, onClick, grad, danger }: { label: string; onClick: () => void; grad?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: danger ? 'rgba(239,68,68,0.1)' : grad ? GRAD : '#f5f0ea',
        color: danger ? '#ef4444' : grad ? '#fff' : '#1a1a1a',
        border: danger ? '1px solid rgba(239,68,68,0.3)' : grad ? 'none' : '1px solid #e8e0d8',
        borderRadius: '8px',
        padding: '9px 18px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}

function smallBtn(color: string): React.CSSProperties {
  return {
    background: 'transparent',
    border: `1px solid ${color}`,
    color,
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    flexShrink: 0,
  }
}

function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '20px' }}>
      <div style={{ background: '#fff', border: '1px solid #e8e0d8', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '400px' }}>
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#9a8f87',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const inputStyle: React.CSSProperties = {
  background: '#faf5f0',
  border: '1px solid #e8e0d8',
  borderRadius: '10px',
  padding: '11px 14px',
  color: '#1a1a1a',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
}
