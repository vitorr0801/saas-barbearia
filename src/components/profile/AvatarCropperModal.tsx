// src/components/profile/AvatarCropperModal.tsx
import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Move, Loader2 } from "lucide-react";
import type { CropState } from "@/hooks/useImageCropper";

interface AvatarCropperModalProps {
  isOpen: boolean;
  previewSrc: string | null;
  cropState: CropState;
  initialScale: number;       // ← scale mínimo (cover exato)
  isUploading: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onZoom: (delta: number) => void;
  onSetScale: (absolute: number) => void;  // ← Slider usa isso
  onMouseDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onMouseMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onMouseUp: () => void;
  onWheelZoom: (e: React.WheelEvent) => void;
}

const CANVAS_SIZE = 220;

export function AvatarCropperModal({
  isOpen,
  previewSrc,
  cropState,
  initialScale,
  isUploading,
  onClose,
  onConfirm,
  onZoom,
  onSetScale,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheelZoom,
}: AvatarCropperModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Cache da imagem para não recarregar a cada render
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Carrega a imagem uma vez quando previewSrc muda
  useEffect(() => {
    if (!previewSrc) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      drawCanvas(img);
    };
    img.src = previewSrc;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewSrc]);

  // Re-desenha sempre que cropState muda (drag ou zoom)
  useEffect(() => {
    if (imgRef.current) drawCanvas(imgRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cropState]);

  function drawCanvas(img: HTMLImageElement) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = CANVAS_SIZE;
    ctx.clearRect(0, 0, size, size);

    // Fundo
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, size, size);

    // Clip circular
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const scaledW = img.naturalWidth * cropState.scale;
    const scaledH = img.naturalHeight * cropState.scale;
    const drawX = (size - scaledW) / 2 + cropState.offsetX;
    const drawY = (size - scaledH) / 2 + cropState.offsetY;

    ctx.drawImage(img, drawX, drawY, scaledW, scaledH);
    ctx.restore();

    // Borda dourada
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,165,0,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Slider: min = initialScale (cover exato), max = 5× o inicial
  const sliderMin = initialScale;
  const sliderMax = initialScale * 5;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-[2rem] border-border/50 bg-card p-6 gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-center text-base font-black uppercase tracking-widest text-foreground">
            Ajustar Foto
          </DialogTitle>
          <p className="text-center text-xs text-muted-foreground mt-1">
            Arraste para centralizar • Scroll ou slider para zoom
          </p>
        </DialogHeader>

        {/* Canvas de preview interativo */}
        <div className="flex justify-center mb-4">
          <div
            className="relative cursor-grab active:cursor-grabbing select-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onMouseDown}
            onTouchMove={onMouseMove}
            onTouchEnd={onMouseUp}
            onWheel={onWheelZoom}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              className="rounded-full shadow-xl"
            />
            <div className="absolute bottom-2 right-2 bg-black/50 rounded-full p-1 pointer-events-none">
              <Move className="w-3 h-3 text-white/70" />
            </div>
          </div>
        </div>

        {/* Controle de zoom */}
        <div className="flex items-center gap-3 px-2 mb-6">
          <button
            onClick={() => onZoom(-(initialScale * 0.1))}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          {/* ✅ Slider com valor absoluto — sem delta, sem race condition */}
          <Slider
            value={[cropState.scale]}
            min={sliderMin}
            max={sliderMax}
            step={initialScale * 0.02}
            onValueChange={([v]) => onSetScale(v)}
            className="flex-1"
          />

          <button
            onClick={() => onZoom(initialScale * 0.1)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <DialogFooter className="flex gap-3 sm:justify-stretch">
          <Button
            variant="outline"
            className="flex-1 rounded-xl h-11"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 rounded-xl h-11 bg-primary text-primary-foreground font-bold"
            onClick={onConfirm}
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              "Salvar Foto"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}