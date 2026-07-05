"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [name, setName] = useState("");
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setError("");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      role,
      display_name: name.trim(),
      whatsapp_number: role === "seller" ? `+91${whatsapp.replace(/\D/g, "")}` : null,
    });

    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push(role === "seller" ? "/seller/dashboard" : "/drops");
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Set up your account</h1>
          <p className="text-sm text-zinc-500 mt-1">Just a few details to get started.</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Your name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {(["buyer", "seller"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`py-3 rounded-xl border-2 font-semibold capitalize transition-all ${
                    role === r
                      ? "border-rose-600 bg-rose-50 text-rose-700"
                      : "border-zinc-200 text-zinc-500"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {role === "seller" && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">
                WhatsApp number (buyers contact you here)
              </label>
              <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-500">
                <span className="px-3 py-3 bg-zinc-50 text-zinc-500 text-sm border-r border-zinc-300">
                  +91
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
                  placeholder="98765 43210"
                  className="flex-1 px-3 py-3 outline-none bg-white"
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            onClick={save}
            loading={loading}
            disabled={!name.trim() || (role === "seller" && whatsapp.length < 10)}
          >
            Continue
          </Button>
        </div>
      </div>
    </main>
  );
}
