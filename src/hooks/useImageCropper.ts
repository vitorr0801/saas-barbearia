// src/hooks/useImageCropper.ts
import { useState, useRef, useCallback } from "react";

export interface CropState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

const CANVAS_SIZE = 220;

export function useImageCropper() {
  const [isOpen, setIsOpen] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [cropState, setCropState] = useState<CropState>({ scale: 1, offsetX: 0, offsetY: 0 });
  // Guarda o scale inicial para o slider usar como mínimo
  const [initialScale, setInitialScale] = useState(1);

  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const openCropper = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;

      const img = new Image();
      img.onload = () => {
        // Cover: a menor dimensão preenche exatamente o círculo
        const minDim = Math.min(img.naturalWidth, img.naturalHeight);
        const scale = CANVAS_SIZE / minDim;

        setInitialScale(scale);
        setPreviewSrc(src);
        setCropState({ scale, offsetX: 0, offsetY: 0 });
        setOriginalFile(file);
        setIsOpen(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }, []);

  const closeCropper = useCallback(() => {
    setIsOpen(false);
    setPreviewSrc(null);
    setOriginalFile(null);
  }, []);

  const getCroppedBlob = useCallback(
    (outputSize = 400): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        if (!previewSrc) return reject(new Error("Sem imagem"));

        const canvas = document.createElement("canvas");
        canvas.width = outputSize;
        canvas.height = outputSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas não suportado"));

        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, outputSize, outputSize);
          ctx.beginPath();
          ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
          ctx.clip();

          // Proporção entre output e preview — mantém pixel-perfect
          const ratio = outputSize / CANVAS_SIZE;
          const scaledW = img.naturalWidth * cropState.scale * ratio;
          const scaledH = img.naturalHeight * cropState.scale * ratio;
          const drawX = (outputSize - scaledW) / 2 + cropState.offsetX * ratio;
          const drawY = (outputSize - scaledH) / 2 + cropState.offsetY * ratio;

          ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error("Falha ao gerar blob"));
            },
            "image/jpeg",
            0.92
          );
        };
        img.onerror = reject;
        img.src = previewSrc;
      });
    },
    [previewSrc, cropState]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const pos = "touches" in e ? e.touches[0] : e;
    lastPos.current = { x: pos.clientX, y: pos.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging.current) return;
    const pos = "touches" in e ? e.touches[0] : e;
    const dx = pos.clientX - lastPos.current.x;
    const dy = pos.clientY - lastPos.current.y;
    lastPos.current = { x: pos.clientX, y: pos.clientY };
    setCropState((prev) => ({ ...prev, offsetX: prev.offsetX + dx, offsetY: prev.offsetY + dy }));
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Usado pelos botões + / - e pelo scroll do mouse (recebe delta)
  const handleZoom = useCallback((delta: number) => {
    setCropState((prev) => ({
      ...prev,
      scale: Math.min(initialScale * 5, Math.max(initialScale, prev.scale + delta)),
    }));
  }, [initialScale]);

  // ✅ NOVO: usado pelo Slider — recebe valor ABSOLUTO, sem race condition
  const handleSetScale = useCallback((absoluteScale: number) => {
    setCropState((prev) => ({
      ...prev,
      scale: Math.min(initialScale * 5, Math.max(initialScale, absoluteScale)),
    }));
  }, [initialScale]);

  const handleWheelZoom = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      handleZoom(e.deltaY > 0 ? -initialScale * 0.05 : initialScale * 0.05);
    },
    [handleZoom, initialScale]
  );

  return {
    isOpen,
    previewSrc,
    originalFile,
    cropState,
    initialScale,
    openCropper,
    closeCropper,
    getCroppedBlob,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleZoom,
    handleSetScale,   // ← para o Slider
    handleWheelZoom,
  };
}