import { useRef, useEffect } from 'react';

/**
 * Canvas component — placeholder for Phase 5.
 * Fills its parent container and listens for clearCanvas.
 */
export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const parent = canvas!.parentElement;
      if (!parent) return;
      canvas!.width = parent.clientWidth;
      canvas!.height = parent.clientHeight;

      // Fill with white background
      const ctx = canvas!.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas!.width, canvas!.height);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: '100%',
        borderRadius: 'var(--radius-lg)',
        cursor: 'crosshair',
      }}
    />
  );
}

export default Canvas;
