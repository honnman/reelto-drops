import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Drop } from "@/types/database";
import Button from "@/components/ui/Button";

export default async function SellerDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "seller") redirect("/drops");

  const { data: drops } = await supabase
    .from("drops")
    .select("*")
    .eq("seller_id", user.id)
    .order("scheduled_at", { ascending: false });

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-zinc-900">My Drops</h1>
          <p className="text-sm text-zinc-500">Hi, {profile.display_name}</p>
        </div>
        <Link href="/seller/drops/new">
          <span className="bg-rose-600 text-white font-semibold text-sm px-4 py-2 rounded-xl">
            + New Drop
          </span>
        </Link>
      </div>

      {!drops?.length ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-5xl">🪡</p>
          <p className="text-zinc-500">No drops yet. Create your first one!</p>
          <Link href="/seller/drops/new">
            <Button fullWidth={false} className="mx-auto">Create Drop</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {drops.map((drop: Drop) => (
            <Link key={drop.id} href={`/seller/drops/${drop.id}`}>
              <div className="bg-white rounded-2xl border border-zinc-100 p-4 shadow-sm active:scale-[0.98] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-zinc-900 truncate">{drop.title}</h2>
                    <p className="text-sm text-zinc-400 mt-0.5">
                      {new Date(drop.scheduled_at).toLocaleDateString("en-IN", {
                        weekday: "short", day: "numeric", month: "short",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize flex-shrink-0 ${
                    drop.status === "live" ? "bg-red-100 text-red-600" :
                    drop.status === "ended" ? "bg-zinc-100 text-zinc-500" :
                    "bg-amber-100 text-amber-600"
                  }`}>
                    {drop.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
