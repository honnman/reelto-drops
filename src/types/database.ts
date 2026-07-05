export type Role = "buyer" | "seller";
export type DropStatus = "scheduled" | "live" | "ended";
export type SareeStatus = "pending" | "active" | "sold" | "unsold";

export interface Profile {
  id: string;
  role: Role;
  display_name: string;
  whatsapp_number: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Drop {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  status: DropStatus;
  created_at: string;
}

export interface Saree {
  id: string;
  drop_id: string;
  seller_id: string;
  position: number;
  title: string;
  description: string | null;
  starting_price: number; // paise
  reserve_price: number | null;
  auction_seconds: number;
  status: SareeStatus;
  active_since: string | null;
  winner_id: string | null;
  winning_bid: number | null;
  created_at: string;
}

export interface SareeImage {
  id: string;
  saree_id: string;
  storage_path: string;
  position: number;
}

export interface Bid {
  id: string;
  saree_id: string;
  bidder_id: string;
  amount: number; // paise
  created_at: string;
}

export interface DropParticipant {
  drop_id: string;
  user_id: string;
  joined_at: string;
}

// Joined / enriched types used in UI
export interface SareeWithImages extends Saree {
  saree_images: SareeImage[];
}

export interface DropWithSarees extends Drop {
  sarees: SareeWithImages[];
  profiles: Pick<Profile, "id" | "display_name" | "whatsapp_number">;
}

export interface BidWithBidder extends Bid {
  profiles: Pick<Profile, "id" | "display_name">;
}
