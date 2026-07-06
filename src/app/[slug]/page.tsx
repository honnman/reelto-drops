import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent, DropSellerProfile, DropEventItem, DropProduct, TrustedBuyer } from '@/lib/types'
import LiveDropClient from '@/components/drop/LiveDropClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function DropPage({ params }: Props) {
  const { slug } = await params

  const { data: drop } = await supabaseAdmin
    .from('drop_events')
    .select('*')
    .eq('slug', slug)
    .in('status', ['scheduled', 'live', 'ended'])
    .maybeSingle()

  if (!drop) notFound()
  const typedDrop = drop as DropEvent

  const { data: seller } = await supabaseAdmin
    .from('drop_seller_profiles')
    .select('*')
    .eq('id', typedDrop.drop_seller_id)
    .single()

  if (!seller) notFound()
  const typedSeller = seller as DropSellerProfile

  const { data: items } = await supabaseAdmin
    .from('drop_event_items')
    .select('*')
    .eq('drop_event_id', typedDrop.id)
    .order('sort_order')

  const typedItems = (items ?? []) as DropEventItem[]

  const productIds = [...new Set(typedItems.map((i) => i.drop_product_id))]
  const { data: products } = productIds.length
    ? await supabaseAdmin.from('drop_products').select('*').in('id', productIds)
    : { data: [] }

  const productMap = new Map<string, DropProduct>(
    (products ?? []).map((p: DropProduct) => [p.id, p])
  )

  const itemsWithProducts = typedItems
    .map((item) => {
      const product = productMap.get(item.drop_product_id)
      if (!product) return null
      return { ...item, product }
    })
    .filter(Boolean) as (DropEventItem & { product: DropProduct })[]

  const { data: trustedBuyers } = await supabaseAdmin
    .from('buyers')
    .select('id, phone, is_trusted_bidder, drop_trust_score, drops_attended, is_verified')
    .eq('is_trusted_bidder', true)
    .order('drop_trust_score', { ascending: false })
    .limit(10)

  const buyers = (trustedBuyers ?? []) as TrustedBuyer[]

  return (
    <LiveDropClient
      drop={typedDrop}
      seller={typedSeller}
      items={itemsWithProducts}
      buyers={buyers}
    />
  )
}
