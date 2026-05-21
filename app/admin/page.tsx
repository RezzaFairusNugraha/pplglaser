"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getDashboard, type DashboardData } from "@/lib/api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed:  "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled:  "bg-red-500/20 text-red-400 border-red-500/30",
};

const METHOD_ICONS: Record<string, string> = {
  cash: "💵",
  transfer: "🏦",
  qris: "📱",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(s: string) {
  try {
    return format(new Date(s), "dd MMM yyyy, HH:mm", { locale: localeId });
  } catch {
    return s;
  }
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const d = await getDashboard();
      setData(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [load]);

  if (loading) return <Skeleton />;
  if (error)
    return (
      <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">
        ⚠️ Gagal memuat data: {error}
        <button onClick={load} className="ml-4 underline text-brand">
          Coba lagi
        </button>
      </div>
    );
  if (!data) return null;

  const stats = [
    { label: "Total Pesanan", value: data.total_orders, icon: "📋", color: "text-white" },
    { label: "Menunggu", value: data.pending, icon: "⏳", color: "text-yellow-400" },
    { label: "Diproses", value: data.processing, icon: "⚙️", color: "text-blue-400" },
    { label: "Selesai", value: data.completed, icon: "✅", color: "text-green-400" },
    { label: "Pendapatan Hari Ini", value: fmt(data.today_revenue), icon: "📅", color: "text-brand" },
    { label: "Total Pendapatan", value: fmt(data.total_revenue), icon: "💰", color: "text-brand" },
  ];

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Dashboard</h1>
          <p className="text-gray-400 text-sm">Ringkasan PPLG Laser CNC</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-dark-50/50 border border-white/5 rounded-xl p-4"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className={`text-xl font-bold font-heading ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-dark-50/50 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold">Pesanan Terbaru</h2>
            <Link href="/admin/orders" className="text-brand text-sm hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent_orders.length === 0 && (
              <p className="text-gray-500 text-sm px-5 py-4">Belum ada pesanan</p>
            )}
            {data.recent_orders.map((o) => (
              <Link
                key={o.order_number}
                href={`/admin/orders/${o.order_number}`}
                className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition group"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-medium group-hover:text-brand transition truncate">
                      {o.customer_name}
                    </p>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_COLORS[o.status]}`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs font-mono">{o.order_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-white text-sm">
                    {o.total_price > 0 ? fmt(o.total_price) : "—"}
                  </p>
                  <p className="text-gray-600 text-xs">{fmtDate(o.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-dark-50/50 border border-white/5 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-white font-semibold">Transaksi Terbaru</h2>
            <Link href="/admin/transactions" className="text-brand text-sm hover:underline">
              Lihat semua →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {data.recent_payments.length === 0 && (
              <p className="text-gray-500 text-sm px-5 py-4">Belum ada pembayaran</p>
            )}
            {data.recent_payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center text-lg shrink-0">
                  {METHOD_ICONS[p.payment_method]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {p.customer_name}
                  </p>
                  <p className="text-gray-500 text-xs font-mono">{p.order_number}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-green-400 font-semibold text-sm">{fmt(p.amount)}</p>
                  <p className="text-gray-600 text-xs">{fmtDate(p.paid_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="max-w-6xl space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-white/5 rounded-lg" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 bg-white/5 rounded-xl" />
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="h-64 bg-white/5 rounded-xl" />
        <div className="h-64 bg-white/5 rounded-xl" />
      </div>
    </div>
  );
}
