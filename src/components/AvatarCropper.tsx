import { useEffect, useRef, useState } from 'react';
import { Loader2, ZoomIn } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from '../contexts/LanguageContext';
import { cropToAvatar, type PreparedImage } from '../lib/image';

interface AvatarCropperProps {
  image: PreparedImage;
  busy?: boolean;
  onCancel: () => void;
  onDone: (file: File) => void;
}

const MAX_ZOOM = 4;

/**
 * The familiar avatar cropper: the photo sits under a fixed square window, you
 * drag it to frame your face and pinch (or scroll, or use the slider) to zoom.
 * At zoom 1 the photo exactly covers the window, and it can never be dragged
 * away from it — so there is no way to end up with a crop that has empty edges.
 */
export function AvatarCropper({ image, busy, onCancel, onDone }: AvatarCropperProps) {
  const { t } = useLanguage();
  const imgRef = useRef<HTMLImageElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [box, setBox] = useState(0); // the crop window's size in CSS pixels
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropping, setCropping] = useState(false);

  // The window is square and sized to the screen; measure it rather than guess.
  useEffect(() => {
    const measure = () => setBox(frameRef.current?.clientWidth ?? 0);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Scale at which the photo just covers the window. Everything is relative to it.
  const fit = box ? Math.max(box / image.width, box / image.height) : 1;
  const scale = fit * zoom;
  const shownW = image.width * scale;
  const shownH = image.height * scale;

  // The photo must always cover the window, so panning stops at its edges.
  const clamp = (next: { x: number; y: number }, atZoom = zoom) => {
    const s = fit * atZoom;
    const limitX = Math.max(0, (image.width * s - box) / 2);
    const limitY = Math.max(0, (image.height * s - box) / 2);
    return {
      x: Math.min(limitX, Math.max(-limitX, next.x)),
      y: Math.min(limitY, Math.max(-limitY, next.y)),
    };
  };

  const changeZoom = (next: number) => {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(z);
    setOffset((o) => clamp(o, z));
  };

  // --- dragging (mouse and single finger) ---
  const drag = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    if (pinch.current) return;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current || pinch.current) return;
    setOffset(clamp({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }));
  };

  const endDrag = () => {
    drag.current = null;
  };

  // --- pinch (two fingers) ---
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const spread = (touches: React.TouchList) =>
    Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      drag.current = null;
      pinch.current = { distance: spread(e.touches), zoom };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      e.preventDefault();
      changeZoom((pinch.current.zoom * spread(e.touches)) / pinch.current.distance);
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinch.current = null;
  };

  const onWheel = (e: React.WheelEvent) => changeZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89));

  // Map the window back onto the photo's own pixels and cut that square out.
  const handleDone = async () => {
    if (!imgRef.current || !box) return;
    setCropping(true);
    try {
      const side = box / scale;
      const sx = image.width / 2 - offset.x / scale - side / 2;
      const sy = image.height / 2 - offset.y / scale - side / 2;
      const file = await cropToAvatar(
        imgRef.current,
        Math.max(0, Math.min(image.width - side, sx)),
        Math.max(0, Math.min(image.height - side, sy)),
        side,
      );
      onDone(file);
    } finally {
      setCropping(false);
    }
  };

  const working = busy || cropping;

  return (
    <div className="fixed inset-0 z-50 bg-navy/95 flex flex-col items-center justify-center p-6 gap-6">
      <div className="text-center">
        <h2 className="text-white text-lg font-semibold">{t('adjustPhoto')}</h2>
        <p className="text-white/60 text-sm mt-1">{t('adjustPhotoHint')}</p>
      </div>

      {/* The crop window. The photo is only visible through it. */}
      <div
        ref={frameRef}
        className="relative w-full max-w-xs aspect-square overflow-hidden rounded-2xl bg-black/40 touch-none select-none cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
      >
        <img
          ref={imgRef}
          src={image.url}
          alt=""
          draggable={false}
          className="absolute left-1/2 top-1/2 max-w-none"
          style={{
            width: shownW || undefined,
            height: shownH || undefined,
            transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
          }}
        />
        {/* Circle showing how the avatar will actually be seen. */}
        <div className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/70" />
      </div>

      <div className="w-full max-w-xs flex items-center gap-3">
        <ZoomIn className="w-5 h-5 text-white/70 shrink-0" />
        <input
          type="range"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label={t('zoom')}
          className="w-full accent-yellow-500"
        />
      </div>

      <div className="w-full max-w-xs flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={working}
          className="flex-1 py-3 rounded-xl border border-white/30 text-white disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <Button type="button" variant="brand" loading={working} onClick={handleDone} className="flex-1 py-3 rounded-xl font-semibold">
          {t('usePhoto')}
        </Button>
      </div>
    </div>
  );
}
