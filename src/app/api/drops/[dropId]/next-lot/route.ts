import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ dropId: string }> }
) {
  const { dropId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();

  // Verify seller owns the drop
  const { data: drop } = await service
    .from("drops")
    .select("seller_id, status")
    .eq("id", dropId)
    .single();

  if (!drop || drop.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (drop.status !== "live") {
    return NextResponse.json({ error: "Drop is not live" }, { status: 400 });
  }

  // Atomically advance to next lot via DB function
  const { data, error } = await service.rpc("advance_lot", { p_drop_id: dropId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data?.ok) return NextResponse.json({ error: data?.error }, { status: 400 });

  return NextResponse.json(data);
}
