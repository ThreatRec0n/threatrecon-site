// RTP utilities: detect RTP and decode G.711 (PCMU/PCMA) to PCM16, export WAV

export function isLikelyRtp(payload) {
  if (!payload || payload.length < 12) return false;
  const v = (payload[0] & 0b11000000) >>> 6;
  if (v !== 2) return false;
  const payloadType = payload[1] & 0x7F;
  // Common static PTs: 0 (PCMU), 8 (PCMA), 18 (G.729) – we target 0/8
  return payloadType === 0 || payloadType === 8;
}

export function parseRtpHeader(payload) {
  const b0 = payload[0];
  const b1 = payload[1];
  const version = (b0 & 0b11000000) >>> 6;
  const padding = (b0 & 0x20) !== 0;
  const extension = (b0 & 0x10) !== 0;
  const cc = b0 & 0x0F;
  const marker = (b1 & 0x80) !== 0;
  const payloadType = b1 & 0x7F;
  const seq = (payload[2] << 8) | payload[3];
  const ts = (payload[4] << 24) | (payload[5] << 16) | (payload[6] << 8) | payload[7];
  const ssrc = (payload[8] << 24) | (payload[9] << 16) | (payload[10] << 8) | payload[11];
  let offset = 12 + (cc * 4);
  if (extension) {
    // extension header: defined by RFC3550 – skip
    if (payload.length >= offset + 4) {
      const extLenWords = (payload[offset + 2] << 8) | payload[offset + 3];
      offset += 4 + extLenWords * 4;
    }
  }
  return {
    version,
    padding: Boolean(padding),
    extension: Boolean(extension),
    csrcCount: cc,
    marker: Boolean(marker),
    payloadType,
    seq,
    ts: (ts >>> 0),
    ssrc: (ssrc >>> 0),
    headerLen: offset
  };
}

// G.711 μ-law (PCMU) decode
function ulawToPcm16(u8) {
  // Based on ITU G.711
  u8 = ~u8 & 0xff;
  const sign = u8 & 0x80;
  let exponent = (u8 >> 4) & 0x07;
  let mantissa = u8 & 0x0F;
  let sample = ((mantissa << 3) + 0x84) << exponent;
  sample -= 0x84;
  return (sign ? -sample : sample) | 0;
}

// G.711 A-law (PCMA) decode
function alawToPcm16(aVal) {
  aVal ^= 0x55;
  let t = (aVal & 0x0f) << 4;
  let seg = (aVal & 0x70) >> 4;
  switch (seg) {
    case 0:
      t += 8;
      break;
    case 1:
      t += 0x108;
      break;
    default:
      t += 0x108;
      t <<= seg - 1;
  }
  return (aVal & 0x80) ? t : -t;
}

export function decodeG711(payloadBytes, payloadType /* 0=PCMU, 8=PCMA */) {
  const out = new Int16Array(payloadBytes.length);
  if (payloadType === 0) {
    for (let i = 0; i < payloadBytes.length; i++) out[i] = ulawToPcm16(payloadBytes[i]);
  } else if (payloadType === 8) {
    for (let i = 0; i < payloadBytes.length; i++) out[i] = alawToPcm16(payloadBytes[i]);
  } else {
    return new Int16Array(0);
  }
  return out;
}

export function reconstructRtpStream(packets, { jitterMs = 0, fillMissing = true } = {}) {
  // packets: array of { seq, ts, ssrc, payloadType, payload: Uint8Array }
  const sorted = [...packets].sort((a, b) => (a.seq - b.seq));
  const sampleRate = 8000; // G.711
  let pcm = [];
  let lastSeq = null;
  for (const p of sorted) {
    if (lastSeq !== null) {
      const gap = (p.seq - lastSeq - 1) & 0xFFFF;
      if (gap > 0 && fillMissing) {
        // assume 160 samples per packet (~20ms @8kHz), fill silence
        const missingPackets = Math.min(gap, 50);
        const silenceSamples = missingPackets * 160;
        pcm.push(new Int16Array(silenceSamples));
      }
    }
    lastSeq = p.seq;
    const decoded = decodeG711(p.payload, p.payloadType);
    pcm.push(decoded);
  }
  // concat
  const total = pcm.reduce((n, arr) => n + arr.length, 0);
  const out = new Int16Array(total);
  let offset = 0;
  for (const arr of pcm) { out.set(arr, offset); offset += arr.length; }
  return { audioBuffer: out, sampleRate, markers: sorted.map(s => ({ seq: s.seq, ts: s.ts })) };
}

export function exportWav(int16, sampleRate = 8000) {
  const numChannels = 1;
  const bitDepth = 16;
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const dataSize = int16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  let p = 0;
  function writeStr(s) { for (let i = 0; i < s.length; i++) view.setUint8(p++, s.charCodeAt(i)); }
  function write32(v) { view.setUint32(p, v, true); p += 4; }
  function write16(v) { view.setUint16(p, v, true); p += 2; }

  writeStr('RIFF');
  write32(36 + dataSize);
  writeStr('WAVE');
  writeStr('fmt ');
  write32(16);
  write16(1);
  write16(numChannels);
  write32(sampleRate);
  write32(byteRate);
  write16(blockAlign);
  write16(bitDepth);
  writeStr('data');
  write32(dataSize);
  // PCM data
  for (let i = 0; i < int16.length; i++) view.setInt16(p + i * 2, int16[i], true);
  return new Blob([view], { type: 'audio/wav' });
}


