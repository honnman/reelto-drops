"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, nextBidAmount } from "@/lib/utils";

interface BidButtonProps {
  sareeId: string;
  currentHighest: number;
  isHighBidder: boolean;
  onBidPlaced: (amount: number) => void;
}

export default function BidButton({
  sareeId,
  currentHighest,
  isHighBidder,
  onBidPlaced,
}: BidButtonProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nextAmount = nextBidAmount(currentHighest);

  async function placeBid() {
    setError("");
    setLoading(true);
    const { data, error } = await supabase.rpc("place_bid", {
      p_saree_id: sareeId,
      p_amount: nextAmount,
    });
    setLoading(false);

    if (error || !data?.ok) {
      setError(data?.error || error?.message || "Could not place bid");
      return;
    }
    onBidPlaced(nextAmount);
  }

  if (isHighBidder) {
    return (
      <div className="bg-green-500 text-white text-center py-4 px-5 rounded-xl font-semibold text-base">
        🏆 You&apos;re winning at {formatPrice(currentHighest)}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      <button
        onClick={placeBid}
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-lg py-4 rounded-xl transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            Bid {formatPrice(nextAmount)}
            <span className="text-white/70 text-sm font-normal">▲</span>
          </>
        )}
      </button>
    </div>
  );
}
