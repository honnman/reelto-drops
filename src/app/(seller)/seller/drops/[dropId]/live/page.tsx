import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LiveControlPanel from "@/components/seller/LiveControlPanel";

interface Props {
  params: Promise<{ dropId: string }>;
}

export default async function SellerLivePage({ params }: Props) {
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

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        <h1 className="text-xl font-extrabold text-zinc-900">{drop.title} — Control Panel</h1>
      </div>
      <LiveControlPanel dropId={dropId} initialSarees={drop.sarees as any} />
    </main>
  );
}
