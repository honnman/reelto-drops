import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DropRoom from "@/components/drop/DropRoom";

interface Props {
  params: Promise<{ dropId: string }>;
}

export default async function DropPage({ params }: Props) {
  const { dropId } = await params;
  const supabase = await createClient();

  const { data: drop } = await supabase
    .from("drops")
    .select(`
      *,
      profiles(id, display_name, whatsapp_number),
      sarees(
        *,
        saree_images(*)
      )
    `)
    .eq("id", dropId)
    .order("position", { referencedTable: "sarees" })
    .single();

  if (!drop) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  return <DropRoom drop={drop as any} userId={user?.id ?? null} />;
}
