"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getOrders, deleteOrder, type Order } from "@/lib/api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20   text-blue-400   border-blue-500/30",
  completed:  "bg-green-500/20  text-green-400  border-green-500/30",
  cancelled:  "bg-red-500/20    text-red-400    border-red-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu", processing: "Diproses",
  completed: "Selesai", cancelled: "Dibatalkan",
};

function fmt(n: number) {
  return n > 0
    ? new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n)
    : "—";
}

function fmtDate(s: string) {
  try { return format(new Date(s), "dd MMM yyyy, HH:mm", { locale: localeId }); }
  catch { return s; }
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrders({
        status: filterStatus || undefined,
        limit: PER_PAGE,
        offset: page * PER_PAGE,
      });
      setOrders(res.data);
      setTotal(res.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [filterStatus, page]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (orderNumber: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pesanan ${orderNumber}?\nIni juga akan menghapus data pembayaran terkait!`)) return;
    try {
      await deleteOrder(orderNumber);
      load(); // refresh data
    } catch (e) {
      alert("Gagal menghapus pesanan: " + (e as Error).message);
    }
  };

  const filtered = search.trim()
    ? orders.filter(o =>
        o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        o.order_number.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Pesanan</h1>
          <p className="text-gray-400 text-sm">Total {total} pesanan</p>
        </div>
        <button onClick={load}
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm transition">
          🔄 Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text" placeholder="Cari nama / no. order..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-dark-50/50 border border-white/10 text-white text-sm focus:outline-none focus:border-brand"
        />
        {["", "pending", "processing", "completed", "cancelled"].map(s => (
          <button key={s}
            onClick={() => { setFilterStatus(s); setPage(0); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
              filterStatus === s
                ? "bg-brand/20 text-brand border-brand/40"
                : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
            }`}>
            {s === "" ? "Semua" : STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-red-400 text-sm">⚠️ {error}</p>}

      {/* Table */}
      <div className="bg-dark-50/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-5 py-3 text-left">No. Order</th>
                <th className="px-5 py-3 text-left">Pelanggan</th>
                <th className="px-5 py-3 text-left">Template</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-right">Harga</th>
                <th className="px-5 py-3 text-right">Dibayar</th>
                <th className="px-5 py-3 text-left">Tgl Masuk</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Memuat...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Tidak ada pesanan</td></tr>
              )}
              {filtered.map(o => {
                const sisa = (o.total_price ?? 0) - (o.total_paid ?? 0);
                return (
                  <tr key={o.order_number} className="hover:bg-white/3 transition">
                    <td className="px-5 py-3 font-mono text-gray-300">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <p className="text-white font-medium">{o.customer_name}</p>
                      {o.whatsapp_number && (
                        <p className="text-gray-500 text-xs">{o.whatsapp_number}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-400">
                      {o.template_name || "—"}
                      {(o.template_width > 0) && (
                        <span className="text-gray-600 text-xs block">
                          {o.template_width}×{o.template_height}mm
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[o.status]}`}>
                        {STATUS_LABELS[o.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white">{fmt(o.total_price)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`font-medium ${(o.total_paid ?? 0) > 0 ? "text-green-400" : "text-gray-500"}`}>
                        {fmt(o.total_paid ?? 0)}
                      </span>
                      {sisa > 0 && o.total_price > 0 && (
                        <p className="text-red-400 text-xs">Kurang {fmt(sisa)}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(o.created_at)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/orders/${o.order_number}`}
                          className="px-3 py-1.5 rounded-lg bg-brand/20 text-brand hover:bg-brand/30 text-xs font-medium transition">
                          Detail
                        </Link>
                        <button onClick={() => handleDelete(o.order_number)}
                          className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-medium transition">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > PER_PAGE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/5">
            <p className="text-gray-500 text-xs">
              Menampilkan {page * PER_PAGE + 1}–{Math.min((page + 1) * PER_PAGE, total)} dari {total}
            </p>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded text-xs bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10">
                ← Prev
              </button>
              <button disabled={(page + 1) * PER_PAGE >= total} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded text-xs bg-white/5 text-gray-400 disabled:opacity-30 hover:bg-white/10">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
