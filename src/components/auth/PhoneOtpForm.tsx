"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function PhoneOtpForm() {
  const router = useRouter();
  const supabase = createClient();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function sendOtp() {
    setError("");
    setLoading(true);
    const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setStep("otp");
  }

  async function verifyOtp() {
    setError("");
    setLoading(true);
    const formatted = phone.startsWith("+") ? phone : `+91${phone.replace(/\D/g, "")}`;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) { setError(error.message); return; }

    // Check if profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user!.id)
      .maybeSingle();

    if (!profile) {
      router.push("/onboarding");
    } else if (profile.role === "seller") {
      router.push("/seller/dashboard");
    } else {
      router.push("/drops");
    }
  }

  return (
    <div className="space-y-4">
      {step === "phone" ? (
        <>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Mobile number
            </label>
            <div className="flex items-center border border-zinc-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-rose-500">
              <span className="px-3 py-3 bg-zinc-50 text-zinc-500 text-sm border-r border-zinc-300 select-none">
                +91
              </span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="flex-1 px-3 py-3 text-base outline-none bg-white"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={sendOtp} loading={loading} disabled={phone.length < 10}>
            Send OTP
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            OTP sent to <span className="font-medium text-zinc-800">+91 {phone}</span>.{" "}
            <button
              onClick={() => setStep("phone")}
              className="text-rose-600 underline"
            >
              Change
            </button>
          </p>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Enter OTP
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • • • •"
              className="w-full border border-zinc-300 rounded-xl px-4 py-3 text-xl tracking-widest text-center outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={verifyOtp} loading={loading} disabled={otp.length < 6}>
            Verify & Continue
          </Button>
        </>
      )}
    </div>
  );
}
