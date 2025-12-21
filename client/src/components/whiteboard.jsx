import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";

function fillWhite(ctx, w, h) {
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function drawStroke(ctx, stroke) {
  const pts = stroke.points || [];
  if (pts.length < 1) return;

  ctx.save();

if (stroke.isEraser) {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "#ffffff";
} else {
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = stroke.color || "#000000";
}


  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const cur = pts[i];
    const mid = { x: (prev.x + cur.x) / 2, y: (prev.y + cur.y) / 2 };
    ctx.quadraticCurveTo(prev.x, prev.y, mid.x, mid.y);
  }

  ctx.stroke();
  ctx.closePath();
  ctx.restore();
}

function redrawAll(ctx, strokes, w, h) {
  fillWhite(ctx, w, h);
  for (const s of strokes) drawStroke(ctx, s);
}

export default function Whiteboard({ initialStrokes = [], onChange }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  const strokesRef = useRef([]);
  const redoRef = useRef([]); // redo stack
  const beforeClearRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const lastPointRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(4);
  const [color, setColor] = useState("#000000");
  const [tool, setTool] = useState("pen"); // "pen" | "eraser"

  const W = 1000;
  const H = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);

    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    strokesRef.current = Array.isArray(initialStrokes) ? initialStrokes : [];
    redoRef.current = [];
    redrawAll(ctx, strokesRef.current, W, H);
  }, []);

  // When board is loaded from server, replace strokes + clear redo
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    strokesRef.current = Array.isArray(initialStrokes) ? initialStrokes : [];
    redoRef.current = [];
    redrawAll(ctx, strokesRef.current, W, H);
  }, [initialStrokes]);

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDrawing(e) {
    const ctx = ctxRef.current;
    if (!ctx) return;

    const p = getPos(e);
    setIsDrawing(true);

    // Starting a new stroke clears redo history (standard behavior)
    redoRef.current = [];

    const stroke = {
      width: lineWidth,
      color,
      isEraser: tool === "eraser",
      points: [p],
    };

    currentStrokeRef.current = stroke;
    lastPointRef.current = p;

    // Start drawing incrementally
    drawStroke(ctx, stroke);
  }

  function draw(e) {
    if (!isDrawing) return;
    const ctx = ctxRef.current;
    if (!ctx) return;

    const p = getPos(e);
    const last = lastPointRef.current;
    if (!last) {
      lastPointRef.current = p;
      return;
    }

    // add point then draw incrementally by re-drawing only current stroke segment
    const stroke = currentStrokeRef.current;
    stroke.points.push(p);

    // Draw only the latest part smoothly by drawing full stroke (still cheap for single stroke)
    // (Avoids needing complex segment-by-segment state.)
    // For long strokes this is still fine; if needed we can optimize later.
    drawStroke(ctx, stroke);

    lastPointRef.current = p;
  }

  function stopDrawing() {
    if (!isDrawing) return;
    setIsDrawing(false);

    const stroke = currentStrokeRef.current;
    if (stroke && stroke.points.length > 0) {
      strokesRef.current = [...strokesRef.current, stroke];
      onChange?.(strokesRef.current);
    }

    currentStrokeRef.current = null;
    lastPointRef.current = null;
  }

  function clearBoard() {
    const ctx = ctxRef.current;
    if (!ctx) return;

    beforeClearRef.current = strokesRef.current;


    fillWhite(ctx, W, H);
    strokesRef.current = [];
    redoRef.current = [];
    currentStrokeRef.current = null;
    lastPointRef.current = null;

    onChange?.(strokesRef.current);
  }

  function undo() {
    const ctx = ctxRef.current;
    if (!ctx) return;

      if (strokesRef.current.length === 0 && beforeClearRef.current?.length) {
    strokesRef.current = beforeClearRef.current;
    beforeClearRef.current = null;
    redrawAll(ctx, strokesRef.current, W, H);
    onChange?.(strokesRef.current);
    return;
  }

    const strokes = strokesRef.current;
    if (strokes.length === 0) return;

    const last = strokes[strokes.length - 1];
    redoRef.current = [...redoRef.current, last];
    strokesRef.current = strokes.slice(0, -1);

    redrawAll(ctx, strokesRef.current, W, H);
    onChange?.(strokesRef.current);
  }

function redo() {
  const ctx = ctxRef.current;
  if (!ctx) return;

  const redoStack = redoRef.current;
  if (redoStack.length === 0) return;

  const stroke = redoStack[redoStack.length - 1];
  redoRef.current = redoStack.slice(0, -1);

  strokesRef.current = [...strokesRef.current, stroke];

  // ✅ reliable: rebuild canvas from strokes
  redrawAll(ctx, strokesRef.current, W, H);

  onChange?.(strokesRef.current);
}

  function exportPNG() {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "whiteboard.png";
    a.click();
  }

  function exportPDF() {
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const img = new Image();
    img.onload = () => {
      const scale = Math.min(pageWidth / img.width, pageHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (pageWidth - w) / 2;
      const y = (pageHeight - h) / 2;
      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save("whiteboard.pdf");
    };
    img.src = imgData;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <button onClick={undo}>Undo</button>
        <button onClick={clearBoard}>Clear</button>

        <button
          onClick={() => setTool("pen")}
          style={{ fontWeight: tool === "pen" ? "bold" : "normal" }}
        >
          Pen
        </button>

        <button
          onClick={() => setTool("eraser")}
          style={{ fontWeight: tool === "eraser" ? "bold" : "normal" }}
        >
          Eraser
        </button>

        <label style={{ marginLeft: 8 }}>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            disabled={tool === "eraser"}
            style={{ marginLeft: 8 }}
          />
        </label>

        <label style={{ marginLeft: 8 }}>
          Size: {lineWidth}
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </label>

        <button onClick={exportPNG} style={{ marginLeft: "auto" }}>
          Export PNG
        </button>
        <button onClick={exportPDF}>Export PDF</button>
      </div>

      <div style={{ border: "2px solid #222", borderRadius: 8, width: "fit-content" }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>
    </div>
  );
}
