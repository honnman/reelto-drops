import PhoneOtpForm from "@/components/auth/PhoneOtpForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-zinc-900">
            Reelto <span className="text-rose-600">Drop</span>
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Live saree auctions. Bid, win, wear.
          </p>
        </div>
        <PhoneOtpForm />
      </div>
    </main>
  );
}
