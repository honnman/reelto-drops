export interface DropSellerProfile {
  id: string
  type: 'reelto' | 'external'
  influencer_id: string | null
  display_name: string
  whatsapp_number: string
  phone: string
  city: string | null
  upi_id: string | null
  is_verified: boolean
  commission_pct: number
  plan: 'pay_per_drop' | 'monthly' | 'reelto_core'
  plan_started_at: string | null
  plan_expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface DropProduct {
  id: string
  drop_seller_id: string
  source: 'reelto' | 'external'
  source_product_id: string | null
  name: string
  description: string | null
  fabric: string | null
  category: string | null
  photos: string[]
  store_price: number | null
  is_active: boolean
  created_at: string
}

export interface DropEvent {
  id: string
  drop_seller_id: string
  title: string
  description: string | null
  slug: string
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'cancelled'
  scheduled_at: string
  started_at: string | null
  ended_at: string | null
  total_items: number
  total_sold: number
  total_gmv: number
  preview_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface DropEventItem {
  id: string
  drop_event_id: string
  drop_product_id: string
  sort_order: number
  starting_bid: number
  current_bid: number | null
  reserve_price: number | null
  is_trusted_only: boolean
  status: 'upcoming' | 'live' | 'sold' | 'unsold'
  bid_count: number
  winning_bid_amount: number | null
  winning_phone: string | null
  timer_seconds: number
  timer_started_at: string | null
  timer_ends_at: string | null
  soft_close_count: number
  revealed_at: string | null
  sold_at: string | null
  created_at: string
  updated_at: string
}

export interface DropBid {
  id: string
  drop_event_id: string
  drop_event_item_id: string
  phone: string
  amount: number
  bid_rank: number | null
  status: 'active' | 'outbid' | 'won' | 'cascaded' | 'paid' | 'ghosted'
  payment_link_url: string | null
  payment_link_sent_at: string | null
  payment_link_expires_at: string | null
  paid_at: string | null
  razorpay_payment_id: string | null
  created_at: string
}

export interface DropRegistration {
  id: string
  drop_event_id: string
  phone: string
  registered_at: string
  source: 'drop_page' | 'whatsapp' | 'story_link' | 'seller_shared' | null
  is_trusted_bidder: boolean
}

export interface TrustedBuyer {
  id: string
  phone: string
  is_trusted_bidder: boolean
  drop_trust_score: number
  drops_attended: number
  is_verified: boolean
}
