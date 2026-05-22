"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { Stage, Layer, Image as KonvaImage, Text as KonvaText, Transformer, Group, Line, Rect } from "react-konva";
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

const CANVAS_SIZE = 500; // logical canvas is always 500×500

export default function CanvasEditor() {
  const { selectedProduct, selectedTemplate, setStep, setCanvasDataUrl } = useOrderStore();
  const stageRef = useRef<Konva.Stage>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const [templateImg, setTemplateImg] = useState<HTMLImageElement | null>(null);
  const [userImages, setUserImages] = useState<UserImage[]>([]);
  const [userTexts, setUserTexts] = useState<UserText[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [textColor, setTextColor] = useState("#000000");
  const [textSize, setTextSize] = useState(24);
  const [displaySize, setDisplaySize] = useState(CANVAS_SIZE);

  // ── Responsive: measure wrapper and compute display size ──
  useEffect(() => {
    const measure = () => {
      if (wrapperRef.current) {
        // Take the full width of the wrapper, cap at 500
        const w = wrapperRef.current.clientWidth;
        setDisplaySize(Math.min(w, CANVAS_SIZE));
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Scale factor (logical → display) ──
  const scale = displaySize / CANVAS_SIZE;

  // ── Load template image ──
  useEffect(() => {
    if (!selectedTemplate) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = getTemplateImagePath(selectedTemplate.filename);
    img.onload = () => setTemplateImg(img);
  }, [selectedTemplate]);

  // ── Sync transformer with selected node ──
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId) {
      const node = stageRef.current.findOne("#" + selectedId);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, userImages, userTexts]);

  // ── Handlers ──
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        const imgScale = Math.min(200 / img.width, 200 / img.height, 1);
        const newImg: UserImage = {
          id: `img-${Date.now()}`,
          image: img,
          x: CANVAS_SIZE / 2 - (img.width * imgScale) / 2,
          y: CANVAS_SIZE / 2 - (img.height * imgScale) / 2,
          width: img.width * imgScale,
          height: img.height * imgScale,
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
      x: CANVAS_SIZE / 2 - 50,
      y: CANVAS_SIZE / 2,
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

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const target = e.target;
    if (target === target.getStage() || target.name() === "canvas-bg" || target.name() === "template-bg") {
      setSelectedId(null);
    }
  };

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    if (id.startsWith("img-")) {
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
    if (id.startsWith("img-")) {
      setUserImages((prev) =>
        prev.map((img) =>
          img.id === id
            ? { ...img, x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
            : img
        )
      );
    } else {
      setUserTexts((prev) =>
        prev.map((txt) =>
          txt.id === id
            ? { ...txt, x: node.x(), y: node.y(), scaleX: node.scaleX(), scaleY: node.scaleY(), rotation: node.rotation() }
            : txt
        )
      );
    }
  };

  // ── Export at full resolution (reset scale before capture) ──
  const exportCanvas = useCallback(() => {
    if (!stageRef.current) return;
    setSelectedId(null);

    const stage = stageRef.current;
    const bgNode = stage.findOne(".template-bg");
    const outlineNode = stage.findOne(".template-outline");

    if (bgNode) bgNode.hide();
    if (outlineNode) outlineNode.hide();

    // Temporarily render at full 500×500 for clean high-res export
    stage.scale({ x: 1, y: 1 });
    stage.width(CANVAS_SIZE);
    stage.height(CANVAS_SIZE);
    stage.batchDraw();

    setTimeout(() => {
      const dataUrl = stageRef.current!.toDataURL({ pixelRatio: 2 });

      // Restore display scale
      stage.scale({ x: scale, y: scale });
      stage.width(displaySize);
      stage.height(displaySize);

      if (bgNode) bgNode.show();
      if (outlineNode) outlineNode.show();
      stage.batchDraw();

      setCanvasDataUrl(dataUrl);
      setStep(selectedProduct?.hasTemplate ? 4 : 3);
    }, 150);
  }, [scale, displaySize, setCanvasDataUrl, setStep, selectedProduct]);

  // ── Template clip path ──
  const clipPath = selectedProduct?.hasTemplate && selectedTemplate
    ? (templatePaths as Record<string, { x: number; y: number }[]>)[selectedTemplate.id]
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Heading */}
      <div className="text-center mb-4">
        <h2 className="font-heading text-xl sm:text-3xl font-bold text-white mb-1">
          Edit <span className="text-brand">Desain</span>
        </h2>
        <p className="text-gray-400 text-sm">Tambahkan gambar dan teks di atas template</p>
      </div>

      {/* ── Toolbar ── */}
      <div className="w-full mb-4 space-y-3">
        {/* Action buttons row */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="border-brand/50 text-brand hover:bg-brand/10 flex-1 sm:flex-none"
          >
            📷 Upload Gambar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10 flex-1 sm:flex-none"
          >
            🗑 Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStep(selectedProduct?.hasTemplate ? 2 : 1)}
            className="border-white/20 text-gray-400 hover:bg-white/5 flex-1 sm:flex-none"
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

        {/* Text input row */}
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            placeholder="Ketik teks..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddText()}
            className="bg-dark-100 border-white/10 text-white h-9 flex-1 min-w-0"
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              title="Warna teks"
              className="w-10 h-9 p-1 bg-dark-100 border-white/10 cursor-pointer flex-shrink-0"
            />
            <Input
              type="number"
              min={8}
              max={72}
              value={textSize}
              onChange={(e) => setTextSize(Number(e.target.value))}
              className="w-16 bg-dark-100 border-white/10 text-white h-9 text-center flex-shrink-0"
            />
            <Button size="sm" onClick={handleAddText} className="bg-brand hover:bg-brand-dark text-white h-9 flex-shrink-0">
              + Teks
            </Button>
          </div>
        </div>
      </div>

      {/* ── Canvas area ── */}
      {/* wrapperRef measures available width */}
      <div ref={wrapperRef} className="w-full flex justify-center mb-4">
        <div
          className="canvas-container relative rounded-lg overflow-hidden"
          style={{ width: displaySize, height: displaySize, background: "#ffffff", flexShrink: 0 }}
        >
          <Stage
            ref={stageRef}
            width={displaySize}
            height={displaySize}
            scaleX={scale}
            scaleY={scale}
            onClick={handleStageClick}
            onTap={handleStageClick}
          >
            {/* White background layer */}
            <Layer>
              <Rect
                x={0}
                y={0}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                fill="#ffffff"
                name="canvas-bg"
                listening={true}
              />
            </Layer>

            {/* Template image layer */}
            <Layer>
              {selectedProduct?.hasTemplate && templateImg && (
                <KonvaImage
                  image={templateImg}
                  width={CANVAS_SIZE}
                  height={CANVAS_SIZE}
                  name="template-bg"
                  listening={true}
                />
              )}
            </Layer>

            {/* User content layer (clipped to template shape) */}
            <Layer>
              <Group
                clipFunc={(ctx) => {
                  if (!clipPath || clipPath.length === 0) return;
                  ctx.beginPath();
                  ctx.moveTo(clipPath[0].x, clipPath[0].y);
                  for (let i = 1; i < clipPath.length; i++) {
                    ctx.lineTo(clipPath[i].x, clipPath[i].y);
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
                    onClick={(e) => { e.cancelBubble = true; setSelectedId(img.id); }}
                    onTap={(e) => { e.cancelBubble = true; setSelectedId(img.id); }}
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
                    onClick={(e) => { e.cancelBubble = true; setSelectedId(txt.id); }}
                    onTap={(e) => { e.cancelBubble = true; setSelectedId(txt.id); }}
                    onDragEnd={(e) => handleDragEnd(txt.id, e)}
                    onTransformEnd={(e) => handleTransformEnd(txt.id, e)}
                    fontFamily="Inter"
                  />
                ))}
              </Group>

              {/* Template outline border */}
              {clipPath && clipPath.length > 0 && (
                <Line
                  points={clipPath.flatMap((p) => [p.x, p.y])}
                  stroke="#888888"
                  strokeWidth={1.5}
                  closed
                  listening={false}
                  name="template-outline"
                  dash={[6, 3]}
                />
              )}

              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 10 || newBox.height < 10) return oldBox;
                  return newBox;
                }}
                borderStroke="#FF6B00"
                anchorStroke="#FF6B00"
                anchorFill="#ffffff"
                anchorSize={8}
              />
            </Layer>
          </Stage>

          {/* Dimensions badge */}
          {selectedProduct?.hasTemplate && selectedTemplate && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-brand text-xs px-2 py-0.5 rounded font-mono pointer-events-none">
              {selectedTemplate.dimensions.width}×{selectedTemplate.dimensions.height} mm
            </div>
          )}
        </div>
      </div>

      {/* Hint text */}
      <p className="text-center text-xs text-gray-500 mb-4">
        Tap elemen untuk memilih • Drag untuk memindahkan • Pinch/drag sudut untuk resize
      </p>

      {/* Continue button */}
      <Button
        onClick={exportCanvas}
        size="lg"
        className="w-full bg-brand hover:bg-brand-dark text-white font-bold rounded-xl py-6 text-base"
      >
        Lanjut ke Detail Pesanan →
      </Button>
    </motion.div>
  );
}
