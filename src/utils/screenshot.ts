import html2canvas from 'html2canvas';

export async function captureElement(el: HTMLElement | null): Promise<string | null> {
  if (!el) return null;
  const canvas = await html2canvas(el, {
    scale: 1,
    backgroundColor: '#0d0d0d',
    logging: false,
  });
  return canvas.toDataURL('image/png');
}
