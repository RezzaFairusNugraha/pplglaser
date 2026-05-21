"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Group, Line } from "react-konva";
import Konva from "konva";
import { motion } from "framer-motion";
import { useOrderStore } from "@/lib/store";
import { getTemplateImagePath } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import templatePaths from "@/lib/template_paths.json";

import { Input } from "@/components/ui/input";

interface UserImage {
  id: string;
  image: HTMLImageElement;
  x: number;
  y: number;
  width: number;
  height: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
}

interface UserText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fill: string;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
}

const CANVAS_WIDTH = 500;
const CANVAS_HEIGHT = 500;

export default function CanvasEditor() {
  const { selectedProduct, selectedTemplate, setStep, setCanvasDataUrl } = useOrderStore();
  const stageRef = useRef<Konva.Stage>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [userTexts, setUserTexts] = useState<UserText[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [textSize, setTextSize] = useState(24);

  // Load template image
  useEffect(() => {
    if (!selectedTemplate) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = getTemplateImagePath(selectedTemplate.filename);
    img.onload = () => setTemplateImg(img);
  }, [selectedTemplate]);

  // Update transformer
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    const stage = stageRef.current;
    if (selectedId) {
      const node = stage.findOne("#" + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, userImages, userTexts]);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        const scale = Math.min(200 / img.width, 200 / img.height, 1);
        const newImg: UserImage = {
          id: `img-${Date.now()}`,
          image: img,
          x: CANVAS_WIDTH / 2 - (img.width * scale) / 2,
          y: CANVAS_HEIGHT / 2 - (img.height * scale) / 2,
          width: img.width * scale,
          height: img.height * scale,
          scaleX: 1,
          scaleY: 1,
          rotation: 0,
        };
        setUserImages((prev) => [...prev, newImg]);
        setSelectedId(newImg.id);
      };
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleAddText = () => {
    if (!newText.trim()) return;
    const txt: UserText = {
      id: `txt-${Date.now()}`,
      text: newText,
      x: CANVAS_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT / 2,
      fontSize: textSize,
      fill: textColor,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
    };
    setUserTexts((prev) => [...prev, txt]);
    setSelectedId(txt.id);
    setNewText("");
  };

  const handleReset = () => {
    setUserImages([]);
    setUserTexts([]);
    setSelectedId(null);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage() || e.target.name() === "template-bg") {
      setSelectedId(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const isImage = id.startsWith("img-");
    if (isImage) {
      setUserImages((prev) =>
        prev.map((img) => img.id === id ? { ...img, x: e.target.x(), y: e.target.y() } : img)
      );
    } else {
      setUserTexts((prev) =>
        prev.map((txt) => txt.id === id ? { ...txt, x: e.target.x(), y: e.target.y() } : txt)
      );
    }
  };

  const handleTransformEnd = (id: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const isImage = id.startsWith("img-");
    if (isImage) {
      setUserImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? {
                ...img,
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
              }
            : img
        )
      );
    } else {
      setUserTexts((prev) =>
        prev.map((txt) =>
          txt.id === id
            ? {
                ...txt,
                x: node.x(),
                y: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
                rotation: node.rotation(),
              }
            : txt
        )
      );
    }
  };

  const exportCanvas = useCallback(() => {
    if (!stageRef.current) return;
    // Deselect for clean export
    setSelectedId(null);
    
    // Hide template background and outline stroke for clean export
    const stage = stageRef.current;
    const bgNode = stage.findOne(".template-bg");
    const outlineNode = stage.findOne(".template-outline");
    
    if (bgNode) bgNode.hide();
    if (outlineNode) outlineNode.hide();
    
    setTimeout(() => {
      if (!stageRef.current) return;
      const dataUrl = stageRef.current.toDataURL({ pixelRatio: 2 });
      
      // Restore visibility after export
      if (bgNode) bgNode.show();
      if (outlineNode) outlineNode.show();
      
      setCanvasDataUrl(dataUrl);
      setStep(selectedProduct?.hasTemplate ? 4 : 3); // Go to OrderForm
    }, 100);
  }, [setCanvasDataUrl, setStep, selectedProduct]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      <div className="text-center mb-6">
        <h2 className="font-heading text-2xl sm:text-3xl font-bold text-white mb-2">
          Edit <span className="text-brand">Desain</span>
        </h2>
        <p className="text-gray-400">Tambahkan gambar dan teks di atas template</p>
      </div>

      {/* Toolbar */}
      <div className="max-w-xl mx-auto mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-brand/50 text-brand hover:bg-brand/10"
          >
            📷 Upload Gambar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            🗑 Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(selectedProduct?.hasTemplate ? 2 : 1)}
            className="border-white/20 text-gray-400 hover:bg-white/5"
          >
            ← Kembali
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handleUploadImage}
            className="hidden"
          />
        </div>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <Input
              placeholder="Ketik teks..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddText()}
              className="bg-dark-100 border-white/10 text-white h-9"
            />
          </div>
          <Input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-10 h-9 p-1 bg-dark-100 border-white/10 cursor-pointer"
          />
          <Input
            type="number"
            min={8}
            max={72}
            value={textSize}
            onChange={(e) => setTextSize(Number(e.target.value))}
            className="w-16 bg-dark-100 border-white/10 text-white h-9 text-center"
          />
          <Button size="sm" onClick={handleAddText} className="bg-brand hover:bg-brand-dark text-white h-9">
            + Teks
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex justify-center mb-4">
        <div className="canvas-container relative" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <Stage
            ref={stageRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            {/* Template layer */}
            <Layer>
              {selectedProduct?.hasTemplate && templateImg && (
                <KonvaImage
                  image={templateImg}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  name="template-bg"
                  listening={true}
                />
              )}
            </Layer>

            {/* User content layer */}
            <Layer>
              <Group
                clipFunc={(ctx) => {
                  if (!selectedProduct?.hasTemplate || !selectedTemplate) return;
                  const path = (templatePaths as Record<string, { x: number; y: number }[]>)[selectedTemplate.id];
                  if (!path || path.length === 0) return;
                  
                  ctx.beginPath();
                  ctx.moveTo(path[0].x, path[0].y);
                  for (let i = 1; i < path.length; i++) {
                    ctx.lineTo(path[i].x, path[i].y);
                  }
                  ctx.closePath();
                }}
              >
                {userImages.map((img) => (
                  <KonvaImage
                    key={img.id}
                    id={img.id}
                    image={img.image}
                    x={img.x}
                    y={img.y}
                    width={img.width}
                    height={img.height}
                    scaleX={img.scaleX ?? 1}
                    scaleY={img.scaleY ?? 1}
                    rotation={img.rotation}
                    draggable
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(img.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(img.id);
                    }}
                    onDragEnd={(e) => handleDragEnd(img.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(img.id, e)}
                  />
                ))}
                {userTexts.map((txt) => (
                  <KonvaText
                    key={txt.id}
                    id={txt.id}
                    text={txt.text}
                    x={txt.x}
                    y={txt.y}
                    fontSize={txt.fontSize}
                    fill={txt.fill}
                    scaleX={txt.scaleX ?? 1}
                    scaleY={txt.scaleY ?? 1}
                    rotation={txt.rotation}
                    draggable
                    onClick={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(txt.id);
                    }}
                    onTap={(e) => {
                      e.cancelBubble = true;
                      setSelectedId(txt.id);
                    }}
                    onDragEnd={(e) => handleDragEnd(txt.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(txt.id, e)}
                    fontFamily="Inter"
                  />
                ))}
              </Group>

              {/* Highlight template outline border */}
              {selectedProduct?.hasTemplate && selectedTemplate && (templatePaths as Record<string, { x: number; y: number }[]>)[selectedTemplate.id] && (
                <Line
                  points={(templatePaths as Record<string, { x: number; y: number }[]>)[selectedTemplate.id].flatMap((p) => [p.x, p.y])}
                  stroke="#000000"
                  strokeWidth={2}
                  closed
                  listening={false}
                  name="template-outline"
                />
              )}

              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
                borderStroke="#000000"
                anchorStroke="#000000"
                anchorFill="#000000"
                anchorSize={8}
              />
            </Layer>

          </Stage>

          {/* Dimensions badge */}
          {selectedProduct?.hasTemplate && selectedTemplate && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-brand text-xs px-2 py-1 rounded font-mono">
              {selectedTemplate.dimensions.width}×{selectedTemplate.dimensions.height} mm
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={exportCanvas}
          size="lg"
          className="bg-brand hover:bg-brand-dark text-white font-bold px-12 rounded-xl"
        >
          Lanjut ke Detail Pesanan →
        </Button>
      </div>
    </motion.div>
  );
}
