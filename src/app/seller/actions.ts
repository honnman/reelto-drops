'use server'
import { supabaseAdmin } from '@/lib/supabase'
import { DropEvent, DropEventItem, DropProduct } from '@/lib/types'

/* ─── Drops ─── */

export async function getSellerDropsAction(sellerId: string): Promise<DropEvent[]> {
  const { data } = await supabaseAdmin
    .from('drop_events')
    .select('*')
    .eq('drop_seller_id', sellerId)
    .order('scheduled_at', { ascending: false })
  return (data as DropEvent[]) ?? []
}

export async function getSellerDropsRecentAction(sellerId: string): Promise<DropEvent[]> {
  const { data } = await supabaseAdmin
    .from('drop_events')
    .select('*')
    .eq('drop_seller_id', sellerId)
    .order('scheduled_at', { ascending: false })
    .limit(5)
  return (data as DropEvent[]) ?? []
}

export async function createDropAction(
  sellerId: string,
  payload: { title: string; description: string | null; slug: string; scheduled_at: string }
): Promise<{ drop?: DropEvent; error?: string }> {
  const { data: drop, error } = await supabaseAdmin
    .from('drop_events')
    .insert({ drop_seller_id: sellerId, ...payload, status: 'draft' })
    .select()
    .single()
  if (error) return { error: error.message }
  return { drop: drop as DropEvent }
}

export async function getDropAction(dropId: string): Promise<DropEvent | null> {
  const { data } = await supabaseAdmin
    .from('drop_events')
    .select('*')
    .eq('id', dropId)
    .single()
  return (data as DropEvent) ?? null
}

export async function updateDropStatusAction(
  dropId: string,
  status: DropEvent['status']
): Promise<void> {
  const patch: Record<string, string> = { status }
  if (status === 'live') patch.started_at = new Date().toISOString()
  if (status === 'ended') patch.ended_at = new Date().toISOString()
  await supabaseAdmin.from('drop_events').update(patch).eq('id', dropId)
}

/* ─── Items ─── */

export async function getDropItemsAction(dropId: string): Promise<(DropEventItem & { product?: DropProduct })[]> {
  const { data: itemsData } = await supabaseAdmin
    .from('drop_event_items')
    .select('*')
    .eq('drop_event_id', dropId)
    .order('sort_order')

  const items = (itemsData ?? []) as DropEventItem[]
  if (items.length === 0) return []

  const pids = items.map((i) => i.drop_product_id)
  const { data: prods } = await supabaseAdmin.from('drop_products').select('*').in('id', pids)
  const prodMap = new Map((prods ?? []).map((p: DropProduct) => [p.id, p]))
  return items.map((i) => ({ ...i, product: prodMap.get(i.drop_product_id) }))
}

export async function addItemToDropAction(payload: {
  drop_event_id: string
  drop_product_id: string
  sort_order: number
  starting_bid: number
}): Promise<{ item?: DropEventItem; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from('drop_event_items')
    .insert({ ...payload, status: 'upcoming' })
    .select()
    .single()
  if (error) return { error: error.message }
  return { item: data as DropEventItem }
}

export async function updateItemStatusAction(
  itemId: string,
  status: 'live' | 'sold' | 'unsold',
  extra?: { winning_bid_amount?: number }
): Promise<void> {
  const patch: Record<string, string | number> = { status }
  if (status === 'live') patch.revealed_at = new Date().toISOString()
  if (status === 'sold') patch.sold_at = new Date().toISOString()
  if (extra?.winning_bid_amount !== undefined) patch.winning_bid_amount = extra.winning_bid_amount
  await supabaseAdmin.from('drop_event_items').update(patch).eq('id', itemId)
}

export async function revealItemWithTimerAction(
  itemId: string,
  timerSeconds: number
): Promise<{ endsAt?: string; error?: string }> {
  const { data, error } = await supabaseAdmin.rpc('reveal_item_with_timer', {
    p_item_id: itemId,
    p_timer_seconds: timerSeconds,
  })
  if (error) return { error: error.message }
  return { endsAt: (data as { ends_at: string }).ends_at }
}

export async function closeItemAction(itemId: string): Promise<{ winnerPhone?: string | null; amount?: number; error?: string }> {
  const { data, error } = await supabaseAdmin.rpc('close_item', { p_item_id: itemId })
  if (error) return { error: error.message }
  const result = data as { success: boolean; winner_phone: string | null; amount: number }
  return { winnerPhone: result.winner_phone, amount: result.amount }
}

export async function getReeltoProductsAction(influencerId: string): Promise<{
  id: string; name: string; description: string | null; fabric: string | null;
  category: string | null; price: number; photos: string[]
}[]> {
  const { data } = await supabaseAdmin.rpc('get_reelto_products_for_seller', {
    p_influencer_id: influencerId,
  })
  return (data as any[]) ?? []
}

/* ─── Products ─── */

export async function getSellerProductsAction(sellerId: string): Promise<DropProduct[]> {
  const { data } = await supabaseAdmin
    .from('drop_products')
    .select('*')
    .eq('drop_seller_id', sellerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  return (data as DropProduct[]) ?? []
}

export async function createProductAction(payload: {
  drop_seller_id: string
  source: string
  name: string
  description: string | null
  fabric: string | null
  category: string | null
  store_price: number | null
  photos: string[]
}): Promise<{ error?: string }> {
  const { error } = await supabaseAdmin
    .from('drop_products')
    .insert({ ...payload, is_active: true })
  return error ? { error: error.message } : {}
}
