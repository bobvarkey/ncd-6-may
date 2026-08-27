import { useState, useRef, useCallback, CSSProperties, useEffect, forwardRef, useImperativeHandle } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { ZoomIn, ZoomOut, RotateCw, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react";

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: CSSProperties;
  wrapperClassName?: string;
  loading?: "lazy" | "eager";
  triggerType?: "thumbnail" | "none";
  /** Optional gallery: when provided, the modal shows next/previous navigation */
  images?: { src: string; alt: string }[];
}

const ZoomableImage = forwardRef<{ openModal: (index?: number) => void }, ZoomableImageProps>(({
  src,
  alt,
  className = "",
  style,
  wrapperClassName = "",
  loading = "lazy",
  triggerType = "thumbnail",
  images,
}, ref) => {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [index, setIndex] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const gallery = images && images.length > 0 ? images : [{ src, alt }];
  const safeIndex = Math.min(index, gallery.length - 1);
  const current = gallery[safeIndex];
  const hasGallery = gallery.length > 1;

  useImperativeHandle(ref, () => ({
    openModal: (i?: number) => {
      setIndex(typeof i === "number" ? i : 0);
      setOpen(true);
      reset();
    },
  }));

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
    setIsFullscreen(false);
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

  // Touch panning + pinch zoom
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchRef.current = { startDist: dist, startZoom: zoom };
      setDragging(false);
      return;
    }
    if (zoom <= 1) return;
    const touch = e.touches[0];
    setDragging(true);
    setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
  }, [zoom, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      const ratio = dist / pinchRef.current.startDist;
      const next = Math.min(Math.max(pinchRef.current.startZoom * ratio, 1), 10);
      setZoom(next);
      setPosition((pos) => clampPosition(pos, next));
      return;
    }
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
    pinchRef.current = null;
    setDragging(false);
  }, []);

  const goPrev = useCallback(() => {
    if (gallery.length < 2) return;
    setIndex((i) => (i - 1 + gallery.length) % gallery.length);
    setZoom(1); setPosition({ x: 0, y: 0 }); setRotation(0);
  }, [gallery.length]);

  const goNext = useCallback(() => {
    if (gallery.length < 2) return;
    setIndex((i) => (i + 1) % gallery.length);
    setZoom(1); setPosition({ x: 0, y: 0 }); setRotation(0);
  }, [gallery.length]);

  // Keyboard: zoom, rotate, navigate, close.
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    // Move focus into the dialog toolbar for immediate keyboard control.
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 50);
    const handler = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomIn(); }
      else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomOut(); }
      else if (e.key === "r" || e.key === "R") { setRotation((prev) => (prev + 90) % 360); }
      else if (e.key === "f" || e.key === "F") { toggleFullscreen(); }
      else if (e.key === "0") { reset(); }
      else if (e.key === "Escape") { setOpen(false); }
      else if (e.key === "ArrowUp") { e.preventDefault(); zoomIn(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); zoomOut(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goPrev(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", handler);
    return () => { window.clearTimeout(t); window.removeEventListener("keydown", handler); };
  }, [open, zoomIn, zoomOut, reset, isFullscreen, goPrev, goNext]);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);


  return (
    <>
      {/* Thumbnail trigger */}
      {triggerType === "thumbnail" && (
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
      )}

      {/* Full-screen modal */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent
          className="!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 z-50 flex flex-col items-stretch justify-center bg-black/95 border-0 rounded-none !max-w-none !w-screen !h-screen p-0 gap-0 data-[state=open]:animate-in data-[state=closed]:animate-out"
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
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
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
            <p className="text-white/60 text-xs hidden sm:block">
              {current.alt}{hasGallery ? ` (${safeIndex + 1}/${gallery.length})` : ""}
            </p>
            <div className="flex-1" />
            <button
              type="button"
              ref={closeBtnRef}
              onClick={() => { setOpen(false); reset(); }}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white text-white transition-colors text-lg leading-none"
              title="Close (Esc)"
              aria-label="Close image viewer"
            >
              ✕
            </button>

          </div>

          {/* Image area */}
          <div
            ref={containerRef}
            className="relative flex-1 w-full flex items-center justify-center overflow-hidden select-none"
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
            {hasGallery && (
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                title="Previous image (←)"
                className="absolute left-2 sm:left-4 z-20 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <img
              ref={imageRef}
              src={current.src}
              alt={current.alt}
              draggable={false}
              className="mx-auto max-w-[90vw] max-h-[82vh] w-auto h-auto object-contain select-none pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: "center center",
                transition: dragging ? "none" : "transform 0.15s ease-out",
              }}
            />
            {hasGallery && (
              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                title="Next image (→)"
                className="absolute right-2 sm:right-4 z-20 inline-flex items-center justify-center h-11 w-11 rounded-full bg-white/10 hover:bg-white/25 text-white transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom hint */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-3">
            <p className="text-white/40 text-xs">
              Scroll to zoom · Drag to pan · <span className="sm:hidden">Pinch to zoom</span><span className="hidden sm:inline">+/− to zoom</span> · R to rotate{hasGallery ? " · ←/→ to browse" : ""} · Esc to close
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
});

ZoomableImage.displayName = "ZoomableImage";

export default ZoomableImage;
