"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { templates, getTemplateImagePath, Template } from "@/lib/templates";
import { useOrderStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export default function TemplateSelector() {
  const { selectedTemplate, setSelectedTemplate, setStep } = useOrderStore();

  const handleSelect = (template: Template) => {
    setSelectedTemplate(template);
  };

  const handleNext = () => {
    if (selectedTemplate) {
      setStep(3); // Go to editor
    }
  };

  const handleBack = () => {
    setStep(1); // Back to product selection
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
          Pilih <span className="text-brand">Template</span>
        </h2>
        <p className="text-gray-400">Pilih bentuk dasar untuk desain laser CNC kamu</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto mb-8">
        {templates.map((template, i) => {
          const isSelected = selectedTemplate?.id === template.id;
          return (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => handleSelect(template)}
              className={`cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 group ${
                isSelected
                  ? "border-brand glow-orange scale-105"
                  : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="relative aspect-square bg-dark-100">
                <Image
                  src={getTemplateImagePath(template.filename)}
                  alt={template.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                />
                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-brand/20 flex items-center justify-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                  </motion.div>
                )}
              </div>
              <div className="p-3 bg-dark-50/80 text-center">
                <p className={`font-semibold text-sm ${isSelected ? "text-brand" : "text-white"}`}>
                  {template.name}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {template.dimensions.width}×{template.dimensions.height} mm
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          onClick={handleBack}
          variant="outline"
          size="lg"
          className="border-white/20 text-white hover:bg-white/10 rounded-xl"
        >
          ← Kembali
        </Button>
        <Button
          onClick={handleNext}
          disabled={!selectedTemplate}
          size="lg"
          className="bg-brand hover:bg-brand-dark disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold px-12 rounded-xl"
        >
          Lanjut ke Editor →
        </Button>
      </div>
    </motion.div>
  );
}
