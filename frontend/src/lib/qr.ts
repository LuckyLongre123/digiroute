/**
 * Self-contained Client-Side QR Code Generator and Badge Renderer.
 * Zero external dependencies, 100% offline capable.
 */

// --- Galois Field GF(256) Math ---
const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
  let val = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = val;
    GF_EXP[i + 255] = val;
    GF_LOG[val] = i;
    val = (val << 1) ^ (val & 0x80 ? 0x11d : 0);
  }
})();

function gfMul(x: number, y: number): number {
  if (x === 0 || y === 0) return 0;
  return GF_EXP[GF_LOG[x] + GF_LOG[y]];
}

function gfPolyMul(p1: number[], p2: number[]): number[] {
  const res: number[] = new Array(p1.length + p2.length - 1).fill(0);
  for (let i = 0; i < p1.length; i++) {
    for (let j = 0; j < p2.length; j++) {
      res[i + j] ^= gfMul(p1[i], p2[j]);
    }
  }
  return res;
}

function getGeneratorPoly(numEc: number): number[] {
  let poly: number[] = [1];
  for (let i = 0; i < numEc; i++) {
    poly = gfPolyMul(poly, [1, GF_EXP[i]]);
  }
  return poly;
}

function calculateEcCodewords(data: number[], numEc: number): number[] {
  const gen = getGeneratorPoly(numEc);
  const rem: number[] = new Array(numEc).fill(0);
  for (let i = 0; i < data.length; i++) {
    const factor = data[i] ^ rem[0];
    for (let j = 0; j < numEc - 1; j++) {
      rem[j] = rem[j + 1] ^ gfMul(gen[j + 1], factor);
    }
    rem[numEc - 1] = gfMul(gen[numEc], factor);
  }
  return rem;
}

// Version capacities and EC details for Medium (M) Error Correction
interface VersionInfo {
  version: number;
  totalBytes: number;
  dataBytes: number;
  ecBytes: number;
  blocks: number;
  alignment: number[];
}

const VERSION_TABLE_M: VersionInfo[] = [
  {
    version: 1,
    totalBytes: 26,
    dataBytes: 16,
    ecBytes: 10,
    blocks: 1,
    alignment: [],
  },
  {
    version: 2,
    totalBytes: 44,
    dataBytes: 28,
    ecBytes: 16,
    blocks: 1,
    alignment: [6, 18],
  },
  {
    version: 3,
    totalBytes: 70,
    dataBytes: 44,
    ecBytes: 26,
    blocks: 1,
    alignment: [6, 22],
  },
  {
    version: 4,
    totalBytes: 100,
    dataBytes: 64,
    ecBytes: 36,
    blocks: 2,
    alignment: [6, 26],
  },
  {
    version: 5,
    totalBytes: 134,
    dataBytes: 86,
    ecBytes: 48,
    blocks: 2,
    alignment: [6, 30],
  },
  {
    version: 6,
    totalBytes: 172,
    dataBytes: 108,
    ecBytes: 64,
    blocks: 4,
    alignment: [6, 34],
  },
  {
    version: 7,
    totalBytes: 196,
    dataBytes: 124,
    ecBytes: 72,
    blocks: 4,
    alignment: [6, 22, 38],
  },
  {
    version: 8,
    totalBytes: 242,
    dataBytes: 154,
    ecBytes: 88,
    blocks: 4,
    alignment: [6, 24, 42],
  },
  {
    version: 9,
    totalBytes: 292,
    dataBytes: 182,
    ecBytes: 110,
    blocks: 5,
    alignment: [6, 26, 46],
  },
  {
    version: 10,
    totalBytes: 346,
    dataBytes: 216,
    ecBytes: 130,
    blocks: 5,
    alignment: [6, 28, 50],
  },
];

