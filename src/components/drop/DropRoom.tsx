"use client";
import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { DropWithSarees, BidWithBidder, SareeWithImages } from "@/types/database";
import ActiveLotCard from "./ActiveLotCard";
import BidButton from "./BidButton";
import BidFeed from "./BidFeed";
import WinnerSheet from "./WinnerSheet";

interface DropRoomProps {
  drop: DropWithSarees;
  userId: string | null;
}

export default function DropRoom({ drop, userId }: DropRoomProps) {
  const supabase = createClient();

  const [sarees, setSarees] = useState<SareeWithImages[]>(drop.sarees);
  const [bids, setBids] = useState<BidWithBidder[]>([]);
  const [winnerSheet, setWinnerSheet] = useState<{
    sareeTitle: string;
    winningBid: number;
    bidId: string;
  } | null>(null);

  const activeSaree = sarees.find((s) => s.status === "active");
  const currentHighest = bids.length > 0
    ? Math.max(...bids.map((b) => b.amount))
    : activeSaree?.starting_price ?? 0;
  const topBidder = bids.reduce<BidWithBidder | null>(
    (top, b) => (!top || b.amount > top.amount ? b : top),
    null
  );
  const isHighBidder = !!userId && topBidder?.bidder_id === userId;

  // Load initial bids for active lot
  const loadBids = useCallback(
    async (sareeId: string) => {
      const { data } = await supabase
        .from("bids")
        .select("*, profiles(id, display_name)")
        .eq("saree_id", sareeId)
        .order("created_at");
      setBids((data as BidWithBidder[]) ?? []);
    },
    [supabase]
  );

  useEffect(() => {
    if (activeSaree) loadBids(activeSaree.id);
  }, [activeSaree?.id, loadBids]);

  // Realtime: bids on active lot
  useEffect(() => {
    if (!activeSaree) return;
    const channel = supabase
      .channel(`bids:${activeSaree.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bids", filter: `saree_id=eq.${activeSaree.id}` },
        async (payload) => {
          const { data: bidder } = await supabase
            .from("profiles")
            .select("id, display_name")
            .eq("id", payload.new.bidder_id)
            .single();
          const newBid = { ...payload.new, profiles: bidder } as BidWithBidder;
          setBids((prev) => [...prev, newBid]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeSaree?.id, supabase]);

  // Realtime: lot status changes
  useEffect(() => {
    const channel = supabase
      .channel(`sarees:drop:${drop.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sarees", filter: `drop_id=eq.${drop.id}` },
        (payload) => {
          const updated = payload.new as SareeWithImages;
          setSarees((prev) =>
            prev.map((s) =>
              s.id === updated.id ? { ...s, ...updated } : s
            )
          );

          // Show winner sheet if I won a just-closed lot
          if (
            updated.status === "sold" &&
            updated.winner_id === userId &&
            updated.winning_bid
          ) {
            const saree = sarees.find((s) => s.id === updated.id);
            if (saree) {
              setWinnerSheet({
                sareeTitle: saree.title,
                winningBid: updated.winning_bid!,
                bidId: updated.id,
              });
            }
          }

          // New active lot — clear bids
          if (updated.status === "active") {
            setBids([]);
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [drop.id, userId, sarees, supabase]);

  // Join drop as participant
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("drop_participants")
      .upsert({ drop_id: drop.id, user_id: userId })
      .then(() => {});
  }, [drop.id, userId, supabase]);

  if (drop.status === "ended") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
        <span className="text-5xl">🏁</span>
        <h2 className="text-2xl font-bold text-zinc-900">Drop has ended</h2>
        <p className="text-zinc-500">All lots have been auctioned. Stay tuned for the next drop!</p>
      </div>
    );
  }

  if (drop.status === "scheduled" || !activeSaree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4 text-center">
        <span className="text-5xl">⏳</span>
        <h2 className="text-2xl font-bold text-zinc-900">{drop.title}</h2>
        <p className="text-zinc-500">Drop hasn&apos;t started yet. Stay on this page!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
        <div>
          <h1 className="font-bold text-zinc-900 text-sm leading-tight">{drop.title}</h1>
          <p className="text-xs text-zinc-400">by {drop.profiles.display_name}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-red-500 font-semibold">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          LIVE
        </div>
      </header>

      {/* Active lot */}
      <div className="flex-1 overflow-y-auto">
        <ActiveLotCard
          saree={activeSaree}
          currentBid={currentHighest}
          totalLots={sarees.length}
        />

        {/* Bid feed */}
        <div className="border-t border-zinc-100 mt-2">
          <p className="px-4 pt-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">
            Bids ({bids.length})
          </p>
          <BidFeed bids={bids} currentUserId={userId ?? undefined} />
        </div>
      </div>

      {/* Sticky bid bar */}
      <div className="sticky bottom-0 px-4 pb-6 pt-3 bg-white border-t border-zinc-100 safe-area-inset-bottom">
        {userId ? (
          <BidButton
            sareeId={activeSaree.id}
            currentHighest={currentHighest}
            isHighBidder={isHighBidder}
            onBidPlaced={() => {}}
          />
        ) : (
          <a
            href="/login"
            className="block w-full text-center bg-rose-600 text-white font-bold py-4 rounded-xl"
          >
            Login to bid
          </a>
        )}
      </div>

      {/* Winner sheet */}
      {winnerSheet && (
        <WinnerSheet
          open={!!winnerSheet}
          onClose={() => setWinnerSheet(null)}
          sareeTitle={winnerSheet.sareeTitle}
          winningBid={winnerSheet.winningBid}
          bidId={winnerSheet.bidId}
          sellerPhone={drop.profiles.whatsapp_number ?? ""}
          sellerName={drop.profiles.display_name}
        />
      )}
    </div>
  );
}
