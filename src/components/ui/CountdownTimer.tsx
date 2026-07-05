"use client";
import { useEffect, useState } from "react";
import { secondsRemaining } from "@/lib/utils";

interface CountdownTimerProps {
  activeSince: string;
  auctionSeconds: number;
  onExpire?: () => void;
}

export default function CountdownTimer({
  activeSince,
  auctionSeconds,
  onExpire,
}: CountdownTimerProps) {
  const [secs, setSecs] = useState(() =>
    Math.round(secondsRemaining(activeSince, auctionSeconds))
  );

  useEffect(() => {
    setSecs(Math.round(secondsRemaining(activeSince, auctionSeconds)));
    const id = setInterval(() => {
      const remaining = Math.round(secondsRemaining(activeSince, auctionSeconds));
      setSecs(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 500);
    return () => clearInterval(id);
  }, [activeSince, auctionSeconds, onExpire]);

  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");
  const urgent = secs <= 10;

  return (
    <span
      className={`font-mono font-bold tabular-nums transition-colors ${
        urgent ? "text-red-500 animate-pulse" : "text-zinc-800"
      }`}
    >
      {mm}:{ss}
    </span>
  );
}
