/**
 * Fast queue-based 4-way flood fill algorithm for HTML5 Canvas.
 */

export function hexToRgba(hex: string): [number, number, number, number] {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  if (c.length === 6) {
    c += 'ff';
  }
  const num = parseInt(c, 16);
  return [
    (num >> 24) & 255,
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
  ];
}

export function floodFill(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillHex: string
) {
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  const targetX = Math.floor(startX);
  const targetY = Math.floor(startY);

  if (targetX < 0 || targetX >= width || targetY < 0 || targetY >= height) {
    return;
  }

  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  const targetOffset = (targetY * width + targetX) * 4;
  const startR = data[targetOffset];
  const startG = data[targetOffset + 1];
  const startB = data[targetOffset + 2];
  const startA = data[targetOffset + 3];

  const fillRgba = hexToRgba(fillHex);
  const [fillR, fillG, fillB, fillA] = fillRgba;

  // Don't fill if color is identical
  if (
    startR === fillR &&
    startG === fillG &&
    startB === fillB &&
    startA === fillA
  ) {
    return;
  }

  function colorMatch(offset: number): boolean {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const a = data[offset + 3];

    // Simple distance tolerance to handle anti-aliasing smoothly
    const diff =
      Math.abs(r - startR) +
      Math.abs(g - startG) +
      Math.abs(b - startB) +
      Math.abs(a - startA);

    return diff < 60;
  }

  // Queue storage (flat Uint32Array or array for performance)
  const queue: number[] = [targetX, targetY];
  const visited = new Uint8Array(width * height);

  visited[targetY * width + targetX] = 1;

  while (queue.length > 0) {
    const y = queue.pop()!;
    const x = queue.pop()!;

    const idx = y * width + x;
    const offset = idx * 4;

    data[offset] = fillR;
    data[offset + 1] = fillG;
    data[offset + 2] = fillB;
    data[offset + 3] = fillA;

    // Check 4 neighbors
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ];

    for (let i = 0; i < 4; i++) {
      const [nx, ny] = neighbors[i];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          const nOffset = nIdx * 4;
          if (colorMatch(nOffset)) {
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  ctx.putImageData(imgData, 0, 0);
}
