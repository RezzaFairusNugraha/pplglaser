"use client";

import { motion } from "framer-motion";
import { products, Product } from "@/lib/products";
import { useOrderStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function ProductSelector() {
  const { selectedProduct, setSelectedProduct, setStep } = useOrderStore();

  const handleSelect = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleNext = () => {
    if (selectedProduct) {
      setStep(2); // Go to next dynamic step (Template or Editor)
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Pilih <span className="text-brand">Produk</span>
        </h2>
        <p className="text-gray-400">Pilih jenis produk yang ingin Anda buat</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
        {products.map((product, i) => {
          const isSelected = selectedProduct?.id === product.id;
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(product)}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 group p-4 bg-dark-100 ${
                isSelected
                  ? "border-brand glow-orange scale-105"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-lg ${isSelected ? "text-brand" : "text-white"}`}>
                  {product.name}
                </h3>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-gray-400 text-sm mb-3">
                {product.description}
              </p>
              <div className="text-right">
                <span className="font-bold text-white bg-dark-50/50 px-3 py-1 rounded-full text-sm">
                  Rp {product.price.toLocaleString("id-ID")}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleNext}
          disabled={!selectedProduct}
          size="lg"
          className="w-full sm:w-auto bg-brand hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-12 rounded-xl"
        >
          {selectedProduct?.hasTemplate ? "Lanjut ke Template →" : "Lanjut ke Editor →"}
        </Button>
      </div>
    </motion.div>
  );
}
