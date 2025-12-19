import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";

export default function Whiteboard() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const lastPointRef = useRef(null);


  const [isDrawing, setIsDrawing] = useState(false);
  const [lineWidth, setLineWidth] = useState(3);

  // Setup canvas size + context once
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    // Make it look crisp on HiDPI screens
    const dpr = window.devicePixelRatio || 1;

    // Set CSS size
    const cssWidth = 1000;
    const cssHeight = 600;
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    // Set actual pixel size
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    ctx.scale(dpr, dpr);

    // Drawing settings
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = lineWidth;

    // Fill background white
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, cssWidth, cssHeight);

    ctxRef.current = ctx;
  }, []);

  // Update line width when slider changes
  useEffect(() => {
    if (ctxRef.current) ctxRef.current.lineWidth = lineWidth;
  }, [lineWidth]);

  function getPos(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e) {
  const ctx = ctxRef.current;
  if (!ctx) return;

  const p = getPos(e);
  lastPointRef.current = p;

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);

  setIsDrawing(true);
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

  // Smooth line: draw a curve to the midpoint
  const mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };

  ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
  ctx.stroke();

  lastPointRef.current = p;
}

function stopDrawing() {
  const ctx = ctxRef.current;
  if (!ctx) return;

  ctx.closePath();
  lastPointRef.current = null;
  setIsDrawing(false);
}


  function clearBoard() {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, rect.width, rect.height);
  }

  function exportPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "whiteboard.png";
    a.click();
  }

  function exportPDF() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imgData = canvas.toDataURL("image/png");

    // A4 landscape
    const pdf = new jsPDF("l", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Keep aspect ratio
    const img = new Image();
    img.onload = () => {
      const imgWidth = img.width;
      const imgHeight = img.height;
      const scale = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

      const w = imgWidth * scale;
      const h = imgHeight * scale;

      const x = (pageWidth - w) / 2;
      const y = (pageHeight - h) / 2;

      pdf.addImage(imgData, "PNG", x, y, w, h);
      pdf.save("whiteboard.pdf");
    };
    img.src = imgData;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={clearBoard}>Clear</button>
        <button onClick={exportPNG}>Export PNG</button>
        <button onClick={exportPDF}>Export PDF</button>

        <label style={{ marginLeft: 16 }}>
          Pen size: {lineWidth}
          <input
            type="range"
            min="1"
            max="12"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={{ marginLeft: 8 }}
          />
        </label>
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
