import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Drop } from "@/types/database";

export const revalidate = 30;

export default async function DropsListPage() {
  const supabase = await createClient();

  const { data: drops } = await supabase
    .from("drops")
    .select("*, profiles(display_name)")
    .in("status", ["live", "scheduled"])
    .order("scheduled_at");

  const live = drops?.filter((d) => d.status === "live") ?? [];
  const upcoming = drops?.filter((d) => d.status === "scheduled") ?? [];

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6 space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold text-zinc-900">
          Reelto <span className="text-rose-600">Drop</span>
        </h1>
        <p className="text-zinc-500 text-sm">Live saree auctions</p>
      </header>

      {live.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <h2 className="font-bold text-zinc-900">Live Now</h2>
          </div>
          <div className="space-y-3">
            {live.map((drop) => <DropCard key={drop.id} drop={drop} isLive />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-bold text-zinc-900 mb-3">Upcoming Drops</h2>
        {upcoming.length === 0 ? (
          <p className="text-zinc-400 text-sm">No upcoming drops yet. Check back soon!</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((drop) => <DropCard key={drop.id} drop={drop} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function DropCard({ drop, isLive }: { drop: Drop & { profiles: { display_name: string } }; isLive?: boolean }) {
  const date = new Date(drop.scheduled_at);
  return (
    <Link href={`/drops/${drop.id}`}>
      <div className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 active:scale-[0.98] transition-transform ${isLive ? "border-red-200 ring-1 ring-red-200" : "border-zinc-100"}`}>
        <div className="w-16 h-16 bg-rose-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
          🪡
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-900 truncate">{drop.title}</h3>
            {isLive && (
              <span className="flex-shrink-0 text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 truncate">by {drop.profiles.display_name}</p>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isLive
              ? "Bidding open now"
              : date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <span className="text-zinc-300 text-xl">›</span>
      </div>
    </Link>
  );
}
