"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SareeWithImages, BidWithBidder } from "@/types/database";
import Button from "@/components/ui/Button";
import CountdownTimer from "@/components/ui/CountdownTimer";
import { formatPrice } from "@/lib/utils";

interface LiveControlPanelProps {
  dropId: string;
  initialSarees: SareeWithImages[];
}

export default function LiveControlPanel({ dropId, initialSarees }: LiveControlPanelProps) {
  const supabase = createClient();
  const [sarees, setSarees] = useState(initialSarees);
  const [bids, setBids] = useState<BidWithBidder[]>([]);
  const [advancing, setAdvancing] = useState(false);

  const activeSaree = sarees.find((s) => s.status === "active");
  const highestBid = bids.reduce((max, b) => Math.max(max, b.amount), 0);
  const winner = bids.find((b) => b.amount === highestBid);
  const completedCount = sarees.filter((s) => s.status === "sold" || s.status === "unsold").length;

  useEffect(() => {
    if (!activeSaree) return;
    supabase
      .from("bids")
      .select("*, profiles(id, display_name)")
      .eq("saree_id", activeSaree.id)
      .order("created_at")
      .then(({ data }) => setBids((data as BidWithBidder[]) ?? []));

    const ch = supabase
      .channel(`seller-bids:${activeSaree.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "bids",
        filter: `saree_id=eq.${activeSaree.id}`,
      }, async (p) => {
        const { data: bidder } = await supabase
          .from("profiles").select("id, display_name").eq("id", p.new.bidder_id).single();
        setBids((prev) => [...prev, { ...p.new, profiles: bidder } as BidWithBidder]);
      })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
  }, [activeSaree?.id, supabase]);

  useEffect(() => {
    const ch = supabase
      .channel(`seller-sarees:${dropId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "sarees", filter: `drop_id=eq.${dropId}`,
      }, (p) => {
        setSarees((prev) => prev.map((s) => s.id === p.new.id ? { ...s, ...p.new } : s));
        if (p.new.status === "active") setBids([]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [dropId, supabase]);

  async function endLot() {
    setAdvancing(true);
    await fetch(`/api/drops/${dropId}/next-lot`, { method: "POST" });
    setAdvancing(false);
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>{completedCount} of {sarees.length} lots done</span>
        <div className="w-32 bg-zinc-200 rounded-full h-1.5">
          <div
            className="bg-rose-500 h-1.5 rounded-full transition-all"
            style={{ width: `${(completedCount / sarees.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Active lot */}
      {activeSaree ? (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wide">
                Lot {activeSaree.position}
              </p>
              <h2 className="text-xl font-bold text-zinc-900 mt-0.5">{activeSaree.title}</h2>
            </div>
            {activeSaree.active_since && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-zinc-400">Time left</p>
                <CountdownTimer
                  activeSince={activeSaree.active_since}
                  auctionSeconds={activeSaree.auction_seconds}
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400">Highest bid</p>
              <p className="text-2xl font-extrabold text-rose-600 mt-0.5">
                {highestBid > 0 ? formatPrice(highestBid) : "—"}
              </p>
            </div>
            <div className="bg-zinc-50 rounded-xl p-3 text-center">
              <p className="text-xs text-zinc-400">Bids</p>
              <p className="text-2xl font-extrabold text-zinc-900 mt-0.5">{bids.length}</p>
            </div>
          </div>

          {winner && (
            <div className="bg-green-50 rounded-xl p-3 text-sm">
              <span className="text-zinc-500">Leading: </span>
              <span className="font-semibold text-green-700">{winner.profiles.display_name}</span>
              <span className="text-zinc-500"> at </span>
              <span className="font-semibold">{formatPrice(winner.amount)}</span>
            </div>
          )}

          <Button onClick={endLot} loading={advancing} variant="primary">
            End Lot & Go Next →
          </Button>
        </div>
      ) : (
        <div className="bg-zinc-50 rounded-2xl p-6 text-center text-zinc-400">
          No active lot. All lots may be completed.
        </div>
      )}

      {/* Lot list */}
      <div className="space-y-2">
        {sarees.map((s) => (
          <div
            key={s.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
              s.status === "active"
                ? "border-rose-300 bg-rose-50"
                : s.status === "sold"
                ? "border-green-200 bg-green-50"
                : s.status === "unsold"
                ? "border-zinc-200 bg-zinc-100"
                : "border-zinc-100 bg-white"
            }`}
          >
            <span className="text-sm font-mono text-zinc-400 w-6">{s.position}</span>
            <span className="flex-1 text-sm font-medium text-zinc-800 truncate">{s.title}</span>
            <span className="text-xs font-semibold capitalize text-zinc-500">
              {s.status === "sold" && s.winning_bid
                ? formatPrice(s.winning_bid)
                : s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
