export function hexDump(uint8arr, bytesPerRow = 16) {
  if (!uint8arr) return [];
  const rows = [];
  const len = uint8arr.length >>> 0;
  for (let i = 0; i < len; i += bytesPerRow) {
    const end = Math.min(i + bytesPerRow, len);
    const slice = uint8arr.subarray ? uint8arr.subarray(i, end) : uint8arr.slice(i, end);
    const hex = Array.from(slice).map(b => b.toString(16).padStart(2, '0')).join(' ');
    const ascii = Array.from(slice).map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : '.').join('');
    rows.push({ offset: i, hex, ascii });
  }
  return rows;
}


