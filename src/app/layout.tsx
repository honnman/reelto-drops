import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Reelto Drop — Live Saree Auctions",
  description: "Bid on handpicked sarees in live timed drops. WhatsApp checkout.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://drop.reelto.in"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.className} antialiased bg-white text-zinc-900`}>
        {children}
      </body>
    </html>
  );
}
