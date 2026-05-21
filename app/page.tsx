"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getFloatingWhatsAppUrl } from "@/lib/whatsapp";
import { products } from "@/lib/products";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" },
  }),
};




const steps = [
  { num: "01", title: "Pilih Template", desc: "Pilih dari koleksi template bentuk yang tersedia" },
  { num: "02", title: "Edit Desain", desc: "Tambahkan gambar & teks kustom di atas template" },
  { num: "03", title: "Kirim ke WA", desc: "Download preview lalu kirim pesanan via WhatsApp" },
];

const testimonials = [
  { name: "Andi P.", text: "Hasil potong laser-nya rapi banget, presisi tinggi. Sangat puas!", rating: 5 },
  { name: "Sari M.", text: "Proses pesanan cepat dan mudah lewat WhatsApp. Recommended!", rating: 5 },
  { name: "Budi R.", text: "Kualitas engraving luar biasa detail. Pasti order lagi.", rating: 5 },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-dark-500 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-dark-500/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/smk4padalarang.png" alt="Logo SMK 4 Padalarang" width={40} height={40} className="object-contain drop-shadow-md" />
            <span className="font-heading text-lg font-bold tracking-wider text-white">UP PPLG</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#about" className="hover:text-brand transition-colors">Tentang</a>
            <a href="#products" className="hover:text-brand transition-colors">Produk</a>
            <a href="#steps" className="hover:text-brand transition-colors">Cara Pesan</a>
            <a href="#testimonials" className="hover:text-brand transition-colors">Testimoni</a>
          </div>
          <Link href="/order">
            <Button className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 rounded-lg">
              Pesan Sekarang
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center bg-grid pt-16">
        <div className="absolute inset-0 bg-gradient-to-b from-dark-500 via-transparent to-dark-500" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[150px]" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full border border-brand/30 bg-brand/10 text-brand text-sm font-medium mb-6">
              ⚡ Unit Produksi PPLG SMK 4 Padalarang
            </span>
          </motion.div>
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white mb-6 leading-tight">
            Layanan Jasa Laser CNC <br/>
            <span className="text-brand text-glow">Custom Akrilik & Kayu</span>
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Dikelola langsung oleh siswa dan pembimbing jurusan Pengembangan Perangkat Lunak dan Gim (PPLG) untuk melayani kebutuhan cetak plakat, medali, dan gantungan kunci.
          </motion.p>
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order">
              <Button size="lg" className="bg-brand hover:bg-brand-dark text-white font-bold px-10 py-6 text-lg rounded-xl glow-orange">
                Buat Pesanan →
              </Button>
            </Link>
            <a href="#about">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/5 px-10 py-6 text-lg rounded-xl">
                Pelajari Lebih
              </Button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Teaching Factory <span className="text-brand">PPLG</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-lg">
              Kami adalah Unit Produksi (Teaching Factory) di SMK Negeri 4 Padalarang. Selain berfokus pada pengembangan perangkat lunak, kami juga menyediakan jasa pemotongan dan ukir (engraving) dengan mesin Laser CNC modern.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "🎓", title: "Karya Siswa", desc: "Produk dikerjakan langsung oleh siswa terpilih di bawah bimbingan guru produktif." },
              { icon: "⚙️", title: "Mesin Modern", desc: "Menggunakan mesin Laser CNC untuk hasil potong akrilik dan kayu yang rapi." },
              { icon: "💡", title: "Bisa Custom", desc: "Silakan bawa desain sendiri atau konsultasikan kebutuhan desain Anda kepada kami." },
            ].map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <Card className="bg-dark-50/50 border-white/5 backdrop-blur-sm hover:border-brand/30 transition-all duration-300 group">
                  <CardContent className="p-8 text-center">
                    <div className="text-4xl mb-4">{item.icon}</div>
                    <h3 className="font-heading text-xl font-bold text-white mb-2 group-hover:text-brand transition-colors">{item.title}</h3>
                    <p className="text-gray-400">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-24 px-4 bg-dark-300/30">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Produk <span className="text-brand">Kami</span>
            </h2>
            <p className="text-gray-400 text-lg">Berbagai jenis layanan dan produk custom yang bisa Anda pesan</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((item, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative aspect-square rounded-xl overflow-hidden border border-white/5 group cursor-pointer bg-dark-100 flex items-center justify-center">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="text-4xl font-bold text-white/10 group-hover:scale-110 transition-transform duration-500">
                    AG
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  <span className="text-white font-bold mb-1">{item.name}</span>
                  <span className="text-brand text-sm font-semibold">Rp {item.price.toLocaleString("id-ID")}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="steps" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-4">
              Cara <span className="text-brand">Memesan</span>
            </h2>
            <p className="text-gray-400 text-lg">3 langkah mudah untuk mendapatkan hasil laser CNC impianmu</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                className="relative">
                <Card className="bg-dark-50/50 border-white/5 hover:border-brand/30 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="font-heading text-5xl font-black text-brand/20 mb-4">{step.num}</div>
                    <h3 className="font-heading text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400">{step.desc}</p>
                  </CardContent>
                </Card>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 text-brand/40 text-2xl">→</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Removed to avoid generic AI vibe */}


      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-6">
              Siap Membuat <span className="text-brand">Desain Unikmu</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-10">Mulai sekarang dan wujudkan ide kreatifmu dengan presisi laser CNC</p>
            <Link href="/order">
              <Button size="lg" className="bg-brand hover:bg-brand-dark text-white font-bold px-12 py-6 text-lg rounded-xl glow-orange">
                Mulai Desain Sekarang →
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/smk4padalarang.png" alt="Logo SMK" width={32} height={32} className="opacity-80 object-contain" />
            <span className="font-heading text-lg font-bold tracking-wider text-gray-300">UP PPLG</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 Unit Produksi PPLG SMK Negeri 4 Padalarang.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#about" className="hover:text-brand transition-colors">Tentang</a>
            <a href={getFloatingWhatsAppUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-brand transition-colors">Kontak</a>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a href={getFloatingWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 wa-float transition-colors"
        aria-label="Chat WhatsApp">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </main>
  );
}
