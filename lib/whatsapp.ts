const WA_NUMBER = "6285863244821";

export interface WhatsAppMessage {
  customerName: string;
  productName: string;
  productPrice: number;
  templateName: string;
  notes: string;
  orderNumber: string;
}

export function generateWhatsAppUrl(data: WhatsAppMessage): string {
  const message = `Halo PPLG! Saya ingin memesan laser CNC:
- Order: ${data.orderNumber}
- Nama: ${data.customerName}
- Produk: ${data.productName} (Rp ${data.productPrice.toLocaleString("id-ID")})
${data.templateName ? `- Template: ${data.templateName}\n` : ""}- Catatan: ${data.notes || "Tidak ada catatan"}

File preview desain sudah saya download dan akan saya kirim di chat ini.`;

  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${WA_NUMBER}?text=${encodedMessage}`;
}

export function getFloatingWhatsAppUrl(): string {
  const message = encodeURIComponent(
    "Halo PPLG! Saya ingin bertanya tentang jasa laser CNC."
  );
  return `https://wa.me/${WA_NUMBER}?text=${message}`;
}
