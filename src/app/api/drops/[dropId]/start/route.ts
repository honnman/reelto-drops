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

  // Verify this seller owns the drop
  const { data: drop } = await service
    .from("drops")
    .select("id, seller_id, status")
    .eq("id", dropId)
    .single();

  if (!drop || drop.seller_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (drop.status !== "scheduled") {
    return NextResponse.json({ error: "Drop is not in scheduled state" }, { status: 400 });
  }

  // Start the drop and activate first lot
  const { error: dropErr } = await service
    .from("drops")
    .update({ status: "live", started_at: new Date().toISOString() })
    .eq("id", dropId);

  if (dropErr) return NextResponse.json({ error: dropErr.message }, { status: 500 });

  const { error: lotErr } = await service
    .from("sarees")
    .update({ status: "active", active_since: new Date().toISOString() })
    .eq("drop_id", dropId)
    .eq("position", 1);

  if (lotErr) return NextResponse.json({ error: lotErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
