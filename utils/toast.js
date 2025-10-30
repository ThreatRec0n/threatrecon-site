export function toast(msg) {
  if (typeof window === 'undefined') return;
  try {
    const n = document.createElement('div');
    n.textContent = msg;
    n.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1f2937;color:#f9fafb;padding:10px 14px;border-radius:10px;box-shadow:0 10px 20px rgba(0,0,0,.35);z-index:9999;font-family:ui-monospace,Menlo,Monaco,Consolas,monospace;font-size:12px;';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 4000);
  } catch {}
}