export function generateQrMatrix(text: string): boolean[][] {
  const encoder = new TextEncoder();
  const textBytes = encoder.encode(text);

  let verInfo: VersionInfo | null = null;
  for (const info of VERSION_TABLE_M) {
    // 4 bits mode + 8 or 16 bits length + data
    const lenBits = info.version < 10 ? 8 : 16;
    const requiredDataBytes = Math.ceil(
      (4 + lenBits + textBytes.length * 8) / 8
    );
    if (requiredDataBytes <= info.dataBytes) {
      verInfo = info;
      break;
    }
  }

  if (!verInfo) {
    verInfo = VERSION_TABLE_M[VERSION_TABLE_M.length - 1];
  }

  const { version, dataBytes, ecBytes, blocks } = verInfo;
  const size = 17 + version * 4;

  // Build bit stream: 0100 (Byte mode) + length + textBytes
  const bitStream: number[] = [];
  const appendBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i--) {
      bitStream.push((val >> i) & 1);
    }
  };

  appendBits(0b0100, 4);
  appendBits(textBytes.length, version < 10 ? 8 : 16);
  for (const b of textBytes) {
    appendBits(b, 8);
  }

  // Terminator
  const maxBits = dataBytes * 8;
  const termLen = Math.min(4, maxBits - bitStream.length);
  appendBits(0, termLen);

  // Align to byte
  while (bitStream.length % 8 !== 0) {
    bitStream.push(0);
  }

  // Pad bytes
  const padBytes = [0xec, 0x11];
  let padIdx = 0;
  while (bitStream.length < maxBits) {
    appendBits(padBytes[padIdx % 2], 8);
    padIdx++;
  }

  // Group into bytes
  const dataPayload: number[] = [];
  for (let i = 0; i < dataBytes; i++) {
    let byteVal = 0;
    for (let b = 0; b < 8; b++) {
      byteVal = (byteVal << 1) | bitStream[i * 8 + b];
    }
    dataPayload.push(byteVal);
  }

  // Split into blocks and compute EC
  const ecPerBlock = ecBytes / blocks;
  const dataPerBlock = Math.floor(dataBytes / blocks);
  const shortBlocks = blocks - (dataBytes % blocks);

  const blockData: number[][] = [];
  const blockEc: number[][] = [];

  let dataOffset = 0;
  for (let b = 0; b < blocks; b++) {
    const bLen = b < shortBlocks ? dataPerBlock : dataPerBlock + 1;
    const chunk = dataPayload.slice(dataOffset, dataOffset + bLen);
    dataOffset += bLen;
    blockData.push(chunk);
    blockEc.push(calculateEcCodewords(chunk, ecPerBlock));
  }

  // Interleave data codewords
  const finalCodewords: number[] = [];
  const maxBlockLen = Math.ceil(dataBytes / blocks);
  for (let i = 0; i < maxBlockLen; i++) {
    for (let b = 0; b < blocks; b++) {
      if (i < blockData[b].length) {
        finalCodewords.push(blockData[b][i]);
      }
    }
  }

  // Interleave EC codewords
  for (let i = 0; i < ecPerBlock; i++) {
    for (let b = 0; b < blocks; b++) {
      finalCodewords.push(blockEc[b][i]);
    }
  }

  // Build matrix
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );
  const reserved: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const setModule = (r: number, c: number, val: boolean) => {
    matrix[r][c] = val;
    reserved[r][c] = true;
  };

  // 1. Finder patterns (7x7) + Separators (8x8)
  const drawFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const nr = row + r;
        const nc = col + c;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
        const isCore = r >= 0 && r <= 6 && c >= 0 && c <= 6;
        const isBlack =
          isCore &&
          (r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4));
        setModule(nr, nc, isBlack);
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // 2. Alignment patterns
  if (verInfo.alignment.length > 0) {
    const coords = verInfo.alignment;
    for (const r of coords) {
      for (const c of coords) {
        if (
          (r <= 8 && c <= 8) ||
          (r <= 8 && c >= size - 9) ||
          (r >= size - 9 && c <= 8)
        ) {
          continue;
        }
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const isBlack =
              Math.max(Math.abs(dr), Math.abs(dc)) === 2 ||
              (dr === 0 && dc === 0);
            setModule(r + dr, c + dc, isBlack);
          }
        }
      }
    }
  }

  // 3. Timing lines
  for (let i = 8; i < size - 8; i++) {
    setModule(6, i, i % 2 === 0);
    setModule(i, 6, i % 2 === 0);
  }

  // 4. Dark Module
  setModule(4 * version + 9, 8, true);

  // 5. Reserve format info areas
  for (let i = 0; i < 9; i++) {
    reserved[8][i] = true;
    reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    reserved[8][size - 1 - i] = true;
    reserved[size - 1 - i][8] = true;
  }

  // 6. Place Data Codewords (Boustrophedon)
  let cwIdx = 0;
  let bitIdx = 7;
  let upward = true;

  for (let rightCol = size - 1; rightCol > 0; rightCol -= 2) {
    if (rightCol === 6) rightCol--; // Skip timing column

    const rows = upward
      ? Array.from({ length: size }, (_, idx) => size - 1 - idx)
      : Array.from({ length: size }, (_, idx) => idx);

    for (const r of rows) {
      for (let dc = 0; dc < 2; dc++) {
        const c = rightCol - dc;
        if (reserved[r][c]) continue;

        let bit = 0;
        if (cwIdx < finalCodewords.length) {
          bit = (finalCodewords[cwIdx] >> bitIdx) & 1;
          bitIdx--;
          if (bitIdx < 0) {
            bitIdx = 7;
            cwIdx++;
          }
        }

        // Mask 0: (r + c) % 2 === 0
        const maskBit = (r + c) % 2 === 0 ? 1 : 0;
        matrix[r][c] = (bit ^ maskBit) === 1;
      }
    }
    upward = !upward;
  }

  // 7. Format Information (EC Level M = 00, Mask 0 = 000 -> 0b00000 -> with BCH + XOR 0x5412)
  // Format code for Level M, Mask 0 is 0b101010000010010 (0x5412)
  const formatBits = 0x5412;
  const fBits: boolean[] = [];
  for (let i = 14; i >= 0; i--) {
    fBits.push(((formatBits >> i) & 1) === 1);
  }

  // Place format info along top-left finder and split on other finders
  for (let i = 0; i < 6; i++) matrix[8][i] = fBits[i];
  matrix[8][7] = fBits[6];
  matrix[8][8] = fBits[7];
  matrix[7][8] = fBits[8];
  for (let i = 9; i < 15; i++) matrix[14 - i][8] = fBits[i];

  // Along bottom and right finders
  for (let i = 0; i < 7; i++) matrix[size - 1 - i][8] = fBits[i];
  for (let i = 0; i < 8; i++) matrix[8][size - 8 + i] = fBits[7 + i];

  return matrix;
}

