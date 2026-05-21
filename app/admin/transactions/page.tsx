"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getPayments, type Payment } from "@/lib/api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

function fmtDate(s: string) {
  try { return format(new Date(s), "dd MMM yyyy, HH:mm", { locale: localeId }); }
  catch { return s; }
}

export default function AdminTransactions() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getPayments({
        limit: PER_PAGE,
        offset: page * PER_PAGE,
      });
      setPayments(res.data);
      setTotal(res.total);
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const filtered = search.trim()
    ? payments.filter(p =>
        (p.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
        p.order_number.toLowerCase().includes(search.toLowerCase()))
    : payments;

  return (
    <div className="max-w-6xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading">Riwayat Transaksi</h1>
          <p className="text-gray-400 text-sm">Total {total} transaksi tercatat</p>
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
                <th className="px-5 py-3 text-left">Metode</th>
                <th className="px-5 py-3 text-right">Nominal</th>
                <th className="px-5 py-3 text-left">Penerima</th>
                <th className="px-5 py-3 text-left">Waktu Bayar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Memuat...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Tidak ada transaksi</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-white/3 transition">
                  <td className="px-5 py-3 font-mono text-gray-300">
                    <Link href={`/admin/orders/${p.order_number}`} className="hover:text-brand hover:underline">
                      {p.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white font-medium">{p.customer_name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs px-2 py-1 rounded-full border bg-gray-500/20 text-gray-400 border-gray-500/30 uppercase">
                      {p.payment_method}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-green-400 font-medium">{fmt(p.amount)}</td>
                  <td className="px-5 py-3 text-gray-400">{p.received_by || "—"}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {fmtDate(p.paid_at)}
                  </td>
                </tr>
              ))}
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
