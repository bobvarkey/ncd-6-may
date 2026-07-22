import { useState, useRef, useCallback, CSSProperties, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  wrapperClassName?: string;
  loading?: "lazy" | "eager";
}

export default function ZoomableImage({
  src,
  alt,
  className = "",
  style,
  wrapperClassName = "",
  loading = "lazy",
}: ZoomableImageProps) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /** Clamp position so the image stays within panning bounds */
  const clampPosition = useCallback((pos: { x: number; y: number }, currentZoom: number) => {
    if (currentZoom <= 1) return { x: 0, y: 0 };
    const container = containerRef.current;
    if (!container) return pos;
    const maxX = ((currentZoom - 1) * container.offsetWidth) / 2;
    const maxY = ((currentZoom - 1) * container.offsetHeight) / 2;
    return {
      x: Math.max(-maxX, Math.min(maxX, pos.x)),
      y: Math.max(-maxY, Math.min(maxY, pos.y)),
    };
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const next = Math.min(prev * 1.5, 10);
      // Adjust position so the center stays centered
      setPosition((pos) => clampPosition(pos, next));
      return next;
    });
  }, [clampPosition]);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = prev / 1.5;
      if (next < 1) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      setPosition((pos) => clampPosition(pos, next));
      return next;
    });
  }, [clampPosition]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => {
        const next = Math.min(prev * 1.2, 10);
        setPosition((pos) => clampPosition(pos, next));
        return next;
      });
    } else {
      setZoom((prev) => {
        const next = prev / 1.2;
        if (next < 1) {
          setPosition({ x: 0, y: 0 });
          return 1;
        }
        setPosition((pos) => clampPosition(pos, next));
        return next;
      });
    }
  }, [clampPosition]);

  // Mouse drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging || zoom <= 1) return;
    setPosition(
      clampPosition(
        {
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        },
        zoom
      )
    );
  }, [dragging, zoom, dragStart, clampPosition]);

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Touch panning
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging || zoom <= 1) return;
    const touch = e.touches[0];
    setPosition(
      clampPosition(
        {
          x: touch.clientX - dragStart.x,
          y: touch.clientY - dragStart.y,
        },
        zoom
      )
    );
  }, [dragging, zoom, dragStart, clampPosition]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);
  }, []);

  // Keyboard: zoom, rotate, close. Radix Dialog already handles focus trap + Esc,
  // but we add explicit shortcuts and cycle through toolbar buttons with arrows.
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    // Move focus into the dialog toolbar for immediate keyboard control.
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomOut(); }
      else if (e.key === "r" || e.key === "R") { setRotation((prev) => (prev + 90) % 360); }
      else if (e.key === "0") { reset(); }
      else if (e.key === "Escape") { setOpen(false); }
      else if (e.key === "ArrowUp") { e.preventDefault(); zoomIn(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); zoomOut(); }
    };
    window.addEventListener("keydown", handler);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", handler); };
  }, [open, zoomIn, zoomOut, reset]);


  return (
    <>
      {/* Thumbnail trigger */}
      <button
        type="button"
        aria-label={`Zoom: ${alt}`}
        className={`group relative cursor-zoom-in block w-full overflow-hidden ${wrapperClassName}`}
        onClick={() => { setOpen(true); reset(); }}
      >
        <img
          src={src}
          alt={alt}
          loading={loading}
          className={className}
          style={style}
          draggable={false}
        />
        <span className="pointer-events-none absolute top-2 right-2 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
          <ZoomIn className="h-4 w-4 text-white" />
        </span>
      </button>

      {/* Full-screen modal */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent
          className="fixed inset-0 z-50 flex flex-col bg-black/95 border-0 rounded-none max-w-none w-full h-full p-0 data-[state=open]:animate-in data-[state=closed]:animate-out"
          onInteractOutside={(e) => e.preventDefault()}
        >
          {/* Top toolbar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-black/60 to-transparent">
            <button
              type="button"
              onClick={zoomIn}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom in (+)"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <span className="text-white/80 text-xs font-mono min-w-[3rem] text-center">{zoom.toFixed(1)}×</span>
            <button
              type="button"
              onClick={zoomOut}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Zoom out (-)"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button
              type="button"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Rotate (R)"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            <div className="w-px h-5 bg-white/20 mx-1" />
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-white/80 text-xs font-medium"
              title="Reset view"
            >
              1:1
            </button>
            <div className="flex-1" />
            <p className="text-white/60 text-xs hidden sm:block">{alt}</p>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => { setOpen(false); reset(); }}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors text-lg leading-none"
              title="Close (Esc)"
            >
              ✕
            </button>
          </div>

          {/* Image area */}
          <div
            ref={containerRef}
            className="flex-1 flex items-center justify-center overflow-hidden select-none"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: zoom > 1 ? (dragging ? "grabbing" : "grab") : "default",
            }}
          >
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              draggable={false}
              className="max-w-full max-h-full select-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 0.15s ease-out",
              }}
            />
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-3">
            <p className="text-white/40 text-xs">
              Scroll to zoom · Drag to pan · <span className="sm:hidden">Pinch to zoom</span><span className="hidden sm:inline">+/− to zoom</span> · R to rotate · Esc to close
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
