import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fact or Cap 🧢 | Is That Claim Real or Cap?",
  description:
    "Drop any sus claim and we'll tell you if it's legit or straight cap. The vibe check for fake news. No more getting finessed by misinformation.",
  keywords: [
    "fact check",
    "cap or fact",
    "fake news detector",
    "misinformation",
    "AI fact checker",
    "is it cap",
    "truth detector",
  ],
  authors: [{ name: "Fact or Cap Team" }],
  openGraph: {
    title: "Fact or Cap 🧢 | Is That Claim Real or Cap?",
    description:
      "Drop any sus claim and we'll tell you if it's legit or straight cap. No cap.",
    url: "https://factorcap.ai",
    siteName: "Fact or Cap",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fact or Cap 🧢 | Real-Time Fact Checker",
    description:
      "Is that viral claim real? Paste it and find out in seconds. AI-powered fact-checking.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-dark-950 text-white antialiased">
        {/* Noise texture overlay */}
        <div
          className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Main content */}
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
