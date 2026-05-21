"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getOrder, updateOrderStatus, createPayment,
  type Order, type Payment,
} from "@/lib/api";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_COLORS: Record<string, string> = {
  pending:    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/20   text-blue-400   border-blue-500/30",
  completed:  "bg-green-500/20  text-green-400  border-green-500/30",
  cancelled:  "bg-red-500/20    text-red-400    border-red-500/30",
};

const STATUS_LIST = ["pending", "processing", "completed", "cancelled"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu", processing: "Diproses",
  completed: "Selesai", cancelled: "Dibatalkan",
};
const METHOD_ICONS: Record<string, string> = {
  cash: "💵 Cash", transfer: "🏦 Transfer Bank", qris: "📱 QRIS",
};

function fmt(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(s: string) {
  try { return format(new Date(s), "dd MMM yyyy, HH:mm", { locale: localeId }); }
  catch { return s; }
}

export default function OrderDetail() {
  const params = useParams();
  const orderNumber = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Status update
  const [newStatus, setNewStatus] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [payNotes, setPayNotes] = useState("");
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");

  const handlePayAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    if (!rawValue) {
      setPayAmount("");
    } else {
      setPayAmount(new Intl.NumberFormat("id-ID").format(parseInt(rawValue, 10)));
    }
  };

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getOrder(orderNumber);
      setOrder(res.order);
      setPayments(res.payments);
      setNewStatus(res.order.status);
      setNewPrice(res.order.total_price > 0 ? String(res.order.total_price) : "");
    } catch (e) { setError((e as Error).message); }
    finally { setLoading(false); }
  }, [orderNumber]);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdate = async () => {
    if (!order) return;
    try {
      setStatusBusy(true);
      setStatusMsg("");
      await updateOrderStatus(orderNumber, newStatus, newPrice ? parseFloat(newPrice) : undefined);
      setStatusMsg("✅ Status berhasil diperbarui!");
      await load();
    } catch (e) { setStatusMsg(`❌ ${(e as Error).message}`); }
    finally { setStatusBusy(false); }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount.replace(/\./g, ""));
    if (!amount || amount <= 0) { setPayMsg("⚠️ Jumlah harus lebih dari 0"); return; }
    try {
      setPayBusy(true);
      setPayMsg("");
      await createPayment({
        order_number: orderNumber,
        amount,
        payment_method: payMethod,
        notes: payNotes,
        received_by: "Admin",
      });
      setPayMsg("✅ Pembayaran berhasil dicatat!");
      setPayAmount(""); setPayNotes("");
      await load();
    } catch (e) { setPayMsg(`❌ ${(e as Error).message}`); }
    finally { setPayBusy(false); }
  };

  if (loading) return <div className="text-gray-400 animate-pulse p-6">Memuat detail pesanan...</div>;
  if (error) return <div className="text-red-400 p-4 bg-red-500/10 rounded-xl">⚠️ {error}</div>;
  if (!order) return null;

  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const sisa = order.total_price > 0 ? order.total_price - totalPaid : 0;
  const lunas = order.total_price > 0 && sisa <= 0;

  return (
    <div className="max-w-4xl space-y-6">
      {/* Back */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="text-gray-400 hover:text-brand text-sm transition">
          ← Kembali
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-400 text-sm font-mono">{orderNumber}</span>
      </div>

      {/* Order header */}
      <div className="bg-dark-50/50 border border-white/5 rounded-xl p-5">
        <div className="flex flex-wrap gap-4 items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white font-heading">{order.customer_name}</h1>
            <p className="text-brand font-mono text-sm">{order.order_number}</p>
            {order.whatsapp_number && (
              <a href={`https://wa.me/${order.whatsapp_number.replace(/^0/, "62")}`}
                 target="_blank" rel="noopener noreferrer"
                 className="text-green-400 text-sm hover:underline mt-1 block">
                📱 {order.whatsapp_number}
              </a>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            <span className={`text-sm px-3 py-1.5 rounded-full border font-medium ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
            {lunas && (
              <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                ✅ LUNAS
              </span>
            )}
            {!lunas && totalPaid > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                ⚠️ BELUM LUNAS
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 pt-5 border-t border-white/5">
          <div>
            <p className="text-xs text-gray-500 mb-1">Template</p>
            <p className="text-white font-medium">{order.template_name || "—"}</p>
            {order.template_width > 0 && (
              <p className="text-gray-500 text-xs">{order.template_width}×{order.template_height}mm</p>
            )}
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Tanggal Masuk</p>
            <p className="text-white">{fmtDate(order.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Harga</p>
            <p className="text-white font-semibold">{order.total_price > 0 ? fmt(order.total_price) : "Belum diset"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Sisa Tagihan</p>
            <p className={`font-bold ${lunas ? "text-green-400" : sisa > 0 ? "text-red-400" : "text-gray-400"}`}>
              {order.total_price > 0 ? (lunas ? "Lunas 🎉" : fmt(sisa)) : "—"}
            </p>
          </div>
        </div>

        {order.notes && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-1">Catatan</p>
            <p className="text-gray-300 text-sm">{order.notes}</p>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Update Status & Harga */}
        <div className="bg-dark-50/50 border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">⚙️ Update Status & Harga</h2>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Status Pesanan</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-dark-100 border border-white/10 text-white text-sm focus:outline-none focus:border-brand">
              {STATUS_LIST.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Harga (Rp)</label>
            <input type="number" value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="Masukkan harga, contoh: 50000"
              className="w-full px-3 py-2.5 rounded-lg bg-dark-100 border border-white/10 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {statusMsg && (
            <p className={`text-sm ${statusMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
              {statusMsg}
            </p>
          )}

          <button onClick={handleStatusUpdate} disabled={statusBusy}
            className="w-full py-2.5 rounded-lg bg-brand hover:bg-orange-600 disabled:opacity-50 text-white font-semibold text-sm transition">
            {statusBusy ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>

        {/* Catat Pembayaran */}
        <div className="bg-dark-50/50 border border-white/5 rounded-xl p-5 space-y-4">
          <h2 className="text-white font-semibold">💰 Catat Pembayaran</h2>

          <form onSubmit={handlePayment} className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Jumlah (Rp)</label>
              <input type="text" value={payAmount}
                onChange={handlePayAmountChange}
                placeholder={order.total_price > 0 ? `Sisa Tagihan: ${fmt(sisa > 0 ? sisa : order.total_price)}` : "Masukkan jumlah..."}
                className="w-full px-3 py-2.5 rounded-lg bg-dark-100 border border-white/10 text-white text-sm focus:outline-none focus:border-brand"
                required
              />
            </div>

            {/* Quick fill buttons */}
            {order.total_price > 0 && (
              <div className="flex gap-2 flex-wrap">
                <button type="button"
                  onClick={() => setPayAmount(new Intl.NumberFormat("id-ID").format(sisa > 0 ? sisa : order.total_price))}
                  className="px-3 py-1.5 text-xs rounded-lg bg-brand/20 text-brand hover:bg-brand/30 transition">
                  Pelunasan / Sisa ({fmt(sisa > 0 ? sisa : order.total_price)})
                </button>
              </div>
            )}

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {(["cash", "transfer", "qris"] as const).map(m => (
                  <button key={m} type="button"
                    onClick={() => setPayMethod(m)}
                    className={`py-2 rounded-lg text-xs font-medium border transition ${
                      payMethod === m
                        ? "bg-brand/20 text-brand border-brand/40"
                        : "bg-white/5 text-gray-400 border-white/10 hover:border-white/30"
                    }`}>
                    {METHOD_ICONS[m]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Catatan (opsional)</label>
              <input value={payNotes} onChange={e => setPayNotes(e.target.value)}
                placeholder="contoh: DP 50%..."
                className="w-full px-3 py-2.5 rounded-lg bg-dark-100 border border-white/10 text-white text-sm focus:outline-none focus:border-brand"
              />
            </div>

            {payMsg && (
              <p className={`text-sm ${payMsg.startsWith("✅") ? "text-green-400" : "text-red-400"}`}>
                {payMsg}
              </p>
            )}

            <button type="submit" disabled={payBusy}
              className="w-full py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold text-sm transition">
              {payBusy ? "Mencatat..." : "✅ Catat Pembayaran"}
            </button>
          </form>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-dark-50/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-semibold">Riwayat Pembayaran</h2>
          <div className="flex items-center gap-3">
            <span className="text-green-400 font-bold">{fmt(totalPaid)}</span>
            <span className="text-gray-600 text-xs">dibayar</span>
          </div>
        </div>

        {payments.length === 0 ? (
          <p className="text-gray-500 text-sm px-5 py-8 text-center">
            Belum ada pembayaran yang dicatat
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {payments.map(p => (
              <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-lg shrink-0">
                  {p.payment_method === "cash" ? "💵" : p.payment_method === "transfer" ? "🏦" : "📱"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold">{fmt(Number(p.amount))}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                      {METHOD_ICONS[p.payment_method]}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {fmtDate(p.paid_at)} · Diterima oleh {p.received_by}
                    {p.notes ? ` · ${p.notes}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary bar */}
        {order.total_price > 0 && (
          <div className="px-5 py-3 border-t border-white/5 bg-white/2">
            <div className="flex justify-between text-sm">
              <div>
                <span className="text-gray-500">Total tagihan:</span>
                <span className="text-white font-medium ml-2">{fmt(order.total_price)}</span>
              </div>
              <div>
                <span className="text-gray-500">Sudah dibayar:</span>
                <span className="text-green-400 font-medium ml-2">{fmt(totalPaid)}</span>
              </div>
              <div>
                <span className="text-gray-500">Sisa:</span>
                <span className={`font-bold ml-2 ${lunas ? "text-green-400" : "text-red-400"}`}>
                  {lunas ? "Lunas ✅" : fmt(sisa)}
                </span>
              </div>
            </div>
            {!lunas && order.total_price > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all"
                     style={{ width: `${Math.min(100, (totalPaid / order.total_price) * 100)}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Canvas preview */}
      {order.canvas_data_url && (
        <div className="bg-dark-50/50 border border-white/5 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">🖼️ Preview Desain</h2>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={order.canvas_data_url} alt="Desain"
            className="max-w-xs rounded-lg border border-white/10 mx-auto block" />
        </div>
      )}
    </div>
  );
}
