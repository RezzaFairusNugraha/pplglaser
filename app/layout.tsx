import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Orbitron } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PPLG Laser CNC — Cetak Presisi, Hasil Maksimal",
  description:
    "Jasa laser CNC cutting & engraving presisi tinggi. Pilih template, edit desain, dan pesan langsung via WhatsApp.",
  keywords: [
    "laser CNC",
    "laser cutting",
    "laser engraving",
    "custom design",
    "antigravity",
  ],
  authors: [{ name: "PPLG Laser CNC" }],
  openGraph: {
    title: "PPLG Laser CNC",
    description: "Cetak Presisi, Hasil Maksimal — Jasa laser CNC terpercaya",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`dark ${inter.variable} ${orbitron.variable}`}>
      <body className="antialiased bg-dark-500 text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
