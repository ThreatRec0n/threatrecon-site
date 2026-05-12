import { useCallback, useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';

type Props = {
  desktopSelector: string;
  onCancel: () => void;
  onCaptured: (dataUrl: string) => void;
};

export function SnippingOverlay({ desktopSelector, onCancel, onCaptured }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [preview, setPreview] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const runCapture = useCallback(
    async (r: { x: number; y: number; w: number; h: number }) => {
      if (r.w < 8 || r.h < 8) {
        onCancel();
        return;
      }
      const root = document.querySelector(desktopSelector) as HTMLElement | null;
      if (!root) {
        onCancel();
        return;
      }
      const scale = window.devicePixelRatio || 1;
      const canvasFull = await html2canvas(root, {
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#0d0d0d',
        scale,
        logging: false,
      });
      const crop = document.createElement('canvas');
      crop.width = r.w * scale;
      crop.height = r.h * scale;
      const ctx = crop.getContext('2d');
      if (!ctx) {
        onCancel();
        return;
      }
      const rootRect = root.getBoundingClientRect();
      const sx = (r.x / rootRect.width) * canvasFull.width;
      const sy = (r.y / rootRect.height) * canvasFull.height;
      const sw = (r.w / rootRect.width) * canvasFull.width;
      const sh = (r.h / rootRect.height) * canvasFull.height;
      ctx.drawImage(canvasFull, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
      onCaptured(crop.toDataURL('image/png'));
    },
    [desktopSelector, onCancel, onCaptured],
  );

  const onMouseDown = (e: React.MouseEvent) => {
    const el = overlayRef.current;
    if (!el) return;
    const b = el.getBoundingClientRect();
    draggingRef.current = true;
    startRef.current = { x: e.clientX - b.left, y: e.clientY - b.top };
    setPreview(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!draggingRef.current || !startRef.current || !overlayRef.current) return;
    const b = overlayRef.current.getBoundingClientRect();
    const x = e.clientX - b.left;
    const y = e.clientY - b.top;
    const sx = startRef.current.x;
    const sy = startRef.current.y;
    setPreview({
      x: Math.min(sx, x),
      y: Math.min(sy, y),
      w: Math.abs(x - sx),
      h: Math.abs(y - sy),
    });
  };

  const onMouseUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    startRef.current = null;
    const last = preview;
    setPreview(null);
    if (last) void runCapture(last);
    else onCancel();
  };

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCancel]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[12000] cursor-crosshair bg-black/40"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      role="presentation"
    >
      {preview && preview.w > 0 && preview.h > 0 ? (
        <div
          className="pointer-events-none absolute border-2 border-[#d4a017] bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          style={{
            left: preview.x,
            top: preview.y,
            width: preview.w,
            height: preview.h,
          }}
        />
      ) : null}
      <p className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 rounded bg-black/70 px-4 py-2 font-mono text-[11px] text-[#d4a017]">
        Drag to select region — release to capture — ESC to cancel
      </p>
    </div>
  );
}
