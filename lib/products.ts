export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  hasTemplate: boolean;
  image?: string;
}

export const products: Product[] = [
  {
    id: "gantungan",
    name: "Gantungan Kunci",
    price: 5000,
    description: "Gantungan kunci akrilik custom",
    hasTemplate: true,
    image: "/templates/produk/gantungan.jpeg",
  },
  {
    id: "plakat-1-bahan",
    name: "Plakat Custom (1 Jenis)",
    price: 30000,
    description: "Plakat akrilik custom dengan 1 jenis bahan",
    hasTemplate: false,
    image: "/templates/produk/plakat.jpeg",
  },
  {
    id: "plakat-2-bahan",
    name: "Plakat Custom (2 Jenis)",
    price: 40000,
    description: "Plakat akrilik custom dengan 2 jenis bahan",
    hasTemplate: false,
    image: "/templates/produk/plakat copy.jpeg",
  },
  {
    id: "piagam",
    name: "Piagam",
    price: 30000,
    description: "Piagam penghargaan akrilik",
    hasTemplate: false,
    image: "/templates/produk/piagam.jpeg",
  },
  {
    id: "display",
    name: "Display",
    price: 30000,
    description: "Display akrilik custom",
    hasTemplate: false,
    image: "/templates/produk/display.jpeg",
  },
  {
    id: "ucapan",
    name: "Papan Ucapan",
    price: 30000,
    description: "Papan ucapan akrilik",
    hasTemplate: false,
    image: "/templates/produk/ucapan.jpeg",
  },
  {
    id: "produk-custom",
    name: "Produk Custom",
    price: 40000,
    description: "Produk akrilik custom sesuai request",
    hasTemplate: false,
    image: "/templates/produk/costum.jpeg",
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}
