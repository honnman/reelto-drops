import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SareeUploadForm from "@/components/seller/SareeUploadForm";

interface Props {
  params: Promise<{ dropId: string }>;
  searchParams: Promise<{ pos?: string }>;
}

export default async function NewSareePage({ params, searchParams }: Props) {
  const { dropId } = await params;
  const { pos } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const position = parseInt(pos ?? "1");

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">Add Saree (Lot {position})</h1>
      <SareeUploadForm dropId={dropId} position={position} userId={user.id} />
    </main>
  );
}
