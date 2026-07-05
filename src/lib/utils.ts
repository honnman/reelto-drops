/** Convert paise to formatted ₹ string e.g. 123456 → "₹1,234" */
export function formatPrice(paise: number): string {
  const rupees = Math.floor(paise / 100);
  return "₹" + rupees.toLocaleString("en-IN");
}

/** Next bid increment: 5% above current, rounded to nearest ₹10 */
export function nextBidAmount(currentPaise: number): number {
  const nextRupees = Math.ceil((currentPaise * 1.05) / 1000) * 10;
  return nextRupees * 100;
}

/** Build WhatsApp deep-link for checkout */
export function whatsappCheckoutUrl(opts: {
  sellerPhone: string;
  sareeTitle: string;
  winningBid: number;
  bidId: string;
}): string {
  const amount = formatPrice(opts.winningBid);
  const msg = encodeURIComponent(
    `Hi! I won "${opts.sareeTitle}" in the Reelto Drop for ${amount}. Order ref: ${opts.bidId.slice(0, 8).toUpperCase()}. Please confirm and share payment details.`
  );
  const phone = opts.sellerPhone.replace(/\D/g, "");
  return `https://wa.me/${phone}?text=${msg}`;
}

/** Supabase Storage public URL */
export function storageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/saree-images/${path}`;
}

/** Seconds remaining from active_since + auction_seconds */
export function secondsRemaining(activeSince: string, auctionSeconds: number): number {
  const elapsed = (Date.now() - new Date(activeSince).getTime()) / 1000;
  return Math.max(0, auctionSeconds - elapsed);
}
