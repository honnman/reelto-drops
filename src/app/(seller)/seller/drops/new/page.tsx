"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function NewDropPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function create() {
    setError("");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const scheduled_at = new Date(`${date}T${time}`).toISOString();

    const { data: drop, error: err } = await supabase
      .from("drops")
      .insert({ seller_id: user.id, title: title.trim(), description: description.trim() || null, scheduled_at })
      .select()
      .single();

    setLoading(false);
    if (err || !drop) { setError(err?.message ?? "Failed to create"); return; }
    router.push(`/seller/drops/${drop.id}`);
  }

  const valid = title.trim() && date && time;

  return (
    <main className="min-h-screen bg-zinc-50 max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-zinc-900 mb-6">New Drop</h1>
      <div className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Drop name *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Weekend Silk Drop — July"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What's special about this drop?"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Time *</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button onClick={create} loading={loading} disabled={!valid}>
          Create Drop & Add Sarees →
        </Button>
      </div>
    </main>
  );
}
