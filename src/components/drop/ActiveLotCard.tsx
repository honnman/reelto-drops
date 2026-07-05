"use client";
import { useState } from "react";
import Image from "next/image";
import { SareeWithImages } from "@/types/database";
import { storageUrl } from "@/lib/utils";
import PriceDisplay from "@/components/ui/PriceDisplay";
import CountdownTimer from "@/components/ui/CountdownTimer";

interface ActiveLotCardProps {
  saree: SareeWithImages;
  currentBid: number;
  totalLots: number;
  onTimerExpire?: () => void;
}

export default function ActiveLotCard({
  saree,
  currentBid,
  totalLots,
  onTimerExpire,
}: ActiveLotCardProps) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = [...saree.saree_images].sort((a, b) => a.position - b.position);

  return (
    <div className="flex flex-col">
      {/* Lot progress pill */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
          Lot {saree.position} of {totalLots}
        </span>
        {saree.active_since && (
          <div className="flex items-center gap-1.5 bg-red-50 px-3 py-1 rounded-full">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <CountdownTimer
              activeSince={saree.active_since}
              auctionSeconds={saree.auction_seconds}
              onExpire={onTimerExpire}
            />
          </div>
        )}
      </div>

      {/* Image carousel */}
      <div className="relative aspect-[3/4] bg-zinc-100 overflow-hidden">
        {images.length > 0 ? (
          <Image
            src={storageUrl(images[imgIdx].storage_path)}
            alt={saree.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-5xl">
            🪡
          </div>
        )}

        {/* Dot nav */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImgIdx(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === imgIdx ? "bg-white scale-125" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Swipe areas */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => setImgIdx((i) => Math.max(0, i - 1))}
              className="absolute left-0 inset-y-0 w-1/3"
              aria-label="Previous photo"
            />
            <button
              onClick={() => setImgIdx((i) => Math.min(images.length - 1, i + 1))}
              className="absolute right-0 inset-y-0 w-1/3"
              aria-label="Next photo"
            />
          </>
        )}
      </div>

      {/* Info */}
      <div className="px-4 pt-3 pb-1 space-y-1">
        <h2 className="text-xl font-bold text-zinc-900 leading-tight">{saree.title}</h2>
        {saree.description && (
          <p className="text-sm text-zinc-500 line-clamp-2">{saree.description}</p>
        )}
        <div className="flex items-end gap-2 pt-1">
          <PriceDisplay paise={currentBid} size="lg" />
          {currentBid === saree.starting_price && (
            <span className="text-sm text-zinc-400 mb-1">starting price</span>
          )}
        </div>
      </div>
    </div>
  );
}
