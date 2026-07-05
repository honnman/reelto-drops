"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { storageUrl } from "@/lib/utils";

interface SareeUploadFormProps {
  dropId: string;
  position: number;
  userId: string;
}

export default function SareeUploadForm({ dropId, position, userId }: SareeUploadFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingPrice, setStartingPrice] = useState("");
  const [auctionSeconds, setAuctionSeconds] = useState("120");
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 6);
    const items = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => [...prev, ...items].slice(0, 6));
  }

  function removeImage(i: number) {
    setPreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function save() {
    if (!title || !startingPrice) return;
    setError("");
    setSaving(true);

    // Insert saree
    const { data: saree, error: sareeErr } = await supabase
      .from("sarees")
      .insert({
        drop_id: dropId,
        seller_id: userId,
        position,
        title: title.trim(),
        description: description.trim() || null,
        starting_price: Math.round(parseFloat(startingPrice) * 100),
        auction_seconds: parseInt(auctionSeconds),
      })
      .select()
      .single();

    if (sareeErr || !saree) {
      setError(sareeErr?.message ?? "Failed to save");
      setSaving(false);
      return;
    }

    // Upload images
    for (let i = 0; i < previews.length; i++) {
      const { file } = previews[i];
      const path = `${userId}/${saree.id}/${i}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("saree-images")
        .upload(path, file, { upsert: true });

      if (!uploadErr) {
        await supabase.from("saree_images").insert({
          saree_id: saree.id,
          storage_path: path,
          position: i,
        });
      }
    }

    setSaving(false);
    router.push(`/seller/drops/${dropId}`);
    router.refresh();
  }

  const rupees = parseFloat(startingPrice) || 0;

  return (
    <div className="space-y-5 max-w-lg">
      {/* Images */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Photos (up to 6)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-zinc-100">
              <Image src={p.url} alt="" fill className="object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ))}
          {previews.length < 6 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-zinc-300 flex flex-col items-center justify-center gap-1 text-zinc-400 hover:border-rose-400 hover:text-rose-400 transition-colors"
            >
              <span className="text-2xl">+</span>
              <span className="text-xs">Add photo</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFilePick}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Saree name *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Banarasi Silk — Red & Gold"
          className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Fabric, weave, blouse piece, occasion..."
          className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Starting price (₹) *</label>
          <input
            type="number"
            inputMode="numeric"
            value={startingPrice}
            onChange={(e) => setStartingPrice(e.target.value)}
            placeholder="500"
            min="1"
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Timer</label>
          <select
            value={auctionSeconds}
            onChange={(e) => setAuctionSeconds(e.target.value)}
            className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500 bg-white"
          >
            <option value="60">1 min</option>
            <option value="120">2 min</option>
            <option value="180">3 min</option>
            <option value="300">5 min</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        onClick={save}
        loading={saving}
        disabled={!title.trim() || rupees <= 0}
      >
        Add to Drop (Lot {position})
      </Button>
    </div>
  );
}
