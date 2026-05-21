export interface Template {
  id: string;
  name: string;
  filename: string;
  description: string;
  dimensions: { width: number; height: number }; // in mm
}

export const templates: Template[] = [
  {
    id: "love",
    name: "Love",
    filename: "love-removebg-preview.png",
    description: "Bentuk hati yang elegan",
    dimensions: { width: 80, height: 80 },
  },
  {
    id: "lonjong",
    name: "Lonjong",
    filename: "lonjong-removebg-preview.png",
    description: "Bentuk oval/lonjong yang halus",
    dimensions: { width: 100, height: 60 },
  },
  {
    id: "lingkarankotak",
    name: "Lingkaran Kotak",
    filename: "lingkarankotak-removebg-preview.png",
    description: "Persegi dengan sudut membulat",
    dimensions: { width: 80, height: 80 },
  },
  {
    id: "ketupat",
    name: "Ketupat",
    filename: "ketupat-removebg-preview.png",
    description: "Bentuk ketupat/berlian simetris",
    dimensions: { width: 80, height: 100 },
  },
  {
    id: "bintang",
    name: "Bintang",
    filename: "bintang-removebg-preview.png",
    description: "Bintang 5 sudut yang tajam",
    dimensions: { width: 90, height: 90 },
  },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplateImagePath(filename: string): string {
  return `/templates/${filename}`;
}
