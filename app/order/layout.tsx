import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Laser CNC — PPLG",
  description: "Buat desain laser CNC kustom kamu sendiri. Pilih template, edit, dan pesan langsung.",
};

export default function OrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
