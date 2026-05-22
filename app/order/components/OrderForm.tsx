"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { useOrderStore, ExportMode } from "@/lib/store";
import { generateWhatsAppUrl } from "@/lib/whatsapp";
import { submitOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderForm() {
  const store = useOrderStore();
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!store.orderNumber) {
      store.generateOrderNumber();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadPreview = () => {
    if (!store.canvasDataUrl) return;
    const link = document.createElement("a");
    link.download = `${store.orderNumber || "preview"}-desain.png`;
    link.href = store.canvasDataUrl;
    link.click();
  };

  const handleSendWhatsApp = async () => {
    if (!store.customerName.trim()) return;
    
    handleDownloadPreview();

    // 1. Simpan ke database terlebih dahulu
    try {
      await submitOrder({
        order_number: store.orderNumber,
        customer_name: store.customerName,
        whatsapp_number: store.whatsappNumber,
        template_id: store.selectedProduct?.id || "",
        template_name: store.selectedProduct?.name || "",
        template_width: store.selectedTemplate?.dimensions.width || 0,
        template_height: store.selectedTemplate?.dimensions.height || 0,
        notes: store.notes,
        canvas_data_url: store.canvasDataUrl,
        total_price: store.selectedProduct?.price || 0,
      });
    } catch (e) {
      console.error("Gagal menyimpan ke database, melanjutkan ke WA:", e);
    }

    // 2. Buka WhatsApp
    const url = generateWhatsAppUrl({
      customerName: store.customerName,
      productName: store.selectedProduct?.name || "",
      productPrice: store.selectedProduct?.price || 0,
      templateName: store.selectedTemplate?.name || "",
      notes: store.notes,
      orderNumber: store.orderNumber,
    });
    setTimeout(() => {
      window.open(url, "_blank");
      setShowInstructions(true);
    }, 500);
  };

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      store.setCanvasDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Struk ${store.orderNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; font-size: 12px; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .line { border-top: 1px dashed #000; margin: 8px 0; }
      .row { display: flex; justify-content: space-between; margin: 3px 0; }
      .title { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
      .small { font-size: 10px; color: #666; }
      img { max-width: 100%; margin: 8px 0; }
    </style></head><body>
      <div class="center">
        <div class="title">PPLG</div>
        <div class="small">Laser CNC Service</div>
      </div>
      <div class="line"></div>
      <div class="row"><span>No. Order:</span><span class="bold">${store.orderNumber}</span></div>
      <div class="row"><span>Tanggal:</span><span>${store.timestamp ? format(store.timestamp, "dd/MM/yyyy HH:mm") : "-"}</span></div>
      <div class="line"></div>
      <div class="row"><span>Nama:</span><span>${store.customerName}</span></div>
      <div class="row"><span>WhatsApp:</span><span>${store.whatsappNumber || "-"}</span></div>
      <div class="line"></div>
      <div class="row"><span>Produk:</span><span>${store.selectedProduct?.name || "-"}</span></div>
      <div class="row"><span>Harga:</span><span>Rp ${store.selectedProduct?.price.toLocaleString("id-ID") || "-"}</span></div>
      ${store.selectedTemplate ? `<div class="row"><span>Template:</span><span>${store.selectedTemplate.name}</span></div>
      <div class="row"><span>Ukuran:</span><span>${store.selectedTemplate.dimensions.width}×${store.selectedTemplate.dimensions.height}mm</span></div>` : ""}
      ${store.notes ? `<div class="row"><span>Catatan:</span></div><div class="small">${store.notes}</div>` : ""}
      ${store.exportMode ? `<div class="row"><span>Mode Export:</span><span>${store.exportMode}</span></div>` : ""}
      <div class="line"></div>
      ${store.canvasDataUrl ? `<div class="center"><img src="${store.canvasDataUrl}" alt="Preview"/></div><div class="line"></div>` : ""}
      <div class="center small">Terima kasih telah memesan di PPLG!</div>
      <div class="center small">wa.me/6285863244821</div>
    </body></html>`);
    win.document.close();
    win.print();
  };

  const handleExportSVG = (mode: ExportMode) => {
    store.setExportMode(mode);
    setShowExportDropdown(false);

    // Generate a simple SVG based on the canvas data
    const svgWidth = store.selectedTemplate?.dimensions.width || 80;
    const svgHeight = store.selectedTemplate?.dimensions.height || 80;

    let svgContent = "";
    if (mode === "outline") {
      svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <title>PPLG LaserGRBL - Outline Mode - ${store.orderNumber}</title>
  <desc>Template: ${store.selectedTemplate?.name}, Mode: Outline (Vector Cut)</desc>
  <!-- LaserGRBL Outline Mode - Vector cutting path -->
  <rect x="1" y="1" width="${svgWidth - 2}" height="${svgHeight - 2}"
        fill="none" stroke="black" stroke-width="0.1"/>
  ${store.canvasDataUrl ? `<image href="${store.canvasDataUrl}" x="0" y="0" width="${svgWidth}" height="${svgHeight}" opacity="0.3"/>` : ""}
</svg>`;
    } else {
      svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${svgWidth}mm" height="${svgHeight}mm" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <title>PPLG LaserGRBL - Engrave Mode - ${store.orderNumber}</title>
  <desc>Template: ${store.selectedTemplate?.name}, Mode: Engrave (Raster)</desc>
  <!-- LaserGRBL Engrave Mode - Raster engraving -->
  ${store.canvasDataUrl ? `<image href="${store.canvasDataUrl}" x="0" y="0" width="${svgWidth}" height="${svgHeight}"/>` : ""}
</svg>`;
    }

    const blob = new Blob([svgContent], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${store.orderNumber}-${mode}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Detail <span className="text-brand">Pesanan</span>
        </h2>
        <p className="text-gray-400">Lengkapi data dan kirim pesanan kamu</p>
      </div>

      {/* Order number badge */}
      <div className="flex justify-center mb-6">
        <Badge className="bg-brand/20 text-brand border-brand/30 text-sm px-4 py-1.5 font-mono">
          {store.orderNumber}
        </Badge>
      </div>

      {/* Summary card */}
      <Card className="bg-dark-50/50 border-white/10 mb-6">
        <CardContent className="p-4 sm:p-6">
          <h3 className="text-white font-semibold mb-4">Ringkasan Pesanan</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
            {store.canvasDataUrl ? (
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={store.canvasDataUrl} alt="Preview" className="w-full h-full object-cover" />
                {!store.selectedProduct?.hasTemplate && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <span className="text-white text-xs font-semibold">Ganti Foto</span>
                  </div>
                )}
              </div>
            ) : (
              !store.selectedProduct?.hasTemplate && (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-32 h-32 rounded-lg border-2 border-dashed border-white/20 hover:border-brand/50 flex flex-col items-center justify-center cursor-pointer bg-white/5 transition-colors flex-shrink-0"
                >
                  <span className="text-2xl mb-1">📷</span>
                  <span className="text-[10px] text-gray-400 font-semibold">Upload Foto</span>
                </div>
              )
            )}
            <div className="space-y-2 text-sm min-w-0 flex-1">
              <div className="flex gap-2 flex-wrap">
                <span className="text-gray-500 flex-shrink-0">Produk:</span>
                <span className="text-white font-medium">{store.selectedProduct?.name}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-gray-500 flex-shrink-0">Harga:</span>
                <span className="text-white">Rp {store.selectedProduct?.price.toLocaleString("id-ID")}</span>
              </div>
              {store.selectedTemplate && (
                <>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-gray-500 flex-shrink-0">Template:</span>
                    <span className="text-white">{store.selectedTemplate.name}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-gray-500 flex-shrink-0">Ukuran:</span>
                    <span className="text-white">
                      {store.selectedTemplate.dimensions.width}×{store.selectedTemplate.dimensions.height} mm
                    </span>
                  </div>
                </>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="text-gray-500 flex-shrink-0">Waktu:</span>
                <span className="text-white">
                  {store.timestamp ? format(store.timestamp, "dd MMM yyyy, HH:mm", { locale: localeId }) : "-"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form */}
      <div className="space-y-4 mb-8">
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">Nama Pemesan *</label>
          <Input
            placeholder="Masukkan nama lengkap"
            value={store.customerName}
            onChange={(e) => store.setCustomerName(e.target.value)}
            className="bg-dark-100 border-white/10 text-white focus:border-brand"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">
            Nomor WhatsApp <span className="text-brand">*</span>
          </label>
          <Input
            placeholder="contoh: 08123456789"
            value={store.whatsappNumber}
            onChange={(e) => store.setWhatsappNumber(e.target.value)}
            className={`bg-dark-100 border-white/10 text-white focus:border-brand ${
              store.whatsappNumber.trim() === "" ? "border-red-500/30" : ""
            }`}
          />
          {store.whatsappNumber.trim() === "" && (
            <p className="text-xs text-red-400 mt-1">Nomor WhatsApp wajib diisi</p>
          )}
        </div>
        <div>
          <label className="text-sm text-gray-400 mb-1.5 block">
            Deskripsi Pesanan <span className="text-brand">*</span>
          </label>
          <Textarea
            placeholder="Contoh: tolong buat 2 buah, bahan akrilik 3mm, warna biru..."
            value={store.notes}
            onChange={(e) => store.setNotes(e.target.value)}
            rows={4}
            className={`bg-dark-100 border-white/10 text-white focus:border-brand resize-none ${
              store.notes.trim() === "" ? "border-red-500/30" : ""
            }`}
          />
          {store.notes.trim() === "" && (
            <p className="text-xs text-red-400 mt-1">Deskripsi pesanan wajib diisi</p>
          )}
        </div>
      </div>

      {/* Hidden file input for native upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg"
        onChange={handleUploadImage}
        className="hidden"
      />

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Download preview */}
        <Button
          onClick={handleDownloadPreview}
          variant="outline"
          className="w-full border-brand/50 text-brand hover:bg-brand/10 font-semibold py-5"
        >
          📥 Download Preview
        </Button>

        {/* Send WhatsApp */}
        <Button
          onClick={handleSendWhatsApp}
          disabled={
            !store.customerName.trim() ||
            !store.whatsappNumber.trim() ||
            !store.notes.trim()
          }
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-30 text-white font-bold py-6 text-base"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Kirim via WhatsApp
        </Button>

        {/* Print receipt */}
        <Button
          onClick={handlePrintReceipt}
          variant="outline"
          className="w-full border-white/20 text-white hover:bg-white/5 font-semibold py-5"
        >
          🧾 Cetak Struk
        </Button>

        {/* Export SVG dropdown */}
        <div className="relative">
          <Button
            onClick={() => setShowExportDropdown(!showExportDropdown)}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/5 font-semibold py-5"
          >
            📐 Export untuk LaserGRBL ▾
          </Button>
          {showExportDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full mb-2 left-0 right-0 bg-dark-50 border border-white/10 rounded-lg overflow-hidden z-20"
            >
              <button
                onClick={() => handleExportSVG("outline")}
                className="w-full px-4 py-3 text-left text-sm hover:bg-brand/10 text-white transition-colors border-b border-white/5"
              >
                <span className="font-semibold text-brand">Outline</span>
                <span className="block text-xs text-gray-400 mt-0.5">Vector cutting path — untuk potong bentuk luar</span>
              </button>
              <button
                onClick={() => handleExportSVG("engrave")}
                className="w-full px-4 py-3 text-left text-sm hover:bg-brand/10 text-white transition-colors"
              >
                <span className="font-semibold text-brand">Engrave</span>
                <span className="block text-xs text-gray-400 mt-0.5">Raster engraving — untuk ukir detail gambar</span>
              </button>
            </motion.div>
          )}
        </div>

        {/* Back button */}
        <Button
          onClick={() => store.setStep(store.selectedProduct?.hasTemplate ? 3 : 1)}
          variant="ghost"
          className="w-full text-gray-500 hover:text-white"
        >
          {store.selectedProduct?.hasTemplate ? "← Kembali ke Editor" : "← Kembali ke Produk"}
        </Button>
      </div>

      {/* WhatsApp instructions */}
      {showInstructions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl"
        >
          <p className="text-green-400 text-sm font-semibold mb-2">✅ WhatsApp sedang dibuka...</p>
          <p className="text-green-300/70 text-sm">
            Setelah WA terbuka, kirim foto preview yang sudah kamu download ke chat PPLG.
          </p>
        </motion.div>
      )}

      {/* Hidden receipt content for reference */}
      <div ref={receiptRef} className="hidden" />
    </motion.div>
  );
}