export interface BadgeData {
  text: string;
  digipin: string;
  unit?: string;
  label?: string;
  format?: 'card' | 'sticker' | 'a4';
}

/**
 * Renders an official printable high-resolution badge to an HTML5 canvas.
 */
export function drawQrBadgeToCanvas(
  canvas: HTMLCanvasElement,
  data: BadgeData
): void {
  const { text, digipin, unit, label, format = 'sticker' } = data;
  const matrix = generateQrMatrix(text);
  const matrixSize = matrix.length;

  const width = format === 'card' ? 700 : format === 'a4' ? 900 : 800;
  const height = format === 'card' ? 950 : format === 'a4' ? 1250 : 1100;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 12;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  // Top header brand banner (Zero text overlap: measured side-by-side)
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
  const mDigi = ctx.measureText('DigiRoute ');
  const mDoor = ctx.measureText('Doorway');
  const totalLogoWidth = mDigi.width + mDoor.width;
  const startLogoX = (width - totalLogoWidth) / 2;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#1A3A6B';
  ctx.fillText('DigiRoute ', startLogoX, 95);

  ctx.fillStyle = '#EA580C';
  ctx.fillText('Doorway', startLogoX + mDigi.width, 95);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 15px monospace';
  ctx.letterSpacing = '3px';
  ctx.fillText('OFFICIAL MICRO-ADDRESS BADGE', width / 2, 135);
  ctx.letterSpacing = '0px';

  // Divider
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 165);
  ctx.lineTo(width - 80, 165);
  ctx.stroke();

  // QR Code Box
  const qrBoxSize = format === 'card' ? 450 : format === 'a4' ? 560 : 500;
  const qrBoxX = (width - qrBoxSize) / 2;
  const qrBoxY = 195;

  ctx.fillStyle = '#F8FAFC';
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.stroke();

  // Draw QR Modules inside box
  const padding = 32;
  const innerSize = qrBoxSize - padding * 2;
  const cellSize = innerSize / matrixSize;

  ctx.fillStyle = '#0F172A';
  for (let r = 0; r < matrixSize; r++) {
    for (let c = 0; c < matrixSize; c++) {
      if (matrix[r][c]) {
        const x = qrBoxX + padding + c * cellSize;
        const y = qrBoxY + padding + r * cellSize;
        ctx.fillRect(
          Math.round(x),
          Math.round(y),
          Math.ceil(cellSize),
          Math.ceil(cellSize)
        );
      }
    }
  }

  // Feature 1: Center Logo Emblem with Excavation
  const centerLogoSize = Math.max(50, Math.round(qrBoxSize * 0.16));
  const centerLogoX = qrBoxX + (qrBoxSize - centerLogoSize) / 2;
  const centerLogoY = qrBoxY + (qrBoxSize - centerLogoSize) / 2;

  // White excavate cutout
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.roundRect(
    centerLogoX - 6,
    centerLogoY - 6,
    centerLogoSize + 12,
    centerLogoSize + 12,
    12
  );
  ctx.fill();
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner Brand Badge
  ctx.fillStyle = '#EA580C';
  ctx.beginPath();
  ctx.roundRect(centerLogoX, centerLogoY, centerLogoSize, centerLogoSize, 10);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `bold ${Math.round(centerLogoSize * 0.55)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'D',
    centerLogoX + centerLogoSize / 2,
    centerLogoY + centerLogoSize / 2 + 1
  );
  ctx.textBaseline = 'alphabetic';

  // Spacing & Tag Pill (Bug 3: Generous vertical gap-5 / gap-6)
  let curY = qrBoxY + qrBoxSize + 55;
  if (label) {
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#EA580C';
    ctx.fillText(label.toUpperCase(), width / 2, curY);
    curY += 50;
  }

  // DIGIPIN display (High Legibility)
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 46px monospace';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '4px';
  ctx.fillText(digipin, width / 2, curY);
  ctx.letterSpacing = '0px';
  curY += 45;

  // Unit / Floor
  if (unit) {
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText(unit, width / 2, curY);
    curY += 45;
  }

  // Bottom Scan Instructions (Legible high-contrast text)
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(
    'Scan with any mobile camera for doorstep navigation',
    width / 2,
    height - 90
  );

  ctx.font = 'bold 14px monospace';
  ctx.fillStyle = '#64748B';
  ctx.fillText('POWERED BY DIGIPIN', width / 2, height - 55);
}

/**
 * Download high-resolution JPEG file from canvas.
 */
export function downloadCanvasAsJpg(
  canvas: HTMLCanvasElement,
  filename: string
): void {
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename.endsWith('.jpg') ? filename : `${filename}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Share QR image file via Web Share API with fallback.
 */
export async function shareCanvasBadge(
  canvas: HTMLCanvasElement,
  data: { title: string; text: string; url: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }

        const file = new File([blob], 'digiroute-qr-badge.jpg', {
          type: 'image/jpeg',
        });

        if (
          typeof navigator !== 'undefined' &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          try {
            await navigator.share({
              files: [file],
              title: data.title,
              text: data.text,
              url: data.url,
            });
            resolve(true);
            return;
          } catch {
            // User cancelled or share aborted
            resolve(false);
            return;
          }
        }

        // Fallback to text share
        if (typeof navigator !== 'undefined' && navigator.share) {
          try {
            await navigator.share({
              title: data.title,
              text: data.text,
              url: data.url,
            });
            resolve(true);
            return;
          } catch {
            resolve(false);
            return;
          }
        }

        // Final fallback: trigger download
        downloadCanvasAsJpg(canvas, 'digiroute-qr-badge.jpg');
        resolve(true);
      },
      'image/jpeg',
      0.95
    );
  });
}
