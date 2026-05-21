import { create } from "zustand";
import { Template } from "./templates";
import { Product } from "./products";
import { format } from "date-fns";

export type ExportMode = "outline" | "engrave" | null;

export interface OrderState {
  // Step tracking
  currentStep: number;

  // Order data
  orderNumber: string;
  customerName: string;
  whatsappNumber: string;
  notes: string;
  selectedProduct: Product | null;
  selectedTemplate: Template | null;
  exportMode: ExportMode;
  canvasDataUrl: string;
  timestamp: Date | null;

  // Actions
  setStep: (step: number) => void;
  setSelectedProduct: (product: Product | null) => void;
  setSelectedTemplate: (template: Template | null) => void;
  setCustomerName: (name: string) => void;
  setWhatsappNumber: (number: string) => void;
  setNotes: (notes: string) => void;
  setExportMode: (mode: ExportMode) => void;
  setCanvasDataUrl: (url: string) => void;
  generateOrderNumber: () => void;
  resetOrder: () => void;
}

function createOrderNumber(): string {
  const dateStr = format(new Date(), "yyyyMMdd");
  const randomNum = String(Math.floor(Math.random() * 9000) + 1000);
  return `AG-${dateStr}-${randomNum}`;
}

export const useOrderStore = create<OrderState>((set) => ({
  currentStep: 1,
  orderNumber: "",
  customerName: "",
  whatsappNumber: "",
  notes: "",
  selectedProduct: null,
  selectedTemplate: null,
  exportMode: null,
  canvasDataUrl: "",
  timestamp: null,

  setStep: (step) => set({ currentStep: step }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setCustomerName: (name) => set({ customerName: name }),
  setWhatsappNumber: (number) => set({ whatsappNumber: number }),
  setNotes: (notes) => set({ notes: notes }),
  setExportMode: (mode) => set({ exportMode: mode }),
  setCanvasDataUrl: (url) => set({ canvasDataUrl: url }),
  generateOrderNumber: () =>
    set({
      orderNumber: createOrderNumber(),
      timestamp: new Date(),
    }),
  resetOrder: () =>
    set({
      currentStep: 1,
      orderNumber: "",
      customerName: "",
      whatsappNumber: "",
      notes: "",
      selectedProduct: null,
      selectedTemplate: null,
      exportMode: null,
      canvasDataUrl: "",
      timestamp: null,
    }),
}));
