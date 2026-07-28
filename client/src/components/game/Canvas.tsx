import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useGameStore } from '../../store/useGameStore';
import CanvasToolbar, { type Tool } from './CanvasToolbar';
import { floodFill } from '../../utils/floodFill';
import type { DrawEvent } from '@skribl/types';
import './Canvas.css';

const LOGICAL_WIDTH = 800;
const LOGICAL_HEIGHT = 600;
const MAX_HISTORY = 25;

export function Canvas() {
  const { socket } = useSocket();
  const { gameState, roomCode } = useGameStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState<string>('#000000');
  const [size, setSize] = useState<number>(6);
  const [history, setHistory] = useState<ImageData[]>([]);

  const isDrawingRef = useRef(false);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Check if current client is the active drawer
  const isDrawer =
    Boolean(gameState) &&
    gameState?.currentPlayerID === socket.id &&
    gameState?.status === 'playing';

  // Save snapshot to history stack
  const saveSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const snapshot = ctx.getImageData(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    setHistory(prev => [...prev.slice(-MAX_HISTORY + 1), snapshot]);
  }, []);

  // Clear canvas to solid white
  const clearLocalCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }, []);

  // Draw line segment on 2D context
  const drawSegment = useCallback(
    (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      strokeColor: string,
      strokeSize: number,
      strokeTool: Tool = 'pencil'
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);

      if (strokeTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
      } else {
        ctx.strokeStyle = strokeColor;
      }

      ctx.lineWidth = strokeSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    },
    []
  );

  // Initial canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = LOGICAL_WIDTH;
    canvas.height = LOGICAL_HEIGHT;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
  }, []);

  // Socket listener for incoming draw events from other drawer
  useEffect(() => {
    function handleDraw(data: DrawEvent) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (data.tool === 'fill') {
        floodFill(ctx, data.x0, data.y0, data.color);
      } else {
        drawSegment(
          data.x0,
          data.y0,
          data.x1,
          data.y1,
          data.color,
          data.size,
          (data.tool as Tool) ?? 'pencil'
        );
      }
    }

    function handleDrawHistory(events: DrawEvent[]) {
      clearLocalCanvas();
      events.forEach(evt => handleDraw(evt));
    }

    function handleClearCanvas() {
      clearLocalCanvas();
      setHistory([]);
    }

    socket.on('draw', handleDraw);
    socket.on('drawHistory', handleDrawHistory);
    socket.on('clearCanvas', handleClearCanvas);

    return () => {
      socket.off('draw', handleDraw);
      socket.off('drawHistory', handleDrawHistory);
      socket.off('clearCanvas', handleClearCanvas);
    };
  }, [socket, drawSegment, clearLocalCanvas]);

  // Convert client coordinates (mouse/touch) to internal 800x600 canvas coordinates
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = LOGICAL_WIDTH / rect.width;
    const scaleY = LOGICAL_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  // Start stroke or fill
  const handleStart = (clientX: number, clientY: number) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCanvasCoords(clientX, clientY);

    if (tool === 'fill') {
      saveSnapshot();
      floodFill(ctx, pos.x, pos.y, color);
      socket.emit('draw', {
        code: roomCode,
        x0: pos.x,
        y0: pos.y,
        x1: pos.x,
        y1: pos.y,
        color,
        size,
        tool: 'fill',
      });
      return;
    }

    saveSnapshot();
    isDrawingRef.current = true;
    lastPosRef.current = pos;

    // Draw single dot on click
    drawSegment(pos.x, pos.y, pos.x, pos.y, color, size, tool);
    socket.emit('draw', {
      code: roomCode,
      x0: pos.x,
      y0: pos.y,
      x1: pos.x,
      y1: pos.y,
      color,
      size,
      tool,
    });
  };

  // Move stroke
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawer || !isDrawingRef.current || !lastPosRef.current) return;

    const currentPos = getCanvasCoords(clientX, clientY);
    const lastPos = lastPosRef.current;

    // Only skip if mouse didn't move at all
    if (currentPos.x === lastPos.x && currentPos.y === lastPos.y) return;

    drawSegment(lastPos.x, lastPos.y, currentPos.x, currentPos.y, color, size, tool);

    socket.emit('draw', {
      code: roomCode,
      x0: lastPos.x,
      y0: lastPos.y,
      x1: currentPos.x,
      y1: currentPos.y,
      color,
      size,
      tool,
    });

    lastPosRef.current = currentPos;
  };

  // End stroke
  const handleEnd = () => {
    if (!isDrawer) return;
    isDrawingRef.current = false;
    lastPosRef.current = null;
  };

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Only left click
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  const handleMouseLeave = () => {
    handleEnd();
  };

  // Touch handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Action handlers
  const handleUndo = () => {
    if (!isDrawer || history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    setHistory(prev => prev.slice(0, -1));

    // Note: Re-clearing & sending update if needed, or simple local undo
  };

  const handleClear = () => {
    if (!isDrawer) return;
    saveSnapshot();
    clearLocalCanvas();
    socket.emit('clearboard', { code: roomCode });
  };

  // Ctrl+Z Keyboard Listener for Undo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isDrawer) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawer, history]);

  return (
    <div className="canvas-container">
      <div className={`canvas-wrapper ${!isDrawer ? 'disabled' : ''}`}>
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          style={{
            cursor: !isDrawer
              ? 'not-allowed'
              : tool === 'pencil'
              ? 'crosshair'
              : tool === 'eraser'
              ? 'cell'
              : 'pointer',
          }}
        />

        {!isDrawer && (
          <div className="canvas-overlay">
            <span className="canvas-overlay__badge">
              {gameState?.status === 'choosing'
                ? 'Drawer is choosing a word...'
                : 'Spectating (Guess in chat!)'}
            </span>
          </div>
        )}
      </div>

      {isDrawer && (
        <CanvasToolbar
          tool={tool}
          setTool={setTool}
          color={color}
          setColor={setColor}
          size={size}
          setSize={setSize}
          onUndo={handleUndo}
          onClear={handleClear}
          canUndo={history.length > 0}
          disabled={!isDrawer}
        />
      )}
    </div>
  );
}

export default Canvas;
