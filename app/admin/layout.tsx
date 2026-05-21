"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";

const ADMIN_KEY =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_ADMIN_SECRET ?? "pplglaser"
    : "";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const saved = sessionStorage.getItem("ag_admin");
    if (saved === "1") setAuthed(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_KEY) {
      sessionStorage.setItem("ag_admin", "1");
      setAuthed(true);
      setError("");
    } else {
      setError("Password salah!");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ag_admin");
    setAuthed(false);
    router.push("/admin");
  };

  if (!authed) {
    return (
      <div className="min-h-screen bg-dark-500 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-white p-1 flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-white font-heading shadow-lg shadow-black/20 relative">
              <Image src="/smk4padalarang.png" alt="Logo SMK" fill className="object-contain drop-shadow-md" />
            </div>
            <h1 className="text-2xl font-bold text-white font-heading">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1">PPLG Laser CNC</p>
          </div>

          <form
            onSubmit={handleLogin}
            className="bg-dark-50/50 border border-white/10 rounded-2xl p-6 space-y-4"
          >
            <div>
              <label className="text-sm text-gray-400 mb-1.5 block">Password Admin</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-dark-100 border border-white/10 text-white focus:outline-none focus:border-brand transition"
                placeholder="Masukkan password..."
                autoFocus
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-brand hover:bg-orange-600 text-white font-semibold transition"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/orders", label: "Pesanan", icon: "📋" },
    { href: "/admin/transactions", label: "Transaksi", icon: "💰" },
  ];

  return (
    <div className="min-h-screen bg-dark-500 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-56 bg-dark-50/50 border-b md:border-b-0 md:border-r border-white/5 flex flex-col py-4 md:py-6 px-3 md:h-screen md:sticky top-0 shrink-0 z-20">
        <div className="flex items-center justify-between md:justify-start gap-2 px-3 md:mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white p-0.5 flex items-center justify-center font-heading font-bold text-sm text-white relative">
              <Image src="/smk4padalarang.png" alt="Logo SMK" fill className="object-contain" />
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm">PPLG</p>
              <p className="text-[10px] text-gray-500">Admin Panel</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-red-400 transition-colors"
          >
            🚪 Keluar
          </button>
        </div>

        <nav className="flex md:flex-col gap-1 md:flex-1 overflow-x-auto mt-4 md:mt-0 pb-1 md:pb-0 scrollbar-hide">
          {navItems.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? "bg-brand/20 text-brand"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="hidden md:flex items-center gap-2 px-3 py-2.5 text-sm text-gray-500 hover:text-red-400 transition-colors"
        >
          🚪 Keluar
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 w-full overflow-x-hidden p-4 md:p-6">{children}</main>
    </div>
  );
}
