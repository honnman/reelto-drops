"use client";
import { useEffect, useRef } from "react";
import { BidWithBidder } from "@/types/database";
import { formatPrice } from "@/lib/utils";

interface BidFeedProps {
  bids: BidWithBidder[];
  currentUserId?: string;
}

export default function BidFeed({ bids, currentUserId }: BidFeedProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [bids.length]);

  if (bids.length === 0) {
    return (
      <div className="text-center text-sm text-zinc-400 py-4">
        No bids yet — be the first!
      </div>
    );
  }

  return (
    <div ref={ref} className="overflow-y-auto max-h-40 space-y-1 px-4 py-2">
      {bids.map((bid, i) => {
        const isMe = bid.bidder_id === currentUserId;
        const isLatest = i === bids.length - 1;
        return (
          <div
            key={bid.id}
            className={`flex items-center justify-between text-sm py-1 rounded-lg px-2 transition-colors ${
              isLatest ? "bg-rose-50" : ""
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isLatest && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              )}
              <span className={`font-medium truncate ${isMe ? "text-rose-600" : "text-zinc-700"}`}>
                {isMe ? "You" : bid.profiles.display_name}
              </span>
            </div>
            <span className="font-semibold text-zinc-900 tabular-nums flex-shrink-0 ml-2">
              {formatPrice(bid.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
