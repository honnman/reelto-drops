import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
      <div className="max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-zinc-900">
            Reelto <span className="text-rose-600">Drop</span>
          </h1>
          <p className="text-zinc-500 text-lg">
            Live saree auctions. Bid, win, wear.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/drops"
            className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl text-lg active:scale-95 transition-all"
          >
            Browse Live Drops
          </Link>
          <Link
            href="/login"
            className="w-full border border-zinc-200 text-zinc-700 font-semibold py-4 rounded-2xl text-base hover:bg-zinc-50 transition-all"
          >
            Login / Sign up
          </Link>
        </div>

        <p className="text-xs text-zinc-400">
          Are you a seller?{" "}
          <Link href="/login" className="text-rose-600 underline">
            Create your drop
          </Link>
        </p>
      </div>
    </main>
  );
}
