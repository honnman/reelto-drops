import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";

interface Props {
  params: Promise<{ dropId: string }>;
}

export default async function SellerDropPage({ params }: Props) {
  const { dropId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: drop } = await supabase
    .from("drops")
    .select("*, sarees(*, saree_images(*))")
    .eq("id", dropId)
    .order("position", { referencedTable: "sarees" })
    .single();

  if (!drop || drop.seller_id !== user.id) notFound();

  const sarees = drop.sarees ?? [];
  const nextPosition = sarees.length + 1;

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/seller/dashboard" className="text-zinc-400 hover:text-zinc-600 text-xl">‹</Link>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-zinc-900 leading-tight">{drop.title}</h1>
          <p className="text-xs text-zinc-400 capitalize">{drop.status}</p>
        </div>
      </div>

      {/* Go live / control */}
      {drop.status === "scheduled" && sarees.length > 0 && (
        <GoLiveButton dropId={dropId} />
      )}
      {drop.status === "live" && (
        <Link href={`/seller/drops/${dropId}/live`}>
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
              <span className="font-bold text-red-700">Drop is LIVE</span>
            </div>
            <span className="text-red-600 font-semibold text-sm">Open Control Panel →</span>
          </div>
        </Link>
      )}

      {/* Lots */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-zinc-900">Lots ({sarees.length})</h2>
          {drop.status === "scheduled" && (
            <Link href={`/seller/drops/${dropId}/sarees/new?pos=${nextPosition}`}>
              <span className="text-sm font-semibold text-rose-600">+ Add Saree</span>
            </Link>
          )}
        </div>

        {sarees.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-8 text-center space-y-3">
            <p className="text-zinc-400">No sarees added yet.</p>
            <Link href={`/seller/drops/${dropId}/sarees/new?pos=1`}>
              <Button fullWidth={false} className="mx-auto">Add First Saree</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {sarees.map((s: any) => (
              <div key={s.id} className="bg-white rounded-2xl border border-zinc-100 p-4 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-zinc-100 text-zinc-500 text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {s.position}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zinc-900 truncate">{s.title}</p>
                  <p className="text-xs text-zinc-400">
                    Starting {formatPrice(s.starting_price)} · {s.auction_seconds / 60} min
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${
                  s.status === "active" ? "bg-red-100 text-red-600" :
                  s.status === "sold" ? "bg-green-100 text-green-600" :
                  "bg-zinc-100 text-zinc-500"
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function GoLiveButton({ dropId }: { dropId: string }) {
  return (
    <form action={`/api/drops/${dropId}/start`} method="POST">
      <button
        type="submit"
        className="w-full bg-rose-600 text-white font-bold py-4 rounded-2xl text-lg active:scale-95 transition-all"
      >
        🚀 Go Live Now
      </button>
    </form>
  );
}
