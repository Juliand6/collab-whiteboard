import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Whiteboard from "../components/whiteboard";
import { createApi } from "../api";
import { clearToken, getToken } from "../auth";
import { io } from "socket.io-client";


export default function BoardEditor() {
  const { id } = useParams();
  const nav = useNavigate();

  const token = getToken();
  const api = useMemo(() => createApi(token), [token]);

  const [title, setTitle] = useState("");
  const [strokes, setStrokes] = useState([]);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const [externalCommand, setExternalCommand] = useState(null);
  const socketRef = useRef(null);


  async function loadBoard() {
    setErr("");
    try {
      const res = await api.get(`/whiteboards/${id}`);
      setTitle(res.data.title || "Untitled");
      setStrokes(res.data.content?.strokes || []);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
      if (e?.response?.status === 401) {
        clearToken();
        nav("/login");
      }
    }
  }

  useEffect(() => {
    if (!token) nav("/login");
    else loadBoard();
  }, [id]);

  async function saveBoard() {
    setSaving(true);
    setErr("");
    try {
      await api.put(`/whiteboards/${id}`, {
        title,
        content: { strokes },
      });
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
  if (!token) return;

  const socket = io(import.meta.env.VITE_API_URL || "http://localhost:3001");
  socketRef.current = socket;

  socket.emit("board:join", { boardId: id });

  socket.on("stroke:add", ({ stroke }) => {
    // tell Whiteboard to apply a remote stroke
    setExternalCommand({ type: "addStroke", stroke, at: Date.now() });
  });

  socket.on("board:clear", () => {
    setExternalCommand({ type: "clear", at: Date.now() });
  });


  return () => {
    socket.disconnect();
    socketRef.current = null;
  };
}, [id, token]);


  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
        <button onClick={() => nav("/boards")}>← Back</button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ flex: 1 }}
        />
        <button onClick={saveBoard} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}

      <Whiteboard
  initialStrokes={strokes}
  onChange={(newStrokes) => setStrokes(newStrokes)}
  externalCommand={externalCommand}
  onStrokeEnd={(stroke) => {
    const s = socketRef.current;
    if (s) s.emit("stroke:add", { boardId: id, stroke });
  }}
  onClear={() => {
    const s = socketRef.current;
    if (s) s.emit("board:clear", { boardId: id });
  }}
/>
    </div>
  );
}
