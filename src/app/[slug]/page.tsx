import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent, DropSellerProfile, DropEventItem, DropProduct, TrustedBuyer } from '@/lib/types'
import { buildWhatsAppUrl } from '@/lib/utils'
import DropHeader from '@/components/drop/DropHeader'
import DropHero from '@/components/drop/DropHero'
import TrustedBiddersBoard from '@/components/drop/TrustedBiddersBoard'
import ItemCard from '@/components/drop/ItemCard'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DropPage({ params }: Props) {
  const { slug } = await params

  /* ── 1. Fetch drop ── */
  const { data: drop } = await supabaseAdmin
    .from('drop_events')
    .select('*')
    .eq('slug', slug)
    .in('status', ['scheduled', 'live', 'ended'])
    .maybeSingle()

  if (!drop) notFound()
  const typedDrop = drop as DropEvent

  /* ── 2. Fetch seller ── */
  const { data: seller } = await supabaseAdmin
    .from('drop_seller_profiles')
    .select('*')
    .eq('id', typedDrop.drop_seller_id)
    .single()

  if (!seller) notFound()
  const typedSeller = seller as DropSellerProfile

  /* ── 3. Fetch items ── */
  const { data: items } = await supabaseAdmin
    .from('drop_event_items')
    .select('*')
    .eq('drop_event_id', typedDrop.id)
    .order('sort_order')

  const typedItems = (items ?? []) as DropEventItem[]

  /* ── 4. Fetch products for each item ── */
  const productIds = [...new Set(typedItems.map((i) => i.drop_product_id))]
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('drop_products').select('*').in('id', productIds)
    : { data: [] }

  const productMap = new Map<string, DropProduct>(
    (products ?? []).map((p: DropProduct) => [p.id, p])
  )

  /* ── 5. Fetch trusted buyers ── */
  const { data: trustedBuyers } = await supabaseAdmin
    .from('buyers')
    .select('id, phone, is_trusted_bidder, drop_trust_score, drops_attended, is_verified')
    .eq('is_trusted_bidder', true)
    .order('drop_trust_score', { ascending: false })
    .limit(10)

  const buyers = (trustedBuyers ?? []) as TrustedBuyer[]

  /* ── WhatsApp fallback URL ── */
  const sellerWaUrl = buildWhatsAppUrl(
    typedSeller.whatsapp_number,
    `Hi! I missed an item in ${typedDrop.title}. Can you help?`
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0f0f0f',
        maxWidth: '480px',
        margin: '0 auto',
      }}
    >
      <DropHeader drop={typedDrop} seller={typedSeller} />
      <DropHero drop={typedDrop} />
      <TrustedBiddersBoard buyers={buyers} />

      {/* Items list */}
      <div style={{ padding: '0 20px' }}>
        {typedItems.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 0',
              color: '#444',
              fontSize: '14px',
            }}
          >
            No items added yet. Check back soon!
          </div>
        ) : (
          typedItems.map((item) => {
            const product = productMap.get(item.drop_product_id)
            if (!product) return null
            return (
              <ItemCard
                key={item.id}
                item={item}
                product={product}
                seller={typedSeller}
                drop={typedDrop}
              />
            )
          })
        )}
      </div>

      {/* Bottom CTA */}
      <div
        style={{
          padding: '24px 20px 40px',
          textAlign: 'center',
          borderTop: '1px solid #1a1a1a',
          marginTop: '8px',
        }}
      >
        <p
          style={{
            fontSize: '13px',
            color: '#555',
            marginBottom: '14px',
            lineHeight: 1.5,
          }}
        >
          Missed an item? Message the seller after the drop ends
        </p>
        <a
          href={sellerWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: '#22c55e',
            color: '#fff',
            textDecoration: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          <WhatsAppIcon />
          WhatsApp {typedSeller.display_name}
        </a>
      </div>
    </div>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}
